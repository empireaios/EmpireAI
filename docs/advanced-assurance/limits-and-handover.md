# Operational limits and canonical Work handover

This release preserves the existing Candidate grant. It does not expand inference, commerce or canonical Work authority. Local policy limits are not asserted provider requirements.

| Limit | Classification and purpose | Treatment / remaining work |
| --- | --- | --- |
| NOT_BORN, commerce LOCKED; capability allowlist; workspace evidence references; single-use grant | Mandatory safety: authority isolation and prevention of external effects | Retained. Failed/completed grants cannot be reset by downstream recovery. |
| Query 120 characters | Engineering compatibility: existing adapter/server contract; not a proven external provider requirement | Exposed through validator-derived contract. Reject individual oversized jobs with feedback; decompose research into eligible jobs. Work 1 should assess actual provider constraints before changing it. |
| Three model calls, two rounds, 24 total HTTP requests, eight jobs | Acceptance-only: existing bounded Candidate grant | Not a global Pillow/API Advisor spend ceiling. No automatic grant expansion or inference during resume. |
| Four jobs / twelve HTTP requests per round; model generation up to three capabilities and three requests per job | Acceptance-only planning plus bounded external execution | Preserve generation envelope. Server schema permits four capabilities and twelve requests for other authorised callers. Test subset compatibility. |
| 15-second read timeout, two MiB response, one page / ten items | Engineering capacity | Not a proven provider maximum. Preserve partial evidence. Provider-specific pagination and continuation remain Work 1 questions. |
| No inline provider retry; five-minute job lease | Mandatory safety for unknown outcomes; engineering deadline | Resume only absent/QUEUED jobs from persisted RUNNING intent. Never reissue RUNNING/INTERRUPTED jobs or terminal historical failures. |
| Twenty active jobs and daily provider quota reservations | Engineering capacity and expenditure anomaly containment | Retained local policy, not asserted provider entitlement. Actual account/rate restrictions remain separately authoritative. |
| Ordinary object 48,000 characters; investigation envelope 524,288; model output 1,048,576; SQLite 32,768 pages | Engineering storage capacity | Investigation envelopes need multiple 64,000-character observations plus receipts. Full output separately immutable with hash/provenance. Database cap retained. |
| Evidence/job pruning | Engineering retention | Protect evidence and jobs in workspaces containing investigations, including failures. Work 1 should develop reference-aware archival and capacity monitoring before relaxing protection. |
| Pricing review expiry | Financial-accounting safety and local review policy | Never invent fresh prices or extend review without authoritative evidence. Expiry does not prove a price change. Preserve reservations, usage, estimates and failed calls. |
| Authentication, actual account ceilings/rate limits and strict provider output schema | External provider requirements where documented or observed | Required fields/nullable optional strings normalized before validation. No subscription, quota purchase or provider authority implied. |

## Handover boundaries

- **Work 1:** deeper provider-limit, batching, pagination, retention and capacity audit. Recording these items does not start Work 1.
- **Work 5:** all-in infrastructure cost and invoice reconciliation remain distinct from API estimates. Charges, tax, FX, credits and unsettled invoices stay unknown where unverified. Work 5 remains paused.
- **Work 6:** no commerce, supplier writes, purchases or fulfilment authority. Work 6 has not started.
- **Work 8:** deterministic synthetic tests and bounded operational evidence are not full certification. Work 8 has not started.
- No Birth authorisation or new canonical Work is created.
