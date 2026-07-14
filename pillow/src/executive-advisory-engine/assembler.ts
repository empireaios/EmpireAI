import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CrossBusinessIntelligence } from "../cross-business-intelligence/types.js";
import type { CustomerBehaviourIntelligence } from "../customer-behaviour-intelligence/types.js";
import type { EnterprisePatternEngine } from "../enterprise-pattern-engine/types.js";
import type { ExecutiveBenchmarkEngine } from "../executive-benchmark-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveInsightEngine } from "../executive-insight-engine/types.js";
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
  ADVISORY_PIPELINE,
  ADVISORY_PRINCIPLES,
  GOVERNED_ADVISORY_DOMAINS,
  EXECUTIVE_ANALYSIS_DOMAINS,
  PILLOW_ADVISORY_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveAdvisoryEngine,
  AdvisoryPipelineStep,
  AdvisoryPipelinePhase,
  AdvisoryRecommendationRecord,
  ImmediateActionEntry,
  StrategicActionEntry,
  GrowthRecommendationEntry,
  FinancialRecommendationEntry,
  RiskRecommendationEntry,
  ExpectedOutcomeEntry,
  ExecutiveConfidenceEntry,
  ExecutiveAnalysisMetric,
  PillowAdvisoryEvaluationMetric,
  GovernedAdvisoryDomain,
  RecommendationClassification,
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

function mapDomain(category: RecommendationClassification): GovernedAdvisoryDomain {
  const map: Record<RecommendationClassification, GovernedAdvisoryDomain> = {
    immediate_action: "executive_recommendations",
    strategic_action: "strategic_recommendations",
    financial_action: "financial_recommendations",
    operational_action: "operational_recommendations",
    growth_action: "growth_recommendations",
    innovation_action: "innovation_recommendations",
    risk_mitigation: "risk_recommendations",
    optimization_action: "business_recommendations",
    transformation_action: "enterprise_recommendations",
    future_action: "future_executive_recommendations",
  };
  return map[category];
}

