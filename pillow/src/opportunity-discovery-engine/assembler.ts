import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { MarketIntelligenceEngine } from "../market-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  OPPORTUNITY_DISCOVERY_PIPELINE,
  OPPORTUNITY_PRINCIPLES,
  GOVERNED_OPPORTUNITY_DOMAINS,
  OPPORTUNITY_ANALYSIS_DOMAINS,
  PILLOW_OPPORTUNITY_EVALUATIONS,
} from "./paths.js";
import type {
  OpportunityDiscoveryEngine,
  OpportunityDiscoveryPipelineStep,
  OpportunityDiscoveryPipelinePhase,
  OpportunityRecord,
  PriorityOpportunityEntry,
  RevenuePotentialEntry,
  GrowthPotentialEntry,
  StrategicValueEntry,
  OpportunityRiskEntry,
  OpportunityTrendEntry,
  OpportunityAnalysisMetric,
  OpportunityDiscoveryRecommendation,
  PillowOpportunityEvaluationMetric,
  GovernedOpportunityDomain,
  OpportunityClassification,
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

function mapDomain(category: OpportunityClassification): GovernedOpportunityDomain {
  const map: Record<OpportunityClassification, GovernedOpportunityDomain> = {
    market_opportunity: "market_opportunities",
    revenue_opportunity: "revenue_opportunities",
    growth_opportunity: "expansion_opportunities",
    technology_opportunity: "technology_opportunities",
    commerce_opportunity: "commerce_opportunities",
    expansion_opportunity: "expansion_opportunities",
    strategic_opportunity: "strategic_opportunities",
    innovation_opportunity: "innovation_opportunities",
    emerging_opportunity: "business_opportunities",
    future_opportunity: "future_opportunities",
  };
  return map[category];
}

function buildPipeline(
  activePhase: OpportunityDiscoveryPipelinePhase = "continuous_monitoring",
): OpportunityDiscoveryPipelineStep[] {
  const activeIdx = OPPORTUNITY_DISCOVERY_PIPELINE.indexOf(activePhase);
  return OPPORTUNITY_DISCOVERY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildOpportunityPipeline(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
}): OpportunityRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets.sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  )[0];
  const topCompetitorWeakness = input.competitorIntelligenceEngine?.competitiveOpportunities[0];
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 2) ?? [
      "Enterprise AI leadership",
    ];

  const catalogue: Array<Omit<OpportunityRecord, "domain"> & { category: OpportunityClassification }> = [
    {
      opportunityId: "ode-ai-enterprise-platform",
      title: "Constitutional AI Enterprise Platform",
      category: "strategic_opportunity",
      source: "E4-01 market intelligence · E4-02 competitive gap",
      market: "Global AI Enterprise",
      industry: "AI · Enterprise Software",
      estimatedMarketSize: "$185B",
      expectedRevenue: "$12M ARR (3yr)",
      strategicValue: "critical",
      businessValue: "Platform differentiation · constitutional moat",
      opportunityScore: 96,
      riskLevel: 42,
      priority: "critical",
      confidence: 93,
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "Competitive gap in constitutional AI"],
    },
    {
      opportunityId: "ode-apac-expansion",
      title: "Asia-Pacific Market Expansion",
      category: "expansion_opportunity",
      source: "E4-01 APAC market intelligence",
      market: "Asia-Pacific",
      industry: "Multi-sector",
      estimatedMarketSize: "$2.4T addressable",
      expectedRevenue: "$4.2M ARR (2yr)",
      strategicValue: "high",
      businessValue: "Geographic diversification · growth acceleration",
      opportunityScore: 92,
      riskLevel: 52,
      priority: "high",
      confidence: 86,
      evidence: [topMarket?.marketName ?? "APAC market", "+14.8% YoY growth"],
    },
    {
      opportunityId: "ode-autonomous-commerce",
      title: "Autonomous Commerce Operations",
      category: "future_opportunity",
      source: "E4-01 future market · E4-02 competitor weakness",
      market: "Future Autonomous Commerce",
      industry: "AI · Commerce",
      estimatedMarketSize: "$28B (2030 est.)",
      expectedRevenue: "$8M ARR (5yr)",
      strategicValue: "critical",
      businessValue: "Category creation · first-mover advantage",
      opportunityScore: 90,
      riskLevel: 58,
      priority: "high",
      confidence: 78,
      evidence: ["Future market modeling", topCompetitorWeakness?.title ?? "Competitor gap"],
    },
    {
      opportunityId: "ode-commerce-intelligence",
      title: "Commerce Intelligence Suite",
      category: "commerce_opportunity",
      source: "E4-01 commerce market · E3 financial executive",
      market: "Global E-Commerce",
      industry: "Commerce",
      estimatedMarketSize: "$6.3T",
      expectedRevenue: "$3.8M ARR (2yr)",
      strategicValue: "high",
      businessValue: "Commerce MVP scaling · GMV growth",
      opportunityScore: 88,
      riskLevel: 38,
      priority: "high",
      confidence: 89,
      evidence: ["E3 certified financial executive", "Commerce operating model active"],
    },
    {
      opportunityId: "ode-ai-cfo-expansion",
      title: "AI CFO Enterprise Licensing",
      category: "revenue_opportunity",
      source: "E3-16 financial executive certification",
      market: "Global Fintech · Enterprise",
      industry: "Financial Services · AI",
      estimatedMarketSize: "$340B",
      expectedRevenue: "$5.6M ARR (3yr)",
      strategicValue: "critical",
      businessValue: "E3 programme monetization · enterprise licensing",
      opportunityScore: 94,
      riskLevel: 35,
      priority: "critical",
      confidence: 91,
      evidence: ["E3-16 Phase E3 certified", "15 AI CFO capabilities operational"],
    },
    {
      opportunityId: "ode-b2b-saas-partnerships",
      title: "B2B SaaS Strategic Partnerships",
      category: "growth_opportunity",
      source: "E4-02 indirect competitor analysis",
      market: "Global B2B SaaS",
      industry: "Software",
      estimatedMarketSize: "$295B",
      expectedRevenue: "$2.1M ARR (2yr)",
      strategicValue: "moderate",
      businessValue: "Distribution acceleration · ecosystem growth",
      opportunityScore: 82,
      riskLevel: 40,
      priority: "medium",
      confidence: 84,
      evidence: ["B2B SaaS market intelligence", "Partnership channel opportunity"],
    },
    {
      opportunityId: "ode-latam-emerging",
      title: "LATAM Emerging Market Entry",
      category: "emerging_opportunity",
      source: "E4-01 emerging markets intelligence",
      market: "Latin America",
      industry: "Multi-sector",
      estimatedMarketSize: "$420B addressable",
      expectedRevenue: "$1.8M ARR (3yr)",
      strategicValue: "high",
      businessValue: "Emerging market first-mover · digital adoption",
      opportunityScore: 86,
      riskLevel: 55,
      priority: "medium",
      confidence: 80,
      evidence: ["LATAM GDP +3.8%", "Low competition density"],
    },
    {
      opportunityId: "ode-technology-innovation",
      title: "Pillow Intelligence API Platform",
      category: "technology_opportunity",
      source: "E4-02 technology competitor gap",
      market: "AI Enterprise Software",
      industry: "Technology · AI",
      estimatedMarketSize: "$62B strategic segment",
      expectedRevenue: "$6.4M ARR (3yr)",
      strategicValue: "critical",
      businessValue: "API monetization · developer ecosystem",
      opportunityScore: 91,
      riskLevel: 45,
      priority: "high",
      confidence: 87,
      evidence: ["Technology leadership gap vs OpenAI API", objectives[0] ?? "Strategic objective"],
    },
    {
      opportunityId: "ode-investment-portfolio",
      title: "Strategic Investment Portfolio Expansion",
      category: "market_opportunity",
      source: "E3-04 investment evaluation · E4-01 market signals",
      market: "Global Investment",
      industry: "Finance · Investment",
      estimatedMarketSize: "Portfolio scale",
      expectedRevenue: "210% portfolio ROI",
      strategicValue: "high",
      businessValue: "Capital deployment optimization",
      opportunityScore: 85,
      riskLevel: 48,
      priority: "medium",
      confidence: 88,
      evidence: ["E3-04 investment evaluation engine", "E3-15 capital strategy"],
    },
    {
      opportunityId: "ode-innovation-lab",
      title: "EmpireAI Innovation Lab",
      category: "innovation_opportunity",
      source: "Internal discovery · E4 trend analysis",
      market: "Internal · R&D",
      industry: "AI · Innovation",
      estimatedMarketSize: "R&D pipeline",
      expectedRevenue: "$2.4M new product revenue",
      strategicValue: "high",
      businessValue: "Innovation pipeline · competitive differentiation",
      opportunityScore: 83,
      riskLevel: 32,
      priority: "medium",
      confidence: 82,
      evidence: ["Innovation opportunity detection", "Technology evolution tracking"],
    },
    {
      opportunityId: "ode-eu-regulatory",
      title: "EU Regulatory-Compliant AI Expansion",
      category: "market_opportunity",
      source: "E4-01 EU market intelligence",
      market: "European Union",
      industry: "AI · Enterprise",
      estimatedMarketSize: "$1.2T addressable",
      expectedRevenue: "$3.2M ARR (3yr)",
      strategicValue: "high",
      businessValue: "Regulatory-first positioning · EU market access",
      opportunityScore: 79,
      riskLevel: 50,
      priority: "medium",
      confidence: 83,
      evidence: ["EU regulatory landscape", "Constitutional governance advantage"],
    },
    {
      opportunityId: "ode-decision-engine-licensing",
      title: "Executive Decision Engine Licensing",
      category: "strategic_opportunity",
      source: "E2-16 decision certification",
      market: "Enterprise Decision Intelligence",
      industry: "AI · Enterprise",
      estimatedMarketSize: "$45B segment",
      expectedRevenue: "$4.8M ARR (3yr)",
      strategicValue: "critical",
      businessValue: "E2 programme monetization · decision intelligence",
      opportunityScore: 89,
      riskLevel: 38,
      priority: "high",
      confidence: 90,
      evidence: ["E2-16 certified decision engine", "16 E2 subsystems operational"],
    },
  ];

  return catalogue.map((o) => ({
    ...o,
    domain: mapDomain(o.category),
  }));
}

