# EmpireAI Accounting Worker

PILLOW-ACCW-001 / Q9-02 provides the Accounting Worker inside the Capital Factory.

The Accounting Worker is the real, append-only bookkeeping layer for EmpireAI businesses. It maintains a chart of accounts, records income and expenses as balanced double-entry journal postings, maintains asset and liability registers, posts fund transfers and general ledger entries, generates financial summaries, and produces machine-readable Accounting Reports consumable by Q9-03 and later capital workers. It integrates with the Q9-01 Capital Factory Core exclusively through dependency injection — it never reimplements Capital Factory Core orchestration.

The Accounting Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates accounting records, never forecasts finances, never approves investments, never replaces the Budget Planning Worker, and never overrides approved architecture, Pillow, or Grand King.

## Workflow

1. Maintain a standard chart of accounts per business on first use (Income, Expenses, Cash/Bank, Accounts Payable, Owner Equity) — accounts are registered structurally, never with fabricated transactions.
2. Record income (credit Income, debit Cash/Bank) and expenses (debit Expenses, credit Cash/Bank) as balanced, immutable journal entries.
3. Maintain asset and liability registers, optionally posting a balanced journal entry alongside a register update.
4. Record fund transfers (debit destination, credit source) requiring matching currencies unless explicitly marked `UNKNOWN`.
5. Post and maintain the general ledger — only balanced journal lines may ever be posted; unbalanced postings are rejected, never corrected by fabrication.
6. Generate accounting summaries (income, expense, asset, liability, equity) computed strictly from observed ledger data.
7. Produce Accounting Reports (`ACCW-RPT-v1` / `ACCW-001-v1`) with `consumableByQ903: true`.
8. Submit findings through the Executive Reporting Runtime and preserve complete, immutable accounting history.

## Integrations

- Capital Factory Core (Q9-01) — dependency injection only
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime

## Boundaries

The Accounting Worker:

- DOES maintain a real chart of accounts and post balanced double-entry journal entries.
- DOES maintain asset and liability registers and produce Accounting Reports.
- DOES NOT fabricate accounting records — amounts are never invented; missing amounts fail validation.
- DOES NOT forecast finances.
- DOES NOT approve investments.
- DOES NOT replace the Budget Planning Worker.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-03 or later — it exposes a Q9-03 consumable contract instead.
