# Independent focused integration review

Scope: new mission preparation expiry cap, exact-dossier owner decision guard in governed runtime resolver, and SimulationAuthorization.tsx. Review only; no production changes, paid calls, broad audits or old campaigns. Reviewed source under backend and frontend worktrees in /workspace/scratch/38c5c2f33ebb.

## Critical finding — resolved after independent review

`assertDossierDecisionAllowsSimulation` in `backend/src/intelligence/work8-dossier-decisions.ts` uses `readDossierDecisions`, which filters candidate then takes `.slice(-20)` before the guard filters `current` dossier digest. Consequently an exact-dossier DEFER/REJECT can be omitted when 20 later decisions concern other dossier digests. The authority guard then returns null and allows preparation/approval/enrollment without any subsequent REQUEST_REVIEW for the refused exact dossier. Display truncation must not truncate authority history.

Verified correction in current source: the authority guard now reads the bounded, digest-verified full `records(store, workspace)`, filters exact candidate plus dossier digest, then selects the latest record. Display pagination remains separate. Independently inspected the regression in `work8-mission-preparation.test.ts`: a prepared mission remains unapproved after owner rejection and 20 REQUEST_REVIEW decisions for other dossiers; approval succeeds only after the exact dossier receives REQUEST_REVIEW. Parent reports six preparation tests and focused TypeScript checks passing; I did not rerun those tests. The identified authority omission is resolved. No unresolved critical issue remains in this scoped review.

Noncritical display limitation: the UI history still displays the latest 20 candidate decisions, so an older effective current-dossier refusal may be absent from the client hint. The server now correctly refuses regardless; this is a presentation gap, not an authority bypass.

## Other reviewed behavior

No further critical authority/replay defect identified in the reviewed delta:

- Preparation receipt expiry is the minimum of source expiry and preparation time plus 24 hours. Idempotent preparation returns the immutable prior receipt, so replay does not renew expiry. Binding refuses expired preparation; approval uses that stored expiry.
- Governed runtime resolver checks owner refusal before preparation, approval and new enrollment. Completed assessment still binds owner and exact dossier. An existing enrollment idempotent return does not create a second task or new authority.
- Frontend uses server-returned version and pinned dossier, preparation and assessment identifiers. It separates product approval from checkbox-authorized simulation, serializes requests and retains per-action IDs for ambiguous-response retries.
- SimulationAuthorization is keyed by dossier digest in QualificationDossier, preventing state reuse across dossier revisions. Client state remains advisory; backend checks remain the authority.

This is scoped source review, not independent certification of the full Work8 programme, authentic supplier eligibility, browser acceptance, concurrency across separate SQLite databases, or production execution.
