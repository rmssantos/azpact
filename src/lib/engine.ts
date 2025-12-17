import {
  VMContext,
  Action,
  ImpactReport,
  Rule,
  RuleCondition,
  InfraImpact,
  GuestImpact,
  Mitigation,
  RebootLevel,
  DowntimeLevel,
  RiskLevel,
} from "@/types";
import { rules } from "@/data/rules";
import { getMitigations } from "@/data/mitigations";
import { getSKU } from "@/data/skus";

// Priority ordering for impact levels
const rebootPriority: Record<RebootLevel, number> = {
  none: 0,
  possible: 1,
  likely: 2,
  guaranteed: 3,
};

const downtimePriority: Record<DowntimeLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const riskPriority: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// Get a nested value from an object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// Build evaluation context with computed fields
function buildEvalContext(
  context: VMContext,
  action: Action
): Record<string, unknown> {
  const currentSku = getSKU(context.vm.sku);
  const targetSku = action.targetSku ? getSKU(action.targetSku) : undefined;

  const dataDisks = context.disks.filter((d) => d.role === "data");
  const targetDisk = action.targetLun !== undefined
    ? context.disks.find((d) => d.lun === action.targetLun)
    : undefined;

  return {
    vm: {
      ...context.vm,
      family: currentSku?.family,
      processor: currentSku?.processor,
      hasTempDisk: currentSku && currentSku.tempDiskGB > 0,
      tempDiskSize: currentSku?.tempDiskGB,
      running: true, // Assume VM is running unless specified
    },
    os: context.os,
    disks: {
      count: dataDisks.length,
      hasUltraSSD: context.disks.some((d) => d.type === "UltraSSD_LRS"),
      hasLVM: context.disks.some((d) => d.topology === "lvm"),
      hasRAID: context.disks.some((d) =>
        ["raid0", "raid1", "raid5"].includes(d.topology || "")
      ),
    },
    disk: targetDisk
      ? {
          ...targetDisk,
        }
      : undefined,
    targetSku: targetSku
      ? {
          ...targetSku,
          requiresDeallocation: targetSku.family !== currentSku?.family,
        }
      : undefined,
    action,
  };
}

// Evaluate a single condition against the context
function evaluateCondition(
  condition: RuleCondition,
  evalContext: Record<string, unknown>
): boolean {
  let fieldValue = getNestedValue(evalContext, condition.field);
  let compareValue = condition.value;

  // Handle dynamic references (e.g., "targetSku.maxDataDisks")
  if (typeof compareValue === "string" && compareValue.includes(".")) {
    const resolved = getNestedValue(evalContext, compareValue);
    if (resolved !== undefined) {
      compareValue = resolved;
    }
  }

  switch (condition.operator) {
    case "eq":
      return fieldValue === compareValue;
    case "ne":
      return fieldValue !== compareValue;
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "notIn":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "exists":
      return compareValue ? fieldValue !== undefined : fieldValue === undefined;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue > compareValue
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue < compareValue
      );
    default:
      return false;
  }
}

// Check if a rule matches the current context
function ruleMatches(
  rule: Rule,
  action: Action,
  evalContext: Record<string, unknown>
): boolean {
  // Check if rule applies to this action
  if (!rule.actions.includes(action.type)) {
    return false;
  }

  // Check all conditions
  for (const condition of rule.conditions) {
    if (!evaluateCondition(condition, evalContext)) {
      return false;
    }
  }

  return true;
}

// Generate human-readable explanation
function generateExplanation(
  matchedRules: Rule[],
  infraImpact: InfraImpact,
  guestImpact: GuestImpact
): string {
  const parts: string[] = [];

  // Infrastructure summary
  if (infraImpact.reboot !== "none") {
    parts.push(
      `**Infrastructure Impact:** ${infraImpact.reboot} reboot with ${infraImpact.downtime} downtime. ${infraImpact.reason}`
    );
  }

  // Guest OS summary
  if (guestImpact.risk !== "low") {
    parts.push(
      `**Guest OS Impact:** ${guestImpact.risk} risk. ${guestImpact.reason}`
    );
    if (guestImpact.affectedComponents.length > 0) {
      parts.push(
        `Affected components: ${guestImpact.affectedComponents.join(", ")}`
      );
    }
  }

  // Rule details
  if (matchedRules.length > 0) {
    parts.push("\n**Matched Rules:**");
    for (const rule of matchedRules) {
      parts.push(`- ${rule.name}: ${rule.description}`);
    }
  }

  return parts.join("\n\n");
}

