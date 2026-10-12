# F29 external containment boundary assessment

Reviewed source8277718e03a0e5d9b612dbe1240bb4a005e56856 and retained recovery-20261012/INCOMPLETE-ARMS.md. Existing actual worker SIGSTOP examination already retains the production600000ms deadline and termination result; it is not repeated. Original contract still requires both-observer SIGKILL and simultaneous launcher/guard loss with independent external platform oracle. Threshold remains660000ms, maximum720seconds each.

Current runtime exposes cgroup2 read-only,nosuid,nodev,noexec,relatime,nsdelegate at /sys/fs/cgroup; /proc/self/cgroup reports0::/. No delegated writable child cgroup or platform containment interface was observed. Mounted /proc additionally differs from child PID namespace, as retained prior scheduler failure demonstrates. These observations are not permission to change platform controls.

Existing launcher-loss-guard is explicitly inside the runtime process group and uses its own event loop/IPC lease to kill that group. It can prove launcher-only failure containment when guard survives. Killing launcher and guard together removes that mechanism; an examiner killing leftovers itself would be cleanup, not demonstrated independent platform containment. Existing single-fault tests therefore cannot be relabelled as the missing simultaneous arm.

Result: EXTERNAL_BOUNDARY_PREREQUISITE_UNAVAILABLE for the missing combined modes; no examination dispatched, no repeated600second stall, no deadline change, no new hosting/purchases. Original F29 remains open specifically for controlled external process/cgroup membership, persistent egress-denial evidence and independently observed platform containment after those simultaneous faults. No Work8 row/register changed.
