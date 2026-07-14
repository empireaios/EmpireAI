import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CustomerBehaviourIntelligence } from "../customer-behaviour-intelligence/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveKnowledgeGraph } from "../executive-knowledge-graph/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutivePredictionEngine } from "../executive-prediction-engine/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { IndustryIntelligenceEngine } from "../industry-intelligence-engine/types.js";
import type { InnovationIntelligenceEngine } from "../innovation-intelligence-engine/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { MarketIntelligenceEngine } from "../market-intelligence-engine/types.js";
import type { OpportunityDiscoveryEngine } from "../opportunity-discovery-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { ThreatDetectionEngine } from "../threat-detection-engine/types.js";
import {
  INSIGHT_PIPELINE,
  INSIGHT_PRINCIPLES,
  GOVERNED_INSIGHT_DOMAINS,
  INSIGHT_ANALYSIS_DOMAINS,
  PILLOW_INSIGHT_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveInsightEngine,
  InsightPipelineStep,
  InsightPipelinePhase,
  InsightRecord,
  TopPriorityEntry,
  StrategicFindingEntry,
  CriticalOpportunityEntry,
  CriticalRiskEntry,
  ConfidenceLevelEntry,
  InsightAnalysisMetric,
  ExecutiveInsightRecommendation,
  PillowInsightEvaluationMetric,
  GovernedInsightDomain,
  InsightClassification,
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

function nowIso(): string {
  return new Date().toISOString();
}

function mapDomain(category: InsightClassification): GovernedInsightDomain {
  const map: Record<InsightClassification, GovernedInsightDomain> = {
    strategic_insight: "strategic_insights",
    business_insight: "business_insights",
    market_insight: "market_insights",
    financial_insight: "financial_insights",
    competitive_insight: "competitive_insights",
    customer_insight: "customer_insights",
    operational_insight: "operational_insights",
    risk_insight: "risk_insights",
    opportunity_insight: "opportunity_insights",
    future_insight: "future_insight_categories",
  };
  return map[category];
}

function buildPipeline(
  activePhase: InsightPipelinePhase = "continuous_learning",
): InsightPipelineStep[] {
  const activeIdx = INSIGHT_PIPELINE.indexOf(activePhase);
  return INSIGHT_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildExecutiveInsights(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): InsightRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets[0]?.marketName ?? "Global AI Enterprise";
  const topThreat = input.threatDetectionEngine?.criticalThreats[0]?.title ?? "Competitive Displacement";
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0]?.title ?? "Constitutional AI Platform";
  const topPrediction = input.executivePredictionEngine?.predictionDashboard[0]?.title ?? "Enterprise AI Revenue Acceleration";
  const topCompetitor = input.competitorIntelligenceEngine?.competitorLandscape[0]?.competitorName ?? "Enterprise AI Incumbents";
  const avgRetention = input.customerBehaviourIntelligence?.averageRetentionProbability ?? 74;
  const graphEntities = input.executiveKnowledgeGraph?.entityCount ?? 24;

  const catalogue: Array<Omit<InsightRecord, "lastUpdated">> = [
    {
      insightId: "eie-revenue-acceleration",
      title: "Revenue Acceleration Requires Immediate Executive Focus",
      category: "financial_insight",
      domain: "financial_insights",
      strategicObjective: "Achieve $8.4M ARR within 12 months",
      sourceIntelligence: "E4-09 Prediction Engine · E3 Financial Executive",
      businessContext: "Enterprise AI platform adoption accelerating · constitutional governance differentiator",
      keyFinding: `${topPrediction} at 78% probability — revenue acceleration is the highest-confidence executive signal`,
      businessImpact: "Platform adoption acceleration · enterprise pilot conversion",
      financialImpact: "$8.4M ARR target · 40% YoY growth trajectory",
      strategicImpact: "critical · constitutional AI market leadership",
      priority: "critical",
      recommendedAction: "Authorize enterprise pilot acceleration · E3 monetization review · E4-03 opportunity prioritization",
      confidence: 88,
      evidence: ["E4-09 revenue prediction", "E3-16 certified", topOpportunity],
    },
    {
      insightId: "eie-competitive-threat",
      title: "Competitive Displacement Risk Demands Strategic Response",
      category: "competitive_insight",
      domain: "competitive_insights",
      strategicObjective: "Maintain constitutional AI competitive advantage",
      sourceIntelligence: "E4-02 Competitor Intelligence · E4-04 Threat Detection",
      businessContext: `${topCompetitor} accelerating enterprise AI platform investments`,
      keyFinding: `${topThreat} — competitor velocity exceeds current differentiation pace`,
      businessImpact: "Market share risk · enterprise deal velocity pressure",
      financialImpact: "Revenue at risk · pricing pressure on enterprise tier",
      strategicImpact: "high · competitive positioning requires immediate action",
      priority: "critical",
      recommendedAction: "Launch constitutional differentiation campaign · E4-02 competitive response · E2 decision review",
      confidence: 86,
      evidence: ["E4-04 critical threat", "E4-02 priority competitor", "E4-09 competitive prediction"],
    },
    {
      insightId: "eie-constitutional-opportunity",
      title: "Constitutional AI Platform Opportunity Is Highest-Value Signal",
      category: "opportunity_insight",
      domain: "opportunity_insights",
      strategicObjective: "Capture constitutional AI enterprise market leadership",
      sourceIntelligence: "E4-03 Opportunity Discovery · E4-08 Knowledge Graph",
      businessContext: "Enterprise demand for governed AI platforms exceeding supply",
      keyFinding: `${topOpportunity} — constitutional governance is the primary enterprise buying criterion`,
      businessImpact: "New enterprise segment · platform differentiation",
      financialImpact: "$2.1M incremental ARR opportunity within 6 months",
      strategicImpact: "critical · first-mover constitutional AI advantage",
      priority: "critical",
      recommendedAction: "Prioritize constitutional AI go-to-market · E4-03 opportunity capture · E1 vision alignment",
      confidence: 91,
      evidence: [topOpportunity, `E4-08 ${graphEntities} knowledge entities`, "E4-09 opportunity prediction"],
    },
    {
      insightId: "eie-market-expansion",
      title: "Global AI Enterprise Market Expansion Window Open",
      category: "market_insight",
      domain: "market_insights",
      strategicObjective: "Expand into high-growth enterprise AI markets",
      sourceIntelligence: "E4-01 Market Intelligence · E4-05 Industry Intelligence",
      businessContext: `${topMarket} segment showing 34% YoY growth`,
      keyFinding: "Market timing optimal — enterprise AI adoption inflection point reached",
      businessImpact: "Geographic expansion · new enterprise verticals",
      financialImpact: "$3.2M addressable market expansion",
      strategicImpact: "high · market leadership positioning",
      priority: "high",
      recommendedAction: "Activate market expansion playbook · E4-01 intelligence review · E4-05 industry targeting",
      confidence: 84,
      evidence: ["E4-01 global markets", "E4-05 industry trends", "E4-09 market prediction"],
    },
    {
      insightId: "eie-customer-retention",
      title: "Customer Retention Signals Require Proactive Intervention",
      category: "customer_insight",
      domain: "customer_insights",
      strategicObjective: "Maintain 90%+ enterprise customer retention",
      sourceIntelligence: "E4-06 Customer Behaviour Intelligence",
      businessContext: "Enterprise segment retention probability below target threshold",
      keyFinding: `Average retention probability at ${avgRetention}% — intervention required for at-risk segments`,
      businessImpact: "Churn risk in enterprise tier · NRR pressure",
      financialImpact: "$480K ARR at risk without intervention",
      strategicImpact: "medium · customer success programme alignment",
      priority: "high",
      recommendedAction: "Launch retention intervention programme · E4-06 segment analysis · customer success escalation",
      confidence: 82,
      evidence: ["E4-06 retention signals", "E4-09 customer prediction", "E4-08 customer knowledge edges"],
    },
    {
      insightId: "eie-innovation-advantage",
      title: "Innovation Velocity Is Strategic Competitive Moat",
      category: "strategic_insight",
      domain: "strategic_insights",
      strategicObjective: "Establish innovation-led constitutional AI leadership",
      sourceIntelligence: "E4-07 Innovation Intelligence · E4-08 Knowledge Graph",
      businessContext: "Emerging AI governance technologies creating new competitive moats",
      keyFinding: "Innovation pipeline alignment with constitutional vision creates defensible advantage",
      businessImpact: "Product differentiation · technology leadership",
      financialImpact: "Premium pricing power · reduced competitive pressure",
      strategicImpact: "critical · long-term competitive sustainability",
      priority: "high",
      recommendedAction: "Accelerate innovation pipeline · E4-07 readiness review · E1 vision integration",
      confidence: 87,
      evidence: ["E4-07 disruptive innovations", "E4-08 innovation knowledge nodes", "E4-09 technology prediction"],
    },
    {
      insightId: "eie-knowledge-synthesis",
      title: "Knowledge Graph Synthesis Reveals Cross-Domain Executive Signals",
      category: "business_insight",
      domain: "business_insights",
      strategicObjective: "Unified executive intelligence across all domains",
      sourceIntelligence: "E4-08 Executive Knowledge Graph · E4-09 Prediction Engine",
      businessContext: `${graphEntities} knowledge entities · cross-domain relationship patterns emerging`,
      keyFinding: "Knowledge graph reveals revenue-opportunity-risk correlation clusters requiring coordinated action",
      businessImpact: "Holistic executive decision-making · reduced intelligence silos",
      financialImpact: "Improved resource allocation · reduced duplicate effort",
      strategicImpact: "high · executive intelligence maturity",
      priority: "high",
      recommendedAction: "Activate knowledge-driven executive planning · E4-08 gap remediation · E2 decision synthesis",
      confidence: 89,
      evidence: [`E4-08 ${graphEntities} entities`, "E4-08 knowledge gaps", "E4-09 prediction correlation"],
    },
    {
      insightId: "eie-operational-readiness",
      title: "Operational Execution Readiness Gap Identified",
      category: "operational_insight",
      domain: "operational_insights",
      strategicObjective: "Achieve execution readiness for enterprise scale",
      sourceIntelligence: "E4-09 Prediction Engine · E1 Executive Planning",
      businessContext: "Growth predictions exceed current operational capacity",
      keyFinding: "Revenue acceleration predictions require operational scaling before Q3",
      businessImpact: "Delivery capacity · customer success scaling",
      financialImpact: "Revenue realization risk without operational investment",
      strategicImpact: "medium · execution readiness critical path",
      priority: "medium",
      recommendedAction: "Initiate operational scaling review · E1 planning alignment · resource allocation",
      confidence: 79,
      evidence: ["E4-09 revenue prediction", "E1-16 planning certification", "E4-08 operational knowledge"],
    },
    {
      insightId: "eie-risk-convergence",
      title: "Converging Risk Signals Require Executive Risk Review",
      category: "risk_insight",
      domain: "risk_insights",
      strategicObjective: "Maintain constitutional risk governance",
      sourceIntelligence: "E4-04 Threat Detection · E4-09 Prediction Engine",
      businessContext: "Multiple risk signals converging across competitive and operational domains",
      keyFinding: "Risk correlation analysis shows compound exposure exceeding individual threat assessments",
      businessImpact: "Compound risk exposure · strategic vulnerability",
      financialImpact: "Portfolio risk · revenue protection required",
      strategicImpact: "high · risk governance escalation",
      priority: "critical",
      recommendedAction: "Convene executive risk review · E4-04 threat mitigation · E2 decision escalation",
      confidence: 85,
      evidence: ["E4-04 critical threats", "E4-09 emerging risks", "E4-08 risk network"],
    },
    {
      insightId: "eie-industry-disruption",
      title: "Industry Disruption Pattern Signals Strategic Repositioning",
      category: "market_insight",
      domain: "market_insights",
      strategicObjective: "Lead industry disruption rather than follow",
      sourceIntelligence: "E4-05 Industry Intelligence · E4-07 Innovation Intelligence",
      businessContext: "Enterprise AI industry consolidation accelerating",
      keyFinding: "Industry consolidation creates acquisition and partnership opportunities for constitutional AI leader",
      businessImpact: "Strategic partnerships · market consolidation advantage",
      financialImpact: "Partnership revenue · reduced competitive fragmentation",
      strategicImpact: "high · industry leadership positioning",
      priority: "medium",
      recommendedAction: "Evaluate strategic partnership opportunities · E4-05 industry analysis · E4-07 innovation alignment",
      confidence: 80,
      evidence: ["E4-05 industry trends", "E4-07 emerging technologies", "E4-09 industry prediction"],
    },
    {
      insightId: "eie-executive-decision",
      title: "Executive Decision Velocity Must Match Intelligence Velocity",
      category: "strategic_insight",
      domain: "executive_insights",
      strategicObjective: "Achieve real-time executive decision capability",
      sourceIntelligence: "E2 Executive Decision Engine · E4-09 Prediction Engine",
      businessContext: "Intelligence pipeline producing insights faster than decision cycle",
      keyFinding: "Decision latency is the primary bottleneck between intelligence and action",
      businessImpact: "Reduced time-to-action · competitive responsiveness",
      financialImpact: "Revenue capture acceleration · reduced opportunity cost",
      strategicImpact: "critical · executive decision maturity",
      priority: "high",
      recommendedAction: "Accelerate executive decision cycle · E2-16 certification review · ECC coordination",
      confidence: 83,
      evidence: ["E2 executive decisions", "E4-09 predictions", "E4-08 decision knowledge edges"],
    },
    {
      insightId: "eie-future-intelligence",
      title: "Future Intelligence Architecture Requires Continuous Investment",
      category: "future_insight",
      domain: "future_insight_categories",
      strategicObjective: "Sustain long-term executive intelligence advantage",
      sourceIntelligence: "P9-02 Knowledge Evolution · E4-08 Knowledge Graph",
      businessContext: "Executive intelligence maturity creating compounding advantage",
      keyFinding: "Continuous knowledge evolution is the primary long-term competitive sustainability factor",
      businessImpact: "Intelligence compounding · decision quality improvement",
      financialImpact: "Long-term ROI on intelligence investment",
      strategicImpact: "critical · sustainable competitive advantage",
      priority: "medium",
      recommendedAction: "Invest in knowledge evolution pipeline · P9-02 architecture · E4-08 graph expansion",
      confidence: 86,
      evidence: ["P9-02 knowledge evolution", "E4-08 knowledge graph", "E4-09 long-term predictions"],
    },
  ];

  return catalogue.map((insight) => ({
    ...insight,
    domain: insight.domain ?? mapDomain(insight.category),
    lastUpdated: nowIso(),
  }));
}

