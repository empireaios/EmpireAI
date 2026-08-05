# EmpireAI Investment Planning Worker

PILLOW-IPW-001 / Q9-08 provides the Investment Planning Worker inside the Capital Factory.

The Investment Planning Worker evaluates caller-supplied investment opportunities, compares alternatives, ranks them deterministically by score, assesses risks, and produces capital allocation recommendations and machine-readable Investment Planning Reports for Pillow and the Grand King. Reports are consumable by Q9-09 and later workers through the Q909 consumable contract. It integrates with Capital Factory Core (Q9-01), Accounting Worker (Q9-02), Cashflow Worker (Q9-03), Budget Planning Worker (Q9-04), Profitability Worker (Q9-05), Forecasting Worker (Q9-06), and Tax Support Worker (Q9-07) exclusively through dependency injection — it never reimplements their orchestration.

The Investment Planning Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never executes investments, never approves investments, never moves or allocates capital, never modifies accounting records, never fabricates ROI or payback or recommendations, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All capital amounts operate on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper. Verified decimal amounts convert at a single parse boundary only. Available capital is taken from measured cashflow closing balance or net position when present, or from caller-supplied measured context — never fabricated.

## Investment planning methodology

1. Consume verified Accounting, Cashflow, Budget, Profitability, Forecasting, and Tax Support reports for traceability and measured capital context only.
2. Accept caller-supplied investment opportunities with documented evidence refs and assumptions for any projections.
3. Score each opportunity deterministically using caller-supplied ROI, strategic alignment, payback, and risk basis points — with optional projected_derived payback from caller ROI only when payback was not supplied.
4. Rank opportunities by score (descending), then opportunityId (ascending) for stability.
5. Generate capital allocation recommendations via greedy ranking within available measured capital — recommendation signals only, never execution.
6. Assess risks structurally from caller-supplied risk scores.
7. Preserve historical Investment Planning Reports and submit through the Executive Reporting Runtime under Grand King / Pillow approval boundaries.
8. Expose a Q9-09 consumable contract rather than implementing Q9-09.

## Integrations

- Capital Factory Core (Q9-01)
- Accounting Worker (Q9-02)
- Cashflow Worker (Q9-03)
- Budget Planning Worker (Q9-04)
- Profitability Worker (Q9-05)
- Forecasting Worker (Q9-06)
- Tax Support Worker (Q9-07)
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Investment Planning Worker:

- DOES evaluate investment opportunities; compare alternatives; rank by score; assess risks; produce Investment Planning Reports and capital allocation recommendations.
- DOES NOT execute investments.
- DOES NOT approve investments.
- DOES NOT move or allocate capital.
- DOES NOT modify accounting records.
- DOES NOT fabricate ROI, payback, or recommendations.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-09 or later — it exposes a Q9-09 consumable contract instead.
