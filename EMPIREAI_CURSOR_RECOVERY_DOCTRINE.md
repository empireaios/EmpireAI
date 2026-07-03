# EmpireAI — Cursor Recovery Doctrine

**Canonical label:** Cursor Recovery Doctrine
**Status:** ✅ Permanent repository engineering rule
**Parent law:** `EMPIREAI_CONSTITUTION.md` (permanent engineering law)
**Synchronization standard:** BL-A Repository Synchronization standard / Repository Continuity Doctrine
**Canonical owners:** Cursor (governed AI engineering worker) · CTO (engineering governance) · Repository Continuity Doctrine (synchronization owner)
**Registered:** 2026-06-29 (BL-B)

---

## 1. Purpose

This doctrine governs how **Cursor** shall recover from agent stalls, detached background
processes, and validation deadlocks.

Multiple implementation missions have entered a persistent waiting state **after** a
successful implementation, while waiting for detached background validation processes. This
behavior is unacceptable for EmpireAI. The repository permanently defines the expected
recovery behavior below.

---

## 2. Doctrine (the permanent rule)

Cursor shall **never wait indefinitely** for detached, orphaned, or background processes.

If an implementation reaches a persistent waiting state during validation, Cursor shall
**immediately transition into Recovery Mode**.

---

## 3. Recovery Mode sequence

Recovery Mode executes the following sequence automatically.

### Step 1 — Inspect repository state
Determine, without discarding completed work:
- Files modified
- Files created
- Current `git diff`
- Current implementation status

### Step 2 — Determine validation status
Inspect whether:
- Typecheck already completed.
- Build already completed.
- Validation already passed.

If validation **already succeeded**, immediately continue to the **Executive Audit**. Do not
continue waiting.

### Step 3 — Terminate only the blocked process
If validation status is **unknown**, terminate **only** the blocked validation process.
- Do **not** terminate healthy development servers.
- Do **not** terminate unrelated repository processes.

### Step 4 — One fresh validation cycle only
Execute exactly one fresh validation cycle, in order:
1. `npm run typecheck`
2. `npm run build`

No repeated validation loops.

### Step 5 — On success
If validation succeeds, immediately produce the **Executive Audit**. Do not remain waiting
for detached processes.

### Step 6 — On failure
If validation fails, repair **only** the implementation-related validation failures, then
re-run validation **once**. If successful, produce the **Executive Audit**.

---

## 4. Permanent rule — auto-trigger states

Cursor shall never remain indefinitely in any of the following states. Each state shall
**automatically trigger Recovery Mode**:

- Waiting for background process
- Waiting for detached process
- Waiting for `npm`
- Waiting for build
- Reconnecting
- Taking longer than expected

---

## 5. Canonical owners & justification

| Owner | Role under this doctrine | Justification |
|---|---|---|
| Cursor | Governed AI engineering worker | Cursor is the actor whose stall/recovery behavior this doctrine constrains. |
| CTO (Cost Governance — CTO) | Engineering governance owner | Engineering doctrine and execution discipline fall under the CTO responsibility (wasted detached-wait cycles also burn Cursor cost). |
| Repository Continuity Doctrine / BL-A standard | Synchronization owner | Mandates that this approved rule be registered in `JOURNEY.md` and logged in `JOURNEY_AUDIT.md`. |

---

## 6. Affected repository files

| File | Action |
|---|---|
| `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` | Created — this doctrine document |
| `JOURNEY.md` | Updated — registered doctrine row under Governance & Milestones (BL-B) |
| `JOURNEY_AUDIT.md` | Updated — structural change log entry (BL-B) |

No backend, frontend, catalog, route, config, or other runtime/source file was modified by
this doctrine. It is documentation/governance only.