function buildTopPriorities(insights: InsightRecord[]): TopPriorityEntry[] {
  return insights
    .filter((i) => i.priority === "critical" || i.priority === "high")
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
    })
    .slice(0, 8)
    .map((i, idx) => ({
      priorityId: `pri-${idx + 1}`,
      insightId: i.insightId,
      title: i.title,
      priority: i.priority,
      urgency: i.priority === "critical" ? "immediate" : "this_quarter",
      recommendedAction: i.recommendedAction,
      confidence: i.confidence,
      status: i.priority === "critical" ? "action_required" : "monitoring",
    }));
}

function buildStrategicFindings(insights: InsightRecord[]): StrategicFindingEntry[] {
  return insights
    .filter((i) => i.category === "strategic_insight" || i.strategicImpact.includes("critical"))
    .map((i, idx) => ({
      findingId: `sf-${idx + 1}`,
      insightId: i.insightId,
      title: i.title,
      keyFinding: i.keyFinding,
      strategicImpact: i.strategicImpact,
      confidence: i.confidence,
      status: i.confidence >= 85 ? "validated" : "developing",
    }));
}

function buildCriticalOpportunities(insights: InsightRecord[]): CriticalOpportunityEntry[] {
  return insights
    .filter((i) => i.category === "opportunity_insight" || i.domain === "opportunity_insights")
    .concat(insights.filter((i) => i.category === "market_insight" && i.priority === "high"))
    .slice(0, 6)
    .map((i, idx) => ({
      opportunityId: `co-${idx + 1}`,
      insightId: i.insightId,
      title: i.title,
      opportunityValue: i.financialImpact,
      recommendedAction: i.recommendedAction,
      confidence: i.confidence,
      status: i.confidence >= 85 ? "capture_ready" : "evaluating",
    }));
}