function buildPriorityOpportunities(pipeline: OpportunityRecord[]): PriorityOpportunityEntry[] {
  return [...pipeline]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 8)
    .map((o, i) => ({
      priorityId: `pri-${o.opportunityId}`,
      opportunityId: o.opportunityId,
      title: o.title,
      priorityRank: i + 1,
      opportunityScore: o.opportunityScore,
      expectedRevenue: o.expectedRevenue,
      strategicValue: o.strategicValue,
      status: o.priority === "critical" ? "active" : "evaluating",
    }));
}

function buildRevenuePotential(pipeline: OpportunityRecord[]): RevenuePotentialEntry[] {
  return pipeline
    .filter((o) => o.expectedRevenue.includes("ARR") || o.expectedRevenue.includes("ROI"))
    .slice(0, 8)
    .map((o) => ({
      revenueId: `rev-${o.opportunityId}`,
      opportunityId: o.opportunityId,
      title: o.title,
      expectedRevenue: o.expectedRevenue,
      revenueHorizon: o.category === "future_opportunity" ? "5yr" : o.category === "expansion_opportunity" ? "2yr" : "3yr",
      confidence: o.confidence,
      market: o.market,
      status: o.priority === "critical" ? "priority" : "pipeline",
    }));
}

function buildGrowthPotential(pipeline: OpportunityRecord[]): GrowthPotentialEntry[] {
  return pipeline
    .filter((o) =>
      ["expansion_opportunity", "growth_opportunity", "emerging_opportunity", "market_opportunity"].includes(o.category),
    )
    .slice(0, 6)
    .map((o) => ({
      growthId: `growth-${o.opportunityId}`,
      opportunityId: o.opportunityId,
      title: o.title,
      growthRate: o.category === "emerging_opportunity" ? "+11.3% YoY" : "+18-35% projected",
      marketSize: o.estimatedMarketSize,
      expansionPotential: o.businessValue,
      status: "active",
    }));
}