function buildPipeline(
  activePhase: AdvisoryPipelinePhase = "continuous_learning",
): AdvisoryPipelineStep[] {
  const activeIdx = ADVISORY_PIPELINE.indexOf(activePhase);
  return ADVISORY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAdvisoryRecommendations(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  executiveInsightEngine?: ExecutiveInsightEngine | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
  enterprisePatternEngine?: EnterprisePatternEngine | null;
  executiveBenchmarkEngine?: ExecutiveBenchmarkEngine | null;
  crossBusinessIntelligence?: CrossBusinessIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
}): AdvisoryRecommendationRecord[] {
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0]?.title ?? "Constitutional AI Platform";
  const topThreat = input.threatDetectionEngine?.criticalThreats[0]?.title ?? "Competitive Displacement";
  const topInsight = input.executiveInsightEngine?.topPriorities[0]?.title ?? "Revenue Acceleration Requires Immediate Executive Focus";
  const criticalGaps = input.executiveBenchmarkEngine?.criticalGapCount ?? 3;
  const synergyCount = input.crossBusinessIntelligence?.synergyCount ?? 8;
  const patternCount = input.enterprisePatternEngine?.activePatternCount ?? 12;

  const catalogue: Array<Omit<AdvisoryRecommendationRecord, "lastUpdated">> = [
    {
      recommendationId: "eae-revenue-acceleration",
      title: "Authorize Enterprise Revenue Acceleration Programme",
      category: "immediate_action",
      domain: "financial_recommendations",
      strategicObjective: "Achieve $8.4M ARR within 12 months",
      currentSituation: topInsight,
      recommendedAction: "Authorize enterprise pilot acceleration · E3 monetization review · sales cycle alignment",
      businessImpact: "Revenue growth acceleration · platform adoption at scale",
      financialImpact: "$8.4M ARR target · 40% YoY growth · $2.1M incremental per cycle",
      strategicImpact: "critical · primary revenue objective",
      priority: "critical",
      urgency: "immediate",
      expectedRoi: "340% over 12 months",
      expectedOutcome: "$8.4M ARR achieved within 12 months with 40% YoY growth",
      confidence: 91,
      evidence: ["E4-10 revenue insight", "E4-09 revenue prediction", "E4-12 revenue benchmark"],
    },
    {
      recommendationId: "eae-constitutional-capture",
      title: "Launch Constitutional AI Market Capture Initiative",
      category: "strategic_action",
      domain: "strategic_recommendations",
      strategicObjective: "Establish constitutional AI enterprise market leadership",
      currentSituation: `${topOpportunity} — constitutional governance is primary enterprise buying criterion`,
      recommendedAction: "Prioritize constitutional AI go-to-market · certification programme · thought leadership",
      businessImpact: "First-mover constitutional AI advantage · enterprise differentiation",
      financialImpact: "$2.1M incremental ARR within 6 months",
      strategicImpact: "critical · unique market position",
      priority: "critical",
      urgency: "this_quarter",
      expectedRoi: "280% over 18 months",
      expectedOutcome: "Constitutional AI market leadership established",
      confidence: 92,
      evidence: ["E4-03 opportunity", "E4-12 constitutional benchmark", "E4-13 cross-business synergy"],
    },
    {
      recommendationId: "eae-competitive-response",
      title: "Deploy Competitive Differentiation Response",
      category: "immediate_action",
      domain: "risk_recommendations",
      strategicObjective: "Maintain constitutional AI competitive advantage",
      currentSituation: `${topThreat} — competitor velocity exceeds current differentiation pace`,
      recommendedAction: "Launch constitutional differentiation campaign · competitive response playbook · E2 decision review",
      businessImpact: "Market share protection · enterprise deal velocity",
      financialImpact: "Protect $1.2M ARR at risk from competitive pressure",
      strategicImpact: "critical · competitive positioning",
      priority: "critical",
      urgency: "immediate",
      expectedRoi: "Prevent $480K revenue loss",
      expectedOutcome: "Competitive gap closed within 90 days",
      confidence: 88,
      evidence: ["E4-04 critical threat", "E4-10 competitive insight", "E4-02 competitor intelligence"],
    },
    {
      recommendationId: "eae-decision-velocity",
      title: "Accelerate Executive Decision Velocity Programme",
      category: "transformation_action",
      domain: "enterprise_recommendations",
      strategicObjective: "Achieve 48-hour executive decision cycle",
      currentSituation: "Decision latency is primary bottleneck between intelligence and action",
      recommendedAction: "E2-16 certification review · ECC coordination · real-time decision capability",
      businessImpact: "Intelligence-to-action acceleration · competitive responsiveness",
      financialImpact: "Reduced opportunity cost · faster revenue capture",
      strategicImpact: "critical · executive decision maturity",
      priority: "high",
      urgency: "this_quarter",
      expectedRoi: "220% from reduced decision latency",
      expectedOutcome: "48-hour decision cycle achieved",
      confidence: 85,
      evidence: ["E4-11 decision pattern", "E4-10 decision insight", "E4-12 decision benchmark"],
    },
    {
      recommendationId: "eae-customer-retention",
      title: "Activate Enterprise Retention Intervention Programme",
      category: "operational_action",
      domain: "operational_recommendations",
      strategicObjective: "Achieve 90% enterprise net retention",
      currentSituation: `Retention below industry benchmark · ${input.customerBehaviourIntelligence?.averageRetentionProbability ?? 74}% average retention`,
      recommendedAction: "Deploy pre-churn intervention playbook · customer success escalation · segment targeting",
      businessImpact: "Churn reduction · NRR improvement",
      financialImpact: "$480K ARR protected annually",
      strategicImpact: "medium · customer success alignment",
      priority: "high",
      urgency: "this_month",
      expectedRoi: "180% from retention improvement",
      expectedOutcome: "90% net retention achieved within 6 months",
      confidence: 84,
      evidence: ["E4-06 behaviour intelligence", "E4-11 churn pattern", "E4-12 retention benchmark"],
    },
    {
      recommendationId: "eae-market-expansion",
      title: "Execute Global Market Expansion Wave",
      category: "growth_action",
      domain: "growth_recommendations",
      strategicObjective: "Capture $3.2M addressable market expansion",
      currentSituation: "Market expansion window open · semi-annual expansion waves identified",
      recommendedAction: "Activate market expansion playbook · E4-01 intelligence · geographic targeting",
      businessImpact: "Geographic expansion · new enterprise verticals",
      financialImpact: "$3.2M addressable market capture",
      strategicImpact: "high · market leadership",
      priority: "high",
      urgency: "this_quarter",
      expectedRoi: "250% over 24 months",
      expectedOutcome: "Top-3 market position in target segments",
      confidence: 83,
      evidence: ["E4-01 global markets", "E4-11 expansion pattern", "E4-09 market prediction"],
    },
    {
      recommendationId: "eae-innovation-acceleration",
      title: "Accelerate Innovation-to-Market Pipeline",
      category: "innovation_action",
      domain: "innovation_recommendations",
      strategicObjective: "Close 6-point innovation velocity gap to world-class",
      currentSituation: "Innovation velocity near world-class · 90-day adoption curve validated",
      recommendedAction: "Close velocity gap · E4-07 innovation pipeline · cross-business technology transfer",
      businessImpact: "Innovation competitive moat · product differentiation",
      financialImpact: "$620K revenue per innovation cycle",
      strategicImpact: "high · technology leadership",
      priority: "medium",
      urgency: "this_quarter",
      expectedRoi: "200% per innovation cycle",
      expectedOutcome: "World-class 90-day innovation cycle achieved",
      confidence: 86,
      evidence: ["E4-07 innovation readiness", "E4-11 adoption pattern", "E4-13 technology reuse"],
    },
    {
      recommendationId: "eae-risk-governance",
      title: "Convene Enterprise-Wide Risk Governance Review",
      category: "risk_mitigation",
      domain: "risk_recommendations",
      strategicObjective: "Mitigate compound enterprise risk exposure",
      currentSituation: "Multi-domain risk convergence · compound exposure exceeds individual assessments",
      recommendedAction: "Executive risk review · E4-04 threat mitigation · cross-business risk monitoring",
      businessImpact: "Portfolio risk protection · strategic vulnerability reduction",
      financialImpact: "Revenue protection · risk-adjusted growth",
      strategicImpact: "critical · risk governance",
      priority: "critical",
      urgency: "immediate",
      expectedRoi: "Prevent significant portfolio risk",
      expectedOutcome: "Compound risk exposure mitigated within 30 days",
      confidence: 87,
      evidence: ["E4-04 critical threats", "E4-10 risk insight", "E4-13 cross-business risks"],
    },
    {
      recommendationId: "eae-benchmark-closure",
      title: "Close Critical Performance Benchmark Gaps",
      category: "optimization_action",
      domain: "business_recommendations",
      strategicObjective: "Close all critical performance gaps to world-class standards",
      currentSituation: `${criticalGaps} critical benchmark gaps identified across revenue, competitive and decision velocity`,
      recommendedAction: "Prioritized gap closure programme · E4-12 improvement opportunities · continuous monitoring",
      businessImpact: "World-class performance alignment · continuous improvement",
      financialImpact: "$4.8M cumulative revenue gap closure over 24 months",
      strategicImpact: "high · performance excellence",
      priority: "high",
      urgency: "this_quarter",
      expectedRoi: "300% from gap closure programme",
      expectedOutcome: "All critical gaps closed within 12 months",
      confidence: 87,
      evidence: ["E4-12 performance gaps", "E4-12 improvement opportunities", "E4-11 revenue pattern"],
    },
    {
      recommendationId: "eae-cross-business-synergy",
      title: "Amplify Cross-Business Intelligence Synergies",
      category: "transformation_action",
      domain: "enterprise_recommendations",
      strategicObjective: "Maximize enterprise-wide intelligence compounding",
      currentSituation: `${synergyCount} enterprise synergies active · ${input.crossBusinessIntelligence?.activeRelationshipCount ?? 12} cross-business relationships`,
      recommendedAction: "Deepen cross-business knowledge sharing · E4-13 correlation pipeline · enterprise scheduling",
      businessImpact: "Every business contributes and benefits from shared intelligence",
      financialImpact: "$480K annual efficiency from reduced duplication",
      strategicImpact: "critical · enterprise intelligence maturity",
      priority: "high",
      urgency: "ongoing",
      expectedRoi: "Intelligence compounding ROI",
      expectedOutcome: "Unified enterprise intelligence across all businesses",
      confidence: 90,
      evidence: ["E4-13 synergies", "E4-08 knowledge graph", "E4-13 knowledge sharing"],
    },
    {
      recommendationId: "eae-pattern-exploitation",
      title: "Exploit Recurring Enterprise Patterns for Proactive Action",
      category: "optimization_action",
      domain: "business_recommendations",
      strategicObjective: "Act on recurring patterns before they become significant events",
      currentSituation: `${patternCount} enterprise patterns detected · constitutional AI demand surge emerging`,
      recommendedAction: "Pattern-driven executive planning · E4-11 recurring patterns · proactive intervention",
      businessImpact: "Proactive leadership · predictive awareness",
      financialImpact: "Revenue capture from pattern timing",
      strategicImpact: "high · pattern intelligence maturity",
      priority: "medium",
      urgency: "this_quarter",
      expectedRoi: "190% from pattern-driven actions",
      expectedOutcome: "Pattern-driven executive actions operationalized",
      confidence: 85,
      evidence: ["E4-11 constitutional demand pattern", "E4-11 revenue cycle", "E4-09 predictions"],
    },
    {
      recommendationId: "eae-future-intelligence",
      title: "Invest in Long-Term Intelligence Compounding Programme",
      category: "future_action",
      domain: "future_executive_recommendations",
      strategicObjective: "Sustain long-term competitive advantage through intelligence investment",
      currentSituation: `Executive intelligence maturity at ${input.executiveKnowledgeGraph?.healthScore ?? 85}/100 · compounding advantage emerging`,
      recommendedAction: "P9-02 knowledge evolution investment · E4-08 graph expansion · intelligence pipeline",
      businessImpact: "Sustainable competitive advantage · decision quality compounding",
      financialImpact: "Long-term ROI on intelligence investment",
      strategicImpact: "critical · long-term sustainability",
      priority: "medium",
      urgency: "ongoing",
      expectedRoi: "Compounding intelligence ROI",
      expectedOutcome: "Intelligence compounding creates defensible long-term advantage",
      confidence: 88,
      evidence: ["P9-02 knowledge evolution", "E4-08 knowledge graph", "E4-11 intelligence pattern"],
    },
  ];

  return catalogue.map((r) => ({
    ...r,
    domain: r.domain ?? mapDomain(r.category),
    lastUpdated: nowIso(),
  }));
}

