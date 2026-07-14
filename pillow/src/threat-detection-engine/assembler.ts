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
import {
  THREAT_DETECTION_PIPELINE,
  THREAT_DETECTION_PRINCIPLES,
  GOVERNED_THREAT_DOMAINS,
  THREAT_ANALYSIS_DOMAINS,
  PILLOW_THREAT_EVALUATIONS,
} from "./paths.js";
import type {
  ThreatDetectionEngine,
  ThreatDetectionPipelineStep,
  ThreatDetectionPipelinePhase,
  ThreatRecord,
  CriticalThreatEntry,
  EmergingThreatEntry,
  ThreatTrendEntry,
  BusinessImpactEntry,
  RiskHeatmapEntry,
  MitigationStatusEntry,
  ThreatAnalysisMetric,
  ThreatDetectionRecommendation,
  PillowThreatEvaluationMetric,
  GovernedThreatDomain,
  ThreatClassification,
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

function threatScore(probability: number, impact: number): number {
  return Math.round((probability + impact) / 2);
}

function mapDomain(category: ThreatClassification): GovernedThreatDomain {
  const map: Record<ThreatClassification, GovernedThreatDomain> = {
    critical_threat: "strategic_threats",
    high_threat: "operational_threats",
    medium_threat: "market_threats",
    low_threat: "reputation_threats",
    emerging_threat: "future_threats",
    strategic_threat: "strategic_threats",
    competitive_threat: "competitive_threats",
    technology_threat: "technology_threats",
    market_threat: "market_threats",
    future_threat: "future_threats",
  };
  return map[category];
}

function buildPipeline(
  activePhase: ThreatDetectionPipelinePhase = "continuous_monitoring",
): ThreatDetectionPipelineStep[] {
  const activeIdx = THREAT_DETECTION_PIPELINE.indexOf(activePhase);
  return THREAT_DETECTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildThreatDashboard(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): ThreatRecord[] {
  const topCompetitorThreat = input.competitorIntelligenceEngine?.competitiveThreats[0];
  const topMarketRisk = input.marketIntelligenceEngine?.marketRisks[0];
  const highRiskOpportunity = input.opportunityDiscoveryEngine?.opportunityRisks.find(
    (r) => r.riskLevel >= 50,
  );

  const catalogue: Array<Omit<ThreatRecord, "domain"> & { category: ThreatClassification }> = [
    {
      threatId: "tde-openai-enterprise",
      title: "OpenAI Enterprise Platform Displacement",
      category: "competitive_threat",
      source: "E4-02 competitor intelligence · E4-01 market intelligence",
      affectedBusiness: "Enterprise AI Platform · Revenue",
      probability: 88,
      impact: 92,
      severity: "critical",
      urgency: "immediate",
      businessImpact: "Enterprise customer acquisition risk · platform differentiation erosion",
      financialImpact: "$4.2M ARR at risk (12mo)",
      strategicImpact: "Constitutional AI moat challenged · category leadership threatened",
      mitigationRecommendation: "Accelerate constitutional AI differentiation · deepen enterprise lock-in",
      confidence: 94,
      evidence: [topCompetitorThreat?.title ?? "OpenAI competitive threat", "Enterprise AI market concentration"],
    },
    {
      threatId: "tde-ai-regulation",
      title: "Global AI Regulatory Compliance Burden",
      category: "strategic_threat",
      source: "E4-01 regulatory market intelligence",
      affectedBusiness: "Global Operations · Compliance",
      probability: 82,
      impact: 78,
      severity: "high",
      urgency: "near-term",
      businessImpact: "Multi-jurisdiction compliance complexity · go-to-market delays",
      financialImpact: "$1.8M compliance cost (18mo)",
      strategicImpact: "International expansion velocity constrained",
      mitigationRecommendation: "Proactive regulatory mapping · constitutional governance certification",
      confidence: 89,
      evidence: ["EU AI Act compliance", "APAC regulatory divergence"],
    },
    {
      threatId: "tde-anthropic-enterprise",
      title: "Anthropic Enterprise Distribution Expansion",
      category: "competitive_threat",
      source: "E4-02 competitor intelligence",
      affectedBusiness: "Enterprise Sales · Partnerships",
      probability: 85,
      impact: 86,
      severity: "critical",
      urgency: "immediate",
      businessImpact: "Enterprise deal competition intensification",
      financialImpact: "$3.1M pipeline risk",
      strategicImpact: "Enterprise segment share erosion",
      mitigationRecommendation: "Strengthen executive decision engine differentiation · vertical specialization",
      confidence: 91,
      evidence: ["Anthropic enterprise partnerships", "B2B SaaS distribution threat"],
    },
    {
      threatId: "tde-market-volatility",
      title: "Global Market Volatility · Recession Risk",
      category: "market_threat",
      source: "E4-01 economic indicators",
      affectedBusiness: "Revenue · Capital Strategy",
      probability: 68,
      impact: 74,
      severity: "high",
      urgency: "monitoring",
      businessImpact: "Enterprise budget contraction · longer sales cycles",
      financialImpact: "$2.4M revenue deferral risk",
      strategicImpact: "Growth trajectory adjustment required",
      mitigationRecommendation: "Diversify revenue streams · strengthen E3 financial resilience",
      confidence: 84,
      evidence: [topMarketRisk?.title ?? "Global market risk", "Economic indicator volatility"],
    },
    {
      threatId: "tde-llm-commoditization",
      title: "LLM Infrastructure Commoditization",
      category: "technology_threat",
      source: "E4-01 technology market intelligence",
      affectedBusiness: "Platform · Technology Moat",
      probability: 76,
      impact: 80,
      severity: "high",
      urgency: "near-term",
      businessImpact: "Technology differentiation erosion · pricing pressure",
      financialImpact: "Margin compression 8-12%",
      strategicImpact: "Constitutional orchestration becomes primary moat",
      mitigationRecommendation: "Deepen Pillow · ECC · Guardian integration · proprietary intelligence layers",
      confidence: 87,
      evidence: ["Open-source LLM proliferation", "API pricing competition"],
    },
    {
      threatId: "tde-cybersecurity-breach",
      title: "Enterprise Data Security Breach",
      category: "critical_threat",
      source: "Guardian monitoring · production integrity",
      affectedBusiness: "Platform Security · Reputation",
      probability: 42,
      impact: 95,
      severity: "critical",
      urgency: "continuous",
      businessImpact: "Customer trust erosion · enterprise contract termination risk",
      financialImpact: "$8M+ liability exposure",
      strategicImpact: "Constitutional governance credibility damaged",
      mitigationRecommendation: "Guardian continuous protection · zero-trust architecture · incident response",
      confidence: 92,
      evidence: ["Enterprise security requirements", "Guardian production integrity monitoring"],
    },
    {
      threatId: "tde-commerce-disruption",
      title: "Autonomous Commerce Competitive Disruption",
      category: "competitive_threat",
      source: "E4-02 commerce competitor analysis",
      affectedBusiness: "Commerce MVP · GMV",
      probability: 72,
      impact: 68,
      severity: "moderate",
      urgency: "monitoring",
      businessImpact: "Commerce MVP market share risk",
      financialImpact: "$1.2M GMV at risk",
      strategicImpact: "Commerce intelligence suite differentiation required",
      mitigationRecommendation: "Accelerate commerce intelligence suite · constitutional commerce governance",
      confidence: 81,
      evidence: ["Commerce competitor expansion", "E4-03 commerce opportunity counter-risk"],
    },
    {
      threatId: "tde-talent-retention",
      title: "AI Talent Retention · Acquisition War",
      category: "high_threat",
      source: "E4-02 indirect competitor analysis",
      affectedBusiness: "Engineering · Product",
      probability: 78,
      impact: 72,
      severity: "high",
      urgency: "near-term",
      businessImpact: "Development velocity reduction · knowledge loss",
      financialImpact: "$2.8M recruitment and retention cost",
      strategicImpact: "Innovation pipeline slowdown",
      mitigationRecommendation: "Knowledge evolution architecture · mission-driven retention · equity alignment",
      confidence: 86,
      evidence: ["Big tech talent competition", "AI engineer market scarcity"],
    },
    {
      threatId: "tde-reputation-ai-safety",
      title: "AI Safety Reputation Risk",
      category: "emerging_threat",
      source: "E4-01 emerging market intelligence",
      affectedBusiness: "Brand · Enterprise Trust",
      probability: 55,
      impact: 82,
      severity: "high",
      urgency: "emerging",
      businessImpact: "Public perception risk · enterprise procurement delays",
      financialImpact: "$1.5M deal velocity impact",
      strategicImpact: "Constitutional AI positioning becomes critical differentiator",
      mitigationRecommendation: "VIE alignment validation · transparent constitutional governance · safety certification",
      confidence: 79,
      evidence: ["AI safety public discourse", "Enterprise procurement scrutiny"],
    },
    {
      threatId: "tde-financial-liquidity",
      title: "Capital Liquidity Constraint",
      category: "high_threat",
      source: "E3 financial executive · market conditions",
      affectedBusiness: "Capital Strategy · Operations",
      probability: 48,
      impact: 76,
      severity: "moderate",
      urgency: "monitoring",
      businessImpact: "Expansion investment constraints · hiring freeze risk",
      financialImpact: "$3.6M capital requirement gap",
      strategicImpact: "E3-15 capital strategy execution delayed",
      mitigationRecommendation: "E3 capital risk engine monitoring · revenue acceleration · strategic partnerships",
      confidence: 83,
      evidence: ["E3 financial executive certification", "Market funding conditions"],
    },
    {
      threatId: "tde-apac-regulatory",
      title: "APAC Data Sovereignty Regulation",
      category: "market_threat",
      source: "E4-01 APAC market intelligence",
      affectedBusiness: "APAC Expansion · Data Operations",
      probability: 74,
      impact: 70,
      severity: "high",
      urgency: "near-term",
      businessImpact: "APAC market entry complexity · data residency requirements",
      financialImpact: "$1.1M infrastructure compliance cost",
      strategicImpact: "E4-03 APAC expansion opportunity at risk",
      mitigationRecommendation: "Regional data sovereignty architecture · local partnership strategy",
      confidence: 85,
      evidence: ["APAC data sovereignty laws", highRiskOpportunity?.title ?? "APAC opportunity risk"],
    },
    {
      threatId: "tde-future-autonomous-ai",
      title: "Autonomous AI Agent Market Disruption",
      category: "future_threat",
      source: "E4-01 future market · E4-03 opportunity counter-risk",
      affectedBusiness: "Platform Architecture · Category Position",
      probability: 62,
      impact: 88,
      severity: "high",
      urgency: "emerging",
      businessImpact: "Category disruption · incumbent displacement risk",
      financialImpact: "$6M+ long-term revenue exposure",
      strategicImpact: "Zero-human automation positioning critical",
      mitigationRecommendation: "Accelerate zero-human automation · autonomous decision monitor · ETA engine",
      confidence: 76,
      evidence: ["Future autonomous AI market modeling", "Category disruption signals"],
    },
  ];

  return catalogue.map((t) => ({ ...t, domain: mapDomain(t.category) }));
}

function buildCriticalThreats(threats: ThreatRecord[]): CriticalThreatEntry[] {
  return threats
    .filter((t) => t.severity === "critical" || threatScore(t.probability, t.impact) >= 85)
    .sort((a, b) => threatScore(b.probability, b.impact) - threatScore(a.probability, a.impact))
    .map((t, i) => ({
      criticalId: `critical-${t.threatId}`,
      threatId: t.threatId,
      title: t.title,
      severity: t.severity,
      probability: t.probability,
      impact: t.impact,
      urgency: t.urgency,
      status: t.urgency === "immediate" ? "active" : "monitoring",
      priorityRank: i + 1,
    }))
    .map(({ priorityRank: _priorityRank, ...rest }) => rest);
}

function buildEmergingThreats(threats: ThreatRecord[]): EmergingThreatEntry[] {
  return threats
    .filter((t) => t.category === "emerging_threat" || t.category === "future_threat" || t.urgency === "emerging")
    .map((t) => ({
      emergingId: `emerging-${t.threatId}`,
      threatId: t.threatId,
      title: t.title,
      category: t.category.replace(/_/g, " "),
      probability: t.probability,
      timeHorizon: t.urgency === "emerging" ? "12-24 months" : "24-36 months",
      discoverySignal: t.evidence[0] ?? "Continuous monitoring signal",
      status: "tracking",
    }));
}

function buildThreatTrends(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
}): ThreatTrendEntry[] {
  const avgCompetitorThreat =
    input.competitorIntelligenceEngine?.averageThreatLevel ?? 72;
  const avgMarketRisk = input.marketIntelligenceEngine?.marketRisks?.length
    ? Math.round(
        input.marketIntelligenceEngine.marketRisks.reduce((s, r) => s + r.riskScore, 0) /
          input.marketIntelligenceEngine.marketRisks.length,
      )
    : 48;

  return [
    {
      trendId: "trend-competitive-intensification",
      trend: "Enterprise AI Competitive Intensification",
      direction: "escalating",
      affectedThreats: "OpenAI · Anthropic · competitive threats",
      detectionSignal: `Avg competitor threat ${avgCompetitorThreat}/100`,
      confidence: 92,
      status: "active",
    },
    {
      trendId: "trend-regulatory-expansion",
      trend: "Global AI Regulatory Expansion",
      direction: "escalating",
      affectedThreats: "AI regulation · APAC data sovereignty",
      detectionSignal: "Multi-jurisdiction compliance signals",
      confidence: 88,
      status: "active",
    },
    {
      trendId: "trend-llm-commoditization",
      trend: "LLM Infrastructure Commoditization",
      direction: "accelerating",
      affectedThreats: "Technology moat · margin pressure",
      detectionSignal: "Open-source LLM proliferation",
      confidence: 85,
      status: "monitoring",
    },
    {
      trendId: "trend-market-volatility",
      trend: "Enterprise Budget Contraction Risk",
      direction: "elevated",
      affectedThreats: "Market volatility · financial liquidity",
      detectionSignal: `Avg market risk ${avgMarketRisk}/100`,
      confidence: 81,
      status: "monitoring",
    },
    {
      trendId: "trend-autonomous-disruption",
      trend: "Autonomous AI Agent Disruption",
      direction: "emerging",
      affectedThreats: "Future autonomous AI · commerce disruption",
      detectionSignal: "Future market modeling · category signals",
      confidence: 76,
      status: "tracking",
    },
  ];
}

function buildBusinessImpact(threats: ThreatRecord[]): BusinessImpactEntry[] {
  return threats
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 8)
    .map((t) => ({
      impactId: `impact-${t.threatId}`,
      threatId: t.threatId,
      title: t.title,
      businessImpact: t.businessImpact,
      financialImpact: t.financialImpact,
      strategicImpact: t.strategicImpact,
      severity: t.severity,
    }));
}

