# Canonical Empire Knowledge & Learning System (EKLS)

> **Status:** ✅ **PERMANENT CANONICAL SPECIFICATION**  
> **Authority:** Grand King · Pillow Governance  
> **Registered:** 2026-06-21  
> **Amendment policy:** Future evolution **amends this document only**. There shall never be EKLS-002, EKLS V2, alternate specifications, parallel implementations, or competing architectural documents.

---

## Constitution

EKLS is **NOT** an AI Engine.

EKLS is **NOT** a Business Engine.

EKLS is **NOT** part of Brain.

EKLS is **NOT** part of Cockpit.

EKLS is **NOT** an independent platform authority.

EKLS is a **permanent subsystem owned, governed, supervised and evolved by Pillow**.

Pillow is solely responsible for:

- Knowledge governance
- Memory governance
- Learning governance
- Evidence governance
- Confidence governance
- Knowledge quality
- Memory integrity
- Evolution
- Versioning
- Recovery
- Continuous improvement

**No subsystem owns long-term knowledge except EKLS under Pillow governance.**

---

## Canonical Platform Hierarchy

```
Grand King
    │
EmpireAI
    │
Pillow
    │
    ├── Brain
    ├── EKLS                          ← this specification
    ├── Registry System
    ├── Mission System
    ├── Executive Audit System
    ├── Guardian
    ├── Executive AI Engines
    │     ├── Product Intelligence
    │     ├── Market Intelligence
    │     ├── Supplier Intelligence
    │     ├── Financial Intelligence
    │     ├── Quantitative Intelligence
    │     ├── Advertising Intelligence
    │     ├── Customer Intelligence
    │     ├── Risk Intelligence
    │     ├── Decision Intelligence
    │     └── Executive Intelligence Orchestrator
    ├── Business Engines
    │     ├── Marketplace Engine
    │     ├── Supplier Engine
    │     ├── Storefront Engine
    │     ├── Advertising Engine
    │     ├── Payment Engine
    │     ├── Logistics Engine
    │     └── Analytics Engine
    ├── Grand King Cockpit
    └── Future Platform Services
```

**Authority:** `EMPIREAI_PILLOW_CONSTITUTION.md` §17 — Pillow is sole technical owner of EmpireAI and every listed subsystem.

---

## Purpose

EKLS is the **institutional memory** of EmpireAI.

| Subsystem | Role |
|-----------|------|
| Brain | Executes |
| Executive AI Engines | Analyse |
| Business Engines | Execute commerce |
| Cockpit | Visualises |
| Pillow | Governs |
| **EKLS** | **Remembers · learns · preserves** |

EKLS never forgets unless governed by Pillow.

---

## Objectives

EKLS is the canonical owner of:

Business Knowledge · Operational Knowledge · Experience · Historical Outcomes · Evidence · Observations · Patterns · Confidence History · Decision History · Feature History · Model Metadata · Semantic Memory · Knowledge Relationships · Cross-engine memory · Cross-workflow memory · Cross-company memory (with workspace isolation).

---

## Internal Architecture — Permanent Subsystems

| Subsystem | Purpose |
|-----------|---------|
| **Knowledge Store** | Canonical business facts |
| **Experience Store** | Historical operational experience |
| **Learning Store** | Accumulated learned knowledge |
| **Evidence Store** | Supporting evidence |
| **Decision History** | Historical decisions |
| **Outcome History** | Observed outcomes |
| **Confidence History** | Confidence evolution |
| **Observation Store** | Platform observations |
| **Pattern Store** | Discovered behavioural patterns |
| **Feature Store** | Reusable analytical features (never hardcoded in engines) |
| **Model Store** | Model metadata (not external model weights) |
| **Knowledge Graph** | Relationships — queryable, not hardcoded |
| **Semantic Memory** | Meaning-based retrieval — provider independent |
| **Vector Memory** | Reserved |
| **Document Memory** | Repository knowledge |
| **Workflow Memory** | Workflow history |
| **Mission Memory** | Mission history |
| **Audit Memory** | Executive audit history |
| **Connector Memory** | Connector history |
| **Marketplace Memory** | Marketplace knowledge |
| **Supplier Memory** | Supplier knowledge |
| **Customer Memory** | Customer knowledge |
| **Financial Memory** | Financial knowledge |
| **Advertising Memory** | Advertising knowledge |
| **Product Memory** | Product knowledge |
| **Country Memory** | Country knowledge |
| **Brand Memory** | Brand knowledge |
| **Category Memory** | Category knowledge |

Implementation registry: `backend/src/orchestration/pillow/ekls/storage/store-registry.ts`

---

## Ownership

Only Pillow owns EKLS.

Brain · Executive AI Engines · Business Engines · Cockpit · Registry System · Future services — **shall never bypass Pillow**.

Every EKLS interaction is governed by Pillow via the **EKLS Governance Gateway**.

---

## Knowledge Object Standard

Every stored object shall support:

Unique Identity · Workspace · Company · Brand · Category · Object Type · Source · Timestamp · Version · Confidence · Evidence · Relationships · Lifecycle State · Quality State · Governance State · Owner · Revision History

