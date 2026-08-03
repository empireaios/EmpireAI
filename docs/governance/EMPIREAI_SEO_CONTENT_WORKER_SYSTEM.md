# EmpireAI SEO Content Worker

PILLOW-SEOW-001 / Q8-05 provides the SEO Content Worker inside the Affiliate Factory.

The SEO Content Worker produces search-engine-optimized affiliate content assets from approved Affiliate Opportunity Reports and Review Content Reports. It generates SEO content plans, article briefs, long-form SEO articles, keyword mapping, and internal linking recommendations while evaluating content completeness and preserving version history. It emits machine-readable SEO Content Reports consumable by Q8-06 Email Funnel Worker.

The SEO Content Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never publishes articles, never manipulates search rankings, and never fabricates SEO performance claims.

## Workflow

1. Consume Affiliate Opportunity Reports (from Q8-02).
2. Consume Review Content Reports (`consumableByQ805` packages from Q8-04).
3. Generate SEO content plans (clusters, pillar pages, supporting articles).
4. Generate keyword mapping and search intent mapping from evidenced seeds/topics.
5. Generate article briefs (outline, meta title/description, FAQ prompts).
6. Generate SEO-optimized structural articles with heading structure.
7. Generate internal linking recommendations within the content cluster.
8. Evaluate content completeness (structural presence only — no ranking claims).
9. Maintain content version history.
10. Produce an SEO Content Report (`SEOW-RPT-v1` / `SEOW-001-v1`) with `consumableByQ806: true`.
11. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Affiliate Factory Core
- Affiliate Opportunity Worker
- Comparison Site Worker
- Review Content Worker
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime (optional)

## Boundaries

The SEO Content Worker:

- **does** create SEO content plans, briefs, articles, keyword maps, internal links, and SEO Content Reports from evidence
- does **not** publish articles
- does **not** manipulate search rankings
- does **not** fabricate SEO performance claims (traffic, rankings, CTR)
- does **not** replace Analytics Worker
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q8-06 or later

## Evidence discipline

Keyword and topic seeds come from fixtures or derived opportunity/review fields. Completeness scoring reflects structural asset presence only. An empty evidence set never invents performance metrics or ranking outcomes.
