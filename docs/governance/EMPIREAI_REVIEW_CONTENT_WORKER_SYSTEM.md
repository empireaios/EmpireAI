# EmpireAI Review Content Worker

PILLOW-RCW-001 / Q8-04 provides the Review Content Worker inside the Affiliate Factory.

The Review Content Worker produces structured affiliate review content from verified Affiliate Opportunity Reports and Comparison Site Reports. It generates balanced review articles, pros and cons, alternatives, buying recommendations, ideal customer profiles, and limitation/trade-off sections while preserving supporting evidence and review version history. It emits machine-readable Review Content Reports consumable by Q8-05 SEO Content Worker.

The Review Content Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never publishes websites and never fabricates reviews, ratings, or product information.

## Workflow

1. Consume Affiliate Opportunity Reports (`consumableByQ803` packages from Q8-02).
2. Consume Comparison Site Reports (`consumableByQ804` packages from Q8-03).
3. Generate structured product/service review articles.
4. Generate pros and cons from evidenced fixture/comparison fields only.
5. Recommend suitable alternatives from comparison/fixture peers.
6. Produce buying recommendations (buy / buy_with_conditions / consider_alternatives / insufficient_evidence).
7. Explain ideal customer profiles from best-for and feature evidence.
8. Highlight limitations and trade-offs.
9. Preserve supporting evidence and maintain review version history.
10. Produce a Review Content Report (`RCW-RPT-v1` / `RCW-001-v1`) with `consumableByQ805: true`.
11. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Affiliate Factory Core
- Affiliate Opportunity Worker
- Comparison Site Worker
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime (optional)

## Boundaries

The Review Content Worker:

- **does** create review content, pros/cons, alternatives, buying recommendations, and Review Content Reports from evidence
- does **not** publish websites
- does **not** fabricate reviews, ratings, or product information
- does **not** manipulate ratings
- does **not** replace Comparison Site Worker
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q8-05 or later

## Evidence discipline

Empty fixtures yield insufficient_evidence verdicts and unknown/placeholder evidence markers. Pros, cons, alternatives, and recommendations are derived only from observed fields. An empty evidence set never invents product claims or ratings.
