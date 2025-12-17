/**
 * Knowledge Base Loader
 * Loads compiled rules and mitigations from JSON files generated at build time.
 */

import { Rule, Mitigation } from "@/types";
import rulesJson from "@/../kb/.compiled/rules.json";
import mitigationsJson from "@/../kb/.compiled/mitigations.json";

// Cast imported JSON to proper types
export const rules: Rule[] = rulesJson as Rule[];
export const mitigations: Mitigation[] = mitigationsJson as Mitigation[];

// Create a map for O(1) mitigation lookup
const mitigationMap = new Map<string, Mitigation>(
  mitigations.map((m) => [m.id, m])
);

/**
 * Get mitigations by their IDs
 */
export function getMitigations(ids: string[]): Mitigation[] {
  return ids
    .map((id) => mitigationMap.get(id))
    .filter((m): m is Mitigation => m !== undefined);
}

/**
 * Get rules by action type
 */
export function getRulesByAction(action: string): Rule[] {
  return rules.filter((r) => r.actions.includes(action as Rule["actions"][number]));
}

/**
 * Get rules by type (rule, blocker, override)
 */
export function getRulesByType(type: Rule["type"]): Rule[] {
  return rules.filter((r) => r.type === type);
}

/**
 * Get rules by layer (infra, guest)
 */
export function getRulesByLayer(layer: Rule["layer"]): Rule[] {
  return rules.filter((r) => r.layer === layer);
}

/**
 * Get blocker rules only
 */
export function getBlockerRules(): Rule[] {
  return rules.filter((r) => r.type === "blocker");
}

/**
 * Get infra rules (non-blocker rules with layer=infra)
 */
export function getInfraRules(): Rule[] {
  return rules.filter((r) => r.type === "rule" && r.layer === "infra");
}

/**
 * Get guest rules (non-blocker rules with layer=guest)
 */
export function getGuestRules(): Rule[] {
  return rules.filter((r) => r.type === "rule" && r.layer === "guest");
}
