# EMPIREAI ARCHITECTURE CONSTRAINTS — ACD-001 → ACD-030

> **Immutable.** Version 1.0.0  
> **Architecture Law:** [`docs/architecture/EMPIREAI_ARCHITECTURE_LAW.md`](./docs/architecture/EMPIREAI_ARCHITECTURE_LAW.md) (P2-05)  
> This document is the permanent Architecture Constraint layer of EmpireAI.  
> It is **NOT** runtime logic. It defines what EmpireAI is allowed to become technically.  
> No future module may violate these constraints. Empire Review validates compliance per ACD-030.

**Canonical source:** `backend/src/foundation/empire-architecture-constraints/catalog/acd-catalog.ts`  
**API:** `GET /empire-architecture-constraints/catalog` · `GET /empire-architecture-constraints/dependency-review` · `GET /empire-architecture-constraints/compliance`

---

## ACD-001 — Modular Architecture

Architecture must be modular.

## ACD-002 — Single Primary Responsibility

Every module has exactly one primary responsibility.

## ACD-003 — No Business Logic In UI

Business logic must never live inside UI.

## ACD-004 — No Duplicated Business Logic

Business logic must never be duplicated.

## ACD-005 — Public Contracts

Every module must expose public contracts.

## ACD-006 — Defined Inputs

Every module must define its inputs.

## ACD-007 — Defined Outputs

Every module must define its outputs.

## ACD-008 — Explicit Dependencies

Dependencies must always be explicit.

## ACD-009 — No Hidden Dependencies

Hidden dependencies are forbidden.

## ACD-010 — No Circular Dependencies

Circular dependencies are forbidden.

## ACD-011 — Runtime Health

Every runtime must expose health.

## ACD-012 — Runtime Status

Every runtime must expose status.

## ACD-013 — Runtime Readiness

Every runtime must expose readiness.

## ACD-014 — Runtime Blockers

Every runtime must expose blockers.

## ACD-015 — Runtime Version

Every runtime must expose version.

## ACD-016 — Shared Models Never Diverge

Shared models must never diverge.

## ACD-017 — Reuse Shared Intelligence

Shared intelligence must always be reused.

## ACD-018 — One Capability One Owner

One capability. One owner.

## ACD-019 — Published API Surface

Every module must publish its API surface.

## ACD-020 — Declare Non-Ownership

Every module must declare what it does NOT own.

## ACD-021 — Future Marketplaces

Architecture must support future marketplaces without redesign.

## ACD-022 — Future Suppliers

Architecture must support future suppliers without redesign.

## ACD-023 — Future AI Models

Architecture must support future AI models without redesign.

## ACD-024 — Future Payment Providers

Architecture must support future payment providers without redesign.

## ACD-025 — Future Countries

Architecture must support future countries without redesign.

## ACD-026 — Adapters Isolate Complexity

Adapters must isolate third-party complexity.

## ACD-027 — Provider-Independent Intelligence

Core intelligence must remain provider-independent.

## ACD-028 — No Direct Supplier Dependency

No module may directly depend on supplier implementation.

## ACD-029 — No Direct Marketplace Dependency

No module may directly depend on marketplace implementation.

## ACD-030 — Validated During Empire Review

Architecture constraints must be validated during Empire Review.

---

*Architecture Constraints Version 1.0.0 — immutable catalog. See `COMBINED_EXECUTIVE_AUDIT_ACD-001-030.md` for delivery audit.*
