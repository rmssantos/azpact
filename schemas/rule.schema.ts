import { z } from "zod";

// Condition operators
export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "eq",
    "ne",
    "in",
    "nin",
    "exists",
    "notExists",
    "gt",
    "gte",
    "lt",
    "lte",
    "matches",
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
});

// Impact definition
export const ImpactSchema = z.object({
  reboot: z
    .enum(["none", "possible", "likely", "guaranteed"])
    .optional(),
  downtime: z.enum(["none", "low", "medium", "high"]).optional(),
  risk: z
    .enum(["none", "low", "medium", "high", "critical"])
    .optional(),
  networkReset: z.boolean().optional(),
  dataLossRisk: z.boolean().optional(),
  reason: z.string(),
  affectedComponents: z.array(z.string()).optional(),
});

// Source reference for credibility
export const SourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

// Main rule schema (RFC-001 compliant)
export const RuleSchema = z.object({
  // Identity
  id: z.string().regex(/^[a-z0-9-]+$/, "ID must be kebab-case"),
  name: z.string().min(1),
  description: z.string().min(1),

  // Classification (RFC-001: separate type and layer)
  type: z.enum(["rule", "blocker", "override"]).default("rule"),
  layer: z.enum(["infra", "guest"]),

  // Targeting
  actions: z.array(z.string()).min(1),
  conditions: z.array(ConditionSchema).default([]),

  // Override-specific (required if type=override)
  overrideTargets: z.array(z.string()).optional(),

  // Impact
  impact: ImpactSchema,

  // Mitigations
  mitigations: z.array(z.string()).default([]),

  // Metadata
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  sources: z.array(SourceSchema).default([]),
  tags: z.array(z.string()).default([]),

  // Lifecycle
  version: z.string().default("1.0.0"),
  deprecated: z.boolean().default(false),
  deprecatedBy: z.string().optional(),
  deprecatedAt: z.string().optional(),
});

// Validation: override rules must have overrideTargets
export const ValidatedRuleSchema = RuleSchema.refine(
  (rule) => {
    if (rule.type === "override") {
      return (
        rule.overrideTargets !== undefined &&
        rule.overrideTargets.length > 0
      );
    }
    return true;
  },
  {
    message: "Override rules must specify overrideTargets",
    path: ["overrideTargets"],
  }
);

export type Condition = z.infer<typeof ConditionSchema>;
export type Impact = z.infer<typeof ImpactSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Rule = z.infer<typeof RuleSchema>;