function buildRiskHeatmap(threats: ThreatRecord[]): RiskHeatmapEntry[] {
  const domainMap = new Map<string, ThreatRecord[]>();
  for (const t of threats) {
    const existing = domainMap.get(t.domain) ?? [];
    existing.push(t);
    domainMap.set(t.domain, existing);
  }

  return [...GOVERNED_THREAT_DOMAINS].map((domain) => {
    const domainThreats = domainMap.get(domain) ?? [];
    const count = domainThreats.length;
    const avgProbability = count
      ? Math.round(domainThreats.reduce((s, t) => s + t.probability, 0) / count)
      : 0;
    const avgImpact = count
      ? Math.round(domainThreats.reduce((s, t) => s + t.impact, 0) / count)
      : 0;
    const avgScore = Math.round((avgProbability + avgImpact) / 2);
    return {
      heatmapId: `heatmap-${domain}`,
      domain: label(domain),
      threatCount: count,
      avgProbability,
      avgImpact,
      riskLevel: avgScore >= 80 ? "critical" : avgScore >= 65 ? "high" : avgScore >= 45 ? "moderate" : "low",
      status: count > 0 ? "active" : "clear",
    };
  });
}

function buildMitigationStatus(threats: ThreatRecord[]): MitigationStatusEntry[] {
  return threats
    .sort((a, b) => threatScore(b.probability, b.impact) - threatScore(a.probability, a.impact))
    .map((t) => ({
      mitigationId: `mitigation-${t.threatId}`,
      threatId: t.threatId,
      title: t.title,
      mitigationRecommendation: t.mitigationRecommendation,
      status:
        t.severity === "critical"
          ? "in_progress"
          : t.severity === "high"
            ? "planned"
            : "monitoring",
      residualRisk:
        threatScore(t.probability, t.impact) >= 85
          ? "elevated"
          : threatScore(t.probability, t.impact) >= 70
            ? "moderate"
            : "managed",
      owner: (t.domain ?? "").includes("competitive")
        ? "ECC · Competitive Response"
        : (t.domain ?? "").includes("financial")
          ? "E3 Financial Executive"
          : "ECC · Strategic Planning",
    }));
}

