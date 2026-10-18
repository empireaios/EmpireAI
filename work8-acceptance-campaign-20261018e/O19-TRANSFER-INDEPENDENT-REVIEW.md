# O19 durable transfer — final independent source review

Reviewer: `frontend_route`, independent of author `business_finance`.

Decision: **APPROVED SOURCE AND TARGETED EXECUTION REVIEW.** The prior test-only copy gap is resolved in this candidate. This receipt supersedes the final-copy limitation in `O19-SOURCE-INDEPENDENT-REVIEW.md` for these exact new bytes. No tests were repeated by this reviewer.

## Exact reviewed files

| File | SHA-256 |
|---|---|
| backend/src/runtime/commerce-runtime/governed/work8-twin-media.ts | `558388eb0f28a5d75ee01f49cddaebe3e0e9dd664ea05f07ac94957bf73467b1` |
| backend/src/validation/tests/work8-media-listing-binding.test.ts | `2c330a3d40b5362337b16e45f40e92f34c72980d26dc948cb8569c8e9789c476` |
| empireai-web/e2e/work8-media-listing-http.mts | `ef93c82d2fbf3f900de94555e79fe1bd7106c4ab10b3e1fd4de027c0ea7ce903` |

## Findings

TRANSFER_LISTING accepts only source reference, expected media version, approved batch and target mission ID. Candidate and listing content come exclusively from the verified durable source, not caller payload. The latest event must be APPLY_LISTING; therefore any intervening edit, proposal, rejection, approval or transfer invalidates eligibility. The command verifies source receipt, candidate/listing digests, selected internal-approval asset set, exact image metadata and product identity. Only SYNTHETIC candidate evidence is transferable.

The authenticated owner/session determines the target workspace. An existing target is refused. Actual research and listing engine commands and the immutable transfer event execute in the same outer transaction. No review, owner approval or publication intent is copied. The transfer event binds source receipt/internal approval to the exact target receipt, candidate and listing digests and retains initiating owner identity. Canonical service actor identities remain fixed by the existing runtime.

The updated HTTP examination now calls this production transfer action. It reads the resulting target by bound receipt and performs actual existing policy-role review, owner-role approval and canonical publication_intent. It refuses premature publication/approval and repeated publication, preserves distinct policy/owner/executor roles, and records INTERCEPTED with zero external effects. No test-only research/listing payload copy remains.

## Execution evidence reviewed

`lane-e-20261018d/O19-TRANSFER-AND-REGRESSION.tap`: 3 PASS, 0 FAIL, including relevant A11 regression, file-backed integration and the kernel-isolated authenticated HTTP child examination. Targeted integration verifies foreign owner, stale batch, target collision, replay, and a final transfer-event INSERT failure that rolls back both target receipts. File close/reopen preserves source/target bindings. HTTP verifies actual 401/403, forged/stale references, the approved image transfer, fresh media approval stages, canonical approval separation, intercepted publication and live execute423.

The image bytes' SHA-256 matches the retained A9 native SVG. Existing A9 native evidence supplies image import/byte/gallery/mobile/desktop coverage; no new UI is invented as a prerequisite for the simulated listing contract. A11's accepted boundary is preserved with relevant regression coverage.

## Original O19 contract mapping and remaining gate

Original O19 is simulated listing schema/media with permitted exact-asset examination and authenticated approval separation. The candidate plus retained A9/A11 evidence now supplies a concrete production consumer chain: approved image → durable listing binding → authenticated owner-workspace transfer → renewed canonical policy/owner approval → intercepted publication receipt. Supplier commercial qualification and Canva design export remain separate O7/O13/A10 boundaries; they are not manufactured here.

No remaining source or test-copy integration finding was identified. The new source is not yet published or hosted at this review. Full-tree integration/compilation and applicable exact-tree publication remain central-controller gates. Hosted execution of the added `work8-media-listing-binding.test.ts` can use the existing work8 test glob without new workflow dispatch or workflow edits; final independent acceptance must bind that terminal evidence to the published complete tree. No complete O19 PASS is recorded by this prepublication review.

## Receipt retention followup

Approved diagnostic-only followup, final test SHA-256 `06fdd040fc0910b3e74a2105dc5dae115e989065d5d66ad9d48a36fa5d3648e7`, superseding the test hash in the table. After parsing and checking the child receipt, the test emits only allowlisted status/checks/binding/transferBinding/publication/externalEffects/paidInference/limits. This retains actual source-approval/target/publication receipt bytes in hosted TAP logs instead of discarding captured stdout. No session tokens, raw stderr, application credentials or arbitrary child fields are emitted. No behavior/assertion change or test rerun was needed for this retention-only delta; prior three passing tests remain attributed to their tested preceding bytes.

## Frontend compiler boundary followup

Approved final HTTP file SHA-256 `da708b037f8f708c4d6d37d785952acd3af3bf9c8b5e7299a84236d8b4cc90b5`, superseding its table hash. The fixture now resolves the backend directory relative to import.meta.url and loads the same backend modules through the established pathToFileURL dynamic loader. Backend TypeScript source remains compiled under its own compiler configuration rather than being traversed by the frontend's Node type graph. The runtime TSX execution loads the actual .ts modules; no production code, assertions or permissions changed, and no suppression was added. Unused digest import removed. Author bounded execution `lane-e-20261018d/O19-DYNAMIC-LOAD-RESULT.log` passes the same HTTP examination after import resolution; reviewer did not repeat it. Final integrated frontend typecheck remains the controller's gate.
