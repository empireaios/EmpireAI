# Pillow Version 1 — Delivery Mode

> **Canonical label:** Pillow Version 1 Delivery Mode  
> **Authority:** Grand King Executive Directive · EmpireAI Version 1  
> **Status:** ✅ **ACTIVE** — adopted 2026-06-29 · **awaiting Grand King approval to execute delivery missions**  
> **Prior mode:** Pillow Architecture & Expansion (closed — Layer 1 runtime complete)  
> **Canonical owner:** Pillow Architecture · Runtime Engineering · Project State  
> **Companion artifacts:** `docs/governance/VERSION_1_CERTIFICATION_MODE.md` · `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` §10 · `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` · `EMPIREAI_PILLOW_CONSTITUTION.md`

---

## 1. Delivery principle

**Pillow architecture is complete for EmpireAI Version 1.**

Layer 1 Pillow Runtime (PILLOW-002→PILLOW-019), master constitution, Executive Perspectives, and Constitutional Laws 1–7 are **doctrine-complete and runtime-wired** (Product Integration **Phase 0 ✅**).

All remaining Pillow work transitions to **Delivery Mode** until Version 1 executive certification.

| Rule | Requirement |
|---|---|
| **D1 — No new constitutional architecture** | No new Pillow constitution sections, laws, or governance doctrines unless Grand King explicitly directs a constitutional amendment mission |
| **D2 — No new runtime architecture** | No new Pillow subsystems or PILLOW-0xx modules unless **required** to resolve a verified Version 1 certification blocker (B5–B8) |
| **D3 — Delivery scope only** | Remaining Pillow work limited to **Product Hardening**, **Operational Readiness**, and **Commercial Go-Live** |
| **D4 — Post-V1 frozen** | PEI (Layer 2), Commercial Intelligence, and Supplier Intelligence remain **post-Version 1** — Product Integration Phase 4 deferred |
| **D5 — Certification alignment** | Pillow Delivery Mode operates **within** EmpireAI Certification Mode — blocker-first priority preserved |

---

## 2. Relationship to Empire Certification Mode

| Empire mode | Pillow mode |
|---|---|
| **Certification Mode** (ADR-048) | Governs **all** EmpireAI engineering — blocker register SSOT |
| **Pillow Delivery Mode** (this policy) | Governs **Pillow-specific** work — delivery phases 1–3 only |

A Pillow mission is **admitted** only if it satisfies **both**:

1. Empire Certification Mode execution rule (blocker closure **or** explicit GK exception), **and**
2. Pillow Delivery Mode execution rule (blocker **or** approved Product Integration Phase 1–3)

---

## 3. Delivery scope (permitted work)

| Category | Product Integration Phase | Examples |
|---|---|---|
| **Product Hardening** | **Phase 1** | Constitutional fields on proposal UI · Executive Perspectives copy sync · Improvement Vault review surface · chat → approve → audit integration tests |
| **Operational Readiness** | **Phase 2** | GC-03/GC-05 federation · Mission Home Pillow status · UX-014 approvals mirror · bootstrap health surfacing |
| **Commercial Go-Live** | **Phase 3** | GK-GOLIVE gates · `PILLOW_DRY_RUN=false` posture · live Cursor Bridge handoff (approval-gated) · Pillow Master Audit re-score |

**Phase 0** (runtime wiring) is **complete** — no further Phase 0 missions.

**Phase 4** (Layer 2 on product surface) is **post-V1** — deferred until Certification Mode exits.

---

## 4. Execution rule

Every remaining Pillow mission **shall** declare in its mission header and Executive Audit:

```
Pillow Delivery Mode: ACTIVE
Blocker(s) addressed: B# [, B# …]          — if applicable
Product Integration Phase: 1 | 2 | 3         — if applicable
Phase step: [e.g. 1.3 Executive Perspectives UI copy]
```

| Condition | Action |
|---|---|
| Removes ≥1 certification blocker **or** completes an approved Phase 1–3 step | **Admit** — proceed pending Grand King mission approval |
| Neither blocker nor Phase 1–3 | **Defer** until after Version 1 executive certification |
| New PILLOW-0xx module proposed | **Reject** unless tied to blocker B5–B8 with documented necessity |
| Layer 2 / PEI implementation | **Defer** — Phase 4 post-V1 |
| New constitutional architecture | **Reject** — Delivery Mode D1 |

---

## 5. Explicitly deferred (Pillow)

| Item | Reason |
|---|---|
| PILLOW-020 or new runtime modules | Architecture complete — Delivery Mode D2 |
| PEI-001…028 implementation | Layer 2 post-V1 · Phase 4 |
| Commercial Intelligence depth | Post-V1 per ADR-045 |
| Supplier Intelligence | Post-V1 |
| New Executive Perspectives / constitutional laws | Doctrine complete — amendment missions only by GK directive |
| BL-C Pillow enhancement implementation | Register only unless blocker-linked |

---

## 6. Architecture completion statement

| Layer | V1 status |
|---|---|
| **Layer 1 — Pillow Runtime** | ✅ Complete — PILLOW-002→PILLOW-019 · Phase 0 |
| **Pillow constitution & Laws 1–7** | ✅ Complete |
| **Executive Perspectives** | ✅ Complete — single Pillow intelligence |
| **Layer 2 — Executive Intelligence (PEI)** | 🔵 Post-V1 — planning only |
| **Delivery Phases 1–3** | 🟡 Remaining V1 Pillow work |

---

## 7. Exit alignment

Pillow Delivery Mode concludes when **Certification Mode exits** (all blockers closed · GK-GOLIVE · PROOF-001 · V1 Executive Certification signed) **and** Product Integration Phases 1–3 exit criteria are met per `PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` §10.

Upon exit, Phase 4 (Layer 2 on product surface) may begin under separate Grand King-approved missions.

---

## 8. Repository synchronization

| Artifact | Role |
|---|---|
| `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md` | This policy |
| `EMPIREAI_PILLOW_CONSTITUTION.md` §16 | Constitutional cross-reference |
| `EMPIREAI_STATUS.md` | Pillow operating mode summary |
| `EMPIREAI_DECISIONS.md` ADR-049 | Decision register |
| `COMBINED_EXECUTIVE_AUDIT_PILLOW_VERSION_1_DELIVERY_MODE.md` | Adoption audit |

---

*Pillow Version 1 Delivery Mode · Grand King Executive Directive · 2026-06-29 · governance alignment only — no runtime modified · awaiting Grand King approval to execute delivery missions.*
