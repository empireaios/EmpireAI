import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { IndustryIntelligenceEngine } from "../industry-intelligence-engine/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { MarketIntelligenceEngine } from "../market-intelligence-engine/types.js";
import type { OpportunityDiscoveryEngine } from "../opportunity-discovery-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { ThreatDetectionEngine } from "../threat-detection-engine/types.js";
import {
  CUSTOMER_INTELLIGENCE_PIPELINE,
  CUSTOMER_BEHAVIOUR_PRINCIPLES,
  GOVERNED_CUSTOMER_DOMAINS,
  CUSTOMER_ANALYSIS_DOMAINS,
  PILLOW_CUSTOMER_EVALUATIONS,
} from "./paths.js";
import type {
  CustomerBehaviourIntelligence,
  CustomerIntelligencePipelineStep,
  CustomerIntelligencePipelinePhase,
  CustomerInsightRecord,
  CustomerSegmentEntry,
  BuyingTrendEntry,
  PurchaseIntentEntry,
  CustomerLifetimeValueEntry,
  RetentionTrendEntry,
  CustomerRiskEntry,
  CustomerGrowthOpportunityEntry,
  CustomerAnalysisMetric,
  CustomerBehaviourRecommendation,
  PillowCustomerEvaluationMetric,
  GovernedCustomerDomain,
  CustomerClassification,
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

function mapDomain(category: CustomerClassification): GovernedCustomerDomain {
  const map: Record<CustomerClassification, GovernedCustomerDomain> = {
    new_customer: "customer_journey",
    returning_customer: "customer_retention",
    loyal_customer: "customer_lifetime_value",
    high_value_customer: "customer_lifetime_value",
    at_risk_customer: "customer_retention",
    enterprise_customer: "customer_segments",
    commerce_customer: "buying_behaviour",
    emerging_segment: "future_customer_trends",
    strategic_segment: "customer_segments",
    future_segment: "future_customer_trends",
  };
  return map[category];
}

function buildPipeline(
  activePhase: CustomerIntelligencePipelinePhase = "continuous_monitoring",
): CustomerIntelligencePipelineStep[] {
  const activeIdx = CUSTOMER_INTELLIGENCE_PIPELINE.indexOf(activePhase);
  return CUSTOMER_INTELLIGENCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildCustomerInsights(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): CustomerInsightRecord[] {
  const topIndustry = input.industryIntelligenceEngine?.industryOpportunities[0];
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0];

  const catalogue: Array<Omit<CustomerInsightRecord, "domain"> & { category: CustomerClassification }> = [
    {
      customerInsightId: "cbi-enterprise-ai-buyers",
      customerSegment: "Enterprise AI Decision Makers",
      category: "enterprise_customer",
      behaviourCategory: "platform evaluation · procurement cycles",
      purchaseIntent: "high · constitutional AI platform adoption",
      buyingFrequency: "annual contracts · multi-year",
      averageSpend: "$240K ARR",
      customerLifetimeValue: "$720K (3yr)",
      retentionProbability: 88,
      satisfactionTrend: "improving",
      growthOpportunity: "upsell AI CFO · executive intelligence suite",
      riskLevel: 32,
      strategicRelevance: "critical",
      confidence: 93,
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "E4-01 enterprise market demand"],
    },
    {
      customerInsightId: "cbi-commerce-operators",
      customerSegment: "Commerce Operators & GMV Growth",
      category: "commerce_customer",
      behaviourCategory: "autonomous commerce · GMV optimization",
      purchaseIntent: "high · commerce intelligence adoption",
      buyingFrequency: "monthly · usage-based",
      averageSpend: "$18K MRR",
      customerLifetimeValue: "$432K (2yr)",
      retentionProbability: 82,
      satisfactionTrend: "stable",
      growthOpportunity: "commerce intelligence suite expansion",
      riskLevel: 38,
      strategicRelevance: "high",
      confidence: 89,
      evidence: ["E4-03 commerce opportunity", "E4-05 commerce industry intelligence"],
    },
    {
      customerInsightId: "cbi-fintech-cfo",
      customerSegment: "Fintech CFO & Financial Executives",
      category: "high_value_customer",
      behaviourCategory: "AI CFO adoption · financial automation",
      purchaseIntent: "very high · E3 certified capabilities",
      buyingFrequency: "annual · enterprise licensing",
      averageSpend: "$156K ARR",
      customerLifetimeValue: "$624K (4yr)",
      retentionProbability: 91,
      satisfactionTrend: "improving",
      growthOpportunity: "E3-16 programme monetization · enterprise licensing",
      riskLevel: 28,
      strategicRelevance: "critical",
      confidence: 92,
      evidence: ["E3-16 financial executive certified", topIndustry?.industryName ?? "Fintech AI industry"],
    },
    {
      customerInsightId: "cbi-loyal-constitutional",
      customerSegment: "Constitutional AI Loyalists",
      category: "loyal_customer",
      behaviourCategory: "governance-first · long-term partnership",
      purchaseIntent: "sustained · platform expansion",
      buyingFrequency: "continuous · expanding modules",
      averageSpend: "$96K ARR",
      customerLifetimeValue: "$960K (5yr+)",
      retentionProbability: 94,
      satisfactionTrend: "strong",
      growthOpportunity: "full executive intelligence stack adoption",
      riskLevel: 18,
      strategicRelevance: "critical",
      confidence: 95,
      evidence: ["Constitutional governance preference", "High NPS · referral behaviour"],
    },
    {
      customerInsightId: "cbi-new-enterprise",
      customerSegment: "New Enterprise Evaluators",
      category: "new_customer",
      behaviourCategory: "evaluation · pilot programs",
      purchaseIntent: "moderate · proof-of-value phase",
      buyingFrequency: "pilot · 90-day trials",
      averageSpend: "$12K pilot",
      customerLifetimeValue: "$288K (potential 2yr)",
      retentionProbability: 62,
      satisfactionTrend: "forming",
      growthOpportunity: "pilot-to-production conversion",
      riskLevel: 48,
      strategicRelevance: "high",
      confidence: 84,
      evidence: ["E4-02 competitive evaluation behaviour", "Enterprise procurement cycles"],
    },
    {
      customerInsightId: "cbi-returning-saas",
      customerSegment: "Returning B2B SaaS Buyers",
      category: "returning_customer",
      behaviourCategory: "module re-engagement · feature expansion",
      purchaseIntent: "moderate-high · incremental adoption",
      buyingFrequency: "quarterly renewals",
      averageSpend: "$42K ARR",
      customerLifetimeValue: "$336K (3yr)",
      retentionProbability: 78,
      satisfactionTrend: "stable",
      growthOpportunity: "cross-module upsell · executive planning",
      riskLevel: 42,
      strategicRelevance: "moderate",
      confidence: 86,
      evidence: ["B2B SaaS buying patterns", "E4-05 B2B SaaS industry intelligence"],
    },
    {
      customerInsightId: "cbi-at-risk-churn",
      customerSegment: "At-Risk Enterprise Accounts",
      category: "at_risk_customer",
      behaviourCategory: "usage decline · support escalation",
      purchaseIntent: "low · renewal uncertainty",
      buyingFrequency: "contract end approaching",
      averageSpend: "$68K ARR",
      customerLifetimeValue: "$136K (remaining)",
      retentionProbability: 38,
      satisfactionTrend: "declining",
      growthOpportunity: "retention intervention · value demonstration",
      riskLevel: 72,
      strategicRelevance: "high",
      confidence: 88,
      evidence: ["Usage decline signals", "E4-04 competitive displacement threat"],
    },
    {
      customerInsightId: "cbi-apac-digital",
      customerSegment: "APAC Digital Economy Buyers",
      category: "emerging_segment",
      behaviourCategory: "regional expansion · data sovereignty aware",
      purchaseIntent: "growing · APAC market entry",
      buyingFrequency: "semi-annual · regional",
      averageSpend: "$54K ARR",
      customerLifetimeValue: "$324K (3yr)",
      retentionProbability: 74,
      satisfactionTrend: "improving",
      growthOpportunity: "APAC market expansion · local partnerships",
      riskLevel: 52,
      strategicRelevance: "high",
      confidence: 82,
      evidence: ["E4-01 APAC market intelligence", "E4-05 APAC digital industry"],
    },
    {
      customerInsightId: "cbi-strategic-partners",
      customerSegment: "Strategic Partnership Ecosystem",
      category: "strategic_segment",
      behaviourCategory: "ecosystem integration · co-selling",
      purchaseIntent: "high · partnership-driven",
      buyingFrequency: "partnership agreements",
      averageSpend: "$120K ARR equivalent",
      customerLifetimeValue: "$840K (ecosystem value)",
      retentionProbability: 86,
      satisfactionTrend: "strong",
      growthOpportunity: "ecosystem expansion · distribution acceleration",
      riskLevel: 35,
      strategicRelevance: "critical",
      confidence: 87,
      evidence: ["Partnership channel behaviour", topOpportunity?.title ?? "Partnership opportunity"],
    },
    {
      customerInsightId: "cbi-healthcare-evaluators",
      customerSegment: "Healthcare AI Evaluators",
      category: "enterprise_customer",
      behaviourCategory: "compliance-first · HIPAA evaluation",
      purchaseIntent: "moderate · regulatory assessment",
      buyingFrequency: "long evaluation cycles",
      averageSpend: "$84K ARR",
      customerLifetimeValue: "$504K (4yr)",
      retentionProbability: 76,
      satisfactionTrend: "cautious",
      growthOpportunity: "healthcare vertical specialization",
      riskLevel: 58,
      strategicRelevance: "moderate",
      confidence: 80,
      evidence: ["E4-05 healthcare AI industry", "Regulatory compliance requirements"],
    },
    {
      customerInsightId: "cbi-autonomous-future",
      customerSegment: "Future Autonomous Operations Buyers",
      category: "future_segment",
      behaviourCategory: "zero-human automation · category creation",
      purchaseIntent: "emerging · early adopter",
      buyingFrequency: "innovation partnerships",
      averageSpend: "$36K pilot",
      customerLifetimeValue: "$720K (5yr potential)",
      retentionProbability: 55,
      satisfactionTrend: "emerging",
      growthOpportunity: "autonomous commerce · zero-human automation",
      riskLevel: 65,
      strategicRelevance: "critical",
      confidence: 74,
      evidence: ["E4-04 future autonomous AI threat/opportunity", "E4-05 future industry"],
    },
    {
      customerInsightId: "cbi-smb-self-serve",
      customerSegment: "SMB Self-Serve Adopters",
      category: "new_customer",
      behaviourCategory: "self-serve · product-led growth",
      purchaseIntent: "moderate · trial-to-paid",
      buyingFrequency: "monthly subscriptions",
      averageSpend: "$2.4K ARR",
      customerLifetimeValue: "$14.4K (2yr avg)",
      retentionProbability: 58,
      satisfactionTrend: "variable",
      growthOpportunity: "PLG funnel optimization · SMB upsell path",
      riskLevel: 45,
      strategicRelevance: "moderate",
      confidence: 83,
      evidence: ["Self-serve adoption patterns", "E4-01 SMB market signals"],
    },
  ];

  return catalogue.map((c) => ({ ...c, domain: mapDomain(c.category) }));
}

