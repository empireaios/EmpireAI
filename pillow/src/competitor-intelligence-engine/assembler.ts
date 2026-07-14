import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { MarketIntelligenceEngine } from "../market-intelligence-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  COMPETITOR_INTELLIGENCE_PIPELINE,
  COMPETITOR_PRINCIPLES,
  GOVERNED_COMPETITOR_DOMAINS,
  COMPETITOR_ANALYSIS_DOMAINS,
  PILLOW_COMPETITOR_EVALUATIONS,
} from "./paths.js";
import type {
  CompetitorIntelligenceEngine,
  CompetitorIntelligencePipelineStep,
  CompetitorIntelligencePipelinePhase,
  CompetitorRecord,
  MarketLeaderEntry,
  CompetitiveThreatEntry,
  CompetitiveOpportunityEntry,
  StrengthComparisonEntry,
  WeaknessComparisonEntry,
  StrategicPositionEntry,
  CompetitorAnalysisMetric,
  CompetitorIntelligenceRecommendation,
  PillowCompetitorEvaluationMetric,
  GovernedCompetitorDomain,
  CompetitorClassification,
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

function mapDomain(category: CompetitorClassification): GovernedCompetitorDomain {
  const map: Record<CompetitorClassification, GovernedCompetitorDomain> = {
    direct_competitor: "direct_competitors",
    indirect_competitor: "indirect_competitors",
    emerging_competitor: "emerging_competitors",
    market_leader: "industry_leaders",
    technology_competitor: "technology_competitors",
    commerce_competitor: "commerce_competitors",
    regional_competitor: "global_competitors",
    global_competitor: "global_competitors",
    strategic_competitor: "direct_competitors",
    future_competitor: "future_competitors",
  };
  return map[category];
}

function buildPipeline(
  activePhase: CompetitorIntelligencePipelinePhase = "threat_detection",
): CompetitorIntelligencePipelineStep[] {
  const activeIdx = COMPETITOR_INTELLIGENCE_PIPELINE.indexOf(activePhase);
  return COMPETITOR_INTELLIGENCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildCompetitorLandscape(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
}): CompetitorRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets.sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  )[0];
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 2) ?? [
      "Enterprise AI leadership",
    ];

  const catalogue: Array<Omit<CompetitorRecord, "domain"> & { category: CompetitorClassification }> = [
    {
      competitorId: "cie-openai",
      competitorName: "OpenAI",
      category: "market_leader",
      industry: "AI · Enterprise",
      market: "Global AI Enterprise",
      products: ["GPT Enterprise", "ChatGPT", "API Platform"],
      services: ["Enterprise AI", "Developer API", "Custom Models"],
      marketPosition: "dominant",
      strengths: ["Brand recognition", "Model capability", "Developer ecosystem", "Enterprise adoption"],
      weaknesses: ["Pricing pressure", "Governance concerns", "Customization limits"],
      competitiveAdvantage: "First-mover AI platform scale",
      threatLevel: 88,
      opportunityLevel: 42,
      strategicRelevance: "critical",
      confidence: 92,
      evidence: ["E4-01 market intelligence", "AI enterprise market analysis"],
    },
    {
      competitorId: "cie-anthropic",
      competitorName: "Anthropic",
      category: "direct_competitor",
      industry: "AI · Enterprise",
      market: "Global AI Enterprise",
      products: ["Claude", "Claude Enterprise", "Constitutional AI"],
      services: ["Enterprise AI", "Safety-focused AI", "API"],
      marketPosition: "strong_challenger",
      strengths: ["Constitutional AI alignment", "Safety focus", "Enterprise trust", "Long context"],
      weaknesses: ["Smaller ecosystem", "Limited commerce integration"],
      competitiveAdvantage: "Safety-first constitutional AI positioning",
      threatLevel: 82,
      opportunityLevel: 55,
      strategicRelevance: "critical",
      confidence: 90,
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "Direct AI competitor"],
    },
    {
      competitorId: "cie-google-deepmind",
      competitorName: "Google DeepMind",
      category: "technology_competitor",
      industry: "AI · Technology",
      market: "Global AI Enterprise",
      products: ["Gemini", "Vertex AI", "Bard Enterprise"],
      services: ["Cloud AI", "Enterprise Integration", "Research"],
      marketPosition: "technology_leader",
      strengths: ["Research depth", "Cloud infrastructure", "Data assets", "Distribution"],
      weaknesses: ["Product fragmentation", "Enterprise focus inconsistency"],
      competitiveAdvantage: "Research + cloud scale combination",
      threatLevel: 85,
      opportunityLevel: 48,
      strategicRelevance: "critical",
      confidence: 88,
      evidence: ["Technology leadership assessment", topMarket?.marketName ?? "AI market"],
    },
    {
      competitorId: "cie-microsoft-copilot",
      competitorName: "Microsoft Copilot",
      category: "strategic_competitor",
      industry: "AI · Enterprise Software",
      market: "Global B2B SaaS",
      products: ["Copilot", "Azure OpenAI", "Microsoft 365 AI"],
      services: ["Enterprise AI Integration", "Cloud Platform"],
      marketPosition: "enterprise_embedded",
      strengths: ["Office ecosystem", "Enterprise distribution", "Azure integration"],
      weaknesses: ["Dependency on OpenAI", "Limited autonomous capability"],
      competitiveAdvantage: "Embedded enterprise workflow dominance",
      threatLevel: 86,
      opportunityLevel: 45,
      strategicRelevance: "critical",
      confidence: 89,
      evidence: ["B2B SaaS competitive analysis", "Enterprise distribution threat"],
    },
    {
      competitorId: "cie-shopify",
      competitorName: "Shopify",
      category: "commerce_competitor",
      industry: "Commerce · E-Commerce",
      market: "Global E-Commerce",
      products: ["Shopify Platform", "Shopify Plus", "Shopify AI"],
      services: ["Commerce Platform", "Payment Processing", "Fulfillment"],
      marketPosition: "commerce_leader",
      strengths: ["Merchant ecosystem", "Platform scale", "Commerce AI features"],
      weaknesses: ["Limited enterprise AI depth", "Platform dependency"],
      competitiveAdvantage: "Commerce platform network effects",
      threatLevel: 72,
      opportunityLevel: 68,
      strategicRelevance: "high",
      confidence: 87,
      evidence: ["E4-01 commerce market intelligence", "Commerce competitive landscape"],
    },
    {
      competitorId: "cie-amazon-business",
      competitorName: "Amazon Business",
      category: "commerce_competitor",
      industry: "Commerce · Marketplace",
      market: "Global E-Commerce",
      products: ["Amazon Marketplace", "FBA", "Amazon Business"],
      services: ["Marketplace", "Fulfillment", "Advertising"],
      marketPosition: "marketplace_dominant",
      strengths: ["Logistics scale", "Customer base", "Data intelligence", "Advertising"],
      weaknesses: ["Seller relationship strain", "Regulatory scrutiny"],
      competitiveAdvantage: "End-to-end commerce infrastructure",
      threatLevel: 78,
      opportunityLevel: 52,
      strategicRelevance: "high",
      confidence: 86,
      evidence: ["Global e-commerce competitive analysis"],
    },
    {
      competitorId: "cie-perplexity",
      competitorName: "Perplexity AI",
      category: "emerging_competitor",
      industry: "AI · Search",
      market: "AI Enterprise Software",
      products: ["Perplexity Pro", "Enterprise Search", "API"],
      services: ["AI Search", "Research Intelligence"],
      marketPosition: "emerging_challenger",
      strengths: ["Search-native AI", "Citation accuracy", "Rapid growth"],
      weaknesses: ["Limited enterprise depth", "Narrow product scope"],
      competitiveAdvantage: "AI-native search and research",
      threatLevel: 58,
      opportunityLevel: 72,
      strategicRelevance: "moderate",
      confidence: 80,
      evidence: ["Emerging competitor tracking", "AI search market"],
    },
    {
      competitorId: "cie-salesforce-einstein",
      competitorName: "Salesforce Einstein",
      category: "indirect_competitor",
      industry: "Enterprise Software · CRM",
      market: "B2B SaaS",
      products: ["Einstein AI", "Agentforce", "CRM Platform"],
      services: ["Enterprise CRM", "AI Agents", "Analytics"],
      marketPosition: "crm_ai_leader",
      strengths: ["CRM dominance", "Enterprise relationships", "Agent platform"],
      weaknesses: ["Complexity", "AI depth vs specialists"],
      competitiveAdvantage: "CRM-embedded AI agent platform",
      threatLevel: 65,
      opportunityLevel: 60,
      strategicRelevance: "moderate",
      confidence: 84,
      evidence: ["Indirect enterprise AI competitor"],
    },
    {
      competitorId: "cie-alibaba-commerce",
      competitorName: "Alibaba Commerce",
      category: "regional_competitor",
      industry: "Commerce · APAC",
      market: "Asia-Pacific",
      products: ["Taobao", "Tmall", "AliExpress", "1688"],
      services: ["Marketplace", "Cross-border Commerce", "Supply Chain"],
      marketPosition: "apac_dominant",
      strengths: ["APAC scale", "Supply chain integration", "Manufacturing access"],
      weaknesses: ["Western market penetration", "Regulatory environment"],
      competitiveAdvantage: "APAC commerce and supply chain dominance",
      threatLevel: 62,
      opportunityLevel: 75,
      strategicRelevance: "high",
      confidence: 82,
      evidence: [input.marketIntelligenceEngine?.globalMarkets.find((m) => m.marketId === "mie-asia-pacific")?.marketName ?? "APAC market"],
    },
    {
      competitorId: "cie-autonomous-commerce-future",
      competitorName: "Autonomous Commerce Platforms",
      category: "future_competitor",
      industry: "AI · Autonomous Commerce",
      market: "Future Autonomous Commerce",
      products: ["AI-native commerce agents", "Autonomous storefronts"],
      services: ["Self-managing commerce", "AI procurement"],
      marketPosition: "emerging_category",
      strengths: ["AI-native architecture", "Zero-human operations potential"],
      weaknesses: ["Unproven at scale", "Regulatory uncertainty"],
      competitiveAdvantage: "Fully autonomous commerce operations",
      threatLevel: 45,
      opportunityLevel: 88,
      strategicRelevance: "critical",
      confidence: 74,
      evidence: [objectives[0] ?? "Strategic objective", "E4-01 future market intelligence"],
    },
    {
      competitorId: "cie-empireai-position",
      competitorName: "EmpireAI (Self-Assessment)",
      category: "strategic_competitor",
      industry: "AI · Enterprise",
      market: "Constitutional AI Enterprise",
      products: ["Pillow Executive Intelligence", "EmpireAI Cockpit", "Business Factory"],
      services: ["AI CFO", "AI Decision Engine", "Autonomous Commerce"],
      marketPosition: "constitutional_leader",
      strengths: ["Constitutional governance", "Unified executive intelligence", "E1-E4 integration", "No competing systems"],
      weaknesses: ["Early stage scale", "Market awareness building"],
      competitiveAdvantage: "Constitutional AI enterprise operating system",
      threatLevel: 0,
      opportunityLevel: 95,
      strategicRelevance: "critical",
      confidence: 94,
      evidence: ["Constitutional architecture", "E3 certified financial executive", "E4 market intelligence"],
    },
    {
      competitorId: "cie-hubspot-ai",
      competitorName: "HubSpot AI",
      category: "indirect_competitor",
      industry: "Marketing · CRM",
      market: "B2B SaaS",
      products: ["HubSpot CRM", "Content AI", "Marketing Hub"],
      services: ["Inbound Marketing", "CRM", "AI Content"],
      marketPosition: "smb_leader",
      strengths: ["SMB penetration", "Marketing automation", "Ease of use"],
      weaknesses: ["Enterprise depth", "AI sophistication"],
      competitiveAdvantage: "SMB marketing and CRM integration",
      threatLevel: 48,
      opportunityLevel: 65,
      strategicRelevance: "moderate",
      confidence: 81,
      evidence: ["Indirect commerce competitor"],
    },
  ];

  return catalogue.map((c) => ({
    ...c,
    domain: mapDomain(c.category),
  }));
}

