# O19 media-to-listing source review

Reviewer: `frontend_route`, independent of author `business_finance`.

Decision: **APPROVED SCOPED SOURCE AND TARGETED TEST REVIEW; FULL O19 PENDING.** No reviewer test rerun. Full compiler result remains a separate integration gate.

Worktree: `o19-media-binding`, based on `9659160b2f187a0dc2c422c5bd1d1046d6f56c66` (tree `6c7d6f4a899d00a0442a4ae5142cac61a4ccafb9`).

Reviewed changed files and SHA-256:

- `backend/src/runtime/commerce-runtime/governed/work8-twin-media.ts`: `97e5fe5961359f3279431aa3beeabb5390d13ef57b922d9bfb1d5c5f8031b876`.
- `backend/src/validation/tests/work8-media-listing-binding.test.ts`: `48364d5658f4cc0d1afe6fc5c1f1d8243f1c6ad68265d6e83c6dfa7e96e73fda`.

The explicit APPLY_LISTING command requires the current owner/session/source reference, media version and approved batch. It binds the complete selected image set by URL, hash, rights reference and provenance, requires owner-reviewed rights metadata and exact product source identity, and rejects video in this image-only listing schema. It invokes the existing canonical listing engine, retains its provenance and identity checks, invalidates previous candidate review/approval and records the exact resulting receipt/candidate/listing/approval digests. No external publication authority is granted.

The existing store supports nested savepoints under an outer transaction. A concrete review gap was resolved by adding a trigger that fails the final media INSERT after the canonical listing command succeeds. The updated targeted test verifies both histories roll back and prior candidate approval survives; subsequent successful application binds the canonical receipt, invalidates old review/approval, rejects stale replay and preserves NOT_SUBMITTED. File-backed close/reopen verifies exact persisted binding and canonical receipt equality.

Reviewed author execution receipts:

- `lane-e-20261018d/O19-INTEGRATION-TEST.tap`: updated targeted test 1 PASS, 0 FAIL.
- `lane-e-20261018d/O19-A11-REGRESSION.tap`: changed-boundary A11 invalidation/durable-history regression 1 PASS, 0 FAIL.

No remaining source finding in this bounded review. Metadata rights assertions are not independent supplier licence proof. The test uses a synthetic asset hash and isolated actors; it does not fetch actual image bytes or establish native authenticated owner presentation.

Complete O19 still requires applicable authenticated same-asset workflow and separated approval proof, exact source/evidence identity and independent full-contract acceptance. The new command itself deliberately prepares a listing for renewed review; it neither executes publication_intent nor closes the broader publication-control journey. A9/A11 prior acceptance is preserved, with relevant changed-boundary regression evidence reviewed.

## Authenticated HTTP examination addendum

Reviewed additional examination file `empireai-web/e2e/work8-media-listing-http.mts`, SHA-256 `04aceef6b575c96c330793e23ba184e0160c9b6be0b6bdc31185cc6e29543e2a`, and author receipt `lane-e-20261018d/O19-HTTP-RESULT.log`. Decision: approved scoped examination source and result; no reviewer rerun.

The script requires the incoming-only kernel-isolation marker, uses disposable synthetic stores, blocks fetch, and exercises actual Fastify cookie authentication and registered governed commerce routes. It verifies anonymous 401/foreign workspace 403, stale/forged references refused, exact authored SVG metadata bound through APPLY_LISTING, stale replay refused, renewed media proposal requiring both approval stages, intercepted media submission and live execute 423.

This removes the previously missing authenticated HTTP route proof. It does not verify a native browser or actual image fetch, distinct human approvers, candidate policy approval, or marketplace publication_intent. Its scenario starts from research without existing candidate approval; authority invalidation is established by the separate file-backed integration test, not inferred from this HTTP scenario. Full O19 remains PENDING. Full compiler integration remains a separate gate.

## Final HTTP extension and exact scope

Final HTTP script SHA-256: `fc1da1d7035cbc7135d490baffe34a4e28320eb2cd1277962f63735963e6ceef`. Final integration test SHA-256: `dd3eec52df77a7d18cf5037d428f8c23f1e9a71bf4cd366bf5fb52dbdfb9e6ce` (explicit listingBinding presence assertion resolves compiler narrowing). These supersede the earlier corresponding file hashes above. Runtime file remains unchanged. Controller reports final integrated backend build PASS in `integrated-backend-build-final.log`.

The extension executes actual authenticated owner-workspace research/listing commands with an explicit copy of the twin's immutable candidate/listing. It checks exact candidate digest and full listing equality, rejects premature owner approval and publication, then obtains canonical policy-role review, owner-role approval and an INTERCEPTED publication_intent receipt. Repeated publication is refused, and reviewer/owner/executor actor IDs differ. This is role separation in the existing software simulation, not evidence of distinct human approvers.

Reviewed result includes candidate/listing/image and publication receipt digests. This supports simulated schema/media/approval/interception behavior for the same SVG bytes previously examined natively by A9. No new UI or positive business qualification is imposed as a blanket prerequisite.

However, the owner-workspace canonical listing command accepts copied listing fields; it does not consume or verify the twin media approval/binding receipt. The test itself chooses the approved package and asserts equality. Therefore the evidence does not prove that the actual canonical publication path rejects a same-shaped listing lacking the preceding media approval. The new APPLY_LISTING command establishes an approved-media consumer inside the twin; the explicit copied canonical path establishes a separately approved publication simulation. They must not be described as an automatically enforced cross-workspace approval chain. Complete O19 remains PENDING pending central original-contract determination of whether the separate joined simulations suffice or enforced same-asset consumer linkage is mandatory. No new whole-row acceptance is issued here.
