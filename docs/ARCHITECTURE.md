# EmpireAI Architecture

EmpireAI is an AI Operating System: a sovereign platform where founders manufacture and operate autonomous companies through a single Brain orchestration layer.

## System layers

```
┌─────────────────────────────────────────────────────────────┐
│  empireai-web (Next.js)                                     │
│  Platform UI · BFF (/api/*) · Session cookies               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (never direct tool/LLM calls)
┌───────────────────────────▼─────────────────────────────────┐
│  Brain API (Fastify, port 4000)                             │
│  Auth · Guardian · Orchestrator · SSE events                │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Agent Manager      Workflow Engine      Tool Registry
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
              Task Queue (BullMQ) → Workers
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   LLM Router          Memory Store         Event Bus
        │                   │                   │
        └───────────────────┴───────────────────┘
                            ▼
                    SQLite (domain + audit)
                    Redis (queue + sessions + pub/sub)
```

## Control flow (mandatory)

Every platform action follows this path:

1. User interacts with a Next.js module component
2. Component calls `/api/brain/dispatch` (BFF proxy)
3. Brain authenticates session and checks role permissions
4. **Guardian** assesses dispatch safety (workspace, payload, authority)
5. **Orchestrator** routes to tool, agent, or workflow
6. Result returns through the same chain; audit log written

No frontend code may bypass the Brain or call LLM providers directly.

## Domain model

Persistent portfolio data lives in SQLite under `backend/src/domain/`:

| Entity | Table | Purpose |
|--------|-------|---------|
| Workspace | `workspaces` | Tenant boundary |
| Company | `companies` | Manufactured ventures |
| Build pipeline | `company_build_stages` | Store builder progress |
| Activity | `activity_events` | Agent activity feed |
| Orders | `orders` | Fulfillment records |
| Products | `products` | Intelligence rankings |
| Suppliers | `suppliers` | Sourcing network |
| Campaigns | `marketing_campaigns` | Marketing AI |
| Ad channels | `ad_channels` | Paid acquisition |
| Tickets | `support_tickets` | Customer support |

Module load tools (`*.load_view`) read from repositories — not hardcoded arrays.

## Guardian Engine

Pre-dispatch safety checks:

- Empty workspace rejection
- Database integrity (`PRAGMA integrity_check`)
- Destructive payload key blocking
- L3/L4 authority gates (`founderApproved`)
- High-risk actions require `payload.confirmed=true`

Health monitor probes 13 subsystems on `/health` and `/guardian/health`.

## Modules (12)

| Module | Brain route | Primary data source |
|--------|-------------|---------------------|
| dashboard | `dashboard:load` | Domain portfolio |
| ai-ceo | `ai-ceo:load` | Domain + briefing |
| intelligence | `intelligence:load` | Products |
| suppliers | `suppliers:load` | Suppliers |
| store | `store:load`, `store:create`, `store:manufacture` | Companies + pipeline |
| marketing | `marketing:load` | Campaigns |
| ads | `ads:load` | Ad channels |
| finance | `finance:load` | Computed P&L |
| orders | `orders:load` | Orders |
| support | `support:load` | Tickets |
| settings | `settings:load` | Workspace + integrations |
| admin | `admin:load` | Platform metrics |

## Validation

```bash
cd backend
npm run validate:full
```

Runs TypeScript check, unit/integration tests, Guardian health probe, and writes `phase25-report.json`.

Integration tests require Redis; they degrade gracefully when unavailable.

## Deployment

See [deployment/README.md](../deployment/README.md) for Docker Compose and production checklist.

## Future work

- Multi-tenant workspace isolation at API level
- Real Shopify/Stripe/Meta OAuth integrations
- Workflow completion hooks updating company build stages
- Prometheus exporter for `/metrics`
- Horizontal worker scaling
