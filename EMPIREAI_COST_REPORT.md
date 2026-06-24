# EMPIREAI COST REPORT

Generated: 2026-06-22T15:20:11.867Z

## External dependency cost intelligence

| Dependency | Purpose | Monthly | Business Risk | Technical Risk | Replaceability | Backup |
|------------|---------|---------|---------------|----------------|----------------|--------|
| redis | Task queue, sessions, event bus | $0.00 | high | medium | moderate | KeyDB / managed Redis failover |
| sqlite | Domain, audit, ledger persistence (sql.js WASM) | $0.00 | medium | low | moderate | better-sqlite3 or PostgreSQL at scale |
| openai | LLM agent execution | $0.00 | medium | medium | easy | anthropic / google-ai |
| stripe | Founder billing and payouts | $0.00 | high | low | moderate | paypal |
| shopify | Commerce storefront sync | $29.00 | high | medium | moderate | woocommerce |
| meta-ads | Paid acquisition campaigns | $0.00 | high | medium | easy | google-ads |

## Cost implications

- LLM usage is usage-based — largest variable cost at scale
- Redis required for queue/events — operational cost depends on hosting model
- SQLite suitable for early stage; migration cost deferred until scale decision
- Connector integrations may carry per-platform monthly fees (e.g. Shopify)
