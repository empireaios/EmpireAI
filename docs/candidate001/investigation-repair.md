# Candidate 001: reasoning-to-intelligence repair

The deployed reasoning channel instructed the model that no network tools exist.
Four Eyes commissioning parsed a visible XML tag only after final answer
validation; it never returned job evidence within the same assessment. The latest
four evidence entries could also be dominated by internal heartbeat records.

Reuse the Work 4 store, acquisition adapters, quotas, cache and scheduler. Add an
owner-authenticated, one-use grant matching the complete instruction. Only that
request receives an investigation callback. Ordinary reasoning gains no tools.
The model chooses bounded jobs; the server validates the entire plan before
commissioning, records intent before network access, returns durable receipts,
and permits at most two rounds and three accounted model calls. Consumed grants
and rounds cannot replay after a restart. No subscriptions or commerce tools.
Automatic collector followups are disabled for Pillow-requested jobs so they
cannot expand the explicit budget. Opportunity-linked evidence is provided first.

Bounds: four jobs and 12 HTTP requests per round, two rounds, eight jobs and 24
requests overall, existing provider daily quotas and per-call inference token,
reservation and settlement guards. No new retry or provider fanout. The three
model calls are justified as planning, receipt review, and final assessment.

The authenticated owner may record acceptance only after a durable completed
response, evidence from all four Eyes and unchanged predecessor records are
verified. The Mission Ledger exposes the new investigation separately from the
unchanged Work 2, 3, 4 and pricing-repair records. Workflow completion does not
certify commercial viability. Independent Advisor readback precedes closure.

Production acceptance pending. No prior request may be replayed.

## Production acceptance defect and correction

The first bounded acceptance pcr_5fcf9b139bb54343 failed before commissioning.
The preserved backend diagnostic reported Zod `too_big`, maximum 120, at
`jobs[2].subject.query`. The provider call succeeded; no intelligence jobs ran.
This is a missing machine-readable parameter contract, not a pricing failure.
The prior failed request and completed successor remain historical records.

The corrected integration sends a fixed strict Responses JSON schema through
Pillow -> Brain adapter -> accounted OpenAI transport. It constrains query length,
subject shape and capabilities. Four jobs with at most three HTTP requests each
keep each round within twelve, including authentication. Optional fields use null
on the wire and are omitted before the existing strict collector validation.
A separate final assessment phase cannot commission further jobs. Schema input
bytes are included in the existing conservative spending reservation.

Model-authored output is persisted before validation; hidden reasoning is never
requested or stored. Failure is a terminal investigation status and never resets
the grant. A separately authenticated successor grant may reconcile a prior
RUNNING record only when its durable request is FAILED_FATAL, preserving that
request and linking the failed mission to the later accepted successor.

Contract reference (reviewed 2026-10-08):
https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses
Strict output supports required object fields, nullable optional values and string
length constraints. Server validation and authority checks remain mandatory.
