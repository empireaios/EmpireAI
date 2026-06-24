# Amazon Product Intelligence Connector

> **Mission 019 — Observation-only connector**  
> EmpireAI learns **from** Amazon marketplace signals. EmpireAI does **not** sell on Amazon.

## Purpose

The Amazon connector sits on the Eye **observation plane**. It ingests product intelligence — bestseller ranks, review aggregates, price snapshots, category context — and normalizes them into unified `ProductSignal` envelopes for Brain and intelligence modules.

No live Amazon API calls, scraping, credentials, or vendor logic in the core Eye framework.

## Architecture placement

```
Brain / GPIE / PIE
        │
        ▼
Eye Query API / SignalNormalizationPipeline
        │
        ▼
AmazonConnector (EyeConnector)
        │
        ├── MockAmazonDataSource
        ├── Parser interfaces (swappable)
        └── product-signal-mapper → ProductSignal
```

Register via `EyeConnectorRegistry` or `EyeConnectorRuntime` — same pattern as `MockEyeConnector`.

## Mock vs future live phases

| Phase | Status | Description |
|-------|--------|-------------|
| **Mock (M019)** | Current | `MockAmazonDataSource` + fixtures in `mock/fixtures.ts` |
| **Parser contracts** | Defined | Interfaces ready for real HTML/API parsers |
| **Live API** | Future | Implement `AmazonProductDataSource` + parsers without changing `AmazonConnector` skeleton |

## Module layout

```
amazon/
  amazon-connector.ts       # EyeConnector implementation
  models/                   # AmazonProduct, ProductRanking, ReviewStatistics
  interfaces/               # PriceHistoryProvider, BestsellerCategoryProvider
  parsers/                  # AmazonProductParser, BestsellerParser (+ mock impls)
  mappers/                  # Amazon → observation payload → ProductSignal
  mock/                     # Fixtures and MockAmazonDataSource
```

## Parser interface contracts (future implementations)

### `AmazonProductParser` / `AmazonProductDataSource`

Future live parsers should populate:

| Field | Source (future) |
|-------|-----------------|
| ASIN | Product detail page / SP-API |
| Title, brand | Listing metadata |
| Category, subcategory | Browse node / category path |
| Price | Offer / buy-box snapshot |
| Images | Gallery URLs |
| Availability | Stock / fulfillment signals |

### `BestsellerParser` / `BestsellerCategoryProvider`

| Capability | Contract method |
|------------|-----------------|
| Category tree | `getCategoryTree(marketplace?)` |
| Best Sellers list | `getBestsellersInCategory(categoryId, limit?)` |

### `PriceHistoryProvider`

| Capability | Contract method |
|------------|-----------------|
| Price snapshots over time | `getPriceHistory(asin, limit?)` |

### Review / rating signals

Parsed via `AmazonProductParser.parseReviewStatistics()`:

- Review count
- Average rating
- Rating distribution (1–5 star percentages)

### Popularity / ranking

Parsed via `AmazonProductParser.parseRanking()`:

- Bestseller rank (overall)
- Category rank
- Estimated popularity score
- Rank trend direction

## Plugging in without changing Eye architecture

1. Implement `AmazonProductDataSource` (or individual parsers) with real data access.
2. Pass the implementation to `new AmazonConnector({ dataSource })`.
3. Register: `runtime.register(createAmazonConnector({ dataSource: myLiveSource }))`.
4. Poll via scheduler — `SignalNormalizationPipeline` consumes raw observations unchanged.

The connector id is `amazon-product-intelligence`. Signal domain: `product` (and `trend` for discovery).

## Observation flow

1. `AmazonConnector.observe()` resolves query → ASIN via mock data source.
2. Fetches product, ranking, reviews, price history.
3. `mapAmazonToObservationPayload()` derives demand/competition indices.
4. Returns `EyeRawObservation[]` with `mock: true`.
5. `SignalNormalizationPipeline.normalizeProductObservation()` produces `ProductSignal`.

## Constraints (Mission 019)

- No modifications to Brain, AI CEO, or existing working modules
- No UI changes
- No hardcoded Amazon URLs or scraping logic
- Mock infrastructure + typed contracts only
