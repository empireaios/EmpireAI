# Narrow application-redeploy evidence harness

This offline harness verifies supporting evidence only. It never returns complete OPS acceptance, certification credit, Birth authorization or commerce authorization. Do not register it as a complete requirement verifier.

Run from a checkout of the exact tested application source (including its exact probe/launcher bytes):

`node scripts/certification-harnesses/canary-redeploy.mjs BUNDLE_JSON TEST_SERVICE_UUID`

Bundle shape:

```json
{
  "schema": "pillow-canary-redeploy-bundle-v1",
  "before": "replace with unmodified raw before-probe JSON object",
  "after": "replace with unmodified raw after-probe JSON object",
  "shutdown": {
    "serviceId": "actual isolated test service UUID",
    "deploymentId": "actual before deployment UUID",
    "records": []
  }
}
```

Use actual provider log records, with their original timestamp and parsed event/message fields, for the old application's shutdown. Do not generate success records. The harness requires exactly one primary_shutdown_complete and one bounded_canary_stopped (reason signal, childExitCode 0, null childSignal, forcedTermination false, null forcedSignal), ordered after before-probe completion and before the after probe. Any failed/deadline/forced shutdown rejects the pair. Retain the raw provider export and its acquisition metadata beside the bundle; assembly is not provider authenticity attestation.

The enhanced probe embeds observations and a safe before restartMarker. Earlier receipts without sanitized observations fail closed. Marker.nativeBefore and phase observations contain generated test IDs, allowlisted mission projections, native-history hashes, terminal result projections and exact original-result digests. Hashes do not expose original bodies; the harness verifies projected semantics, original-digest continuity, history retention and check completeness. It does not claim an independent database download, arbitrary omitted-field inspection or independently authenticated provider acquisition.

Only same-source orderly application replacement is supported. Distinct deployment and launch IDs do not prove the same binary image. Redis restart, abrupt kill, power loss, full volume restore, old-production quiescence, model quality, unattended soak and commerce remain unproven.

The accompanying test constructs synthetic unit fixtures solely to test validation and rejection. They are never hosted receipts and must never enter a certification evidence ledger.