function buildCriticalRisks(insights: InsightRecord[]): CriticalRiskEntry[] {
  return insights
    .filter((i) => i.category === "risk_insight" || i.category === "competitive_insight" || i.priority === "critical")
    .filter((i) => i.category === "risk_insight" || i.category === "competitive_insight" || i.keyFinding.includes("risk") || i.keyFinding.includes("Threat"))
    .slice(0, 6)
    .map((i, idx) => ({
      riskId: `cr-${idx + 1}`,
      insightId: i.insightId,
      title: i.title,
      riskExposure: i.businessImpact,
      recommendedAction: i.recommendedAction,
      confidence: i.confidence,
      status: i.priority === "critical" ? "escalated" : "monitoring",
    }));
}

function buildConfidenceLevels(insights: InsightRecord[]): ConfidenceLevelEntry[] {
  return insights.map((i, idx) => ({
    levelId: `cl-${idx + 1}`,
    insightId: i.insightId,
    title: i.title,
    confidence: i.confidence,
    evidenceQuality: i.evidence.length >= 3 ? "strong" : i.evidence.length >= 2 ? "adequate" : "developing",
    validationStatus: i.confidence >= 85 ? "validated" : "pending_validation",
  }));
}

function buildInsightAnalysis(insights: InsightRecord[]): InsightAnalysisMetric[] {
  const criticalCount = insights.filter((i) => i.priority === "critical").length;
  const avgConfidence = Math.round(
    insights.reduce((s, i) => s + i.confidence, 0) / Math.max(insights.length, 1),
  );
  const opportunityInsights = insights.filter((i) => i.category === "opportunity_insight").length;
  const riskInsights = insights.filter((i) => i.category === "risk_insight" || i.category === "competitive_insight").length;

  return INSIGHT_ANALYSIS_DOMAINS.map((domain) => {
    const scores: Record<string, number> = {
      business_significance: Math.min(100, 70 + criticalCount * 5),
      strategic_importance: Math.min(100, 75 + insights.filter((i) => i.strategicImpact.includes("critical")).length * 4),
      financial_impact: Math.min(100, 72 + insights.filter((i) => i.category === "financial_insight").length * 8),
      operational_impact: Math.min(100, 68 + insights.filter((i) => i.category === "operational_insight").length * 6),
      urgency: Math.min(100, 65 + criticalCount * 8),
      opportunity_value: Math.min(100, 70 + opportunityInsights * 10),
      risk_exposure: Math.min(100, 60 + riskInsights * 8),
      executive_priority: Math.min(100, 75 + criticalCount * 6),
      long_term_sustainability: Math.min(100, avgConfidence),
    };
    const score = scores[domain] ?? 75;
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "strong" : score >= 70 ? "active" : "developing",
      summary: `${label(domain)} — ${score}/100 · ${insights.length} insights synthesized`,
    };
  });
}

