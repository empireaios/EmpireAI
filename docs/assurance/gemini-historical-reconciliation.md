# Gemini historical reconciliation — conditional production disposition

Owner mandate: targeted continuation of Advanced Autonomous Assurance and Work 7,
2026-10-09. This change does not introduce a new Work or certify external access.

The existing lifecycle has verified recovery and recurring-scope correction. The
scope correction correctly refuses a historical functional failure without later
bound success. There is no separate representation of an investigated, contained
historical failure with retained uncertain financial exposure.

This correction adds that separate administrative disposition. It does not modify
`operating-scope.mjs` or `closure-health.mjs`. A genuine unresolved HIGH/CRITICAL
condition remains a completion blocker.

## Exact case and current evidence

- Production baseline: backend f85effe413f8ac5d271034ade425ffd77d90d7b9;
  frontend 0773adf7452e8ac0b209d93748a7012960baa8ee.
- Gemini call: 2094d132-5fd8-4a03-8a2c-b05deff105aa,
  2026-10-02T11:17:14.780Z.
- Retained Pillow transcript session: 10ac0f65-ed3b-4664-8f94-f1ea064755c3.
- Original request: 7de0aba7-e62a-443a-b567-d1e735679d9f,
  2026-10-02T11:17:14.706Z; asks for a <=70-word summary of a supplied locked
  commissioning scenario. Its retained response is a failure notice. King's
  Advisor reports the original request-state record NOT_RETAINED, so the
  transcript alone does not establish a verified terminal provider result.
- Packaged historical certification retains 288479 microUSD uncertain reservation.
- The old uploaded ledger predates this call. Railway returned no route logs for
  its timestamp. Neither establishes absence of provider processing.
- Owner's read-only Google investigation reports Free tier, no configured billing,
  no request-level history and empty charts. These are not zero-usage or settlement
  evidence and are deliberately not used to authorize disposition or release.

## Fail-closed production conditions

Before any administrative closure, the runtime must independently read the
original integrity-checked ledger, the exact request's retained routing receipt,
and its durable deduplication record. All must agree on the exact identity,
timestamp, model, sole attempt, HTTP 503 refusal, failed_uncertain state, null
usage/response/estimate/invoice and the full original reservation. The reader is
read-only and hashes the retained ledger row and original route bytes. Missing or
inconsistent evidence produces INSUFFICIENT_EVIDENCE and keeps closure blocked.

The strongest classification remains C: uncertain provider execution or financial
settlement, even when a retained HTTP refusal is verified. A local terminal
application failure does not prove that Google performed no processing.

Eligibility also requires all seven current independent monitoring domains PASS,
no discrepancy, complete omission inventory with zero pending requests, fresh
monitoring, the locked profile, no release lease or pause, no running/unknown
recovery for the incident, and complete compatible immutable incident history.
Only the exact latest historical Gemini call is eligible. Other provider failures,
new calls, unknown history and missing/corrupt proof remain blocking.

Each closure preserves original HIGH severity, ID, fingerprint, first/last
timestamps, revision, recurrence, attempts and every original event. It adds a
separate append-only administrative event with evidence hashes and history
sequence/count/hash. It never records FUNCTION_VERIFIED or RECOVERED and leaves
the probe DEGRADED, Gemini health UNVERIFIED, invoice unknown and reservation held.
Future genuine failures create new incidents. No ledger or routing file is written.

Source review also verified that pre-PR100 probes checked age before completion.
Their stale labels require binding to the exact Gemini call, and other providers
require matching independently verified current receipts or later bound evidence.
The older labels are preserved and never reinterpreted as successful Gemini calls.

## Verification and release

Targeted negative tests cover missing/corrupt/mismatched proof; retained money;
all seven monitoring domains and omissions; immutable history; unknown recovery;
lease/pause; existing scope protection; and new genuine failure detection. Existing
independent discrepancy and omission suites are included. Hosted mandatory CI and
normal review/merge/fenced release are required before production acceptance.

Production disposition and mission completion must be read from actual server
receipts after release. This design document is not evidence that any incident
has closed or either mission is COMPLETE.

## Production correlation discovery, 2026-10-09 17:08 UTC

PR102 deployed as fd07adbac72604170c26d5601e93f0ecb2234ab2, Railway
06e54504-5e23-4740-ae5a-2b03e6116616, under fence16. The reader refused
administrative closure: the actual original ledger request_key is
5553bffbbf280e6f92c67bf0135ca4e8dde341b46e0663bbc99174c441bbc3eb,
not the hash of transcript request ID 7de0aba7-e62a-443a-b567-d1e735679d9f.
The row independently confirms failed_uncertain, 288479 microUSD held and null
usage, response ID, estimate and invoice. Row SHA-256:
1a6d22221756a8a428b115d55ffea2807c9fd479afc425a09ea5fb0d2157e5b6.

Historical source cfc4365f explains the distinction: routePrompt generated a
new transcript request ID but passed input.correlationId into the provider
adapter and ReasoningState.capture. The retained pending_learning row therefore
provides the exact conversation-to-transport link. The follow-up reader must
match its hashed correlation to the ledger key and dedupe/route receipt; match
the exact original user and failure text against the original transcript; and
retain hashes of both records. Temporal proximity alone cannot authorize closure.
Missing, corrupt, ambiguous or mismatched binding keeps the incident blocking.
All prior financial, history, current-monitoring and completion conditions remain.
