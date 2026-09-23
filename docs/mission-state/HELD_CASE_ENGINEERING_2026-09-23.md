# Held-case collection and spending controls — engineering only

No model calls, commercial actions, certification credit or authority promotion occurred. Production unchanged.

## Verified offline scope

- New held-case collector: 16/16 tests passed, independently repeated. Blind step projection, exact test scope, fixed bounds, authenticated workspace and durable request polling, lost-submission uncertainty, append/fsync intent before submission, journal write barrier, actual child-process termination and read-only recovery. No automatic replay of uncertain requests. Distinct closed HTTP connections do not prove phone browser reload.
- New native SQLite campaign ledger: 6/6 tests passed, independently repeated; focused strict TypeScript check passed. Atomic integer micro-USD reservations under concurrent processes, immutable campaign identity/cap/expiry, duplicate attempt cannot authorize redispatch, uncertain exposure retained across reopen/process exit, final receipt settlement and overrun halt. Process exit is not a power-loss test.
- Both are independently reviewed offline primitives. Collector live CLI remains NOT_EXECUTED because implemented budget enforcement verification is absent. Ledger is not wired into provider calls. Trusted callers must verify owner approval, final provider receipt authenticity and valid worst-case costs; no pricing invented.

## Outstanding engineering blockers

Existing LLM router checks a fixed estimate before calling providers without atomic reservation. Concurrent requests can pass against the same budget. Successful charges use a model-independent estimate; accounting errors are swallowed; timeout does not cancel provider execution or record uncertain exposure. Required provider/model and campaign scopes are not fully enforced. Engineering mode currently rejects paid AI, and the bounded recovery launcher rejects provider credentials. Preserve those locks while implementing a separately authorized tightly scoped test path. Budget projections alone are not enforcement evidence.

Remaining: verified pricing and token upper bounds, no hidden SDK retries/fallback, trusted campaign approval binding and persistent ledger integration, timeout uncertainty accounting, authenticated enforcement receipt and zero-spend denial probe, collector adapter, then separately authorized model execution. No certification acceptance inferred from test fixtures.

## Preserved failures and limits

- An independent ledger test invocation failed before test execution with TSX/os.userInfo ENOMEM; a permitted isolated retry passed six tests. Earlier author invocation used an invalid Windows import URI and failed before tests; corrected file URI passed. Neither failed invocation is a pass.
- Review found lost POST responses could be mislabeled NOT_EXECUTED; fixed before activation, with uncertain intent and idempotency key retained. Crash-safe journaling added before activation.
- Three historical recovered artifact files were unexpectedly absent in integration. Cause remains unknown. Only those absent files were restored byte-for-byte from Git HEAD and checked against manifest hashes. No historical evidence content changed; do not attribute deletion to tests without evidence.
- Hash chains detect internal journal corruption, not malicious deletion or complete-prefix truncation. Acquisition and budget artifacts grant zero Birth/Wave/commerce credit.