Contract: `backend/src/orchestration/pillow/ekls/contracts/knowledge-object-standard.ts`

---

## Lifecycles

| Domain | Stages |
|--------|--------|
| **Knowledge** | Discover → Validate → Store → Link → Version → Govern → Retrieve → Reuse → Supersede → Archive → Recover → Retire |
| **Experience** | Observe → Capture → Classify → Store → Link → Evaluate → Learn → Retain → Archive → Recover |
| **Learning** | Observe → Compare → Identify Patterns → Measure Confidence → Accumulate Experience → Improve Knowledge (never overwrite history; never destroy evidence) |
| **Evidence** | Collect → Validate → Link → Store → Rank → Reference → Archive → Recover |
| **Confidence** | Initial → Evidence adjustment → Historical adjustment → Experience adjustment → Model adjustment → Human override → Pillow governance → Historical preservation |
| **Decision** | Proposal → Analysis → Decision → Execution → Outcome → Evidence → Lessons → Future reference |

Contract: `backend/src/orchestration/pillow/ekls/contracts/lifecycles.ts`

---

## Integration Rules

### Brain

May request: Store · Retrieve · Search · Link · Summarise · Compare — **never owns knowledge**.

### Executive AI Engines

May: Read · Store · Reference · Link · Contribute observations · Contribute evidence · Contribute confidence — **never become owner**.

### Business Engines

Contribute operational knowledge (orders, payments, inventory, advertising, marketplace, supplier, customer, execution history) — **never own historical memory**.

### Cockpit

Visualises EKLS — **never source of truth; never stores business knowledge**.

### Registry System

Registries remain authoritative configuration. EKLS references registries; **does not duplicate** them.

### Guardian

Records failures, recoveries, incidents, rollback history, anomalies — **contributes memory; does not govern memory**.

---

## Workspace Isolation

Every workspace remains isolated. Knowledge cannot leak between workspaces. Cross-workspace intelligence requires explicit Pillow approval.

Policy: `backend/src/orchestration/pillow/ekls/policies/workspace-isolation-policy.ts`

---

## Security

Every access supports: Authentication · Authorisation · Auditability · Encryption · Versioning · Integrity verification · Recovery

---

## Governance

Pillow governs knowledge quality, confidence quality, memory quality, evidence quality, retention, deletion, recovery, learning, evolution.

**EKLS performs nothing without Pillow governance.**

Gateway: `backend/src/orchestration/pillow/ekls/services/ekls-governance-gateway.ts`

---

## Hardcode Governance

No business knowledge shall be hardcoded. No marketplace, supplier, country, pricing, or scoring assumptions in engines.

Everything business-related originates from: **Registry System · Workspace data · Operational history · Pillow governance**.

---

## Plugin Architecture

Future plugins register through **Pillow only** (never EKLS directly): knowledge types · feature generators · evidence providers · relationship builders · learning providers · search providers · model evaluators · validation rules.

---

## Future Compatibility

Designed for: graph databases · vector databases · SQL · object storage · document storage · future AI/search/memory providers — **no vendor lock-in**.

---

## Repository Structure

```
backend/src/orchestration/pillow/ekls/
├── contracts/          Knowledge object standard, lifecycles, subsystem registry
├── policies/           Ownership, workspace isolation, access
├── storage/            Store registry (subsystem → integration backend mapping)
├── services/           Governance gateway, unified executive intelligence service
└── index.ts

pillow/                 Pillow package runtime (repository memory, learning pipeline)
backend/src/orchestration/executive-learning/   Legacy Learning Store integration (Pillow-governed)
backend/src/runtime/empire-knowledge/           Legacy Knowledge Graph integration (Pillow-governed)
```

---

## Legacy Integration Map (Pillow-Governed)

| EKLS Subsystem | Current Integration Backend | Notes |
|----------------|----------------------------|-------|
| Learning Store | `executive-learning` / `executive_knowledge_base` | GK-approved learnings |
| Knowledge Store / Graph | `runtime/empire-knowledge` | Commerce knowledge objects |
| Document Memory | `pillow/src/memory` | Repository-derived memory |
| Observation Store | Executive Learning pending + empire-knowledge learning records | Consolidating under EKLS |
| Feature Store | EKLS registry (architecture) | Engines register features; no hardcoding |
| Model Store | EKLS registry (architecture) | Metadata only |
| Audit Memory | `artifacts/` executive audits | Referenced, not duplicated |

---

## Consumer Channels

Brain · Executive AI Engines · Business Engines · Cockpit · Global AI Assistant · Guardian · Executive Audits · Mission System · Future platform services

Unified service: `backend/src/orchestration/pillow/ekls/services/ekls-unified-service.ts`

---

## Amendment Log

| Date | Change |
|------|--------|
| 2026-06-21 | Initial canonical specification — G3 suite complete, EKLS institutionalised under Pillow |
| 2026-06-21 | Constitutional amendment — expanded Platform Hierarchy with Executive AI Engines and Business Engines enumerations; aligned with `EMPIREAI_PILLOW_CONSTITUTION.md` §17 |

---

**This document is the sole canonical EKLS specification. All other documents reference this file; they do not redefine EKLS.**
