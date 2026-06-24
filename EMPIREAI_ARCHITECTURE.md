# EMPIREAI ARCHITECTURE

> Living memory document — system architecture reference

## Control plane

```
Founder → empireai-web (Next.js BFF)
              ↓
         Brain API (Fastify :4000)
              ↓
    ┌─────────┴─────────┐
    Guardian          Orchestrator
    (pre-dispatch)         ↓
              Tools / Agents / Workflows
                         ↓
              Task Queue → Workers
                         ↓
         Domain · Ledger · Connectors · Memory · Audit
```

## Layer map

| Layer | Path | Responsibility |
|-------|------|----------------|
| UI | `empireai-web/` | Platform modules, auth, BFF proxy |
| Brain | `backend/src/brain/` | Orchestration, queue, agents, LLM |
| Guardian | `backend/src/guardian/` | Safety, health, architecture validation |
| Domain | `backend/src/domain/` | Portfolio entities (companies, orders, etc.) |
| Connectors | `backend/src/connectors/` | External provider abstraction |
| Intelligence | `backend/src/intelligence/` | Product Intelligence Engine (PIE) |
| Workforce | `backend/src/workforce/` | AI role registry |
| Finance | `backend/src/finance/` | Append-only event ledger |
| Treasury | `backend/src/treasury/` | Cash bucket derivation |
| Payments | `backend/src/payments/` | Methods, wallets, billing retries |
| Retention | `backend/src/retention/` | Pause/resume/preserve on cancellation |
| Cost | `backend/src/cost/` | Dependency cost/risk registry |
| Reporting | `backend/src/reporting/` | Architect messenger bot reports |
| Foundation | `backend/src/foundation/` | Bootstrap + exports |

## Connector interface

Every external provider implements `EmpireConnector`:

- `connect()` / `disconnect()`
- `healthCheck()`
- `invoke(capability, context, payload)`

Catalogued connectors: suppliers (6), commerce (5), advertising (3), payments (2), shipping (3), analytics (2), trends (1).

## Financial model

- **Ledger**: append-only `financial_ledger_events` — never overwrite balances
- **Treasury**: derived buckets (available, reserved, safety, withdrawable)
- **Royalty**: 10% of net profit (framework constant in treasury engine)

## Data stores

| Store | Technology | Contents |
|-------|------------|----------|
| Primary DB | SQLite (WAL) | Domain, audit, ledger, guardian, connectors |
| Queue/Events | Redis | BullMQ, sessions, pub/sub |
| Secrets | Deferred | Credentials vault for connector OAuth |

## API surface (Brain)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /brain/dispatch` | User | All module actions |
| `GET /brain/events/stream` | User | SSE live events |
| `GET /guardian/health` | User | Subsystem health |
| `GET /metrics` | Admin | Request observability |
| `GET /health` | Public | Brain status summary |

Full detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

_Last updated: Phase 3 architecture foundation_