// Main evaluation function
export function evaluateImpact(
  context: VMContext,
  action: Action
): ImpactReport {
  const evalContext = buildEvalContext(context, action);
  const matchedRules: Rule[] = [];
  const mitigationIds = new Set<string>();

  // Initial impact values
  let infraImpact: InfraImpact = {
    reboot: "none",
    downtime: "none",
    reason: "No infrastructure impact detected.",
  };

  let guestImpact: GuestImpact = {
    risk: "low",
    reason: "No guest OS impact detected.",
    affectedComponents: [],
  };

  // Check blockers first
  const blockers = rules.filter((r) => r.category === "blocker");
  for (const blocker of blockers) {
    if (ruleMatches(blocker, action, evalContext)) {
      return {
        blocked: true,
        blockerReason: blocker.impact?.reason || blocker.description,
        infra: infraImpact,
        guest: guestImpact,
        mitigations: [],
        explanation: `**BLOCKED:** ${blocker.impact?.reason || blocker.description}`,
        matchedRules: [blocker.id],
      };
    }
  }

  // Evaluate infra rules
  const infraRules = rules.filter((r) => r.category === "infra");
  for (const rule of infraRules) {
    if (ruleMatches(rule, action, evalContext)) {
      matchedRules.push(rule);

      // Aggregate impact (take highest severity)
      if (rule.impact) {
        if (
          rule.impact.reboot &&
          rebootPriority[rule.impact.reboot] > rebootPriority[infraImpact.reboot]
        ) {
          infraImpact.reboot = rule.impact.reboot;
          infraImpact.reason = rule.impact.reason;
        }
        if (
          rule.impact.downtime &&
          downtimePriority[rule.impact.downtime] >
            downtimePriority[infraImpact.downtime]
        ) {
          infraImpact.downtime = rule.impact.downtime;
        }
      }

      // Collect mitigations
      if (rule.mitigations) {
        rule.mitigations.forEach((m) => mitigationIds.add(m));
      }
    }
  }

  // Evaluate guest rules
  const guestRules = rules.filter((r) => r.category === "guest");
  for (const rule of guestRules) {
    if (ruleMatches(rule, action, evalContext)) {
      matchedRules.push(rule);

      // Aggregate impact (take highest severity)
      if (rule.impact) {
        if (
          rule.impact.risk &&
          riskPriority[rule.impact.risk] > riskPriority[guestImpact.risk]
        ) {
          guestImpact.risk = rule.impact.risk;
          guestImpact.reason = rule.impact.reason;
        }
        if (rule.impact.affectedComponents) {
          guestImpact.affectedComponents = [
            ...new Set([
              ...guestImpact.affectedComponents,
              ...rule.impact.affectedComponents,
            ]),
          ];
        }
      }

      // Collect mitigations
      if (rule.mitigations) {
        rule.mitigations.forEach((m) => mitigationIds.add(m));
      }
    }
  }

  // Get full mitigation objects
  const mitigations: Mitigation[] = getMitigations(Array.from(mitigationIds));

  // Sort mitigations: required first
  mitigations.sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));

  // Generate explanation
  const explanation = generateExplanation(matchedRules, infraImpact, guestImpact);

  return {
    blocked: false,
    infra: infraImpact,
    guest: guestImpact,
    mitigations,
    explanation,
    matchedRules: matchedRules.map((r) => r.id),
  };
}

// Utility to get action display name
export function getActionDisplayName(actionType: Action["type"], action?: Action): string {
  // Handle encryption with specific operation
  if (actionType === "EnableEncryption" && action?.encryptionOperation) {
    const operation = action.encryptionOperation === "enable" ? "Enable" : "Disable";
    const target = action.encryptionTarget === "all" ? "All Disks" : "OS Disk";
    return `${operation} Disk Encryption (${target})`;
  }

  const names: Record<Action["type"], string> = {
    ResizeVM: "Resize VM",
    ResizeOSDisk: "Resize OS Disk",
    ResizeDataDisk: "Resize Data Disk",
    DetachDisk: "Detach Disk",
    RedeployVM: "Redeploy VM",
    EnableEncryption: "Disk Encryption",
    ChangeZone: "Change Availability Zone",
    CrossRegionMove: "Cross-Region Move",
  };
  return names[actionType];
}
