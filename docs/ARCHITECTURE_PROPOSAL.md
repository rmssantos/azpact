# AZpact v2 Architecture Proposal

## Executive Summary

This document proposes migrating AZpact from hardcoded TypeScript scenarios to a **data-driven knowledge base (KB)** with a **deterministic rules engine**. The goal is scalability, contributor-friendliness, and maintainability while preserving the current UI.

### Key Principles

1. **Operation-first UX**: User selects action, then provides context progressively
2. **Deterministic logic**: No AI guessing - explainable, auditable rules
3. **Contributor-friendly**: YAML rules anyone can edit without TypeScript knowledge
4. **Incremental migration**: Convert one operation at a time, keep UI stable
5. **Test-driven**: Golden cases ensure safe community contributions

---

## 1. Repository Structure

```
azpact/
├── src/                          # Next.js application
│   ├── app/                      # App Router pages
│   ├── components/               # React components (unchanged)
│   ├── lib/                      # Application utilities
│   │   └── kb-loader.ts          # KB loading utilities
│   └── types/                    # Shared TypeScript types
│
├── engine/                       # Rules engine (pure TypeScript, no React)
│   ├── index.ts                  # Main engine exports
│   ├── loader.ts                 # Load & validate KB at build time
│   ├── matcher.ts                # Rule matching logic
│   ├── aggregator.ts             # Score aggregation & clamping
│   ├── reporter.ts               # Report generation
│   └── types.ts                  # Engine-specific types
│
├── kb/                           # Knowledge Base (YAML/JSON)
│   ├── rules/                    # Impact rules by operation
│   │   ├── resize-vm/
│   │   │   ├── windows.yaml
│   │   │   ├── linux.yaml
│   │   │   └── family-change.yaml
│   │   ├── redeploy/
│   │   │   └── temp-disk.yaml
│   │   ├── detach-disk/
│   │   │   ├── raw-mount.yaml
│   │   │   ├── lvm.yaml
│   │   │   └── raid.yaml
│   │   ├── resize-disk/
│   │   │   └── os-disk.yaml
│   │   ├── encryption/
│   │   │   └── ade.yaml
│   │   └── zone-move/
│   │       └── zonal.yaml
│   │
│   ├── mitigations.yaml          # All mitigation definitions
│   ├── skus.yaml                 # VM SKU database
│   └── blockers.yaml             # Hard-stop conditions
│
├── schemas/                      # Validation schemas
│   ├── rule.schema.ts            # Zod schema for rules
│   ├── context.schema.ts         # Zod schema for VM context
│   ├── mitigation.schema.ts      # Zod schema for mitigations
│   └── index.ts                  # Schema exports
│
├── cases/                        # Golden test cases
│   ├── resize-vm/
│   │   ├── windows-same-family.json
│   │   ├── linux-cross-family.json
│   │   └── processor-change.json
│   ├── redeploy/
│   │   └── temp-disk-linux.json
│   └── detach-disk/
│       ├── raw-mount.json
│       └── lvm-member.json
│
├── scripts/                      # Build & validation scripts
│   ├── build-kb.ts               # Compile YAML → JSON at build time
│   ├── validate-kb.ts            # Validate all KB files
│   └── generate-types.ts         # Generate types from schemas
│
├── tests/                        # Test suites
│   ├── engine/                   # Engine unit tests
│   ├── cases/                    # Golden case runner
│   │   └── runner.test.ts        # Runs all cases/*.json
│   └── schemas/                  # Schema validation tests
│
└── docs/
    ├── ARCHITECTURE_PROPOSAL.md  # This document
    ├── RULE_AUTHORING.md         # How to write rules
    └── CONTRIBUTING.md           # Contribution guidelines
```

### Why This Separation?

| Layer | Purpose | Who Edits |
|-------|---------|-----------|
| `src/` | UI components, pages | Frontend devs |
| `engine/` | Pure logic, no framework deps | Engine maintainers |
| `kb/` | Rules, mitigations, data | Anyone (YAML knowledge) |
| `schemas/` | Contracts, validation | Schema maintainers |
| `cases/` | Test vectors | Contributors (with every rule change) |

**Benefits:**
- **Scalability**: Add rules without touching TypeScript
- **Testability**: Engine is pure functions, easily unit tested
- **Contributor-friendly**: YAML is readable by non-developers
- **CI-friendly**: Validate KB on every PR

---

## 2. Data Model Design

### 2.1 Context Schema (Operation-First)

```typescript
// schemas/context.schema.ts
import { z } from "zod";

// VM Profile (can be persisted in localStorage)
export const VMProfileSchema = z.object({
  sku: z.string(),                              // e.g., "Standard_D4s_v3"
  generation: z.enum(["Gen1", "Gen2"]),
  zone: z.string().optional(),                  // e.g., "1", "2", "3"
  region: z.string().optional(),                // e.g., "westeurope"
});

export const OSConfigSchema = z.object({
  family: z.enum(["Windows", "Linux"]),
  distro: z.string().optional(),                // e.g., "Ubuntu", "RHEL"
  version: z.string().optional(),               // e.g., "22.04"
});

export const DiskSchema = z.object({
  lun: z.number().optional(),                   // LUN for data disks
  type: z.enum(["os", "data", "temp"]),
  sizeGB: z.number(),
  sku: z.enum(["Standard_LRS", "StandardSSD_LRS", "Premium_LRS", "UltraSSD_LRS"]),
  topology: z.enum(["raw", "lvm", "raid", "dynamic"]).default("raw"),
  isMounted: z.boolean().default(true),
  mountPoint: z.string().optional(),            // e.g., "/data"
  isEncrypted: z.boolean().default(false),
});

export const VMContextSchema = z.object({
  vm: VMProfileSchema,
  os: OSConfigSchema,
  disks: z.array(DiskSchema),
  // Computed/enriched fields (added by engine)
  hasTempDisk: z.boolean().optional(),
  hasLVM: z.boolean().optional(),
  hasRAID: z.boolean().optional(),
});

export type VMContext = z.infer<typeof VMContextSchema>;
```

