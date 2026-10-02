# Recovery2 hosted result — 2026-09-23

Checkpoint: 13:37 UTC. **FAILED RECOVERY PAIR; no Birth, production or commerce acceptance.**

Exact tested source: bed51228ada3110373ae671ca72f9d781af3b0e0. Before deployment 613e22c1-62db-4387-b5dc-d31571156084; replacement 02302b9f-5899-4990-89bd-34b2a69b835b. The unchanged absolute expiry was 2026-09-23T13:31:22.745Z.

- Before probe: 35/35 checks passed at 13:12:36 UTC.
- After probe: 37/38 checks passed at 13:19:34 UTC. Sole failing check: authority_result_preserved.
- Redis result digest subsequently changed again. A cjson reserialization repair is under review; this diagnosis is not a successful corrected hosted rerun.
- Strict offline harness on the actual pair rejected FAILED_OR_MALFORMED_CHECK. Acceptance and certification credit remain zero.
- Primary shutdown completion was observed. No bounded_canary_stopped launcher receipt was retrieved; do not manufacture it or claim complete orderly shutdown verification.

Passing checks are scoped observations from this private, disposable application redeploy. They do not prove Redis restart, abrupt kill, power-loss survival, coordinated volume restore, same image/binary, old-production quiescence, model quality, unattended soak or commerce lifecycle. Sanitized observations are projections, not complete raw response bodies.

## Evidence retained

RECOVERY2_BEFORE_2026-09-23.json; RECOVERY2_AFTER_FAILED_2026-09-23.json; RECOVERY2_FAILED_PAIR_2026-09-23.json; RECOVERY2_RESULT_DIAGNOSTIC_2026-09-23.json; RECOVERY2_REDEPLOY_SHUTDOWN_2026-09-23.json; RECOVERY2_LAUNCH_2026-09-23.json; RECOVERY2_RUNTIME_START_2026-09-23.json.

## Cleanup and cost

Owner approved deleting all recovery2 services and their volumes. Deletion completed; provider services and pending work read back empty. Final empty UI canvas verification was pending at the checkpoint. Latest displayed test cost US$0.0024 is provisional; no final usage reconciliation is claimed. Original production was excluded and remains unchanged.

## Next engineering boundary

Preserve failures while independently reviewing and testing the Redis serialization correction; publish the exact corrected source through required CI before retesting. Never relax probe check strength to erase this failure.

An old-source fixture also demonstrated a critical-save concurrent-write gap. Safe old-production quiescence and a final durable consistent snapshot remain unproved. No production restart or promotion is authorized by this canary result.

Replacement certification head 66ddc162 passed all ten CI jobs, including 26 certification tests. Six independently authored arithmetic/ranking cases remain frozen, not executed and uncredited. Missing original V53 no longer requires owner intervention under the explicit replacement mandate.
