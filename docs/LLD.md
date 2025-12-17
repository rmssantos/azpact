
# Low Level Design (LLD)
## Azure Change Impact Radar

**Date:** 2025-12-16

---

## 1. Core Data Structures

### 1.1 Context Object

Represents the VM and its configuration.

```yaml
vm:
  sku: Standard_D4s_v5
  generation: Gen2
  zonal: true

os:
  family: Linux
  distro: Ubuntu
  version: 22.04

disks:
  - lun: 0
    role: os
  - lun: 1
    role: data
    topology: lvm
    vg: vgdata
    lv: lvapp
    mount: /mnt/app

action:
  type: DetachDisk
  target_lun: 1
```

---

## 2. Rule Types

### Infra Rules
Model Azure platform behavior:
- resize → reboot/downtime
- redeploy → temp disk loss

### Guest Rules
Model OS and filesystem behavior:
- LVM PV removal
- RAID degradation
- filesystem resize requirements

### Blockers
Hard-stop unsupported operations:
- SKU unavailable
- unsupported disk type

---

## 3. Rule Evaluation Flow

1. Load all rules
2. Match rules against context
3. Apply blockers first
4. Aggregate infra impact
5. Aggregate guest impact
6. Generate explanation and mitigations

---

## 4. Impact Model

### Infra Impact
```yaml
reboot: none | possible | likely | guaranteed
downtime: none | low | medium | high
```

### Guest Impact
```yaml
risk: low | medium | high | critical
reason: string
affected_components: list
```

---

## 5. Determinism

- Same input always produces same output
- No probabilistic logic
- All decisions traceable to rules

---

## 6. Extensibility

- New rules added as YAML
- New actions without engine rewrite
- VMSS and APIs added later without breaking v1