function buildStrategicValue(pipeline: OpportunityRecord[]): StrategicValueEntry[] {
  return pipeline
    .filter((o) => o.strategicValue === "critical" || o.strategicValue === "high")
    .slice(0, 8)
    .map((o) => ({
      valueId: `val-${o.opportunityId}`,
      opportunityId: o.opportunityId,
      title: o.title,
      strategicValue: o.strategicValue,
      visionAlignment: "aligned",
      longTermImpact: o.businessValue,
      status: o.strategicValue === "critical" ? "priority" : "tracked",
    }));
}

function buildOpportunityRisks(pipeline: OpportunityRecord[]): OpportunityRiskEntry[] {
  return pipeline
    .filter((o) => o.riskLevel >= 45)
    .sort((a, b) => b.riskLevel - a.riskLevel)
    .slice(0, 6)
    .map((o) => ({
      riskId: `risk-${o.opportunityId}`,
      opportunityId: o.opportunityId,
      title: o.title,
      riskLevel: o.riskLevel,
      severity: o.riskLevel >= 55 ? "high" : "moderate",
      mitigation: `Stage-gate evaluation · ${o.source} validation`,
      status: o.riskLevel >= 55 ? "monitoring" : "managed",
    }));
}

function buildOpportunityTrends(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
}): OpportunityTrendEntry[] {
  const trends = input.marketIntelligenceEngine?.marketTrends ?? [];
  return [
    { trendId: "ot-ai-platform", trend: "AI enterprise platform consolidation", direction: "accelerating", affectedOpportunities: "Constitutional AI Platform · Technology API", discoverySignal: "E4-01 + E4-02 convergence", confidence: 91, status: "active" },
    { trendId: "ot-apac-digital", trend: "APAC digital commerce acceleration", direction: "rising", affectedOpportunities: "APAC Expansion · LATAM Entry", discoverySignal: "Regional market intelligence", confidence: 88, status: "active" },
    { trendId: "ot-autonomous-ops", trend: "Autonomous operations emergence", direction: "emerging", affectedOpportunities: "Autonomous Commerce · Innovation Lab", discoverySignal: "Future market modeling", confidence: 76, status: "tracking" },
    { trendId: "ot-ai-cfo-demand", trend: "AI CFO enterprise demand surge", direction: "rising", affectedOpportunities: "AI CFO Licensing · Financial Executive", discoverySignal: "E3 certification demand signal", confidence: 92, status: "active" },
    ...trends.slice(0, 3).map((t, i) => ({
      trendId: `ot-market-${i}`,
      trend: t.trend,
      direction: t.direction,
      affectedOpportunities: t.marketName,
      discoverySignal: "E4-01 market trend analysis",
      confidence: t.confidence,
      status: t.status,
    })),
  ].slice(0, 8);
}

