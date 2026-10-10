# Work 7 — owner-established short mobile chat defect

Continuation of PR109, predecessor e97840c692f7b2918a6c427b9b69e3655dda77cd. The owner screenshot establishes the 400 × 464 failure; no repeat recording is required. Previous long-phone fixture success did not cover it. The expanded test reproduced a 53px history pane before correction.

## Correction

Visible heights up to600px use a compact chat shell: duplicate bottom navigation and breadcrumb yield space; owner menu and Back retain navigation. Development navigation shares the top bar. Status/evidence remains an accessible disclosure, including NOT_BORN and Commerce locked. At heights up to360px, secondary chrome yields further space. History selection and Jump to latest share a toolbar above messages. The composer is capped at60px in compact mode. Theme, backend, transcript storage, authority handlers and original controls are preserved.

## Focused production-build verification

| Viewport | Message pane with Jump available | Complete visible text lines |
|---|---:|---:|
|400 ×464|228px|6|
|360 ×560|318px|9|
|360 ×740|329px|9|
|390 ×844|433px|12|
|1440 ×900|Desktop regression passes|Existing desktop assertions retained|

At300px visible height, simulated visual-viewport keyboard cases retain124–130px and3–4 complete lines. Resizing the layout viewport to300px with a multiline unsent draft retains108px and3 complete lines. All measured text is16px. These are emulated keyboard behaviours, not a physical-device keyboard certification.

Production build/typecheck and targeted lint pass. The regression verifies no mobile autofocus, saved exchange selection, internally scrollable history, no horizontal/page overflow, Jump outside messages, readable table cells, inert saved HTML, compact owner menu and status disclosure, composer containment, and no chat inference requests. Screenshots were visually inspected. Fixtures are loopback-only and clearly labelled LOOPBACK_FIXTURE.

## Preservation and release sequencing

Only chat-scoped presentation, its regression, and traceability documents change. All168 source routes, approved Home/artwork, financial records/calculations, backend, authority and safety controls remain unchanged. Existing accepted recordings retain their established scope; they do not establish this correction's hosted acceptance.

Remaining pre-release gates: exact candidate CI and preview, authenticated mobile acceptance,14 remaining commerce/automation contexts, remaining nested controls with a genuine live denominator, and displayed finance/operations reconciliation. The prior credential_observation_restricted gate remains unresolved; no credential recovery workaround is attempted. Review/owner authority and a fresh release lease precede merge/deployment. Fence17 is finished and cannot be reused. Production verification, preservation readback and independent Mission Ledger closure follow release, not precede it. No production release or Work7 completion is claimed.
