# Recovery continuation: fixed #33 / #39

Base: frozen source 7b7b4ec4. No endurance or application rollback rerun.

## Complete remaining acceptance boundary

#33 requires: all admitted writers and in-flight effects included at one coherent boundary; no late SQL.js export or Redis operation escaping capture; no duplicate/lost business, money or authority effects under restart/replay; actual independent-process race coverage.

#39 requires: globally coherent operational restoration with pending work continuing under current governed authority; integrity, lineage, financial conservation and restart verified; separately protected and independently authenticated custody. Existing rollback acceptance is preserved.

## Executable successor package

A cooperating SQL.js process currently can retain stale RAM and later replace the database inode despite another process's capture fence. Repair process ownership before opening/loading RAM, keep the owner through all asynchronous and synchronous exports, release only after close, rely on kernel cleanup after process death. Inspection handles must participate too. Export through the canonical owner path; reject hardlinks or replaced owner metadata. Test real child openers before/during capture, normal handoff, crash/restart, readonly inspection and symlink path identity; preserve failed flush data and same-process capture checks.

Scope is cooperating current-code processes. A native SQLite lock sidecar is local concurrency metadata, not authority or a protected backup. Do not remove or replace an owner sidecar while a process is active. An absent or replaced sidecar refuses writes/capture rather than automatically reacquiring ownership. Failed final export retains ownership for retry.

## Still not established

Older/uncooperative binaries and arbitrary external Redis producers must be excluded by an independently established runtime/process/network boundary. The software lock cannot claim this. Full operational restore remains gated; historical snapshots still have bootAllowed:false and completeLiveState:false. Protected external custody is an external dependency and is not provisioned by this task. No live effects, paid inference, infrastructure, production deployment or publication.
