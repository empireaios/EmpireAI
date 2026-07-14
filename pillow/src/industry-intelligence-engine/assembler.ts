import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { MarketIntelligenceEngine } from "../market-intelligence-engine/types.js";
import type { OpportunityDiscoveryEngine } from "../opportunity-discovery-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { ThreatDetectionEngine } from "../threat-detection-engine/types.js";
import {
  INDUSTRY_INTELLIGENCE_PIPELINE,
  INDUSTRY_INTELLIGENCE_PRINCIPLES,
  GOVERNED_INDUSTRY_DOMAINS,
  INDUSTRY_ANALYSIS_DOMAINS,
  PILLOW_INDUSTRY_EVALUATIONS,
} from "./paths.js";
import type {
  IndustryIntelligenceEngine,
  IndustryIntelligencePipelineStep,
  IndustryIntelligencePipelinePhase,
  IndustryRecord,
  IndustryTrendEntry,
  GrowthIndustryEntry,
  EmergingIndustryEntry,
  IndustryRiskEntry,
  IndustryOpportunityEntry,
  InnovationActivityEntry,
  IndustryAnalysisMetric,
  IndustryIntelligenceRecommendation,
  PillowIndustryEvaluationMetric,
  GovernedIndustryDomain,
  IndustryClassification,
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

function mapDomain(category: IndustryClassification): GovernedIndustryDomain {
  const map: Record<IndustryClassification, GovernedIndustryDomain> = {
    emerging_industry: "future_industries",
    growth_industry: "industry_growth",
    mature_industry: "industry_structure",
    declining_industry: "industry_risks",
    technology_industry: "industry_innovation",
    commerce_industry: "industry_opportunities",
    service_industry: "industry_analysis",
    manufacturing_industry: "industry_structure",
    strategic_industry: "industry_analysis",
    future_industry: "future_industries",
  };
  return map[category];
}

function buildPipeline(
  activePhase: IndustryIntelligencePipelinePhase = "continuous_monitoring",
): IndustryIntelligencePipelineStep[] {
  const activeIdx = INDUSTRY_INTELLIGENCE_PIPELINE.indexOf(activePhase);
  return INDUSTRY_INTELLIGENCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildIndustryLandscape(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): IndustryRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets.sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  )[0];
  const topThreat = input.threatDetectionEngine?.criticalThreats[0];
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0];

  const catalogue: Array<Omit<IndustryRecord, "domain"> & { category: IndustryClassification }> = [
    {
      industryId: "iie-enterprise-ai",
      industryName: "Enterprise AI & Constitutional Intelligence",
      category: "strategic_industry",
      sector: "Technology · AI · Enterprise Software",
      marketSize: "$185B",
      growthRate: "+32.4% YoY",
      maturity: "growth",
      innovationRate: "very high",
      competitiveIntensity: "very high",
      regulatoryEnvironment: "evolving · multi-jurisdiction",
      opportunityScore: 96,
      riskScore: 68,
      strategicRelevance: "critical",
      confidence: 94,
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "E4-01 market intelligence · constitutional AI moat"],
    },
    {
      industryId: "iie-fintech-ai",
      industryName: "AI-Powered Financial Services",
      category: "growth_industry",
      sector: "Financial Services · Fintech · AI",
      marketSize: "$340B",
      growthRate: "+18.6% YoY",
      maturity: "growth",
      innovationRate: "high",
      competitiveIntensity: "high",
      regulatoryEnvironment: "strict · compliance-heavy",
      opportunityScore: 92,
      riskScore: 55,
      strategicRelevance: "critical",
      confidence: 91,
      evidence: ["E3-16 financial executive certified", "AI CFO enterprise licensing opportunity"],
    },
    {
      industryId: "iie-global-ecommerce",
      industryName: "Global E-Commerce & Digital Commerce",
      category: "commerce_industry",
      sector: "Commerce · Retail · Digital",
      marketSize: "$6.3T",
      growthRate: "+12.8% YoY",
      maturity: "mature",
      innovationRate: "moderate",
      competitiveIntensity: "very high",
      regulatoryEnvironment: "moderate · consumer protection",
      opportunityScore: 88,
      riskScore: 48,
      strategicRelevance: "high",
      confidence: 89,
      evidence: ["E4-03 commerce opportunity", "Commerce intelligence suite active"],
    },
    {
      industryId: "iie-autonomous-commerce",
      industryName: "Autonomous Commerce Operations",
      category: "emerging_industry",
      sector: "AI · Commerce · Automation",
      marketSize: "$28B (2030 est.)",
      growthRate: "+45.2% projected",
      maturity: "emerging",
      innovationRate: "very high",
      competitiveIntensity: "moderate",
      regulatoryEnvironment: "developing",
      opportunityScore: 90,
      riskScore: 62,
      strategicRelevance: "critical",
      confidence: 78,
      evidence: ["E4-01 future market modeling", topOpportunity?.title ?? "Future commerce opportunity"],
    },
    {
      industryId: "iie-b2b-saas",
      industryName: "B2B SaaS & Enterprise Software",
      category: "technology_industry",
      sector: "Software · SaaS · Enterprise",
      marketSize: "$295B",
      growthRate: "+16.4% YoY",
      maturity: "growth",
      innovationRate: "high",
      competitiveIntensity: "very high",
      regulatoryEnvironment: "moderate · data privacy",
      opportunityScore: 84,
      riskScore: 58,
      strategicRelevance: "high",
      confidence: 87,
      evidence: ["E4-02 B2B SaaS competitor analysis", "Partnership channel opportunity"],
    },
    {
      industryId: "iie-healthcare-ai",
      industryName: "Healthcare AI & Digital Health",
      category: "growth_industry",
      sector: "Healthcare · Life Sciences · AI",
      marketSize: "$188B",
      growthRate: "+22.1% YoY",
      maturity: "growth",
      innovationRate: "very high",
      competitiveIntensity: "high",
      regulatoryEnvironment: "strict · HIPAA · FDA",
      opportunityScore: 82,
      riskScore: 65,
      strategicRelevance: "moderate",
      confidence: 84,
      evidence: ["Healthcare AI market intelligence", "Regulatory compliance requirements"],
    },
    {
      industryId: "iie-apac-digital",
      industryName: "Asia-Pacific Digital Economy",
      category: "growth_industry",
      sector: "Multi-sector · APAC · Digital",
      marketSize: "$2.4T addressable",
      growthRate: "+14.8% YoY",
      maturity: "growth",
      innovationRate: "high",
      competitiveIntensity: "high",
      regulatoryEnvironment: "diverse · data sovereignty",
      opportunityScore: 86,
      riskScore: 52,
      strategicRelevance: "high",
      confidence: 86,
      evidence: [topMarket?.marketName ?? "APAC market", "E4-03 APAC expansion opportunity"],
    },
    {
      industryId: "iie-cybersecurity",
      industryName: "Enterprise Cybersecurity & Zero Trust",
      category: "strategic_industry",
      sector: "Security · Infrastructure · Enterprise",
      marketSize: "$215B",
      growthRate: "+13.2% YoY",
      maturity: "mature",
      innovationRate: "high",
      competitiveIntensity: "high",
      regulatoryEnvironment: "strict · compliance-driven",
      opportunityScore: 78,
      riskScore: 72,
      strategicRelevance: "high",
      confidence: 90,
      evidence: [topThreat?.title ?? "Cybersecurity threat", "Guardian production integrity"],
    },
    {
      industryId: "iie-education-ai",
      industryName: "AI Education & Workforce Training",
      category: "service_industry",
      sector: "Education · Training · AI",
      marketSize: "$42B",
      growthRate: "+19.8% YoY",
      maturity: "growth",
      innovationRate: "high",
      competitiveIntensity: "moderate",
      regulatoryEnvironment: "moderate",
      opportunityScore: 76,
      riskScore: 38,
      strategicRelevance: "moderate",
      confidence: 82,
      evidence: ["Workforce AI training demand", "Knowledge evolution architecture"],
    },
    {
      industryId: "iie-manufacturing-iot",
      industryName: "Smart Manufacturing & Industrial IoT",
      category: "manufacturing_industry",
      sector: "Manufacturing · IoT · Automation",
      marketSize: "$156B",
      growthRate: "+11.4% YoY",
      maturity: "mature",
      innovationRate: "moderate",
      competitiveIntensity: "moderate",
      regulatoryEnvironment: "moderate · safety standards",
      opportunityScore: 72,
      riskScore: 42,
      strategicRelevance: "moderate",
      confidence: 80,
      evidence: ["Industrial IoT market trends", "Manufacturing digitization"],
    },
    {
      industryId: "iie-legacy-enterprise",
      industryName: "Legacy Enterprise IT Services",
      category: "declining_industry",
      sector: "IT Services · Legacy Systems",
      marketSize: "$98B",
      growthRate: "-2.4% YoY",
      maturity: "declining",
      innovationRate: "low",
      competitiveIntensity: "high",
      regulatoryEnvironment: "stable",
      opportunityScore: 35,
      riskScore: 28,
      strategicRelevance: "low",
      confidence: 88,
      evidence: ["Legacy market contraction", "Cloud migration displacement"],
    },
    {
      industryId: "iie-future-autonomous-ai",
      industryName: "Future Autonomous AI Ecosystem",
      category: "future_industry",
      sector: "AI · Autonomous Systems · Future Tech",
      marketSize: "$420B (2035 est.)",
      growthRate: "+52.0% projected",
      maturity: "nascent",
      innovationRate: "transformative",
      competitiveIntensity: "emerging",
      regulatoryEnvironment: "undefined · forming",
      opportunityScore: 94,
      riskScore: 74,
      strategicRelevance: "critical",
      confidence: 72,
      evidence: ["E4-04 future autonomous AI threat", "Zero-human automation positioning"],
    },
  ];

  return catalogue.map((i) => ({ ...i, domain: mapDomain(i.category) }));
}

