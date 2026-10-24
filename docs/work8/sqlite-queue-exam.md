# Pre-registered SQLite timeout / duplicate delivery examination

Supplemental fixed-fault mapping: item6 database/network timeout (SQLite database lock only) and item3 duplicate queue delivery (canonical durable task delivery only). Network transport timeouts and Redis/BullMQ delivery remain separate evidence scopes.

1. A second real SQLite connection holds BEGIN IMMEDIATE. Governed engine admission must time out within its configured bounded wait, produce no partial receipt, and retain a DATABASE_LOCK_TIMEOUT incident. Assurance has no authorised lock-breaking repair. After lock release, independently retry the exact previously uncommitted command; fresh readback must show exactly one receipt and close the incident without claiming automatic repair.
2. Deliver the same durable task/fence twice. The second delivery must fail the stale fence, retain one receipt/cursor advance, and close the duplicate incident only after fresh canonical readback.
3. Create a genuine receipt-before-cursor gap, then send duplicate concurrent Assurance recovery requests. The existing preauthorised checkpoint runbook may reconcile the durable cursor once, independently verify unchanged immutable history, and never execute the next commerce step or repeat a verified repair.

No main runtime code changes. All faults affect an isolated SQLite sidecar and actual Assurance control plane. No external provider effects, new infrastructure or paid inference.

Result: 3/3 targeted tests passed on Node22.23.2 with kernel network denial (1,326ms total; actual lock case 1,022ms). Strict TypeScript including noUncheckedIndexedAccess passes. Fixed-map items3 and6 now have concrete SQLite/durable-task/control-plane evidence for the scoped subcases, without claiming Redis or network timeout coverage. No runtime code changed.
