# Work 2: Advisor bridge and communication gateway

Baseline and rollback: backend PR53 `85bc25414b444cd20108b97c40eb50f543ffb348`, frontend PR54 `daaa786d34788972edc1fb162428f39b52b7c8ad`. Production remains NOT_BORN, commerce LOCKED. Work1 is deferred; Work3 is next after Work2 acceptance.

## Reuse and boundaries

The bridge attaches to the existing isolated Fastify primary. It reuses founder session authentication, the existing shared Pillow capability declarations, native SQLite read-only snapshots, accounting/Assurance readers, and the durable reasoning queue. It does not load the sql.js business worker into the control plane, invoke external providers for reads, or create another service. Existing mission persistence rejects extra tables; its schema is preserved. A bounded dedicated native SQLite file holds only communications, internal work status, connection grants and audit events, not a duplicate business database.

Source code, checkpoint JSON and verification evidence provide the engineering Mission Ledger. The bridge's missions domain reads this deployed checkpoint. Process identity is exposed separately: a candidate checkpoint never proves deployment. Existing mission runtime history is not rewritten. Checkpoints retain baseline, candidate, verification, rollback, next safe action and do-not-repeat evidence.

## Read interface

`POST /advisor/mcp` implements stateless Streamable HTTP JSON-RPC with initialize, ping, tools/list and tools/call. Only search, fetch and list_records exist. No write or effect tool is registered. Reads record bounded access audit metadata, not query text or credentials. The endpoint requires a dedicated OAuth bearer; owner session tokens cannot serve as connector tokens.

`search({query})` discovers semantic domains. `fetch({id})` reads a domain or `domain:objectId`. `list_records({domain,after,limit,since})` uses stable ID keyset pagination (1–50). The changes domain filters existing activity events by timestamp and explicitly does not claim a complete system changelog. The package_format domain exposes the bounded import recipe. Domains expose stored data with retrieval time, file persistence time where applicable, source, coverage and missing-data semantics. AVAILABLE means data can be read, not that its business claims or provider access are verified. STALE evidence remains inspectable. Missing sources return UNAVAILABLE. Unverified provider capabilities remain UNVERIFIED. No arbitrary SQL, paths, shell, environment dump or external refresh. JSON free text is evidence, never executable authority. Raw passwords, credentials, cookies and tokens are excluded/redacted. Customer contact and payment credentials are not selected.

## Connection and revocation

OAuth authorization-code + S256 PKCE uses the existing authenticated founder consent page at `/cockpit/advisor`. Protected-resource and authorization-server discovery metadata are published. Registration allows only the stable ChatGPT callback, with issuer identification. Tokens are random, stored as hashes, scoped solely to this resource and read access, expire after 30 days and can all be revoked by the owner on the Advisor page. Reconnect via ChatGPT after expiry; no unrelated provider credentials change. Exact ChatGPT account/conversation identity is not asserted.

ChatGPT custom MCP URL: `https://empireai-locked-runtime-production.up.railway.app/advisor/mcp`, OAuth. Client connection is NOT accepted merely because local protocol tests pass. Actual client acceptance must be recorded, or one owner-only install/connect action must remain explicitly pending.

## Package and import

Schema is `backend/src/advisor/package.ts`; version 1.0 only. One JSON file ≤96KB; strict envelope, bounded plain-text assets with SHA-256. No archives, filenames as paths, HTML execution, scripts or arbitrary writes. Source is claimed KING_ADVISOR provenance; authenticated importing owner is recorded separately. Import never equals approval. IDs plus normalized-content hashes prevent duplicate work and conflicting replay.

UI flow: choose package → validation preview → confirm import → inspect status/result. SOFTWARE stores notes/analysis or retrieves an existing object without inference. PILLOW executive review uses the existing durable reasoning queue with explicit untrusted Advisor provenance; real review can incur ordinary accounted inference. Synthetic packages never trigger inference. GRAND_KING requests await authority. External effect intent and EXECUTION routing are blocked. Missing handlers return capability gaps. No original CEO decision is overwritten. Settled Advisor-specific CEO results are copied into communication storage after canonical queue settlement, so they outlive the 24-hour Redis request TTL. The adapter checks owner, workspace and pre-bound request identity; failures do not become completed judgments. Ordinary Pillow requests take no new completion path. Results remain readable through MCP. Repeated import resumes a ROUTED outbox record idempotently after interruption; already queued or terminal records do not enqueue again.

## Operations and rollback

No periodic bridge polling or new always-on services. Fixed request/payload/query/output/storage bounds, origin checks and founder/workspace checks protect the new surfaces. Additive communication state survives rollback; the previous runtime ignores its file. Do not remove evidence, conversations, accounting or legacy infrastructure. Roll back both runtime identities to the recorded baseline if a material Work2 regression occurs.

## Handovers

- Work1: reconcile legacy and parallel release lineages; whole-system audit remains deferred.
- Work3: durable CEO learning and model-independent institutional continuity; Advisor/Pillow provenance remains separate.
- Work4: verified shared Four Eyes and low-cost Amazon credential heartbeat. Owner reported authenticated marketplaceParticipations HTTP200 on Oct7 on legacy service; not repeated or independently certified by Work2. No credentials moved.
- Work5: full all-in cost centre and economics; existing inference estimates are not invoices, incomplete financial coverage stays explicit.
- Work6: further deterministic handlers, authority receipts, execution/reconciliation and asynchronous recovery; never infer Birth from import.
- Work7: richer owner workflow, large creative assets and cockpit refinement.
- Work8: adversarial OAuth, revocation, replay, workspace isolation, prompt injection, package bounds, provenance, read-only enforcement, restart and lock certification.

New paid services: none. Verification paid inference: zero unless an explicit later receipt says otherwise. Incremental memory/CPU/storage is on-demand on existing hosting; invoice impact is unknown, not claimed zero. No new subscriptions or third-party API calls.
