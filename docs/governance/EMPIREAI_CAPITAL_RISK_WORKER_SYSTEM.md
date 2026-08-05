# EmpireAI Capital Risk Worker

PILLOW-CAPRW-001 / Q9-10 provides the Capital Risk Worker inside the Capital Factory.

The Capital Risk Worker detects capital risks from verified upstream financial snapshots consumed from Accounting, Cashflow, Budget, Profitability, Forecasting, Tax Support, Investment Planning, and Financial Reporting workers. It produces executive risk summaries, enterprise risk dashboards, and machine-readable Capital Risk Reports for Pillow and the Grand King. Reports are consumable by Q9-11 and later workers through the Q911 consumable contract. It integrates with Capital Factory Core (Q9-01) through Financial Reporting Worker (Q9-09) exclusively through dependency injection — it never reimplements their orchestration.

The Capital Risk Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never approves financial decisions, never executes investments, never moves capital, never modifies accounting records, never fabricates risks or evidence, and never automatically executes mitigation.

## Money model

All financial amounts operate on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper. Risk magnitudes are computed exclusively from caller-supplied verified snapshot blocks that are present — never fabricated.

## Capital risk methodology

1. Consume verified Accounting, Cashflow, Budget, Profitability, Forecasting, Tax Support, Investment Planning, and Financial Reporting reports for traceability only.
2. Accept caller-supplied verified snapshot blocks with documented sourceRefs for each financial domain.
3. Detect risks deterministically from available snapshots — missing sources produce no fabricated risk for that category.
4. Score severity, probability, and impact from verified magnitudes only.
5. Prioritise risks by severity and impact.
6. Build executive risk summaries and enterprise risk dashboards.
7. Produce Capital Risk Reports with complete traceability and submit through the Executive Reporting Runtime under Grand King / Pillow approval boundaries.
8. Expose a Q9-11 consumable contract rather than implementing Q9-11.

## Integrations

- Capital Factory Core (Q9-01)
- Accounting Worker (Q9-02)
- Cashflow Worker (Q9-03)
- Budget Planning Worker (Q9-04)
- Profitability Worker (Q9-05)
- Forecasting Worker (Q9-06)
- Tax Support Worker (Q9-07)
- Investment Planning Worker (Q9-08)
- Financial Reporting Worker (Q9-09)
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Capital Risk Worker:

- DOES detect capital risks; prioritise risks; generate executive risk dashboards; produce Capital Risk Reports.
- DOES NOT approve financial decisions.
- DOES NOT execute investments.
- DOES NOT move or allocate capital.
- DOES NOT modify accounting records.
- DOES NOT fabricate risks or evidence.
- DOES NOT automatically execute mitigation.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-11 or later — it exposes a Q9-11 consumable contract instead.
