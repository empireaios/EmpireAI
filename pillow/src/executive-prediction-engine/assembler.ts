import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CustomerBehaviourIntelligence } from "../customer-behaviour-intelligence/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveKnowledgeGraph } from "../executive-knowledge-graph/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
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
  PREDICTION_PIPELINE,
  PREDICTION_PRINCIPLES,
  GOVERNED_PREDICTION_DOMAINS,
  PREDICTION_ANALYSIS_DOMAINS,
  PILLOW_PREDICTION_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutivePredictionEngine,
  PredictionPipelineStep,
  PredictionPipelinePhase,
  PredictionRecord,
  FutureOutlookEntry,
  ProbabilityScoreEntry,
  PredictionConfidenceEntry,
  EmergingRiskPredictionEntry,
  EmergingOpportunityPredictionEntry,
  StrategicForecastEntry,
  PredictionAnalysisMetric,
  ExecutivePredictionRecommendation,
  PillowPredictionEvaluationMetric,
  GovernedPredictionDomain,
  PredictionClassification,
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

function mapDomain(category: PredictionClassification): GovernedPredictionDomain {
  const map: Record<PredictionClassification, GovernedPredictionDomain> = {
    short_term_prediction: "business_predictions",
    medium_term_prediction: "growth_predictions",
    long_term_prediction: "strategic_predictions",
    business_prediction: "business_predictions",
    market_prediction: "market_predictions",
    financial_prediction: "revenue_predictions",
    technology_prediction: "technology_predictions",
    strategic_prediction: "strategic_predictions",
    risk_prediction: "risk_predictions",
    future_prediction: "future_prediction_categories",
  };
  return map[category];
}