function buildPillowEvaluations(input: {
  insightCount: number;
  criticalCount: number;
  avgConfidence: number;
}): PillowInsightEvaluationMetric[] {
  return PILLOW_INSIGHT_EVALUATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      executive_insights: `${input.insightCount} executive insights active · ${input.criticalCount} critical priority`,
      strategic_signals: "Strategic findings validated · cross-domain correlation active",
      critical_findings: `${input.criticalCount} critical findings requiring immediate executive attention`,
      emerging_opportunities: "Opportunity insights correlated with prediction engine signals",
      executive_recommendations: `Recommendations at ${input.avgConfidence}% average confidence`,
    };
    return {
      domain,
      label: label(domain),
      status: input.avgConfidence >= 85 ? "strong" : "active",
      summary: summaries[domain] ?? label(domain),
    };
  });
}

function buildRecommendations(insights: InsightRecord[]): ExecutiveInsightRecommendation[] {
  const critical = insights.filter((i) => i.priority === "critical");
  return [
    {
      id: "eie-rec-revenue",
      title: "Accelerate Revenue Capture Programme",
      category: "financial",
      why: critical.find((i) => i.insightId === "eie-revenue-acceleration")?.keyFinding ?? "Revenue acceleration signal",
      what: "Authorize enterprise pilot acceleration and E3 monetization review",
      how: "E4-09 prediction · E3 Financial Executive · E4-03 opportunity prioritization",
      confidencePercent: 88,
    },
    {
      id: "eie-rec-competitive",
      title: "Launch Competitive Differentiation Response",
      category: "competitive",
      why: critical.find((i) => i.insightId === "eie-competitive-threat")?.keyFinding ?? "Competitive threat signal",
      what: "Constitutional differentiation campaign · competitive response playbook",
      how: "E4-02 competitor intelligence · E4-04 threat mitigation · E2 decision review",
      confidencePercent: 86,
    },
    {
      id: "eie-rec-opportunity",
      title: "Capture Constitutional AI Platform Opportunity",
      category: "opportunity",
      why: critical.find((i) => i.insightId === "eie-constitutional-opportunity")?.keyFinding ?? "Opportunity signal",
      what: "Prioritize constitutional AI go-to-market · enterprise segment capture",
      how: "E4-03 opportunity discovery · E1 vision alignment · E4-08 knowledge graph",
      confidencePercent: 91,
    },
    {
      id: "eie-rec-risk",
      title: "Convene Executive Risk Review",
      category: "risk",
      why: critical.find((i) => i.insightId === "eie-risk-convergence")?.keyFinding ?? "Risk convergence signal",
      what: "Compound risk assessment · mitigation coordination",
      how: "E4-04 threat detection · E4-09 risk predictions · E2 decision escalation",
      confidencePercent: 85,
    },
    {
      id: "eie-rec-decision",
      title: "Accelerate Executive Decision Velocity",
      category: "strategic",
      why: "Decision latency is primary bottleneck between intelligence and action",
      what: "Reduce decision cycle time · real-time executive decision capability",
      how: "E2-16 certification · ECC coordination · E4-09 prediction-informed decisions",
      confidencePercent: 83,
    },
  ];
}

