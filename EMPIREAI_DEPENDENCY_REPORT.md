# EMPIREAI DEPENDENCY REPORT

Generated: 2026-06-22T15:20:11.867Z

## Runtime dependencies

| Dependency | Required | Purpose | Failure mode |
|------------|----------|---------|--------------|
| Redis | Yes | Queue, sessions, events | Integration tests skip; async jobs fail |
| SQLite | Yes | Domain, audit, ledger | Guardian blocks writes on integrity failure |
| LLM API keys | Optional | Agent/workflow execution | Degraded — load tools still work |

## Connector dependencies (prepared, not connected)

- **CJDropshipping** (suppliers) → backup: aliexpress, spocket
- **AliExpress** (suppliers) → backup: cj-dropshipping, alibaba
- **Alibaba** (suppliers) → backup: aliexpress
- **Spocket** (suppliers) → backup: cj-dropshipping, zendrop
- **Zendrop** (suppliers) → backup: spocket, autods
- **AutoDS** (suppliers) → backup: zendrop
- **Shopify** (commerce) → backup: woocommerce
- **WooCommerce** (commerce) → backup: shopify
- **Amazon** (commerce) → backup: ebay, etsy
- **eBay** (commerce) → backup: amazon
- **Etsy** (commerce) → backup: shopify
- **Meta Ads** (advertising) → backup: google-ads, tiktok-ads
- **Google Ads** (advertising) → backup: meta-ads
- **TikTok Ads** (advertising) → backup: meta-ads
- **Stripe** (payments) → backup: paypal
- **PayPal** (payments) → backup: stripe
- **FedEx** (shipping) → backup: ups, dhl
- **UPS** (shipping) → backup: fedex
- **DHL** (shipping) → backup: fedex
- **Google Analytics** (analytics) → backup: none catalogued
- **Google Search Console** (analytics) → backup: none catalogued
- **Google Trends** (trend_intelligence) → backup: none catalogued

## Replaceability matrix

All connectors implement `EmpireConnector` — swap providers without changing orchestrator routes.