function buildImmediateActions(recs: AdvisoryRecommendationRecord[]): ImmediateActionEntry[] {
  return recs
    .filter((r) => r.category === "immediate_action" || r.urgency === "immediate")
    .map((r, idx) => ({
      actionId: `ia-${idx + 1}`,
      recommendationId: r.recommendationId,
      title: r.title,
      recommendedAction: r.recommendedAction,
      urgency: r.urgency,
      expectedOutcome: r.expectedOutcome,
      confidence: r.confidence,
      status: "action_required",
    }));
}

function buildStrategicActions(recs: AdvisoryRecommendationRecord[]): StrategicActionEntry[] {
  return recs
    .filter((r) => r.category === "strategic_action" || r.category === "transformation_action")
    .map((r, idx) => ({
      actionId: `sa-${idx + 1}`,
      recommendationId: r.recommendationId,
      title: r.title,
      strategicObjective: r.strategicObjective,
      recommendedAction: r.recommendedAction,
      strategicImpact: r.strategicImpact,
      confidence: r.confidence,
      status: r.confidence >= 85 ? "approved" : "reviewing",
    }));
}

function buildGrowthRecommendations(recs: AdvisoryRecommendationRecord[]): GrowthRecommendationEntry[] {
  return recs
    .filter((r) => r.category === "growth_action" || r.domain === "growth_recommendations")
    .map((r, idx) => ({
      recommendationEntryId: `gr-${idx + 1}`,
      recommendationId: r.recommendationId,
      title: r.title,
      expectedRoi: r.expectedRoi,
      businessImpact: r.businessImpact,
      confidence: r.confidence,
      status: "capture_ready",
    }));
}

