# Isolated Work8 acceptance — bounded decision, not deployment authority

No infrastructure, subscriptions, deployments or spending controls were changed. The completed account/billing inspection was not repeated.

## Concrete deployment scope

Use the existing application and Console, with one backend/scheduler replica (maximum 1 vCPU / 1 GiB RAM), one private authenticated Redis replica (maximum 0.25 vCPU / 256 MiB RAM), and one authenticated frontend replica (maximum 0.5 vCPU / 512 MiB RAM). These are proposed resource ceilings, not verified sufficient capacity. Use two dedicated 1 GiB persistent volumes for application state and Redis AOF. No production mounts, credentials, database endpoints or deployment branch are permitted. Public access is limited to the owner-authenticated Console; Redis remains private. Pin published backend76206d79 and the reviewed frontend bundle only after its outstanding review/rendering gates pass.

All fifteen controls and seven denied effect routes remain enabled. Supplier purchase, marketplace publication, customer payment/refund/transfer, live release and paid inference remain unavailable. Source acquisition may use only already authorised read scopes. Start with one supervised sixty-minute acceptance session; this duration is not a billing ceiling or endurance certification.

Before any destructive examination, use the existing sealed snapshot engine to capture all enabled stores and Redis AOF after coordinated writer stop. Retain the immutable manifest and hashes outside the runtime under separate restore credentials; the runtime must not be able to delete its retained recovery copy. Verify independent restore into empty isolated stores, with authority inert after restore. A normal editable bucket alone does not prove this protection.

Rollback uses the prior compatible code with preserved current financial state; it must not erase historical records. Teardown order: seal final receipts, independently verify the off-host copy, stop all services, remove trial credentials and public routes, then delete isolated compute and volumes only after required retention is safely preserved. Retention expiry and any storage deletion require an explicit policy; do not erase accepted evidence to meet a budget.

## Financial boundary: exact unresolved limitation

Railway official documentation, read without account/billing reinspection:

- https://docs.railway.com/pricing/cost-control : compute limits cover CPU, memory, storage and service egress; hard-limit shutdown applies to the workspace; workloads may restart next billing cycle. Agent usage is separately controlled.
- https://docs.railway.com/storage-buckets/billing : bucket access is suspended at the hard limit, but existing stored data remains billed. Bucket storage is USD0.015 per GB-month, rounded upward to whole GB-months. Service uploads also incur service egress.

Therefore the retained USD20–43.05/month estimate, proposed USD50 compute limit, and sixty-minute session do NOT establish an all-charge maximum. Tax, subscription treatment, continuing protected retention and the retention provider's enforced storage boundary remain unverified. No numerical all-inclusive maximum is asserted. The only currently authorised incremental spending maximum is USD0.

Do not place a trial hard limit on production workspace a4962933-0870-4df7-bb46-3625ed800be1. Canary project feb90d26-c54b-4435-ac32-f666e3e25447 has no reusable resources; its existence is not approval to incur charges.

## One consolidated owner input

Supply an already-funded isolated execution target plus protected off-host retention with an explicit no-overage allocation, or a separately billed provider offer that states the tax-inclusive subscription, compute/network/storage/retention maximum and enforceable overage denial. A budget preference alone cannot prove provider enforcement. Once that boundary is attributable, the single deployment request will cover the exact three services, two volumes, protected restore, owner authentication, trial duration, rollback and teardown above. No provisional open-ended deployment approval is requested.

In the same secure handoff, provide the original224 and current227 canonical read-only accounting snapshots (calls and call_providers, including original row identities and snapshot provenance). Existing extraction/reconciliation code is ready. Do not send credentials in chat or substitute aggregates/request correlations for canonical records.

Media/marketplace evidence remains tied to the selected autonomous candidate and existing permissions; no routine supplier correspondence or new rights system. Pillow commissioning is requested only once a sufficiently evidenced dossier exists and the exact permitted inference scope is known.
