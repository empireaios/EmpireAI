# Q7-07 Local SEO Worker

## Mission

- **ID:** Q7-07
- **Name:** Local SEO Worker
- **Doctrine:** `PILLOW-LSEO-001`
- **Module:** `pillow/src/local-seo-worker/`
- **Worker ID:** `wkr-local-seo-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q7-01 … Q7-06 | FINAL PASS |

## Deliverable

Prepares local SEO assets from approved service offers: Google Business Profile recommendations, landing/service/city/area pages, titles/meta, structured data, keywords, internal linking, citations, completeness evaluation. Emits Q7-08-consumable Local SEO Reports.

Does **not** publish websites, modify live GBP automatically, purchase backlinks, or fabricate SEO performance.

## Wiring evidence

- Session: `createLocalSeoWorker` + bind LBFC + SOW + CRMW + WAW + ERR/registry/lifecycle
- `requirePillowLocalSeoWorker()`
- Subsystem id `local-seo-worker` (Q7-07)
- Host methods + `/api/pillow/local-seo-worker/*`
- Bridge / governance / config

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/local-seo-worker.test.ts" \
  "src/validation/tests/whatsapp-worker.test.ts" \
  "src/validation/tests/crm-worker.test.ts" \
  "src/validation/tests/service-offer-worker.test.ts"
# 49 pass / 0 fail (12 LSEO + 13 WAW + 12 CRMW + 12 SOW)
```