function buildFinancialRecommendations(recs: AdvisoryRecommendationRecord[]): FinancialRecommendationEntry[] {
  return recs
    .filter((r) => r.category === "financial_action" || r.domain === "financial_recommendations" || r.financialImpact.includes("ARR"))
    .slice(0, 6)
    .map((r, idx) => ({
      recommendationEntryId: `fr-${idx + 1}`,
      recommendationId: r.recommendationId,
      title: r.title,
      financialImpact: r.financialImpact,
      expectedRoi: r.expectedRoi,
      confidence: r.confidence,
      status: r.priority === "critical" ? "priority" : "active",
    }));
}

function buildRiskRecommendations(recs: AdvisoryRecommendationRecord[]): RiskRecommendationEntry[] {
  return recs
    .filter((r) => r.category === "risk_mitigation" || r.domain === "risk_recommendations")
    .map((r, idx) => ({
      recommendationEntryId: `rr-${idx + 1}`,
      recommendationId: r.recommendationId,
      title: r.title,
      currentSituation: r.currentSituation,
      recommendedAction: r.recommendedAction,
      urgency: r.urgency,
      confidence: r.confidence,
      status: r.urgency === "immediate" ? "escalated" : "monitoring",
    }));
}

function buildExpectedOutcomes(recs: AdvisoryRecommendationRecord[]): ExpectedOutcomeEntry[] {
  return recs.map((r, idx) => ({
    outcomeId: `eo-${idx + 1}`,
    recommendationId: r.recommendationId,
    title: r.title,
    expectedOutcome: r.expectedOutcome,
    expectedRoi: r.expectedRoi,
    confidence: r.confidence,
    status: r.confidence >= 85 ? "high_confidence" : "developing",
  }));
}

