# EmpireAI Financial Reporting Worker

PILLOW-FRW-001 / Q9-09 provides the Financial Reporting Worker inside the Capital Factory.

The Financial Reporting Worker consolidates verified upstream financial snapshots from Accounting, Cashflow, Budget, Profitability, Forecasting, Tax Support, and Investment Planning workers into executive dashboards, enterprise KPIs, and machine-readable Financial Reports for Pillow and the Grand King. Reports are consumable by Q9-10 and later workers through the Q910 consumable contract. It integrates with Capital Factory Core (Q9-01) through Investment Planning Worker (Q9-08) exclusively through dependency injection — it never reimplements their orchestration.

The Financial Reporting Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never executes financial transactions, never approves financial decisions, never modifies accounting records, never fabricates financial figures, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All financial amounts operate on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper. Verified decimal amounts convert at a single parse boundary only. Summaries are built exclusively from caller-supplied verified snapshot blocks or injected upstream report fields that are present — never fabricated.

## Financial reporting methodology

1. Consume verified Accounting, Cashflow, Budget, Profitability, Forecasting, Tax Support, and Investment Planning reports for traceability only.
2. Accept caller-supplied verified snapshot blocks with documented sourceRefs for each financial domain.
3. Consolidate each summary deterministically — missing sources remain unavailable rather than zero-filled as facts.
4. Distinguish factual measured data from projected forecast and investment ROI projections via recordKind.
5. Compute enterprise KPIs from available factual summaries only.
6. Build executive dashboard widgets from available summaries.
7. Produce consolidated Financial Reports with complete traceability and submit through the Executive Reporting Runtime under Grand King / Pillow approval boundaries.
8. Expose a Q9-10 consumable contract rather than implementing Q9-10.

## Integrations

- Capital Factory Core (Q9-01)
- Accounting Worker (Q9-02)
- Cashflow Worker (Q9-03)
- Budget Planning Worker (Q9-04)
- Profitability Worker (Q9-05)
- Forecasting Worker (Q9-06)
- Tax Support Worker (Q9-07)
- Investment Planning Worker (Q9-08)
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Financial Reporting Worker:

- DOES consolidate verified financial snapshots; generate executive dashboards; compute enterprise KPIs; produce Financial Reports.
- DOES NOT execute financial transactions.
- DOES NOT approve financial decisions.
- DOES NOT modify accounting records.
- DOES NOT fabricate financial figures.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-10 or later — it exposes a Q9-10 consumable contract instead.