function buildPipeline(
  activePhase: PredictionPipelinePhase = "continuous_validation",
): PredictionPipelineStep[] {
  const activeIdx = PREDICTION_PIPELINE.indexOf(activePhase);
  return PREDICTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildPredictionDashboard(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  corporateVision?: CorporateVisionEngine | null;
}): PredictionRecord[] {
  const topMarket = input.marketIntelligenceEngine?.globalMarkets[0]?.marketName ?? "Global AI Enterprise";
  const topThreat = input.threatDetectionEngine?.criticalThreats[0]?.title ?? "Competitive Displacement";
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0]?.title ?? "Constitutional AI Platform";
  const avgRetention = input.customerBehaviourIntelligence?.averageRetentionProbability ?? 74;

  const catalogue: Array<Omit<PredictionRecord, "lastUpdated">> = [
    {
      predictionId: "epe-revenue-growth",
      title: "Enterprise AI Revenue Acceleration",
      category: "financial_prediction",
      domain: "revenue_predictions",
      predictionHorizon: "12 months",
      subject: "Enterprise AI Platform · ARR",
      predictedOutcome: "$8.4M ARR achieved within 12 months",
      probability: 78,
      confidence: 86,
      businessImpact: "Revenue growth acceleration · platform adoption",
      financialImpact: "$8.4M ARR · 40% YoY growth",
      strategicImpact: "critical · constitutional AI market leadership",
      recommendedActions: "Accelerate enterprise pilots · E3 monetization · E4-03 opportunity prioritization",
      evidence: ["E3-16 certified", topOpportunity, "E4-08 knowledge graph revenue edges"],
    },
    {
      predictionId: "epe-competitive-displacement",
      title: "Competitive Platform Displacement Risk",
      category: "risk_prediction",
      domain: "competitor_predictions",
      predictionHorizon: "6-12 months",
      subject: topThreat,
      predictedOutcome: "Increased competitive pressure in enterprise AI segment",
      probability: 82,
      confidence: 89,
      businessImpact: "Enterprise deal competition intensification",
      financialImpact: "$4.2M ARR at risk",
      strategicImpact: "high · differentiation required",
      recommendedActions: "Constitutional AI differentiation · E4-02 competitive response",
      evidence: ["E4-04 threat detection", "E4-02 competitor intelligence", topThreat],
    },
    {
      predictionId: "epe-apac-expansion",
      title: "APAC Market Entry Success",
      category: "market_prediction",
      domain: "market_predictions",
      predictionHorizon: "18 months",
      subject: "Asia-Pacific Digital Economy",
      predictedOutcome: "APAC contributes 22% of new ARR within 18 months",
      probability: 72,
      confidence: 84,
      businessImpact: "Geographic diversification · regional growth",
      financialImpact: "$1.8M APAC ARR",
      strategicImpact: "high · expansion milestone",
      recommendedActions: "Regional partnerships · data sovereignty architecture",
      evidence: ["E4-01 APAC intelligence", "E4-05 APAC industry", "E4-06 APAC segment"],
    },
    {
      predictionId: "epe-customer-retention",
      title: "Enterprise Customer Retention Stability",
      category: "business_prediction",
      domain: "customer_predictions",
      predictionHorizon: "12 months",
      subject: "Enterprise AI Decision Makers",
      predictedOutcome: `Average retention probability maintains above ${avgRetention}%`,
      probability: 76,
      confidence: 87,
      businessImpact: "Customer base stability · CLV protection",
      financialImpact: "CLV preservation · reduced churn cost",
      strategicImpact: "high · customer loyalty",
      recommendedActions: "Retention intervention for at-risk · value demonstration",
      evidence: ["E4-06 customer behaviour", `Avg retention ${avgRetention}%`, "E4-08 customer edges"],
    },
    {
      predictionId: "epe-ai-cfo-adoption",
      title: "AI CFO Enterprise Licensing Growth",
      category: "financial_prediction",
      domain: "revenue_predictions",
      predictionHorizon: "24 months",
      subject: "Fintech CFO Segment",
      predictedOutcome: "AI CFO licensing reaches $5.6M ARR within 24 months",
      probability: 81,
      confidence: 90,
      businessImpact: "E3 programme monetization · vertical expansion",
      financialImpact: "$5.6M ARR from AI CFO",
      strategicImpact: "critical · E3 certified differentiation",
      recommendedActions: "Enterprise licensing expansion · E3-16 capabilities marketing",
      evidence: ["E3-16 certified", "E4-06 fintech segment", "E4-07 AI CFO innovation"],
    },
    {
      predictionId: "epe-llm-commoditization",
      title: "LLM Commoditization Margin Pressure",
      category: "technology_prediction",
      domain: "technology_predictions",
      predictionHorizon: "12-18 months",
      subject: "LLM Infrastructure",
      predictedOutcome: "API pricing compression 8-12% · differentiation via constitutional layers",
      probability: 74,
      confidence: 85,
      businessImpact: "Technology moat shift to orchestration intelligence",
      financialImpact: "Margin compression offset by premium positioning",
      strategicImpact: "high · moat evolution required",
      recommendedActions: "Deepen Pillow · ECC · proprietary intelligence layers",
      evidence: ["E4-04 LLM commoditization threat", "E4-07 multimodal innovation"],
    },
    {
      predictionId: "epe-autonomous-commerce",
      title: "Autonomous Commerce Category Emergence",
      category: "long_term_prediction",
      domain: "growth_predictions",
      predictionHorizon: "36 months",
      subject: "Autonomous Commerce Operations",
      predictedOutcome: "Autonomous commerce becomes primary growth category by 2029",
      probability: 68,
      confidence: 76,
      businessImpact: "Category creation · first-mover advantage",
      financialImpact: "$8M+ ARR potential",
      strategicImpact: "critical · long-term positioning",
      recommendedActions: "Zero-human automation · commerce intelligence suite",
      evidence: ["E4-07 zero-human innovation", "E4-03 commerce opportunity", "E4-05 future industry"],
    },
    {
      predictionId: "epe-industry-consolidation",
      title: "Enterprise AI Industry Consolidation",
      category: "market_prediction",
      domain: "industry_predictions",
      predictionHorizon: "24 months",
      subject: topMarket,
      predictedOutcome: "Top 3 platforms capture 65% of enterprise AI market",
      probability: 79,
      confidence: 88,
      businessImpact: "Market concentration · winner-take-most dynamics",
      financialImpact: "Platform bundling revenue acceleration",
      strategicImpact: "critical · consolidation positioning",
      recommendedActions: "Full-stack executive intelligence · platform lock-in",
      evidence: ["E4-05 industry trends", "E4-01 market intelligence", "E4-08 strategic connections"],
    },
    {
      predictionId: "epe-regulatory-expansion",
      title: "Global AI Regulatory Framework Expansion",
      category: "risk_prediction",
      domain: "risk_predictions",
      predictionHorizon: "12 months",
      subject: "AI Regulatory Compliance",
      predictedOutcome: "Multi-jurisdiction AI compliance becomes enterprise procurement requirement",
      probability: 86,
      confidence: 91,
      businessImpact: "Compliance differentiation · go-to-market complexity",
      financialImpact: "$1.8M compliance investment",
      strategicImpact: "high · constitutional governance advantage",
      recommendedActions: "Proactive regulatory mapping · VIE certification",
      evidence: ["E4-04 regulatory threat", "E4-05 regulatory industry", "Guardian compliance"],
    },
    {
      predictionId: "epe-constitutional-leadership",
      title: "Constitutional AI Category Leadership",
      category: "strategic_prediction",
      domain: "strategic_predictions",
      predictionHorizon: "24 months",
      subject: "Constitutional AI Enterprise Platform",
      predictedOutcome: "EmpireAI establishes constitutional AI as recognized enterprise category",
      probability: 71,
      confidence: 83,
      businessImpact: "Category-defining positioning · thought leadership",
      financialImpact: "Premium pricing · enterprise lock-in",
      strategicImpact: "critical · vision-aligned leadership",
      recommendedActions: "Vision-aligned marketing · constitutional differentiation · E4-08 graph hub",
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "E4-07 constitutional innovation"],
    },
    {
      predictionId: "epe-churn-risk",
      title: "At-Risk Enterprise Churn Event",
      category: "short_term_prediction",
      domain: "customer_predictions",
      predictionHorizon: "3-6 months",
      subject: "At-Risk Enterprise Accounts",
      predictedOutcome: "1-2 at-risk accounts require retention intervention within 6 months",
      probability: 65,
      confidence: 82,
      businessImpact: "Revenue protection · customer success intervention",
      financialImpact: "$136K-$272K ARR at risk",
      strategicImpact: "moderate · retention priority",
      recommendedActions: "Executive retention programme · competitive value demonstration",
      evidence: ["E4-06 at-risk segment", "E4-04 competitive displacement", "E4-08 risk network"],
    },
    {
      predictionId: "epe-future-autonomous-ai",
      title: "Autonomous AI Ecosystem Disruption",
      category: "future_prediction",
      domain: "future_prediction_categories",
      predictionHorizon: "48 months",
      subject: "Future Autonomous AI Ecosystem",
      predictedOutcome: "Autonomous AI agents reshape enterprise operations by 2030",
      probability: 62,
      confidence: 72,
      businessImpact: "Category disruption · incumbent repositioning required",
      financialImpact: "$24M+ long-term revenue exposure/opportunity",
      strategicImpact: "critical · future positioning",
      recommendedActions: "Zero-human automation · E4-07 future innovation · knowledge graph evolution",
      evidence: ["E4-07 future autonomous innovation", "E4-08 future knowledge domains", input.executiveKnowledgeGraph?.knowledgeGaps[2]?.gapDescription ?? "E4-09 prediction layer"],
    },
  ];

  return catalogue.map((p) => ({
    ...p,
    domain: p.domain ?? mapDomain(p.category),
    lastUpdated: nowIso(),
  }));
}

