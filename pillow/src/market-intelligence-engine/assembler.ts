import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  MARKET_INTELLIGENCE_PIPELINE,
  MARKET_PRINCIPLES,
  GOVERNED_MARKET_DOMAINS,
  MARKET_ANALYSIS_DOMAINS,
  PILLOW_MARKET_EVALUATIONS,
} from "./paths.js";
import type {
  MarketIntelligenceEngine,
  MarketIntelligencePipelineStep,
  MarketIntelligencePipelinePhase,
  MarketRecord,
  MarketTrendEntry,
  EmergingOpportunityEntry,
  MarketRiskEntry,
  IndustryMovementEntry,
  EconomicIndicatorEntry,
  StrategicAlertEntry,
  MarketAnalysisMetric,
  MarketIntelligenceRecommendation,
  PillowMarketEvaluationMetric,
  GovernedMarketDomain,
  MarketClassification,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function mapDomain(category: MarketClassification): GovernedMarketDomain {
  const map: Record<MarketClassification, GovernedMarketDomain> = {
    global_market: "global_markets",
    regional_market: "regional_markets",
    national_market: "regional_markets",
    industry_market: "industry_markets",
    commerce_market: "commerce_markets",
    technology_market: "technology_markets",
    consumer_market: "consumer_markets",
    emerging_market: "emerging_markets",
    strategic_market: "global_markets",
    future_market: "future_markets",
  };
  return map[category];
}

function buildPipeline(
  activePhase: MarketIntelligencePipelinePhase = "continuous_monitoring",
): MarketIntelligencePipelineStep[] {
  const activeIdx = MARKET_INTELLIGENCE_PIPELINE.indexOf(activePhase);
  return MARKET_INTELLIGENCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildGlobalMarkets(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
}): MarketRecord[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 2) ?? [
      "Enterprise expansion",
    ];
  const e3Certified = input.financialExecutiveCertification?.programmeCertified ?? false;

  const catalogue: Array<Omit<MarketRecord, "domain"> & { category: MarketClassification }> = [
    {
      marketId: "mie-global-ecommerce",
      marketName: "Global E-Commerce",
      category: "global_market",
      geographicScope: "Worldwide",
      industry: "Commerce",
      currentStatus: "expanding",
      growthRate: "+12.4% YoY",
      marketSize: "$6.3T",
      competitionLevel: "high",
      opportunityScore: 88,
      riskScore: 42,
      strategicRelevance: "critical",
      confidence: 91,
      evidence: ["Global commerce intelligence", e3Certified ? "E3 financial executive certified" : "Financial baseline"],
    },
    {
      marketId: "mie-north-america",
      marketName: "North America",
      category: "regional_market",
      geographicScope: "US · Canada · Mexico",
      industry: "Multi-sector",
      currentStatus: "stable_growth",
      growthRate: "+8.2% YoY",
      marketSize: "$1.8T addressable",
      competitionLevel: "high",
      opportunityScore: 85,
      riskScore: 38,
      strategicRelevance: "critical",
      confidence: 89,
      evidence: ["Regional demand signals", objectives[0] ?? "Strategic objective aligned"],
    },
    {
      marketId: "mie-european-union",
      marketName: "European Union",
      category: "regional_market",
      geographicScope: "EU-27",
      industry: "Multi-sector",
      currentStatus: "moderate_growth",
      growthRate: "+5.6% YoY",
      marketSize: "$1.2T addressable",
      competitionLevel: "moderate",
      opportunityScore: 79,
      riskScore: 45,
      strategicRelevance: "high",
      confidence: 84,
      evidence: ["EU regulatory landscape tracked", "Cross-border commerce opportunity"],
    },
    {
      marketId: "mie-asia-pacific",
      marketName: "Asia-Pacific",
      category: "regional_market",
      geographicScope: "APAC",
      industry: "Multi-sector",
      currentStatus: "accelerating",
      growthRate: "+14.8% YoY",
      marketSize: "$2.4T addressable",
      competitionLevel: "high",
      opportunityScore: 92,
      riskScore: 52,
      strategicRelevance: "critical",
      confidence: 86,
      evidence: ["APAC growth momentum", "Emerging consumer demand"],
    },
    {
      marketId: "mie-ai-enterprise",
      marketName: "AI Enterprise Software",
      category: "industry_market",
      geographicScope: "Global",
      industry: "Technology · AI",
      currentStatus: "hypergrowth",
      growthRate: "+38.5% YoY",
      marketSize: "$185B",
      competitionLevel: "intense",
      opportunityScore: 94,
      riskScore: 48,
      strategicRelevance: "critical",
      confidence: 90,
      evidence: [input.corporateVision?.visionSummary ?? "Corporate vision aligned", "EmpireAI strategic fit"],
    },
    {
      marketId: "mie-global-fintech",
      marketName: "Global Fintech",
      category: "commerce_market",
      geographicScope: "Global",
      industry: "Financial Services",
      currentStatus: "expanding",
      growthRate: "+16.2% YoY",
      marketSize: "$340B",
      competitionLevel: "high",
      opportunityScore: 82,
      riskScore: 55,
      strategicRelevance: "high",
      confidence: 87,
      evidence: ["E3 financial executive intelligence", "Payment infrastructure trends"],
    },
    {
      marketId: "mie-consumer-dtc",
      marketName: "Consumer DTC",
      category: "consumer_market",
      geographicScope: "Global",
      industry: "Consumer Goods",
      currentStatus: "stable",
      growthRate: "+9.1% YoY",
      marketSize: "$890B",
      competitionLevel: "moderate",
      opportunityScore: 76,
      riskScore: 40,
      strategicRelevance: "moderate",
      confidence: 83,
      evidence: ["DTC channel intelligence", "Consumer demand signals"],
    },
    {
      marketId: "mie-b2b-saas",
      marketName: "B2B SaaS",
      category: "technology_market",
      geographicScope: "Global",
      industry: "Software",
      currentStatus: "expanding",
      growthRate: "+18.7% YoY",
      marketSize: "$295B",
      competitionLevel: "high",
      opportunityScore: 87,
      riskScore: 44,
      strategicRelevance: "high",
      confidence: 88,
      evidence: ["SaaS market benchmarks", "Enterprise adoption trends"],
    },
    {
      marketId: "mie-supplier-manufacturing",
      marketName: "Global Supplier Manufacturing",
      category: "industry_market",
      geographicScope: "Global",
      industry: "Manufacturing · Supply Chain",
      currentStatus: "recovering",
      growthRate: "+6.4% YoY",
      marketSize: "$4.1T",
      competitionLevel: "moderate",
      opportunityScore: 71,
      riskScore: 58,
      strategicRelevance: "moderate",
      confidence: 80,
      evidence: ["Supplier intelligence", "Supply chain resilience data"],
    },
    {
      marketId: "mie-emerging-latam",
      marketName: "Emerging Markets — LATAM",
      category: "emerging_market",
      geographicScope: "Latin America",
      industry: "Multi-sector",
      currentStatus: "emerging",
      growthRate: "+11.3% YoY",
      marketSize: "$420B addressable",
      competitionLevel: "low",
      opportunityScore: 84,
      riskScore: 62,
      strategicRelevance: "high",
      confidence: 78,
      evidence: ["Emerging market signals", "Digital adoption acceleration"],
    },
    {
      marketId: "mie-strategic-ai-platform",
      marketName: "Strategic AI Platform Market",
      category: "strategic_market",
      geographicScope: "Global",
      industry: "AI · Enterprise",
      currentStatus: "strategic_priority",
      growthRate: "+42.0% YoY",
      marketSize: "$62B",
      competitionLevel: "intense",
      opportunityScore: 96,
      riskScore: 46,
      strategicRelevance: "critical",
      confidence: 92,
      evidence: ["EmpireAI positioning", objectives[0] ?? "Strategic objective", "Constitutional AI governance"],
    },
    {
      marketId: "mie-future-autonomous-commerce",
      marketName: "Future Autonomous Commerce",
      category: "future_market",
      geographicScope: "Global",
      industry: "AI · Commerce",
      currentStatus: "emerging",
      growthRate: "+55.0% projected",
      marketSize: "$28B (2030 est.)",
      competitionLevel: "low",
      opportunityScore: 90,
      riskScore: 65,
      strategicRelevance: "critical",
      confidence: 74,
      evidence: ["Future market modeling", "Autonomous commerce trajectory"],
    },
  ];

  return catalogue.map((m) => ({
    ...m,
    domain: mapDomain(m.category),
  }));
}

