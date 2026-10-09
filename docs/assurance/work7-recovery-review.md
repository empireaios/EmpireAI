# Work7 / Advanced Assurance targeted recovery

Owner authority: 2026-10-09 Complete Assurance Recovery, Incident Resolution and Work7 Verified Closure mandate. Original Work7 UI and acceptance remain unchanged. This is not Work8 certification.

## Reproduced defects

1. A complete empty Redis inventory with a readable, valid SQLite transcript source returned null and became NOT_CHECKED. The collector now persists bounded inventory/window/count/digest evidence, including pending requests; malformed, inaccessible, partial and stale sources still cannot pass.
2. The aggregate Four Eyes probe treats all 20 declared capabilities as recurring commissioned checks. The actual persisted scheduler commissions five, with account/safety on daily cadence. On-demand, unimplemented, uncommissioned Keepa and access-dependent Brand Analytics remain explicitly unverified. Daily cadence does not make six-hour source facts fresh.
3. Provider monitoring requires a fresh paid generation every six hours even during inactivity. The current internal monitoring mandate does not commission periodic paid generation. Complete valid historical response receipts can establish the absence of a latest recorded failed call, but cannot establish current external generation health. Receipt validation now precedes age classification so an old failed/uncertain call cannot hide behind staleness.

## Narrow lifecycle correction

Only the two exact aggregate probe IDs/classifications are eligible. Their original DEGRADED/NOT_CHECKED/EXTERNALLY_BLOCKED statuses are preserved. An audited CLOSED disposition identifies a misclassified recurring requirement, never RECOVERED or fresh external health.

Every transition requires the seven mandatory independently inspected domains to pass, a complete request inventory with zero pending requests, fresh scope evidence, no active release lease/pause, and no RUNNING/UNKNOWN recovery. Four Eyes also requires the complete known capability/schedule inventory, all five enabled recurring collectors within their actual cadence, no active/interrupted jobs, and the existing Keepa resource record explicitly marked nonblocking and not approved. Real current acquisition failures cannot pass. Other incident types are ineligible.

The complete immutable detection/observation history is checked per incident, bounded at 5,000 events. A historical functional failure requires a later bound successful response/read; unknown or truncated history cannot close. Original incident identity, fingerprint, severity, revision, first/latest timestamps, attempts and all events remain intact. The new event records the history count, sequence range and digest. No direct operational database rewrite, generic historical exemption, severity downgrade, closure-gate change or provider request is introduced.

## Validation and release

42 focused offline tests pass, including empty/matched/missing/duplicate/mismatched delivery, terminal failures, historical resolutions, malformed/partial/inaccessible sources, staleness, timeout, restart, recurrence, scope bounds, original-history preservation, actual failures, unknown recovery, pause and lease fencing. Backend typecheck passes. Hosted CI is required on the final head; earlier-head green CI is not substituted. Original five production acceptance chains are retained, not replayed. New scoped monitoring behavior requires fresh production evidence after release.

Use PR100 for the coherent backend repair and PR101 for its exact frontend runtime pin only. Fresh fenced release, exact reviewed revisions, original volume and financial/source preservation, eight HTTP423 locks, independent seven-domain readback, incident dispositions, then both actual mission closure receipts are mandatory. External capabilities, current provider generation and offsite backup/restore remain unverified where evidence is absent. No COMPLETE claim before independent receipt readback.
