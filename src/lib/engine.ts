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
  ActionType,
} from "@/types";
import {
  rules,
  getMitigations,
  getBlockerRules,
  getInfraRules,
  getGuestRules,
} from "@/data/kb-loader";
import { getSKU } from "@/data/skus";

// Build rule indices for O(1) lookup by action type
const rulesByAction = new Map<ActionType, Rule[]>();
const blockersByAction = new Map<ActionType, Rule[]>();
const infraRulesByAction = new Map<ActionType, Rule[]>();
const guestRulesByAction = new Map<ActionType, Rule[]>();

// Initialize indices at module load
function initializeRuleIndices() {
  const blockers = getBlockerRules();
  const infraRules = getInfraRules();
  const guestRules = getGuestRules();

  // Index blockers
  for (const rule of blockers) {
    for (const action of rule.actions) {
      const actionType = action as ActionType;
      if (!blockersByAction.has(actionType)) {
        blockersByAction.set(actionType, []);
      }
      blockersByAction.get(actionType)!.push(rule);
    }
  }

  // Index infra rules
  for (const rule of infraRules) {
    for (const action of rule.actions) {
      const actionType = action as ActionType;
      if (!infraRulesByAction.has(actionType)) {
        infraRulesByAction.set(actionType, []);
      }
      infraRulesByAction.get(actionType)!.push(rule);
    }
  }

  // Index guest rules
  for (const rule of guestRules) {
    for (const action of rule.actions) {
      const actionType = action as ActionType;
      if (!guestRulesByAction.has(actionType)) {
        guestRulesByAction.set(actionType, []);
      }
      guestRulesByAction.get(actionType)!.push(rule);
    }
  }

  // Index all rules
  for (const rule of rules) {
    for (const action of rule.actions) {
      const actionType = action as ActionType;
      if (!rulesByAction.has(actionType)) {
        rulesByAction.set(actionType, []);
      }
      rulesByAction.get(actionType)!.push(rule);
    }
  }
}

// Initialize indices once at module load
initializeRuleIndices();

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
): Record<string, unknown> | { error: string } {
  const currentSku = getSKU(context.vm.sku);

  // Validate current SKU exists
  if (!currentSku) {
    return { error: `Invalid or unsupported VM SKU: ${context.vm.sku}` };
  }

  const targetSku = action.targetSku ? getSKU(action.targetSku) : undefined;

  // Validate target SKU if specified
  if (action.targetSku && !targetSku) {
    return { error: `Invalid or unsupported target VM SKU: ${action.targetSku}` };
  }

  const dataDisks = context.disks.filter((d) => d.role === "data");
  const targetDisk = action.targetLun !== undefined
    ? context.disks.find((d) => d.lun === action.targetLun)
    : undefined;

  return {
    vm: {
      ...context.vm,
      family: currentSku.family,
      processor: currentSku.processor,
      hasTempDisk: currentSku.tempDiskGB > 0,
      tempDiskSize: currentSku.tempDiskGB,
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
    case "nin":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    case "notExists":
      return fieldValue === undefined || fieldValue === null;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue > compareValue
      );
    case "gte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue >= compareValue
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue < compareValue
      );
    case "lte":
      return (
        typeof fieldValue === "number" &&
        typeof compareValue === "number" &&
        fieldValue <= compareValue
      );
    case "matches":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        new RegExp(compareValue).test(fieldValue)
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

  // Check for validation errors
  if ('error' in evalContext && typeof evalContext.error === 'string') {
    return {
      blocked: true,
      blockerReason: evalContext.error,
      infra: {
        reboot: "none",
        downtime: "none",
        reason: "Cannot evaluate - invalid configuration.",
      },
      guest: {
        risk: "low",
        reason: "Cannot evaluate - invalid configuration.",
        affectedComponents: [],
      },
      mitigations: [],
      explanation: `**ERROR:** ${evalContext.error}`,
      matchedRules: [],
    };
  }

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

  // Check blockers first - use indexed lookup for O(1) performance
  const relevantBlockers = blockersByAction.get(action.type) || [];
  for (const blocker of relevantBlockers) {
    if (ruleMatches(blocker, action, evalContext)) {
      return {
        blocked: true,
        blockerReason: blocker.impact.reason || blocker.description,
        infra: infraImpact,
        guest: guestImpact,
        mitigations: [],
        explanation: `**BLOCKED:** ${blocker.impact.reason || blocker.description}`,
        matchedRules: [blocker.id],
      };
    }
  }

  // Evaluate infra rules - use indexed lookup for O(1) performance
  const relevantInfraRules = infraRulesByAction.get(action.type) || [];
  for (const rule of relevantInfraRules) {
    if (ruleMatches(rule, action, evalContext)) {
      matchedRules.push(rule);

      // Aggregate impact (take highest severity)
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

      // Collect mitigations
      rule.mitigations.forEach((m) => mitigationIds.add(m));
    }
  }

  // Evaluate guest rules - use indexed lookup for O(1) performance
  const relevantGuestRules = guestRulesByAction.get(action.type) || [];
  for (const rule of relevantGuestRules) {
    if (ruleMatches(rule, action, evalContext)) {
      matchedRules.push(rule);

      // Aggregate impact (take highest severity)
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

      // Collect mitigations
      rule.mitigations.forEach((m) => mitigationIds.add(m));
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

  // Handle capture with generalize option
  if (actionType === "CaptureVM" && action?.generalize !== undefined) {
    return action.generalize ? "Capture VM (Generalized)" : "Capture VM (Specialized)";
  }

  // Handle restore with type option
  if (actionType === "RestoreVM" && action?.restoreType) {
    const types: Record<string, string> = {
      newVM: "Restore to New VM",
      replaceExisting: "Restore & Replace Existing",
      disksOnly: "Restore Disks Only",
    };
    return types[action.restoreType] || "Restore VM";
  }

  // Handle swap OS disk with source option
  if (actionType === "SwapOSDisk" && action?.swapSource) {
    const sources: Record<string, string> = {
      snapshot: "Swap OS Disk (from Snapshot)",
      disk: "Swap OS Disk (from Disk)",
      backup: "Swap OS Disk (from Backup)",
    };
    return sources[action.swapSource] || "Swap OS Disk";
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
    StopVM: "Stop VM",
    DeallocateVM: "Deallocate VM",
    CaptureVM: "Capture VM",
    AddNIC: "Add Network Interface",
    RemoveNIC: "Remove Network Interface",
    RestoreVM: "Restore VM",
    SwapOSDisk: "Swap OS Disk",
  };
  return names[actionType];
}
