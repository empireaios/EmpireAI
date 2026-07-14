# EMPIREAI INFRASTRUCTURE ARCHITECTURE

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Infrastructure)  
> **Document ID:** P3-06  
> **Constitutional phase:** P3 — Architecture Foundation  
> **Dependencies:** P1 complete · P2 complete · P3-01 → P3-05 · Production Truth · Architecture Law  
> **Owner:** Pillow (platform stewardship) · Grand King (production sovereignty)  
> **Authority:** CANONICAL — single permanent Infrastructure architecture; **subordinate to CTD · Engineering Constitution · Production Truth · Architecture Law**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.10 · §3.12  
> **Ratified:** 2026-07-05 (P3-06)  
> **Role:** Permanent architecture of the operational foundation — reconstructed from repository and production evidence, not a rewrite

**Production law:** [`EMPIREAI_PRODUCTION_TRUTH.md`](../governance/EMPIREAI_PRODUCTION_TRUTH.md) (P1-10)  
**Deploy companion:** [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md) (MPD-001)  
**G2 fabric companion:** [`artifacts/g2-infrastructure-commerce-architecture.md`](../../artifacts/g2-infrastructure-commerce-architecture.md) (G2-00 — connector infrastructure programme)  
**Runtime evidence:** [`docs/audits/full-empireai-audit/12_INFRASTRUCTURE_AND_PRODUCTION_AUDIT.md`](../audits/full-empireai-audit/12_INFRASTRUCTURE_AND_PRODUCTION_AUDIT.md) (EVIDENCE)

---

## 1. Purpose

**Infrastructure** is the **permanent operational foundation** of EmpireAI — not merely cloud hosting, not a DevOps checklist, not Cockpit UI. Infrastructure **enables the Empire to execute reliably, securely, and continuously** while remaining constitutionally governed.

| Infrastructure IS | Infrastructure IS NOT |
|-------------------|----------------------|
| Hosting · networking · deployment · runtime foundation | Vision, Soul, or Constitution author |
| Database · cache · queue · secrets · observability platform | Pillow intelligence or Builder channel |
| Environment strategy · security · recovery · scalability path | Production Truth owner (documents truth; does not define acceptance alone) |
| Platform services under Pillow stewardship | Commerce business logic or Brain dispatch ownership |
| V1 current state + constitutional target + evolution | Autonomous deploy authority without Grand King gates |

**Canonical name:** **Infrastructure** — platform operational layer; **G2 Infrastructure & Commerce** is the **connector fabric programme** (companion, not competing — see §3).

**The principle:** Pillow owns platform · Brain executes on infrastructure · Production Truth records what is live · Infrastructure defines how it should run · Grand King approves irreversible production changes.

---

## 2. Constitutional Relationships

```
Grand King (production sovereignty · deploy approval)
        ↓
Vision · Soul · CTD · Engineering Constitution (law — Infrastructure never amends)
        ↓
Production Truth (what is live — Infrastructure aligns, does not override)
        ↓
Pillow (stewards platform · Infrastructure Commander · credentials policy)
        ↓
Infrastructure (this document — operational foundation)
        ↓
Brain (Railway runtime · Redis · SQLite · LLM router)
        ↓
Cockpit / Frontends (Vercel · BFF proxy)
        ↓
External providers (OpenAI · Upstash · GitHub · commerce connectors)
```

| System | Relationship |
|--------|--------------|
| **Production Truth** | Infrastructure implements; STATUS and deploy manifests prove live state |
| **Pillow** | Owns platform services · Infrastructure Commander observes Railway/Vercel/GitHub |
| **Brain** | Primary runtime consumer — sessions, queue, DB, LLM, health |
| **Cockpit** | Infrastructure department visualizes health · deploy · integrations — never hosts Brain |
| **Builder** | Implements infrastructure changes under supervision — never autonomous deploy |
| **Commerce · G2** | G2 = connector/integration fabric under Commerce programme — not platform hosting |
| **Guardian** | Health probes · pre-dispatch safety on Brain |

---

## 3. Ownership & Stewardship

