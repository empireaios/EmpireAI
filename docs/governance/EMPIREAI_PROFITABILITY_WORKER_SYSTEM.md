# EmpireAI Profitability Worker

PILLOW-PRFW-001 / Q9-05 provides the Profitability Worker inside the Capital Factory.

The Profitability Worker is the real gross/operating/net profit calculation layer for EmpireAI businesses. It consumes verified, already-categorised profit-and-loss line items (`FinancialLineItem`) — plus verified Q9-02 Accounting Worker, Q9-03 Cashflow Worker, and Q9-04 Budget Planning Worker records consumed for traceability and context only — to calculate real gross profit, operating profit, and net profit; allocate real shared operational cost pools proportionally by net-revenue weight; analyse profitability by business, product, and project; identify evidence-based profit and loss drivers; rank scopes by net profit; and produce machine-readable Profitability Reports consumable by Q9-06 (Forecasting Worker) and later capital workers. It integrates with the Q9-01 Capital Factory Core, Q9-02 Accounting Worker, Q9-03 Cashflow Worker, and Q9-04 Budget Planning Worker exclusively through dependency injection — it never reimplements their orchestration.

The Profitability Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates revenue, cost, fee, refund, or profitability figures, never forecasts future profitability, never approves spending, never executes financial transactions, never replaces the Forecasting Worker, never modifies accounting records, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All profitability arithmetic — revenue, discounts, refunds, cost of goods sold, operating expenses, advertising costs, platform/payment fees, tax provisions, shared-cost allocations, and gross/operating/net profit — is performed on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper (`add`/`sub`/`compare`/`equals`/`sum`). Verified decimal amounts are converted to minor units at a single, explicit parse boundary (`moneyFromDecimal`) — the only point at which rounding is ever applied. Gross, operating, and net margin percentages are derived exclusively from integer basis points (`(|profit|*10000)/|netRevenue|`, floored, then divided by 100 for display, sign following the profit) — never from a floating-point multiplication of two money amounts. Shared operational cost pools are allocated across businesses/projects/products by integer proportional share of net-revenue weight (`floor(pool*weight/totalWeight)`), with any leftover remainder assigned in full, deterministically, to the scope with the largest weight — never split fractionally, never invented. Decimal display values are derived strictly for report presentation and are never fed back into further money math.

## Financial line items — the sole substrate for profit-and-loss math

The Profitability Worker never infers a chart-of-accounts category mapping from raw, uncategorised Accounting Worker ledger debit/credit lines. Verified `InjectedAccountingEntry`/`InjectedLedgerLine` records (Q9-02), `InjectedCashflowReport` summaries (Q9-03), and `InjectedBudgetReport` summaries (Q9-04) are consumed and preserved purely for traceability and contextual evidence. The sole authoritative substrate for revenue, discount, refund, cost-of-goods-sold, operating-expense, advertising, platform-fee, payment-fee, tax, shared-cost, and other profit-and-loss figures is the verified, already-categorised `FinancialLineItem` — supplied directly by the caller or an upstream integration that has already resolved the real category. Every `FinancialLineItem` carries a `realised: true|false` flag set exclusively by its verified source (never invented or altered by the Profitability Worker) so that estimated figures are always visibly distinguishable from confirmed ones in every downstream breakdown, analysis, and report.

## Workflow

1. Consume verified Accounting Worker entries, Cashflow Worker reports, and Budget Planning Worker reports — recorded for traceability and context; never itself a source of profit-and-loss figures.
2. Aggregate real revenue (`grossRevenue`), discounts, and refunds from verified financial line items; `netRevenue = grossRevenue − discounts − refunds`.
3. Aggregate real cost of goods sold; `grossProfit = netRevenue − cogs`.
4. Aggregate real operating expenses, advertising costs, platform fees, and payment fees, plus any allocated shared operational costs; `operatingProfit = grossProfit − opex − advertising − platformFees − paymentFees − sharedCostAllocation`.
5. Resolve the tax provision strictly from realised `tax` category line items when present; only when none exist, and only when the caller explicitly supplies a positive `taxRateBps`, is a tax amount derived from that rate applied to a positive operating profit — the rate used is always the caller's own input, never a silently-invented default; when neither exists, tax is recorded as zero and flagged as an outstanding issue. `netProfit = operatingProfit − taxProvisions`.
6. Compute gross/operating/net margin percentages exclusively from integer basis points relative to net revenue.
7. Allocate real shared operational cost pools deterministically across businesses/products/projects present in the verified data by proportional net-revenue weight, with any rounding remainder assigned to the largest-weight scope.
8. Analyse profitability by business, by product, and by project — one identified, evidence-based `ProfitabilityAnalysis` per real scope value present in the data; never invents a scope that has no verified line items.
9. Identify profit drivers (largest positive category contributions to net profit) and loss drivers (largest negative category contributions) purely from verified category totals — never invented.
10. Rank scopes by net profit, descending, deterministically (ties broken by ascending scope identifier).
11. Produce Profitability Reports (`PRFW-RPT-v1` / `PRFW-001-v1`) with `consumableByQ906: true`, preserving complete traceability and historical Profitability Reports, clearly distinguishing realised from estimated figures throughout.
12. Submit reports through the Executive Reporting Runtime.

## Integrations

- Capital Factory Core (Q9-01) — dependency injection only
- Accounting Worker (Q9-02) — dependency injection only
- Cashflow Worker (Q9-03) — dependency injection only
- Budget Planning Worker (Q9-04) — dependency injection only
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Profitability Worker:

- DOES calculate real gross, operating, and net profit from verified, already-categorised financial line items; allocate real shared operational costs; analyse profitability by business/product/project; identify evidence-based profit/loss drivers; rank scopes by net profit; and produce deterministic Profitability Reports.
- DOES NOT fabricate revenue, cost, fee, refund, or profitability figures — every figure traces to a verified, already-categorised `FinancialLineItem`; missing evidence is recorded as zero and flagged, never assumed or invented.
- DOES NOT forecast future profitability — it reports on real, already-realised (or explicitly source-flagged estimated) periods only.
- DOES NOT approve spending or execute financial transactions.
- DOES NOT replace the Forecasting Worker.
- DOES NOT modify accounting records — the Accounting Worker's ledger is immutable and read-only from the Profitability Worker's perspective.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-06 or later — it exposes a Q9-06 consumable contract instead.