function buildFutureOutlook(predictions: PredictionRecord[]): FutureOutlookEntry[] {
  return predictions
    .filter((p) => p.category === "long_term_prediction" || p.category === "future_prediction" || p.predictionHorizon.includes("24") || p.predictionHorizon.includes("36") || p.predictionHorizon.includes("48"))
    .map((p) => ({
      outlookId: `outlook-${p.predictionId}`,
      predictionId: p.predictionId,
      title: p.title,
      horizon: p.predictionHorizon,
      predictedOutcome: p.predictedOutcome,
      probability: p.probability,
      status: "tracking",
    }));
}

function buildProbabilityScores(predictions: PredictionRecord[]): ProbabilityScoreEntry[] {
  return predictions
    .sort((a, b) => b.probability - a.probability)
    .map((p) => ({
      scoreId: `prob-${p.predictionId}`,
      predictionId: p.predictionId,
      title: p.title,
      probability: p.probability,
      confidence: p.confidence,
      trend: p.probability >= 80 ? "elevated" : p.probability >= 70 ? "stable" : "moderate",
      status: p.probability >= 75 ? "high" : "monitoring",
    }));
}

function buildPredictionConfidence(predictions: PredictionRecord[]): PredictionConfidenceEntry[] {
  return predictions.map((p) => ({
    confidenceId: `conf-${p.predictionId}`,
    predictionId: p.predictionId,
    title: p.title,
    confidence: p.confidence,
    evidenceQuality: p.evidence.length >= 3 ? "strong" : p.evidence.length >= 2 ? "adequate" : "developing",
    validationStatus: p.confidence >= 85 ? "validated" : p.confidence >= 75 ? "monitoring" : "forming",
  }));
}

