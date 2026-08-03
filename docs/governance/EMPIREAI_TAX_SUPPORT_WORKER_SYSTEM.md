# EmpireAI Tax Support Worker

PILLOW-TSW-001 / Q9-07 provides the Tax Support Worker inside the Capital Factory.

The Tax Support Worker prepares tax-support information from verified financial records. It organises tax-related financial data, maintains tax-support records, generates filing reminders, identifies missing documentation, flags items requiring professional review, and produces machine-readable Tax Support Reports for Pillow and the Grand King. Reports are consumable by Q9-08 (Investment Planning Worker). It integrates with Capital Factory Core (Q9-01), Accounting Worker (Q9-02), Cashflow Worker (Q9-03), Profitability Worker (Q9-05), and Forecasting Worker (Q9-06) exclusively through dependency injection — it never reimplements their orchestration.

The Tax Support Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never provides unvalidated legal or tax advice, never fabricates tax calculations or tax obligations, never submits filings automatically, never replaces accountants or tax professionals, never modifies accounting records, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All income and expense aggregations operate on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper. Verified decimal amounts convert at a single parse boundary only. The worker never applies tax rates, never invents liabilities, and never fabricates obligations from raw ledger balances.

## Tax-support preparation methodology

1. Consume verified Accounting Worker records (and caller-supplied verified transactions). Ledger lines become tax-support transactions only when they already carry a verified `taxSupportCategory` — categories are never inferred from untagged debit/credit alone.
2. Consume Cashflow, Profitability, and Forecasting reports for traceability/context only — never as fabricated tax substrates.
3. Organise tax-support records for a business and reporting period.
4. Prepare factual income and expense summaries by summing verified tagged amounts — clearly labelled `recordKind: factual_financial_record`.
5. Prepare tax-category summaries for extension (including recorded withholding/provision tags when present in verified evidence).
6. Track supporting documents and detect missing required document kinds as support signals only.
7. Generate filing-reminder schedules from period-end offsets — labelled `signalKind: filing_reminder_schedule`, `isAdvice: false`, `isFilingInstruction: false`.
8. Flag professional-review items (missing docs, multi-currency, high-value transactions, jurisdiction extension points) without giving advice.
9. Preserve historical Tax Support Reports and submit through the Executive Reporting Runtime under Grand King / Pillow approval boundaries.
10. Expose a Q9-08 consumable contract rather than implementing Q9-08.

## Integrations

- Capital Factory Core (Q9-01)
- Accounting Worker (Q9-02)
- Cashflow Worker (Q9-03)
- Profitability Worker (Q9-05)
- Forecasting Worker (Q9-06)
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Tax Support Worker:

- DOES prepare tax-support data; organise financial records; generate filing reminders; flag missing documentation; produce Tax Support Reports.
- DOES NOT file taxes.
- DOES NOT replace accountants or tax professionals.
- DOES NOT provide legal or tax advice.
- DOES NOT modify accounting records.
- DOES NOT fabricate tax calculations or obligations.
- DOES NOT submit filings automatically.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-08 or later — it exposes a Q9-08 consumable contract instead.