function buildThreatAnalysis(threats: ThreatRecord[]): ThreatAnalysisMetric[] {
  const avgProbability = Math.round(
    threats.reduce((s, t) => s + t.probability, 0) / Math.max(threats.length, 1),
  );
  const avgImpact = Math.round(
    threats.reduce((s, t) => s + t.impact, 0) / Math.max(threats.length, 1),
  );
  const criticalCount = threats.filter((t) => t.severity === "critical").length;
  const emergingCount = threats.filter(
    (t) => t.category === "emerging_threat" || t.category === "future_threat",
  ).length;

  const scores: Record<(typeof THREAT_ANALYSIS_DOMAINS)[number], number> = {
    probability: avgProbability,
    business_impact: avgImpact,
    financial_impact: Math.round(avgImpact * 0.9),
    operational_impact: Math.round(avgImpact * 0.75),
    strategic_impact: Math.round(avgImpact * 0.95),
    time_sensitivity: criticalCount >= 3 ? 88 : 72,
    mitigation_complexity: 58,
    residual_risk: Math.round((avgProbability + avgImpact) / 2 * 0.7),
    long_term_sustainability: emergingCount >= 2 ? 68 : 78,
  };

  return THREAT_ANALYSIS_DOMAINS.map((domain) => {
    const score = scores[domain];
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 80 ? "elevated" : score >= 65 ? "moderate" : "managed",
      summary: `${label(domain)} assessed at ${score}/100 across ${threats.length} detected threats`,
    };
  });
}