### 2.2 Action Schema

```typescript
// schemas/action.schema.ts
import { z } from "zod";

export const ActionTypeSchema = z.enum([
  "ResizeVM",
  "ResizeOSDisk",
  "ResizeDataDisk",
  "DetachDisk",
  "RedeployVM",
  "EnableEncryption",
  "DisableEncryption",
  "ChangeZone",
  "CrossRegionMove",
]);

export const ActionSchema = z.object({
  type: ActionTypeSchema,
  // Resize VM
  targetSku: z.string().optional(),
  // Resize Disk
  targetSizeGB: z.number().optional(),
  targetLun: z.number().optional(),
  // Encryption
  encryptionTarget: z.enum(["os", "all"]).optional(),
  // Zone
  targetZone: z.string().optional(),
  isZonalVM: z.boolean().optional(),
  // Region
  targetRegion: z.string().optional(),
});

export type Action = z.infer<typeof ActionSchema>;
```

### 2.3 Rule Schema

```typescript
// schemas/rule.schema.ts
import { z } from "zod";

// Condition operators
export const ConditionSchema = z.object({
  field: z.string(),                            // Dot notation: "os.family", "vm.sku"
  operator: z.enum([
    "eq", "neq",                                // Equality
    "in", "nin",                                // Array membership
    "gt", "gte", "lt", "lte",                   // Numeric comparison
    "contains", "startsWith", "endsWith",       // String operations
    "exists", "notExists",                      // Field presence
    "matches",                                  // Regex
  ]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
});

// Impact scores
export const ImpactScoreSchema = z.object({
  reboot: z.enum(["none", "possible", "likely", "guaranteed"]).optional(),
  downtime: z.enum(["none", "low", "medium", "high"]).optional(),
  guestRisk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
  networkReset: z.boolean().optional(),
  dataLossRisk: z.boolean().optional(),
});

// Rule types
export const RuleTypeSchema = z.enum([
  "rule",      // Additive impact signal
  "blocker",   // Hard stop - operation cannot proceed
  "override",  // Special case that overrides other rules
]);

// Main rule schema
export const RuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),         // kebab-case ID
  name: z.string(),
  description: z.string(),
  type: RuleTypeSchema.default("rule"),

  // Targeting
  actions: z.array(z.string()),                 // Which actions this applies to
  conditions: z.array(ConditionSchema),         // AND logic by default
  conditionLogic: z.enum(["AND", "OR"]).default("AND"),

  // Impact
  impact: ImpactScoreSchema,
  reason: z.string(),                           // Human explanation

  // Mitigations
  mitigations: z.array(z.string()).default([]), // Mitigation IDs

  // Metadata
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  docUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),

  // Versioning
  version: z.string().default("1.0.0"),
  deprecated: z.boolean().default(false),
});

export type Rule = z.infer<typeof RuleSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type ImpactScore = z.infer<typeof ImpactScoreSchema>;
```

### 2.4 Mitigation Schema

```typescript
// schemas/mitigation.schema.ts
import { z } from "zod";

export const MitigationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  description: z.string(),

  // Timing
  phase: z.enum(["before", "during", "after"]).default("before"),

  // Importance
  severity: z.enum(["required", "recommended", "optional"]).default("recommended"),

  // Platform
  platforms: z.array(z.enum(["Windows", "Linux", "all"])).default(["all"]),

  // Documentation
  docUrl: z.string().url().optional(),
  steps: z.array(z.string()).optional(),        // Step-by-step instructions
});

export type Mitigation = z.infer<typeof MitigationSchema>;
```

### 2.5 Report Schema (Engine Output)

```typescript
// schemas/report.schema.ts
import { z } from "zod";

export const TriggeredRuleSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  reason: z.string(),
  impact: ImpactScoreSchema,
  confidence: z.string(),
});

export const ReportSchema = z.object({
  // Summary
  canProceed: z.boolean(),                      // false if any blocker
  blockers: z.array(TriggeredRuleSchema),

  // Aggregated impact
  impact: z.object({
    reboot: z.enum(["none", "possible", "likely", "guaranteed"]),
    downtime: z.enum(["none", "low", "medium", "high"]),
    guestRisk: z.enum(["none", "low", "medium", "high", "critical"]),
    networkReset: z.boolean(),
    dataLossRisk: z.boolean(),
  }),

  // Triggered rules (for explanation)
  triggeredRules: z.array(TriggeredRuleSchema),

  // Mitigations (deduplicated, ordered)
  mitigations: z.object({
    required: z.array(MitigationSchema),
    recommended: z.array(MitigationSchema),
    optional: z.array(MitigationSchema),
  }),

  // Metadata
  generatedAt: z.string().datetime(),
  engineVersion: z.string(),
});

export type Report = z.infer<typeof ReportSchema>;
```

---

## 3. Rules Engine Design

### 3.1 Engine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Engine                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐             │
│  │  Loader  │───▶│  Matcher │───▶│ Aggregator │             │
│  └──────────┘    └──────────┘    └────────────┘             │
│       │               │                │                     │
│       ▼               ▼                ▼                     │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐             │
│  │ Validate │    │  Match   │    │  Aggregate │             │
│  │   Rules  │    │ Against  │    │   Scores   │             │
│  │   (Zod)  │    │ Context  │    │   & Merge  │             │
│  └──────────┘    └──────────┘    └────────────┘             │
│                                        │                     │
│                                        ▼                     │
│                               ┌────────────┐                 │
│                               │  Reporter  │                 │
│                               └────────────┘                 │
│                                        │                     │
│                                        ▼                     │
│                               ┌────────────┐                 │
│                               │   Report   │                 │
│                               └────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Loader Implementation

