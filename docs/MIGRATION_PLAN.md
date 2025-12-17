# AZpact Migration Plan: TypeScript to YAML Knowledge Base

## Current State Analysis

### What We Have (Already Good!)

| Component | Location | Count | Format |
|-----------|----------|-------|--------|
| Rules | `src/data/rules.ts` | 49 rules | TypeScript array |
| Mitigations | `src/data/mitigations.ts` | 27 mitigations | TypeScript Record |
| SKUs | `src/data/skus.ts` | ~50 SKUs | TypeScript array |
| Engine | `src/lib/engine.ts` | 1 file | TypeScript |

### Current Architecture (Strengths)

```
src/data/rules.ts          ─┐
src/data/mitigations.ts     ├──▶ src/lib/engine.ts ──▶ ImpactReport
src/data/skus.ts           ─┘
```

**What's already working well:**
- Rule structure with `id`, `conditions`, `impact`, `mitigations`
- Condition operators: `eq`, `ne`, `in`, `notIn`, `exists`, `gt`, `lt`
- Impact aggregation (takes highest severity)
- Blocker detection (stops evaluation)
- Mitigation collection (deduplication, required-first sorting)

### What Needs to Change

| Current | Target | Why |
|---------|--------|-----|
| Rules in `.ts` | Rules in `.yaml` | Non-developers can contribute |
| No validation | Zod schemas | Catch errors early |
| No tests | Golden cases | Safe contributions |
| Manual editing | Build pipeline | YAML → JSON at build time |

---

## Migration Strategy: Incremental & Safe

### Principle: Keep UI Unchanged

```
                     ┌─────────────────────┐
                     │    UI Components    │
                     │   (NO CHANGES!)     │
                     └─────────┬───────────┘
                               │
                     ┌─────────▼───────────┐
                     │   evaluateImpact()  │  ← Same API
                     └─────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
      ┌───────▼───────┐ ┌──────▼──────┐ ┌──────▼──────┐
      │  rules.ts     │ │ mitigations │ │   skus.ts   │
      │  (OLD)        │ │    (OLD)    │ │   (KEEP)    │
      └───────────────┘ └─────────────┘ └─────────────┘
              │                │
              ▼                ▼
      ┌───────────────┐ ┌─────────────┐
      │  kb/rules/    │ │ mitigations │  ← NEW (YAML)
      │  *.yaml       │ │   .yaml     │
      └───────────────┘ └─────────────┘
```

---

## Phase 1: Setup Infrastructure (Day 1)

### 1.1 Install Dependencies

```bash
npm install yaml zod glob vitest --save-dev
```

### 1.2 Create Directory Structure

```bash
mkdir -p kb/rules/{resize-vm,redeploy,detach-disk,resize-disk,encryption,zone-move,cross-region}
mkdir -p kb/.compiled
mkdir -p schemas
mkdir -p cases/{resize-vm,redeploy,detach-disk}
mkdir -p scripts
```

### 1.3 Create Build Script

```typescript
// scripts/build-kb.ts
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { glob } from "glob";

const KB_DIR = path.join(process.cwd(), "kb");
const OUTPUT_DIR = path.join(KB_DIR, ".compiled");

// Ensure output exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Compile all rule files
const ruleFiles = glob.sync("rules/**/*.yaml", { cwd: KB_DIR });
const allRules: unknown[] = [];

for (const file of ruleFiles) {
  const content = fs.readFileSync(path.join(KB_DIR, file), "utf-8");
  const parsed = yaml.parse(content);
  const rules = Array.isArray(parsed) ? parsed : [parsed];
  allRules.push(...rules);
}

fs.writeFileSync(
  path.join(OUTPUT_DIR, "rules.json"),
  JSON.stringify(allRules, null, 2)
);

// Compile mitigations
if (fs.existsSync(path.join(KB_DIR, "mitigations.yaml"))) {
  const content = fs.readFileSync(path.join(KB_DIR, "mitigations.yaml"), "utf-8");
  const mitigations = yaml.parse(content);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "mitigations.json"),
    JSON.stringify(mitigations, null, 2)
  );
}

console.log(`✓ Compiled ${allRules.length} rules`);
```

### 1.4 Update package.json

```json
{
  "scripts": {
    "build-kb": "tsx scripts/build-kb.ts",
    "validate-kb": "tsx scripts/validate-kb.ts",
    "prebuild": "npm run build-kb",
    "test": "vitest",
    "test:cases": "vitest run tests/cases"
  }
}
```

---

## Phase 2: Create Schemas (Day 1-2)

### 2.1 Rule Schema

```typescript
// schemas/rule.schema.ts
import { z } from "zod";

export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "ne", "in", "notIn", "exists", "gt", "lt", "gte", "lte"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const ImpactSchema = z.object({
  reboot: z.enum(["none", "possible", "likely", "guaranteed"]).optional(),
  downtime: z.enum(["none", "low", "medium", "high"]).optional(),
  risk: z.enum(["low", "medium", "high", "critical"]).optional(),
  reason: z.string(),
  affectedComponents: z.array(z.string()).optional(),
});

export const RuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string(),
  category: z.enum(["blocker", "infra", "guest"]),
  actions: z.array(z.string()),
  conditions: z.array(ConditionSchema),
  impact: ImpactSchema,
  mitigations: z.array(z.string()).optional().default([]),
  // Optional metadata
  confidence: z.enum(["high", "medium", "low"]).optional().default("high"),
  docUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export type Rule = z.infer<typeof RuleSchema>;
```