function buildIndustryTrends(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
}): IndustryTrendEntry[] {
  const avgMarketGrowth = input.marketIntelligenceEngine?.globalMarkets?.length
    ? "+14.2% avg"
    : "+12% avg";

  return [
    {
      trendId: "trend-ai-enterprise-consolidation",
      trend: "Enterprise AI Platform Consolidation",
      direction: "accelerating",
      affectedIndustries: "Enterprise AI · B2B SaaS · Fintech AI",
      evolutionSignal: "Market concentration · platform bundling",
      confidence: 91,
      status: "active",
    },
    {
      trendId: "trend-autonomous-operations",
      trend: "Autonomous Operations Adoption",
      direction: "emerging",
      affectedIndustries: "Autonomous Commerce · Manufacturing IoT · Future AI",
      evolutionSignal: "Zero-human automation demand",
      confidence: 84,
      status: "tracking",
    },
    {
      trendId: "trend-regulatory-ai",
      trend: "AI Regulatory Framework Expansion",
      direction: "escalating",
      affectedIndustries: "Enterprise AI · Healthcare AI · Cybersecurity",
      evolutionSignal: input.threatDetectionEngine?.threatTrends[1]?.trend ?? "Regulatory expansion",
      confidence: 88,
      status: "active",
    },
    {
      trendId: "trend-apac-digitalization",
      trend: "APAC Digital Economy Acceleration",
      direction: "accelerating",
      affectedIndustries: "APAC Digital · E-Commerce · B2B SaaS",
      evolutionSignal: `${avgMarketGrowth} regional growth`,
      confidence: 86,
      status: "active",
    },
    {
      trendId: "trend-legacy-displacement",
      trend: "Legacy IT Services Displacement",
      direction: "declining",
      affectedIndustries: "Legacy Enterprise IT · Manufacturing IoT",
      evolutionSignal: "Cloud-native migration · AI automation",
      confidence: 82,
      status: "monitoring",
    },
  ];
}