```typescript
// engine/loader.ts
import { Rule, RuleSchema } from "../schemas/rule.schema";
import { Mitigation, MitigationSchema } from "../schemas/mitigation.schema";

// Pre-compiled KB (generated at build time from YAML)
import compiledRules from "../kb/.compiled/rules.json";
import compiledMitigations from "../kb/.compiled/mitigations.json";

export interface KnowledgeBase {
  rules: Rule[];
  mitigations: Map<string, Mitigation>;
  version: string;
}

let cachedKB: KnowledgeBase | null = null;

export function loadKnowledgeBase(): KnowledgeBase {
  if (cachedKB) return cachedKB;

  // Validate rules
  const rules = compiledRules.map((r: unknown) => {
    const result = RuleSchema.safeParse(r);
    if (!result.success) {
      console.error(`Invalid rule:`, r, result.error);
      throw new Error(`Invalid rule in KB`);
    }
    return result.data;
  });

  // Validate mitigations
  const mitigations = new Map<string, Mitigation>();
  for (const m of compiledMitigations) {
    const result = MitigationSchema.safeParse(m);
    if (!result.success) {
      throw new Error(`Invalid mitigation: ${m.id}`);
    }
    mitigations.set(result.data.id, result.data);
  }

  cachedKB = {
    rules,
    mitigations,
    version: process.env.KB_VERSION || "1.0.0",
  };

  return cachedKB;
}

// Get rules for a specific action
export function getRulesForAction(action: string): Rule[] {
  const kb = loadKnowledgeBase();
  return kb.rules.filter(
    (r) => !r.deprecated && r.actions.includes(action)
  );
}
```

### 3.3 Matcher Implementation

```typescript
// engine/matcher.ts
import { Rule, Condition } from "../schemas/rule.schema";
import { VMContext } from "../schemas/context.schema";
import { Action } from "../schemas/action.schema";

// Get nested value from object using dot notation
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

// Evaluate a single condition
function evaluateCondition(
  condition: Condition,
  context: VMContext,
  action: Action
): boolean {
  // Build combined context for field lookup
  const combined = { ...context, action };
  const value = getNestedValue(combined, condition.field);

  switch (condition.operator) {
    case "eq":
      return value === condition.value;
    case "neq":
      return value !== condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(value as string);
    case "nin":
      return Array.isArray(condition.value) && !condition.value.includes(value as string);
    case "gt":
      return typeof value === "number" && value > (condition.value as number);
    case "gte":
      return typeof value === "number" && value >= (condition.value as number);
    case "lt":
      return typeof value === "number" && value < (condition.value as number);
    case "lte":
      return typeof value === "number" && value <= (condition.value as number);
    case "contains":
      return typeof value === "string" && value.includes(condition.value as string);
    case "startsWith":
      return typeof value === "string" && value.startsWith(condition.value as string);
    case "endsWith":
      return typeof value === "string" && value.endsWith(condition.value as string);
    case "exists":
      return value !== undefined && value !== null;
    case "notExists":
      return value === undefined || value === null;
    case "matches":
      return typeof value === "string" && new RegExp(condition.value as string).test(value);
    default:
      return false;
  }
}

// Check if a rule matches the context
export function matchRule(
  rule: Rule,
  context: VMContext,
  action: Action
): boolean {
  if (rule.conditions.length === 0) return true;

  const results = rule.conditions.map((c) =>
    evaluateCondition(c, context, action)
  );

  return rule.conditionLogic === "OR"
    ? results.some(Boolean)
    : results.every(Boolean);
}

export interface MatchResult {
  rule: Rule;
  matched: boolean;
  conditionResults: { condition: Condition; matched: boolean }[];
}

// Match all rules and return detailed results
export function matchRules(
  rules: Rule[],
  context: VMContext,
  action: Action
): MatchResult[] {
  return rules.map((rule) => ({
    rule,
    matched: matchRule(rule, context, action),
    conditionResults: rule.conditions.map((c) => ({
      condition: c,
      matched: evaluateCondition(c, context, action),
    })),
  }));
}
```

### 3.4 Aggregator Implementation