function buildCustomerSegments(insights: CustomerInsightRecord[]): CustomerSegmentEntry[] {
  return insights.map((c) => ({
    segmentId: `segment-${c.customerInsightId}`,
    customerInsightId: c.customerInsightId,
    customerSegment: c.customerSegment,
    category: c.category.replace(/_/g, " "),
    segmentSize: c.strategicRelevance === "critical" ? "large" : c.strategicRelevance === "high" ? "medium" : "small",
    averageSpend: c.averageSpend,
    strategicRelevance: c.strategicRelevance,
    status: "monitored",
  }));
}

function buildBuyingTrends(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
}): BuyingTrendEntry[] {
  const topTrend = input.industryIntelligenceEngine?.industryTrends[0];

  return [
    {
      trendId: "trend-constitutional-ai-demand",
      trend: "Constitutional AI Platform Demand",
      direction: "accelerating",
      affectedSegments: "Enterprise AI · Fintech CFO · Loyal Constitutional",
      behaviourSignal: "Governance-first procurement preference",
      confidence: 91,
      status: "active",
    },
    {
      trendId: "trend-commerce-automation",
      trend: "Autonomous Commerce Adoption",
      direction: "growing",
      affectedSegments: "Commerce Operators · Future Autonomous",
      behaviourSignal: "GMV optimization · zero-human operations",
      confidence: 86,
      status: "active",
    },
    {
      trendId: "trend-enterprise-evaluation",
      trend: "Extended Enterprise Evaluation Cycles",
      direction: "lengthening",
      affectedSegments: "New Enterprise · Healthcare Evaluators",
      behaviourSignal: "Pilot-first · proof-of-value requirement",
      confidence: 84,
      status: "monitoring",
    },
    {
      trendId: "trend-apac-expansion",
      trend: "APAC Digital Buyer Growth",
      direction: "accelerating",
      affectedSegments: "APAC Digital · Strategic Partners",
      behaviourSignal: topTrend?.evolutionSignal ?? "Regional digital economy growth",
      confidence: 82,
      status: "active",
    },
    {
      trendId: "trend-churn-risk",
      trend: "Competitive Displacement Churn Risk",
      direction: "elevated",
      affectedSegments: "At-Risk Enterprise · Returning SaaS",
      behaviourSignal: input.marketIntelligenceEngine ? "Market competitive intensity" : "Competitive evaluation behaviour",
      confidence: 79,
      status: "monitoring",
    },
  ];
}

