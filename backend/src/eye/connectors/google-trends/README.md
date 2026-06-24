# Google Trends Connector

Observation-only Eye connector that learns from Google Trends search signals.

- **Provider ID:** `google-trends`
- **Domains:** `product`, `trend`
- **Mode:** Mock observation (no live network in tests)

Captures search interest, momentum, seasonality, geo popularity, and breakout trends. Normalizes to `ProductSignal` via the Eye pipeline.