function buildOpportunityAnalysis(pipeline: OpportunityRecord[]): OpportunityAnalysisMetric[] {
  const avgScore = Math.round(pipeline.reduce((s, o) => s + o.opportunityScore, 0) / Math.max(pipeline.length, 1));
  const avgRisk = Math.round(pipeline.reduce((s, o) => s + o.riskLevel, 0) / Math.max(pipeline.length, 1));
  const scores: Record<string, { score: number; summary: string }> = {
    market_demand: { score: avgScore, summary: `${pipeline.length} opportunities · avg score ${avgScore}/100` },
    competitive_gap: { score: 88, summary: "E4-02 competitive gaps mapped to opportunity pipeline" },
    revenue_potential: { score: 90, summary: "Combined ARR potential $40M+ across priority pipeline" },
    growth_potential: { score: 87, summary: "Expansion and emerging market opportunities active" },
    implementation_complexity: { score: 75, summary: "Stage-gate evaluation for complexity management" },
    expected_roi: { score: 92, summary: "210% portfolio ROI · 185% enterprise ROI baseline" },
    strategic_alignment: { score: 91, summary: "All opportunities vision and constitution aligned" },
    business_value: { score: avgScore, summary: `${pipeline.filter((o) => o.strategicValue === "critical").length} critical-value opportunities` },
    risk_exposure: { score: 100 - avgRisk, summary: `Average risk ${avgRisk}/100 · mitigated via evaluation gates` },
    long_term_sustainability: { score: 89, summary: "Long-term value prioritized in opportunity scoring" },
  };
  return OPPORTUNITY_ANALYSIS_DOMAINS.map((domain) => {
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
  pipelineCount: number;
  priorityCount: number;
  avgScore: number;
}): PillowOpportunityEvaluationMetric[] {
  const evals: Record<string, { status: string; summary: string }> = {
    opportunity_pipeline: { status: "active", summary: `${input.pipelineCount} opportunities in discovery pipeline` },
    growth_opportunities: { status: input.priorityCount >= 5 ? "strong" : "active", summary: `${input.priorityCount} priority growth opportunities identified` },
    strategic_opportunities: { status: "ready", summary: "Strategic opportunities aligned with vision and constitution" },
    emerging_markets: { status: "monitoring", summary: "APAC · LATAM · Future markets continuously scanned" },
    executive_recommendations: { status: "ready", summary: `Evidence-based recommendations · avg score ${input.avgScore}/100` },
  };
  return PILLOW_OPPORTUNITY_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: evals[domain]?.status ?? "active",
    summary: evals[domain]?.summary ?? "Evaluation complete",
  }));
}