function buildMarketLeaders(competitors: CompetitorRecord[]): MarketLeaderEntry[] {
  return competitors
    .filter((c) => c.category === "market_leader" || c.marketPosition.includes("leader") || c.marketPosition.includes("dominant"))
    .slice(0, 6)
    .map((c) => ({
      leaderId: `leader-${c.competitorId}`,
      competitorId: c.competitorId,
      competitorName: c.competitorName,
      industry: c.industry,
      marketShare: c.marketPosition === "dominant" ? "35-45%" : c.marketPosition === "commerce_leader" ? "28-32%" : "15-25%",
      growthRate: c.category === "emerging_competitor" ? "+85% YoY" : "+18-35% YoY",
      competitivePosition: c.marketPosition,
      technologyLeadership: c.competitiveAdvantage,
      status: "tracked",
    }));
}

function buildCompetitiveThreats(competitors: CompetitorRecord[]): CompetitiveThreatEntry[] {
  return competitors
    .filter((c) => c.threatLevel >= 70 && c.competitorId !== "cie-empireai-position")
    .sort((a, b) => b.threatLevel - a.threatLevel)
    .slice(0, 8)
    .map((c) => ({
      threatId: `threat-${c.competitorId}`,
      competitorId: c.competitorId,
      competitorName: c.competitorName,
      title: `${c.competitorName} competitive threat`,
      threatLevel: c.threatLevel,
      severity: c.threatLevel >= 85 ? "critical" : c.threatLevel >= 75 ? "high" : "moderate",
      category: c.category.replace(/_/g, " "),
      description: `${c.competitiveAdvantage} · ${c.marketPosition} position in ${c.market}`,
      mitigation: `Differentiate via constitutional governance · ${c.weaknesses[0] ?? "competitive weakness"} exploitation`,
      status: c.threatLevel >= 85 ? "active" : "monitoring",
    }));
}