### 2.2 Validation Script

```typescript
// scripts/validate-kb.ts
import * as fs from "fs";
import * as path from "path";
import { RuleSchema } from "../schemas/rule.schema";

const COMPILED_DIR = path.join(process.cwd(), "kb/.compiled");

// Validate rules
const rulesPath = path.join(COMPILED_DIR, "rules.json");
if (fs.existsSync(rulesPath)) {
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  let errors = 0;

  for (const rule of rules) {
    const result = RuleSchema.safeParse(rule);
    if (!result.success) {
      console.error(`❌ Invalid rule: ${rule.id || "unknown"}`);
      console.error(result.error.format());
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`✓ All ${rules.length} rules are valid`);
  } else {
    process.exit(1);
  }
}
```

---

## Phase 3: Convert Rules to YAML (Day 2-4)

### Conversion Strategy: One Operation at a Time

```
Current rules.ts ──┬── ResizeVM rules (11) ──▶ kb/rules/resize-vm/*.yaml
                   ├── RedeployVM rules (2) ──▶ kb/rules/redeploy/*.yaml
                   ├── DetachDisk rules (9) ──▶ kb/rules/detach-disk/*.yaml
                   ├── ResizeDisk rules (7) ──▶ kb/rules/resize-disk/*.yaml
                   ├── Encryption rules (6) ──▶ kb/rules/encryption/*.yaml
                   ├── Zone rules (3) ──▶ kb/rules/zone-move/*.yaml
                   └── CrossRegion rules (3) ──▶ kb/rules/cross-region/*.yaml
```

### 3.1 Example Conversion: Resize VM

**Before (TypeScript):**
```typescript
{
  id: "resize-cross-family",
  name: "Cross Family Resize",
  description: "Resizing to a different VM family",
  category: "infra",
  actions: ["ResizeVM"],
  conditions: [
    { field: "vm.family", operator: "ne", value: "targetSku.family" },
  ],
  impact: {
    reboot: "guaranteed",
    downtime: "medium",
    reason: "Cross-family resize requires VM reallocation...",
  },
  mitigations: ["backup-vm", "stop-vm-gracefully", "stop-applications", "drain-connections"],
}
```

**After (YAML):**
```yaml
# kb/rules/resize-vm/cross-family.yaml
- id: resize-cross-family
  name: Cross Family Resize
  description: Resizing to a different VM family
  category: infra
  actions: [ResizeVM]
  conditions:
    - field: vm.family
      operator: ne
      value: targetSku.family
  impact:
    reboot: guaranteed
    downtime: medium
    reason: >
      Cross-family resize requires VM reallocation to different hardware.
      The VM will be stopped and restarted.
  mitigations:
    - backup-vm
    - stop-vm-gracefully
    - stop-applications
    - drain-connections
  confidence: high
  tags: [resize, cross-family]
```

### 3.2 Conversion Order (by complexity)

| Order | Operation | Rules | Complexity |
|-------|-----------|-------|------------|
| 1 | RedeployVM | 2 | Low - quick win |
| 2 | ResizeDataDisk | 4 | Low |
| 3 | ResizeOSDisk | 3 | Low |
| 4 | DetachDisk | 9 | Medium - LVM/RAID |
| 5 | Encryption | 6 | Medium |
| 6 | ResizeVM | 11 | High - most complex |
| 7 | ChangeZone | 3 | Medium |
| 8 | CrossRegionMove | 3 | Low |

### 3.3 For Each Conversion

```markdown
## Checklist: Convert [Operation]

- [ ] Extract rules from rules.ts to kb/rules/[operation]/*.yaml
- [ ] Run `npm run build-kb` - verify compiles
- [ ] Run `npm run validate-kb` - verify schema valid
- [ ] Create golden cases in cases/[operation]/
- [ ] Run `npm test:cases` - verify behavior matches
- [ ] Update engine loader to use compiled JSON
- [ ] Delete converted rules from rules.ts
- [ ] Test UI manually
```

---

## Phase 4: Update Engine to Use Compiled KB (Day 3-4)

### 4.1 Create KB Loader

```typescript
// src/lib/kb-loader.ts
import compiledRules from "../../kb/.compiled/rules.json";
import compiledMitigations from "../../kb/.compiled/mitigations.json";
import { Rule } from "@/types";
import { Mitigation } from "@/types";

// Type assertion (validated at build time)
const rules = compiledRules as Rule[];
const mitigationsRecord = compiledMitigations as Record<string, Mitigation>;

export function getRulesByAction(action: string): Rule[] {
  return rules.filter((r) => r.actions.includes(action));
}

export function getMitigation(id: string): Mitigation | undefined {
  return mitigationsRecord[id];
}

export function getMitigations(ids: string[]): Mitigation[] {
  return ids.map((id) => mitigationsRecord[id]).filter(Boolean);
}
```