| Field | Definition |
|-------|------------|
| **Platform steward** | Pillow |
| **Production sovereignty** | Grand King |
| **Normative maintainer** | Chief Architect · Repository Governance |
| **Deploy runbooks** | `deployment/` (MPD-001) — operational companion |
| **Readiness assessor** | `production-infrastructure-readiness.ts` |
| **Pillow subsystem** | `pillow/src/infrastructure-commander/` |
| **Brain platform modules** | Config · database · observability · cost · retention |
| **Cockpit surfacing** | Infrastructure department · `InfrastructurePanels.tsx` |

**Disambiguation:**

| Term | Meaning |
|------|---------|
| **Infrastructure (P3-06)** | Platform hosting · runtime · data · security · ops — **this document** |
| **G2 Infrastructure & Commerce** | External connector fabric (marketplace, supplier, payment rails) — [`g2-infrastructure-commerce-architecture.md`](../../artifacts/g2-infrastructure-commerce-architecture.md) |
| **account-infrastructure-engine** | Commerce account readiness — not platform hosting |
| **global-commerce-infrastructure** | Commerce readiness models — not Railway/Vercel |

**Rule:** One Infrastructure architecture (this document). MPD-001 and audit pack are companions, not competitors.

---

## 4. Responsibilities

| Responsibility | V1 evidence | Owner |
|----------------|-------------|-------|
| **Hosting** | Railway (Brain) · Vercel (frontends) | Pillow platform |
| **Networking** | HTTPS · CORS · BFF proxy · DNS/TLS on platforms | Platform + deploy |
| **Deployment** | `railway.toml` · `vercel.json` · GitHub CI | Builder under approval · Grand King gate |
| **Runtime** | Node 22 · Fastify Brain · Pillow in-process | Brain |
| **Database** | SQLite (sql.js) on Railway volume | Brain / Infrastructure |
| **Caching** | Redis (Upstash) sessions · pub/sub | Infrastructure |
| **Queues** | BullMQ via Redis · worker service | Brain worker |
| **Storage** | SQLite volume · Supabase Storage (optional backup) | Infrastructure |
| **Secrets** | Env vars · credential vault · Pillow policy | Pillow |
| **Monitoring** | `/health/live` · `/health` · `/metrics` · event-loop metrics | Brain · Guardian |
| **Logging** | Structured Fastify logs · audit_logs | Brain |
| **Observability** | Health endpoints · journey verify scripts | Infrastructure Commander |
| **Security** | Auth · session · Guardian · CORS · rate limits | Brain · Guardian |
| **Disaster Recovery** | SQLite backup to Supabase · redeploy | Operational runbook |
| **Scalability** | Documented V1 limits · Postgres migration path | Architecture evolution |
| **Business Continuity** | Health checks · rollback via redeploy · Redis dependency | Production Truth |

---

## 5. Infrastructure Overview

### 5.1 V1 split-stack (current production)

```
Grand King Browser
       │
       ▼
┌──────────────────┐
│ Vercel           │  empire-ai.co (TLS via Vercel)
│ frontend/ SPA    │  OR empireai-web/ (Next.js BFF)
└────────┬─────────┘
         │ HTTPS — VITE_API_BASE_URL / BRAIN_API_URL (BFF proxy)
         ▼
┌──────────────────┐
│ Railway          │  empireai-production.up.railway.app
│ backend/dist/    │  Fastify · Brain · Pillow · Guardian
│ index.js         │  Health: /health/live
└────────┬─────────┘
         │
    ┌────┴────────────┐
    ▼                 ▼
 Upstash Redis    SQLite volume
 (rediss://)      /data/empireai-brain.db
 SESSION · queue  sql.js · debounced persist
    │
    ▼
 OpenAI / Anthropic / Gemini (LLM — env-gated)
 GitHub (source · CI · deploy triggers)
```

**Source of truth for live topology:** Production Truth · `EMPIREAI_STATUS.md` · audit pack §12.

---

## 6. Current Architecture (V1 Production)

### 6.1 Vercel (frontend hosting)

