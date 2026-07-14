import type { CommerceIntelligenceReport } from "../commerce-intelligence/types.js";
import type { CommerceOperatingModel } from "../commerce-operating-model/types.js";
import type { BusinessAutomationArchitecture } from "../business-automation/types.js";
import {
  INTELLIGENCE_PIPELINE,
  INTELLIGENCE_PRINCIPLES,
  INTELLIGENCE_CAPABILITIES,
  RECOMMENDATION_DOMAINS,
} from "./paths.js";
import type {
  CommercialIntelligenceArchitecture,
  CommercialInsight,
  IntelligencePipelinePhase,
  InsightClassification,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function insight(input: {
  id: string;
  classification: InsightClassification;
  title: string;
  why: string;
  what: string;
  how: string;
  proof: string;
  confidencePercent: number;
  businessImpact: string;
  domain: string;
}): CommercialInsight {
  const confidenceLabel =
    input.confidencePercent >= 80 ? "high" : input.confidencePercent >= 60 ? "medium" : "low";
  return { ...input, confidenceLabel };
}

function buildPipeline(activePhase: IntelligencePipelinePhase = "recommendation_generation") {
  const activeIdx = INTELLIGENCE_PIPELINE.indexOf(activePhase);
  return INTELLIGENCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function insightsFromReport(report: CommerceIntelligenceReport): {
  opportunities: CommercialInsight[];
  risks: CommercialInsight[];
  recommendations: CommercialInsight[];
  all: CommercialInsight[];
} {
  const opportunities: CommercialInsight[] = [];
  const risks: CommercialInsight[] = [];
  const recommendations: CommercialInsight[] = [];

  for (const w of report.recommendedProducts.slice(0, 5)) {
    opportunities.push(
      insight({
        id: `opp-product-${w.product.id}`,
        classification: "opportunity",
        title: `Winning product: ${w.product.name}`,
        why: w.evaluation.rationale,
        what: `Launch ${w.product.name} with ${w.product.profitMarginPercent}% margin target`,
        how: "Business Factory → Commerce → Automation pipeline",
        proof: `Composite score ${w.compositeScore} · demand ${w.product.demandScore}`,
        confidencePercent: Math.min(95, w.compositeScore),
        businessImpact: `Revenue growth via ${w.product.category} category`,
        domain: "winning_products",
      }),
    );
  }

  for (const m of report.marketOpportunities.slice(0, 3)) {
    opportunities.push(
      insight({
        id: `opp-market-${m.market.id}`,
        classification: "market_shift",
        title: `Market: ${m.market.name}`,
        why: m.recommendation,
        what: `Expand to ${m.market.name} (${m.market.country})`,
        how: "Marketplace Integration · supplier routing",
        proof: `Opportunity score ${m.opportunityScore} · growth ${m.market.growthPercent}%`,
        confidencePercent: Math.min(90, m.opportunityScore),
        businessImpact: "Geographic and category expansion",
        domain: "marketplace_expansion",
      }),
    );
  }

  for (const c of report.competitorThreats.filter((t) => t.threatLevel !== "low").slice(0, 3)) {
    risks.push(
      insight({
        id: `risk-comp-${c.competitor.id}`,
        classification: "risk",
        title: `Competitor: ${c.competitor.name}`,
        why: `${c.threatLevel} threat in category`,
        what: c.competitiveAdvantage[0] ?? "Monitor competitive positioning",
        how: "Differentiate brand · improve reviews · adjust pricing",
        proof: `Threat level ${c.threatLevel}`,
        confidencePercent: c.threatLevel === "high" ? 85 : 70,
        businessImpact: "Margin and conversion pressure if unaddressed",
        domain: "risk_reduction",
      }),
    );
  }

  if (report.riskAssessment) {
    risks.push(
      insight({
        id: "risk-assessment",
        classification: "warning",
        title: "Portfolio risk assessment",
        why: report.riskAssessment,
        what: "Review supplier concentration and competitive threats",
        how: "Pillow continuous monitoring · Grand King approval on expansion",
        proof: "Commerce Intelligence analysis pipeline",
        confidencePercent: 75,
        businessImpact: "Protects profitability and launch success",
        domain: "risk_reduction",
      }),
    );
  }

  for (const action of report.recommendedActions.slice(0, 6)) {
    recommendations.push(
      insight({
        id: `rec-${action.slice(0, 24)}`,
        classification: "recommendation",
        title: action.slice(0, 80),
        why: "Constitutional commercial intelligence recommendation",
        what: action,
        how: "ECC schedules · Supervisor validates · Automation executes when approved",
        proof: report.executiveBrief.slice(0, 120),
        confidencePercent: 78,
        businessImpact: "Improves business performance and growth",
        domain: "revenue_growth",
      }),
    );
  }

  const supplier = report.supplierRankings.find((s) => s.preferred);
  if (supplier) {
    recommendations.push(
      insight({
        id: `rec-supplier-${supplier.supplier.id}`,
        classification: "recommendation",
        title: `Preferred supplier: ${supplier.supplier.name}`,
        why: supplier.strengths.join("; "),
        what: "Route fulfilment through preferred supplier tier",
        how: "Supplier sync automation · Guardian health check",
        proof: `Composite score ${supplier.compositeScore}/100`,
        confidencePercent: supplier.compositeScore,
        businessImpact: "Reliability and margin optimisation",
        domain: "supplier_selection",
      }),
    );
  }

  const all = [...opportunities, ...risks, ...recommendations];
  return { opportunities, risks, recommendations, all };
}

export function assembleCommercialIntelligenceArchitecture(input: {
  report?: CommerceIntelligenceReport | null;
  commerce?: CommerceOperatingModel | null;
  automation?: BusinessAutomationArchitecture | null;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
}): CommercialIntelligenceArchitecture {
  const report = input.report;
  const commerce = input.commerce;
  const automation = input.automation;
  const guardian = input.guardian ?? {};

  const insightBundle = report
    ? insightsFromReport(report)
    : { opportunities: [], risks: [], recommendations: [], all: [] };

  const winningProducts =
    report?.recommendedProducts.slice(0, 8).map((w) => ({
      productId: w.product.id,
      name: w.product.name,
      score: w.compositeScore,
      marginPercent: w.product.profitMarginPercent,
      rationale: w.evaluation.rationale,
    })) ?? [];

  const revenueTrends = [
    commerce?.revenueSummary ?? "Pre-revenue pipeline",
    ...(commerce?.pillow.revenueTrends ?? []),
    report ? `${report.recommendedProducts.length} products above threshold` : "Awaiting analysis",
  ];

  const profitTrends = [
    commerce?.profitSummary ?? "Pre-profit",
    ...(commerce?.pillow.profitTrends ?? []),
    winningProducts[0] ? `Top margin: ${winningProducts[0].marginPercent}%` : "Run product intelligence",
  ];

  const growthTrends = [
    ...(commerce?.growthTrends ?? []),
    ...(commerce?.pillow.growthOpportunities ?? []),
    automation ? `Automation: ${automation.automationLevel}` : "Automation standby",
  ];

  const pillow: CommercialIntelligenceArchitecture["pillow"] = {
    commercialTrends: report
      ? report.marketOpportunities.slice(0, 3).map((m) => `${m.market.name}: ${m.market.growthPercent}% growth`)
      : ["Awaiting commerce intelligence run"],
    businessOpportunities: insightBundle.opportunities.map((o) => o.title),
    revenueGrowth: revenueTrends.slice(0, 3),
    competitivePosition: report
      ? report.competitorThreats.slice(0, 3).map((c) => `${c.competitor.name}: ${c.threatLevel} threat`)
      : [],
    automationOpportunities: automation?.pillow.recommendations ?? [],
    strategicRecommendations: report?.recommendedActions ?? ["Run analyzeCommerce() for live intelligence"],
  };

  return {
    architectureVersion: "P8-05",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      report?.executiveBrief ??
      commerce?.grandKingSummary ??
      "Commercial Intelligence — evidence-backed decisions for every manufactured business",
    businessHealth: commerce?.commerceHealth ?? "building",
    revenueTrends,
    profitTrends,
    growthTrends,
    winningProducts,
    currentOpportunities: insightBundle.opportunities,
    currentRisks: insightBundle.risks,
    recommendations: insightBundle.recommendations,
    insights: insightBundle.all.slice(0, 20),
    pipeline: buildPipeline(report ? "recommendation_generation" : "business_analysis"),
    principles: [...INTELLIGENCE_PRINCIPLES],
    capabilities: [...INTELLIGENCE_CAPABILITIES],
    recommendationDomains: [...RECOMMENDATION_DOMAINS],
    pillow,
    integrations: {
      factoryStage: commerce?.factoryIntegration.factoryStage ?? "—",
      commerceHealth: commerce?.commerceHealth ?? "—",
      automationLevel: automation?.automationLevel ?? "—",
      intelligenceEngine: report ? "PILLOW-CI-001 active" : "Standby",
    },
  };
}

export function buildFallbackCommercialIntelligenceArchitecture(): CommercialIntelligenceArchitecture {
  return assembleCommercialIntelligenceArchitecture({
    commerce: null,
    report: null,
  });
}
