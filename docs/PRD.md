
# Product Requirements Document (PRD)
## Azure Change Impact Radar

**Date:** 2025-12-16  
**Status:** v1  
**Related document:** PROJECT_OVERVIEW.md

---

## 1. Objective

Provide a deterministic, explainable tool that allows users to understand the **impact of Azure VM changes before execution**, covering both Azure platform behavior and guest OS consequences.

---

## 2. Problem Statement

VM changes frequently cause incidents because:
- Impact depends on SKU, OS, disk layout, and topology
- Guest OS behavior is often ignored
- Documentation is fragmented
- Knowledge is not reusable

---

## 3. Goals

- Predict reboot, downtime, and data-loss risk
- Explain *why* an impact occurs
- Provide concrete mitigation steps
- Be usable without Azure credentials
- Be maintainable as open-source knowledge

---

## 4. Non-Goals

- Automatic environment discovery (v1)
- Runtime monitoring
- Guaranteeing zero downtime
- Replacing testing or change management

---

## 5. Target Users

- Azure infrastructure engineers
- Support / escalation engineers
- SRE / Ops teams
- Cloud architects

---

## 6. In-Scope Features (v1)

### VM Description
- SKU, generation, zonal/non-zonal
- OS family and version
- Disk inventory and topology (raw, LVM, RAID)

### Supported Actions
- Resize VM (SKU change)
- Resize OS disk
- Resize data disk
- Detach data disk
- Redeploy VM

### Output
- Azure platform impact
- Guest OS / application impact
- Required and recommended mitigations
- Human-readable explanation

---

## 7. Out of Scope

- VM Scale Sets
- PaaS services
- Auto-discovery via Azure APIs
- Application dependency graphs

---

## 8. Success Metrics

- Users can predict impact before change
- Reduced unexpected outages
- Faster and clearer change approvals
- Community contributions to rules

---

## 9. Constraints

- Manual input only (v1)
- Rule-based, deterministic logic
- No external API dependencies