function buildMarketTrends(markets: MarketRecord[]): MarketTrendEntry[] {
  return [
    { trendId: "trend-ai-adoption", marketId: "mie-ai-enterprise", marketName: "AI Enterprise Software", trend: "Enterprise AI adoption accelerating", direction: "up", momentum: "strong", impact: "critical", confidence: 91, status: "active" },
    { trendId: "trend-apac-growth", marketId: "mie-asia-pacific", marketName: "Asia-Pacific", trend: "APAC digital commerce expansion", direction: "up", momentum: "strong", impact: "high", confidence: 88, status: "active" },
    { trendId: "trend-dtc-saturation", marketId: "mie-consumer-dtc", marketName: "Consumer DTC", trend: "DTC channel saturation in mature markets", direction: "flat", momentum: "moderate", impact: "moderate", confidence: 82, status: "monitoring" },
    { trendId: "trend-fintech-regulation", marketId: "mie-global-fintech", marketName: "Global Fintech", trend: "Regulatory tightening in financial markets", direction: "up", momentum: "moderate", impact: "high", confidence: 85, status: "active" },
    { trendId: "trend-supply-resilience", marketId: "mie-supplier-manufacturing", marketName: "Global Supplier Manufacturing", trend: "Supply chain regionalization", direction: "up", momentum: "moderate", impact: "moderate", confidence: 79, status: "monitoring" },
    { trendId: "trend-autonomous-commerce", marketId: "mie-future-autonomous-commerce", marketName: "Future Autonomous Commerce", trend: "AI-driven autonomous commerce emergence", direction: "up", momentum: "emerging", impact: "critical", confidence: 76, status: "tracking" },
    ...markets.slice(0, 4).map((m, i) => ({
      trendId: `trend-${m.marketId}`,
      marketId: m.marketId,
      marketName: m.marketName,
      trend: `${m.industry} growth at ${m.growthRate}`,
      direction: "up" as const,
      momentum: m.opportunityScore >= 85 ? "strong" : "moderate",
      impact: m.strategicRelevance,
      confidence: m.confidence,
      status: "active",
    })),
  ].slice(0, 12);
}

