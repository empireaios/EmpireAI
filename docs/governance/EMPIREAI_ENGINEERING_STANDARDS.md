# EMPIREAI ENGINEERING STANDARDS

> **Classification:** CANONICAL — Tier 3 Law (Engineering Standards)  
> **Document ID:** P4-01  
> **Constitutional phase:** P4 — Engineering Foundation  
> **Dependencies:** P1 complete · P2 complete · P3 complete · Engineering Constitution · Architecture Law  
> **Owner:** Chief Architect · Repository Governance  
> **Authority:** CANONICAL — **single permanent engineering standards authority** for all repository change; subordinate to CTD · Engineering Constitution · Architecture Law  
> **Parent:** [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) (P2-03) · [`EMPIREAI_ARCHITECTURE_LAW.md`](../architecture/EMPIREAI_ARCHITECTURE_LAW.md) (P2-05)  
> **Ratified:** 2026-07-05 (P4-01)  
> **Role:** Permanent engineering rules governing every repository change, Builder mission, Cursor execution, documentation update, review, validation, testing, and implementation

**Engineering law:** [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) — Articles I–IX · mission lifecycle · prohibited practices  
**REAL companion:** [`DEVELOPMENT_DOCTRINE.md`](../architecture/DEVELOPMENT_DOCTRINE.md) — REAL mission rules · module gates · folder conventions (extends this document)  
**Builder execution:** [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md) (P3-04) · [`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`](../../EMPIREAI_CURSOR_OUTPUT_STANDARD.md)  
**Naming · repository · documentation:** [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) · [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) · [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md)

---

## 1. Purpose

P4-01 establishes the **canonical Engineering Standards** — the permanent rules every engineer, Builder agent, and REAL mission must follow. This document **standardizes practice** without duplicating constitutional law already defined elsewhere.

| Engineering Standards IS | Engineering Standards IS NOT |
|----------------------------|------------------------------|
| Single engineering practice authority for P4+ | Engineering Constitution (law — `EMPIREAI_CONSTITUTION.md`) |
| Mandatory rules for repo change · review · test | Architecture owner (Canonical Architecture · P3 docs) |
| Integration hub referencing governance | Competing naming or documentation law |
| Builder · Cursor · human engineer binding rules | Pillow intelligence or mission author |

**The principle:** Constitution governs · Architecture shapes · **Engineering Standards execute** · Builder implements under supervision · Production Truth validates.

**Rule:** One canonical engineering standards document (this file). **Development Doctrine** remains the REAL-mission companion — not a competitor.

---

## 2. Constitutional Stack

```
CTD (commercial bounds)
        ↓
Engineering Constitution (EMPIREAI_CONSTITUTION.md)
        ↓
Architecture Law · ACD · Canonical Architecture · P3 architectures
        ↓
Engineering Standards (this document — P4-01)
        ↓
Development Doctrine · Cursor Output Standard · ADR register
        ↓
Implementation · Tests · Production Truth
```

Every change **must** remain traceable: Vision → Constitution → Architecture → **these standards** → code → PROOF.

---

## 3. Repository Engineering Principles

| # | Principle | Authority |
|---|-----------|-----------|
| ES-1 | **Repository First** — approved knowledge lives in git | [`EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md`](../../EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md) |
| ES-2 | **Journey First** — structural programme changes sync Journey | ADR-014 · Journey Audit |
| ES-3 | **Single Brain path** — UI → BFF/REST → Brain → Tool/Agent | ADR-CON-003 · Brain Architecture |
| ES-4 | **Pillow owns subsystems** — extend owner, never duplicate | Pillow Constitution §17 |
| ES-5 | **No silent drift** — architecture and repository stay aligned | CTD-021 · Architecture Law §8 |
| ES-6 | **Fail closed in production** — no mock-as-live | CTD-017–019 · ADR-CON-002 |
| ES-7 | **Verify before success** — tests + acceptance evidence | ADR-CON-009 · Production Truth |
| ES-8 | **ADR before structural change** | ADR System P3-07 · Architecture Law E1 |
| ES-9 | **Minimal diff** — solve the mission; no drive-by refactors | Builder Architecture · Supervisor |
| ES-10 | **Quality over speed** — no production hacks | Engineering Constitution Art. IX |