```typescript
// engine/aggregator.ts
import { Rule, ImpactScore } from "../schemas/rule.schema";
import { Mitigation } from "../schemas/mitigation.schema";
import { loadKnowledgeBase } from "./loader";

// Score mappings for aggregation
const REBOOT_SCORES = { none: 0, possible: 1, likely: 2, guaranteed: 3 };
const DOWNTIME_SCORES = { none: 0, low: 1, medium: 2, high: 3 };
const GUEST_RISK_SCORES = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

type RebootLevel = keyof typeof REBOOT_SCORES;
type DowntimeLevel = keyof typeof DOWNTIME_SCORES;
type GuestRiskLevel = keyof typeof GUEST_RISK_SCORES;

// Reverse mappings
const REBOOT_LABELS: RebootLevel[] = ["none", "possible", "likely", "guaranteed"];
const DOWNTIME_LABELS: DowntimeLevel[] = ["none", "low", "medium", "high"];
const GUEST_RISK_LABELS: GuestRiskLevel[] = ["none", "low", "medium", "high", "critical"];

export interface AggregatedImpact {
  reboot: RebootLevel;
  downtime: DowntimeLevel;
  guestRisk: GuestRiskLevel;
  networkReset: boolean;
  dataLossRisk: boolean;
}

// Aggregate impacts from multiple rules (take maximum)
export function aggregateImpacts(rules: Rule[]): AggregatedImpact {
  let rebootScore = 0;
  let downtimeScore = 0;
  let guestRiskScore = 0;
  let networkReset = false;
  let dataLossRisk = false;

  for (const rule of rules) {
    if (rule.impact.reboot) {
      rebootScore = Math.max(rebootScore, REBOOT_SCORES[rule.impact.reboot]);
    }
    if (rule.impact.downtime) {
      downtimeScore = Math.max(downtimeScore, DOWNTIME_SCORES[rule.impact.downtime]);
    }
    if (rule.impact.guestRisk) {
      guestRiskScore = Math.max(guestRiskScore, GUEST_RISK_SCORES[rule.impact.guestRisk]);
    }
    if (rule.impact.networkReset) {
      networkReset = true;
    }
    if (rule.impact.dataLossRisk) {
      dataLossRisk = true;
    }
  }

  return {
    reboot: REBOOT_LABELS[Math.min(rebootScore, 3)],
    downtime: DOWNTIME_LABELS[Math.min(downtimeScore, 3)],
    guestRisk: GUEST_RISK_LABELS[Math.min(guestRiskScore, 4)],
    networkReset,
    dataLossRisk,
  };
}

// Collect and deduplicate mitigations
export function collectMitigations(
  rules: Rule[]
): { required: Mitigation[]; recommended: Mitigation[]; optional: Mitigation[] } {
  const kb = loadKnowledgeBase();
  const seen = new Set<string>();
  const required: Mitigation[] = [];
  const recommended: Mitigation[] = [];
  const optional: Mitigation[] = [];

  for (const rule of rules) {
    for (const mitigationId of rule.mitigations) {
      if (seen.has(mitigationId)) continue;
      seen.add(mitigationId);

      const mitigation = kb.mitigations.get(mitigationId);
      if (!mitigation) {
        console.warn(`Mitigation not found: ${mitigationId}`);
        continue;
      }

      switch (mitigation.severity) {
        case "required":
          required.push(mitigation);
          break;
        case "recommended":
          recommended.push(mitigation);
          break;
        case "optional":
          optional.push(mitigation);
          break;
      }
    }
  }

  // Sort by ID for stable ordering
  const sortById = (a: Mitigation, b: Mitigation) => a.id.localeCompare(b.id);
  return {
    required: required.sort(sortById),
    recommended: recommended.sort(sortById),
    optional: optional.sort(sortById),
  };
}
```

### 3.5 Reporter Implementation

```typescript
// engine/reporter.ts
import { VMContext } from "../schemas/context.schema";
import { Action } from "../schemas/action.schema";
import { Report } from "../schemas/report.schema";
import { getRulesForAction } from "./loader";
import { matchRules, MatchResult } from "./matcher";
import { aggregateImpacts, collectMitigations } from "./aggregator";

export function generateReport(context: VMContext, action: Action): Report {
  // 1. Get applicable rules
  const rules = getRulesForAction(action.type);

  // 2. Match rules against context
  const matchResults = matchRules(rules, context, action);
  const matchedResults = matchResults.filter((r) => r.matched);

  // 3. Separate by type with precedence: blockers > overrides > rules
  const blockers = matchedResults.filter((r) => r.rule.type === "blocker");
  const overrides = matchedResults.filter((r) => r.rule.type === "override");
  const additive = matchedResults.filter((r) => r.rule.type === "rule");

  // 4. Apply overrides (they replace additive rules with same tags)
  let effectiveRules = additive.map((r) => r.rule);
  for (const override of overrides) {
    const overrideTags = new Set(override.rule.tags);
    effectiveRules = effectiveRules.filter(
      (r) => !r.tags.some((t) => overrideTags.has(t))
    );
    effectiveRules.push(override.rule);
  }

  // 5. Aggregate impacts
  const allMatchedRules = [...blockers.map((r) => r.rule), ...effectiveRules];
  const impact = aggregateImpacts(allMatchedRules);

  // 6. Collect mitigations
  const mitigations = collectMitigations(allMatchedRules);

  // 7. Build triggered rules for explanation
  const triggeredRules = allMatchedRules.map((rule) => ({
    ruleId: rule.id,
    ruleName: rule.name,
    reason: rule.reason,
    impact: rule.impact,
    confidence: rule.confidence,
  }));

  // 8. Build report
  return {
    canProceed: blockers.length === 0,
    blockers: blockers.map((r) => ({
      ruleId: r.rule.id,
      ruleName: r.rule.name,
      reason: r.rule.reason,
      impact: r.rule.impact,
      confidence: r.rule.confidence,
    })),
    impact,
    triggeredRules,
    mitigations,
    generatedAt: new Date().toISOString(),
    engineVersion: "2.0.0",
  };
}
```

### 3.6 Main Engine Export

```typescript
// engine/index.ts
export { loadKnowledgeBase, getRulesForAction } from "./loader";
export { matchRule, matchRules } from "./matcher";
export { aggregateImpacts, collectMitigations } from "./aggregator";
export { generateReport } from "./reporter";

// Re-export types
export type { KnowledgeBase } from "./loader";
export type { MatchResult } from "./matcher";
export type { AggregatedImpact } from "./aggregator";
```

---

## 4. Testing Strategy

### 4.1 Golden Case Format