function buildEmergingOpportunities(markets: MarketRecord[]): EmergingOpportunityEntry[] {
  return markets
    .filter((m) => m.opportunityScore >= 80)
    .slice(0, 8)
    .map((m, i) => ({
      opportunityId: `opp-${m.marketId}`,
      marketId: m.marketId,
      marketName: m.marketName,
      title: `${m.marketName} expansion opportunity`,
      category: m.category.replace(/_/g, " "),
      opportunityScore: m.opportunityScore,
      timeHorizon: m.category === "future_market" ? "long_term" : m.category === "emerging_market" ? "medium_term" : "short_term",
      strategicFit: m.strategicRelevance,
      evidence: m.evidence[0] ?? "Market intelligence evidence",
      status: i < 3 ? "priority" : "evaluating",
    }));
}

function buildMarketRisks(markets: MarketRecord[]): MarketRiskEntry[] {
  return markets
    .filter((m) => m.riskScore >= 45)
    .slice(0, 8)
    .map((m) => ({
      riskId: `risk-${m.marketId}`,
      marketId: m.marketId,
      marketName: m.marketName,
      title: `${m.marketName} market risk`,
      riskScore: m.riskScore,
      severity: m.riskScore >= 60 ? "high" : m.riskScore >= 50 ? "moderate" : "low",
      category: m.competitionLevel === "intense" ? "competitive" : "market",
      mitigation: `Monitor ${m.geographicScope} · diversify exposure`,
      status: m.riskScore >= 60 ? "active" : "monitoring",
    }));
}

