# EMPIREAI PRODUCTION TRUTH

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P1-10 · CON-009 (framework — route/Pillow mode detail CON-007 · CON-008)  
> **Constitutional phase:** P1 — Identity Foundation (final P1 artifact)  
> **Dependencies:** P1-01 · P1-02 · P1-03 · P1-04 · P1-05 · P1-06 · P1-07 · P1-08 · P1-09  
> **Authority:** Grand King  
> **Established:** 2026-07-05  
> **Role:** Define what EmpireAI accepts as **reality** — permanently separate assumptions from facts  
> **Operational companion:** [`EMPIREAI_STATUS.md`](../../EMPIREAI_STATUS.md) (live now-state) · [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md) (deploy sequence) · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](../architecture/EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md) (P3-06)

**Terminology:** [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) · **Repository:** [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) · **Reasoning:** [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) · **Governance map:** [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) (P2-01)

---

## 1. Purpose

Production Truth defines **what EmpireAI accepts as true** about live operation, implementation, design, and proof.

No engineering decision, architecture decision, roadmap declaration, or production claim may **contradict** Production Truth once recorded and accepted. Assumptions, hypotheses, and simulations are **explicitly labelled** — never passed off as production fact (CTD-017 · CTD-018 · CTD-019).

**The principle:** Production is operational truth · Repository is implementation truth · Architecture is design truth · Vision is purpose · Soul is continuity · Constitution is governance · Roadmap is execution sequence — **each one responsibility; none replaces another.**

---

## 2. Canonical Relationships

| Document | Truth role |
|----------|------------|
| [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) | **Purpose truth (WHY)** — not operational fact |
| [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md) | **Continuity truth (WHO)** — not live metrics |
| CTD + constitutions | **Governance truth** — bounds all claims |
| [`EMPIREAI_ROADMAP.md`](../../EMPIREAI_ROADMAP.md) · Lock | **Execution intent (WHAT NEXT)** — not proof of live |
| [`docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`](../architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) | **Design truth (HOW should be)** |
| [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) | **Where artifacts live** |
| [`EMPIREAI_STATUS.md`](../../EMPIREAI_STATUS.md) | **Operational snapshot (now)** |
| [`JOURNEY.md`](../../JOURNEY.md) | **Structural programme truth** |
| Evidence audits | **Point-in-time proof** — never law |

---

## 3. Truth Types — Definitions

| Term | Official definition | Source of truth | Cite as current fact? |
|------|---------------------|-----------------|------------------------|
| **Production Truth** | This doctrine + accepted live-surface records (STATUS, deploy manifests, health probes) | Grand King · Production ops | **Yes** — for "what runs live" |
| **Repository Truth** | Implemented code + Canonical/Operational docs in git — [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) | Repository · Journey sync | **Yes** — for "what is built" |
| **Architecture Truth** | Normative target — Canonical Architecture + ADRs | Chief Architect | **Yes** — for "how it should be shaped" |
| **Documentation Truth** | ECDS-classified docs — classification determines authority | Per doc owner | **Per class** (Canonical yes; Evidence no) |
| **Operational Truth** | Current implementation map — `docs/ARCHITECTURE.md`, STATUS, runbooks | Maintainers | **Yes** — for "what dev/prod docs say now" |
| **Historical Truth** | Superseded records — immutable but **zero authority** | Archive | **Never** |
| **Evidence** | Immutable audit / mission proof | Mission date | **Proof only** |
| **Assumption** | Belief not yet validated by Repository or Production Acceptance | Must be labelled | **No** |
| **Hypothesis** | Testable assumption awaiting PROOF | Mission brief | **No** |
| **Simulation** | Non-production exercise — architecturally separate from live (CTD-018) | Simulation env | **No** — never cite as MS-A proof |

---

## 4. Truth Hierarchy (Constitutional Precedence)

When resolving "what is true **right now**" for operational decisions:

```
1. Reality observed in production
        (health probes · Grand King live use · incident logs · metrics)
        ↓
2. Production Truth (this doctrine + STATUS + accepted deploy policy)
        ↓
3. Repository Evidence
        (commits · tests · Journey rows · Repository Acceptance PROOF)
        ↓
4. Architecture Truth
        (Canonical Architecture · ADRs — normative)
        ↓
5. Documentation Truth
        (Operational guides · runbooks — may lag architecture)
        ↓
6. Historical Evidence
        (superseded audits · old blueprints — context only)
        ↓
7. Assumptions / Hypotheses / Simulation
        (explicitly labelled — lowest authority)
```

**Governance truth (parallel stack — bounds all layers):**

