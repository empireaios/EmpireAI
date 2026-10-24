# Authoritative membership remains an implementation gap

The independently reviewed five-path candidate provides scoped same-authority-inode generation exclusion and honest incomplete export. It does **not** implement a durable authoritative membership ledger. This is an architectural gap, additional to the missing positive nonroot and Node 22 examinations. Frozen staged source bytes are unchanged by this assessment.

The runtime-writable `members` directory permits the runtime principal to delete or alter earlier member records. `wx`, fsync, a random member ID and a shared generation lock do not prevent that loss. Export therefore correctly reports `UNPROVEN_RUNTIME_WRITABLE_MEMBER_DIRECTORY`. Neither current `/proc` observations nor kernel-lock reconciliation can reconstruct omitted historical enrollment or termination. Current lock-holder reconciliation could strengthen current same-host observations, but cannot by itself close this gap or establish independent Redis producer exclusion.

## Smallest credible prospective architecture

Use the existing launcher/supervisor as a **separately privileged control process**, with an operator-owned membership journal that runtime principals cannot modify or replace. This requires a real principal boundary, not a new field claiming authority. The control process must be narrowly scoped to lifecycle and admission; application stores and external commerce remain outside its role.

Before executing application imports or receiving usable write capability, every declared child must complete an enrollment handshake over inherited authenticated IPC. The controller binds its actual child PID, process-start identity, namespace, generation, exact source and declared store/producer capability set, commits the admission record durably, then acknowledges admission. Child-generated identifiers alone are not authoritative. Primary-to-brain-worker replacement must also be mediated by the trusted controller; ordinary same-principal grandchildren cannot silently self-enroll.

The controller must retain restart and termination observations, never delete previous generations, and refuse new admission on uncertain journal or acknowledgment state. A crash after durable admission but before acknowledgment leaves a conservative unresolved member. The controller must reconcile that member against authoritative process identity and effective fencing before transition. Controller failure must stop new admissions and contain existing children; an in-memory IPC failure callback alone is insufficient evidence of completed termination. Retained records must distinguish admitted, exiting, confirmed terminated, fenced and unknown.

The existing native generation lock remains useful: a controller cannot commit a new epoch while any cooperating admitted process retains its shared lock. It does not substitute for the durable handshake, nor for freezing active writes during capture. Capture must freeze new admission and bind the existing held-capture acknowledgments to an immutable journal revision and complete declared member set.

## Concrete source boundaries

| Path | Necessary correction beyond the frozen candidate |
|---|---|
| `deployment/locked-runtime.cjs` | Separate trusted lifecycle-controller identity from application identity; do not run ordinary application work in the privileged controller. |
| `deployment/locked-supervision.cjs` | Mediate primary launch and containment, persist lifecycle transitions and resolve uncertain shutdown conservatively. |
| `deployment/assurance-supervisor.cjs` | Enroll each observer and replacement through the controller before observer storage writes. |
| `backend/src/runtime/tier0-isolated-primary.ts` | Route brain-worker creation/replacement through trusted admission rather than self-authorized same-principal spawning. |
| `deployment/runtime-generation-preload.cjs` | Await trusted durable admission acknowledgment before entrypoint imports; synchronous preload currently cannot perform that asynchronous protocol without a redesigned bootstrap. |
| `deployment/runtime-generation.cjs` | Export controller-owned validated journal records and frozen membership revision; retain scoped refusals until the graph is complete. |
| New narrowly scoped controller/journal and bootstrap module(s) | Atomic durable enrollment, authenticated child binding, privilege separation, acknowledged admission, crash/restart reconciliation and no-force transition semantics. |

An equivalent existing authoritative operating lifecycle/capability service could replace the new journal/controller if it supplies these actual guarantees. No such complete source has been established. A root-owned JSON file written once at provisioning is not a substitute for recording later child replacement and termination.

## Why this is not added as an unexamined patch

This changes process creation, identity separation, startup ordering and crash containment across the actual launcher/primary/observer graph. The local environment cannot execute the required distinct-principal child path: changing child UID/GID is unavailable. Therefore a positive end-to-end examination of the new authority boundary cannot currently be performed here. Implementing an untested acknowledgment or privilege-drop shim would create another incomplete admission mechanism rather than a credible closure.

The next required capability is an existing authorised isolated execution environment that can run the trusted controller and runtime children under distinct principals, preserve an operator-owned journal and exercise real process crashes/replacements. This does not authorize provisioning, deployment or paid infrastructure. Once that capability is identified, complete this implementation and independently examine the real graph before proposing another exact-tree successor.

Local engineering permission is already granted. The missing input is executable validation capacity, not another request to authorize implementation. The minimum existing executor needs the deployed Node 22 line with native SQLite, distinct controller/runtime UIDs, an operator-owned path and protected ancestors that runtime children cannot write or replace, inherited private IPC, real child spawn/signal/exit observation, and an isolated Redis instance or authorised existing isolated Redis namespace with credential/connection controls. Runtime must lack privilege or capabilities that bypass that filesystem boundary.

One changed-boundary examination should run the real launcher, both observers, primary and replacement brain-worker under those identities. It must show durable admission before each role's first mutation; journal immutability to runtime principals; concurrent spawn/transition refusal; controller and child crash points before/after journal commit and acknowledgment; restart reconciliation; old-generation and incompatible-source refusal; capture admission freeze plus complete-member held acknowledgments; and Redis in-flight drain/old-client exclusion where the operating gate applies. Assert no fictitious terminated record from a mere exiting callback. Reuse all accepted unchanged recovery evidence rather than restarting its historical campaign. Full recovery/custody certification remains a later complete-contract decision, not an automatic consequence of this examination.

Separate operating evidence is still required for initial legacy-generation exclusion, Redis commands already in flight, old client/credential exclusion, protected copy custody and full restoration. Those facts cannot be synthesized by the controller or recovered from missing history. No whole requirement is promoted to PASS.