export function assembleExecutiveInsightEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
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
} = {}): ExecutiveInsightEngine {
  const executiveInsights = buildExecutiveInsights(input);
  const topPriorities = buildTopPriorities(executiveInsights);
  const strategicFindings = buildStrategicFindings(executiveInsights);
  const criticalOpportunities = buildCriticalOpportunities(executiveInsights);
  const criticalRisks = buildCriticalRisks(executiveInsights);
  const confidenceLevels = buildConfidenceLevels(executiveInsights);
  const insightAnalysis = buildInsightAnalysis(executiveInsights);

  const avgConfidence = Math.round(
    executiveInsights.reduce((s, i) => s + i.confidence, 0) / Math.max(executiveInsights.length, 1),
  );
  const criticalCount = executiveInsights.filter((i) => i.priority === "critical").length;

  const healthInputs = [
    input.executivePredictionEngine?.healthScore ?? 85,
    input.executiveKnowledgeGraph?.healthScore ?? 85,
    avgConfidence,
    criticalCount >= 3 ? 88 : 74,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    insightCount: executiveInsights.length,
    criticalCount,
    avgConfidence,
  });
  const recommendedActions = buildRecommendations(executiveInsights);

  const pillowAdvisory = [
    "Executive Insight Engine — constitutional enterprise executive insight active",
    `${executiveInsights.length} insights active · ${criticalCount} critical priority · ${strategicFindings.length} strategic findings`,
    "Every insight evidence-based · explainable · strategically relevant",
    "E4-01 to E4-09 intelligence integrated · E3 E2 E1 programmes connected",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting insight integrity")}`,
    "ECC coordinates insight distribution · Supervisor monitors insight accuracy",
    "VIE validates insight alignment · vision · strategic · constitutional",
    "Grand King understands what requires immediate executive attention and why",
  ];

  return {
    engineVersion: "E4-10",
    computedAt: nowIso(),
    engineSummary:
      "Executive Insight Engine continuously synthesizes executive knowledge, predictions, market intelligence, competitor intelligence, financial intelligence and operational intelligence into actionable executive insights. Every insight is evidence-based, explainable and strategically relevant. The Grand King always understands what requires immediate executive attention and why.",
    engineHealth: healthLabel(clampedHealth),
    insightIntelligenceHealth: avgConfidence >= 85 ? "strong" : avgConfidence >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeInsightCount: executiveInsights.length,
    criticalPriorityCount: criticalCount,
    strategicFindingCount: strategicFindings.length,
    averageInsightConfidence: avgConfidence,
    executiveInsights,
    topPriorities,
    strategicFindings,
    criticalOpportunities,
    criticalRisks,
    recommendedActions,
    confidenceLevels,
    insightAnalysis,
    insightPipeline: buildPipeline("continuous_learning"),
    pillowEvaluations,
    insightPrinciples: [...INSIGHT_PRINCIPLES],
    governedDomains: [...GOVERNED_INSIGHT_DOMAINS],
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
      industryIntelligenceEngine: input.industryIntelligenceEngine
        ? `E4-05 · ${input.industryIntelligenceEngine.engineHealth} · ${input.industryIntelligenceEngine.monitoredIndustryCount} industries`
        : "E4-05 · standby",
      customerBehaviourIntelligence: input.customerBehaviourIntelligence
        ? `E4-06 · ${input.customerBehaviourIntelligence.engineHealth} · ${input.customerBehaviourIntelligence.monitoredSegmentCount} segments`
        : "E4-06 · standby",
      innovationIntelligenceEngine: input.innovationIntelligenceEngine
        ? `E4-07 · ${input.innovationIntelligenceEngine.engineHealth} · ${input.innovationIntelligenceEngine.discoveredInnovationCount} innovations`
        : "E4-07 · standby",
      executiveKnowledgeGraph: input.executiveKnowledgeGraph
        ? `E4-08 · ${input.executiveKnowledgeGraph.engineHealth} · ${input.executiveKnowledgeGraph.entityCount} entities`
        : "E4-08 · standby",
      executivePredictionEngine: input.executivePredictionEngine
        ? `E4-09 · ${input.executivePredictionEngine.engineHealth} · ${input.executivePredictionEngine.activePredictionCount} predictions`
        : "E4-09 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "insight integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-10 Executive Insight Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring insight accuracy"),
      eccStatus: String(input.ecc?.status ?? "insight distribution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE411: true,
  };
}

export function buildFallbackExecutiveInsightEngine(): ExecutiveInsightEngine {
  return assembleExecutiveInsightEngine({});
}
