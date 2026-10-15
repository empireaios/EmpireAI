# Fifteen-guard candidate safety matrix

All fifteen catalog identities are mapped to executed positive/negative behavior. New regression: **15/15 passed** under Node22.23.2 with kernel egress denied. The tests assert state/receipt behavior, rejection codes or independent control-plane observations; catalog labels alone cannot pass. No production safety status, authority or closure receipt is changed.

| Guard | Positive / negative evidence | Remaining scope |
|---|---|---|
| 1. duplicate-orders | Exact existing command replay returns same version without new receipt / Distinct command ID cannot intake the same order twice | Provider-level duplicate order reconciling remains unverified |
| 2. order-reconciliation | Matching provider identity resolves UNKNOWN to ACCEPTED / Wrong provider identity is rejected | No real Amazon/CJ full-order-set reconciliation |
| 3. stock | Fresh in-stock candidate qualifies / Zero stock candidate fails STOCKOUT | Actual stock freshness/warehouse feeds not live-certified; separate race suite evidence retained |
| 4. profitability | Evidence-backed synthetic economics qualifies / Selling price below economic floor fails NON_POSITIVE_MARGIN | Scenario economics not realised commercial margin |
| 5. capital | Synthetic cash covers exposure / Insufficient available cash rejects qualification | Current actual bank capital and complete external liabilities remain unverified |
| 6. delivery | Matching shipped quantity plus delivery proof records two delivered units / Missing delivery proof rejected | Carrier authenticity, promised-date SLA and live feed unverified |
| 7. compliance | Current complete compliance evidence qualifies synthetic candidate / Compliance score below100 rejects qualification | Real product/category/seller eligibility and media rights still need evidence |
| 8. supplier-reliability | Verified current QUALITY evidence qualifies / Unverified QUALITY evidence rejects MISSING_QUALITY | No actual supplier fulfilment history or empirical reliability certification |
| 9. durability | Verified immutable history read stays identical / DELETE trigger rejects receipt removal | Local SQLite evidence not production-wide backup durability certification |
| 10. safe-retry | Identity-bound reconciliation can resolve UNKNOWN as REJECTED / Blind repeat intercept after UNKNOWN is rejected | Live provider idempotency/reconciliation not exercised |
| 11. financial-reconciliation | Canonical source values yield5400minor contribution with conservation / Forged sales amount fails canonical validation | Actual bank/provider settlement missing; simulated assumptions stay labelled |
| 12. monitoring | Fresh primary heartbeat observed by independent watchdog / Expired primary heartbeat creates MONITORING_COVERAGE_LOST without self-refresh | Full production monitoring coverage/wall-clock endurance not established by this matrix |
| 13. circuit-breakers | One bounded recovery attempt executes and failed verification is retained / Next attempt denied CIRCUIT_OPEN with execution count unchanged | Work7 owner-controlled commerce pauses have separate evidence; matrix tests recovery attempt breaker |
| 14. owner-authority | Separated OWNER role creates content-bound approval without external effects / EXECUTOR cannot issue OWNER approval | This matrix does not redo authenticated production approval acceptance |
| 15. disaster-recovery | Explicit local closed-store backup restore reproduces exact history digest / Truncated initialized journal refuses silent recreation | Local isolated restore not production RPO/RTO or infrastructure failover proof |

Exact test names, code mappings, related previously retained suites and source hashes appear in safety-matrix.json. Related suites were not broadly rerun for this matrix. Existing authenticated route and recovery evidence retain their own scope; no local test promotes an actual-capability UNKNOWN label to VERIFIED. Production release, provider contract completion and full Work8 certification remain separate gates.
