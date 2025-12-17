
# Azure Change Impact Radar — Project Overview

**Date:** 2025-12-16  
**Project Type:** Open-source (community-driven)  
**Scope:** Azure Virtual Machines (initially)

---

## 1. What is this project?

**Azure Change Impact Radar** is an open-source decision-support tool that helps engineers understand the **real impact of changes performed on Azure Virtual Machines** — before those changes are executed.

The project answers a simple but critical question:

> *“If I change this on my VM, what will actually happen?”*

This includes:
- Azure platform impact (reboots, downtime, redeploys)
- Guest OS impact (disk layout, LVM/RAID, mounts, data loss risk)
- Clear, actionable mitigation steps

---

## 2. Why does this project exist?

In real-world operations, VM changes often cause incidents because:

- Azure documentation is fragmented and context-dependent
- Impact varies by OS, SKU, disk configuration, and topology
- Guest OS behavior (LVM, RAID, mounts) is rarely considered
- Knowledge lives in people’s heads, not in systems

This project exists to **externalize that knowledge** into a structured, reusable, and explainable system.

---

## 3. What problems does it solve?

Azure Change Impact Radar helps prevent:

- Unexpected VM reboots
- Application outages caused by disk detaches
- Data loss from redeploys or temp disks
- Failed changes due to unsupported SKUs or configurations
- Slow or unclear change approvals

It turns *tribal knowledge* into *shared knowledge*.

---

## 4. Who is this for?

Primary users:
- Azure infrastructure engineers
- Support and escalation engineers
- SRE / operations teams

Secondary users:
- Cloud architects
- Engineering managers
- Advanced Azure customers

---

## 5. What does the user actually do?

1. The user **describes their VM**:
   - SKU, generation, zones
   - OS and version
   - Disks and topology (raw, LVM, RAID, etc.)

2. The user **chooses an action**:
   - Resize VM
   - Resize disk
   - Detach disk
   - Redeploy VM

3. The system **generates an impact report**:
   - Azure platform impact
   - Guest OS & application impact
   - Required and recommended mitigations

---

## 6. What makes this project different?

Unlike traditional tools:

- ❌ It does not rely on “best guesses”
- ❌ It does not hide complexity behind vague warnings
- ❌ It is not a black box

Instead, it is:
- Deterministic
- Explainable
- Rule-based
- Community-maintained
- Designed around *real operational failure modes*

---

## 7. What this project is NOT

- Not an Azure monitoring tool
- Not an official Microsoft product
- Not a replacement for testing or change management
- Not an AI guessing engine

---

## 8. Long-term vision

Over time, the project can expand to:
- VM Scale Sets (VMSS)
- Automated pre-change checks in CI/CD
- Optional Azure API enrichment
- Exportable change-risk reports

But the core principle remains:

> **Understand impact before change — not after incident.**

---

## 9. Open-source philosophy

This project is designed to be:
- Transparent
- Auditable
- Easy to contribute to
- Useful even without cloud credentials

All logic lives in readable YAML and Markdown, not hidden code paths.

---

## 10. Summary

Azure Change Impact Radar exists to make VM changes:

- Safer
- Predictable
- Explainable
- Reproducible

It bridges the gap between **Azure platform behavior** and **guest OS reality**.
