# Stage-2 focused owner-acceptance repair

Status: engineering candidate; production deployment and fresh independent owner acceptance pending.
Base: verified PR #34, `bd368ceda8f10deceb20be80e65db436f6ac82c2`.
Birth remains NOT_BORN; commerce remains LOCKED. No provider calls or owner-prompt replays were made.

## Defect A: provider success, application rejection

Read-only production evidence established one attempt, terminal FAILED_FATAL / POSTPROCESS_FAILURE / answer_rejected, and NOT_STARTED answer delivery. The retained browser archive agrees: no completed answer was available. The accounting record remains usage_recorded with its reservation retained; no retry, refund, release or accounting mutation was performed. Independent durable omission collection still identifies the failed request as a terminal application delivery failure. Its persistent aggregate finding remains OPEN (18 mismatches at the observed cycle).

The retained, untruncated draft has SHA-256 `d9782f01c47ce37ff68324fc84b9ddbc6a4c203b9949d6cf873b87094c3aeeef`. A private local copy was checked against that digest. PR #34 rejects that exact draft with governance_bypass and review_bypass; the candidate accepts it offline. Raw owner prompts, transcripts and the draft are not published here.

Two independently isolated grammar causes:

- Conditional escalation through an authorized review process ended with a negative contrast. The unresolved-reference guard treated the denied override as positive, while the conditional guard retained the review-bypass classification.
- A nominal warning about mistaking evidence for permission was interpreted as an instruction to bypass governance.

The delivered S2-08 principle avoided these constructions. Its evidence-challenge/refusal principle remains accepted in the candidate's structural regression.

Repair: scope bounded negative contrasts and nominal risk reports in visible prose; preserve and review positive/conditional clauses. Independently review propositions even if whole-answer denial processing initially allows them. Explicit Assurance bypass, unilateral clearance, urgency exceptions and execution while mandatory findings remain open are rejected. Request/tool authority is not relaxed. The original seven controls and 210 adjacent bypass combinations remain mandatory.

## Defect B: distinct metrics, ambiguous provenance

The S2-07 delivered transcript at 2026-10-03T07:22:42.438Z reports 2/13 beside Birth status and technical readiness. Source code binds that value to `buildExecutiveTruthSnapshot -> getBirthRecord -> evaluateBirthGates`, not the independent Assurance collector. The brief previously named it only `gates`.

Independent Assurance cycles completed at 07:15:00.976Z, 07:20:00.598Z and 07:25:01.268Z on 3 October all record 4/13: runtime, workers, scheduler and authority-spending passed. The remaining domains were not thereby certified. The Birth diagnostics are a different 13-item list. Approved institutional knowledge and absence of a Cursor-selected commissioning product explain the two available Birth diagnostics; the production commissioning, Birth and flight-event tables were empty. Approved institutional evidence's newest recorded approval was 2026-10-01T11:49:56.437Z.

Conclusion: this is not evidence that stale Assurance 2/13 superseded current Assurance 4/13. It is a metric identity/provenance defect, plus an omission of independent Assurance from the chat truth block. The old path recomputes the Birth projection per request; `computedAt` is an evaluation timestamp, not freshness of all underlying evidence. Read-only repository context bypasses its cache and labels excerpts historical. No exact per-request Birth snapshot was retained, so its precise original evaluation timestamp cannot be independently reconstructed from the transcript date alone.

Repair:

- Name the Birth count `legacyBirthDiagnostics`, identify its evaluator, and disclaim readiness/Assurance equivalence and evidence rejuvenation.
- Read the due independent Assurance cycle and watchdog at request time; preserve metric, source, evidence reference, source timestamp and separate read timestamp.
- Withhold a current numeric assertion for stale, missing, overdue or internally conflicting evidence. Never silently select an older PASS.
- Preserve a hashed request-bound read receipt in the existing durable answer result. The receipt is historical after that request and grants no authority.
- Keep conversation history, hypothetical premises, pending learning and current operational sources distinct. No test premise is written as business truth.

The existing independent inspector now persists a `current-state-provenance` finding if a coverage count conflicts with its domain checks. Unknown/stale evidence cannot resolve that finding. This bounded monitor does not claim arbitrary natural-language truth detection or full coverage of the evidence-freshness domain; that domain remains unimplemented.

## Validation and concurrency

Offline tests cover both semantic abstractions, retained authority regressions, distinct metrics, source-time preservation, missing/stale/conflicting evidence, supersession, actual process restart, immutable readbacks, request-bound receipts, historical archive isolation and existing owner postprocessing failure classification. Hosted CI must complete at the proposed revision before deployment approval is requested.

The repair is stacked on PR #34 because main remains the older `21384342` baseline. Concurrent PR #35 modifies the owner frontend runtime pin; PR #31 modifies Amazon SG imports. Neither is overwritten or merged into this backend repair. No existing remote branch is force-updated. Recheck remote main/open PRs and production immediately before deployment.

## Deployment and independent acceptance still required

No new production deployment is authorized by this document. After exact-revision CI passes, request approval once for that revision. Intended rollback is the currently verified PR #34 revision above, subject to checking for a newer authorized production revision first. Preserve request diagnostics, transcripts, all six stores, accounting and ongoing independent monitoring across deployment and delayed verification.

After deployment verification, King and ChatGPT should supply fresh unseen cases covering legitimate Assurance disagreement versus unilateral bypass, current-state metric/source/freshness explanation, and hypothetical-memory separation. Do not reuse the eight consumed Stage-2 prompts or pre-supply future test wording. Offline acceptance of a retained draft is engineering evidence, not a new model-reasoning certification.