```json
// cases/resize-vm/linux-cross-family.json
{
  "id": "resize-vm-linux-cross-family",
  "description": "Resize Linux VM from Dv3 to Ev4 (cross-family)",
  "input": {
    "context": {
      "vm": {
        "sku": "Standard_D4s_v3",
        "generation": "Gen2"
      },
      "os": {
        "family": "Linux",
        "distro": "Ubuntu",
        "version": "22.04"
      },
      "disks": [
        { "type": "os", "sizeGB": 128, "sku": "Premium_LRS", "topology": "raw" }
      ]
    },
    "action": {
      "type": "ResizeVM",
      "targetSku": "Standard_E4s_v4"
    }
  },
  "expected": {
    "canProceed": true,
    "impact": {
      "reboot": "guaranteed",
      "downtime": "medium"
    },
    "mustTriggerRules": [
      "resize-vm-cross-family",
      "resize-vm-deallocate-required"
    ],
    "mustNotTriggerRules": [
      "resize-vm-same-family-hot"
    ],
    "mustHaveMitigations": [
      "backup-vm",
      "schedule-maintenance"
    ]
  }
}
```

### 4.2 Test Runner

```typescript
// tests/cases/runner.test.ts
import { describe, it, expect } from "vitest";
import { generateReport } from "../../engine";
import { VMContextSchema } from "../../schemas/context.schema";
import { ActionSchema } from "../../schemas/action.schema";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface GoldenCase {
  id: string;
  description: string;
  input: {
    context: unknown;
    action: unknown;
  };
  expected: {
    canProceed?: boolean;
    impact?: {
      reboot?: string;
      downtime?: string;
      guestRisk?: string;
    };
    mustTriggerRules?: string[];
    mustNotTriggerRules?: string[];
    mustHaveMitigations?: string[];
  };
}

// Load all golden cases
function loadGoldenCases(): GoldenCase[] {
  const casesDir = path.join(__dirname, "../../cases");
  const files = glob.sync("**/*.json", { cwd: casesDir });

  return files.map((file) => {
    const content = fs.readFileSync(path.join(casesDir, file), "utf-8");
    return JSON.parse(content) as GoldenCase;
  });
}

describe("Golden Cases", () => {
  const cases = loadGoldenCases();

  for (const testCase of cases) {
    it(`${testCase.id}: ${testCase.description}`, () => {
      // Parse and validate input
      const context = VMContextSchema.parse(testCase.input.context);
      const action = ActionSchema.parse(testCase.input.action);

      // Generate report
      const report = generateReport(context, action);

      // Assert canProceed
      if (testCase.expected.canProceed !== undefined) {
        expect(report.canProceed).toBe(testCase.expected.canProceed);
      }

      // Assert impact levels
      if (testCase.expected.impact?.reboot) {
        expect(report.impact.reboot).toBe(testCase.expected.impact.reboot);
      }
      if (testCase.expected.impact?.downtime) {
        expect(report.impact.downtime).toBe(testCase.expected.impact.downtime);
      }
      if (testCase.expected.impact?.guestRisk) {
        expect(report.impact.guestRisk).toBe(testCase.expected.impact.guestRisk);
      }

      // Assert must-trigger rules
      const triggeredIds = report.triggeredRules.map((r) => r.ruleId);
      for (const ruleId of testCase.expected.mustTriggerRules || []) {
        expect(triggeredIds).toContain(ruleId);
      }

      // Assert must-not-trigger rules
      for (const ruleId of testCase.expected.mustNotTriggerRules || []) {
        expect(triggeredIds).not.toContain(ruleId);
      }

      // Assert mitigations
      const allMitigationIds = [
        ...report.mitigations.required,
        ...report.mitigations.recommended,
        ...report.mitigations.optional,
      ].map((m) => m.id);

      for (const mitId of testCase.expected.mustHaveMitigations || []) {
        expect(allMitigationIds).toContain(mitId);
      }
    });
  }
});
```

### 4.3 CI Configuration

```yaml
# .github/workflows/test.yml
name: Test & Validate KB

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Validate KB schemas
        run: npm run validate-kb

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run typecheck
```

---

## 5. Migration Plan

### Phase 1: Foundation (Week 1)

**Step A: Setup new structure**
```bash
# Create directories
mkdir -p engine kb/rules schemas cases tests/cases scripts

# Install dependencies
npm install zod yaml glob vitest
```

**Step B: Create schemas** (as defined above)

**Step C: Create engine** (as defined above)

**Step D: Add build script**
```typescript
// scripts/build-kb.ts
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { glob } from "glob";

const KB_DIR = path.join(__dirname, "../kb");
const OUTPUT_DIR = path.join(KB_DIR, ".compiled");

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Compile rules
const ruleFiles = glob.sync("rules/**/*.yaml", { cwd: KB_DIR });
const rules = ruleFiles.flatMap((file) => {
  const content = fs.readFileSync(path.join(KB_DIR, file), "utf-8");
  const parsed = yaml.parse(content);
  return Array.isArray(parsed) ? parsed : [parsed];
});
fs.writeFileSync(
  path.join(OUTPUT_DIR, "rules.json"),
  JSON.stringify(rules, null, 2)
);

// Compile mitigations
const mitigationsContent = fs.readFileSync(
  path.join(KB_DIR, "mitigations.yaml"),
  "utf-8"
);
const mitigations = yaml.parse(mitigationsContent);
fs.writeFileSync(
  path.join(OUTPUT_DIR, "mitigations.json"),
  JSON.stringify(mitigations, null, 2)
);

console.log(`Compiled ${rules.length} rules and ${mitigations.length} mitigations`);
```

### Phase 2: Convert Operations (Week 2-3)

**Convert ONE operation at a time:**

1. **ResizeVM** (most complex, good baseline)
2. **RedeployVM** (simple, quick win)
3. **DetachDisk** (guest topology matters)
4. **ResizeOSDisk** / **ResizeDataDisk**
5. **EnableEncryption** / **DisableEncryption**
6. **ChangeZone** / **CrossRegionMove**

