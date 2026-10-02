# Supabase — Database layer (V1 compatibility)

---

## V1 runtime reality

EmpireAI Brain **Version 1** persists domain data through **SQLite** (`sql.js`), configured via:

```env
DATABASE_PATH=/data/empireai-brain.db
```

There is **no Supabase Postgres adapter** in the current codebase. All repositories use `Sqlite*Repository` implementations. Postgres migration is documented as a **post-V1 scale decision** (ADR-002 / PDR-001) — not part of this managed deployment mission.

**Supabase in the V1 managed stack** therefore means:

1. **Primary data:** SQLite file on Railway persistent volume (required).
2. **Supabase project:** Provisioned for **Storage backups**, future Postgres migration, and operational readiness — not as the live V1 transactional database.

This satisfies the Grand King production strategy naming without redesigning Brain architecture.

---

## Recommended V1 setup

### 1. Create Supabase project

1. [supabase.com](https://supabase.com) → New project.
2. Choose region aligned with Railway (e.g. `us-east-1`).
3. Save project URL and service role key (for backup scripts only — **do not** expose service role to frontend).

### 2. Storage bucket for SQLite backups

1. Storage → New bucket → `empireai-brain-backups` (private).
2. Policy: service role only for upload/download.
3. Remote upload is a separate operational step after a verified offline bundle.
   Use [offline-state-bundle.md](./offline-state-bundle.md) to preserve the primary
   database, both native mission stores and any required legacy history together.

### 3. Backup boundary

Do not copy only the live `empireai-brain.db` on a timer: that omits mission and
execution receipts and does not establish that SQL.js finished exporting. The
repository's offline bundle tool requires all writers stopped, a verified final
flush, native exclusive locks, scope checks and an independently retained manifest
hash. It restores into a new directory and requires a separate application reopen
check. It does not upload to Supabase or prove a production/provider restore.

Remote storage credentials, retention, encryption, Redis recovery, provider volume
restore and production cutover require their own verified configuration and
approval boundaries. No scheduled remote backup is implied by these instructions.

---

## Future: Supabase Postgres

When ADR-002 Postgres migration executes:

| Today (V1) | Future |
|------------|--------|
| `DATABASE_PATH` → SQLite file | `DATABASE_URL` → Supabase Postgres connection string |
| `sql.js` WASM | Postgres driver + repository adapters |

Until that migration ships, **do not** point Brain at Supabase Postgres — it will not connect.

---

## What Supabase is NOT used for in V1

| Feature | V1 status |
|---------|-----------|
| Supabase Auth | Brain uses cookie sessions + seeded users |
| Supabase Realtime | Brain uses Redis pub/sub |
| Supabase Edge Functions | Not used |
| Row Level Security | N/A (SQLite local file) |

---

## Environment variables (backup scripts only)

These are **not** read by Brain today. Use in external backup tooling:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=empireai-brain-backups
```

Optional future Brain env (post-migration):

```env
# NOT IMPLEMENTED IN V1
# DATABASE_URL=postgresql://postgres:...@db.YOUR_PROJECT.supabase.co:5432/postgres
```

---

## Verification checklist

- [ ] Supabase project created
- [ ] Private Storage bucket for backups
- [ ] Railway `DATABASE_PATH` on persistent volume (live DB)
- [ ] Backup job documented or scheduled
- [ ] Team understands SQLite is live V1 store; Postgres is future

See [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md) for full sequence.