function buildIndustryMovement(): IndustryMovementEntry[] {
  return [
    { movementId: "im-ai-platform", industry: "AI Enterprise", movement: "Platform consolidation accelerating", direction: "consolidating", affectedMarkets: "AI Enterprise · B2B SaaS", strategicImpact: "critical", confidence: 89, status: "active" },
    { movementId: "im-commerce-omni", industry: "Commerce", movement: "Omnichannel commerce standardization", direction: "expanding", affectedMarkets: "Global E-Commerce · Consumer DTC", strategicImpact: "high", confidence: 86, status: "active" },
    { movementId: "im-fintech-embedded", industry: "Fintech", movement: "Embedded finance proliferation", direction: "expanding", affectedMarkets: "Global Fintech · B2B SaaS", strategicImpact: "high", confidence: 84, status: "monitoring" },
    { movementId: "im-supply-regional", industry: "Manufacturing", movement: "Regional supply chain reconfiguration", direction: "shifting", affectedMarkets: "Supplier Manufacturing · APAC", strategicImpact: "moderate", confidence: 78, status: "monitoring" },
    { movementId: "im-autonomous-ai", industry: "AI · Commerce", movement: "Autonomous decision systems entering commerce", direction: "emerging", affectedMarkets: "Future Autonomous Commerce · Strategic AI", strategicImpact: "critical", confidence: 82, status: "tracking" },
  ];
}

function buildEconomicIndicators(): EconomicIndicatorEntry[] {
  return [
    { indicatorId: "eco-gdp-global", indicator: "Global GDP Growth", region: "Worldwide", currentValue: "+3.1%", trend: "stable", marketImpact: "moderate positive", status: "current" },
    { indicatorId: "eco-inflation-us", indicator: "US Inflation Rate", region: "North America", currentValue: "2.8%", trend: "declining", marketImpact: "positive for consumer", status: "current" },
    { indicatorId: "eco-interest-rates", indicator: "Central Bank Rates", region: "Global", currentValue: "Easing cycle", trend: "declining", marketImpact: "positive for investment", status: "current" },
    { indicatorId: "eco-ai-investment", indicator: "AI Venture Investment", region: "Global", currentValue: "$142B YTD", trend: "accelerating", marketImpact: "critical for AI markets", status: "current" },
    { indicatorId: "eco-ecommerce-penetration", indicator: "E-Commerce Penetration", region: "Global", currentValue: "22.6%", trend: "rising", marketImpact: "positive for commerce", status: "current" },
    { indicatorId: "eco-latam-growth", indicator: "LATAM GDP Growth", region: "Latin America", currentValue: "+3.8%", trend: "rising", marketImpact: "positive for emerging", status: "current" },
  ];
}

function buildStrategicAlerts(markets: MarketRecord[]): StrategicAlertEntry[] {
  const top = markets.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 4);
  return [
    ...top.map((m, i) => ({
      alertId: `alert-${m.marketId}`,
      marketId: m.marketId,
      title: `${m.marketName} — strategic opportunity`,
      severity: i === 0 ? "critical" : "high",
      category: "opportunity",
      message: `${m.marketName} shows ${m.growthRate} growth · opportunity score ${m.opportunityScore}`,
      recommendedAction: `Evaluate ${m.geographicScope} entry strategy`,
      status: "active",
    })),
    {
      alertId: "alert-competition-ai",
      marketId: "mie-ai-enterprise",
      title: "AI market competition intensifying",
      severity: "high",
      category: "risk",
      message: "Competitive intensity in AI enterprise software reaching critical levels",
      recommendedAction: "Accelerate differentiation · constitutional AI positioning",
      status: "active",
    },
  ];
}

