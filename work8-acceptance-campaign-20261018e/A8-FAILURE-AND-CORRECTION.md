# A8 independent hosted decision and fixture clock correction

Decision: **A8 PENDING; current native examination FAILED.** Prior A9 and A11 acceptance remains preserved. No full-contract acceptance inferred from local correction.

Product run `39116744648`, A8 artifact `12132294173`, ZIP SHA-256 `cd9d726b254467b949f807d562c82551bcf6bbdc2a9ebe3f28e8ba74e6e7bd6d`. Hosted source-identities record merge checkout `ef5090dbb0092e92fd0bfaced377b036b36caff5`, exact approved tree `6c7d6f4a899d00a0442a4ae5142cac61a4ccafb9`; published source is `538d5f68ad7c2ab10aa055815a1a086b2c2b444b` with the same tree.

Native result is STARTUP_TIMEOUT during the mobile flow. Backend and Next actually started. Responses show three browser session201 responses after the fixture's initial canonical creation, then repeated session503. The page shows Starting Executive Systems and unverified cached turns. No desktop completion or authoritative native reload acceptance is established.

## Proven cause

The fixture globally froze Date.now at October 10. Production session admission correctly allows only four creations per rolling 10-second window; frozen time prevents any timestamp from aging out. The fixture seed plus three browser session restores exhausts that limit permanently.

Bounded actual HTTP reproduction against unchanged fixture recorded the exact 503 admission reason `Pillow session create rate limit (4/10000ms)` and the same refusal after 11 real seconds. Evidence: `a8-frozen-clock-reproduction.json`. This confirms the cause without weakening production fences or repeating a hosted campaign.

## Minimal correction

Single fixture file `empireai-web/e2e/work8-source-context-backend.mts` now uses the same historical replay epoch plus elapsed monotonic `process.hrtime.bigint()` milliseconds. Historical evidence classification explicitly says elapsed historical replay, not current source freshness. No production source, rate limit, readiness deadline, browser assertion or admission control changed.

Patch: `a8-elapsed-clock.patch`; isolated worktree `a8-clock-elapsed` based on `9659160b2f187a0dc2c422c5bd1d1046d6f56c66`. Independent source review by the central controller remains required.

Corrected actual HTTP preflight preserved the initial rate-limit refusal, then restored session201 after 11 real seconds. It exercised both retained product contexts, two intercepted chats, authenticated history, browser archive acknowledgement, exact canonical history after reload, and foreign-history403. Actual Tier0 forged-pin409 and exact input hash receipt are joined. Evidence: `a8-elapsed-clock-preflight.json` and `a8-clock-preflight.py`. External calls are kernel-blocked and model transport intercepted; no paid inference. Disposable fixture processes and data were cleaned up.

The unchanged native hosted examination must still pass both widths and receive independent full-contract review after applicable exact-tree publication. Existing cold-process receipt remains reusable because reasoning-state/session-store boundaries are unchanged.

## Compiler compatibility followup

Independent review of the controller's final change approved: integer divisor `1000000n` becomes `BigInt(1000000)` to satisfy the existing frontend ES2017 TypeScript syntax target. Both produce the exact same bigint value and preserve monotonic elapsed milliseconds; no fence, deadline, clock behavior or assertion changes. Final file SHA-256: `de7ed537d47534a8cc69353b451a4b97d0140a772e77628d4257c20fc91fae55`. Prior HTTP execution remains attributed to the semantically equivalent bigint-literal bytes; no test was repeated for this syntax-only followup.