| Field | Current state |
|-------|---------------|
| **Role** | Static SPA (`frontend/`) and/or Next.js Cockpit (`empireai-web/`) |
| **Config** | Root `vercel.json` → `frontend/dist`; `empireai-web/vercel.json` standalone |
| **Env** | `VITE_API_BASE_URL` (SPA) · `BRAIN_API_URL` (Next BFF) |
| **DNS** | Production domain (e.g. `empire-ai.co`) — TLS automatic |
| **Rule** | Frontend **never** calls LLM or commerce APIs directly |

**Tension (documented):** Dual frontend surfaces — consolidation target in Canonical Architecture V2 merge.

### 6.2 Railway (Brain hosting)

| Field | Current state |
|-------|---------------|
| **Role** | Single Brain API process (+ optional worker service) |
| **Build** | Nixpacks — pillow + backend build chain (`railway.toml`) |
| **Start** | `node backend/dist/index.js` |
| **Volume** | Persistent mount at `/data` for SQLite |
| **Healthcheck** | `GET /health/live` (300s timeout) |
| **Worker** | `node backend/dist/worker.js` — shared env + volume |

### 6.3 GitHub (source & CI)

| Field | Current state |
|-------|---------------|
| **Role** | Monorepo source · Vercel/Railway deploy hooks |
| **Validation** | `npm run validate:full` pre-deploy gate |
| **Governance sync** | `scripts/sync-pillow-governance.mjs` in Railway build |

### 6.4 Redis (Upstash)

| Field | Current state |
|-------|---------------|
| **Role** | Session store · BullMQ queue · EventBus pub/sub |
| **URL** | `rediss://` TLS (production required) |
| **Degraded mode** | In-memory fallback if `REDIS_OPTIONAL=true` — **forbidden in production** |
| **Dependency** | High — sessions lost on restart without Redis |

### 6.5 SQLite (current database)

| Field | Current state |
|-------|---------------|
| **Engine** | sql.js (WASM) in Brain process |
| **Path** | `DATABASE_PATH=/data/empireai-brain.db` (Railway volume) |
| **Persist** | Debounced async export (event-loop starvation mitigation) |
| **Limit** | Single-writer · single Node instance — no HA multi-instance |

### 6.6 OpenAI & LLM providers

| Field | Current state |
|-------|---------------|
| **Primary** | OpenAI (`OPENAI_API_KEY`) — Pillow chat · agents |
| **Alternates** | Anthropic · Gemini (env-gated) |
| **Router** | `backend/src/brain/llm/llm-router.ts` — 45s timeout |
| **Rule** | All LLM calls through Brain router — never frontend |

### 6.7 Environment variables

| Template | Scope |
|----------|-------|
| `backend/.env.example` | Full Brain matrix |
| `deployment/railway-production.env.template` | Production Brain |
| `deployment/vercel-cockpit.env.template` | Cockpit BFF |
| `frontend/.env.example` | SPA API URL |

**Critical production vars:** `REDIS_URL` · `SESSION_SECRET` · `DATABASE_PATH` · `CORS_ORIGIN` · `OPENAI_API_KEY` · `EMPIREAI_REPO_ROOT`

**Assessor:** `production-infrastructure-readiness.ts` — blockers for Railway/Redis/DB/secrets.

### 6.8 Deployment pipeline

```
Git push → GitHub
    → Railway build (pillow + backend)
    → Railway deploy (health /health/live)
    → Vercel build (frontend env at build time)
    → Vercel deploy
    → production-journey-verify.mjs (smoke)
    → production-long-run-stability.mjs (optional endurance)
```

### 6.9 DNS · domain · SSL

| Layer | Provider | Notes |
|-------|----------|-------|
| **Frontend domain** | Vercel | Automatic TLS |
| **Brain domain** | Railway | `*.up.railway.app` or custom domain |
| **CORS** | Brain env | `CORS_ORIGIN` must match exact Vercel URL |

---

## 7. Target Architecture (Constitutional)

### 7.1 Production components (evolution path)