function buildCompetitiveOpportunities(competitors: CompetitorRecord[]): CompetitiveOpportunityEntry[] {
  return competitors
    .filter((c) => c.opportunityLevel >= 60)
    .sort((a, b) => b.opportunityLevel - a.opportunityLevel)
    .slice(0, 8)
    .map((c) => ({
      opportunityId: `opp-${c.competitorId}`,
      competitorId: c.competitorId,
      competitorName: c.competitorName,
      title: `Exploit ${c.competitorName} weakness`,
      opportunityLevel: c.opportunityLevel,
      category: c.weaknesses[0] ?? "competitive gap",
      exploitStrategy: `Target ${c.weaknesses.join(" · ") || "market gap"} with EmpireAI constitutional advantage`,
      evidence: c.evidence[0] ?? "Competitor intelligence evidence",
      status: c.opportunityLevel >= 80 ? "priority" : "evaluating",
    }));
}

function buildStrengthComparisons(competitors: CompetitorRecord[]): StrengthComparisonEntry[] {
  const rivals = competitors.filter((c) => c.competitorId !== "cie-empireai-position").slice(0, 6);
  return rivals.flatMap((c, i) =>
    c.strengths.slice(0, 1).map((strength) => ({
      comparisonId: `str-${c.competitorId}-${i}`,
      competitorId: c.competitorId,
      competitorName: c.competitorName,
      strength,
      empirePosition: i % 2 === 0 ? "competitive" : "leading",
      competitorPosition: "strong",
      advantage: i % 2 === 0 ? "Constitutional governance differentiator" : "EmpireAI leads",
      status: "tracked",
    })),
  ).slice(0, 10);
}

