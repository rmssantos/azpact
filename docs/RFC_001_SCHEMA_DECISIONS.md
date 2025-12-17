# RFC-001: Schema & Engine Design Decisions

**Status:** Draft
**Author:** Ruben Santos
**Date:** 2024-12-17
**Reviewers:** Community

---

## Summary

This RFC addresses design gaps identified in the initial architecture proposal and establishes firm decisions for the Knowledge Base schema and rules engine.

---

## Decision 1: Unified Rule Taxonomy

### Problem
Inconsistency between documents:
- One uses `type: rule|blocker|override`
- Other uses `category: blocker|infra|guest`

### Decision

**Use both `type` and `layer` as separate concerns:**

```yaml
type: rule | blocker | override    # Behavior
layer: infra | guest               # Domain
```

| Field | Purpose | Values |
|-------|---------|--------|
| `type` | How the engine processes it | `rule` (additive), `blocker` (hard stop), `override` (replaces) |
| `layer` | What domain it affects | `infra` (Azure platform), `guest` (OS/application) |

**Example:**
```yaml
- id: lvm-pv-detach
  type: blocker        # Engine stops here
  layer: guest         # It's a guest OS concern
  ...
```

### Rationale
- `blocker` is a **behavior**, not a layer
- A guest-level issue can be a blocker (e.g., LVM PV detach)
- An infra issue can be non-blocking (e.g., reboot warning)

---

## Decision 2: Extended Disk Schema

### Problem
Current `topology: raw|lvm|raid|dynamic` is insufficient for accurate impact analysis.

### Decision

**Extend DiskSchema with optional detailed fields:**

```typescript
export const DiskSchema = z.object({
  // Required fields
  lun: z.number().optional(),           // LUN (data disks only)
  role: z.enum(["os", "data", "temp"]),
  sizeGB: z.number(),
  sku: z.enum(["Standard_LRS", "StandardSSD_LRS", "Premium_LRS", "UltraSSD_LRS"]),

  // Topology (simple)
  topology: z.enum(["raw", "lvm", "raid", "storage-spaces", "dynamic"]).default("raw"),

  // Usage hint (for severity calculation)
  usage: z.enum(["boot", "app", "database", "cache", "backup", "unknown"]).default("unknown"),

  // Mount info
  isMounted: z.boolean().default(false),
  mountPoint: z.string().optional(),

  // LVM details (optional, for advanced analysis)
  lvm: z.object({
    isPV: z.boolean(),                  // Is this disk a Physical Volume?
    volumeGroup: z.string().optional(), // VG name if known
    logicalVolumes: z.array(z.string()).optional(),
  }).optional(),

  // RAID details (optional)
  raid: z.object({
    isMember: z.boolean(),              // Is this disk part of an array?
    arrayName: z.string().optional(),   // e.g., "/dev/md0"
    level: z.enum(["0", "1", "5", "6", "10"]).optional(),
    canDegrade: z.boolean().optional(), // RAID1/5/6/10 can survive one disk loss
  }).optional(),

  // Encryption
  isEncrypted: z.boolean().default(false),
});
```

### Usage Impact Matrix

| usage | Detach Impact | Resize Impact |
|-------|---------------|---------------|
| boot | critical | high |
| app | high | medium |
| database | critical | high |
| cache | low | low |
| backup | medium | low |
| unknown | high (conservative) | medium |

### Rationale
- `usage` allows severity adjustment without complex logic
- `lvm` and `raid` objects are **optional** - basic analysis still works without them
- When provided, enables precise warnings like "This PV is part of VG 'data_vg'"

---

## Decision 3: Target Disk Lookup (LUN ≠ Array Index)

### Problem
Using `disks[action.targetLun]` assumes LUN equals array index. In reality, LUNs can be 0, 1, 4, 10, etc.

### Decision

**Engine computes `targetDisk` as a lookup result:**

```typescript
// In buildEvalContext()
function buildEvalContext(context: VMContext, action: Action) {
  // Find target disk by LUN (not array index!)
  const targetDisk = action.targetLun !== undefined
    ? context.disks.find(d => d.lun === action.targetLun)
    : undefined;

  return {
    vm: { ... },
    os: { ... },
    disks: { ... },

    // Computed field - safe to use in conditions
    targetDisk: targetDisk || null,

    action: { ... },
  };
}
```

**Rule conditions use `targetDisk.*` directly:**

```yaml
# CORRECT - uses computed lookup
conditions:
  - field: targetDisk.topology
    operator: eq
    value: lvm

# WRONG - assumes LUN is array index
conditions:
  - field: disks[action.targetLun].topology  # Don't do this!
```

### Rationale
- Safer - no risk of index-out-of-bounds
- Clearer - `targetDisk.topology` is self-documenting
- Null-safe - engine can check `targetDisk exists` first

---

## Decision 4: Override Mechanism (Explicit Targets)

### Problem
"Override replaces additive rules with same tags" is ambiguous and can cause unexpected behavior.

### Decision

**Overrides must explicitly declare what they target:**

```yaml
- id: resize-vm-same-family-hot-resize
  type: override
  layer: infra
  overrideTargets:
    - resize-vm-deallocate-required  # Explicit rule ID
  conditions:
    - field: vm.family
      operator: eq
      value: targetSku.family
    - field: targetSku.supportsHotResize
      operator: eq
      value: true
  impact:
    reboot: none
    downtime: none
    reason: Same-family hot resize available - no reboot required.
```

**Override rules:**

