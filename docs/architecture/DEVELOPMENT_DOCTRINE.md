# EmpireAI Development Doctrine

**Mission:** REAL-078  
**Status:** Official engineering rules  
**Version:** 1.0  
**Supersedes:** Ad-hoc conventions; complements `docs/governance/*`  

---

## 1. Purpose

This doctrine defines how EmpireAI code is organized, owned, and extended. It prevents the repository from accumulating duplicate subsystems, unwired dashboards, and dead routes — the primary maintainability risks identified in REAL-076/077.

All REAL missions (REAL-079+) must comply unless an ADR explicitly exceptions.

---

## 2. Core Rules

### 2.1 Single Brain Path

- Every autonomous action: **UI → BFF/REST → Brain → Tool|Agent|Workflow**.
- No frontend imports `@anthropic-ai/*`, OpenAI SDK, Stripe SDK, or CJ clients.
- No new LLM calls outside `backend/src/brain/llm/` and `pillow/src/openai/`.

### 2.2 Canonical Ownership

- Each capability has **one owner subsystem** (see `EMPIREAI_CANONICAL_ARCHITECTURE.md`).
- Before adding code, declare: *"Which canonical subsystem owns this?"*
- If another subsystem already owns it, **extend the owner** — do not create a parallel module.

### 2.2A Commercial Risk Intelligence (governance)

EmpireAI is an **AI-powered e-commerce operating system** (first commercial model: **global dropshipping**). **Commercial Risk Intelligence (CRI)** is a permanent platform capability (ADR-051).

- **Future product launches** require a **Commercial Risk Intelligence Report (CRIR)** and commercial risk certification before launch approval (documentation phase).
- REAL missions touching launch, READINESS, or PUBLICATION shall reference `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` and shall not implement launch paths that bypass CRIR without an explicit ADR exception approved by Grand King.
- **Survival over profit** (CRI-001): do not ship launch enablement whose documented refund/dispute structure can reasonably cause systematic financial loss.
- Runtime enforcement in `commerce-readiness-engine` is deferred — this rule governs documentation and mission scope until a future REAL implements gates.

### 2.3 No Duplicate Subsystems

Forbidden duplicates (extend canonical owner instead):

| Capability | Canonical owner | Deprecated duplicates |
|------------|-----------------|------------------------|
| Product scoring | `intelligence/product-intelligence-engine` | runtime/live-product-intelligence (consume PIE) |
| Supplier trust | `intelligence/supplier-intelligence-engine` | runtime/supplier-intelligence-loop (dashboard only) |
| Command center UI | Cockpit / Executive Command | 8+ runtime `*-command-center` without UI binding |
| KPI tracking | `foundation/kpi-engine` (governance) | runtime/empire-kpi-engine (unless promoted) |
| Executive council | `executive-council/` (Brain) | pillow-executive-council (Pillow-scoped only) |
| Connectors | `connectors/` + live adapters | Per-module ad-hoc HTTP clients |

### 2.4 Runtime Module Gate

New folder under `backend/src/runtime/` requires **all** of:

1. Cockpit department assignment (see Cockpit spec)  
2. ESIS `FRONTEND_PAGE_REGISTRY` entry with `boundApis`  
3. Tier classification: A (wired), B (certification), or C (reject)  
4. PR justification why it is not Commerce, Intelligence, or Foundation  

**Default deny:** `dashboard + health` only is not approved.

### 2.5 Connector Gate

New external provider requires:

1. Entry in `connectors/catalog.ts`  
2. Live adapter (or documented stub with `mock: true` in dev only)  
3. Reality Integration connect flow  
4. Integrations Hub UI binding  
5. Version-1 activation gate updated if commerce-critical  

### 2.6 Production vs Demo Data

- `domain/seed.ts` and mock providers: **development and demo environments only**.
- Production responses must not label `"8 mock providers"` without `dataMode: demo` in UI.
- Tables with `mock INTEGER` column: production writes require `mock=0`.
- Sandbox tools (`*_sandbox_only`): blocked when `LIVE_COMMERCE_INTEGRATION_MODE=production`.

---

## 3. Module Boundaries

### 3.1 Layer responsibilities

| Layer | May | May not |
|-------|-----|---------|
| **Frontend / Cockpit** | Render, dispatch, REST fetch, local UI state | Business logic, DB access, LLM calls |
| **BFF (`empireai-web/app/api`)** | Proxy, cookie forward, env check | Business logic, direct DB |
| **Brain** | Orchestrate, audit, govern | Domain-specific commerce rules (delegate to Commerce) |
| **Commerce** | Manufacture, pay, fulfill, deploy | Governance policy (delegate to Foundation) |
| **Intelligence** | Score, recommend, ingest signals | Execute orders or charges |
| **Foundation** | Policy, soul, decisions registry | Operational dashboards (delegate to Runtime) |
| **Runtime** | Advisory dashboards, certification | Mutate production commerce state |
| **Pillow** | Chat, plan, Cursor bridge | Bypass approval gate |

### 3.2 Cross-layer imports

- `domain/` must not import from `runtime/`.
- `runtime/` may import from `domain/` read-only repositories.
- `execution/` may import `intelligence/` and `connectors/`.
- `foundation/` must not import `execution/`.
- `pillow/` package must not import `backend/` (use brain-adapter).

---

## 4. Folder Conventions

### 4.1 Backend module structure (standard)

```
{subsystem}/
├── index.ts              # Public exports
├── routes/               # Fastify HTTP registration
├── services/             # Business logic
├── tools/                # Brain dispatch tools (if applicable)
├── models/               # Types and schemas
└── repositories/         # DB access (if applicable)
```

