import type {
  CommerceIntelligenceReport,
  CompetitorAnalysis,
  MarketAnalysis,
  SupplierRanking,
  WinningProductScore,
  BusinessLaunchPlan,
} from "./types.js";

export function buildCommerceIntelligenceReport(input: {
  winners: WinningProductScore[];
  supplierRankings: SupplierRanking[];
  marketOpportunities: MarketAnalysis[];
  competitorThreats: CompetitorAnalysis[];
  launchPlans: BusinessLaunchPlan[];
  qualityThreshold: number;
}): CommerceIntelligenceReport {
  const highThreats = input.competitorThreats.filter((c) => c.threatLevel === "high");
  const riskAssessment =
    highThreats.length > 0
      ? `${highThreats.length} high-threat competitor(s) — differentiate on brand and reviews`
      : "Competitive landscape manageable for recommended products";

  const recommendedActions: string[] = [];
  if (input.winners.length > 0) {
    recommendedActions.push(`Launch top product: ${input.winners[0]!.product.name} (score ${input.winners[0]!.compositeScore})`);
  }
  if (input.supplierRankings[0]?.preferred) {
    recommendedActions.push(`Preferred supplier: ${input.supplierRankings[0].supplier.name}`);
  }
  if (input.marketOpportunities[0]) {
    recommendedActions.push(`Priority market: ${input.marketOpportunities[0].market.name}`);
  }
  recommendedActions.push("Run CRIR certification before live storefront");
  if (recommendedActions.length === 1) {
    recommendedActions.push("Expand product discovery catalog with live CJ API feed");
  }

  const executiveBrief = formatExecutiveBrief(input, riskAssessment, recommendedActions);

  return {
    version: "PILLOW-CI-001",
    generatedAt: new Date().toISOString(),
    recommendedProducts: input.winners,
    supplierRankings: input.supplierRankings,
    marketOpportunities: input.marketOpportunities,
    competitorThreats: input.competitorThreats,
    launchPlans: input.launchPlans,
    riskAssessment,
    recommendedActions,
    executiveBrief,
  };
}

function formatExecutiveBrief(
  input: {
    winners: WinningProductScore[];
    supplierRankings: SupplierRanking[];
    marketOpportunities: MarketAnalysis[];
    competitorThreats: CompetitorAnalysis[];
    launchPlans: BusinessLaunchPlan[];
    qualityThreshold: number;
  },
  riskAssessment: string,
  recommendedActions: string[],
): string {
  const productLines = input.winners.slice(0, 5).map(
    (w, i) =>
      `${i + 1}. ${w.product.name} — score ${w.compositeScore} · margin ${w.product.profitMarginPercent}% · ${w.evaluation.rationale}`,
  );

  const supplierLines = input.supplierRankings.slice(0, 3).map(
    (s, i) => `${i + 1}. ${s.supplier.name} — ${s.compositeScore}/100${s.preferred ? " ★ preferred" : ""}`,
  );

  const marketLines = input.marketOpportunities.slice(0, 3).map(
    (m) => `- ${m.market.name}: opportunity ${m.opportunityScore} — ${m.recommendation}`,
  );

  const threatLines = input.competitorThreats
    .filter((c) => c.threatLevel !== "low")
    .map((c) => `- ${c.competitor.name} (${c.threatLevel}): ${c.competitiveAdvantage[0]}`);

  const launchLines = input.launchPlans.slice(0, 2).map(
    (l) => `- ${l.storeConcept} — readiness: ${l.launchReadiness}`,
  );

  return [
    "--- Commerce Intelligence Executive (PILLOW-CI-001) ---",
    `Quality threshold: ${input.qualityThreshold}/100`,
    `Recommended products: ${input.winners.length}`,
    "",
    "### Winning Products",
    ...(productLines.length ? productLines : ["- None above threshold"]),
    "",
    "### Supplier Rankings",
    ...supplierLines,
    "",
    "### Market Opportunities",
    ...marketLines,
    "",
    "### Competitor Threats",
    ...(threatLines.length ? threatLines : ["- No elevated threats"]),
    "",
    "### Launch Plans",
    ...launchLines,
    "",
    "### Risk Assessment",
    riskAssessment,
    "",
    "### Recommended Actions",
    ...recommendedActions.map((a) => `- ${a}`),
  ].join("\n");
}

export function formatCommerceReport(report: CommerceIntelligenceReport): string {
  return report.executiveBrief;
}
