# Pre-registered operating/financial exam criteria

Registered before executing `work8-operating-exams.ts`.

Scope: isolated canonical CommerceWorker + GovernedCommerceEngine + immutable SQLite receipt history + derived simulated financial replay. Synthetic identities and intercepted providers only. This does not certify real provider access, Pillow inference, production UX, wall-clock endurance or Work 8 closure.

Bound: four seeded scenarios by default (positive, loss, refund, payout delay), two orders each, maximum 24 scenarios/48 orders. Each mission advances virtual start time by one day; in-mission worker time is fixed so this is accelerated virtual time, not elapsed-day endurance. All scenario inputs and expected financial totals are retained.

Pass criteria per scenario:
1. Canonical task completes within its stored step limit and both uniquely identified orders independently show DELIVERED, matching accepted/shipped/delivered quantities and immutable shipment evidence.
2. Commit one command receipt without advancing task cursor, close database, reopen new engine/worker, then resume. Receipt is neither duplicated nor lost; pre-restart prefix digests remain identical.
3. Replay verified store history, retain source finance events and source receipt digest, and prove integer journal balance and independent conservation.
4. Positive scenario realises expected contribution; loss scenario exposes negative contribution/cash need; refund matches a canonical remedy; payout delay retains held funds and null realised contribution.
5. Same seed yields identical semantic trace digest despite a different temporary database path. Financial projection replay with exact duplicate events is unchanged except duplicate counter.
6. All receipt/state externalEffects and paidInference counters are zero. All orders are SANDBOX. This is evidence for the isolated intercepted boundary, not an observation of production egress.

Failures throw with a specific invariant and block the exam report. Temporary DB paths are returned for checkpoint retention; full immutable receipts and event inputs are also returned so the orchestrator can persist them with its existing evidence.
