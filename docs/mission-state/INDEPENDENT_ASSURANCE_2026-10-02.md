# Independent EmpireAI Assurance

Owner instruction 2026-10-02 supersedes the older mandate that Work be the permanent watchdog. Work is an external auditor and engineer. The permanent deterministic Assurance layer must run on EmpireAI-controlled infrastructure, independently of Pillow and Work availability.

Status: IMPLEMENTED-UNVERIFIED core only. Not deployed. Not PROVEN. Eight offline tests passed on Node 24.19.0; CI targets the locked runtime Node 22.23.2. No live operational or commerce coverage is claimed.

The core requires thirteen explicit domains: runtime, workers, scheduler, Pillow omissions, marketplace orders, supplier/fulfilment/tracking, listing drift, money/transactions, refunds/reimbursements, provider accounting, evidence freshness, authority/spending, and persistence/backups/recovery. Missing adapters report NOT_CHECKED; unavailable sources and stale evidence never produce PASS. Snapshot comparison detects omitted, unexpected and mismatched records. Durable SQLite cycle receipts are append-only after completion, scheduled slots are unique, and an independently invoked read-only deadline inspector detects absent, interrupted and overdue cycles. No LLM or commerce writes exist in this module.

Remaining executable integration: supply independently authenticated read-only adapters; configure durable cycle scheduling; deploy the deadline inspector in a separate failure domain with owner-visible escalation; connect containment to existing authority gates without interfering with customer obligations; persist backup/restore proof. Do not run a checker and its sole monitor on the same scheduler. An absent monitor also requires platform-level heartbeat/dead-man observation. Provider permissions and source availability must remain explicit.

Acceptance still requires safe live failure injection: create a controlled discrepancy that Pillow does not self-report, show independent detection and durable evidence, interrupt the assurance scheduler, and show overdue detection by the separate monitor. Unit tests alone never satisfy this. Marketplace obligations remain unproven while commerce is LOCKED.

Track under MANDATE-01/02/03/04/07/08/09/10/11/18/19/22/38/39/40 in the canonical 223-record matrix; reactivate independent Assurance requirements without awarding PROVEN status or altering unrelated certification criteria.
