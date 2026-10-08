# Candidate 001: pricing review, 2026-10-08

The original request failed after constitutional/context admission and before
reservation/provider HTTP. The production pricing deadline was 2026-10-08
00:00 UTC. Runtime routing recorded `failed_closed`, without HTTP status or a
reservation. The original FAILED_FATAL record must remain unchanged.

Official source reviewed on 2026-10-08:
https://developers.openai.com/api/docs/pricing

GPT-6.1 Sol standard USD per million tokens: short input 2, cache read 0.10,
cache write 2.50, output 10; long input 4, cache read 0.20, cache write 5,
output 15. Regional processing premium is 10%.

Existing conservative reservation and estimated settlement coefficients remain
2.75/11 for short context and 5.5/16.5 for long context. They already bound
these rates; no pricing arithmetic, model, routing, retries, token bounds,
ledger schema, historical row, invoice field or authority needs changing.

Renew only this reviewed OpenAI model through 2026-10-15 00:00 UTC, retaining
the seven-day review cadence. Other providers keep their existing deadline
pending their own review. October's commissioning window remains unchanged.
Reject non-finite timestamps as well as expired windows.

This is the owner's targeted recovery, not a new canonical Work. Exactly one
successor investigation is authorised after CI and deployment; no inference
is consumed by the offline tests. Production completion and independent
Advisor acceptance are separate outstanding gates, not claimed by this patch.