```
Grand King sovereignty
    ↓
Commercial Constitution (CTD)
    ↓
Domain constitutions · Framework
    ↓
Vision · Soul (identity — WHY/WHO)
```

**Rule:** Higher layer in **operational stack** wins for "what is live." **CTD always wins** on commercial legality regardless of production behaviour — if production violates CTD, production is **wrong**, not CTD.

---

## 5. Production Principles — One Responsibility Each

| Layer | Single responsibility | Must not |
|-------|----------------------|----------|
| **Vision** | Purpose (WHY) | Declare live integrations exist |
| **Soul** | Continuity memory (WHO) | Store runtime logs or metrics |
| **Constitution** | Governance (WHAT MUST BE TRUE) | Describe UI layout |
| **Roadmap** | Execution sequence (WHAT NEXT) | Replace PROOF |
| **Architecture** | Design truth (HOW should be) | Claim deployment completed |
| **Repository** | Implementation truth (what is merged) | Replace production observation |
| **Production** | Operational truth (what runs live) | Override CTD or Vision |
| **Evidence** | Proof of past states | Become silent law |

---

## 6. Mandatory Acceptance Model

**No mission, roadmap item, or production feature is complete until all three acceptances are satisfied.**

| # | Acceptance | Question answered | Typical proof | Approver |
|---|------------|-------------------|---------------|----------|
| **1** | **Repository Acceptance** | Implemented correctly in repo? | Tests · docs · Journey row · scope match · Cursor Output Standard | Pillow supervisor · Architect (constitutional) |
| **2** | **Production Acceptance** | Working correctly in **production**? | Deploy success · `/health/live` · smoke tests · Production Truth update | Grand King + Architect/DevOps policy |
| **3** | **Grand King Acceptance** | Grand King can **use it exactly as intended**? | GK sign-off · live walkthrough · commercial gate if irreversible | **Grand King** |

```
Repository Acceptance  →  code/docs truth
Production Acceptance  →  live environment truth
Grand King Acceptance  →  sovereign usable truth
        ↓
Mission COMPLETE (PROOF valid)
```

**Rules:**

- Missing any acceptance → mission status **not complete** — may be "Repository Accepted, Production Pending."
- **PROOF** in reasoning model requires all three for production-facing features.
- Commercial irreversibles require explicit **Grand King Acceptance** even if 1–2 pass.
- CON missions may complete at Repository Acceptance if explicitly non-production (documentation-only).

→ [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) · Acceptance entries

---

## 7. Truth Conflict Resolution

When Production, Repository, Architecture, Documentation, Historical Evidence, Vision, or Constitution **appear to conflict**:

### 7.1 Resolution procedure

| Step | Actor | Action |
|------|-------|--------|
| 1 | Discoverer | Document conflict — cite both sources + observed production reality |
| 2 | Pillow | Compare stack §4 — classify as drift, lag, or violation |
| 3 | Chief Architect | Determine normative vs operational vs evidence mismatch |
| 4 | Resolution class | **Fix production** · **Fix repo** · **Fix doc** · **ADR amendment** · **Grand King decision** |
| 5 | Record | ADR or JOURNEY_AUDIT row + Production Truth amendment + accumulation if OP/BP |
| 6 | Escalate | CTD/Vision touch → Grand King + CONSTITUTIONAL REVIEW |

### 7.2 Common conflict patterns

| Conflict | Winner | Action |
|----------|--------|--------|
| Production vs CTD | **CTD** | Fix production — emergency GK directive |
| Production vs Canonical Architecture | **Architecture** (unless ADR supersedes) | Remediation mission or ADR |
| Repository vs Production | **Production observation** for live; **Repository** for intended fix | Deploy or rollback mission |
| Documentation vs Production | **Production** for live; update docs | Doc fix mission |
| Historical vs any current | **Current Canonical/Operational** | Label historical — do not cite |
| Vision vs Roadmap timing | **Vision** bounds; Roadmap sequences | Reorder roadmap — not Vision |
| Assumption vs Production Truth | **Production Truth** | Reject assumption; update register |

### 7.3 Drift reporting (Pillow)

Pillow continuously compares:

```
Vision → Repository → Production → Runtime → Evidence → Production Truth
```

**Output:** Constitutional drift report — open DI items · OP recommendations · escalation to Grand King if commercial or safety.

→ [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md) · [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md)

---

## 8. Current Production Surface (Accepted Truth Baseline)

*Baseline as of doctrine establishment — update via amendment rows when Production Acceptance completes deploy changes.*