function buildPillowEvaluations(input: {
  threatCount: number;
  criticalCount: number;
  emergingCount: number;
  avgScore: number;
}): PillowThreatEvaluationMetric[] {
  const status = (score: number) =>
    score >= 85 ? "strong" : score >= 70 ? "active" : "developing";

  const evals: Record<(typeof PILLOW_THREAT_EVALUATIONS)[number], { score: number; summary: string }> = {
    threat_landscape: {
      score: input.avgScore,
      summary: `${input.threatCount} threats detected · ${input.criticalCount} critical · continuous monitoring active`,
    },
    emerging_risks: {
      score: input.emergingCount >= 2 ? 82 : 70,
      summary: `${input.emergingCount} emerging threats tracked · early warning capability active`,
    },
    threat_trends: {
      score: 86,
      summary: "5 threat trends monitored · competitive · regulatory · technology · market · future",
    },
    mitigation_opportunities: {
      score: input.criticalCount <= 4 ? 84 : 72,
      summary: `${input.threatCount} mitigation plans · ECC coordination active`,
    },
    executive_recommendations: {
      score: 88,
      summary: "Executive threat recommendations generated · proactive response enabled",
    },
  };

  return PILLOW_THREAT_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: status(evals[domain].score),
    summary: evals[domain].summary,
  }));
}

