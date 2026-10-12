# Independent producer settlement decision

Verdict: **APPROVE_UNCHANGED** for commit `0546920d6d692b8ae32f6dda6f0567ecdec6f038`, complete tree `2f1fbb2da38e8c60c4a53de78731ec0d71208a13`, scoped net delta from accepted `81c8b57114cc5e189363bb9843150f7718ed1327`.

Reviewed all four changed paths: `backend/src/brain/task-queue.ts`, its queue and Redis capture tests, and `work8-producer-capture-child.ts`. Independent detached worktree retained exact identity and no tracked changes. No source edits or additional reviewer.

Atomic Redis admission (task-queue.ts:46–69) serializes each cooperating producer against capture ownership. Persistent unique tokens cover queue mutation and synchronous audit invocation. Capture drains and checks tokens before/after its callback (lines 106–125). Only observed operation success releases its own token; failed queue/scheduler/audit operations, crashed producers and uncertain release cannot silently clear outstanding admission. Capture timeout refuses a snapshot and restores its own queue pause as before; outstanding producer tokens remain and subsequent capture still refuses. No automatic expiry or recovery clearance is invented.

Precursor `63c083a405798bbe234f0ad523aadad0389fcd40` is NOT approved: unconditional finally-release after rejected queue.add could remove the fence without establishing operation settlement. The retained negative oracle explicitly injects rejected/unresolved operation outcome followed by a real late Redis add; it is not a claim of a reproduced default ioredis reconnect sequence. Successor closes this contract gap by retaining every rejected operation admission.

Independent exact-source execution: `producer-settlement.log`, three tests, three PASS, zero failures, 5.316 seconds. Real loopback Redis plus a separate producer process establish admitted-before-add capture blocking and audit presence; crash, add/scheduler/audit and release failures retain tokens; a rejected command that later performs an actual Redis add cannot admit capture before or after late commit. Previously accepted endurance and application campaigns were not repeated. Agent additionally reports nine focused tests PASS; exact full build receipt was pending at decision time.

Scope limits: this is a cooperating TaskQueue producer fence, not a universal producer or SQL.js deferred export barrier. Synchronous audit invocation completion does not prove every independent database handle flushed to disk. Conservatively retained failed admissions can permanently block future capture until separately governed recovery; this is intentional safety over availability. Existing repeated scheduler refusal remains. No complete #33/#39 or Work 8 certification closure follows. Pillow remains NOT_BORN and commerce LOCKED.

For integration, apply only the four-path net diff from 81c8 to 054 and verify exact final blobs. Rejected intermediate ancestry is unnecessary. A combined-tree review and applicable checks remain required; this decision does not authorize publication.

Supplement: engineering agent verified exact054 full build exit0 including postbuild, retained SUCCESSOR-BUILD.log; final nine focused tests PASS. Source remained immutable.