**For each operation:**
```
1. Extract existing rules from src/data/rules.ts
2. Convert to YAML in kb/rules/{operation}/
3. Write golden cases in cases/{operation}/
4. Run tests to verify behavior matches
5. Update UI to use new engine
6. Remove old code from src/data/rules.ts
```

### Phase 3: Cleanup (Week 4)

1. Remove old `src/data/rules.ts` (now empty)
2. Remove old `src/lib/engine.ts` (replaced by new engine)
3. Update imports throughout UI
4. Update documentation
5. Tag release v2.0.0

### Migration Checklist

```markdown
## Migration Checklist

### Foundation
- [ ] Create `engine/` directory with all modules
- [ ] Create `schemas/` with Zod schemas
- [ ] Create `kb/` structure
- [ ] Create `cases/` structure
- [ ] Add build script for YAML → JSON
- [ ] Add test runner for golden cases
- [ ] Update package.json scripts

### Operations (convert each fully before moving to next)
- [ ] ResizeVM
  - [ ] Extract rules to YAML
  - [ ] Write golden cases (5+ cases)
  - [ ] Tests pass
  - [ ] UI updated
- [ ] RedeployVM
  - [ ] Extract rules to YAML
  - [ ] Write golden cases
  - [ ] Tests pass
  - [ ] UI updated
- [ ] DetachDisk
  - [ ] Extract rules to YAML
  - [ ] Write golden cases
  - [ ] Tests pass
  - [ ] UI updated
- [ ] ResizeOSDisk
- [ ] ResizeDataDisk
- [ ] EnableEncryption
- [ ] DisableEncryption
- [ ] ChangeZone
- [ ] CrossRegionMove

### Cleanup
- [ ] Remove src/data/rules.ts
- [ ] Remove old src/lib/engine.ts
- [ ] Update all imports
- [ ] Update README
- [ ] Tag v2.0.0
```

---

## 6. Starter Pack: Initial Rules & Cases

### 6.1 Sample Rules (YAML)

```yaml
# kb/rules/resize-vm/deallocate-required.yaml
- id: resize-vm-deallocate-required
  name: VM Resize Requires Deallocation
  description: Most VM resizes require the VM to be deallocated
  type: rule
  actions: [ResizeVM]
  conditions: []  # Applies to all ResizeVM
  impact:
    reboot: guaranteed
    downtime: medium
  reason: >
    Azure VM resize operations typically require the VM to be stopped
    (deallocated) before the new size can be applied.
  mitigations:
    - backup-vm
    - schedule-maintenance
    - notify-users
  confidence: high
  docUrl: https://learn.microsoft.com/en-us/azure/virtual-machines/resize-vm
  tags: [resize, deallocate]

- id: resize-vm-cross-family
  name: Cross-Family Resize
  description: Resizing to a different VM family requires redeployment
  type: rule
  actions: [ResizeVM]
  conditions:
    - field: action.crossFamily
      operator: eq
      value: true
  impact:
    reboot: guaranteed
    downtime: high
  reason: >
    Changing VM families (e.g., D-series to E-series) requires moving
    to different hardware, which involves a full redeployment.
  mitigations:
    - backup-vm
    - verify-sku-availability
    - schedule-maintenance
  confidence: high
  tags: [resize, cross-family]

# kb/rules/resize-vm/temp-disk-wipe.yaml
- id: resize-vm-temp-disk-wipe
  name: Temp Disk Data Loss on Resize
  description: Temp disk data is lost during VM resize
  type: rule
  actions: [ResizeVM]
  conditions:
    - field: hasTempDisk
      operator: eq
      value: true
  impact:
    dataLossRisk: true
    guestRisk: medium
  reason: >
    The temporary disk (D: on Windows, /dev/sdb on Linux) is ephemeral.
    All data on it will be lost when the VM is resized.
  mitigations:
    - backup-temp-disk-data
    - verify-no-critical-data-temp
  confidence: high
  docUrl: https://learn.microsoft.com/en-us/azure/virtual-machines/managed-disks-overview#temporary-disk
  tags: [resize, temp-disk, data-loss]
```

```yaml
# kb/rules/redeploy/temp-disk-wipe.yaml
- id: redeploy-temp-disk-wipe
  name: Temp Disk Wiped on Redeploy
  description: Redeploying a VM wipes the temporary disk
  type: rule
  actions: [RedeployVM]
  conditions:
    - field: hasTempDisk
      operator: eq
      value: true
  impact:
    reboot: guaranteed
    downtime: medium
    dataLossRisk: true
  reason: >
    Redeployment moves the VM to a new physical host. The temporary
    disk is local to the host and will be completely wiped.
  mitigations:
    - backup-temp-disk-data
    - verify-pagefile-location
  confidence: high
  tags: [redeploy, temp-disk]
```

```yaml
# kb/rules/detach-disk/lvm-member.yaml
- id: detach-lvm-member
  name: Detaching LVM Physical Volume
  description: Detaching a disk that is part of an LVM volume group
  type: blocker
  actions: [DetachDisk]
  conditions:
    - field: disks[action.targetLun].topology
      operator: eq
      value: lvm
  impact:
    guestRisk: critical
    dataLossRisk: true
  reason: >
    This disk is configured as an LVM Physical Volume (PV). Detaching it
    will corrupt the volume group and cause data loss. You must first
    remove it from the VG using pvmove and vgreduce.
  mitigations:
    - lvm-pvmove
    - lvm-vgreduce
    - backup-vm
  confidence: high
  tags: [detach, lvm, blocker]

- id: detach-raid-member
  name: Detaching RAID Array Member
  description: Detaching a disk that is part of a software RAID array
  type: blocker
  actions: [DetachDisk]
  conditions:
    - field: disks[action.targetLun].topology
      operator: eq
      value: raid
  impact:
    guestRisk: critical
    dataLossRisk: true
  reason: >
    This disk is a member of a software RAID array (mdadm). Detaching it
    will degrade or break the array. You must remove it from the array
    first using mdadm --fail and --remove.
  mitigations:
    - raid-fail-remove
    - backup-vm
  confidence: high
  tags: [detach, raid, blocker]
```