1. **Overrides never remove blockers** - a blocker always wins
2. **Overrides only target rules in the same layer** (infra→infra, guest→guest)
3. **`overrideTargets` is required** for `type: override`
4. **Targeted rules must exist** - validation error if target ID not found

### Engine Logic

```typescript
function applyOverrides(matchedRules: Rule[]): Rule[] {
  const overrides = matchedRules.filter(r => r.type === "override");
  const blockers = matchedRules.filter(r => r.type === "blocker");
  const regular = matchedRules.filter(r => r.type === "rule");

  // Collect all override targets
  const overriddenIds = new Set<string>();
  for (const override of overrides) {
    for (const targetId of override.overrideTargets || []) {
      overriddenIds.add(targetId);
    }
  }

  // Remove overridden rules (but NEVER blockers)
  const filteredRegular = regular.filter(r => !overriddenIds.has(r.id));

  // Blockers always survive
  return [...blockers, ...filteredRegular, ...overrides];
}
```

### Rationale
- Explicit is better than implicit
- Prevents accidental rule removal
- Easy to audit: "why was rule X not applied?" → "because rule Y overrides it"

---

## Decision 5: SKU Data Scope

### Problem
SKU availability by region/zone changes frequently. Hardcoding it creates stale data.

### Decision

**`skus.yaml` contains only stable metadata:**

```yaml
# kb/skus.yaml
- name: Standard_D4s_v3
  family: Dsv3
  series: D
  vCPUs: 4
  memoryGB: 16
  maxDataDisks: 8
  tempDiskGB: 32
  premiumIO: true
  acceleratedNetworking: true
  generation: [Gen1, Gen2]
  processor: Intel

  # NOT included:
  # - availableRegions (changes)
  # - availableZones (changes)
  # - pricing (changes)
```

**For availability checks:**

- **v1 (current):** User selects from known SKUs, no availability validation
- **v2 (future):** Optional Azure API enrichment at runtime

### Rationale
- Stable data = fewer KB updates
- Availability is a "live" concern, not a "knowledge" concern
- API enrichment is the right solution (later)

---

## Decision 6: Rule Sources (Credibility)

### Decision

**Every rule should have a `sources` array:**

```yaml
- id: resize-vm-cross-family
  name: Cross Family Resize
  # ... other fields ...

  sources:
    - title: "Resize a VM - Azure Docs"
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/resize-vm"
    - title: "VM sizes overview"
      url: "https://learn.microsoft.com/en-us/azure/virtual-machines/sizes"
```

**Schema:**

```typescript
export const SourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

export const RuleSchema = z.object({
  // ... other fields ...
  sources: z.array(SourceSchema).optional().default([]),
});
```

### Rationale
- Credibility for users ("why should I trust this?")
- Reduces PR disputes ("source says X")
- Helps maintainers verify accuracy

---

## Decision 7: ID Uniqueness & Deprecation

### Decision

**Validation rules:**

1. **All rule IDs must be unique** - CI fails on duplicate
2. **IDs are immutable** - once published, never renamed
3. **Deprecation via flag, not deletion:**

```yaml
- id: old-rule-name
  deprecated: true
  deprecatedBy: new-rule-name  # Points to replacement
  deprecatedAt: "2024-01-15"
```

**CI script:**

```typescript
// scripts/lint-ids.ts
function validateIds(rules: Rule[]) {
  const ids = rules.map(r => r.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

  if (duplicates.length > 0) {
    console.error(`Duplicate IDs: ${duplicates.join(", ")}`);
    process.exit(1);
  }

  // Check deprecated rules have replacement
  for (const rule of rules) {
    if (rule.deprecated && !rule.deprecatedBy) {
      console.warn(`Deprecated rule ${rule.id} has no replacement`);
    }
  }
}
```

### Rationale
- Golden cases reference IDs - changing them breaks tests
- Deprecation allows gradual migration
- CI enforcement prevents accidents

---

## Final Schema Summary

```typescript
// schemas/rule.schema.ts
import { z } from "zod";

export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "ne", "in", "nin", "exists", "notExists", "gt", "gte", "lt", "lte", "matches"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())]),
});

export const ImpactSchema = z.object({
  reboot: z.enum(["none", "possible", "likely", "guaranteed"]).optional(),
  downtime: z.enum(["none", "low", "medium", "high"]).optional(),
  risk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
  networkReset: z.boolean().optional(),
  dataLossRisk: z.boolean().optional(),
  reason: z.string(),
  affectedComponents: z.array(z.string()).optional(),
});

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

export const RuleSchema = z.object({
  // Identity
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string(),

  // Classification
  type: z.enum(["rule", "blocker", "override"]).default("rule"),
  layer: z.enum(["infra", "guest"]),

  // Targeting
  actions: z.array(z.string()),
  conditions: z.array(ConditionSchema).default([]),

  // Override-specific
  overrideTargets: z.array(z.string()).optional(), // Required if type=override

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

export type Rule = z.infer<typeof RuleSchema>;
```

---

## Migration Impact

These decisions are **additive** - existing rules continue to work:

| Change | Migration Effort |
|--------|------------------|
| `category` → `type` + `layer` | Search/replace |
| Extended disk schema | Optional fields, no breakage |
| `targetDisk` computed field | Engine change only |
| `overrideTargets` required | Only for new override rules |
| `sources` array | Optional, add gradually |

---

## Next Steps

1. ✅ Review and approve this RFC
2. Update schemas with these decisions
3. Update engine with `targetDisk` lookup
4. Begin YAML migration with new schema

---

## Changelog

- **2024-12-17:** Initial draft