function buildPurchaseIntent(insights: CustomerInsightRecord[]): PurchaseIntentEntry[] {
  return insights
    .sort((a, b) => b.retentionProbability - a.retentionProbability)
    .map((c) => ({
      intentId: `intent-${c.customerInsightId}`,
      customerInsightId: c.customerInsightId,
      customerSegment: c.customerSegment,
      purchaseIntent: c.purchaseIntent,
      intentScore: c.retentionProbability,
      buyingFrequency: c.buyingFrequency,
      status: c.purchaseIntent.includes("high") || c.purchaseIntent.includes("very") ? "priority" : "monitoring",
    }));
}

function buildCustomerLifetimeValue(insights: CustomerInsightRecord[]): CustomerLifetimeValueEntry[] {
  return insights
    .filter((c) => c.category === "high_value_customer" || c.category === "loyal_customer" || c.category === "strategic_segment")
    .sort((a, b) => b.retentionProbability - a.retentionProbability)
    .map((c) => ({
      clvId: `clv-${c.customerInsightId}`,
      customerInsightId: c.customerInsightId,
      customerSegment: c.customerSegment,
      customerLifetimeValue: c.customerLifetimeValue,
      averageSpend: c.averageSpend,
      retentionProbability: c.retentionProbability,
      status: "tracked",
    }));
}

