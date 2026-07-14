# EMPIREAI ENGINEERING CONSTITUTION

> **Classification:** CANONICAL — Tier 3 Law (Engineering)  
> **Document ID:** P2-03 · CON-015 (Autonomous Engineering Constitution map)  
> **Constitutional phase:** P2 — Constitution Foundation  
> **Dependencies:** P1 complete · P2-01 · P2-02 [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](./EMPIREAI_CORE_CONSTITUTION_CTD.md)  
> **Owner:** Chief Architect  
> **Authority:** CANONICAL · A2 — engineering law; **subordinate to CTD** on commercial conflict  
> **Parent:** CTD · [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./docs/governance/EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Children:** Cursor Output Standard · Cursor Recovery Doctrine · Mission policies · Engineering runbooks  
> **Supersedes:** Informal "EmpireAI Constitution" as unqualified supreme law; CON-015 naming ambiguity  
> **Ratified:** 2026-07-05 (P2-03)  
> **Role:** Permanent law governing **HOW** EmpireAI is engineered — not business, not commercial strategy  
> **Commercial apex:** [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](./EMPIREAI_CORE_CONSTITUTION_CTD.md) (CTD-040)

**Also known as:** Engineering Constitution · Autonomous Engineering Constitution (CON-015 mapped name)  
**Canonical path:** `EMPIREAI_CONSTITUTION.md` (ECNS-2 — do not fork)

**Governance map:** [`docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md`](./docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md)  
**Mission start chain:** [`docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md)  
**Acceptance model:** [`docs/governance/EMPIREAI_PRODUCTION_TRUTH.md`](./docs/governance/EMPIREAI_PRODUCTION_TRUTH.md) §6

---

## 1. Purpose

The Engineering Constitution is the **single permanent engineering law** of EmpireAI.

It governs **how** every engineer, AI worker, Builder mission, Cursor mission, architectural change, and production deployment is executed. It **does not** govern business strategy or commercial law — those belong to CTD and CBD.

**The principle:** Engineering begins with understanding · never implement before understanding WHY · CTD bounds all engineering · one engineering authority · no duplicate engineering constitutions.

---

## 2. Authority

| Concept | Engineering Constitution | Executed in |
|---------|-------------------------|-------------|
| **Derives from** | CTD-040 — CTD supreme over modules | [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](./EMPIREAI_CORE_CONSTITUTION_CTD.md) |
| **Owner** | Chief Architect | [`EMPIREAI_OWNERSHIP_MODEL.md`](./docs/governance/EMPIREAI_OWNERSHIP_MODEL.md) |
| **Technical ownership** | Pillow owns Brain and runtime | Pillow Constitution §17 |
| **Builder execution** | Cursor · governed agents | This doc §10 · Cursor standards |
| **Supervision** | Pillow COI | [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./docs/governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md) |
| **Architecture constraints** | ACD subordinate to CTD | [`EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md`](./EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md) |
| **Commercial conflict** | **CTD wins** | Constitution Hierarchy §6 |
| **Amendments** | CONSTITUTIONAL REVIEW + Chief Architect; CTD touch → Grand King | §15 |

### 2.1 What this constitution governs

| Domain | Engineering rule source |
|--------|------------------------|
| Architecture reviews | §5 · §6 · ACD · Canonical Architecture |
| Mission reviews | §5 · Vision Sync · Mission Generation Policy |
| Dependency analysis | §5.2 · CTD-028 |
| Root cause analysis | §5.3 · §8 prohibited practices |
| Repository changes | §5 · Repository Structure · Repository First |
| Production deployment | §7 · Production Truth · MANAGED_DEPLOYMENT |
| Testing | §7 · Article VII |
| Browser acceptance | §7.2 · CON-017 (programme) |
| Rollback · recovery | §9 · Recovery doctrines |
| Documentation | §5 end · Cursor Output Standard |
| Engineering standards | Articles I–IX · [`EMPIREAI_ENGINEERING_STANDARDS.md`](./docs/governance/EMPIREAI_ENGINEERING_STANDARDS.md) (P4-01) · Cursor Output Standard |
| Mission traceability | §5 · DECISIONS · Journey |
| Production verification | §7 · Production Truth |
| Lessons learned | §5 end · Vision Accumulation |
| Continuous improvement | §11 · BL-C Constitution |

### 2.2 What this constitution does NOT govern

| Domain | Authority |
|--------|-----------|
| Commercial strategy · profit mission | CTD · CBD |
| Grand King sovereignty | GVD · Tier 0 |
| Founder UX identity law | UID |
| Pillow executive intelligence identity | Pillow Constitution |

---

## 3. Engineering Principles

### 3.1 Mandatory principles

| # | Principle | Source |
|---|-----------|--------|
| E1 | **Engineering begins with understanding** — never implement before WHY is clear | Reasoning Model · Vision Sync |
| E2 | **Intelligence before action** — think, explain, evidence (CTD-005–008) | CTD |
| E3 | **Brain sovereignty** — single orchestration path | Article I |
| E4 | **Guardian protection** — fail safe, verify integrity | Article II |
| E5 | **Modularity** — replaceable subsystems, no provider lock-in | Article IV · CTD-025 |
| E6 | **No silent drift** — architecture and repository stay aligned | CTD-021 · §8 |
| E7 | **No duplicated logic** — one truth, one owner | CTD-022–024 · Article IX |
| E8 | **Never claim success without verification** | Article VII · CTD-017–019 |
| E9 | **Knowledge in repository** — not conversation-only | CTD-034 · Repository First |
| E10 | **Quality over speed** — no production hacks | Article IX |
| E11 | **Protect before expand** — CTD-039 bounds engineering risk | CTD |

### 3.2 CTD engineering alignment (commercial floor)

Engineering must comply with CTD articles governing honesty, architecture, modules, and knowledge — especially CTD-017–019 (production honesty), CTD-026–030 (module contracts), CTD-034–035 (repository durability).

---

## 4. Mission Lifecycle

### 4.1 Mission start (mandatory — no implementation before completion)

```
Vision Synchronization
        ↓
Vision
        ↓
Soul
        ↓
Roadmap
        ↓
Hierarchy
        ↓
Mission Context
        ↓
Mission Generation
```

→ [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md)

**Binding:** WHY → Vision+Soul · WHAT → Roadmap · HOW → Hierarchy+Architecture · PROOF → Acceptance criteria.

### 4.2 Mission execution (mandatory reviews)

Every engineering mission **performs** before implementation closes:

| Review | Requirement | Output |
|--------|-------------|--------|
| **Architecture Review** | Confirm change aligns with Canonical Architecture + ACD; no silent drift | Architecture impact statement |
| **Dependency Review** | Map upstream/downstream modules · CTD-028 | Dependency list + blockers |
| **Risk Review** | Guardian level · irreversibles · production surface | Risk register |
| **Root Cause Analysis** | For fixes — identify cause, not symptom | RCA summary (§8 prohibits symptom-first) |

### 4.3 Mission end (mandatory closure)

Every engineering mission **ends with**:

| Closure step | Requirement | Authority |
|--------------|-------------|-----------|
| **Repository Acceptance** | Tests · docs · scope match · traceability | §7 |
| **Production Acceptance** | Deploy proof if production-facing | §7 · Production Truth |
| **Grand King Acceptance** | Sovereign usable verification if required | §7 · GVD |
| **Lessons Learned** | What worked · what failed · what to repeat | Mission report · BL-C if enhancement |
| **Vision Accumulation** | OP/BP/PP candidates per policy | [`EMPIREAI_VISION_ACCUMULATION.md`](./docs/governance/EMPIREAI_VISION_ACCUMULATION.md) |

→ [`EMPIREAI_MISSION_GENERATION_POLICY.md`](./docs/governance/EMPIREAI_MISSION_GENERATION_POLICY.md)

---

## 5. Validation Model

### 5.1 Validation gates (in order)

| Gate | When | Proof |
|------|------|-------|
| **Understanding gate** | Before code | Vision sync complete · mission brief approved |
| **Design gate** | Before implementation | Architecture + dependency + risk reviews |
| **Implementation gate** | During build | Typecheck · unit/integration tests · Guardian compliance |
| **Repository gate** | Before merge/close | Repository Acceptance evidence |
| **Production gate** | Before mission complete (production-facing) | Deploy · health · smoke · browser where UI |
| **Sovereign gate** | Irreversibles · founder surfaces | Grand King Acceptance |

### 5.2 Production verification requirements

| Surface | Minimum verification |
|---------|---------------------|
| **API / Brain** | Tests + `/health/live` on deployed environment |
| **Frontend / Cockpit** | Build success + browser verification of changed flows |
| **Pillow runtime** | Session path verified per Production Truth |
| **Documentation-only CON** | Repository Acceptance sufficient if explicitly non-production |

**Rule:** Declaring success without browser verification on UI missions is **prohibited** (§8).

→ CON-017 (P9) — browser E2E acceptance suite is programme target; until then, manual Grand King walkthrough satisfies sovereign gate.

---

## 6. Acceptance Model

Engineering missions inherit the **triple acceptance model** — no production-facing mission is complete until all three pass where applicable.

| # | Acceptance | Question | Engineering proof |
|---|------------|----------|-------------------|
| 1 | **Repository Acceptance** | Correctly implemented in repo? | Tests · diff · docs · Journey · Cursor Output Standard |
| 2 | **Production Acceptance** | Working in production? | Deploy · probes · smoke · STATUS update |
| 3 | **Grand King Acceptance** | Usable as intended? | GK sign-off · live walkthrough |

```
Repository Acceptance  →  code/docs truth
Production Acceptance  →  live environment truth
Grand King Acceptance  →  sovereign usable truth
        ↓
Mission COMPLETE (PROOF valid)
```

**Rules:**
- Missing acceptance → **not complete** (may be "Repository Accepted, Production Pending")
- CON/documentation missions → Repository Acceptance only when explicitly scoped
- Commercial irreversibles → Grand King Acceptance **required** even if 1–2 pass

→ [`EMPIREAI_PRODUCTION_TRUTH.md`](./docs/governance/EMPIREAI_PRODUCTION_TRUTH.md) §6

---

## 7. Prohibited Engineering Practices

| Prohibited | Why | Alternative |
|------------|-----|-------------|
| **Symptom-first engineering** | Masks root cause · repeats failures | RCA before fix (§4.2) |
| **Blind retries** | Wastes cycles · hides instability | Diagnose · one intentional retry max |
| **Timeout-first fixes** | Treats latency as root cause | Profile · fix cause · document |
| **Duplicate truth** | CTD-022–024 violation | Single owner · single source |
| **Duplicate ownership** | Ownership Model violation | One constitutional owner |
| **Skipping production validation** | CTD-017–019 · Article VII | Production Acceptance gate |
| **Success without browser verification** | UI unverified | Browser walkthrough or E2E |
| **Architecture drift** | CTD-021 | ADR · architecture review |
| **Repository drift** | Journey/STATUS out of sync | Journey First · Repository First |
| **Bypass Brain orchestration** | Article I | `POST /brain/dispatch` only |
| **Temporary production hacks** | Article IX | Proper fix or feature flag |
| **Chat-only decisions** | CTD-034 | Repository artifact |

---

## 8. Cursor Governance

Every Cursor mission **must** include in brief and final report:

| Field | Required |
|-------|----------|
| Estimated completion time | Mission start |
| King action required (YES/NO) | Mission start |
| Mission purpose | Brief |
| Dependencies | Brief |
| Acceptance criteria | Brief |
| Validation plan | Brief |
| Final report | Mission end |
| Production evidence | If production-facing |
| Remaining blockers | Mission end |
| Next roadmap item | Mission end |

### 8.1 Cursor standards (subordinate execution)

| Standard | Role |
|----------|------|
| [`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`](./EMPIREAI_CURSOR_OUTPUT_STANDARD.md) | Executive Summary + Cursor Draft · traceability |
| [`docs/governance/CURSOR_OUTPUT_TEMPLATE.md`](./docs/governance/CURSOR_OUTPUT_TEMPLATE.md) | Template |
| [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](./EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md) | Recovery Mode — no infinite waits |
| [`EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md`](./EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md) | Artifacts over chat |

**Rule:** Cursor executes **Section 2 — Cursor Draft** only after Grand King approves Executive Summary on irreversibles.

---

## 9. Builder Governance

Builder (Cursor · governed agents · Pillow-supervised implementation workers) **must**:

| Step | Requirement |
|------|-------------|
| 1 | **Synchronize Vision** — complete mission-start chain (§4.1) |
| 2 | **Understand WHY** — Vision + Soul alignment statement |
| 3 | **Understand Roadmap** — cite governing slot |
| 4 | **Understand Dependencies** — modules · CON deps · blockers |
| 5 | **Understand Repository** — paths · owners · classification |
| 6 | **Generate implementation** — scoped · minimal · convention-matching |
| 7 | **Validate** — tests · gates · Guardian · production if scoped |
| 8 | **Report** — acceptance status · evidence · blockers · lessons |

**Supervisor:** Pillow confirms sync before execution → [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./docs/governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md)

**Forbidden:** Builder overrides CTD · Engineering Constitution · Guardian · Grand King approval gates.

---

## 10. Recovery Doctrine

Engineering recovery is **mandatory**, not optional.

| Doctrine | Scope | Trigger |
|----------|-------|---------|
| [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](./EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md) | Agent stalls · validation deadlocks | Infinite wait · orphaned background process |
| [`EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md`](./EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md) | Empire continuity · no single-device loss | Disaster · device failure |
| Article V — Failure Doctrine | Runtime fail-safe | Dispatch failure · Guardian block |

**Recovery principles:**
- Never discard completed work silently
- One fresh validation cycle after Recovery Mode
- Executive Audit after successful recovery
- Rollback plan before risky production deploy

---

## 11. Continuous Improvement

Post-implementation improvement is governed by **BL-C** — not by weakening engineering law.

| Layer | Authority |
|-------|-----------|
| **Engineering Constitution** | How to build correctly |
| **BL-C Continuous Improvement Constitution** | How to evolve after build |
| **Enhancement registers** | UX · Pillow post-V1 items |

**Rule:** Completed missions feed BL-C registers · Vision Accumulation · never skip Lessons Learned.

→ [`EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md`](./EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md)

---

## 12. Immutable Engineering Articles (Articles I–IX)

> Runtime orchestration law — preserved from Phase 3 foundation. Amend via §15 only.

### Article I — Brain Sovereignty

> **Technical ownership:** Pillow is the sole technical owner of EmpireAI. Brain is a Pillow-owned subsystem — not a peer of Pillow. See `EMPIREAI_PILLOW_CONSTITUTION.md` §17.

1. The Brain is the **only orchestration execution point**.
2. No frontend, script, or agent may bypass the Orchestrator.
3. All module actions route through `POST /brain/dispatch`.

### Article II — Guardian Protection

1. Every dispatch passes Guardian assessment when enabled.
2. Database integrity (`PRAGMA integrity_check`) is mandatory before writes.
3. High-risk actions require explicit confirmation.
4. L3/L4 authority requires founder approval in payload.

### Article III — Financial Integrity

1. Financial state is reconstructed from the **append-only ledger**.
2. Balances are never overwritten — only new events appended.
3. Every financial event must have: type, amount, direction, correlation ID, source.
4. Treasury buckets are **derived**, not stored as authoritative balances.

### Article IV — Modularity

1. No feature may tightly couple to a single provider.
2. Connectors implement a common interface.
3. Subsystems must be replaceable without breaking unrelated modules.
4. Prefer interfaces over shortcuts.

### Article V — Failure Doctrine

1. Design assuming failure.
2. Fail safely — never corrupt unrelated modules.
3. Log audit trails for important operations.
4. Provide recovery plans for blocked Guardian actions.

### Article VI — Founder Protection

1. Never delete founder businesses because of cancellation.
2. Cancellation transitions to **preserved** state.
3. Pause/resume must be supported without data loss.

### Article VII — Verification

1. Never claim success without verification.
2. Run validation gate before milestones.
3. Mark subsystems **unverified** when checks cannot run.

### Article VIII — Memory

1. Architecture decisions are recorded in `EMPIREAI_DECISIONS.md`.
2. Status is maintained in `EMPIREAI_STATUS.md`.
3. Reports are regenerated via `npm run architect:report`.

### Article IX — Quality

1. Never reduce code quality for development speed.
2. No temporary hacks in production paths.
3. No duplicated logic across modules.

---

## 13. Constitutional Relationships

| Document | Relationship |
|----------|--------------|
| [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](./EMPIREAI_CORE_CONSTITUTION_CTD.md) | Commercial apex — Engineering Constitution subordinate |
| [`EMPIREAI_VISION.md`](./EMPIREAI_VISION.md) | WHY — informs every mission start |
| [`EMPIREAI_SOUL.md`](./EMPIREAI_SOUL.md) | WHO — identity bounds engineering |
| [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md) | Tier 3 engineering placement |
| [`EMPIREAI_ROADMAP.md`](./EMPIREAI_ROADMAP.md) | WHAT NEXT — programme sequencing |
| [`docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`](./docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) | Normative HOW |
| [`docs/governance/EMPIREAI_REPOSITORY_STRUCTURE.md`](./docs/governance/EMPIREAI_REPOSITORY_STRUCTURE.md) | Repository doctrine |
| [`docs/governance/EMPIREAI_PRODUCTION_TRUTH.md`](./docs/governance/EMPIREAI_PRODUCTION_TRUTH.md) | Acceptance · production verification |
| [`EMPIREAI_PILLOW_CONSTITUTION.md`](./EMPIREAI_PILLOW_CONSTITUTION.md) | Pillow runtime law — peer domain constitution |
| [`EMPIREAI_REASONING_MODEL.md`](./docs/governance/EMPIREAI_REASONING_MODEL.md) | WHY→WHAT→HOW→PROOF chain |

---

## 14. Validation Checklist (P2-03)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD | §2 · §3 · §13 |
| Aligns with Constitution Hierarchy | §2 · Tier 3 engineering |
| Aligns with Roadmap · Architecture · Repository · Production Truth | §2.1 · §6 · §13 |
| No duplicated engineering authority | Single doc · CON-015 resolved |
| Mission lifecycle defined | §4 |
| Builder · Cursor governance defined | §8 · §9 |
| Articles I–IX preserved | §12 |

---

## 15. Future Amendment Rules

| Rule | Requirement |
|------|-------------|
| **A1** | Articles I–IX changes require ADR + Chief Architect review |
| **A2** | Surround sections (§1–§11) may clarify without weakening articles |
| **A3** | No second engineering constitution file — amend this path only |
| **A4** | Cursor standards amend within this constitution's bounds |
| **A5** | CTD conflict → CTD wins; engineering doc must be fixed |

---

## 16. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P2-03 — Engineering Constitution |
| **Ratification date** | 2026-07-05 |
| **Ratification authority** | Chief Architect under Grand King constitutional execution |
| **CON-015** | Autonomous Engineering Constitution → **this document** + Cursor standards |
| **Next constitutional phase** | P3 — Architecture Foundation (not started) |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | Phase 3 | Chief Architect | Articles I–IX — Brain · Guardian · integrity |
| 1.0.0-r1 | 2026-07-05 | P2-03 | Full Engineering Constitution ratification — lifecycle · acceptance · Builder · Cursor |

---

## Related

- [`docs/governance/EMPIREAI_DOCUMENTATION_LAW.md`](./docs/governance/EMPIREAI_DOCUMENTATION_LAW.md) (P2-06 · ECDS-1)  
- [`docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md`](./docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md)  
- [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](./EMPIREAI_CORE_CONSTITUTION_CTD.md)  
- [`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`](./EMPIREAI_CURSOR_OUTPUT_STANDARD.md) · [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](./EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md)  
- [`docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md)  
- [`docs/governance/EMPIREAI_MISSION_GENERATION_POLICY.md`](./docs/governance/EMPIREAI_MISSION_GENERATION_POLICY.md)