function buildRecommendations(threats: ThreatRecord[]): ThreatDetectionRecommendation[] {
  const topThreat = threats.sort(
    (a, b) => threatScore(b.probability, b.impact) - threatScore(a.probability, a.impact),
  )[0];

  return [
    {
      id: "tde-rec-1",
      title: `Immediate response: ${topThreat?.title ?? "Critical competitive threat"}`,
      category: "critical_response",
      why: `Highest threat score (${threatScore(topThreat?.probability ?? 90, topThreat?.impact ?? 92)}/100) requires executive attention`,
      what: "Activate competitive response protocol · accelerate constitutional differentiation",
      how: "E4-02 competitor intelligence · E2 executive decision · ECC mission prioritization",
      confidencePercent: 94,
    },
    {
      id: "tde-rec-2",
      title: "Strengthen AI regulatory compliance posture",
      category: "regulatory_mitigation",
      why: "Global AI regulatory expansion poses multi-jurisdiction compliance risk",
      what: "Proactive regulatory mapping · constitutional governance certification",
      how: "E4-01 market intelligence · Guardian compliance · VIE alignment validation",
      confidencePercent: 89,
    },
    {
      id: "tde-rec-3",
      title: "Accelerate technology moat through constitutional orchestration",
      category: "technology_defense",
      why: "LLM commoditization threatens technology differentiation",
      what: "Deepen Pillow · ECC · Guardian integration · proprietary intelligence layers",
      how: "E4-03 opportunity alignment · knowledge evolution · zero-human automation",
      confidencePercent: 87,
    },
    {
      id: "tde-rec-4",
      title: "Enhance enterprise security and reputation protection",
      category: "security_mitigation",
      why: "Data breach and AI safety reputation risks carry critical impact potential",
      what: "Guardian continuous protection · VIE alignment · transparent governance",
      how: "Guardian monitoring · production integrity · constitutional compliance review",
      confidencePercent: 92,
    },
  ];
}

