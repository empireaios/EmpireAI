# Work 7 — scheduled evidence cache expiry correction

Frontend owner correction remains PR109 at c00c914c5647698ebb722ac72fe43d3fa14cfa7b; its four passing workflows and preview are retained. This backend-only correction starts from deployed51830f9f76d3a5b81250c0f5d2b4ce84b44b39c7 on work2/backend-release, a different deployment lineage. It is a dependent repair, not a replacement owner-console PR.

## Proven cause and severity

HIGH incident inc_89625c7d-e26e-42bd-82d4-b3af63c8c5d0 remains UNRESOLVED with no permitted recovery runbook. Its first observation was2026-10-10T12:41:08.978Z, after PR109 creation07:21Z. The defective collector/cache code predates PR109 (runtime last changed2026-10-08 in e0a04ca1); production backend has not been changed by PR109.

Scheduled Amazon and CJ catalog jobs29860599 at12:39:06UTC each completed with one cache hit and zero provider requests, reusing evidence observed06:39:07UTC. The cache was still valid by less than two seconds. The scheduler had already deferred the next collection for six hours. The evidence then expired and the operating-scope guard correctly refused to close the overdue incident. This is a genuine collection freshness defect, not false evidence and not a chat-layout regression.

Release impact: does not change owner authority or permit commerce, but current scheduled-monitoring acceptance cannot truthfully pass while the evidence is overdue. Preserve HIGH status and original evidence until a governed deployment and genuine new scheduled observation establish recovery. Do not extend TTL, rewrite timestamps, close the incident manually, or force an unscheduled provider request.

## Bounded correction

Scheduled jobs reuse a cache entry only if it was observed at or after that job was queued. Otherwise they pass through the existing read acquirer. On-demand cache reuse is unchanged. Credentials, allowed destinations, request limits, quota reservation, backoff, immutable records, NOT_BORN and commerce LOCKED are unchanged. No new schedule, paid inference or commerce workflow is added. Existing scheduled requests may now use their already-budgeted collection allowance instead of accidentally skipping a cycle.

## Verification

Two new regressions fail against deployed source: near-expiry scheduled cache incorrectly suppresses collection; old cached evidence incorrectly makes the scheduled collection complete during backoff. Corrected source passes all18 Work4 intelligence tests, including three new cases: current-period refresh, backoff preservation, and reuse of evidence genuinely acquired after queueing. The existing on-demand no-network cache test passes. All transports are intercepted. No live provider calls or production mutations were used for testing. Backend typecheck passes after building the existing Pillow dependency. Local runtime is Node24.19.0; hosted CI must verify the required Node22 toolchain at the exact candidate before release.

## Release gate

Coordinate with PR109's unresolved authenticated mobile/navigation/financial acceptance. No deployment is authorised by test success alone. A fresh governed lease/fence, reviewed merge, exact deployment verification and post-deployment financial/safety preservation remain required. Finished fence17 cannot be reused. Live incident recovery and Work7 closure remain pending.
