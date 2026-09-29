# Recovery impact assessment — 29 September 2026

**Decision: do not approve data loss or cutover yet. Assessment PARTIAL; full production restore BLOCKED by binary transfer access.** One real commissioning record is privately preserved and independently restored. The live database and Redis contents have not been obtained or restored. No production command, restart, redeployment, provider call or authority change was performed by this checkpoint.

## Important correction: the old worker has already exited autonomously

Fresh Railway logs show PID539 exited at **14:00:42 UTC / 22:00:42 Singapore** on29September. The existing extreme-lag watchdog called process.exit(78); PID1 logged worker exit code78 and respawn29. PID553 opened `/data/empireai-brain.db` and listened at14:01:04UTC. The deployment ID stayed unchanged. This occurred before this assessment and before the preceding isolated capture proof, which started at14:49UTC. The previous assertion that the same original RAM was still waiting to be captured is superseded.

Immediately before exit, logs reported pending=true, flushCount3, no in-flight flush, and lastFlushMs corresponding to06:16:50.861UTC. The interval to exit was **7h43m52s**. This is a potential exposure interval, not a row count or certified loss interval: those statistics are shared between handles and do not identify all stores. Exact old watchdog source contains no awaited persistence on that exit path. Worker-only RAM cannot now be recovered by attaching to PID539. External/durable copies may still reconstruct some information. Current PID553 has its own pending state; preserving it remains necessary.

Fresh logs report flushes1–6 between15:01 and15:12UTC; filesystem metadata shows the live DB at632,389,632bytes, mtime15:12:04UTC. This indicates disk activity, **not** full integrity, complete recovery or a consistent multi-store backup. Sampled startup logs show10 worker starts during26–29September; the problem was not one uninterrupted worker.

## A — Verified durable and recoverable

| Item | Verified recovery | Limit |
|---|---|---|
| Production commissioning mirror | 2,717 exact bytes privately retained, SHA256 `91b881d4055705d5670dde2df441543aa9bcec48ce8696f3566eed764d43d38f`; old revision reader accepted every field; one row restored to matching SQLite table and independently read in another process; integrity ok | One September14 record only, not full application recovery |
| Repository, canonical mission, provider receipts and nonproduction lifecycle | Git checkpointd19439d1 and referenced durable evidence remain available | Engineering history and observed facts, not production business ledger |
| Infrastructure observations | Read-only service/config metadata, startup/exit/flush logs, backup manifests/receipt preserved | Logs are sampled/filtered and may omit events; metadata is not backup bytes |

The recovered mirror records one handheld-fan recommendation awaiting King's decision: publicationAttempted=false, supplierSpendAttempted=false, approvalId=null, grandKingDecision=none, buyable=UNKNOWN. It contains projected economics, not proof of paid revenue or qualification. **Do not reactivate or approve this stale recommendation.**

## Inventory: obtainable versus inaccessible

- Live Brain `/data/empireai-brain.db`:632,389,632bytes; metadata obtained, **bytes not transferred**, no row counts or integrity check.
- `/data/commissioning-mirror/ws_empire_1.json`: complete text obtained and restore proved above.
- `/app/closure-backups/EmpireAI-persisted-20260921.sqlite.gz`:92,862,657bytes, filesystem dateSeptember20; split8parts sum to the same size. Manifest obtained; declared hashes are **not independently checked** without bytes.
- Older persisted gzip114,437,480bytes; receipt declares569,380,864-byte source fromSeptember20 and explicitly excludes pending RAM/Redis; receipt obtained, database restore unproved.
- Redis archives27,159 and23,270bytes: metadata only. A direct read of the small portable gzip returned literal `(binary file, 23270 bytes)`, not payload. No current Redis export/keys/queues readback.
- Shadow/authority stores: exact-old source maps Shadow SQLite to cwd/.data unless overridden and JSON authority to its data directory. Actual source-directory listing showed only an ignore file. Other absence claims from the Railway agent lacked backing tool calls and **are unverified**, not proof there are no stores. Actual worker cwd/handles remain unknown.
- Service configuration exposes names of Amazon/CJ/Stripe/OpenAI/vault/session secrets, not their values. No secrets were read. Configuration references are not a tested credential backup.

Binary transfer is unavailable through the exposed text-only file reader. No authenticated SSH/export tool is available in this session; no matching prior persisted/Redis backup was found in the bounded Library filename search. No production endpoint was invoked: even the old commissioning GET can restore/write on a read miss. Agent suggestions of dashboard download/scp capabilities were not verified and are not owner instructions. No broad permissions or production modification are justified by this limitation.

## B — Reconstructable, subject to evidence