### 4.2 Update Engine Import

```typescript
// src/lib/engine.ts
// Change from:
import { rules } from "@/data/rules";
import { getMitigations } from "@/data/mitigations";

// To:
import { getRulesByAction, getMitigations } from "./kb-loader";

// Update rule fetching:
// Old: const infraRules = rules.filter((r) => r.category === "infra");
// New: const allRules = getRulesByAction(action.type);
//      const infraRules = allRules.filter((r) => r.category === "infra");
```

---

## Phase 5: Add Golden Cases (Day 4-5)

### 5.1 Case Format

```json
// cases/resize-vm/cross-family-linux.json
{
  "id": "resize-vm-cross-family-linux",
  "description": "Resize Linux VM from D-series to E-series",
  "input": {
    "context": {
      "vm": {
        "sku": "Standard_D4s_v3",
        "generation": "Gen2"
      },
      "os": {
        "family": "Linux",
        "distro": "Ubuntu"
      },
      "disks": [
        { "role": "os", "sizeGB": 128, "type": "Premium_LRS" }
      ]
    },
    "action": {
      "type": "ResizeVM",
      "targetSku": "Standard_E4s_v4"
    }
  },
  "expected": {
    "blocked": false,
    "infra": {
      "reboot": "guaranteed",
      "downtime": "medium"
    },
    "mustMatchRules": ["resize-cross-family"],
    "mustHaveMitigations": ["backup-vm"]
  }
}
```

### 5.2 Test Runner

```typescript
// tests/cases/runner.test.ts
import { describe, it, expect } from "vitest";
import { evaluateImpact } from "../../src/lib/engine";
import { glob } from "glob";
import * as fs from "fs";

interface GoldenCase {
  id: string;
  description: string;
  input: { context: unknown; action: unknown };
  expected: {
    blocked?: boolean;
    infra?: { reboot?: string; downtime?: string };
    guest?: { risk?: string };
    mustMatchRules?: string[];
    mustHaveMitigations?: string[];
  };
}

const caseFiles = glob.sync("cases/**/*.json");

describe("Golden Cases", () => {
  for (const file of caseFiles) {
    const testCase: GoldenCase = JSON.parse(fs.readFileSync(file, "utf-8"));

    it(`${testCase.id}: ${testCase.description}`, () => {
      const result = evaluateImpact(
        testCase.input.context as any,
        testCase.input.action as any
      );

      // Check blocked status
      if (testCase.expected.blocked !== undefined) {
        expect(result.blocked).toBe(testCase.expected.blocked);
      }

      // Check infra impact
      if (testCase.expected.infra?.reboot) {
        expect(result.infra.reboot).toBe(testCase.expected.infra.reboot);
      }
      if (testCase.expected.infra?.downtime) {
        expect(result.infra.downtime).toBe(testCase.expected.infra.downtime);
      }

      // Check matched rules
      if (testCase.expected.mustMatchRules) {
        for (const ruleId of testCase.expected.mustMatchRules) {
          expect(result.matchedRules).toContain(ruleId);
        }
      }

      // Check mitigations
      if (testCase.expected.mustHaveMitigations) {
        const mitIds = result.mitigations.map(m => m.id);
        for (const mitId of testCase.expected.mustHaveMitigations) {
          expect(mitIds).toContain(mitId);
        }
      }
    });
  }
});
```

---

## Phase 6: Cleanup (Day 5)

### After All Rules Converted

```bash
# 1. Verify all tests pass
npm test

# 2. Delete old TypeScript data files
rm src/data/rules.ts
rm src/data/mitigations.ts  # Keep if still used, or convert

# 3. Update imports throughout codebase
# (engine.ts should now use kb-loader)

# 4. Commit
git add .
git commit -m "chore: Complete migration to YAML knowledge base"
```

---

## Timeline Summary

| Day | Phase | Deliverable |
|-----|-------|-------------|
| 1 | Setup | Directory structure, build script, schemas |
| 2 | Convert | Redeploy, ResizeDataDisk, ResizeOSDisk rules |
| 3 | Convert | DetachDisk, Encryption rules |
| 4 | Convert | ResizeVM, Zone, CrossRegion rules |
| 4 | Engine | Update engine to use compiled KB |
| 5 | Testing | Golden cases for all operations |
| 5 | Cleanup | Remove old .ts files, final testing |

---

## CI Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build-kb
      - run: npm run validate-kb
      - run: npm test
```

---

## Benefits After Migration

| Aspect | Before | After |
|--------|--------|-------|
| Add rule | Edit .ts, know TypeScript | Edit .yaml, no code knowledge |
| Test rule | Manual | Automated golden cases |
| Validate | Runtime errors | Build-time Zod validation |
| Review | Code review | Data review (simpler) |
| Contribute | PR with code | PR with YAML |

---

## Next Steps

1. **Start Phase 1 today**: Setup directory structure
2. **Convert simplest operation first**: RedeployVM (2 rules)
3. **Iterate**: One operation per day
4. **Keep UI untouched**: All changes are backend only