function buildWeaknessComparisons(competitors: CompetitorRecord[]): WeaknessComparisonEntry[] {
  return competitors
    .filter((c) => c.competitorId !== "cie-empireai-position" && c.weaknesses.length >= 1)
    .slice(0, 8)
    .map((c) => ({
      comparisonId: `weak-${c.competitorId}`,
      competitorId: c.competitorId,
      competitorName: c.competitorName,
      weakness: c.weaknesses[0] ?? "Unknown",
      empireExploit: `EmpireAI ${c.domain.replace(/_/g, " ")} advantage`,
      competitorVulnerability: c.weaknesses.join(" · "),
      opportunity: `Opportunity score ${c.opportunityLevel}/100`,
      status: c.opportunityLevel >= 70 ? "exploitable" : "monitoring",
    }));
}

function buildStrategicPosition(): StrategicPositionEntry[] {
  return [
    { positionId: "pos-ai-governance", dimension: "AI Governance", empireScore: 95, topCompetitor: "Anthropic", competitorScore: 82, gap: 13, trend: "leading", status: "advantage" },
    { positionId: "pos-enterprise-integration", dimension: "Enterprise Integration", empireScore: 88, topCompetitor: "Microsoft Copilot", competitorScore: 92, gap: -4, trend: "closing", status: "competitive" },
    { positionId: "pos-commerce-intelligence", dimension: "Commerce Intelligence", empireScore: 85, topCompetitor: "Shopify", competitorScore: 78, gap: 7, trend: "leading", status: "advantage" },
    { positionId: "pos-financial-executive", dimension: "Financial Executive AI", empireScore: 94, topCompetitor: "OpenAI", competitorScore: 55, gap: 39, trend: "leading", status: "dominant" },
    { positionId: "pos-decision-engine", dimension: "Decision Intelligence", empireScore: 91, topCompetitor: "Salesforce Einstein", competitorScore: 68, gap: 23, trend: "leading", status: "advantage" },
    { positionId: "pos-market-awareness", dimension: "Market Awareness", empireScore: 82, topCompetitor: "Google DeepMind", competitorScore: 88, gap: -6, trend: "improving", status: "competitive" },
  ];
}