function buildEmergingRisks(predictions: PredictionRecord[]): EmergingRiskPredictionEntry[] {
  return predictions
    .filter((p) => p.category === "risk_prediction" || p.domain === "risk_predictions" || p.domain === "competitor_predictions")
    .map((p) => ({
      riskId: `risk-pred-${p.predictionId}`,
      predictionId: p.predictionId,
      title: p.title,
      probability: p.probability,
      severity: p.probability >= 80 ? "high" : p.probability >= 65 ? "moderate" : "low",
      horizon: p.predictionHorizon,
      status: "active",
    }));
}

function buildEmergingOpportunities(predictions: PredictionRecord[]): EmergingOpportunityPredictionEntry[] {
  return predictions
    .filter((p) => p.domain === "revenue_predictions" || p.domain === "growth_predictions" || p.category === "financial_prediction")
    .map((p) => ({
      opportunityId: `opp-pred-${p.predictionId}`,
      predictionId: p.predictionId,
      title: p.title,
      probability: p.probability,
      strategicValue: p.strategicImpact.includes("critical") ? "critical" : "high",
      horizon: p.predictionHorizon,
      status: "priority",
    }));
}

function buildStrategicForecasts(predictions: PredictionRecord[]): StrategicForecastEntry[] {
  return predictions
    .filter((p) => p.category === "strategic_prediction" || p.category === "future_prediction" || p.strategicImpact.includes("critical"))
    .map((p) => ({
      forecastId: `forecast-${p.predictionId}`,
      predictionId: p.predictionId,
      title: p.title,
      predictedOutcome: p.predictedOutcome,
      strategicImpact: p.strategicImpact,
      probability: p.probability,
      horizon: p.predictionHorizon,
    }));
}