---

## 4. Code Organization

**Normative structure:** [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) §3 · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](../architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.

| Layer | Path | May contain |
|-------|------|-------------|
| Brain | `backend/src/brain/` | Orchestrator · Guardian · LLM · queue · audit |
| Domain modules | `backend/src/{orchestration,intelligence,execution,revenue,foundation,connectors}/` | Business logic · tools · routes |
| Pillow | `pillow/src/` | COI package — no `backend/` imports |
| Cockpit | `empireai-web/` | BFF · platform modules · navigation |
| Founder shell | `frontend/` | Executive depth SPA (until ADR-CON-001 resolves authority) |
| Governance | `docs/governance/` | Law · policies · standards |
| Architecture | `docs/architecture/` | Normative architecture · Development Doctrine |

**Module template (backend):** See [`DEVELOPMENT_DOCTRINE.md`](../architecture/DEVELOPMENT_DOCTRINE.md) §4.1 — `index.ts` · `routes/` · `services/` · `tools/` · `models/` · `repositories/`.

**Cross-layer imports:** See Development Doctrine §3.2 — `domain/` must not import `runtime/`; `pillow/` must not import `backend/`.

---

## 5. Naming Conventions

**Canonical authority:** [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) · [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md).

| Artifact | Rule | Example |
|----------|------|---------|
| Folders | kebab-case | `product-intelligence-engine` |
| Brain tools | `{module}.{action}` | `commerce_readiness.launch_decision` |
| Dispatch modules | kebab-case | `live-payment-engine` |
| Agent IDs | kebab-case | `product-scout` |
| React components | PascalCase | `CommerceEnginePanels.tsx` |
| Env vars | SCREAMING_SNAKE | `REDIS_URL` |
| Missions | REAL-### · CON-### · ADR-### | REAL-078 |
| Session cookie | **Frozen** `empireai_session` | ADR required to change |
| Health probe | **Frozen** `/health/live` | ADR required to change |

**New display names or mission prefixes:** ADR + Naming Standard §10 before CANONICAL use.

---

## 6. File & Folder Standards

| Rule | Standard |
|------|----------|
| **One canonical home** | Every artifact has one path per Repository Structure §3 |
| **Classification header** | CANONICAL docs use ECDS header block (Documentation Law) |
| **No orphan modules** | New `backend/src/runtime/` requires Runtime Gate (Development Doctrine §2.4) |
| **Placeholder folders** | `database/migrations/` · `automation/workflows/` — activate only via REAL mission |
| **Secrets** | Never committed — `.env.example` placeholders only |
| **Generated output** | `dist/` · `node_modules/` — never edited manually |
| **Evidence** | `artifacts/` · `docs/audits/` — EVIDENCE class, not law |

---

## 7. Documentation Standards

**Law:** [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md) (ECDS-1).

| Change type | Required documentation |
|-------------|-------------------------|
| Structural architecture | Update Canonical Architecture §3 + ADR |
| P3 subsystem boundary | Update relevant P3 architecture doc |
| New Cockpit department | `PROJECT_COCKPIT_SPECIFICATION.md` + ESIS binding |
| New connector | Connectors catalog + Canonical Architecture §3.11 |
| Governance policy | Doctrine System register §10 |
| Builder mission output | Cursor Output Standard §1–§2 |
| Programme status | `JOURNEY.md` if structural |

**Prohibited:** Creating a second doc for the same authority tier. Amend canonical doc or add ADR.

---

## 8. Architecture Compliance

Before merge, verify alignment with:

| Check | Source |
|-------|--------|
| Subsystem owner | Canonical Architecture §3 · Pillow §17 |
| Control flow | Brain dispatch — no forbidden paths (Canonical Architecture §4) |
| ACD constraints | `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md` |
| P3 boundaries | Brain · Pillow · Cockpit · Builder · Commerce · Infrastructure architectures |
| Duplicate capability | Development Doctrine §2.3 |
| CRI launch scope | Development Doctrine §2.2A · CRI Doctrine |

**Structural change:** ADR in [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) before irreversible merge.

---

## 9. Dependency Management

| Rule | Implementation |
|------|----------------|
| **Monorepo packages** | `pillow/` built before `backend/` (Railway build order) |
| **No frontend provider SDKs** | Stripe · OpenAI · CJ — Brain/connectors only |
| **Version pinning** | Lockfiles committed · no floating major bumps without ADR |
| **New npm dependency** | Justify in PR · prefer existing stack · security review if external-facing |
| **Registry-first commerce** | REG-* rows before hardcoded provider logic (G2 tenets) |
| **Pillow → Brain** | `brain-adapter` only — no direct backend imports from pillow package |

---

## 10. Error Handling

| Context | Standard |
|---------|----------|
| **HTTP API** | Structured JSON errors · appropriate status codes · no stack traces to client in production |
| **BFF proxy** | 502/503 on Brain unreachable — not empty 500 (Development Doctrine §6.2) |
| **Brain dispatch** | Guardian blocks destructive payloads · audit on failure |
| **Connectors** | Fail loud in live mode · mock only when explicitly gated |
| **LLM** | Router timeout (45s) · no unbounded waits |
| **SQLite persist** | Debounced async — never block event loop on full export |
| **User-facing** | Label demo/mock data — never pass as Production Truth |

---

## 11. Logging Standards

| Rule | Standard |
|------|----------|
| **Structured logs** | Fastify/logger — JSON in production where configured |
| **Secrets** | Never log passwords · full Redis URLs · API keys |
| **PII** | Minimize in commerce/CS logs |
| **Audit trail** | Material actions → `audit_logs` · EKLS contributions |
| **Levels** | `error` for failures · `warn` for degradation · `info` for lifecycle |
| **Guardian** | Risk and recovery plans recorded (guardian tests assert) |

---

## 12. Configuration Standards

| Rule | Standard |
|------|----------|
| **Env vars** | Document in `backend/.env.example` · deployment templates |
| **Production required** | Assessed by `production-infrastructure-readiness.ts` |
| **Frozen IDs** | Cookie name · health path — ADR to change |
| **Feature flags** | Explicit env vars · default safe (extension routes off) |
| **Build-time vs runtime** | `VITE_*` build-time · Brain env runtime |
| **CORS** | Exact origin match — no wildcard in production |

**Templates:** `deployment/railway-production.env.template` · `deployment/vercel-cockpit.env.template`

---

## 13. Environment Standards

| Environment | Purpose | Rules |
|-------------|---------|-------|
| **Development** | Local engineer | `.env.local` · SQLite `./data/` · mocks allowed |
| **Testing** | CI validation | `:memory:` DB · `npm run validate:full` gate |
| **Staging** | Pre-prod (optional) | Separate Redis/DB · no production secrets |
| **Production** | Live Grand King | MPD-001 sequence · no `REDIS_OPTIONAL` · no sandbox tools |
| **Recovery** | Incident restore | Railway/Vercel rollback + volume restore |
| **Sandbox** | Commerce dev | Never cite as Production Truth (CTD-018) |

**Authority:** [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](../architecture/EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md) §8.

---

## 14. Testing Standards

| Layer | Requirement |
|-------|-------------|
| **Backend unit/integration** | `backend/src/validation/tests/` — new tools require handler test |
| **Pre-deploy gate** | `npm run validate:full` (typecheck + validation suite) |
| **New Brain tool** | Validation test invoking tool handler |
| **New connector** | Mock adapter test; live test behind env flag |
| **Frontend** | Typecheck + build required |
| **Pillow subsystems** | `pillow/src/validation/tests/` |
| **Smoke** | `production-journey-verify.mjs` post-deploy |
| **UI missions** | Browser verification before success claim (Engineering Constitution §5) |

**Prohibited:** Declaring mission complete on unit tests alone when UI/production-facing without acceptance tier proof.

---

## 15. Validation Requirements

| Stage | Validation |
|-------|------------|
| **Mission start** | Vision Sync (P4-02) + Context Sync (P4-03) + Cursor Protocol (P4-04) + Recovery Doctrine (P4-05) + Browser Truth (P4-06) + E2E Testing (P4-07) + Journey System (P4-08) + Brain Runtime (P5-01) + Production Mode (P5-02) + Durable Sessions (P5-03) + Guardian Monitoring (P5-04) + Scaling Architecture (P5-05) + Performance Governance (P5-06) + Execution Control Center (P6-01) + Vision Integrity Engine (P6-02) + Supervisor System (P6-03) + Builder Monitor (P6-04) + ETA Engine (P6-05) + Autonomous Recovery Engine (P6-06) + Zero-Human Automation (P6-07) |
| **Mission complete** | Repository PASS · Production PASS · Grand King PASS (P4-06 Browser Truth) · E2E critical journeys validated (P4-07) |
| **Implementation** | Lint/typecheck clean on touched packages |
| **Pre-merge** | `validate:full` or scoped tests for touched domains |
| **Repository Acceptance** | Tests · docs · ADR if structural · Journey if programme |
| **Production Acceptance** | Deploy proof · health · journey verify |
| **Grand King Acceptance** | Sovereign verification when required |
| **Architecture** | ACD compliance · no duplicate subsystem |
| **Constitutional** | P2-07 validation patterns — no CTD violation |

---

## 16. Review Requirements

### 16.1 Code review checklist (mandatory)

- [ ] Canonical subsystem owner identified (Development Doctrine §11)
- [ ] No duplicate capability
- [ ] Brain dispatch or justified REST
- [ ] Auth on new routes
- [ ] Guardian authority on sensitive actions
- [ ] No direct LLM from frontend
- [ ] Data mode labeled if demo/seed
- [ ] ESIS updated if new Cockpit page
- [ ] ADR linked if structural
- [ ] Scope matches mission brief — no unauthorized expansion

### 16.2 Builder / Cursor review

Supervisor continuous interrogation per [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md). Output conforms to [`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`](../../EMPIREAI_CURSOR_OUTPUT_STANDARD.md).

### 16.3 Architecture review

Chief Architect for normative architecture changes · Grand King for ADR-CON-* and irreversibles.

---

## 17. Change Management

| Change type | Process |
|-------------|---------|
| **Bug fix** | Root cause analysis — not symptom-only (Engineering Constitution §8) |
| **Feature (REAL)** | REAL mission brief · Development Doctrine §8 template |
| **Constitutional (CON)** | Constitution Lock · Grand King |
| **Structural** | ADR draft → review → merge → Canonical Architecture update |
| **Production deploy** | MPD-001 sequence · Production Truth update |
| **Dependency major bump** | ADR or mission justification |
| **Folder rename** | ADR + migration plan (Naming Standard) |

**Builder rule:** No git commit unless user explicitly requests. No force push to main.

---

## 18. Backward Compatibility

| Rule | Standard |
|------|----------|
| **API contracts** | Brain tool names stable — deprecate before remove |
| **Session cookies** | `empireai_session` — migration path if changed |
| **Database** | SQLite schema changes backward-compatible or migration REAL |
| **Env vars** | Support deprecated alias one release when renaming (document in ADR) |
| **Frontend routes** | Redirect or 410 after deprecation cycle (Development Doctrine §9) |
| **REAL namespace** | ADR-044 precedence — no duplicate REAL IDs |

---

## 19. Deprecation Policy

Process (from Development Doctrine §9):

1. Mark `@deprecated` in ESIS/registry  
2. Remove frontend binding  
3. One release cycle — redirect or 410 on REST  
4. Remove route from `app.ts`  
5. Archive or dedicated cleanup REAL  

**Superseded docs:** Historical class — zero authority · pointer to successor.

---

## 20. Security Engineering

| Domain | Expectation |
|--------|-------------|
| **Auth** | `{ preHandler: authenticate }` on protected routes |
| **Admin** | Explicit role check |
| **Secrets** | Env + credential vault — never git |
| **Transport** | HTTPS only in production |
| **CORS** | Allowlist exact origin |
| **Guardian** | Pre-dispatch on external/destructive actions |
| **Rate limiting** | Auth and sensitive routes |
| **Webhook verification** | HMAC/signature before order advancement |
| **PCI scope** | Stripe-hosted checkout — minimize card data exposure |
| **Sandbox in prod** | Forbidden — `*_sandbox_only` blocked in live mode |

**Authority:** Engineering Constitution · Guardian · ADR-CON-002 production mode.

---

## 21. Performance Expectations

| Domain | Target / rule |
|--------|---------------|
| **Executive Home dispatch** | Warm <3s (post-optimization baseline) |
| **LLM calls** | 45s router timeout |
| **SQLite persist** | Debounced — no event-loop starvation |
| **SSE** | Client cleanup on close |
| **Worker jobs** | BullMQ via Redis — worker service in production |
| **N+1 queries** | Avoid in hot paths — repository batching preferred |
| **Extension routes** | Deferred registration when gated — document load impact |

**V1 limits:** Single Brain instance · SQLite single-writer — see Infrastructure Architecture §14.

---

## 22. Production Readiness Requirements

Before production-facing merge:

| Gate | Evidence |
|------|----------|
| `validate:full` PASS | CI/local |
| Env template updated | `.env.example` + deployment template |
| `production-infrastructure-readiness` | No blockers for hosting vars |
| Health endpoints | `/health/live` returns 200 |
| No mock-as-live | CTD-017 compliance |
| CORS + cookies | Cross-origin tested |
| CRIR / readiness | Commerce launch paths gated |
| Production Truth | STATUS updated when live |
| Triple acceptance | Repository · Production · Grand King as applicable |

**Deploy sequence:** [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md)

---

## 23. Builder & Cursor Execution

All Builder work **must** comply with:

| Standard | Document |
|----------|----------|
| Execution pipeline | Builder Architecture §6 |
| Supervisor telemetry | Supervisor Governance |
| Output format | Cursor Output Standard |
| Recovery | Cursor Recovery Doctrine |
| Mission artifacts | `.cursor/missions/` README |
| Scope | Approved brief only — no autonomous expansion |

---

## 24. Validation Checklist (P4-01)

| Check | Status |
|-------|--------|
| Aligns with Engineering Constitution · CTD | §2 · §3 |
| Aligns with Architecture Law · P3 architectures | §8 |
| References existing governance — no duplication | Header · companions |
| Single canonical standards authority | §1 |
| All mandatory sections included | §3–§22 |
| Development Doctrine positioned as companion | §1 · §4 |
| Cross-references completed | §25 Related |

---

## 25. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P4-01 — Engineering Standards |
| **Ratification date** | 2026-07-05 |
| **Next P4 mission** | As defined in Constitution Lock / Roadmap |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P4-01 | Canonical Engineering Standards — P4 engineering foundation |

---

## Related

- [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) · [`DEVELOPMENT_DOCTRINE.md`](../architecture/DEVELOPMENT_DOCTRINE.md)  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md) · [`EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md`](./EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md)  
- [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) · [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) · [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md) · [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md)