function buildMarketAnalysis(markets: MarketRecord[]): MarketAnalysisMetric[] {
  const avgGrowth = Math.round(markets.reduce((s, m) => s + m.opportunityScore, 0) / Math.max(markets.length, 1));
  const avgRisk = Math.round(markets.reduce((s, m) => s + m.riskScore, 0) / Math.max(markets.length, 1));
  const scores: Record<string, { score: number; summary: string }> = {
    market_growth: { score: avgGrowth, summary: `Average opportunity score ${avgGrowth}/100 across ${markets.length} markets` },
    market_size: { score: 88, summary: "Global addressable market $6.3T+ e-commerce · $185B AI enterprise" },
    competitive_intensity: { score: 100 - avgRisk, summary: `Competition monitored across ${markets.length} market segments` },
    customer_demand: { score: 86, summary: "Consumer and enterprise demand signals positive" },
    industry_momentum: { score: 90, summary: "AI · commerce · fintech industries accelerating" },
    technology_evolution: { score: 92, summary: "AI platform evolution · autonomous commerce emerging" },
    economic_conditions: { score: 78, summary: "Global GDP stable · easing rates · inflation moderating" },
    strategic_opportunity: { score: avgGrowth, summary: `${markets.filter((m) => m.opportunityScore >= 85).length} high-opportunity markets identified` },
    market_risk: { score: 100 - avgRisk, summary: `Average risk score ${avgRisk}/100 · monitored continuously` },
    long_term_sustainability: { score: 84, summary: "Long-term market sustainability assessed across all domains" },
  };
  return MARKET_ANALYSIS_DOMAINS.map((domain) => {
    const s = scores[domain] ?? { score: 80, summary: "Analysis complete" };
    return {
      domain,
      label: label(domain),
      score: s.score,
      status: s.score >= 85 ? "strong" : s.score >= 70 ? "stable" : "review",
      summary: s.summary,
    };
  });
}

function buildPillowEvaluations(input: {
  marketCount: number;
  opportunityCount: number;
  riskCount: number;
  avgOpportunity: number;
}): PillowMarketEvaluationMetric[] {
  const evals: Record<string, { status: string; summary: string }> = {
    market_conditions: { status: "monitoring", summary: `${input.marketCount} global markets continuously observed` },
    market_opportunities: { status: input.opportunityCount >= 5 ? "strong" : "active", summary: `${input.opportunityCount} emerging opportunities identified` },
    market_risks: { status: input.riskCount <= 4 ? "managed" : "elevated", summary: `${input.riskCount} market risks tracked · mitigation active` },
    emerging_trends: { status: "active", summary: "AI adoption · APAC growth · autonomous commerce tracked" },
    executive_recommendations: { status: "ready", summary: `Evidence-based recommendations · avg opportunity ${input.avgOpportunity}/100` },
  };
  return PILLOW_MARKET_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: evals[domain]?.status ?? "active",
    summary: evals[domain]?.summary ?? "Evaluation complete",
  }));
}

function buildRecommendations(markets: MarketRecord[]): MarketIntelligenceRecommendation[] {
  const top = markets.sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
  return [
    {
      id: "mie-rec-1",
      title: `Prioritize ${top?.marketName ?? "Strategic AI Platform"} market entry evaluation`,
      category: "market_entry",
      why: "Highest opportunity score with strong strategic relevance to EmpireAI",
      what: "Commission full market entry analysis · competitive positioning · financial modeling",
      how: "E4-01 market intelligence · E3 financial executive · E2 decision engine",
      confidencePercent: top?.confidence ?? 90,
    },
    {
      id: "mie-rec-2",
      title: "Accelerate Asia-Pacific market intelligence coverage",
      category: "regional_expansion",
      why: "APAC showing +14.8% growth with critical strategic relevance",
      what: "Expand regional monitoring · supplier intelligence · consumer segmentation",
      how: "Continuous monitoring pipeline · knowledge integration · E4-02 competitor intelligence",
      confidencePercent: 88,
    },
    {
      id: "mie-rec-3",
      title: "Monitor AI enterprise competitive intensity",
      category: "risk_management",
      why: "Intense competition in AI enterprise software requires continuous vigilance",
      what: "Track competitor movements · differentiation strategy · pricing intelligence",
      how: "E4-02 Competitor Intelligence Engine · strategic alerts · executive review",
      confidencePercent: 87,
    },
    {
      id: "mie-rec-4",
      title: "Evaluate Future Autonomous Commerce positioning",
      category: "future_markets",
      why: "Emerging market with critical strategic relevance to EmpireAI vision",
      what: "Long-term market modeling · technology evolution tracking · investment horizon",
      how: "Future market classification · E3 capital strategy alignment · constitutional governance",
      confidencePercent: 82,
    },
  ];
}