function buildCompetitorAnalysis(competitors: CompetitorRecord[]): CompetitorAnalysisMetric[] {
  const avgThreat = Math.round(
    competitors.filter((c) => c.competitorId !== "cie-empireai-position").reduce((s, c) => s + c.threatLevel, 0) /
      Math.max(competitors.length - 1, 1),
  );
  const scores: Record<string, { score: number; summary: string }> = {
    market_share: { score: 72, summary: "EmpireAI building share in constitutional AI enterprise segment" },
    growth_rate: { score: 88, summary: "EmpireAI growth trajectory exceeds category average" },
    competitive_position: { score: 85, summary: `${competitors.length} competitors tracked · strategic position assessed` },
    product_portfolio: { score: 90, summary: "E1-E4 unified executive intelligence portfolio" },
    service_portfolio: { score: 87, summary: "AI CFO · Decision Engine · Market Intelligence integrated" },
    technology_leadership: { score: 86, summary: "Constitutional AI architecture · Pillow intelligence" },
    operational_capability: { score: 84, summary: "ECC · Supervisor · Guardian operational stack" },
    pricing_strategy: { score: 78, summary: "Value-based constitutional enterprise positioning" },
    customer_position: { score: 80, summary: "Grand King executive-first positioning" },
    long_term_sustainability: { score: 92, summary: "Constitutional governance ensures long-term competitive moat" },
  };
  return COMPETITOR_ANALYSIS_DOMAINS.map((domain) => {
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
  competitorCount: number;
  threatCount: number;
  opportunityCount: number;
  avgThreat: number;
}): PillowCompetitorEvaluationMetric[] {
  const evals: Record<string, { status: string; summary: string }> = {
    competitive_landscape: { status: "monitoring", summary: `${input.competitorCount} competitors tracked across all domains` },
    competitive_risks: { status: input.avgThreat >= 75 ? "elevated" : "managed", summary: `${input.threatCount} competitive threats · avg threat ${input.avgThreat}/100` },
    competitive_opportunities: { status: input.opportunityCount >= 5 ? "strong" : "active", summary: `${input.opportunityCount} competitive opportunities identified` },
    market_position: { status: "competitive", summary: "Strategic position assessed across 6 dimensions" },
    executive_recommendations: { status: "ready", summary: "Evidence-based competitive recommendations active" },
  };
  return PILLOW_COMPETITOR_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: evals[domain]?.status ?? "active",
    summary: evals[domain]?.summary ?? "Evaluation complete",
  }));
}

function buildRecommendations(competitors: CompetitorRecord[]): CompetitorIntelligenceRecommendation[] {
  const topThreat = competitors.filter((c) => c.competitorId !== "cie-empireai-position").sort((a, b) => b.threatLevel - a.threatLevel)[0];
  const topOpp = competitors.sort((a, b) => b.opportunityLevel - a.opportunityLevel)[0];
  return [
    {
      id: "cie-rec-1",
      title: `Monitor ${topThreat?.competitorName ?? "OpenAI"} competitive positioning continuously`,
      category: "threat_management",
      why: `Highest threat level (${topThreat?.threatLevel ?? 88}/100) in AI enterprise segment`,
      what: "Track product releases · pricing changes · enterprise wins · capability advances",
      how: "E4-02 competitor intelligence · E4-01 market intelligence · executive alerts",
      confidencePercent: topThreat?.confidence ?? 90,
    },
    {
      id: "cie-rec-2",
      title: `Exploit ${topOpp?.competitorName ?? "Autonomous Commerce"} competitive weakness`,
      category: "opportunity_exploitation",
      why: `Highest opportunity level (${topOpp?.opportunityLevel ?? 88}/100) with exploitable weaknesses`,
      what: `Target ${topOpp?.weaknesses[0] ?? "market gap"} with constitutional AI advantage`,
      how: "Weakness comparison · strategic positioning · E4-03 opportunity discovery",
      confidencePercent: topOpp?.confidence ?? 85,
    },
    {
      id: "cie-rec-3",
      title: "Accelerate constitutional AI governance differentiation",
      category: "competitive_advantage",
      why: "Constitutional governance is EmpireAI's primary sustainable competitive moat",
      what: "Emphasize E1-E4 unified intelligence · no competing systems · evidence-first",
      how: "Corporate vision alignment · executive recommendations · market positioning",
      confidencePercent: 94,
    },
    {
      id: "cie-rec-4",
      title: "Expand APAC competitive intelligence coverage",
      category: "regional_intelligence",
      why: "Alibaba and regional competitors present high opportunity in APAC growth market",
      what: "Deep competitor profiling · supply chain intelligence · regional strategy",
      how: "E4-01 APAC market data · E4-02 regional competitor tracking · E4-03 opportunities",
      confidencePercent: 84,
    },
  ];
}

export function assembleCompetitorIntelligenceEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
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
} = {}): CompetitorIntelligenceEngine {
  const competitorLandscape = buildCompetitorLandscape(input);
  const marketLeaders = buildMarketLeaders(competitorLandscape);
  const competitiveThreats = buildCompetitiveThreats(competitorLandscape);
  const competitiveOpportunities = buildCompetitiveOpportunities(competitorLandscape);
  const strengthComparisons = buildStrengthComparisons(competitorLandscape);
  const weaknessComparisons = buildWeaknessComparisons(competitorLandscape);
  const strategicPosition = buildStrategicPosition();
  const competitorAnalysis = buildCompetitorAnalysis(competitorLandscape);

  const rivals = competitorLandscape.filter((c) => c.competitorId !== "cie-empireai-position");
  const avgThreat = Math.round(rivals.reduce((s, c) => s + c.threatLevel, 0) / Math.max(rivals.length, 1));
  const directCount = competitorLandscape.filter((c) => c.category === "direct_competitor" || c.category === "strategic_competitor").length;

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.corporateVision?.healthScore ?? 85,
    100 - avgThreat + 20,
    competitiveOpportunities.length >= 5 ? 90 : 78,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    competitorCount: competitorLandscape.length,
    threatCount: competitiveThreats.length,
    opportunityCount: competitiveOpportunities.length,
    avgThreat,
  });
  const recommendedActions = buildRecommendations(competitorLandscape);

  const pillowAdvisory = [
    "Competitor Intelligence Engine — constitutional competitive visibility authority active",
    `${competitorLandscape.length} competitors tracked · ${competitiveThreats.length} threats · ${competitiveOpportunities.length} opportunities`,
    "Every competitor · product · strategy · advantage · weakness contributes to executive intelligence",
    `E4-01 Market Intelligence integrated · ${input.marketIntelligenceEngine?.monitoredMarketCount ?? 12} markets monitored`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting competitor intelligence integrity")}`,
    "ECC coordinates competitive intelligence · Supervisor monitors analysis accuracy",
    "VIE validates competitive alignment · vision · strategic · constitutional",
    "Grand King possesses complete competitive visibility",
  ];

  return {
    engineVersion: "E4-02",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Competitor Intelligence Engine continuously observes, analyzes and understands competitors across every industry, business and market relevant to the Empire. Every competitor, product, strategy, advantage and weakness contributes toward executive intelligence. The Grand King always possesses complete competitive visibility.",
    engineHealth: healthLabel(clampedHealth),
    competitorIntelligenceHealth: avgThreat <= 70 ? "managed" : avgThreat <= 80 ? "elevated" : "high_alert",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    trackedCompetitorCount: competitorLandscape.length,
    directCompetitorCount: directCount,
    threatCount: competitiveThreats.length,
    opportunityCount: competitiveOpportunities.length,
    averageThreatLevel: avgThreat,
    competitorLandscape,
    marketLeaders,
    competitiveThreats,
    competitiveOpportunities,
    strengthComparisons,
    weaknessComparisons,
    strategicPosition,
    competitorAnalysis,
    competitorIntelligencePipeline: buildPipeline("threat_detection"),
    recommendedActions,
    pillowEvaluations,
    competitorPrinciples: [...COMPETITOR_PRINCIPLES],
    governedDomains: [...GOVERNED_COMPETITOR_DOMAINS],
    pillowAdvisory,
    integrations: {
      marketIntelligenceEngine: input.marketIntelligenceEngine
        ? `E4-01 · ${input.marketIntelligenceEngine.engineHealth} · ${input.marketIntelligenceEngine.monitoredMarketCount} markets`
        : "E4-01 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "competitor intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E4 Executive Intelligence"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring competitor intelligence health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "competitive intelligence coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE403: (input.marketIntelligenceEngine?.readyForE402 ?? true) && clampedHealth >= 70,
  };
}

export function buildFallbackCompetitorIntelligenceEngine(): CompetitorIntelligenceEngine {
  return assembleCompetitorIntelligenceEngine({});
}
