# EmpireAI Version 1 — Certification Mode

> **Canonical label:** Version 1 Certification Mode  
> **Authority:** Grand King Executive Directive · EmpireAI Version 1  
> **Status:** ✅ **ACTIVE** — activated 2026-06-29  
> **Prior mode:** Architecture & Expansion Mode (closed)  
> **Canonical owner:** Repository Governance · Journey · Project State  
> **Companion artifacts:** `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` · `EMPIREAI_STATUS.md` · `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_EXECUTIVE_CERTIFICATION_GAP_ANALYSIS.md`

---

## 1. Certification principle

**EmpireAI Version 1 is architecture-complete.**

From activation forward, **every engineering mission must directly remove one or more verified Version 1 certification blockers** listed in the **Certification Blocker Register**.

Any mission that does **not** reduce the blocker register shall be **deferred** until Version 1 has been executive-certified.

| Rule | Requirement |
|---|---|
| **C1 — Blocker-first** | No new architecture, doctrine, UX, governance, or feature work unless it closes a registered blocker |
| **C2 — Declare blockers** | Every Version 1 mission **shall** declare which blocker ID(s) it removes in its Executive Audit and Cursor mission header |
| **C3 — Defer expansion** | Post-V1 roadmaps (PEI Layer 2, Commercial Intelligence, Supplier Intelligence, BL-C enhancements) are **frozen** for implementation until Certification Mode exits |
| **C4 — Single register** | `VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` is the **only** authoritative open-blocker list |
| **C5 — GK authority** | Grand King may override deferral for explicit strategic exceptions — logged in `JOURNEY_AUDIT.md` |

**Time alone shall not trigger new Version 1 scope.** Only blocker closure drives engineering priority.

---

## 2. Mode transition

| Mode | Period | Character |
|---|---|---|
| **Architecture & Expansion Mode** | Through 2026-06-29 | REAL-001→100 · Pillow Runtime · UX contract · governance doctrines |
| **Certification Mode** | **Active from 2026-06-29** | Close blockers · live credentials · go-live · PROOF-001 · executive sign-off |

Certification Mode is recorded in `EMPIREAI_STATUS.md` under **Operating Mode**.

---

## 3. Mission admission rules

### 3.1 Required for every Version 1 mission

```
Mission header:
  Certification Mode: ACTIVE
  Blocker(s) addressed: B# [, B# …]
  Blocker register updated: yes | no (with reason)
```

### 3.2 Accept

| Mission type | Condition |
|---|---|
| Blocker closure | Removes ≥1 open blocker with validation evidence |
| Operational activation | Configures credentials, go-live, or live profit path (B6–B8) |
| Production readiness | Completes B5 with auditable checklist |
| Journey sync | Documents blocker closure only — no new scope |

### 3.3 Reject or defer

| Mission type | Action |
|---|---|
| Layer 2 PEI implementation | Defer — post-V1 |
| Commercial Intelligence depth | Defer — post-V1 |
| BL-C enhancement implementation | Defer — registers only unless blocker-linked |
| New doctrine / constitution (non-blocker) | Defer |
| Architecture expansion | Defer — Pillow Law 4 applies |
| Repository refactoring (ADR-044) | Defer — post-V1 |

---

## 4. Exit criteria

Certification Mode **concludes** when **all** of the following are true:

| # | Exit gate | Register / artifact |
|---|---|---|
| **E1** | All certification blockers **closed** | Blocker register — zero 🔴/🟡 blockers |
| **E2** | **GK-GOLIVE-APPROVAL** complete | `JOURNEY.md` · REAL-099 workflow |
| **E3** | **PROOF-001** — first verified live net profit | `JOURNEY.md` · MS-A path begins |
| **E4** | **EmpireAI Version 1 Executive Certification** signed | REAL-070 Executive Sign-Off Report · REAL-100 certificate |

Upon exit:

- Version 1 declared **complete** in `EMPIREAI_STATUS.md`
- Post-V1 roadmaps may begin: PEI (Layer 2), Commercial Intelligence, Supplier Intelligence, BL-C implementation missions
- BL-C continuous improvement **implementation** resumes under normal enhancement lifecycle

---

## 5. Recommended execution sequence

Current critical path (see blocker register for live status):

```
B5 — Production Readiness review
  ↓
B6 — REAL-002B production credentials
  ↓
B7 — GK-GOLIVE-APPROVAL
  ↓
B8 — PROOF-001 (first verified live net profit)
  ↓
E4 — Version 1 Executive Certification signed
```

Steps B7–B8 require **Grand King approval and live operation**.

---

## 6. Relationship to adjacent governance

| Artifact | Relationship |
|---|---|
| **Pillow Constitution §14 Law 4** | Finish Before Expand — enforced during Certification Mode |
| **BL-C** | Active for registers; implementation missions deferred unless blocker-linked |
| **CAGW** | Lasting blocker closures produce repository artifacts per standard workflow |
| **Pillow Delivery Mode** | Pillow-specific delivery scope (Phases 1–3) within Certification Mode — `PILLOW_VERSION_1_DELIVERY_MODE.md` · ADR-049 |
| **PILLOW-019 Builder Mode** | Objective filter aligns with Certification Mode — only blocker-aligned work surfaces |
| **V1 Gap Analysis audit** | Historical analysis; **blocker register supersedes** open-blocker list |

---

## 7. Repository synchronization

| Artifact | Role |
|---|---|
| `docs/governance/VERSION_1_CERTIFICATION_MODE.md` | This policy |
| `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` | Single source of truth — open blockers |
| `EMPIREAI_STATUS.md` | Operating mode + summary |
| `JOURNEY.md` | Blocker rows indexed |
| `EMPIREAI_DECISIONS.md` ADR-048 | Decision register |
| `COMBINED_EXECUTIVE_AUDIT_VERSION_1_CERTIFICATION_MODE_ACTIVATION.md` | Activation audit |

---

*Certification Mode · Grand King Executive Directive · 2026-06-29 · documentation only — no runtime modified.*