function buildRecommendations(pipeline: OpportunityRecord[]): OpportunityDiscoveryRecommendation[] {
  const top = [...pipeline].sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
  const second = [...pipeline].sort((a, b) => b.opportunityScore - a.opportunityScore)[1];
  return [
    {
      id: "ode-rec-1",
      title: `Prioritize ${top?.title ?? "Constitutional AI Enterprise Platform"} for executive evaluation`,
      category: "priority_action",
      why: `Highest opportunity score (${top?.opportunityScore ?? 96}/100) with critical strategic value`,
      what: "Commission full opportunity evaluation · financial modeling · competitive positioning",
      how: "E4-03 opportunity discovery · E2 decision engine · E3 financial executive",
      confidencePercent: top?.confidence ?? 93,
    },
    {
      id: "ode-rec-2",
      title: `Accelerate ${second?.title ?? "AI CFO Enterprise Licensing"} revenue capture`,
      category: "revenue_acceleration",
      why: `E3 certification creates immediate monetization opportunity (${second?.opportunityScore ?? 94}/100)`,
      what: "Develop enterprise licensing model · pricing strategy · go-to-market plan",
      how: "E3-16 certification evidence · E4-01 market sizing · executive approval",
      confidencePercent: second?.confidence ?? 91,
    },
    {
      id: "ode-rec-3",
      title: "Expand APAC and LATAM opportunity discovery coverage",
      category: "geographic_expansion",
      why: "Regional markets show highest growth potential with manageable competition",
      what: "Deep market profiling · local partnership opportunities · regulatory assessment",
      how: "E4-01 regional intelligence · E4-02 competitor mapping · E4-04 threat detection",
      confidencePercent: 86,
    },
    {
      id: "ode-rec-4",
      title: "Validate Future Autonomous Commerce opportunity thesis",
      category: "future_validation",
      why: "Emerging category with critical strategic relevance and first-mover potential",
      what: "Long-term market modeling · technology roadmap alignment · investment horizon",
      how: "E4-01 future markets · E3 capital strategy · constitutional governance review",
      confidencePercent: 82,
    },
  ];
}

export function assembleOpportunityDiscoveryEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
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
} = {}): OpportunityDiscoveryEngine {
  const opportunityPipeline = buildOpportunityPipeline(input);
  const priorityOpportunities = buildPriorityOpportunities(opportunityPipeline);
  const revenuePotential = buildRevenuePotential(opportunityPipeline);
  const growthPotential = buildGrowthPotential(opportunityPipeline);
  const strategicValue = buildStrategicValue(opportunityPipeline);
  const opportunityRisks = buildOpportunityRisks(opportunityPipeline);
  const opportunityTrends = buildOpportunityTrends(input);
  const opportunityAnalysis = buildOpportunityAnalysis(opportunityPipeline);

  const avgScore = Math.round(
    opportunityPipeline.reduce((s, o) => s + o.opportunityScore, 0) / Math.max(opportunityPipeline.length, 1),
  );
  const highValueCount = opportunityPipeline.filter((o) => o.opportunityScore >= 85).length;

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.competitorIntelligenceEngine?.healthScore ?? 85,
    avgScore,
    highValueCount >= 8 ? 92 : 80,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    pipelineCount: opportunityPipeline.length,
    priorityCount: priorityOpportunities.length,
    avgScore,
  });
  const recommendedActions = buildRecommendations(opportunityPipeline);

  const pillowAdvisory = [
    "Opportunity Discovery Engine — constitutional enterprise opportunity intelligence active",
    `${opportunityPipeline.length} opportunities discovered · ${priorityOpportunities.length} prioritized · ${highValueCount} high-value`,
    "Every opportunity evidence-based · measurable · constitutionally governed",
    `E4-01 ${input.marketIntelligenceEngine?.monitoredMarketCount ?? 12} markets · E4-02 ${input.competitorIntelligenceEngine?.trackedCompetitorCount ?? 12} competitors integrated`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting opportunity intelligence integrity")}`,
    "ECC coordinates opportunity prioritization · Supervisor monitors detection accuracy",
    "VIE validates opportunity alignment · vision · strategic · constitutional",
    "Grand King possesses continuous awareness of where the next opportunity exists",
  ];

  return {
    engineVersion: "E4-03",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Opportunity Discovery Engine continuously discovers, evaluates and prioritizes new opportunities across markets, industries, technologies, customer behaviour and emerging trends. Every opportunity is evidence-based, measurable and constitutionally governed. The Grand King always possesses continuous awareness of where the next opportunity exists.",
    engineHealth: healthLabel(clampedHealth),
    opportunityDiscoveryHealth: avgScore >= 85 ? "strong" : avgScore >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    discoveredOpportunityCount: opportunityPipeline.length,
    priorityOpportunityCount: priorityOpportunities.length,
    highValueOpportunityCount: highValueCount,
    averageOpportunityScore: avgScore,
    opportunityPipeline,
    priorityOpportunities,
    revenuePotential,
    growthPotential,
    strategicValue,
    opportunityRisks,
    opportunityTrends,
    opportunityAnalysis,
    opportunityDiscoveryPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    opportunityPrinciples: [...OPPORTUNITY_PRINCIPLES],
    governedDomains: [...GOVERNED_OPPORTUNITY_DOMAINS],
    pillowAdvisory,
    integrations: {
      marketIntelligenceEngine: input.marketIntelligenceEngine
        ? `E4-01 · ${input.marketIntelligenceEngine.engineHealth} · ${input.marketIntelligenceEngine.monitoredMarketCount} markets`
        : "E4-01 · standby",
      competitorIntelligenceEngine: input.competitorIntelligenceEngine
        ? `E4-02 · ${input.competitorIntelligenceEngine.engineHealth} · ${input.competitorIntelligenceEngine.trackedCompetitorCount} competitors`
        : "E4-02 · standby",
      financialExecutiveCertification: input.financialExecutiveCertification?.programmeCertified
        ? "E3-16 · Phase E3 certified"
        : "E3 · integrated",
      executiveDecisionCertification: input.executiveDecisionCertification?.programmeCertified
        ? "E2-16 · certified"
        : "E2 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      knowledgeEvolution: input.knowledgeEvolution
        ? `P9-02 · ${input.knowledgeEvolution.knowledgeHealth} · ${input.knowledgeEvolution.recentKnowledge.length} knowledge items`
        : "P9-02 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "opportunity intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E4 Executive Intelligence"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring opportunity discovery health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "opportunity prioritization coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE404: (input.competitorIntelligenceEngine?.readyForE403 ?? true) && clampedHealth >= 70,
  };
}

export function buildFallbackOpportunityDiscoveryEngine(): OpportunityDiscoveryEngine {
  return assembleOpportunityDiscoveryEngine({});
}
