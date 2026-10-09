# Provider coverage

Independent King's Advisor saved-state read, 2026-10-09T06:54:12Z, domain `arsenal`. No inference or external refresh was initiated by this inspection.

| Capability | Production evidence before Work6 | Work6 treatment |
|---|---|---|
| Amazon catalogue | READ_VERIFIED 06:38:18.589Z | Reuse existing bounded Four Eyes collector |
| Amazon offers | READ_VERIFIED 01:42:31.638Z | Reuse; not proof of demand/eligibility |
| Amazon account | 00:36:59.493Z, now stale | Refresh only when needed for final provider verification |
| Amazon fees/restrictions | CAPABILITY_GAP in exposed Four Eyes | Connect bounded fee/eligibility contracts; intercepted tests then safe production reads with exact operands |
| Amazon Brand Analytics | HTTP403 2026-10-08 | Genuine existing scope limitation; not fabricated eligibility |
| CJ catalogue | READ_VERIFIED 06:38:19.933Z | Reuse commissioned quota/authentication |
| CJ detail/variants | READ_VERIFIED 06:38:20.690Z | Reuse exact IDs |
| CJ warehouse stock | READ_VERIFIED 06:38:47.571Z | Reuse exact variant/origin evidence |
| CJ freight | READ_VERIFIED 06:38:48.145Z | Reuse exact variant/destination/origin; quotes are estimates |
| Keepa | Not configured | Optional, not commissioned; no purchase |
| Supplier/Amazon commercial writes | Forbidden under LOCKED | Credential-free intercepted adapters only |

Official contract references inspected during implementation:
- https://developers.cjdropshipping.com/en/api/api2/standard/points.html — stock and freight consume points; no ungoverned parallel read adapter.
- https://developer-docs.amazon/sp-api/lang-en_us/reference/getlistingsrestrictions
- https://developer-docs.amazon.com/sp-api/docs/get-product-fee-estimates-asin
- https://developer-docs.amazon/sp-api/lang-en_us/reference/getcatalogitem

No positive local test is a live provider permission claim. Current READ_VERIFIED applies only to the listed endpoint and observation time. New reads use the existing durable quota, cache, cooldown and failure receipts.
