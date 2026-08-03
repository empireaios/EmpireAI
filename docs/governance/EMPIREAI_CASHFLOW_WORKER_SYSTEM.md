# EmpireAI Cashflow Worker

PILLOW-CFW-001 / Q9-03 provides the Cashflow Worker inside the Capital Factory.

The Cashflow Worker is the real cash-inflow and cash-outflow tracking layer for EmpireAI businesses. It consumes exclusively verified, immutable Accounting Worker (Q9-02) journal entries — injected directly or fetched through dependency injection — and never fabricates a balance or a flow. It tracks cash inflows and cash outflows, keeps internal account-to-account transfers separate from enterprise income/expense, maintains opening and closing cash balances, produces deterministic daily, weekly, monthly, annual, and custom cashflow views at account, business, factory, and enterprise scope, surfaces unreconciled movements rather than silently excluding them, compares periods, and produces machine-readable Cashflow Reports consumable by Q9-04 (Budget Planning Worker) and later capital workers. It integrates with the Q9-01 Capital Factory Core and Q9-02 Accounting Worker exclusively through dependency injection — it never reimplements their orchestration.

The Cashflow Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates balances or flows, never creates budgets, never forecasts future cashflow, never calculates complete business profitability, never approves spending, never moves money, never modifies verified accounting records, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All cashflow arithmetic is performed on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper (`add`/`sub`/`compare`/`equals`). Verified accounting decimal amounts are converted to minor units at a single, explicit parse boundary (`moneyFromDecimal`) — the only point at which rounding is ever applied. No cashflow total is ever computed with floating-point multiplication or division; decimal display values are derived strictly for report presentation and are never fed back into further money math.

## Workflow

1. Consume verified Accounting Worker (Q9-02) journal entries only — never fabricated, never invented. Entries with no accounting records available fail validation rather than substituting invented movements.
2. Classify each verified entry into real cash movements: `income` → inflow (cash debit side), `expense` → outflow (cash credit side), `transfer` → paired `transfer_in`/`transfer_out` movements that are never counted as enterprise income or expense. Any entry type the Cashflow Worker cannot classify with certainty is surfaced as a `pending` movement and an outstanding issue — never silently dropped, never assumed reconciled.
3. Track cash inflows and cash outflows per account, business, factory, or consolidated enterprise scope.
4. Maintain opening and closing cash balances deterministically: opening comes from the prior period's closing balance or an explicitly supplied opening balance — it is never invented. Closing = opening + inflows − outflows (+ net transfers at account scope; transfers net to zero for enterprise-level income/expense).
5. Track restricted/reserved cash from injected input only; unknown restricted cash is recorded as zero and flagged, never fabricated. Available cash = closing − restricted.
6. Produce deterministic reporting-period boundaries: daily (calendar day, UTC), weekly (ISO week, Monday–Sunday, UTC), monthly (calendar month), annual (calendar year), and custom (explicit period start/end required).
7. Identify unreconciled (pending/disputed) movements and surface them in every view and report rather than excluding them from totals silently.
8. Compare periods (period-over-period net cashflow change) when a prior period view exists.
9. Produce Cashflow Reports (`CFW-RPT-v1` / `CFW-001-v1`) with `consumableByQ904: true`, preserving complete traceability and historical reports.
10. Submit findings through the Executive Reporting Runtime.

## Integrations

- Capital Factory Core (Q9-01) — dependency injection only
- Accounting Worker (Q9-02) — dependency injection only; sole source of verified cash records
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Cashflow Worker:

- DOES track real cash inflows and outflows derived only from verified Accounting Worker records.
- DOES maintain opening/closing balances, produce deterministic cashflow views and reports, and surface unreconciled movements.
- DOES NOT fabricate balances or flows — amounts are never invented; missing accounting records fail validation.
- DOES NOT create budgets or forecast future cashflow.
- DOES NOT calculate complete business profitability.
- DOES NOT approve spending or move money.
- DOES NOT modify verified accounting records — the Accounting Worker's ledger is immutable and read-only from the Cashflow Worker's perspective.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-04 or later — it exposes a Q9-04 consumable contract instead.
