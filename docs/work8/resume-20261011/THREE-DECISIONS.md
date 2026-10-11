# Three decisions for the existing Work8 checkpoint

No status promotion: original45 = 10 PASS / 30 PENDING / 5 BLOCKED; owner amendments19 = 0 PASS / 19 PENDING. All accepted evidence retained. No deployment, publication, infrastructure, paid inference or live commerce occurred in this continuation.

## A — Selected hosting configuration

Recommend Railway in a separate billing workspace, not the production workspace or its empty canary project. Use the existing backend, Redis and Console with one replica each:

| Proposed service | Ceiling | Persistent storage |
|---|---|---|
| work8-runtime | 1 vCPU / 1 GiB RAM | Dedicated 1 GiB at /data |
| work8-redis | 0.25 vCPU / 256 MiB RAM | Dedicated 1 GiB for Redis AOF |
| work8-console | 0.5 vCPU / 512 MiB RAM | None |

Use a private Redis endpoint, dedicated trial owner authentication/secrets, explicit trial Assurance origin and no production mounts or credentials. Deny all seven live-effect routes and retain all fifteen controls. Do not infer support for required network/process isolation from local tests: verify it before starting the acceptance workload. Expose only the authenticated Console. No Railway Agent or paid inference.

Protected retention: sealed whole-volume snapshots and manifests, maximum planned retained set 10 GB, outside the runtime in an owner-controlled bucket. Runtime receives no bucket administration/delete credentials. Export and upload are performed through the separately authorised operator surface; keep independent restore credentials outside the trial. Verify hashes and restoration before deleting any trial data. Ten GB is a proposed operational retention bound, NOT a verified provider-enforced quota or immutable object-lock guarantee.

Use the retained Pro model, USD20/month minimum including USD20 usage, only if the new workspace offers the same plan. Retained rates are RAM USD10/GB-month, CPU USD20/vCPU-month, volumes USD0.15/GB-month, service egress USD0.05/GB; bucket storage USD0.015/GB-month rounded up. At all proposed CPU/RAM ceilings continuously, resources are USD52.80/month plus service egress; ten GB bucket retention adds USD0.15/month. With 1–5 GB egress, this planning scenario is USD53.00–53.20/month before tax. This is not a measured forecast or a guaranteed maximum. At retained typical-load assumptions the earlier USD20–43.05/month estimate remains only illustrative, before retention and tax.

Proposed controls: isolated workspace USD50 compute hard stop / USD25 alert; no paid agent use; one replica and explicit service ceilings; two fixed-size volumes; first session sixty minutes; stop/revoke after the session; do not rely on next-cycle restart for continuation. Build charges were documented free in retained research. No billing settings changed.

**Worst-case financial exposure: no finite all-inclusive guaranteed total is established.** Compute stopping does not remove data or cancel the subscription. Stored bucket data remains billed; retention and subscription recur, and a usage-limit stop may be followed by next-cycle restart. Fixed-size disk and retention policies are operational bounds pending platform enforcement, not a no-overage financial contract. Tax is not verified. USD50 is not an all-charge ceiling.

**Decision:** Hold Railway provisioning under the current enforced-ceiling requirement. The one unresolved financial safeguard is a provider-enforced non-overage boundary covering subscription, compute, egress, volumes, protected retention and tax. The alternative needed is prepaid fixed-price isolated capacity with fixed storage/retention allocation and no automatic top-up or metered overage. A payment-card limit alone does not eliminate liability. No further general Railway billing investigation is needed.

If the owner instead chooses to accept metered residual exposure, that is a change to the spending requirement and must be explicit; a USD50 compute cap must never be represented as approval of a guaranteed USD50 total. This document does not request open-ended spending authority.

Rollback/teardown: stop the trial scheduler; seal current application/finance/Redis state; verify the independent retained copy; restore earlier compatible code against current records, never erase newer financial history; revoke trial credentials and remove public ingress; delete only trial compute/volumes after verified preservation. Retained evidence deletion and subscription cancellation are separate explicit steps. Production is unaffected.

Sources already read: RAILWAY-BILLING-READONLY-20261011.json, CONSOLIDATED-HOSTING-DECISION.md, HOSTING-DECISION-1635.md, https://docs.railway.com/pricing/cost-control and https://docs.railway.com/storage-buckets/billing. No repeat account/billing inspection.

## B — Exact accounting access request

Source: Railway project empireai, service empireai-locked-runtime, production environment; canonical file /data/commissioning/openai-october-2026.sqlite. This path is established by the existing locked inference implementation and retained accounting evidence, not a new guess. Required tables: calls and call_providers.

