# EmpireAI Budget Planning Worker

PILLOW-BPW-001 / Q9-04 provides the Budget Planning Worker inside the Capital Factory.

The Budget Planning Worker is the real budget-creation and budget-utilisation tracking layer for EmpireAI businesses. It creates project, business, advertising, infrastructure, department, and marketing budgets from explicit planned amounts, tracks budget utilisation and remaining budget deterministically, detects overspending, underutilisation, and depletion risk purely from injected or dependency-sourced verified actual-expenditure evidence — never fabricated — compares actual spend against planned budgets, recommends evidence-based budget adjustments, and produces machine-readable Budget Planning Reports consumable by Q9-05 (Profitability Worker) and later capital workers. It integrates with the Q9-01 Capital Factory Core, Q9-02 Accounting Worker, and Q9-03 Cashflow Worker exclusively through dependency injection — it never reimplements their orchestration.

The Budget Planning Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates budget values or spending data, never approves expenditure, never executes payments, never forecasts revenue, never replaces the Profitability Worker, never modifies accounting records, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All budget arithmetic — planned amounts, actual expenditure, remaining budget, variance amounts, and utilisation/variance percentages — is performed on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper (`add`/`sub`/`compare`/`equals`). Verified decimal amounts are converted to minor units at a single, explicit parse boundary (`moneyFromDecimal`) — the only point at which rounding is ever applied. Utilisation and variance percentages are derived exclusively from integer basis points (`(numerator*10000)/denominator`, floored, then divided by 100 for display) — never from a floating-point multiplication of two money amounts. Decimal display values are derived strictly for report presentation and are never fed back into further money math.

## Workflow

1. Create budgets — project, business, advertising, infrastructure, department, or marketing — from explicit planned amounts and an explicit budget category and period. Planned amounts are never invented: when none is supplied for a brand-new budget, the planned amount is recorded as zero and flagged as an outstanding issue rather than fabricated.
2. Resolve actual expenditure exclusively from injected verified spending actuals (`spendingActuals`), a directly supplied verified amount, or dependency-injected Accounting/Cashflow Worker evidence. When no actual-expenditure evidence exists, actual expenditure is recorded as zero and surfaced as an outstanding issue — never fabricated.
3. Compute remaining budget (`planned − actual`), variance amount (`actual − planned`, positive = overspend), and budget utilisation percentage and variance percentage from integer basis points only.
4. Track budget utilisation and refresh computed fields whenever new verified actual-expenditure evidence becomes available.
5. Detect budget overruns (overspending, depletion risk at/above a configurable utilisation threshold), underutilised budgets (underspending below a configurable threshold), expenditure spikes (when historical actuals are available), and cross-budget category/period variance and statistically significant deviations across a scope.
6. Compare actual spend against budget at the individual-budget and cross-budget scope level.
7. Recommend budget adjustments (increase, decrease, reallocate, monitor, freeze, investigate) derived exclusively from variance findings — never invents spending or approves the recommended action.
8. Preserve an append-only revision history whenever a budget's planned amount, category, or period changes — budgets are never silently overwritten.
9. Produce Budget Planning Reports (`BPW-RPT-v1` / `BPW-001-v1`) with `consumableByQ905: true`, preserving complete traceability and historical budget revisions.
10. Submit findings through the Executive Reporting Runtime.

## Integrations

- Capital Factory Core (Q9-01) — dependency injection only
- Accounting Worker (Q9-02) — dependency injection only
- Cashflow Worker (Q9-03) — dependency injection only
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Budget Planning Worker:

- DOES create and revise real budgets from explicit planned amounts, track utilisation, and produce deterministic variance findings, adjustment recommendations, and Budget Planning Reports.
- DOES NOT fabricate budget values or spending data — planned and actual amounts are never invented; missing evidence is recorded as zero and flagged, never assumed.
- DOES NOT approve expenditure or execute payments.
- DOES NOT forecast revenue or calculate complete business profitability.
- DOES NOT replace the Profitability Worker.
- DOES NOT modify accounting records — the Accounting Worker's ledger is immutable and read-only from the Budget Planning Worker's perspective.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-05 or later — it exposes a Q9-05 consumable contract instead.