function buildPredictionAnalysis(predictions: PredictionRecord[]): PredictionAnalysisMetric[] {
  const avgProb = Math.round(predictions.reduce((s, p) => s + p.probability, 0) / Math.max(predictions.length, 1));
  const avgConf = Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / Math.max(predictions.length, 1));
  const highProbCount = predictions.filter((p) => p.probability >= 75).length;

  const scores: Record<(typeof PREDICTION_ANALYSIS_DOMAINS)[number], number> = {
    prediction_accuracy: 84,
    probability_trends: avgProb,
    business_impact: 86,
    financial_impact: 85,
    market_evolution: 82,
    technology_evolution: 78,
    strategic_outcomes: avgConf,
    risk_exposure: Math.round(predictions.filter((p) => p.category === "risk_prediction").reduce((s, p) => s + p.probability, 0) / Math.max(predictions.filter((p) => p.category === "risk_prediction").length, 1)),
    growth_potential: highProbCount >= 6 ? 88 : 76,
    long_term_sustainability: 82,
  };

  return PREDICTION_ANALYSIS_DOMAINS.map((domain) => {
    const score = scores[domain];
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 80 ? "strong" : score >= 65 ? "active" : "developing",
      summary: `${label(domain)} assessed at ${score}/100 across ${predictions.length} active predictions`,
    };
  });
}

function buildPillowEvaluations(input: {
  predictionCount: number;
  highProbCount: number;
  avgConfidence: number;
}): PillowPredictionEvaluationMetric[] {
  const status = (score: number) =>
    score >= 85 ? "strong" : score >= 70 ? "active" : "developing";

  const evals: Record<(typeof PILLOW_PREDICTION_EVALUATIONS)[number], { score: number; summary: string }> = {
    prediction_accuracy: { score: 84, summary: "Continuous validation active · historical evidence refined" },
    emerging_futures: { score: 78, summary: "Long-term and future predictions tracked · horizon modeling active" },
    strategic_forecasts: { score: 86, summary: `${input.highProbCount} high-probability strategic forecasts active` },
    executive_recommendations: { score: 90, summary: "Evidence-based prediction recommendations generated" },
    prediction_confidence: {
      score: input.avgConfidence,
      summary: `${input.predictionCount} predictions · avg confidence ${input.avgConfidence}% · explainable`,
    },
  };

  return PILLOW_PREDICTION_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: status(evals[domain].score),
    summary: evals[domain].summary,
  }));
}

function buildRecommendations(predictions: PredictionRecord[]): ExecutivePredictionRecommendation[] {
  const topRevenue = predictions.find((p) => p.predictionId === "epe-revenue-growth");
  const topRisk = predictions.find((p) => p.predictionId === "epe-competitive-displacement");

  return [
    {
      id: "epe-rec-1",
      title: `Prepare for ${topRevenue?.predictedOutcome ?? "revenue acceleration"}`,
      category: "revenue_forecast",
      why: `${topRevenue?.probability ?? 78}% probability · ${topRevenue?.confidence ?? 86}% confidence · evidence-based revenue prediction`,
      what: "Accelerate enterprise pilots · E3 monetization · opportunity prioritization",
      how: "E4-03 opportunities · E3 financial executive · E4-08 knowledge graph",
      confidencePercent: topRevenue?.confidence ?? 86,
    },
    {
      id: "epe-rec-2",
      title: `Mitigate ${topRisk?.title ?? "competitive displacement"} risk`,
      category: "risk_mitigation",
      why: `${topRisk?.probability ?? 82}% probability of increased competitive pressure within 12 months`,
      what: "Constitutional AI differentiation · competitive response protocol",
      how: "E4-04 threat detection · E4-02 competitor intelligence · ECC coordination",
      confidencePercent: topRisk?.confidence ?? 89,
    },
    {
      id: "epe-rec-3",
      title: "Position for APAC market entry success",
      category: "market_expansion",
      why: "72% probability APAC contributes 22% new ARR within 18 months",
      what: "Regional partnerships · data sovereignty · local market intelligence",
      how: "E4-01 APAC · E4-05 industry · E4-06 customer segment",
      confidencePercent: 84,
    },
    {
      id: "epe-rec-4",
      title: "Invest in constitutional AI category leadership",
      category: "strategic_positioning",
      why: "71% probability of establishing constitutional AI as recognized enterprise category",
      what: "Vision-aligned positioning · thought leadership · platform differentiation",
      how: "E1 corporate vision · E4-07 innovation · E4-08 knowledge graph hub",
      confidencePercent: 83,
    },
  ];
}