Optional: `contract/`, `engines/`, `mappers/` for Eye-style subsystems.

### 4.2 Frontend module structure

```
empireai-web/
├── app/(platform)/platform/{module}/page.tsx   # Thin route
├── components/platform/modules/{Module}.tsx      # UI
└── lib/brain/hooks/useBrainModule.ts             # Data hook

frontend/
├── pages/dashboard/{Page}.tsx
├── api/{domain}.ts
└── components/{domain}/
```

### 4.3 Documentation

- Architecture changes: `docs/architecture/` + ADR in `docs/governance/` if significant.
- New Cockpit department widget: update `PROJECT_COCKPIT_SPECIFICATION.md`.
- New connector: update canonical architecture Connectors section.

### 4.4 Placeholder folders

`database/migrations/`, `automation/workflows/`, `ai-agents/` — placeholders until populated. **Do not add features there** without a REAL mission to activate the folder.

---

## 5. Naming Conventions

| Artifact | Convention | Example |
|----------|------------|---------|
| Runtime module folder | kebab-case, domain noun | `global-command-center` |
| Brain tool | `{module}.{action}` snake | `store.get_storefront` |
| Dispatch module | kebab-case | `ai-ceo`, `live-payments` |
| Agent ID | kebab-case | `product-scout` |
| Route file | `{name}-routes.ts` | `commerce-runtime-routes.ts` |
| React module | PascalCase + Module/Page | `StoreBuilderModule.tsx` |
| API client | kebab-case file, camelCase exports | `commerce-intelligence.ts` |
| Env vars | SCREAMING_SNAKE, prefixed | `BRAIN_API_URL`, `CJ_DROPSHIPPING_API_KEY` |
| REAL mission | REAL-{NNN} | REAL-078 |

---

## 6. API Conventions

### 6.1 Prefer dispatch for platform modules

- empireai-web 12 modules: **`POST /brain/dispatch`** only.
- REST allowed for: pagination, file download, OAuth callbacks, webhooks, third-party-shaped APIs.

### 6.2 BFF rules (empireai-web)

- All Brain calls through `lib/brain/server-proxy.ts`.
- Use `resolveBrainApiUrl()` — never silent localhost in production.
- Return structured 502/503 on proxy failure, not empty 500.

### 6.3 Auth

- Cookie name: `empireai_session`.
- Protected routes: `{ preHandler: authenticate }`.
- Admin routes: explicit role check in handler.
- Pillow routes: `pillowAuth` or shared session — document which.

### 6.4 Health

- Module health: `GET /health/{module}` — ops only, not frontend.
- Platform health: `GET /health`, `GET /guardian/health`.

---

## 7. Testing Conventions

- Backend: `backend/src/validation/tests/` + `npm run validation`.
- New tool: validation test invoking tool handler.
- New connector: integration test with mock adapter; live test behind env flag.
- Frontend: typecheck + build required; E2E for auth and dispatch load smoke.

---

## 8. Future REAL Mission Rules

Every REAL mission PR description must include:

```markdown
## REAL-NNN

**Canonical subsystem:** Commerce | Intelligence | …
**Cockpit department:** Commerce | …
**Tier (if Runtime):** A | B | C | N/A
**Connector (if any):** stripe | cj-dropshipping | …
**Duplicate check:** None | Deprecates {module}
**Data mode:** live | demo | sandbox
```

### Mission types

| Prefix scope | Allowed changes |
|--------------|-----------------|
| **REAL-0xx Infrastructure** | Config, deploy, Redis, auth hardening |
| **REAL-1xx Commerce** | Manufacture, pay, fulfill, deploy |
| **REAL-2xx Intelligence** | PIE, SIE, Eye, connectors live |
| **REAL-3xx Cockpit** | UI, nav, department wiring |
| **REAL-4xx Foundation** | Governance, soul, policy |
| **REAL-5xx Runtime** | Tier A/B only with ESIS binding |
| **REAL-9xx Audit** | Read-only audits, docs |

### Prohibited in a single REAL mission

- New runtime module + new frontend + new connector (split missions).
- Production mock data without `dataMode` labeling.
- Force push to main without user request.

---

## 9. Deprecation Process

1. Mark module `@deprecated` in ESIS registry.  
2. Remove frontend binding.  
3. One release cycle with redirect or 410 on REST.  
4. Remove route registration from `app.ts`.  
5. Archive folder to `docs/archive/` reference or delete in dedicated cleanup REAL.

---

## 10. Environment & Secrets

| Var | Required prod | Owner |
|-----|---------------|-------|
| `BRAIN_API_URL` | empireai-web BFF | Deployment |
| `VITE_API_BASE_URL` | frontend build | Deployment |
| `SESSION_SECRET` / Redis | Brain auth | Infrastructure |
| `CREDENTIAL_VAULT_KEY` | Live commerce | Connectors |
| `LIVE_COMMERCE_INTEGRATION_MODE=production` | Live CJ/Amazon | Connectors |
| `ANTHROPIC_API_KEY` | Agents | Brain |

Never commit secrets. Never log full Redis URLs with passwords (REAL-070 pattern).

---

## 11. Code Review Checklist

- [ ] Canonical subsystem owner identified  
- [ ] No duplicate capability  
- [ ] Brain dispatch or justified REST  
- [ ] Auth on new routes  
- [ ] Guardian-sensitive actions have authority level  
- [ ] No direct LLM from frontend  
- [ ] Data mode labeled if demo/seed  
- [ ] ESIS updated if new page  
- [ ] Build + typecheck pass  
- [ ] REAL-NNN block in PR description  

---

*REAL-078 — Development Doctrine v1.0*
