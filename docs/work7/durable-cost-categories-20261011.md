# Work 7 standalone cost categories — candidate only

Owner directive 11 October requires durable standalone category creation, editing, archiving and vendor assignment. This backend branch starts from deployed backend 51830f9f and remains separate from frontend PR109 and scheduled-evidence repair PR110.

Two additive owner-only financial journal commands:

- `cost_category`: stable category ID, name, description, archived flag and expected prior revision (null for creation).
- `provider_category`: existing vendor ID, category ID (null restores original vendor category) and expected mapping revision.

The existing authenticated founder/workspace/email guard, origin check, body limit, append-only SQLite journal, transaction lock and idempotency identity apply. Stale edits and duplicate names are rejected. New assignments require an active category. Archived assignments and all historical records remain readable; no charge, currency, approval, provider connection or spending limit is changed. Categories are metadata, not the accounting classification enum and not active subscriptions.

Snapshots add `costDirectory` and explicit editing capabilities. Old backend responses lack these capabilities; the frontend must disable these new writes rather than pretending vendor notes are category persistence. Existing owner provider records remain unchanged. No migration writes run on boot or read; no baseline financial rows are rewritten.

Verification: 21 targeted category/financial invariant tests, the two existing owner route/cap tests, plus a new real authenticated route test. Durable reopen, identity preservation, optimistic concurrency, category archive, vendor reassignment, hostile origin, unauthenticated/foreign owner denial and all seven protected 423 routes are covered with disposable isolated data. Backend typecheck passes. Hosted CI and live candidate backend deployment are distinct gates.

No production deployment, new service, release lease, provider call or financial metadata write was performed. NOT_BORN and commerce LOCKED remain authoritative. Live standalone-category acceptance awaits a separately authorised candidate backend; isolated tests are not that receipt.
