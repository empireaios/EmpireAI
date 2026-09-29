# Protected production cutover — minimum closure sequence

Assessment29Sep2026 at13:07UTC: same old deployment/source, pid539, pending=true, flushCount3 and zero critical save requests/successes. Read-only logs still show approximately3.7s event-loop lag. This is not a capture receipt. The exact old source exposes requestCriticalPersist() internally but returns void; its only call sites are commissioning and Shadow repository saves. No dedicated drain/save HTTP endpoint was found. SIGTERM/SIGINT shut down and exit. Do not use a business commissioning call, signal, redeploy or new process import to pretend to export existing RAM.

## A — Work can complete without protected-process intervention

Completed: inspect pinned old source and fresh read-only logs; maintain source hashes; map candidate capabilities; rehearse joint Brain/Shadow/owner/authority capture and independent-process restore; detect tampering and preserve source; prepare a reviewed bounded sequence. `node deployment/rehearse-cutover-recovery.cjs` accepts no source paths, builds isolated synthetic stores, uses existing capture/verifiers and reopens restored copies in a separate process. It never starts EmpireAI or contacts a provider. Product CI preserves its receipt.

Existing candidate capabilities: HTTP admission/drain; local workers/scheduler/Pillow boot drain; shared Brain queue pause and producer-event detection; Brain/Shadow RAM fences with awaited critical saves; native mission-store locks and sidecar refusal; JSON authority/owner fences. These are implemented in PR5 but are not available in the old process. Redis recovery tests are separate; the new rehearsal does not certify Redis/native stores or production RAM.

Next autonomous prerequisite: build and independently rehearse a **legacy in-process export bridge** against an isolated exact-old-revision process, including identifying the actual owning process/handles, fencing writers, bounded export completion detection, resource headroom and failure recovery. A debugger/inspector attachment or injected code is not currently a verified route and must not be attempted on production to discover whether it works. If no safe bridge is feasible, explicitly present the recovery/data-loss alternatives; do not loop on more disk-only tests.

## B — Owner authorization, not credentials

Only after a concrete bridge and rollback procedure have been independently rehearsed: ask for the specific temporary maintenance intervention on protected production (writer quiescence and bounded in-process export) and its outage/resource risks. Owner permission cannot establish technical safety. No such production intervention is requested or performed in this checkpoint. Any fallback that accepts loss of pending RAM, termination, volume replacement or irreversible migration requires separate explicit owner authorization; none is authorized.

## C — Cannot be completed without touching the old process

Preserving current RAM requires the owning process to export it or a verified process-memory recovery mechanism. A disk copy, new replica, candidate deployment, healthy status, ordinary read endpoint or external SQL.js handle cannot establish that its pending RAM has been saved. Do not replace the old process just to install capture controls.

## Ordered execution boundary (all evidence required)

1. Identify actual Brain/Shadow handles, process cwd, all old store paths, replicas/producers and Redis keys/queues. Verify private destination storage/free space and runtime support. Preserve a read-only disk baseline where operationally safe; label it incomplete. No business database bytes go into Git.
2. After A is proved and B authorized, hold ingress and every writer/producer. Drain in-flight work without starting new commerce. Include independent handles, native stores, JSON authority and Redis/queues. If any writer cannot be accounted for, stop without promotion.
3. Export the actual owning RAM handles and prove completion while fences remain held. The old void method is insufficient: require successful completion, stable persisted sequence/digest and independent readback. A pending=false log alone is insufficient if writes resume or stores were omitted.
4. Capture all inventoried stores under that same boundary, retain independently pinned manifests in private storage, transfer to isolated recovery and run integrity plus logical record/authority/queue reconciliation. Restore actual data with providers disabled. Synthetic rehearsal alone does not pass this step.
5. Keep verified original snapshots and a tested rollback path. Bring up isolated candidate with NOT_BORN/LOCKED, verify login/home/product/transaction and actual revision against preserved data. Only once recovery is verified may a separately reviewed promotion replace the protected process. Never grant Birth/commerce from a backup test.

Current status: offline joint restoration is executable and tested; actual baseline, legacy in-process bridge, complete production capture and recoverability are not verified. No safe cutover authorization inferred. This plan has one concrete engineering gate—legacy bridge feasibility—not an indefinite request for more capture validation rules.
