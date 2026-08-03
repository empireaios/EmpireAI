# EmpireAI Affiliate Opportunity Worker

PILLOW-AOW-001 / Q8-02 provides the Affiliate Opportunity Worker inside the Affiliate Factory.

The Affiliate Opportunity Worker discovers and evaluates affiliate opportunities from provided evidence (fixtures, sandbox, or cached signals). It identifies programmes, products, niches, commission structures, demand signals and competition, ranks opportunities, and produces machine-readable Affiliate Opportunity Reports consumable by Q8-03 Comparison Site Worker.

The Affiliate Opportunity Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links research to Affiliate Factory Core projects via `affiliateBusinessId` / `affiliateProjectId`.

## Workflow

1. Discover affiliate programmes from evidence (`fixtureProgrammes`).
2. Discover affiliate products from evidence (`fixtureProducts`).
3. Research profitable niches from evidence (`fixtureNiches`).
4. Analyse commission structures (rate, cookie duration, payout frequency) from `fixtureCommissionData` only.
5. Estimate market demand from `fixtureDemandSignals` — unknown when missing; never fabricate.
6. Compare competing opportunities from `fixtureCompetition`.
7. Rank opportunities using observed commission, demand, and competition components only.
8. Identify risks from missing evidence, low commissions, or high competition bands.
9. Recommend high-potential opportunities or return `insufficient_evidence` / `do_not_recommend` when unsupported.
10. Produce an Affiliate Opportunity Report (`AOW-RPT-v1` / `AOW-001-v1`) with `consumableByQ803: true`.
11. Submit findings through the Executive Reporting Runtime and preserve research audit history.

## Integrations

- Affiliate Factory Core
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime (optional)

## Boundaries

The Affiliate Opportunity Worker:

- **does** research programmes, products, niches, commissions, demand, competition, ranking, and recommendations from evidence
- does **not** create affiliate content
- does **not** publish websites
- does **not** join affiliate programmes automatically
- does **not** fabricate commission or demand data
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q8-03 or later

## Evidence discipline

Empty fixtures yield empty/unknown results. Opportunity scores are computed only from observed fields. An empty evidence set never invents programmes, commissions, demand volumes, or rankings.