| Component | V1 (current) | Target |
|-----------|--------------|--------|
| **Production Frontend** | Vercel SPA + Next BFF | Unified Cockpit app on Vercel |
| **Production Brain** | Railway single Node | Railway multi-service (API + worker) → optional horizontal scale post-Postgres |
| **Production Database** | SQLite volume | **PostgreSQL** (managed — Supabase/Railway Postgres) |
| **Production Cache** | Upstash Redis | Upstash Redis (retain) |
| **Object Storage** | Supabase Storage (backup) | S3/R2/Supabase for artifacts · codegen · exports |
| **Queue Infrastructure** | BullMQ + Redis | Retain · dedicated worker fleet |
| **Worker Infrastructure** | Railway worker service | Separate worker scaling · job prioritization |
| **Monitoring** | Health + metrics endpoints | External APM · structured log aggregation |
| **Alerting** | Manual · journey scripts | Pager rules on health failure · event-loop lag |
| **Logging** | Fastify stdout | Centralized log drain |
| **Backups** | Optional Supabase SQLite upload | Automated Postgres PITR + SQLite legacy |
| **Recovery** | Redeploy + volume restore | RTO/RPO documented runbooks |
| **High Availability** | Not supported (SQLite) | Postgres + Redis + stateless API replicas |

### 7.2 Data architecture target (Canonical Architecture §5)

| Layer | V1 | Target |
|-------|-----|--------|
| Domain + ledger | SQLite | Postgres |
| Sessions + queue | Redis | Redis |
| Credential secrets | Reality Integration vault | Vault + env |
| Artifacts | Local / git | Object storage |
| Audit | audit_logs (SQLite) | Postgres append-only |

**Migration path:** `backend/src/brain/postgres/` (REAL-132 subset) · schema migrations in `database/migrations/`.

---

## 8. Environment Strategy

| Environment | Purpose | Brain | Frontend | Redis | DB | Promotion rules |
|-------------|---------|-------|----------|-------|-----|-----------------|
| **Development** | Local engineer work | `localhost:3001` | Vite dev server | Local or optional | `./data/*.db` | None — not production evidence |
| **Testing** | CI validation suite | In-memory / temp | N/A | Mock or skip | `:memory:` | `validate:full` must pass before deploy |
| **Staging** | Pre-prod integration (optional) | Railway staging service | Vercel preview | Staging Upstash | Staging volume | Manual promote after smoke |
| **Production** | Grand King live operation | Railway prod | Vercel prod | Prod Upstash | `/data/` volume | Grand King + Production Truth acceptance |
| **Recovery** | Restore from backup | Redeploy prior image + volume restore | Prior Vercel deployment | Unchanged | Restored snapshot | Incident runbook |
| **Sandbox** | Commerce/connector dev | `mock=1` · stubs enabled | Demo badges | Optional | Ephemeral | **Never** cite as Production Truth (CTD-018) |

**Deployment rules:**

1. `validate:full` before any cloud deploy  
2. Health `/health/live` must pass before traffic  
3. `REDIS_OPTIONAL=true` forbidden in production  
4. `CORS_ORIGIN` must match frontend origin exactly  
5. Extension HTTP routes remain gated (`CON-007`) until policy ratified  
6. Pillow production mode minimal chat vs full COI (`CON-008`) — separate from infra topology  

---

## 9. Database Strategy

### 9.1 SQLite (current)

| Aspect | Policy |
|--------|--------|
| **Engine** | sql.js in Brain process |
| **Location** | Railway persistent volume |
| **Writes** | Debounced persist — mitigates event-loop blocking |
| **Integrity** | Single writer · transactional in-process |
| **Backup** | Optional Supabase Storage upload (MPD-001 Phase 8) |
| **Limitation** | No multi-instance · no HA |

### 9.2 PostgreSQL (future)

| Aspect | Policy |
|--------|--------|
| **Driver** | `backend/src/brain/postgres/` pool |
| **Provider** | Supabase Postgres or Railway Postgres (same region) |
| **Migration** | Incremental — domain tables first · dual-write phase · cutover mission |
| **Schema** | Move from inline `database.ts` to `database/migrations/` |

### 9.3 Migration · backup · recovery · scaling

| Strategy | V1 | Target |
|----------|-----|--------|
| **Migration** | N/A (SQLite only) | REAL-132+ phased Postgres adoption |
| **Backup** | Manual / scheduled SQLite export | Postgres PITR + nightly snapshots |
| **Recovery** | Redeploy + restore volume file | Point-in-time restore + worker drain |
| **Scaling** | Vertical only (single Node) | Read replicas · connection pooling post-Postgres |
| **Data integrity** | Guardian + transactional writes | Retain + foreign key constraints in Postgres |

