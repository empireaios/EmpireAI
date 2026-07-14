# Cursor Output Template

> **Authority:** `EMPIREAI_CURSOR_OUTPUT_STANDARD.md`  
> **Use:** Copy this template when ChatGPT, Pillow, or Grand King drafts a new Cursor Output manually.

---

# CURSOR OUTPUT: `{MISSION-ID}` — `{Title}`

## SECTION 1 — Executive Summary

> **Audience:** Grand King only. Not implementation instructions.

### My Understanding

{Plain-language restatement of the request and scope.}

### Why this recommendation exists

{Repository evidence — JOURNEY position, blockers, contracts, ADRs.}

### Expected Outcome

{What success looks like when the mission closes.}

### Repository Impact

{Canonical owners and artifacts affected — Journey, Status, runtime, contracts, etc.}

### Risk Assessment

{Dependencies, irreversible actions, governance gaps, technical risk.}

### Recommendation

**{Approve | Defer | Revise | Reject}** — {one-sentence justification}

---

## SECTION 2 — Cursor Draft

> **Audience:** Cursor engineering implementation only.

### Mission Type

{Engineering Operations | UX Implementation | Governance | …}

### Authority

{Contract · ADR · doctrine citations}

### Objective

{Scoped deliverable}

### Dependencies

- **{DEP-ID}** — {label}: {✅ satisfied | ❌ incomplete} ({evidence artifact})

### Implementation Rules

- {Rule 1}
- {Rule 2}

### Acceptance Criteria

- {Criterion 1}
- {Criterion 2}

### Validation

- {typecheck / build / tests / audit requirements}

### Executive Audit

- Pre-implementation review
- Validation results
- Journey synchronization
- Future Enhancements (BL-C)

### Stop Rule

{When Cursor stops — typically after Executive Audit unless GK approves continuation.}

---

_End of Cursor Output — both sections required per EmpireAI Version 1 standard._