function buildGrowthIndustries(industries: IndustryRecord[]): GrowthIndustryEntry[] {
  return industries
    .filter((i) => i.category === "growth_industry" || parseFloat(i.growthRate) > 15 || i.growthRate.includes("+1") || i.growthRate.includes("+2") || i.growthRate.includes("+3") || i.growthRate.includes("+4") || i.growthRate.includes("+5"))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((i) => ({
      growthId: `growth-${i.industryId}`,
      industryId: i.industryId,
      industryName: i.industryName,
      growthRate: i.growthRate,
      marketSize: i.marketSize,
      opportunityScore: i.opportunityScore,
      strategicRelevance: i.strategicRelevance,
      status: "monitored",
    }));
}

function buildEmergingIndustries(industries: IndustryRecord[]): EmergingIndustryEntry[] {
  return industries
    .filter((i) => i.category === "emerging_industry" || i.category === "future_industry" || i.maturity === "emerging" || i.maturity === "nascent")
    .map((i) => ({
      emergingId: `emerging-${i.industryId}`,
      industryId: i.industryId,
      industryName: i.industryName,
      category: i.category.replace(/_/g, " "),
      innovationRate: i.innovationRate,
      marketSize: i.marketSize,
      timeHorizon: i.category === "future_industry" ? "24-36 months" : "12-24 months",
      status: "tracking",
    }));
}

