/**
 * Knowledge Base Loader
 * Loads compiled rules and mitigations from JSON files generated at build time.
 */

import { Rule, Mitigation } from "@/types";
import { rulesArraySchema, mitigationsArraySchema } from "@/schemas/kb.schema";
import rulesJson from "@/../kb/.compiled/rules.json";
import mitigationsJson from "@/../kb/.compiled/mitigations.json";

// Validate and parse KB files with runtime type checking
function loadRules(): Rule[] {
  try {
    return rulesArraySchema.parse(rulesJson);
  } catch (error) {
    console.error("Failed to validate rules.json:", error);
    throw new Error(`Invalid rules.json format. Please check the knowledge base files.`);
  }
}

function loadMitigations(): Mitigation[] {
  try {
    return mitigationsArraySchema.parse(mitigationsJson);
  } catch (error) {
    console.error("Failed to validate mitigations.json:", error);
    throw new Error(`Invalid mitigations.json format. Please check the knowledge base files.`);
  }
}

// Load and validate KB files at module initialization
export const rules: Rule[] = loadRules();
export const mitigations: Mitigation[] = loadMitigations();

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
