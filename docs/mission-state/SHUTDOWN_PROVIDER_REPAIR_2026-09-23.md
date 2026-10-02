# Shutdown and provider cancellation repair — 2026-09-23

Recovery3 failed before an after probe: replacement build 601b2fb2-afe5-4d59-9ac2-de431a8059bc failed before deployment, and Redis stopped about 7m46s after the fixed deadline. These failures remain in the raw recovery3 receipts. No restart-pair acceptance or Birth credit is granted.

Implemented fixes:
- Dedicated disposable Redis image supervises actual Redis with an immutable, persisted absolute expiry and service/source binding. It rejects production resource IDs, requires explicit test scope, removes unrelated credentials from the child environment, uses authenticated AOF-always/noeviction storage and reports lifecycle events. Restart policy must independently be set to Never in Railway. Expiry stops compute, not billable volumes.
- Shared process supervisor immediately completes when the exited child's process group is gone; existing descendant termination/grace behavior remains. This is a reviewed defect fix, not a proven explanation for the missing historical launcher receipt.
- Product path CI now requires a real Docker image test covering authenticated startup, AOF reopen, external SIGTERM, expiry renewal refusal, actual expiry shutdown and verified resource cleanup. Unknown cleanup state fails. Linux image execution is pending at this checkpoint; local Windows 7/7 Redis tests are not image proof.
- LLM router propagates deadline/caller abort through installed OpenAI, Anthropic and Gemini SDKs. OpenAI/Anthropic hidden retries are disabled. Timeout configuration is restricted to integer 1..120000ms. Independent 11/11 offline tests pass with actual SDKs and fake fetch; strict focused typecheck passed. Two router integration tests and mandatory named/no-skip CI guard are included.

Limits: cancellation does not establish that remote billing stopped; application retries and heuristic accounting remain. The held-case ledger is not wired to paid provider authorization. No paid models, live commerce, production changes, new hosted deployment, or authority changes were performed. All new Docker resources belong only to CI, and no provider credentials are supplied.

Validation preparation failures were retained in the task history: an initial PowerShell YAML quoting check and absent yaml package failed before the corrected installed js-yaml check passed. No actual image result has been replaced with these local checks.