---

## 10. AI Infrastructure

| Capability | Definition | Runtime |
|------------|------------|---------|
| **OpenAI** | Primary Pillow + agent provider | `OPENAI_API_KEY` |
| **Future LLM providers** | Anthropic · Gemini already env-gated | LLM router |
| **Provider abstraction** | `llm-router.ts` — single Brain entry | No direct SDK in frontend |
| **Fallback strategy** | Provider chain in router config | Logged degradation |
| **Timeout strategy** | 45s LLM timeout · Pillow boot timeout recovery | Brain + Pillow |
| **Cost governance** | Cost module · token tracking (observability) | `brain/cost/` |
| **Model selection** | Per-agent config · Pillow policy | Agent definitions |

**Rule:** CTD-005 Intelligence Platform — LLM informs; infrastructure delivers reliably; cost tracked not ignored.

---

## 11. Security

| Domain | V1 implementation |
|--------|---------------------|
| **Authentication** | `POST /auth/login` · SQLite users · session cookies |
| **Authorization** | Role permissions · Guardian authority levels · workspace scope |
| **Secrets** | Env vars on Railway/Vercel · credential vault for connectors |
| **Encryption** | TLS in transit (Vercel/Railway/Upstash rediss) · volume at rest via platform |
| **Transport security** | HTTPS only in production · HSTS via platforms |
| **API security** | CORS allowlist · session cookie `httpOnly` · BFF hides Brain URL |
| **Rate limiting** | Fastify rate limits on auth/sensitive routes |
| **Audit logging** | `audit_logs` table · EKLS contributions |
| **Operational security** | No secrets in git · `.env.example` only placeholders · Production Truth verify |

**Risk (documented):** Default values in env schema — production must override all secrets.

---

## 12. Operations

| Capability | V1 | Evidence |
|------------|-----|----------|
| **Monitoring** | `/health` · `/health/live` · `/metrics` · event-loop lag | Guardian health monitor |
| **Health checks** | Railway healthcheck · journey verify scripts | `production-journey-verify.mjs` |
| **Metrics** | Basic process metrics | `/metrics` endpoint |
| **Alerting** | Manual · automated script failure | Long-run stability script |
| **Incident response** | Redeploy · Redis restore · volume rollback | Infrastructure Commander recovery |
| **Recovery** | Prior Railway deployment · SQLite file restore | MPD-001 runbook |
| **Deployment rollback** | Railway rollback · Vercel instant rollback | Platform native |
| **Maintenance** | Dependency updates via Builder missions | validate:full gate |

**Pillow Infrastructure Commander:** Railway · Vercel · GitHub health interpretation · recovery recommendations.

---

## 13. Performance

| Domain | V1 state | Target |
|--------|----------|--------|
| **Scaling** | Single Brain instance | Postgres + horizontal API replicas |
| **Caching** | Redis sessions · dispatch cache (Executive Home) | Expand read-through caches |
| **Async execution** | BullMQ worker · debounced SQLite | Worker pool scaling |
| **Worker strategy** | Separate Railway worker service | Priority queues · dead-letter |
| **Queue strategy** | Redis-backed BullMQ | Retain · monitor depth |
| **Performance targets** | Executive Home <3s warm (post-optimization) | p95 dispatch <5s |
| **Latency targets** | LLM 0.5–1.5s healthy · Pillow boot ≤90s | Boot cache · lazy subsystem |
| **Resource management** | Event-loop monitoring · SQLite debounce | Memory caps · connection pools |

**Known bottlenecks (mitigated):** Executive Home cold dispatch · Pillow lazy boot · full SQLite export (debounced).

---

## 14. Scalability & Recovery

### 14.1 V1 scalability limits (explicit)

| Limit | Severity | Mitigation path |
|-------|----------|-----------------|
| Single Node Brain | High | Postgres migration → stateless replicas |
| SQLite single writer | High | Postgres |
| Redis session dependency | High | Managed Upstash · no REDIS_OPTIONAL in prod |
| In-memory Pillow sessions | Medium | Redis-backed session extension |
| Extension routes deferred | Medium | CON-007 policy · phased enable |