```yaml
# kb/rules/resize-disk/linux-extend.yaml
- id: resize-os-disk-linux-extend
  name: Linux OS Disk Extension Required
  description: After resizing Linux OS disk, filesystem must be extended
  type: rule
  actions: [ResizeOSDisk]
  conditions:
    - field: os.family
      operator: eq
      value: Linux
  impact:
    guestRisk: low
  reason: >
    After Azure extends the disk, you must extend the partition and
    filesystem from within the guest OS using growpart and resize2fs
    (or xfs_growfs for XFS).
  mitigations:
    - linux-extend-partition
    - linux-extend-filesystem
  confidence: high
  docUrl: https://learn.microsoft.com/en-us/azure/virtual-machines/linux/expand-disks
  tags: [resize-disk, linux, guest-action]

- id: resize-os-disk-windows-extend
  name: Windows OS Disk Extension Required
  description: After resizing Windows OS disk, volume must be extended
  type: rule
  actions: [ResizeOSDisk]
  conditions:
    - field: os.family
      operator: eq
      value: Windows
  impact:
    guestRisk: low
  reason: >
    After Azure extends the disk, you must extend the volume from
    within Windows using Disk Management or diskpart.
  mitigations:
    - windows-extend-volume
  confidence: high
  docUrl: https://learn.microsoft.com/en-us/azure/virtual-machines/windows/expand-os-disk
  tags: [resize-disk, windows, guest-action]
```

### 6.2 Mitigations

```yaml
# kb/mitigations.yaml
- id: backup-vm
  title: Create VM Backup
  description: Create a backup of the VM before proceeding
  phase: before
  severity: required
  platforms: [all]
  docUrl: https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-first-look-arm
  steps:
    - Navigate to the VM in Azure Portal
    - Click Backup under Operations
    - Configure backup policy and vault
    - Run backup now

- id: schedule-maintenance
  title: Schedule Maintenance Window
  description: Plan the operation during a maintenance window
  phase: before
  severity: recommended
  platforms: [all]
  steps:
    - Identify low-traffic period
    - Notify stakeholders
    - Prepare rollback plan

- id: notify-users
  title: Notify Users
  description: Inform users about expected downtime
  phase: before
  severity: recommended
  platforms: [all]

- id: backup-temp-disk-data
  title: Backup Temp Disk Data
  description: Copy any important data from the temporary disk
  phase: before
  severity: required
  platforms: [all]
  steps:
    - Identify data on temp disk (D:\\ on Windows, /mnt on Linux)
    - Copy to persistent storage or Azure Blob
    - Verify copy completed successfully

- id: verify-no-critical-data-temp
  title: Verify No Critical Data on Temp Disk
  description: Ensure no critical data exists on the temporary disk
  phase: before
  severity: required
  platforms: [all]

- id: verify-pagefile-location
  title: Verify Pagefile Location
  description: Ensure Windows pagefile is not only on temp disk
  phase: before
  severity: recommended
  platforms: [Windows]
  docUrl: https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/understand-vm-reboot

- id: verify-sku-availability
  title: Verify SKU Availability
  description: Confirm target SKU is available in your region/zone
  phase: before
  severity: required
  platforms: [all]
  steps:
    - Check Azure Portal for available sizes
    - Or use az vm list-skus --location <region>

- id: lvm-pvmove
  title: Migrate LVM Data Off Disk
  description: Use pvmove to migrate data off the physical volume
  phase: before
  severity: required
  platforms: [Linux]
  steps:
    - "Run: pvmove /dev/sdX"
    - Wait for data migration to complete
    - "Verify: pvs shows no data on the PV"

- id: lvm-vgreduce
  title: Remove PV from Volume Group
  description: Remove the physical volume from the volume group
  phase: before
  severity: required
  platforms: [Linux]
  steps:
    - "Run: vgreduce <vg_name> /dev/sdX"
    - "Run: pvremove /dev/sdX"
    - Verify VG is healthy

- id: raid-fail-remove
  title: Remove Disk from RAID Array
  description: Fail and remove the disk from the mdadm array
  phase: before
  severity: required
  platforms: [Linux]
  steps:
    - "Run: mdadm /dev/mdX --fail /dev/sdY"
    - "Run: mdadm /dev/mdX --remove /dev/sdY"
    - "Verify: cat /proc/mdstat shows disk removed"

- id: linux-extend-partition
  title: Extend Linux Partition
  description: Extend the partition to use new disk space
  phase: after
  severity: required
  platforms: [Linux]
  steps:
    - "Install growpart: apt install cloud-guest-utils"
    - "Run: growpart /dev/sda 1"
    - Verify partition extended

- id: linux-extend-filesystem
  title: Extend Linux Filesystem
  description: Resize the filesystem to use extended partition
  phase: after
  severity: required
  platforms: [Linux]
  steps:
    - "For ext4: resize2fs /dev/sda1"
    - "For XFS: xfs_growfs /"
    - "Verify: df -h shows new size"

- id: windows-extend-volume
  title: Extend Windows Volume
  description: Extend the volume using Disk Management
  phase: after
  severity: required
  platforms: [Windows]
  docUrl: https://learn.microsoft.com/en-us/azure/virtual-machines/windows/expand-os-disk
  steps:
    - Open Disk Management (diskmgmt.msc)
    - Right-click the volume
    - Select "Extend Volume"
    - Follow wizard to extend
```

### 6.3 Golden Cases

