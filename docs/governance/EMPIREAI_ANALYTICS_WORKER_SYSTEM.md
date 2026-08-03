# EmpireAI Analytics Worker

PILLOW-ANW-001 / Q8-07 provides the Analytics Worker inside the Affiliate Factory.

The Analytics Worker measures operational and commercial performance of Affiliate Factory businesses. It consolidates evidenced affiliate metrics (clicks, conversions, commissions, revenue, SEO, and funnel performance), analyses trends and anomalies, recommends optimisation opportunities, preserves historical analytics, and emits machine-readable Analytics Reports consumable by Q8-08 Affiliate Compliance Worker.

The Analytics Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates analytics results, never modifies live campaigns automatically, and never manipulates metrics.

## Workflow

1. Collect affiliate performance metrics from verified metric snapshots and upstream reports.
2. Track clicks (and CTR when impressions evidenced).
3. Track conversions (and conversion rate when clicks evidenced).
4. Track commissions, EPC, and revenue summaries.
5. Track SEO performance (organic sessions, ranks, keyword counts, content completeness).
6. Analyse email funnel performance from Email Funnel Worker packages + funnel metrics.
7. Detect trends and anomalies vs prior-period evidence.
8. Recommend optimisation opportunities without executing changes.
9. Preserve historical analytics entries across reports.
10. Produce an Analytics Report (`ANW-RPT-v1` / `ANW-001-v1`) with `consumableByQ808: true`.
11. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Affiliate Factory Core
- Affiliate Opportunity Worker
- Comparison Site Worker
- Review Content Worker
- SEO Content Worker
- Email Funnel Worker
- Executive Reporting Runtime
- Audit Runtime
- Worker Registry
- Worker Lifecycle
- Worker Recovery System

## Boundaries

The Analytics Worker:

- **does** measure affiliate performance, analyse KPIs, recommend improvements, and produce Analytics Reports
- does **not** modify campaigns automatically
- does **not** manipulate analytics
- does **not** fabricate analytics or performance results
- does **not** replace Affiliate Compliance Worker
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q8-08 or later

## Evidence discipline

Null metrics mean not evidenced. Rates (CTR, conversion rate, EPC, funnel completion) are computed only from observed numerators/denominators. Empty snapshots never invent traffic, conversions, commissions, rankings, or open rates.