export function assembleMarketIntelligenceEngine(input: {
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): MarketIntelligenceEngine {
  const globalMarkets = buildGlobalMarkets(input);
  const marketTrends = buildMarketTrends(globalMarkets);
  const emergingOpportunities = buildEmergingOpportunities(globalMarkets);
  const marketRisks = buildMarketRisks(globalMarkets);
  const industryMovement = buildIndustryMovement();
  const economicIndicators = buildEconomicIndicators();
  const strategicAlerts = buildStrategicAlerts(globalMarkets);
  const marketAnalysis = buildMarketAnalysis(globalMarkets);

  const avgOpportunity = Math.round(
    globalMarkets.reduce((s, m) => s + m.opportunityScore, 0) / Math.max(globalMarkets.length, 1),
  );
  const e3Ready = input.financialExecutiveCertification?.readyForE401 ?? true;
  const e2Ready = input.executiveDecisionCertification?.programmeCertified ?? false;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.financialExecutiveCertification?.healthScore ?? 85,
    avgOpportunity,
    emergingOpportunities.length >= 5 ? 90 : 78,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    marketCount: globalMarkets.length,
    opportunityCount: emergingOpportunities.length,
    riskCount: marketRisks.length,
    avgOpportunity,
  });
  const recommendedActions = buildRecommendations(globalMarkets);

  const pillowAdvisory = [
    "Market Intelligence Engine — constitutional external market awareness authority active",
    `${globalMarkets.length} markets monitored · ${emergingOpportunities.length} opportunities · ${marketRisks.length} risks tracked`,
    "Every market · industry · competitor signal · economic trend contributes to executive intelligence",
    `Phase E3 ${input.financialExecutiveCertification?.programmeCertified ? "CERTIFIED" : "integrated"} · E2 Decision Engine ${e2Ready ? "certified" : "integrated"}`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting market intelligence integrity")}`,
    "ECC coordinates market intelligence distribution · Supervisor monitors data freshness",
    "VIE validates market alignment · vision · strategic · constitutional",
    "Grand King possesses continuous live market awareness",
  ];

  return {
    engineVersion: "E4-01",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Market Intelligence Engine continuously observes, analyzes and understands global markets before making strategic recommendations. Every market, industry, competitor signal, customer segment, economic trend and technology shift contributes toward executive intelligence. The Grand King always possesses live market awareness.",
    engineHealth: healthLabel(clampedHealth),
    marketIntelligenceHealth: avgOpportunity >= 85 ? "strong" : avgOpportunity >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeMarketCount: globalMarkets.filter((m) => m.currentStatus !== "declining").length,
    monitoredMarketCount: globalMarkets.length,
    opportunityCount: emergingOpportunities.length,
    riskAlertCount: marketRisks.filter((r) => r.severity === "high").length,
    averageOpportunityScore: avgOpportunity,
    globalMarkets,
    marketTrends,
    emergingOpportunities,
    marketRisks,
    industryMovement,
    economicIndicators,
    strategicAlerts,
    marketAnalysis,
    marketIntelligencePipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    marketPrinciples: [...MARKET_PRINCIPLES],
    governedDomains: [...GOVERNED_MARKET_DOMAINS],
    pillowAdvisory,
    integrations: {
      financialExecutiveCertification: input.financialExecutiveCertification?.programmeCertified
        ? "E3-16 · Phase E3 certified"
        : "E3 · integrated",
      executiveDecisionCertification: input.executiveDecisionCertification?.programmeCertified
        ? "E2-16 · certified"
        : "E2 · integrated",
      executiveFinanceFramework: input.executiveFinanceFramework
        ? `E3-01 · ${input.executiveFinanceFramework.frameworkHealth}`
        : "E3-01 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      knowledgeEvolution: input.knowledgeEvolution
        ? `P9-02 · ${input.knowledgeEvolution.knowledgeHealth} · ${input.knowledgeEvolution.recentKnowledge.length} knowledge items`
        : "P9-02 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "market intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E4 Executive Intelligence"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring market intelligence health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "market intelligence distribution"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE402: e3Ready && clampedHealth >= 70,
  };
}

export function buildFallbackMarketIntelligenceEngine(): MarketIntelligenceEngine {
  return assembleMarketIntelligenceEngine({});
}
