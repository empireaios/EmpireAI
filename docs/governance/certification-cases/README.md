# Frozen independent economics cases V1

Status: **FROZEN, NOT EXECUTED AGAINST PILLOW; zero certification credit.** This is a new replacement case set, not historical V53 evidence. Source inspection baseline was integration 66ddc162.

Six cases cover three arithmetic and three landed-cost ranking variants: unfamiliar complete evidence, missing required cost with misleading suggestions, and corrected evidence after actual client disconnect/reload. Interrupted variants use distinct prices, fee rates and candidate identities rather than replaying another case. Native production tests use the old S$40/18/4/6% arithmetic fixture and Alpha/Beta or Juniper/Lotus/Maple ranking; this set uses different operands, multiple independent fee bases, fixed fees and different identities. A bounded search of existing backend tests/scripts and audit text found none of the first candidate names. This establishes new authored surfaces, not a guarantee the model has never seen similar economics.

## Files and exposure boundary

- economics-held-cases-v1.json: case inputs, step instructions, authority limits and disallowed claims.
- economics-oracle-v1.mjs: independent integer-micro-unit decimal oracle. No import of Pillow arithmetic/scoring code, no network, no model call.
- economics-expected-v1.json: computed expected arithmetic/ranking; this is an oracle, never a Pillow response.
- economics-freeze-v1.json: byte hashes and scope.
- .gitattributes: preserves exact frozen bytes.

Do not feed oracle, expected values, forbidden-claim lists or other cases to Pillow. For each case, send only the current step instruction and the inputs needed at that step. For correction cases the initial step receives only initial values, not future corrected values. Follow-up receives the correction only after real client interruption/reconnection. Preserve actual request/session identity, raw response, receipt status and timestamps; a prompt saying resumed is not recovery evidence. Do not reuse a contaminated case after exposing its oracle or tuning implementation against its failed answer.

No model call has been made and no case outcome has been graded. The deterministic oracle was run only to freeze arithmetic expected values.

## Exact coverage and limits

- HOLD-ARITH-01/02/03 support **CAP-TR-03** financial truth, **CAP-CO-02** pricing intelligence, and **COM-02** complete economics.
- HOLD-RANK-01/02/03 support **CAP-CO-01** product selection, **CAP-CO-02**, **CAP-JR-01** independent commercial judgment, and **COM-02**.
- These are only bounded arithmetic/eligibility subclaims. They cannot certify all criterion-level requirements, general supplier discovery, real fee freshness, marketplace policy, actual bill reconciliation, comprehensive pricing intelligence or the entire financial/judgment capability. No registry entry should claim full requirement acceptance from these six cases.
- They exercise related EC-01/02 arithmetic and decision eligibility classes, but do not satisfy the separate 24-case/two-campaign WAVE-CAMPAIGN requirement.

All costs and explicit zeros are synthetic problem inputs, not inferred real supplier costs. Unknown required fields produce null final contribution/margin, never zero. Two independent percentage fees are charged on selling price; fixed marketplace and payment fees are separate. Full decimal precision is retained until final half-up two-decimal display. Ranking uses unrounded contribution after every eligibility gate. Forecast contribution is never revenue, settlement or realised profit.

## Existing implementation anchors

- backend/src/orchestration/pillow-host/executive-commercial-arithmetic.ts: actual current deterministic arithmetic helper.
- backend/src/validation/tests/commercial-arithmetic-lock.test.ts: existing development fixtures and arithmetic route-unit tests.
- backend/src/validation/tests/comma-contribution-ranking.lock.test.ts: development ranking regression, not this held set.
- backend/src/orchestration/pillow-host/executive-decision-case-state.ts: candidate eligibility/decision state.
- backend/scripts/build-ec01-ec02-arith-production-validate.mjs: historical normal-interface execution example; do not run it as this evaluator (it loads credentials, contains development fixtures and assumes earlier response behavior).

The executable system entrypoint is the authenticated normal owner session/chat path: /api/pillow/session then /api/pillow/chat with unique idempotency identity and durable request-result polling through the existing transport. Run on a frozen candidate with appropriate model-provider access and approved spend. Directly invoking the arithmetic helper is development coverage, not normal Pillow acceptance.

**Remaining engineering:** repository-trusted held-case runner with blinded delivery, exact source/deployment binding, canonical durable response collection, actual interruption receipts and independently reviewed answer/criterion assessment. No general held-case scorer is claimed by the decimal oracle. The missing runner is engineering work, not an owner manual-relay task.
