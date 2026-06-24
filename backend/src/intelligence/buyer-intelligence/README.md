# Buyer Intelligence

> **Mission 022 — Foundation**  
> **Status:** Types, contracts, schema proposal, and architecture documentation only  
> **Path:** `backend/src/intelligence/buyer-intelligence/`

## Purpose

Buyer Intelligence derives **who is buying, why, and when** from Eye observations. It sits between the Observation plane and Product Intelligence, providing buyer context that Product Intelligence may consume independently.

```
Internet → Eye → Observation → Buyer Intelligence → Product Intelligence → Empire Product Score → Recommendation Engine
```

## Independence from Product Intelligence

- No imports from `product-intelligence-engine/` or `product-scoring-engine/`
- Own entity models, repository contracts, and proposed `bi_*` tables
- Product Intelligence remains unchanged in Mission 022

## Module layout

| Path | Role |
|------|------|
| `contract/` | `BuyerIntelligenceModuleContract` and capability catalog (no Brain wiring) |
| `models/` | Typed entities: persona, intent, need category, trigger, segment |
| `repositories/` | Workspace-scoped CRUD/query interface contracts |
| `schema/` | Proposed SQLite table row types and SQL sketch |
| `docs/` | Full architecture specification |

## Entities

- **BuyerPersona** — demographics, psychographics, pain points, goals
- **BuyerIntent** — awareness / consideration / purchase stage, urgency, signals
- **NeedCategory** — classified needs linked to Eye observation domains
- **PurchaseTrigger** — events and conditions that elevate purchase likelihood
- **AudienceSegment** — rule-based segments with size estimates

## Next missions (not in scope)

- Repository implementations and migrations
- Eye observation ingestion pipelines for buyer signals
- Brain module registration and runtime engine
- Product Intelligence integration adapters

See [docs/BUYER_INTELLIGENCE_ARCHITECTURE.md](./docs/BUYER_INTELLIGENCE_ARCHITECTURE.md) for the full design.
