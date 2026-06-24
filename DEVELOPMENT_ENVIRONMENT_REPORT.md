# EmpireAI Development Environment Report

Updated after replacing `better-sqlite3` with `sql.js` (WASM, no native compile).

---

## 1. Root cause

| Issue | Cause |
|-------|--------|
| `npm install` / `npm run setup` failed | **`better-sqlite3`** requires **node-gyp + Python + VS Build Tools** on Windows |
| User terminal error (terminal 8) | `gyp ERR! cwd ...\node_modules\better-sqlite3` — Python not runnable |
| Cursor agent could not verify fix | **Windows sandbox blocked**: `Sandbox policy 'workspace_readwrite' is not supported` — shell returns empty output, no file writes |

---

## 2. Fix applied (in repository)

### SQLite driver: `better-sqlite3` → `sql.js`

| File | Change |
|------|--------|
| `backend/package.json` | `sql.js` + `@types/sql.js`; removed `better-sqlite3` |
| `backend/src/brain/sqlite-database.ts` | **New** — WASM SQLite with better-sqlite3-compatible API |
| `backend/src/brain/database.ts` | Uses `EmpireDatabase` from sql.js adapter |
| `backend/scripts/verify-dev-environment.mjs` | Checks `sql.js` wasm, not better-sqlite3 |
| `backend/scripts/setup-dev-environment.ps1` | Cleans stale `node_modules`/lock if better-sqlite3 present |
| `backend/.npmrc` | **Removed** (was only for native prebuilds) |

No Python, node-gyp, or Visual Studio Build Tools required for SQLite.

---

## 3. Commands to run locally (required once)

Run in **PowerShell** (not the Cursor agent shell):

```powershell
cd C:\Users\erlan\OneDrive\Desktop\EmpireAI\backend

# Clean stale partial install if setup failed before
if (Test-Path node_modules\better-sqlite3) { Remove-Item -Recurse -Force node_modules }

npm install
node scripts/verify-dev-environment.mjs
npm run architect:report
npm run typecheck
```

Or one-shot:

```powershell
cd C:\Users\erlan\OneDrive\Desktop\EmpireAI\backend
.\scripts\setup-dev-environment.ps1
```

From repo root:

```powershell
cd C:\Users\erlan\OneDrive\Desktop\EmpireAI
npm run setup
npm run architect:report
```

---

## 4. Expected success

```
Development environment OK (pure-JS SQLite via sql.js — no Python/node-gyp required)
EmpireAI reports generated:
  - ...\EMPIREAI_TOTAL_VIEW_REPORT.md
  - ...\EMPIREAI_STRENGTH_REPORT.md
  ...
```

Verify on disk:

- [ ] `backend/node_modules/sql.js/dist/sql-wasm.wasm` exists
- [ ] `backend/node_modules/better-sqlite3` does **not** exist
- [ ] `npm run typecheck` exits 0
- [ ] Report MD files at repo root have fresh timestamps

---

## 5. Agent verification status (this session)

| Check | Result |
|-------|--------|
| Terminals stuck on npm? | **No** — terminal 8 finished with exit 1 (old better-sqlite3 failure) |
| `setup-log.txt` written by agent? | **No** — agent shell blocked by Windows sandbox |
| `node_modules/sql.js` on disk? | **Not verified** — agent cannot run npm on this host |
| Code migration complete? | **Yes** — package.json + sqlite-database.ts + database.ts |

---

## 6. Remaining issues

| Issue | Action |
|-------|--------|
| Local `npm install` not re-run after sql.js swap | Run commands in §3 |
| Stale `node_modules` with better-sqlite3 | Setup script auto-removes; or delete manually |
| Cursor agent shell on Windows | Use local terminal for npm; sandbox cannot execute writes |
| Redis optional | Only needed for `npm run dev` / queue workers, not `architect:report` |

---

## 7. Summary

**Why setup failed:** native `better-sqlite3` compile needs Python/node-gyp on Windows.

**Fix:** pure-JS `sql.js` WASM driver — no native compilation.

**Manual step:** one local `npm install` + verify (agent sandbox cannot run it here).