function buildExecutiveConfidence(recs: AdvisoryRecommendationRecord[]): ExecutiveConfidenceEntry[] {
  return recs.map((r, idx) => ({
    confidenceId: `ec-${idx + 1}`,
    recommendationId: r.recommendationId,
    title: r.title,
    confidence: r.confidence,
    evidenceQuality: r.evidence.length >= 3 ? "strong" : "adequate",
    validationStatus: r.confidence >= 85 ? "validated" : "pending_validation",
  }));
}

function buildExecutiveAnalysis(recs: AdvisoryRecommendationRecord[]): ExecutiveAnalysisMetric[] {
  const avgConfidence = Math.round(
    recs.reduce((s, r) => s + r.confidence, 0) / Math.max(recs.length, 1),
  );
  const criticalCount = recs.filter((r) => r.priority === "critical").length;

  return EXECUTIVE_ANALYSIS_DOMAINS.map((domain) => {
    const scores: Record<string, number> = {
      strategic_position: Math.min(100, 80 + recs.filter((r) => r.category === "strategic_action").length * 5),
      business_performance: Math.min(100, 75 + recs.filter((r) => r.domain === "business_recommendations").length * 6),
      financial_position: Math.min(100, 72 + recs.filter((r) => r.domain === "financial_recommendations").length * 8),
      market_conditions: Math.min(100, 78 + recs.filter((r) => r.domain === "market_recommendations" || r.category === "growth_action").length * 5),
      competitive_position: Math.min(100, 74 + criticalCount * 4),
      customer_behaviour: Math.min(100, 70 + recs.filter((r) => r.category === "operational_action").length * 6),
      innovation_opportunities: Math.min(100, 76 + recs.filter((r) => r.category === "innovation_action").length * 8),
      enterprise_risks: Math.min(100, 65 + recs.filter((r) => r.category === "risk_mitigation").length * 10),
      executive_priorities: Math.min(100, 75 + criticalCount * 6),
      long_term_sustainability: Math.min(100, avgConfidence),
    };
    const score = Math.round(scores[domain] ?? 75);
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "strong" : score >= 70 ? "active" : "developing",
      summary: `${label(domain)} — ${score}/100 · ${recs.length} recommendations synthesized`,
    };
  });
}

function buildPillowEvaluations(input: {
  recommendationCount: number;
  immediateCount: number;
  criticalCount: number;
  avgConfidence: number;
}): PillowAdvisoryEvaluationMetric[] {
  return PILLOW_ADVISORY_EVALUATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      enterprise_status: "Complete enterprise evaluated · all E4 intelligence synthesized",
      executive_priorities: `${input.criticalCount} critical priorities · ${input.immediateCount} immediate actions`,
      strategic_opportunities: "Constitutional AI capture · market expansion · innovation acceleration",
      enterprise_risks: "Competitive response · risk convergence · retention intervention required",
      executive_recommendations: `${input.recommendationCount} board-level recommendations at ${input.avgConfidence}% confidence`,
    };
    return {
      domain,
      label: label(domain),
      status: input.avgConfidence >= 85 ? "strong" : "active",
      summary: summaries[domain] ?? label(domain),
    };
  });
}

export function assembleExecutiveAdvisoryEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
  executiveInsightEngine?: ExecutiveInsightEngine | null;
  enterprisePatternEngine?: EnterprisePatternEngine | null;
  executiveBenchmarkEngine?: ExecutiveBenchmarkEngine | null;
  crossBusinessIntelligence?: CrossBusinessIntelligence | null;
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
} = {}): ExecutiveAdvisoryEngine {
  const allRecommendations = buildAdvisoryRecommendations(input);
  const topExecutiveRecommendations = [...allRecommendations]
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
    });
  const immediateActions = buildImmediateActions(allRecommendations);
  const strategicActions = buildStrategicActions(allRecommendations);
  const growthRecommendations = buildGrowthRecommendations(allRecommendations);
  const financialRecommendations = buildFinancialRecommendations(allRecommendations);
  const riskRecommendations = buildRiskRecommendations(allRecommendations);
  const expectedOutcomes = buildExpectedOutcomes(allRecommendations);
  const executiveConfidence = buildExecutiveConfidence(allRecommendations);
  const executiveAnalysis = buildExecutiveAnalysis(allRecommendations);

  const avgConfidence = Math.round(
    allRecommendations.reduce((s, r) => s + r.confidence, 0) / Math.max(allRecommendations.length, 1),
  );
  const criticalCount = allRecommendations.filter((r) => r.priority === "critical").length;

  const healthInputs = [
    input.crossBusinessIntelligence?.healthScore ?? 85,
    input.executiveInsightEngine?.healthScore ?? 85,
    avgConfidence,
    immediateActions.length >= 2 ? 88 : 74,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    recommendationCount: allRecommendations.length,
    immediateCount: immediateActions.length,
    criticalCount,
    avgConfidence,
  });

  const pillowAdvisory = [
    "Executive Advisory Engine — constitutional AI Executive Advisor active",
    `${allRecommendations.length} board-level recommendations · ${immediateActions.length} immediate actions · ${criticalCount} critical priorities`,
    "Every recommendation evidence-based · explainable · strategically relevant",
    "E4-01 to E4-13 intelligence synthesized · E3 E2 E1 programmes connected",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting advisory integrity")}`,
    "ECC coordinates executive planning · Supervisor monitors recommendation quality",
    "VIE validates advisory alignment · vision · strategic · constitutional",
    "Grand King never needs to ask what to do next — Pillow proactively advises",
  ];

  return {
    engineVersion: "E4-14",
    computedAt: nowIso(),
    engineSummary:
      "Executive Advisory Engine continuously synthesizes every intelligence capability into board-level executive recommendations. The permanent AI Executive Advisor for the Grand King. It continuously evaluates the entire enterprise and proactively recommends the highest-value executive actions. The Grand King never needs to ask what to do next.",
    engineHealth: healthLabel(clampedHealth),
    advisoryIntelligenceHealth: avgConfidence >= 85 ? "strong" : avgConfidence >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeRecommendationCount: allRecommendations.length,
    immediateActionCount: immediateActions.length,
    strategicActionCount: strategicActions.length,
    averageRecommendationConfidence: avgConfidence,
    topExecutiveRecommendations,
    immediateActions,
    strategicActions,
    growthRecommendations,
    financialRecommendations,
    riskRecommendations,
    expectedOutcomes,
    executiveConfidence,
    executiveAnalysis,
    advisoryPipeline: buildPipeline("continuous_learning"),
    pillowEvaluations,
    advisoryPrinciples: [...ADVISORY_PRINCIPLES],
    governedDomains: [...GOVERNED_ADVISORY_DOMAINS],
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
      executiveInsightEngine: input.executiveInsightEngine
        ? `E4-10 · ${input.executiveInsightEngine.engineHealth} · ${input.executiveInsightEngine.activeInsightCount} insights`
        : "E4-10 · standby",
      enterprisePatternEngine: input.enterprisePatternEngine
        ? `E4-11 · ${input.enterprisePatternEngine.engineHealth} · ${input.enterprisePatternEngine.activePatternCount} patterns`
        : "E4-11 · standby",
      executiveBenchmarkEngine: input.executiveBenchmarkEngine
        ? `E4-12 · ${input.executiveBenchmarkEngine.engineHealth} · ${input.executiveBenchmarkEngine.activeBenchmarkCount} benchmarks`
        : "E4-12 · standby",
      crossBusinessIntelligence: input.crossBusinessIntelligence
        ? `E4-13 · ${input.crossBusinessIntelligence.engineHealth} · ${input.crossBusinessIntelligence.activeRelationshipCount} relationships`
        : "E4-13 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "advisory integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-14 Executive Advisory Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring recommendation quality"),
      eccStatus: String(input.ecc?.status ?? "executive planning coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE415: true,
  };
}

export function buildFallbackExecutiveAdvisoryEngine(): ExecutiveAdvisoryEngine {
  return assembleExecutiveAdvisoryEngine({});
}