Smallest operation: one query-only SQLite read transaction per snapshot, checking canonical schema/integrity and exporting SELECT * FROM calls ORDER BY timestamp,id plus SELECT * FROM call_providers ORDER BY call_id. Preserve all fields, nullable values, provider-only rows and row identities; capture the schema, observation time and canonical/legacy digests. Do not write, checkpoint, migrate, settle, infer or truncate. If the current count has changed, report it exactly rather than force227.

The supplied script scripts/work8/export-canonical-accounting-readonly.mjs performs that operation using Node's DatabaseSync readOnly option. ACCOUNTING-EXPORT-CHECK.json records local synthetic preservation checks, not production extraction. This supplements the retained narrower comparison extractor; it does not create an accounting subsystem.

Available Advisor/Railway connector tools do not execute SQL or service commands. Exact alternative: an authenticated Railway SSH/Console session to this service, with the export streamed into a private local file rather than pasted into chat or service logs. From an already linked empireai operator checkout, use Railway SSH to execute Node with the script on stdin and the canonical file as its only path argument; redirect stdout locally with restrictive file permissions. No key/password sharing or application deployment is needed.

**One access request:** Make the existing authenticated service SSH/Console execution surface available for this read-only export and permit read-only access to the retained original snapshot containing224 rows. Authenticate that snapshot against original digest 1b51a5f806abc75c68904ec20dc46d6dcb286d5ced9ef7b24897876554fca39b before comparison. The historical snapshot's storage location is not recorded in the recovered evidence. Do not invent it or regenerate it with LIMIT224. If no original snapshot exists, report historical preservation as unproven. Transfer exports through the private workspace, not chat.

## C — Exact frontend publication batch, review gate still outstanding

Recovered frontend7dff79a6b712972b08add445d19e30cb664f69e0, tree03e55a6cea520a6cb1d1a752b51d3c9781290c65; recovered evidence645f46dc67da3e1ac8f0b5b33390e8ef8c3b8dd5, treef394a7080dd24d4b7fed73ce7c352efc54ccc8b6. Frontend application code is unchanged this continuation.

New source publication candidate5a9f99faf15b7c84cd9af7b1765150202e385b20, treeb1533aa1a8d41b6a674b2e1cf718db05079c4cd4. Only five existing CI pin lines change. They reference FRONTEND-AUTONOMY-CANDIDATE.bundle, blobf559557f06a1e493e52fe5fe7f9c3c04b7773cda. The bundle was restored from the workflow's existing base into a temporary checkout: exact frontend commit/tree and zero file differences verified. YAML parsed successfully. No new branch created.

Preserve prior typecheck, scoped lint and17 affected Home/navigation/projection checks. Those tests do not certify native rendering; the prior invalid Chromium download was not retried. All four published-source CI successes remain intact, but do not certify this new source head. After approved publication, inspect the newly triggered affected checks; do not rerun prior passing runs.

**Independent review is not complete.** A self-review or passing tests cannot replace it. The current session's execution rule requires explicit permission for agent delegation. No separate reviewer was spawned and no independent pass is fabricated.

**Approval wording:** Authorise one independent review agent for frontend7dff79a6 and the bounded CI/evidence batch. If that review reports no blocking findings without changing the approved source/evidence trees, authorise GitHub connector publication of the exact evidence commit identified with this decision first, then source5a9f99fa, to the existing Work8 evidence/source branches. Verify complete original/replacement tree equality and remote heads. Frontend7dff79a6 is transported only inside the evidence bundle: do not move work8/owner-operating-evidence-20261011, deploy, merge or obtain a release lease. If a blocking finding requires source changes, stop publication and report the exact defect.

## Shortest connected acceptance path

Immediately available: existing authenticated Intelligence evidence inspection, rule-selected acquisition receipts, truthful deferrals, unchanged local scoped qualification replay, exact bundle verification and read-only accounting once its execution surface is available. Do not repeat the already accepted replay/acquisition to fill time.

Requires isolated host: exact-candidate scheduled enrichment visible in Home/Intelligence/Products, native desktop/mobile equality, persistent canonical simulation, platform containment, independent restore and final endurance. Hosting alone does not supply an eligible product or Pillow commissioning authority.

Still gated by genuine eligibility/authority: Pillow recommendation; genuine owner product approval; enrollment into the linked simulated listing/order/fulfilment/finance chain. No qualified candidate exists in the retained checkpoint. Fixture success must not be relabelled genuine acceptance.

Next owner-visible milestone: open the isolated exact-candidate Console, observe the existing autonomous engine's candidates and truthful decisions under canonical identities, then advance an eligible dossier through Pillow and owner decision only when their actual prerequisites are met. No commitment that hosting alone completes the whole business journey.