- Code, mission directives, known rejected candidates and existing provider observations can be rebuilt from Git and handoffs.
- The single mirror's selection, recommendation, risks and unapproved state are recoverable exactly at its recorded timestamp.
- External Amazon/CJ/Stripe records could reconstruct provider-accepted orders/payments once separately scoped account readback is available. That reconciliation has **not** occurred; local intent, failed attempts and idempotency keys may not exist externally.
- Environment-managed credentials normally survive a worker restart; current names and continued operation support this, but values/decryption and DB-only vault entries were not validated. Reauthorization may be needed for missing connection state.

## C — Unknown potentially lost state and business consequences

| Category | Evidence and realistic consequence | Quantification |
|---|---|---|
| Customer orders / supplier writes / fulfilment | Old code includes orders, live_cj_fulfillments, customer pipelines and publishing paths. Missing local receipts could hide outstanding fulfilment or cause duplicate purchase if replayed | Actual counts and monetary exposure unknown; no defensible upper bound |
| Payments / refunds / settlements | Old schema includes financial ledger and live payments; Stripe secret names exist. Lost reconciliation can misstate profit or leave refund obligations unnoticed | Revenue, liabilities and loss amount unverified, not zero |
| Owner approvals | Mirror proves none for one record onSeptember14; other approval/decision stores unread | Do not reconstruct an approval from a recommendation; require reapproval if missing |
| Credentials / OAuth | Secrets configured outside worker RAM likely remain; tokens or encrypted vault updates might have existed only in SQL.js RAM | Exact missing entries unknown; possible reauthentication, not automatic proof of permanent loss |
| Pillow memory / EKL / learning | Old Brain schema includes memory_records, strategic_memories, empire_knowledge_learning_records, assistant messages, decisions and missions | Unique conversations/corrections/outcome learning may be irrecoverable; volume and importance unknown |
| Queues / mission state / idempotency | Redis client and BullMQ startup observed; queues and Shadow stores not inspected | Pending work may be reconstructable or duplicated; never resume effects before reconciliation |
| Provider/AI operating cost | Presale automation starts automatically; API/model credentials are configured | Paid API usage may exist without commerce; invoices/debits not reconciled |

## D — Evidence against material activity, and what it does NOT prove

The mandate and candidate remain NOT_BORN/LOCKED and no pilot is authorized. The recovered record reports no publication/spend. Old dedicated CJ fulfilment and live-payment flags default false and are absent from returned service-defined variable names. These reduce concern for those specific paths but do not prove effective runtime values or all-route enforcement. The old Amazon publisher permits live mode plus credentials; it is not the candidate's unified lock. `LIVE_COMMERCE_INTEGRATION_MODE` exists but its value was not exposed.

The existing authenticated Amazon receipt onSeptember29 observes one historical SKU at$14.99, seller quantity5, buyable=false; it did **not** read orders/settlements. CJ receipts cover catalog/variant/stock/freight reads, not order history. A bounded log query returned startup messages but no transaction events; absence from filtered logs is not evidence of zero transactions. **There is no sufficient evidence that no material business activity could exist in the gap.**

## Owner decision and next boundary

Recommendation: **do not accept RAM-loss risk and do not authorize cutover on this package.** The immediate required decision is whether to enable a narrowly scoped private, read-only binary transfer path so Work can retrieve existing persisted files and prove actual recovery. It must allow no deploy/restart/provider writes and must keep data out of Git. The concrete next access decision is approval for read-only Railway browser inspection to determine whether a private binary export option exists. The browser-use rule requires owner approval before falling back from an insufficient connector; no browser session was probed in this checkpoint. This approves inspection only, not snapshot creation, app calls, file mutation, restart or cutover. Export capability is not promised. No specific authentication procedure is claimed until that transfer mechanism is verified. Work must not ask for passwords/tokens in chat.

After access exists: obtain a versioned stable copy of current Brain plus available Shadow/authority/native stores and safely read Redis; verify checksums and independent read-only restore; count and date material tables; reconcile account order/payment/fulfilment records under separately bounded reads. Only then present an actual loss/obligation inventory and concrete cutover proposal. Copying current files alone will not resurrect prior worker RAM or establish a coherent cross-store snapshot.

Stop here as requested. This assessment advances the decision by proving an autonomous worker exit, defining the exposure interval, restoring one actual record, and demonstrating the binary-access blocker. It does **not** fulfill full-store preservation or full production restoration; no safe-loss claim is made.

## Durable checkpoint

Code `2855b4e96adba2d7e3c6abdbf2cb7e94aa375555` passed [Product](https://github.com/empireaios/EmpireAI/actions/runs/36589825330), [Semantic](https://github.com/empireaios/EmpireAI/actions/runs/36589825324), [Runtime](https://github.com/empireaios/EmpireAI/actions/runs/36589825429). Candidate regressions passed; this does not prove full production recovery. Local proof restored one actual mirror record and the exact-old reader accepted it. Raw recovered data and the isolated restored row are privately retained; Git contains observations, checksums and the redacted restore receipt. Canonical handoffs are synchronized.
