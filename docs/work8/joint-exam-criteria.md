# Pre-registered joint Commerce / Assurance / Finance cases

Three sequential injections share one synthetic workspace, canonical mission/task and order. No production runbook is registered. Local Assurance runbooks are confined to the owned temporary database and bounded task identity.

1. Worker receipt/cursor gap: commit the canonical intake receipt but leave its durable task cursor behind; cold reopen Commerce. Assurance must detect mismatch from fresh history and task reads, admit a scoped authority-A idempotent single-tick repair, and independently verify exactly one cursor advance with unchanged receipt count and prefix. Repeated recovery must not execute again.
2. Unknown supplier outcome: execute a canonical TIMEOUT intercept with accepted quantity zero. Fresh order state must be UNKNOWN. Authority-C containment must deny automatic resubmission, retain unresolved incident, and preserve history/task cursor on repeat attempts.
3. Financial source event conflict: bind finance simulation to the same verified mission/order receipt and inject a duplicate ID with changed amount. Projection must reject the conflict. Authority-C financial repair must never run; original source events, immutable commerce history and unknown supplier state must remain unchanged.

Pass requires all three detectors to observe actual common runtime data, shared identities in incident evidence and recovery records, fresh verification for recovery, zero repair execution for forbidden cases, immutable audit preservation, and zero paid inference/external effects. This is a local integration examination with virtual time and synthetic commerce. It is not real-source visibility, wall-clock endurance, production runbook registration, release or Work 8 closure.