```json
// cases/resize-vm/same-family-windows.json
{
  "id": "resize-vm-same-family-windows",
  "description": "Resize Windows VM within same family (D2s_v3 → D4s_v3)",
  "input": {
    "context": {
      "vm": { "sku": "Standard_D2s_v3", "generation": "Gen2" },
      "os": { "family": "Windows", "version": "2022" },
      "disks": [
        { "type": "os", "sizeGB": 128, "sku": "Premium_LRS", "topology": "raw" }
      ],
      "hasTempDisk": true
    },
    "action": {
      "type": "ResizeVM",
      "targetSku": "Standard_D4s_v3"
    }
  },
  "expected": {
    "canProceed": true,
    "impact": {
      "reboot": "guaranteed",
      "downtime": "medium"
    },
    "mustTriggerRules": ["resize-vm-deallocate-required", "resize-vm-temp-disk-wipe"],
    "mustHaveMitigations": ["backup-vm", "backup-temp-disk-data"]
  }
}
```

```json
// cases/detach-disk/lvm-member-linux.json
{
  "id": "detach-lvm-member-linux",
  "description": "Attempt to detach disk that is LVM PV - should block",
  "input": {
    "context": {
      "vm": { "sku": "Standard_D4s_v3", "generation": "Gen2" },
      "os": { "family": "Linux", "distro": "Ubuntu", "version": "22.04" },
      "disks": [
        { "type": "os", "sizeGB": 128, "sku": "Premium_LRS", "topology": "raw" },
        { "lun": 0, "type": "data", "sizeGB": 512, "sku": "Premium_LRS", "topology": "lvm", "mountPoint": "/data" }
      ]
    },
    "action": {
      "type": "DetachDisk",
      "targetLun": 0
    }
  },
  "expected": {
    "canProceed": false,
    "impact": {
      "guestRisk": "critical"
    },
    "mustTriggerRules": ["detach-lvm-member"],
    "mustHaveMitigations": ["lvm-pvmove", "lvm-vgreduce"]
  }
}
```

```json
// cases/redeploy/temp-disk-linux.json
{
  "id": "redeploy-temp-disk-linux",
  "description": "Redeploy Linux VM with temp disk",
  "input": {
    "context": {
      "vm": { "sku": "Standard_D4s_v3", "generation": "Gen2" },
      "os": { "family": "Linux", "distro": "RHEL", "version": "8" },
      "disks": [
        { "type": "os", "sizeGB": 64, "sku": "StandardSSD_LRS", "topology": "raw" }
      ],
      "hasTempDisk": true
    },
    "action": { "type": "RedeployVM" }
  },
  "expected": {
    "canProceed": true,
    "impact": {
      "reboot": "guaranteed",
      "downtime": "medium",
      "dataLossRisk": true
    },
    "mustTriggerRules": ["redeploy-temp-disk-wipe"],
    "mustHaveMitigations": ["backup-temp-disk-data"]
  }
}
```

---

## 7. Next.js Implementation Details

### 7.1 Loading KB Data

**Recommended: Build-time compilation**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  // Run KB compilation before build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // KB is compiled during build, imported as JSON
    }
    return config;
  },
};

export default nextConfig;
```

```json
// package.json
{
  "scripts": {
    "prebuild": "npm run build-kb",
    "build-kb": "tsx scripts/build-kb.ts",
    "validate-kb": "tsx scripts/validate-kb.ts",
    "build": "next build",
    "test": "vitest"
  }
}
```

### 7.2 Using KB in Components

```typescript
// src/lib/kb-loader.ts
import { generateReport } from "../../engine";
import type { VMContext } from "../../schemas/context.schema";
import type { Action } from "../../schemas/action.schema";
import type { Report } from "../../schemas/report.schema";

// Re-export for UI usage
export function evaluateImpact(context: VMContext, action: Action): Report {
  return generateReport(context, action);
}
```

### 7.3 VM Profile Persistence

```typescript
// src/lib/vm-profile.ts
import { VMContext, VMContextSchema } from "../../schemas/context.schema";

const STORAGE_KEY = "azpact-vm-profile";

export function saveVMProfile(profile: Partial<VMContext>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadVMProfile(): Partial<VMContext> | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearVMProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
```

---

## 8. Best Practices

### 8.1 Rule ID Convention

```
{action}-{category}-{specific}

Examples:
- resize-vm-deallocate-required
- resize-vm-cross-family
- detach-lvm-member
- redeploy-temp-disk-wipe
```

### 8.2 Semantic Versioning for KB

```yaml
# kb/version.yaml
version: "1.2.0"
released: "2024-01-15"
changelog:
  - "1.2.0: Added zone migration rules"
  - "1.1.0: Added encryption rules"
  - "1.0.0: Initial release with core operations"
```

### 8.3 CI Checks

```yaml
# .github/workflows/validate.yml
- name: Validate KB Schemas
  run: npm run validate-kb

- name: Run Golden Cases
  run: npm test

- name: Check Rule IDs Unique
  run: tsx scripts/check-unique-ids.ts

- name: Lint YAML
  run: npx yaml-lint kb/**/*.yaml
```

### 8.4 Documentation Requirements

Every rule must have:
- [ ] Unique ID (kebab-case)
- [ ] Clear description
- [ ] At least one golden case
- [ ] docUrl if referencing Microsoft docs
- [ ] confidence level

---

## Summary

This architecture provides:

1. **Scalability**: Add rules via YAML without code changes
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Golden cases ensure correctness
4. **Contributor-friendliness**: Anyone can add rules
5. **Explainability**: Every impact has a reason
6. **Incrementality**: Migrate one operation at a time

The migration can be done safely over 2-4 weeks while keeping the existing UI fully functional.