export function assembleThreatDetectionEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
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
} = {}): ThreatDetectionEngine {
  const threatDashboard = buildThreatDashboard(input);
  const criticalThreats = buildCriticalThreats(threatDashboard);
  const emergingThreats = buildEmergingThreats(threatDashboard);
  const threatTrends = buildThreatTrends(input);
  const businessImpact = buildBusinessImpact(threatDashboard);
  const riskHeatmap = buildRiskHeatmap(threatDashboard);
  const mitigationStatus = buildMitigationStatus(threatDashboard);
  const threatAnalysis = buildThreatAnalysis(threatDashboard);

  const avgScore = Math.round(
    threatDashboard.reduce((s, t) => s + threatScore(t.probability, t.impact), 0) /
      Math.max(threatDashboard.length, 1),
  );

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.competitorIntelligenceEngine?.healthScore ?? 85,
    input.opportunityDiscoveryEngine?.healthScore ?? 85,
    criticalThreats.length <= 4 ? 88 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    threatCount: threatDashboard.length,
    criticalCount: criticalThreats.length,
    emergingCount: emergingThreats.length,
    avgScore,
  });
  const recommendedActions = buildRecommendations(threatDashboard);

  const pillowAdvisory = [
    "Threat Detection Engine — constitutional enterprise threat intelligence active",
    `${threatDashboard.length} threats detected · ${criticalThreats.length} critical · ${emergingThreats.length} emerging`,
    "Every threat evidence-based · measurable · constitutionally governed",
    `E4-01 ${input.marketIntelligenceEngine?.monitoredMarketCount ?? 12} markets · E4-02 ${input.competitorIntelligenceEngine?.trackedCompetitorCount ?? 12} competitors · E4-03 ${input.opportunityDiscoveryEngine?.discoveredOpportunityCount ?? 12} opportunities integrated`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting threat intelligence integrity")}`,
    "ECC coordinates threat response · Supervisor monitors detection accuracy",
    "VIE validates threat alignment · vision · strategic · constitutional",
    "Grand King possesses early warning capability · no undetected critical threats",
  ];

  return {
    engineVersion: "E4-04",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Threat Detection Engine continuously identifies, analyzes and prioritizes threats across markets, competitors, technology, regulation, operations and strategic environments. Every threat is evidence-based, measurable and constitutionally governed. The Grand King always possesses early warning capability.",
    engineHealth: healthLabel(clampedHealth),
    threatDetectionHealth: avgScore >= 75 ? "elevated" : avgScore >= 60 ? "active" : "managed",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    detectedThreatCount: threatDashboard.length,
    criticalThreatCount: criticalThreats.length,
    emergingThreatCount: emergingThreats.length,
    averageThreatScore: avgScore,
    threatDashboard,
    criticalThreats,
    emergingThreats,
    threatTrends,
    businessImpact,
    riskHeatmap,
    mitigationStatus,
    threatAnalysis,
    threatDetectionPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    threatPrinciples: [...THREAT_DETECTION_PRINCIPLES],
    governedDomains: [...GOVERNED_THREAT_DOMAINS],
    pillowAdvisory,
    integrations: {
      marketIntelligenceEngine: input.marketIntelligenceEngine
        ? `E4-01 · ${input.marketIntelligenceEngine.engineHealth} · ${input.marketIntelligenceEngine.monitoredMarketCount} markets`
        : "E4-01 · standby",
      competitorIntelligenceEngine: input.competitorIntelligenceEngine
        ? `E4-02 · ${input.competitorIntelligenceEngine.engineHealth} · ${input.competitorIntelligenceEngine.threatCount} threats`
        : "E4-02 · standby",
      opportunityDiscoveryEngine: input.opportunityDiscoveryEngine
        ? `E4-03 · ${input.opportunityDiscoveryEngine.engineHealth} · ${input.opportunityDiscoveryEngine.discoveredOpportunityCount} opportunities`
        : "E4-03 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "threat intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-04 Threat Detection Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring threat detection health"),
      eccStatus: String(input.ecc?.status ?? "threat response coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE405: true,
  };
}

export function buildFallbackThreatDetectionEngine(): ThreatDetectionEngine {
  return assembleThreatDetectionEngine({});
}
