# Independent backend draft review (not exact-commit certification)

Reviewed the Work8 backend diff, new finance/source/portfolio projections, operating and joint examination runners/tests, and isolated execution/soak scripts. This review does not certify Work8 closure, production readiness or any later source revision.

Owner portfolio route retains existing authenticated founder role, expected workspace and configured founder-email gates. Source evidence is loaded server-side with the authenticated workspace. Retirement requires the exact original approving owner and no unresolved orders. Portfolio admission shares BEGIN IMMEDIATE with publication receipt insertion; independent two-connection race passed. No added live-effect authority identified.

Assurance recurrence uses unpaginated records, so unrelated commerce missions LIMIT 200 cannot reset its budget. Source timestamp protection is intentionally conditional on the existing observedAt field; legacy collectors without that field remain dependent on their own source freshness checks. No blanket stale-closure prevention claim is warranted.

Isolation launcher denies socket/connect/sendto/sendmsg/sendmmsg/io_uring_setup before exec, strips provider/proxy environment and closes inherited descriptors 3–65535. Seccomp inheritance covers child workers. This is network isolation, not filesystem confinement; examination scripts must continue using only their owned scratch stores. A caller-controlled environment marker is not independent proof of the filter.

Two draft findings were sent for remediation outside reviewer ownership:

1. Finance projection validates a caller digest's syntax and equality but cannot authenticate the snapshot itself. Arbitrary SALE and cost categories can conserve/balance without tying amounts to canonical commerce inputs. Require a verified receipt boundary and explicit monetary lineage for source-to-ledger examination acceptance. The existing projection is simulation-only and not mounted in a production route.
2. Unselected detail observedVariants can infer USD despite explicit contradictory parent row.currency; selected-variant path rejects the same conflict. Reject/quarantine contradictory currency before projecting any variant or record a precise per-variant exclusion.

Final review requires the exact committed source and targeted remediation evidence. Component tests, local healing catalogues and a 120-second component soak do not establish whole-programme or production completion.

## Remediation re-review

Both draft findings are corrected in the reviewed working tree:

- Finance now obtains the last source receipt by invoking the canonical store's `history(workspace,missionId)` itself; callers cannot supply an arbitrary snapshot/hash pair. History verifies every receipt's workspace, mission, monotonically contiguous version, previous digest and full body/state digest. Canonical SALE, COGS, FREIGHT and REFUND totals are checked; duplicate cost/refund categories are rejected. Other amounts require explicit simulation-assumption references and are labelled as assumptions rather than source facts. This is trusted local-store integrity, not a cryptographic signature against a malicious database administrator rewriting an entire chain or a re-execution of every historical business transition.
- The source projection rejects explicit contradictory parent or variant currencies before projecting unselected detail variants. No USD inference survives the previously reported SGD-parent case.

Re-review validation on Node 22.23.2 through `scripts/work8/isolated-exec.py`: 14 targeted finance/source tests passed. Three additional independent boundary tests passed in `work8-assurance-finance-boundary.test.ts`: corrupt each of five genuine engine-produced historical receipts; recompute an earlier receipt digest while leaving the later link intact; reject foreign workspace/mission selection and recomputed foreign-workspace body. Corruption is deliberately injected into isolated in-memory databases only after their genuine engine setup, never production records. Receipt-state corruption is detected for both earlier and latest history entries.

Remaining limitations above still apply. This is remediation acceptance for the draft component changes, not exact-commit certification, production release authority or Work8 completion.

## Root candidate runtime integration review

Assurance registers the checkpoint helper lazily; create/readback does not eagerly initialise commerce through the new registration. Existing authenticated owner route guards are unchanged. The existing five-second commerce loop now advances the bounded retained-evidence scan, using only the existing intelligence store; no provider read, paid model invocation or commerce effect is added. The scan reads the current Singapore calendar day and labels retained observation and shortfall explicitly.

An integration defect was identified and corrected by root: the generic checkpoint-integrity UNAVAILABLE incident previously lacked a same-ID HEALTHY observation after integrity was restored. Root added fresh successful integrity observation after the verified helper scan.

`work8-assurance-runtime-cycle.test.ts` then passed on Node22.23.2 under kernel network isolation. It invokes the actual AssuranceRuntime cycle and registered lazy runbook against isolated stores, injects a real receipt-before-cursor gap, proves one VERIFIED repair with unchanged receipt history, records retained-source shortfall100 with externalRefresh false, injects a false COMPLETE checkpoint, observes its integrity incident, restores only the original retained checkpoint as an explicit isolated repair fixture, and proves fresh integrity readback closes the incident. The inference port throws if invoked; observed calls remain0. A separate existing runtime-cycle regression also passed. No production runtime, deployment, supplier endpoint or real source records were mutated.

Exact committed-source review remains outstanding until root supplies the backend revision. These results do not approve Work8 completion or production release.