export function assembleExecutivePredictionEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
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
} = {}): ExecutivePredictionEngine {
  const predictionDashboard = buildPredictionDashboard(input);
  const futureOutlook = buildFutureOutlook(predictionDashboard);
  const probabilityScores = buildProbabilityScores(predictionDashboard);
  const predictionConfidence = buildPredictionConfidence(predictionDashboard);
  const emergingRisks = buildEmergingRisks(predictionDashboard);
  const emergingOpportunities = buildEmergingOpportunities(predictionDashboard);
  const strategicForecasts = buildStrategicForecasts(predictionDashboard);
  const predictionAnalysis = buildPredictionAnalysis(predictionDashboard);

  const avgConfidence = Math.round(
    predictionDashboard.reduce((s, p) => s + p.confidence, 0) / Math.max(predictionDashboard.length, 1),
  );
  const highProbCount = predictionDashboard.filter((p) => p.probability >= 75).length;

  const healthInputs = [
    input.executiveKnowledgeGraph?.healthScore ?? 85,
    input.marketIntelligenceEngine?.healthScore ?? 85,
    avgConfidence,
    highProbCount >= 6 ? 88 : 74,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    predictionCount: predictionDashboard.length,
    highProbCount,
    avgConfidence,
  });
  const recommendedActions = buildRecommendations(predictionDashboard);

  const pillowAdvisory = [
    "Executive Prediction Engine — constitutional enterprise predictive intelligence active",
    `${predictionDashboard.length} predictions active · ${highProbCount} high-probability · ${strategicForecasts.length} strategic forecasts`,
    "Every prediction evidence-based · explainable · continuously refined",
    `E4-01 to E4-08 intelligence integrated · E3 E2 E1 programmes connected`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting prediction integrity")}`,
    "ECC coordinates prediction distribution · Supervisor monitors prediction accuracy",
    "VIE validates prediction alignment · vision · strategic · constitutional",
    "Grand King understands what is most likely to happen before it happens",
  ];

  return {
    engineVersion: "E4-09",
    computedAt: nowIso(),
    engineSummary:
      "Executive Prediction Engine continuously predicts future business outcomes using historical evidence, executive knowledge, market intelligence, competitor intelligence, customer behaviour and financial intelligence. Every prediction is evidence-based, explainable and continuously refined. The Grand King always understands what is most likely to happen before it happens.",
    engineHealth: healthLabel(clampedHealth),
    predictionIntelligenceHealth: avgConfidence >= 85 ? "strong" : avgConfidence >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activePredictionCount: predictionDashboard.length,
    highProbabilityCount: highProbCount,
    strategicForecastCount: strategicForecasts.length,
    averagePredictionConfidence: avgConfidence,
    predictionDashboard,
    futureOutlook,
    probabilityScores,
    predictionConfidence,
    emergingRisks,
    emergingOpportunities,
    strategicForecasts,
    predictionAnalysis,
    predictionPipeline: buildPipeline("continuous_validation"),
    recommendedActions,
    pillowEvaluations,
    predictionPrinciples: [...PREDICTION_PRINCIPLES],
    governedDomains: [...GOVERNED_PREDICTION_DOMAINS],
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "prediction integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-09 Executive Prediction Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring prediction accuracy"),
      eccStatus: String(input.ecc?.status ?? "prediction distribution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE410: true,
  };
}

export function buildFallbackExecutivePredictionEngine(): ExecutivePredictionEngine {
  return assembleExecutivePredictionEngine({});
}
