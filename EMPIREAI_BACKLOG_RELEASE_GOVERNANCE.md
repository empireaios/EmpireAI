# EmpireAI — Backlog Release Governance

**Canonical label:** Backlog Release Governance  
**Status:** ✅ Permanent repository governance rule  
**Registered:** BL-B (2026-06-29)  
**Canonical owner:** Repository Governance  
**Supersedes:** Informal BL drafts; partial BL-B amendments (Cursor Recovery-only draft)

---

## 1. Routing model (every BL item)

Every Backlog Release item **shall** follow:

```
Source Discussion
        ↓
    Owner(s)
        ↓
Repository Action
        ↓
   Validation
```

Backlog Releases **shall never summarize conversations**.  
Backlog Releases **shall synchronize repository owners only**.

---

## 2. Lifecycle

```
Accumulating
      ↓
   Review
      ↓
  Approved
      ↓
Loaded into Cursor
      ↓
Executive Audit
      ↓
   Closed
```

Once **Closed**:

* The Backlog Release becomes **immutable**.
* Future approved work begins under the **next** Backlog Release (BL-C, BL-D, …).

---

## 3. Regeneration doctrine

* Every Backlog Release is **one canonical document**.
* Whenever the active BL changes, **regenerate the entire BL**.
* **Never** issue amendments, patch documents, or partial replacements.
* The previous BL **immediately becomes obsolete** when superseded.

If transmission exceeds communication limits, multiple responses may carry **one continuous document**. Cursor shall always receive **one complete Backlog Release**.

---

## 4. Immutability

| Release | Status |
|---|---|
| BL-A | ✅ Closed — immutable |
| BL-B | ✅ Closed — immutable |
| BL-C | 🟡 **ACTIVE** — accumulates continuous-improvement items (`BL-C.md` · `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md`) |

Only **Grand King** may approve an item entering the active Backlog Release.

Only **one** Backlog Release is active at a time.

---

## 5. Per-release sequence (ROUTE 02 / ADR-020)

Every Backlog Release closeout shall run:

1. Audit Repository  
2. Refresh `JOURNEY.md`  
3. Refresh `JOURNEY_AUDIT.md`  
4. Repository Difference Report  
5. Synchronization Report / Validation Report  
6. Executive Audit (per `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`)

---

## 6. Canonical BL documents

| ID | Document | Status |
|---|---|---|
| BL-A | `BL-A_VALIDATION_REPORT.md` + BL-A synchronization artifacts | Closed |
| BL-B | `BL-B.md` | Closed |
| BL-C | `BL-C.md` + `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` | **ACTIVE** |