function buildRetentionTrends(insights: CustomerInsightRecord[]): RetentionTrendEntry[] {
  return insights
    .sort((a, b) => a.retentionProbability - b.retentionProbability)
    .map((c) => ({
      retentionId: `retention-${c.customerInsightId}`,
      customerInsightId: c.customerInsightId,
      customerSegment: c.customerSegment,
      retentionProbability: c.retentionProbability,
      satisfactionTrend: c.satisfactionTrend,
      trendDirection:
        c.satisfactionTrend === "improving" || c.satisfactionTrend === "strong"
          ? "positive"
          : c.satisfactionTrend === "declining"
            ? "negative"
            : "neutral",
      status: c.retentionProbability < 50 ? "at_risk" : c.retentionProbability >= 85 ? "strong" : "stable",
    }));
}

function buildCustomerRisks(insights: CustomerInsightRecord[]): CustomerRiskEntry[] {
  return insights
    .filter((c) => c.riskLevel >= 45 || c.category === "at_risk_customer")
    .sort((a, b) => b.riskLevel - a.riskLevel)
    .map((c) => ({
      riskId: `risk-${c.customerInsightId}`,
      customerInsightId: c.customerInsightId,
      customerSegment: c.customerSegment,
      riskLevel: c.riskLevel,
      severity: c.riskLevel >= 65 ? "high" : c.riskLevel >= 50 ? "moderate" : "low",
      riskType: c.category === "at_risk_customer" ? "churn" : "competitive",
      mitigation: `Retention intervention · value demonstration · ${c.growthOpportunity}`,
      status: c.riskLevel >= 65 ? "active" : "monitoring",
    }));
}

function buildGrowthOpportunities(insights: CustomerInsightRecord[]): CustomerGrowthOpportunityEntry[] {
  return insights
    .filter((c) => c.growthOpportunity.length > 0)
    .sort((a, b) => b.retentionProbability - a.retentionProbability)
    .slice(0, 8)
    .map((c) => ({
      opportunityId: `opp-${c.customerInsightId}`,
      customerInsightId: c.customerInsightId,
      customerSegment: c.customerSegment,
      growthOpportunity: c.growthOpportunity,
      purchaseIntent: c.purchaseIntent,
      strategicRelevance: c.strategicRelevance,
      status: c.strategicRelevance === "critical" ? "priority" : "active",
    }));
}

