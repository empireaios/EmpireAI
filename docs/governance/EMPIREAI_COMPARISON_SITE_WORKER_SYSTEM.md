# EmpireAI Comparison Site Worker

PILLOW-CSW-001 / Q8-03 provides the Comparison Site Worker inside the Affiliate Factory.

The Comparison Site Worker creates high-quality affiliate comparison assets — comparison pages, ranking pages, buyer guides, and evidence-derived comparison tables — from verified Affiliate Opportunity Reports and product fixtures. It produces machine-readable Comparison Site Reports consumable by Q8-04 Review Content Worker.

The Comparison Site Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never publishes websites and never fabricates rankings or product information.

## Workflow

1. Consume Affiliate Opportunity Reports (`consumableByQ803` packages from Q8-02).
2. Generate comparison pages for product/service topics.
3. Generate Top-N product ranking pages with best-for labels when evidenced.
4. Generate buyer guides (buying factors, pros/cons, FAQs).
5. Compare features and specifications in structured tables.
6. Compare pricing and value when price evidence is present (unknown otherwise).
7. Document ranking methodology (observed scores/features/prices only).
8. Produce a Comparison Site Report (`CSW-RPT-v1` / `CSW-001-v1`) with `consumableByQ804: true`.
9. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Affiliate Factory Core
- Affiliate Opportunity Worker
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime (optional)

## Boundaries

The Comparison Site Worker:

- **does** create comparison pages, ranking pages, buyer guides, and Comparison Site Reports from evidence
- does **not** publish websites
- does **not** fabricate rankings or product information
- does **not** manipulate rankings without evidence
- does **not** replace Review Content Worker
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q8-04 or later

## Evidence discipline

Empty fixtures yield empty/unknown cells and structural ranking only. Scores use opportunity ranking and observed feature/price evidence. An empty evidence set never invents products, prices, or rankings.