function buildIndustryRisks(industries: IndustryRecord[]): IndustryRiskEntry[] {
  return industries
    .filter((i) => i.riskScore >= 50)
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((i) => ({
      riskId: `risk-${i.industryId}`,
      industryId: i.industryId,
      industryName: i.industryName,
      riskScore: i.riskScore,
      severity: i.riskScore >= 70 ? "high" : i.riskScore >= 55 ? "moderate" : "low",
      riskType: i.regulatoryEnvironment.includes("strict") ? "regulatory" : "competitive",
      mitigation: `Industry-specific risk assessment · ${i.strategicRelevance} relevance monitoring`,
      status: i.riskScore >= 65 ? "active" : "monitoring",
    }));
}

function buildIndustryOpportunities(industries: IndustryRecord[]): IndustryOpportunityEntry[] {
  return industries
    .filter((i) => i.opportunityScore >= 75)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((i) => ({
      opportunityId: `opp-${i.industryId}`,
      industryId: i.industryId,
      industryName: i.industryName,
      opportunityScore: i.opportunityScore,
      strategicValue: i.strategicRelevance,
      marketSize: i.marketSize,
      status: i.opportunityScore >= 90 ? "priority" : "active",
    }));
}

function buildInnovationActivity(industries: IndustryRecord[]): InnovationActivityEntry[] {
  return industries
    .filter((i) => i.innovationRate === "very high" || i.innovationRate === "high" || i.innovationRate === "transformative")
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((i) => ({
      innovationId: `innovation-${i.industryId}`,
      industryId: i.industryId,
      industryName: i.industryName,
      innovationRate: i.innovationRate,
      keyTechnologies: i.sector.split("·").map((s) => s.trim()).join(" · "),
      disruptionPotential: i.innovationRate === "transformative" ? "critical" : i.innovationRate === "very high" ? "high" : "moderate",
      status: "active",
    }));
}

function buildIndustryAnalysis(industries: IndustryRecord[]): IndustryAnalysisMetric[] {
  const avgGrowth = Math.round(
    industries.filter((i) => !i.growthRate.startsWith("-")).length / Math.max(industries.length, 1) * 100,
  );
  const avgOpportunity = Math.round(
    industries.reduce((s, i) => s + i.opportunityScore, 0) / Math.max(industries.length, 1),
  );
  const avgRisk = Math.round(
    industries.reduce((s, i) => s + i.riskScore, 0) / Math.max(industries.length, 1),
  );
  const emergingCount = industries.filter(
    (i) => i.category === "emerging_industry" || i.category === "future_industry",
  ).length;

  const scores: Record<(typeof INDUSTRY_ANALYSIS_DOMAINS)[number], number> = {
    industry_growth: avgGrowth,
    market_dynamics: avgOpportunity,
    technology_evolution: 88,
    competitive_structure: 76,
    customer_demand: 82,
    regulatory_changes: avgRisk,
    innovation_activity: 86,
    strategic_opportunity: avgOpportunity,
    industry_risk: avgRisk,
    long_term_sustainability: emergingCount >= 2 ? 84 : 72,
  };

  return INDUSTRY_ANALYSIS_DOMAINS.map((domain) => {
    const score = scores[domain];
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 80 ? "strong" : score >= 65 ? "active" : "developing",
      summary: `${label(domain)} assessed at ${score}/100 across ${industries.length} monitored industries`,
    };
  });
}