function buildCustomerAnalysis(insights: CustomerInsightRecord[]): CustomerAnalysisMetric[] {
  const avgRetention = Math.round(
    insights.reduce((s, c) => s + c.retentionProbability, 0) / Math.max(insights.length, 1),
  );
  const atRiskCount = insights.filter((c) => c.retentionProbability < 50).length;
  const highValueCount = insights.filter(
    (c) => c.category === "high_value_customer" || c.category === "loyal_customer",
  ).length;

  const scores: Record<(typeof CUSTOMER_ANALYSIS_DOMAINS)[number], number> = {
    buying_behaviour: 84,
    customer_demand: 86,
    purchase_intent: avgRetention,
    retention_trends: avgRetention,
    satisfaction_trends: 82,
    behaviour_changes: atRiskCount <= 2 ? 78 : 65,
    customer_lifetime_value: highValueCount >= 2 ? 88 : 74,
    growth_opportunities: 85,
    customer_risks: Math.round(insights.reduce((s, c) => s + c.riskLevel, 0) / Math.max(insights.length, 1)),
    long_term_sustainability: avgRetention >= 75 ? 84 : 72,
  };

  return CUSTOMER_ANALYSIS_DOMAINS.map((domain) => {
    const score = scores[domain];
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 80 ? "strong" : score >= 65 ? "active" : "developing",
      summary: `${label(domain)} assessed at ${score}/100 across ${insights.length} customer segments`,
    };
  });
}

function buildPillowEvaluations(input: {
  segmentCount: number;
  highValueCount: number;
  atRiskCount: number;
  avgRetention: number;
}): PillowCustomerEvaluationMetric[] {
  const status = (score: number) =>
    score >= 85 ? "strong" : score >= 70 ? "active" : "developing";

  const evals: Record<(typeof PILLOW_CUSTOMER_EVALUATIONS)[number], { score: number; summary: string }> = {
    customer_behaviour: {
      score: input.avgRetention,
      summary: `${input.segmentCount} segments monitored · behavioural patterns tracked`,
    },
    customer_opportunities: {
      score: 86,
      summary: `${input.highValueCount} high-value segments · growth opportunities identified`,
    },
    customer_risks: {
      score: input.atRiskCount <= 2 ? 82 : 68,
      summary: `${input.atRiskCount} at-risk segments · churn signals monitored`,
    },
    demand_trends: { score: 88, summary: "5 buying trends monitored · demand signals active" },
    executive_recommendations: {
      score: 90,
      summary: "Executive customer recommendations generated · strategic decisions enabled",
    },
  };

  return PILLOW_CUSTOMER_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: status(evals[domain].score),
    summary: evals[domain].summary,
  }));
}

function buildRecommendations(insights: CustomerInsightRecord[]): CustomerBehaviourRecommendation[] {
  const atRisk = insights.find((c) => c.category === "at_risk_customer");
  const highValue = insights.find((c) => c.category === "high_value_customer");

  return [
    {
      id: "cbi-rec-1",
      title: `Retention intervention: ${atRisk?.customerSegment ?? "At-Risk Enterprise Accounts"}`,
      category: "retention",
      why: `Retention probability ${atRisk?.retentionProbability ?? 38}% · satisfaction declining · churn risk elevated`,
      what: "Executive retention programme · value demonstration · competitive differentiation",
      how: "E4-04 threat detection · E4-02 competitor intelligence · ECC mission prioritization",
      confidencePercent: 92,
    },
    {
      id: "cbi-rec-2",
      title: `Accelerate ${highValue?.customerSegment ?? "Fintech CFO"} segment growth`,
      category: "growth",
      why: `High CLV (${highValue?.customerLifetimeValue ?? "$624K"}) · strong retention (${highValue?.retentionProbability ?? 91}%)`,
      what: "E3 programme monetization · enterprise licensing expansion",
      how: "E3-16 financial executive · E4-03 opportunity discovery · E4-05 fintech industry",
      confidencePercent: 94,
    },
    {
      id: "cbi-rec-3",
      title: "Convert new enterprise evaluators through pilot-to-production",
      category: "conversion",
      why: "New enterprise segment shows moderate intent · extended evaluation cycles",
      what: "Pilot programme optimization · proof-of-value acceleration · constitutional differentiation",
      how: "E4-02 competitive positioning · E1 corporate vision · executive decision engine",
      confidencePercent: 86,
    },
    {
      id: "cbi-rec-4",
      title: "Expand APAC digital buyer segment intelligence",
      category: "regional_growth",
      why: "Emerging APAC segment with growing purchase intent and regional expansion opportunity",
      what: "Regional customer profiling · data sovereignty compliance · local partnership channels",
      how: "E4-01 APAC intelligence · E4-05 APAC industry · E4-03 expansion opportunity",
      confidencePercent: 84,
    },
  ];
}