| Domain | Accepted truth | Reference |
|--------|----------------|-----------|
| **Deploy stack** | Vercel (Founder Shell `frontend/`) + Railway (Brain/Pillow) + Upstash Redis + SQLite volume | [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md) |
| **Execution path** | Browser → BFF/API → Brain orchestrator — no direct LLM from browser | ADR-001 · ADR-010 |
| **Technical ownership** | Pillow-owned → Brain-executed → Cockpit-operated | Canonical Architecture §1 |
| **Cockpit authority** | `empireai-web/` vs `frontend/` — **CON-006 / ADR-CON-001 pending Grand King** | Do not assume Cockpit is production URL until GK decision |
| **Live status** | Certification Mode · blockers B5–B8 open · live revenue not proven | [`EMPIREAI_STATUS.md`](../../EMPIREAI_STATUS.md) |
| **Honesty rule** | Simulation ≠ production · never pretend live (CTD-017–019) | Soul §8 · Vision §29 lineage |
| **Route policy** | `EMPIRE_ENABLE_EXTENSION_ROUTES` — **CON-007 detail pending** | Flag as assumption until documented |
| **Pillow production mode** | Minimal chat vs full COI — **CON-008 detail pending** | Flag as assumption until documented |

**Rule:** Rows marked **pending** are **not** production claims — they are **explicit gaps** tracked on Constitutional Roadmap P5.

---

## 9. Responsibilities

| Role | Production Truth duty |
|------|----------------------|
| **Grand King** | Production Acceptance · Grand King Acceptance · sovereign override |
| **Chief Architect** | Doctrine maintenance · conflict adjudication · CON-007–009 execution |
| **Pillow COI** | Drift compare §7.3 · supervisor acceptance verification · OP accumulation |
| **Brain / DevOps** | Health truth · deploy manifests · incident evidence |
| **Builder** | Repository Acceptance evidence · never claim Production Acceptance without deploy proof |
| **Governance maintainer** | STATUS sync · Production Truth amendment integrity |

**Owner (constitutional):** Grand King · **Maintainer:** Chief Architect + Production ops

---

## 10. Governance

| Change type | Approver | Record |
|-------------|----------|--------|
| Production Truth doctrine amendment | Grand King + CONSTITUTIONAL REVIEW if CTD-touching | Revision History |
| Accepted production surface row (§8) | Production Acceptance + Architect | This doc §8 + STATUS |
| Route / Pillow mode policy (CON-007/008) | Grand King | Append §8 + deployment docs |
| Conflict resolution precedent | Chief Architect | ADR + optional OP in accumulation register |

**Classification:** This document is **Canonical** (governance law). `EMPIREAI_STATUS.md` is **Operational** (live snapshot). Do not merge them — cross-link.

**Amendment chain:** Production observation → Pillow review → Architect draft → Production Acceptance → Grand King Acceptance for commercial surfaces.

---

## 11. Examples

### Example 1 — Three acceptances

REAL-127 persistence fix: (1) tests pass in repo ✓ Repository Acceptance · (2) `/health/live` stable 24h on Railway ✓ Production Acceptance · (3) Grand King confirms Pillow session survives refresh ✓ Grand King Acceptance → **Mission complete.**

### Example 2 — Incomplete mission

Code merged, tests green — **Repository Acceptance only.** Production not deployed → **not complete** for production-facing REAL.

### Example 3 — Assumption vs truth

"We probably have Redis in prod" → **Assumption.** Production Truth cites `REDIS_URL` configured + health check passing → **fact.**

### Example 4 — Simulation

`GRAND_KING_OPERATION_SIMULATION.md` updates **repository understanding** — not MS-A proof. Simulation ≠ Production (CTD-018).

### Example 5 — Conflict

Docs claim full Pillow COI in prod; observation shows minimal chat only → **Production wins** for live truth; docs updated under CON-008; not a Vision change.

---

## 12. Future Evolution

| Mechanism | When |
|-----------|------|
| **§8 baseline rows** | Append when deploy surface changes |
| **CON-007 · CON-008** | Expand route and Pillow mode into §8 — P5 execution |
| **CON-010–012** | Brain durability truths append under Production + Repository |
| **ADR** | Any production policy shift |
| **P1-10+ / CON-020+** | New truth types register in [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) |
| **V2** | Postgres primary · full COI prod · requires GK + ADR — not silent |

---

## 13. Validation Checklist

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · Constitution · Roadmap · Architecture · Repository · Documentation | §2 · §5 |
| No duplicated authority | §4 · §5 single responsibility |
| No ambiguity on truth types | §3 |
| Three acceptances mandatory | §6 |
| Conflict procedure defined | §7 |
| Pillow drift duty defined | §7.3 |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P1-10 | Initial Production Truth doctrine — final P1 Identity artifact |

---

## Related

- [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md) P5 · CON-007–009  
- [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md) §14  
- [`EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md`](../../EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md)  
- [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md)
