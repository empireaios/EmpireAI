# Independent actual-graph topology review — U

Reviewer: /root/journal_review_u. Retained source only; no tests, remote reads or source edits.45 accepted/19 outstanding unchanged.

Decision: ACCEPT GROUP-PRESERVING DESIGN CONSTRAINTS; no integrated implementation or operating acceptance yet.

## Proven containment relationship

`canary-launcher.cjs` starts the guard detached, making its PID the process-group/session leader. `launcher-loss-guard.cjs` spawns its child without detaching and independently kills `-process.pid` on lease/disconnect containment. Current primary and nested brain inherit that group. The guard's timer is deliberately independent of launcher and observers. Moving controller-owned primary/brain to siblings outside this group would invalidate that accepted containment relationship.

## Minimum coherent topology

Preserve an outer launcher heartbeat and the independently timed detached guard. Make the guard's supervised child the authoritative operator controller. All actual application participants it admits—including primary, brain replacements and observer replacements—must inherit this guarded process group; no detached application child or alternate unmediated spawn is allowed. Keep guard-to-controller signal semantics explicit: TERM requests a bounded drain of all admitted children; KILL remains an independently enforceable group stop at the original deadline. A controller crash must not allow the guard to exit while runtime descendants survive; guard exit/child-exit handling must enforce group cleanup even outside parent-loss cases.

The controller must retain operator privileges to create protected history and launch distinct runtime UIDs. Consequently, the group guard must remain an operator/control-plane principal able to signal the controller and all runtime UIDs, or have an explicitly limited effective CAP_KILL with a verified equivalent boundary. A plain runtime-UID guard cannot reliably kill a privileged controller. Do not place the old root-refusing runtime-generation preload on the privileged guard/controller and then bypass its rejection. Separate operator bootstrap from application admission explicitly.

The operator controller is the sole journal authority. Runtime application entrypoints still wait for controller-owned durable ACK and have zero effective capabilities. Group membership/PID-start identities and replacement identities must be observed by the controller; source-role allowlists and fixed environment rules remain mandatory. Runtime requests cannot name arbitrary commands, PIDs, environment variables, journal paths or generations.

## Observer supervision correction

The previous plan's suggestion that outer `superviseAssurance` can simply inject controller-owned spawn and receive an actual ChildProcess is valid only when supervisor and controller inhabit the same process. With the controller inside the guarded group and the outer launcher outside it, that assumption no longer holds. The smallest coherent route is moving existing observer supervision orchestration inside the controller process while preserving independent observer processes, progress/quarantine policy and capture deadlines. Alternatively, an explicit acknowledged broker is required for observers too. Do not return JSON identifiers cast as ChildProcess.

## Guard audit and startup writer coverage

The guard currently directly appends and fsyncs `commissioning/assurance-containment.jsonl`. The outer supervisor does the same on coverage loss. The launcher performs inference startup-readback mutation. These are writers, not incidental logging, and cannot be omitted from the census.

Choose one explicit approach before implementation:

1. Delegate these ordinary-store mutations to admitted runtime participants, with a pre-admitted independent audit participant available for guard emergencies. A dead or stalled controller must not be required to authorize emergency containment; audit failure may be reported but must never delay the original kill deadline. An emergency mutation invalidates any concurrent capture unless it is part of the frozen scope.
2. Retain a narrowly scoped operator audit writer, declare it in the authoritative scope/capture protocol and distinguish its protected control-plane journal from ordinary runtime stores. This is an additional trusted writer, not evidence that only runtime children mutate state. Its own history must not allow rewriting the controller's membership journal.

The first route gives the cleanest controller/no-ordinary-application-write boundary; the second may require fewer changes but needs independent capture/exclusion proof. Neither can silently skip durable audit behavior already relied upon by accepted containment evidence. Guard readiness must be gated on the chosen audit arrangement without making guard liveness depend on application health.

## Broker and shutdown invariants

Primary-to-brain control must acknowledge actual controller signals against the admitted PID/start identity. Preserve send callback/disconnect/exit ordering and reject stale replacement events. `primary-shutdown.ts` currently interprets synchronous `ChildProcess.kill()` success; convert this consumer to explicit acknowledged signaling rather than fabricating synchronous truth. Attach exit observation before signaling and preserve the original deadline, failure behavior and no-respawn flag. Controller unavailable means failed shutdown/containment, never successful persistence.

## Required changed-boundary examination

Before operating acceptance, one real-graph isolated examination must cover: guard/controller/launcher loss; full group cleanup; primary/worker/observer replacement; admission before every ordinary-store mutation; capture while all declared writers are active; emergency-audit invalidation; old-member event rejection; and identical original deadlines. Keep the already accepted isolated journal result and unchanged store tests. No whole-row PASS follows from this topology review.

Safe prospective epoch exclusion of preexisting file/Redis writers, complete operational restoration, compatible rollback artifacts and protected independent custody remain distinct operating requirements. No production change or new infrastructure is proposed here.

## Enforcement prerequisite beyond known call sites

Controller mediation of reviewed spawn call sites is insufficient by itself. A demoted runtime still holds file/Redis access and may create descendants under the same identity; those descendants can retain access without their own durable admission. Runtime zero capabilities and no-new-privileges do not prohibit ordinary fork/exec or process-group escape. Therefore the next design must either enforce runtime process-creation/group restrictions while retaining necessary Node threads, or mediate every write capability so an unadmitted descendant cannot use inherited access. That policy must be independently demonstrated on the actual supported runtime before complete census is claimed. A future syscall policy is not assumed available merely because Docker exists, and no new infrastructure is prescribed.

The quantified actual-graph engineering is already authorized. It remains implementation work with an unresolved enforcement design, not a new owner-permission requirement. Source staging must wait for a coherent implemented and reviewed candidate; an unused broker shim would not resolve this boundary.