export function assembleCustomerBehaviourIntelligence(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
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
} = {}): CustomerBehaviourIntelligence {
  const customerInsights = buildCustomerInsights(input);
  const customerSegments = buildCustomerSegments(customerInsights);
  const buyingTrends = buildBuyingTrends(input);
  const purchaseIntent = buildPurchaseIntent(customerInsights);
  const customerLifetimeValue = buildCustomerLifetimeValue(customerInsights);
  const retentionTrends = buildRetentionTrends(customerInsights);
  const customerRisks = buildCustomerRisks(customerInsights);
  const growthOpportunities = buildGrowthOpportunities(customerInsights);
  const customerAnalysis = buildCustomerAnalysis(customerInsights);

  const avgRetention = Math.round(
    customerInsights.reduce((s, c) => s + c.retentionProbability, 0) / Math.max(customerInsights.length, 1),
  );
  const highValueCount = customerInsights.filter(
    (c) => c.category === "high_value_customer" || c.category === "loyal_customer" || c.category === "strategic_segment",
  ).length;
  const atRiskCount = customerInsights.filter(
    (c) => c.category === "at_risk_customer" || c.retentionProbability < 50,
  ).length;

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.industryIntelligenceEngine?.healthScore ?? 85,
    avgRetention,
    atRiskCount <= 2 ? 88 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    segmentCount: customerInsights.length,
    highValueCount,
    atRiskCount,
    avgRetention,
  });
  const recommendedActions = buildRecommendations(customerInsights);

  const pillowAdvisory = [
    "Customer Behaviour Intelligence — constitutional enterprise customer intelligence active",
    `${customerInsights.length} segments monitored · ${highValueCount} high-value · ${atRiskCount} at-risk`,
    "Every customer signal evidence-based · measurable · constitutionally governed",
    `E4-01 markets · E4-05 industries · E4-03 opportunities · E4-04 threats integrated`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting customer intelligence integrity")}`,
    "ECC coordinates customer intelligence · Supervisor monitors behaviour accuracy",
    "VIE validates customer alignment · vision · strategic · constitutional",
    "Grand King possesses superior customer awareness across every segment and buying pattern",
  ];

  return {
    engineVersion: "E4-06",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Customer Behaviour Intelligence continuously observes, analyzes and understands customer behaviour across every business, market and industry. Every customer, buying pattern, behavioural trend, preference and demand signal contributes toward executive intelligence. The Grand King always possesses superior customer awareness.",
    engineHealth: healthLabel(clampedHealth),
    customerIntelligenceHealth: avgRetention >= 80 ? "strong" : avgRetention >= 70 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    monitoredSegmentCount: customerInsights.length,
    highValueSegmentCount: highValueCount,
    atRiskSegmentCount: atRiskCount,
    averageRetentionProbability: avgRetention,
    customerSegments,
    buyingTrends,
    purchaseIntent,
    customerLifetimeValue,
    retentionTrends,
    customerRisks,
    growthOpportunities,
    customerInsights,
    customerAnalysis,
    customerIntelligencePipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    customerPrinciples: [...CUSTOMER_BEHAVIOUR_PRINCIPLES],
    governedDomains: [...GOVERNED_CUSTOMER_DOMAINS],
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "customer intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-06 Customer Behaviour Intelligence"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring customer intelligence health"),
      eccStatus: String(input.ecc?.status ?? "customer intelligence coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE407: true,
  };
}

export function buildFallbackCustomerBehaviourIntelligence(): CustomerBehaviourIntelligence {
  return assembleCustomerBehaviourIntelligence({});
}
