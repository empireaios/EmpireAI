# EMPIREAI DECISIONS

> Living memory document — architectural decision record

## ADR-001: Brain as single orchestration point

**Status:** Accepted  
**Decision:** All platform actions flow through the Brain Orchestrator.  
**Rationale:** Security, auditability, Guardian enforcement, consistent agent routing.  
**Consequences:** Frontend uses BFF proxy only; no direct provider calls.

## ADR-002: SQLite for Phase 1–3 persistence

**Status:** Accepted (with scale exit path)  
**Decision:** Use SQLite with WAL mode for domain, audit, ledger.  
**Rationale:** Zero-ops local dev, single-file backup, sufficient for early stage.  
**Consequences:** Must migrate to PostgreSQL before multi-tenant scale.  
**Backup provider:** PostgreSQL with row-level tenant isolation (TBD).

## ADR-003: Redis for async infrastructure

**Status:** Accepted  
**Decision:** BullMQ task queue, sessions, and event bus require Redis.  
**Rationale:** Industry-standard async patterns; integration tests degrade gracefully without Redis.

## ADR-004: Guardian pre-dispatch assessment

**Status:** Accepted  
**Decision:** Guardian runs before every orchestrator dispatch when `GUARDIAN_ENABLED=true`.  
**Rationale:** Fail-safe doctrine; blocks destructive payloads and integrity failures.

## ADR-005: Connector stub pattern

**Status:** Accepted (Phase 3)  
**Decision:** Catalog all connectors with stub implementations implementing `EmpireConnector`.  
**Rationale:** Provider-agnostic architecture before OAuth credentials exist.  
**Deferred:** Live OAuth for Shopify, Stripe, Meta.

## ADR-006: Append-only financial ledger

**Status:** Accepted  
**Decision:** All financial state from `financial_ledger_events`; no balance columns updated in place.  
**Rationale:** Full reconstructability; audit trail; treasury derivation.

## ADR-007: 10% EmpireAI royalty

**Status:** Accepted (framework constant)  
**Decision:** Royalty calculated as 10% of net profit in treasury engine.  
**Rationale:** Business model placeholder; configurable later.  
**Note:** Requires human approval before production billing enforcement.

## ADR-008: Retention preservation on cancellation

**Status:** Accepted  
**Decision:** Cancellation → `preserved` status; data retained.  
**Rationale:** Constitution Article VI; exit survey + AI retention recommendations.

## ADR-009: PIE explainability requirement

**Status:** Accepted  
**Decision:** Every product score includes dimension rationales and `why[]` array.  
**Rationale:** Founders must understand recommendations, not trust black boxes.

## ADR-010: Next.js BFF over direct Brain calls from browser

**Status:** Accepted  
**Decision:** Browser calls `/api/*`; server proxies to Brain with cookies.  
**Rationale:** Session security; hides Brain URL; CORS simplification.

---

## Pending decisions (require human judgment)

| ID | Question | Options |
|----|----------|---------|
| PDR-001 | Database at scale | SQLite continue vs PostgreSQL migration |
| PDR-002 | First live connector | Stripe vs Shopify vs Meta |
| PDR-003 | LLM routing policy | Default provider, cost caps, fallback chain |
| PDR-004 | Credentials vault | Env vars vs HashiCorp vs cloud KMS |

_Last updated: Phase 3 architecture foundation_