### 14.2 Recovery objectives (target)

| Scenario | V1 procedure | Target RTO |
|----------|--------------|------------|
| Brain crash | Railway auto-restart | <2 min |
| Bad deploy | Railway/Vercel rollback | <5 min |
| DB corruption | Restore SQLite from Supabase backup | <30 min |
| Redis outage | Fail closed — no session persistence | Restore Redis first |
| Region outage | Manual failover (not automated V1) | Multi-region (P5+) |

---

## 15. Evolution

| Phase | Milestone | Authority |
|-------|-----------|-----------|
| **V1 (current)** | Railway + Vercel + SQLite + Upstash | MPD-001 · this doc §6 |
| **V1.1** | Worker hardening · monitoring scripts | REAL infrastructure missions |
| **V2** | Postgres migration · unified frontend | P5-05 Scaling Architecture |
| **V2+** | Object storage · APM · multi-region | ADR + Grand King approval |
| **G2 programme** | Connector fabric (not platform hosting) | G2-00 companion doc |

**Amendment rule:** Structural infrastructure change → update **this document** + Canonical Architecture §3.10 · §3.12 + MPD-001 if deploy sequence changes.

---

## 16. Examples

### Example 1 — Production deploy (constitutional path)

`validate:full` PASS → Railway deploy → `/health/live` 200 → Vercel deploy with `VITE_API_BASE_URL` → `production-journey-verify.mjs` PASS → Production Truth updated in STATUS.

### Example 2 — Infrastructure readiness blocker

Assessor reports `DATABASE_PATH` not on volume → `NOT_READY` → deploy blocked until Railway volume mounted at `/data`.

### Example 3 — Environment promotion violation (forbidden)

Developer cites local `mock=1` commerce run as "production proof" → violates CTD-017 · Production Truth — sandbox ≠ production.

### Example 4 — Recovery

Bad Brain deploy → Railway rollback to prior deployment → `/health/live` restored → incident logged in EKLS.

### Example 5 — G2 vs platform disambiguation

Team adds marketplace connector adapter → G2 fabric mission · **not** P3-06 Infrastructure change. Platform hosting unchanged.

---

## 17. Validation Checklist (P3-06)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · Engineering Constitution | §1 · §2 |
| Aligns with Production Truth · Architecture Law · Documentation Law | Header · §2 |
| Aligns with Canonical Architecture §3.10 · §3.12 · §5 | §3 · §6 · §7 |
| Aligns with Brain · Pillow · Cockpit · Builder · Commerce Architecture | §2 · §3 |
| No duplicated Infrastructure authority | §3 · MPD-001/G2 as companions |
| Current architecture documented | §6 |
| Target architecture documented | §7 |
| Environment strategy completed | §8 |
| Database strategy completed | §9 |
| Security validated | §11 |
| Operations · recovery validated | §12 · §14 |
| Cross-references completed | §18 Related |

---

## 18. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-06 — Infrastructure Architecture |
| **Ratification date** | 2026-07-05 |
| **Next architecture mission** | Phase P3 complete — see P4-01 Engineering Standards |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-06 | Canonical Infrastructure Architecture — operational foundation |

---

## Related

- [`EMPIREAI_PRODUCTION_TRUTH.md`](../governance/EMPIREAI_PRODUCTION_TRUTH.md) · [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md)  
- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md) · [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) · [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](./EMPIREAI_COCKPIT_ARCHITECTURE.md)  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](./EMPIREAI_BUILDER_ARCHITECTURE.md) · [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](./EMPIREAI_COMMERCE_ARCHITECTURE.md)  
- [`artifacts/g2-infrastructure-commerce-architecture.md`](../../artifacts/g2-infrastructure-commerce-architecture.md) (G2 connector fabric — companion)  
- [`pillow/src/infrastructure-commander/`](../../pillow/src/infrastructure-commander/) · [`backend/src/orchestration/version-1-activation/production-infrastructure-readiness.ts`](../../backend/src/orchestration/version-1-activation/production-infrastructure-readiness.ts)