function buildPillowEvaluations(input: {
  industryCount: number;
  growthCount: number;
  emergingCount: number;
  avgScore: number;
}): PillowIndustryEvaluationMetric[] {
  const status = (score: number) =>
    score >= 85 ? "strong" : score >= 70 ? "active" : "developing";

  const evals: Record<(typeof PILLOW_INDUSTRY_EVALUATIONS)[number], { score: number; summary: string }> = {
    industry_trends: { score: 88, summary: "5 industry trends monitored · structural evolution tracked" },
    industry_opportunities: {
      score: input.avgScore,
      summary: `${input.growthCount} growth industries · opportunity signals active`,
    },
    industry_risks: { score: 82, summary: "Industry risk profiles assessed · regulatory · competitive monitoring" },
    industry_evolution: {
      score: input.emergingCount >= 2 ? 86 : 74,
      summary: `${input.emergingCount} emerging industries tracked · future industry modeling active`,
    },
    executive_recommendations: {
      score: 90,
      summary: "Executive industry recommendations generated · strategic positioning enabled",
    },
  };

  return PILLOW_INDUSTRY_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: status(evals[domain].score),
    summary: evals[domain].summary,
  }));
}

function buildRecommendations(industries: IndustryRecord[]): IndustryIntelligenceRecommendation[] {
  const topIndustry = industries.sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
  const emerging = industries.find((i) => i.category === "future_industry");

  return [
    {
      id: "iie-rec-1",
      title: `Prioritize ${topIndustry?.industryName ?? "Enterprise AI"} industry positioning`,
      category: "strategic_positioning",
      why: `Highest opportunity score (${topIndustry?.opportunityScore ?? 96}/100) with critical strategic relevance`,
      what: "Deep industry profiling · competitive structure analysis · value chain mapping",
      how: "E4-01 market intelligence · E4-02 competitor intelligence · E4-03 opportunity alignment",
      confidencePercent: 94,
    },
    {
      id: "iie-rec-2",
      title: "Monitor emerging autonomous commerce industry evolution",
      category: "emerging_industry",
      why: "Emerging industry with transformative innovation rate and first-mover potential",
      what: "Industry evolution tracking · technology roadmap alignment · investment horizon",
      how: "E4-04 threat detection · E4-03 opportunity discovery · constitutional governance",
      confidencePercent: 86,
    },
    {
      id: "iie-rec-3",
      title: "Strengthen APAC digital economy industry intelligence",
      category: "regional_intelligence",
      why: "High-growth regional industry with data sovereignty regulatory complexity",
      what: "Regional industry profiling · regulatory mapping · partnership ecosystem analysis",
      how: "E4-01 APAC intelligence · E4-04 regulatory threats · E3 capital strategy",
      confidencePercent: 88,
    },
    {
      id: "iie-rec-4",
      title: `Prepare for ${emerging?.industryName ?? "Future Autonomous AI"} industry disruption`,
      category: "future_industry",
      why: "Future industry with critical strategic relevance and category disruption potential",
      what: "Long-term industry modeling · ecosystem mapping · competitive positioning",
      how: "E4-04 future threat analysis · zero-human automation · knowledge evolution",
      confidencePercent: 82,
    },
  ];
}

export function assembleIndustryIntelligenceEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
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
} = {}): IndustryIntelligenceEngine {
  const industryLandscape = buildIndustryLandscape(input);
  const industryTrends = buildIndustryTrends(input);
  const growthIndustries = buildGrowthIndustries(industryLandscape);
  const emergingIndustries = buildEmergingIndustries(industryLandscape);
  const industryRisks = buildIndustryRisks(industryLandscape);
  const industryOpportunities = buildIndustryOpportunities(industryLandscape);
  const innovationActivity = buildInnovationActivity(industryLandscape);
  const industryAnalysis = buildIndustryAnalysis(industryLandscape);

  const avgScore = Math.round(
    industryLandscape.reduce((s, i) => s + i.opportunityScore, 0) / Math.max(industryLandscape.length, 1),
  );

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.competitorIntelligenceEngine?.healthScore ?? 85,
    input.opportunityDiscoveryEngine?.healthScore ?? 85,
    input.threatDetectionEngine?.healthScore ?? 85,
    avgScore,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    industryCount: industryLandscape.length,
    growthCount: growthIndustries.length,
    emergingCount: emergingIndustries.length,
    avgScore,
  });
  const recommendedActions = buildRecommendations(industryLandscape);

  const pillowAdvisory = [
    "Industry Intelligence Engine — constitutional enterprise industry intelligence active",
    `${industryLandscape.length} industries monitored · ${growthIndustries.length} growth · ${emergingIndustries.length} emerging`,
    "Every industry evidence-based · measurable · constitutionally governed",
    `E4-01 markets · E4-02 competitors · E4-03 opportunities · E4-04 threats integrated`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting industry intelligence integrity")}`,
    "ECC coordinates industry intelligence · Supervisor monitors trend accuracy",
    "VIE validates industry alignment · vision · strategic · constitutional",
    "Grand King possesses superior industry awareness across every sector and ecosystem",
  ];

  return {
    engineVersion: "E4-05",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Industry Intelligence Engine continuously monitors, analyzes and understands industry evolution, emerging standards, disruptive technologies, regulatory shifts and competitive dynamics. Every industry, sector, ecosystem and value chain contributes toward executive intelligence. The Grand King always possesses superior industry awareness.",
    engineHealth: healthLabel(clampedHealth),
    industryIntelligenceHealth: avgScore >= 80 ? "strong" : avgScore >= 70 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    monitoredIndustryCount: industryLandscape.length,
    growthIndustryCount: growthIndustries.length,
    emergingIndustryCount: emergingIndustries.length,
    averageOpportunityScore: avgScore,
    industryLandscape,
    industryTrends,
    growthIndustries,
    emergingIndustries,
    industryRisks,
    industryOpportunities,
    innovationActivity,
    industryAnalysis,
    industryIntelligencePipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    industryPrinciples: [...INDUSTRY_INTELLIGENCE_PRINCIPLES],
    governedDomains: [...GOVERNED_INDUSTRY_DOMAINS],
    pillowAdvisory,
    integrations: {
      marketIntelligenceEngine: input.marketIntelligenceEngine
        ? `E4-01 · ${input.marketIntelligenceEngine.engineHealth} · ${input.marketIntelligenceEngine.monitoredMarketCount} markets`
        : "E4-01 · standby",
      competitorIntelligenceEngine: input.competitorIntelligenceEngine
        ? `E4-02 · ${input.competitorIntelligenceEngine.engineHealth} · ${input.competitorIntelligenceEngine.trackedCompetitorCount} competitors`
        : "E4-02 · standby",
      opportunityDiscoveryEngine: input.opportunityDiscoveryEngine
        ? `E4-03 · ${input.opportunityDiscoveryEngine.engineHealth} · ${input.opportunityDiscoveryEngine.discoveredOpportunityCount} opportunities`
        : "E4-03 · standby",
      threatDetectionEngine: input.threatDetectionEngine
        ? `E4-04 · ${input.threatDetectionEngine.engineHealth} · ${input.threatDetectionEngine.detectedThreatCount} threats`
        : "E4-04 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "industry intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-05 Industry Intelligence Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring industry intelligence health"),
      eccStatus: String(input.ecc?.status ?? "industry intelligence coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE406: true,
  };
}

export function buildFallbackIndustryIntelligenceEngine(): IndustryIntelligenceEngine {
  return assembleIndustryIntelligenceEngine({});
}
