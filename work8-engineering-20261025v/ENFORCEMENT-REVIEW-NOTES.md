# Independent enforcement design review — V

Reviewer: /root/writer_review_v. No production action, CI or accepted test rerun.45/19 unchanged.

The accepted controller journal cannot enforce complete writer membership by JavaScript spawn mediation alone. Runtime processes already hold file/Redis access; ordinary fork/exec or session/group escape would create unadmitted writers or evade guard containment.

A bounded native mechanism is technically plausible without new infrastructure: an immutable per-runtime LD_PRELOAD library installs no-new-privileges and a seccomp filter in its constructor, after the initial Node exec and before application code or Node-created threads. The operator does not load this library. The controller must verify the exact library/source binding and actual filtered process state before journal admission.

Mandatory policy: reject unsupported syscall architecture and x32 ABI; deny fork/vfork, non-CLONE_THREAD clone, subsequent execve/execveat, setsid/setpgid/unshare/setns. Return ENOSYS for clone3 so supported libc can fall back to filtered legacy thread clone; actual Node22 thread compatibility must be examined. Preserve admitted process identity by denying subsequent exec, which could otherwise discard the generation lock while preserving ordinary data access. Deny cross-process memory/ptrace and descriptor-stealing routes where unnecessary. Unsupported kernel/filter installation fails before application import. Runtime CapEff remains zero and no-new-privileges is retained.

This is a design candidate, not acceptance. Required evidence: actual separate identities; protected library bytes; inherited policy on worker threads; rejected subprocess creation, exec and group escape; preserved Node async/worker-thread operation; no admitted descendant omitted from census; controller/guard crash group cleanup. Seccomp status alone is insufficient because Docker already uses a filter; verify the additional policy, source identity and attempted denied operations. No hosted success is inferred from Docker availability.

Kernel basis checked narrowly: https://docs.kernel.org/userspace-api/seccomp_filter.html documents filter inheritance and no-new-privileges prerequisite; https://www.kernel.org/doc/html/latest/userspace-api/no_new_privs.html documents persistence and inability to unset the flag. These properties support the mechanism but do not prove this implementation or hosting compatibility.

Guard remains an independent privileged control-plane process and process-group leader. Controller and every admitted runtime child remain in its group. Actual guard audit/startup writers require explicit admission/exclusion; ordinary application mutation must not occur under untracked operator authority. Broker signals must report real acknowledged controller action and actual exit events, not fabricated synchronous ChildProcess behavior.

## First native implementation review

Reviewed `runtime-writer-isolation.c`, `runtime-writer-isolation.cjs` and build script. The classic BPF branch correctly permits legacy clone only with CLONE_THREAD, returns ENOSYS for clone3, and rejects fork/vfork, subsequent exec and group/namespace escape. TSYNC and no-new-privileges are mandatory and installation failure exits before Node application entry. The script builds a target-libc artifact, hashes it, and makes the output read-only; no binary source artifact is silently invented.

Outstanding source hardening sent to root: bind mapped image device as well as inode/path/hash; explicitly reject inherited NODE_OPTIONS in attestation; reject unbit x32 syscall aliases512..547 or impose a verified kernel minimum. These checks supplement rather than replace real hosted syscall/identity evidence. No native test was run by this reviewer and no integrated candidate is accepted at this point.

The proposed explicit root guard record is permissible only as a declared trusted control-plane principal, not a generic bypass of runtime UID rules. Guard audit invalidation must remain durable/observable if the controller is hung. IPC invalidation alone cannot justify accepting a concurrent capture. Kill deadlines remain independent of journal/audit success.

## Integration readback follow-up
Reviewed actual controller/guard/broker and root capture-receipt/build changes after fixes. Guard acquires its own lifetime generation lease before controller spawn; operator guard admission is explicit and runtime launch manifests cannot request that role. Emergency marker precedes containment audit; shared audit fence and journal revision/census checks invalidate capture on concurrent lifecycle changes. Capture validation refuses STOPPING, preventing release from reopening admission during shutdown. Real child output is inherited, avoiding undrained pipes. Broker reports spawn only after durable admission, checks PID start identity for signals and forwards actual send/signal acknowledgements. Existing group kill timer remains independently armed before asynchronous audit.

Root receipt bridge now rejects foreign boot/PID namespace/epoch/cutover cohort splices, enforces guard UID/GID zero and verifies regular single-link receipt file plus digest. It remains historical inspection metadata with bootAllowed=false and completeLiveState=false; it is not authority restoration or proof every writer is held. Build configuration appends the native build in the same image, preserves Node/runtime settings; target image compilation, kernel capabilities and actual graph execution remain examination gates.

Retained broker changed-boundary evidence: 4 tests, 4 passes, no failures/skips (BROKER-CHANGED-TESTS.txt). Reviewer did not repeat tests. Final complete-candidate acceptance awaits frozen source manifest, target hosted examination design and remaining local changed-boundary evidence. Baseline remains 45 accepted / 19 outstanding.
