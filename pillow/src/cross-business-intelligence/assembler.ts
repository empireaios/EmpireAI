import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
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
  CROSS_BUSINESS_PIPELINE,
  CROSS_BUSINESS_PRINCIPLES,
  GOVERNED_CROSS_BUSINESS_DOMAINS,
  CROSS_BUSINESS_ANALYSIS_DOMAINS,
  PILLOW_CROSS_BUSINESS_EVALUATIONS,
} from "./paths.js";
import type {
  CrossBusinessIntelligence,
  CrossBusinessPipelineStep,
  CrossBusinessPipelinePhase,
  BusinessRelationshipRecord,
  EnterpriseSynergyEntry,
  KnowledgeSharingEntry,
  CrossBusinessOpportunityEntry,
  CrossBusinessRiskEntry,
  EnterprisePatternEntry,
  CrossBusinessAnalysisMetric,
  CrossBusinessRecommendation,
  ExecutiveIntelligenceSummaryEntry,
  PillowCrossBusinessEvaluationMetric,
  GovernedCrossBusinessDomain,
  RelationshipClassification,
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

function mapDomain(category: RelationshipClassification): GovernedCrossBusinessDomain {
  const map: Record<RelationshipClassification, GovernedCrossBusinessDomain> = {
    knowledge_relationship: "cross_business_knowledge",
    strategic_relationship: "cross_business_collaboration",
    operational_relationship: "cross_business_performance",
    financial_relationship: "cross_business_benchmarking",
    technology_relationship: "cross_business_innovation",
    customer_relationship: "business_intelligence_sharing",
    growth_relationship: "cross_business_opportunities",
    innovation_relationship: "cross_business_innovation",
    risk_relationship: "cross_business_risks",
    future_relationship: "future_enterprise_intelligence",
  };
  return map[category];
}

function buildPipeline(
  activePhase: CrossBusinessPipelinePhase = "continuous_learning",
): CrossBusinessPipelineStep[] {
  const activeIdx = CROSS_BUSINESS_PIPELINE.indexOf(activePhase);
  return CROSS_BUSINESS_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildBusinessRelationships(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  innovationIntelligenceEngine?: InnovationIntelligenceEngine | null;
  executiveKnowledgeGraph?: ExecutiveKnowledgeGraph | null;
  executivePredictionEngine?: ExecutivePredictionEngine | null;
  executiveInsightEngine?: ExecutiveInsightEngine | null;
  enterprisePatternEngine?: EnterprisePatternEngine | null;
  executiveBenchmarkEngine?: ExecutiveBenchmarkEngine | null;
}): BusinessRelationshipRecord[] {
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0]?.title ?? "Constitutional AI Platform";
  const topThreat = input.threatDetectionEngine?.criticalThreats[0]?.title ?? "Competitive Displacement";
  const graphEntities = input.executiveKnowledgeGraph?.entityCount ?? 24;
  const patternCount = input.enterprisePatternEngine?.activePatternCount ?? 12;
  const benchmarkCount = input.executiveBenchmarkEngine?.activeBenchmarkCount ?? 12;
  const insightCount = input.executiveInsightEngine?.activeInsightCount ?? 12;

  const catalogue: Array<Omit<BusinessRelationshipRecord, "lastUpdated">> = [
    {
      relationshipId: "xbi-platform-intelligence",
      sourceBusiness: "EmpireAI Platform",
      targetBusiness: "Enterprise Intelligence Division",
      relationshipType: "knowledge_relationship",
      domain: "cross_business_knowledge",
      businessContext: "Platform intelligence feeds enterprise intelligence pipeline",
      knowledgeShared: "E4-01 to E4-12 intelligence outputs · constitutional governance framework",
      businessImpact: "Unified executive intelligence across platform and division",
      financialImpact: "Reduced duplicate intelligence effort · $480K annual efficiency",
      strategicImpact: "critical · enterprise intelligence maturity",
      opportunityValue: "Intelligence compounding across businesses",
      riskLevel: "low",
      confidence: 91,
      evidence: [`E4-08 ${graphEntities} entities`, `${insightCount} insights`, `${patternCount} patterns`],
    },
    {
      relationshipId: "xbi-constitutional-services",
      sourceBusiness: "Constitutional AI Services",
      targetBusiness: "EmpireAI Platform",
      relationshipType: "strategic_relationship",
      domain: "cross_business_collaboration",
      businessContext: "Constitutional governance expertise strengthens platform differentiation",
      knowledgeShared: "Constitutional AI certification · governance frameworks · compliance intelligence",
      businessImpact: "Platform differentiation · enterprise buyer confidence",
      financialImpact: "$2.1M incremental ARR from constitutional positioning",
      strategicImpact: "critical · first-mover constitutional AI advantage",
      opportunityValue: topOpportunity,
      riskLevel: "low",
      confidence: 92,
      evidence: ["E4-03 constitutional opportunity", "E4-12 constitutional benchmark", "E1 vision alignment"],
    },
    {
      relationshipId: "xbi-innovation-platform",
      sourceBusiness: "Innovation Labs",
      targetBusiness: "EmpireAI Platform",
      relationshipType: "innovation_relationship",
      domain: "cross_business_innovation",
      businessContext: "Innovation pipeline feeds platform feature development",
      knowledgeShared: "E4-07 innovation intelligence · emerging technology readiness · disruptive innovation signals",
      businessImpact: "Accelerated innovation-to-market velocity",
      financialImpact: "$620K revenue per innovation cycle",
      strategicImpact: "high · innovation competitive moat",
      opportunityValue: "90-day innovation adoption curve",
      riskLevel: "low",
      confidence: 87,
      evidence: ["E4-07 innovation readiness", "E4-11 innovation pattern", "E4-09 technology prediction"],
    },
    {
      relationshipId: "xbi-financial-platform",
      sourceBusiness: "Financial Executive Programme",
      targetBusiness: "EmpireAI Platform",
      relationshipType: "financial_relationship",
      domain: "cross_business_benchmarking",
      businessContext: "Financial intelligence informs platform monetization and growth strategy",
      knowledgeShared: "E3 financial metrics · revenue benchmarks · monetization intelligence",
      businessImpact: "Revenue optimization · financial forecasting accuracy",
      financialImpact: "$1.2M ARR gap closure opportunity",
      strategicImpact: "high · revenue growth alignment",
      opportunityValue: "40% YoY ARR growth target",
      riskLevel: "medium",
      confidence: 88,
      evidence: ["E3-16 certified", "E4-12 revenue benchmark", "E4-10 revenue insight"],
    },
    {
      relationshipId: "xbi-market-expansion",
      sourceBusiness: "EmpireAI Platform",
      targetBusiness: "Global Market Operations",
      relationshipType: "growth_relationship",
      domain: "cross_business_opportunities",
      businessContext: "Market intelligence drives geographic expansion decisions",
      knowledgeShared: "E4-01 market intelligence · E4-05 industry trends · expansion readiness",
      businessImpact: "Geographic expansion · new enterprise verticals",
      financialImpact: "$3.2M addressable market expansion",
      strategicImpact: "high · market leadership",
      opportunityValue: "Semi-annual market expansion waves",
      riskLevel: "medium",
      confidence: 84,
      evidence: ["E4-01 global markets", "E4-11 expansion pattern", "E4-09 market prediction"],
    },
    {
      relationshipId: "xbi-customer-intelligence",
      sourceBusiness: "Customer Success Division",
      targetBusiness: "Enterprise Intelligence Division",
      relationshipType: "customer_relationship",
      domain: "business_intelligence_sharing",
      businessContext: "Customer behaviour intelligence strengthens enterprise retention strategy",
      knowledgeShared: "E4-06 behaviour signals · retention patterns · segment intelligence",
      businessImpact: "Cross-business customer intelligence · retention improvement",
      financialImpact: "$480K ARR protected through intervention",
      strategicImpact: "medium · customer synergy",
      opportunityValue: "Pre-churn intervention playbook",
      riskLevel: "medium",
      confidence: 82,
      evidence: ["E4-06 retention signals", "E4-11 churn pattern", "E4-10 customer insight"],
    },
    {
      relationshipId: "xbi-threat-propagation",
      sourceBusiness: "Enterprise Intelligence Division",
      targetBusiness: "Constitutional AI Services",
      relationshipType: "risk_relationship",
      domain: "cross_business_risks",
      businessContext: "Threat intelligence propagates across all empire businesses",
      knowledgeShared: "E4-04 threat detection · E4-02 competitive intelligence · risk convergence signals",
      businessImpact: "Enterprise-wide risk awareness · coordinated mitigation",
      financialImpact: "Portfolio risk protection",
      strategicImpact: "critical · risk governance",
      opportunityValue: "Compound risk early warning",
      riskLevel: "high",
      confidence: 86,
      evidence: [topThreat, "E4-11 risk convergence", "E4-10 risk insight"],
    },
    {
      relationshipId: "xbi-operational-synergy",
      sourceBusiness: "EmpireAI Platform",
      targetBusiness: "Operations Centre",
      relationshipType: "operational_relationship",
      domain: "cross_business_performance",
      businessContext: "Growth intelligence informs operational scaling across businesses",
      knowledgeShared: "E4-11 scaling pattern · E4-10 operational insight · capacity intelligence",
      businessImpact: "Proactive operational scaling · delivery capacity alignment",
      financialImpact: "Revenue realization protection",
      strategicImpact: "medium · execution readiness",
      opportunityValue: "Growth-operations alignment",
      riskLevel: "medium",
      confidence: 79,
      evidence: ["E4-11 operational pattern", "E4-12 operational benchmark", "E4-10 operational insight"],
    },
    {
      relationshipId: "xbi-prediction-insight",
      sourceBusiness: "Enterprise Intelligence Division",
      targetBusiness: "Executive Decision Office",
      relationshipType: "strategic_relationship",
      domain: "cross_business_learning",
      businessContext: "Predictions and insights flow to executive decision-making across businesses",
      knowledgeShared: `E4-09 ${input.executivePredictionEngine?.activePredictionCount ?? 12} predictions · E4-10 ${insightCount} insights`,
      businessImpact: "Prediction-informed cross-business decisions",
      financialImpact: "Reduced opportunity cost from intelligence silos",
      strategicImpact: "critical · decision maturity",
      opportunityValue: "48-hour decision cycle target",
      riskLevel: "low",
      confidence: 85,
      evidence: ["E4-09 predictions", "E4-10 insights", "E4-11 decision pattern"],
    },
    {
      relationshipId: "xbi-benchmark-sharing",
      sourceBusiness: "Financial Executive Programme",
      targetBusiness: "Enterprise Intelligence Division",
      relationshipType: "financial_relationship",
      domain: "cross_business_benchmarking",
      businessContext: "Benchmark intelligence shared across all empire businesses",
      knowledgeShared: `E4-12 ${benchmarkCount} benchmarks · performance gaps · improvement opportunities`,
      businessImpact: "Objective cross-business performance comparison",
      financialImpact: "Continuous improvement intelligence",
      strategicImpact: "high · world-class standards alignment",
      opportunityValue: "Leading position in constitutional AI differentiation",
      riskLevel: "low",
      confidence: 87,
      evidence: ["E4-12 benchmarks", "E4-12 competitive position", "E3 financial executive"],
    },
    {
      relationshipId: "xbi-technology-reuse",
      sourceBusiness: "Innovation Labs",
      targetBusiness: "Constitutional AI Services",
      relationshipType: "technology_relationship",
      domain: "cross_business_innovation",
      businessContext: "Technology innovations reused across constitutional and platform businesses",
      knowledgeShared: "Governance technology stack · AI compliance tooling · certification automation",
      businessImpact: "Technology reuse · reduced development duplication",
      financialImpact: "$320K development cost savings",
      strategicImpact: "high · technology synergy",
      opportunityValue: "Shared constitutional technology platform",
      riskLevel: "low",
      confidence: 86,
      evidence: ["E4-07 emerging technologies", "E4-08 technology knowledge", "E4-11 innovation pattern"],
    },
    {
      relationshipId: "xbi-future-enterprise",
      sourceBusiness: "Enterprise Intelligence Division",
      targetBusiness: "All Empire Businesses",
      relationshipType: "future_relationship",
      domain: "future_enterprise_intelligence",
      businessContext: "Intelligence compounding creates enterprise-wide sustainable advantage",
      knowledgeShared: "P9-02 knowledge evolution · E4-08 knowledge graph · cross-business correlation",
      businessImpact: "Every business contributes and benefits from enterprise intelligence",
      financialImpact: "Long-term ROI on intelligence investment",
      strategicImpact: "critical · sustainable competitive advantage",
      opportunityValue: "Intelligence compounding across empire",
      riskLevel: "low",
      confidence: 89,
      evidence: ["P9-02 knowledge evolution", "E4-08 knowledge graph", "E4-11 intelligence pattern"],
    },
  ];

  return catalogue.map((r) => ({
    ...r,
    domain: r.domain ?? mapDomain(r.relationshipType),
    lastUpdated: nowIso(),
  }));
}

function buildEnterpriseSynergies(relationships: BusinessRelationshipRecord[]): EnterpriseSynergyEntry[] {
  return relationships
    .filter((r) => r.strategicImpact.includes("critical") || r.strategicImpact.includes("high"))
    .map((r, idx) => ({
      synergyId: `sy-${idx + 1}`,
      relationshipId: r.relationshipId,
      sourceBusiness: r.sourceBusiness,
      targetBusiness: r.targetBusiness,
      synergyType: r.relationshipType.replace(/_relationship$/, "_synergy"),
      businessImpact: r.businessImpact,
      financialImpact: r.financialImpact,
      confidence: r.confidence,
      status: r.confidence >= 85 ? "active" : "developing",
    }));
}

function buildKnowledgeSharing(relationships: BusinessRelationshipRecord[]): KnowledgeSharingEntry[] {
  return relationships.map((r, idx) => ({
    sharingId: `ks-${idx + 1}`,
    relationshipId: r.relationshipId,
    sourceBusiness: r.sourceBusiness,
    targetBusiness: r.targetBusiness,
    knowledgeShared: r.knowledgeShared,
    reusePotential: r.confidence >= 85 ? "high" : r.confidence >= 75 ? "medium" : "developing",
    confidence: r.confidence,
    status: r.riskLevel === "low" ? "flowing" : "monitored",
  }));
}

function buildCrossBusinessOpportunities(relationships: BusinessRelationshipRecord[]): CrossBusinessOpportunityEntry[] {
  return relationships
    .filter((r) => r.relationshipType === "growth_relationship" || r.relationshipType === "innovation_relationship" || r.relationshipType === "strategic_relationship")
    .map((r, idx) => ({
      opportunityId: `co-${idx + 1}`,
      relationshipId: r.relationshipId,
      title: `${r.sourceBusiness} → ${r.targetBusiness} Opportunity`,
      sourceBusiness: r.sourceBusiness,
      targetBusiness: r.targetBusiness,
      opportunityValue: r.opportunityValue,
      confidence: r.confidence,
      status: r.confidence >= 85 ? "capture_ready" : "evaluating",
    }));
}

function buildCrossBusinessRisks(relationships: BusinessRelationshipRecord[]): CrossBusinessRiskEntry[] {
  return relationships
    .filter((r) => r.relationshipType === "risk_relationship" || r.riskLevel === "high" || r.riskLevel === "medium")
    .map((r, idx) => ({
      riskId: `cr-${idx + 1}`,
      relationshipId: r.relationshipId,
      title: `${r.sourceBusiness} → ${r.targetBusiness} Risk`,
      sourceBusiness: r.sourceBusiness,
      targetBusiness: r.targetBusiness,
      riskLevel: r.riskLevel,
      businessImpact: r.businessImpact,
      confidence: r.confidence,
      status: r.riskLevel === "high" ? "escalated" : "monitoring",
    }));
}

function buildEnterprisePatterns(relationships: BusinessRelationshipRecord[]): EnterprisePatternEntry[] {
  return relationships
    .filter((r) => r.relationshipType === "knowledge_relationship" || r.relationshipType === "future_relationship" || r.relationshipType === "innovation_relationship")
    .map((r, idx) => ({
      patternId: `ep-${idx + 1}`,
      relationshipId: r.relationshipId,
      title: `Cross-Business Pattern: ${r.sourceBusiness} ↔ ${r.targetBusiness}`,
      patternDescription: r.businessContext,
      businessesInvolved: `${r.sourceBusiness} · ${r.targetBusiness}`,
      confidence: r.confidence,
      status: r.confidence >= 85 ? "validated" : "tracking",
    }));
}

function buildExecutiveIntelligence(input: {
  relationships: BusinessRelationshipRecord[];
  insightCount: number;
  patternCount: number;
  benchmarkCount: number;
}): ExecutiveIntelligenceSummaryEntry[] {
  return [
    {
      summaryId: "ei-1",
      domain: "relationships",
      label: "Active Relationships",
      value: String(input.relationships.length),
      status: "active",
      summary: `${input.relationships.length} cross-business intelligence relationships active`,
    },
    {
      summaryId: "ei-2",
      domain: "insights",
      label: "Executive Insights",
      value: String(input.insightCount),
      status: "flowing",
      summary: "E4-10 insights correlated across businesses",
    },
    {
      summaryId: "ei-3",
      domain: "patterns",
      label: "Enterprise Patterns",
      value: String(input.patternCount),
      status: "active",
      summary: "E4-11 patterns informing cross-business correlation",
    },
    {
      summaryId: "ei-4",
      domain: "benchmarks",
      label: "Performance Benchmarks",
      value: String(input.benchmarkCount),
      status: "active",
      summary: "E4-12 benchmarks shared across empire businesses",
    },
    {
      summaryId: "ei-5",
      domain: "synergy",
      label: "Enterprise Synergies",
      value: String(input.relationships.filter((r) => r.strategicImpact.includes("critical")).length),
      status: "strong",
      summary: "Critical synergies identified across empire portfolio",
    },
  ];
}

function buildCrossBusinessAnalysis(relationships: BusinessRelationshipRecord[]): CrossBusinessAnalysisMetric[] {
  const avgConfidence = Math.round(
    relationships.reduce((s, r) => s + r.confidence, 0) / Math.max(relationships.length, 1),
  );
  const knowledgeCount = relationships.filter((r) => r.relationshipType === "knowledge_relationship").length;
  const innovationCount = relationships.filter((r) => r.relationshipType === "innovation_relationship" || r.relationshipType === "technology_relationship").length;
  const riskCount = relationships.filter((r) => r.relationshipType === "risk_relationship").length;

  return CROSS_BUSINESS_ANALYSIS_DOMAINS.map((domain) => {
    const scores: Record<string, number> = {
      knowledge_reuse: Math.min(100, 70 + knowledgeCount * 8),
      operational_synergy: Math.min(100, 72 + relationships.filter((r) => r.relationshipType === "operational_relationship").length * 10),
      technology_reuse: Math.min(100, 75 + innovationCount * 8),
      customer_synergy: Math.min(100, 70 + relationships.filter((r) => r.relationshipType === "customer_relationship").length * 10),
      growth_opportunities: Math.min(100, 68 + relationships.filter((r) => r.relationshipType === "growth_relationship").length * 12),
      financial_synergy: Math.min(100, 72 + relationships.filter((r) => r.relationshipType === "financial_relationship").length * 8),
      innovation_transfer: Math.min(100, 74 + innovationCount * 6),
      risk_propagation: Math.min(100, 65 + riskCount * 12),
      enterprise_value: Math.min(100, avgConfidence),
      long_term_sustainability: Math.min(100, 75 + relationships.filter((r) => r.relationshipType === "future_relationship").length * 10),
    };
    const score = Math.round(scores[domain] ?? 75);
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 85 ? "strong" : score >= 70 ? "active" : "developing",
      summary: `${label(domain)} — ${score}/100 · ${relationships.length} relationships correlated`,
    };
  });
}

function buildPillowEvaluations(input: {
  relationshipCount: number;
  opportunityCount: number;
  synergyCount: number;
  avgConfidence: number;
}): PillowCrossBusinessEvaluationMetric[] {
  return PILLOW_CROSS_BUSINESS_EVALUATIONS.map((domain) => {
    const summaries: Record<string, string> = {
      cross_business_opportunities: `${input.opportunityCount} cross-business opportunities identified`,
      enterprise_synergies: `${input.synergyCount} enterprise synergies active`,
      knowledge_reuse: `${input.relationshipCount} knowledge sharing relationships flowing`,
      strategic_recommendations: `Recommendations at ${input.avgConfidence}% average confidence`,
      executive_intelligence: "Executive intelligence correlated across all empire businesses",
    };
    return {
      domain,
      label: label(domain),
      status: input.avgConfidence >= 85 ? "strong" : "active",
      summary: summaries[domain] ?? label(domain),
    };
  });
}

function buildRecommendations(relationships: BusinessRelationshipRecord[]): CrossBusinessRecommendation[] {
  const constitutional = relationships.find((r) => r.relationshipId === "xbi-constitutional-services");
  const platform = relationships.find((r) => r.relationshipId === "xbi-platform-intelligence");
  const threat = relationships.find((r) => r.relationshipId === "xbi-threat-propagation");
  return [
    {
      id: "xbi-rec-constitutional",
      title: "Amplify Constitutional AI Cross-Business Synergy",
      category: "strategic",
      why: constitutional?.businessContext ?? "Constitutional services strengthen platform differentiation",
      what: "Deepen constitutional AI knowledge sharing between Services and Platform",
      how: "E4-03 opportunities · E4-12 constitutional benchmark · E1 vision alignment",
      confidencePercent: 92,
    },
    {
      id: "xbi-rec-intelligence",
      title: "Unify Enterprise Intelligence Pipeline",
      category: "knowledge",
      why: platform?.businessContext ?? "Platform intelligence feeds enterprise intelligence",
      what: "Establish permanent cross-business intelligence correlation pipeline",
      how: "E4-08 knowledge graph · E4-09 to E4-12 integration · P9-02 knowledge evolution",
      confidencePercent: 91,
    },
    {
      id: "xbi-rec-innovation",
      title: "Accelerate Innovation Transfer Across Businesses",
      category: "innovation",
      why: "Innovation Labs technology reusable across constitutional and platform businesses",
      what: "Create shared innovation transfer programme between Labs and all businesses",
      how: "E4-07 innovation intelligence · E4-11 innovation pattern · technology reuse",
      confidencePercent: 87,
    },
    {
      id: "xbi-rec-risk",
      title: "Deploy Enterprise-Wide Risk Propagation Monitoring",
      category: "risk",
      why: threat?.businessContext ?? "Threat intelligence must propagate across all businesses",
      what: "Monitor compound risk signals across entire empire portfolio",
      how: "E4-04 threat detection · E4-10 risk insights · E4-11 risk convergence",
      confidencePercent: 86,
    },
    {
      id: "xbi-rec-future",
      title: "Invest in Enterprise Intelligence Compounding",
      category: "future",
      why: "Intelligence compounding creates sustainable cross-business advantage",
      what: "Every business contributes and benefits from shared enterprise intelligence",
      how: "P9-02 knowledge evolution · E4-08 graph expansion · cross-business pipeline",
      confidencePercent: 89,
    },
  ];
}

export function assembleCrossBusinessIntelligence(input: {
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
} = {}): CrossBusinessIntelligence {
  const businessRelationships = buildBusinessRelationships(input);
  const enterpriseSynergies = buildEnterpriseSynergies(businessRelationships);
  const knowledgeSharing = buildKnowledgeSharing(businessRelationships);
  const crossBusinessOpportunities = buildCrossBusinessOpportunities(businessRelationships);
  const crossBusinessRisks = buildCrossBusinessRisks(businessRelationships);
  const enterprisePatterns = buildEnterprisePatterns(businessRelationships);
  const crossBusinessAnalysis = buildCrossBusinessAnalysis(businessRelationships);

  const avgConfidence = Math.round(
    businessRelationships.reduce((s, r) => s + r.confidence, 0) / Math.max(businessRelationships.length, 1),
  );

  const executiveIntelligence = buildExecutiveIntelligence({
    relationships: businessRelationships,
    insightCount: input.executiveInsightEngine?.activeInsightCount ?? 12,
    patternCount: input.enterprisePatternEngine?.activePatternCount ?? 12,
    benchmarkCount: input.executiveBenchmarkEngine?.activeBenchmarkCount ?? 12,
  });

  const healthInputs = [
    input.executiveBenchmarkEngine?.healthScore ?? 85,
    input.enterprisePatternEngine?.healthScore ?? 85,
    avgConfidence,
    enterpriseSynergies.length >= 6 ? 88 : 74,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    relationshipCount: businessRelationships.length,
    opportunityCount: crossBusinessOpportunities.length,
    synergyCount: enterpriseSynergies.length,
    avgConfidence,
  });
  const strategicRecommendations = buildRecommendations(businessRelationships);

  const pillowAdvisory = [
    "Cross-Business Intelligence — constitutional enterprise-wide intelligence correlation active",
    `${businessRelationships.length} relationships active · ${enterpriseSynergies.length} synergies · ${knowledgeSharing.length} knowledge flows`,
    "Every business contributes intelligence · every business benefits from shared intelligence",
    "E4-01 to E4-12 intelligence integrated · E3 E2 E1 programmes connected",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting cross-business intelligence integrity")}`,
    "ECC coordinates cross-business planning · Supervisor monitors relationship integrity",
    "VIE validates cross-business alignment · vision · strategic · constitutional",
    "Grand King understands how knowledge gained in one business strengthens the entire Empire",
  ];

  return {
    engineVersion: "E4-13",
    computedAt: nowIso(),
    engineSummary:
      "Cross-Business Intelligence continuously correlates knowledge, performance, opportunities, risks, innovations and executive intelligence across every business operating within the Empire. Every business contributes intelligence. Every business benefits from intelligence generated by every other business. The Grand King always understands how knowledge gained in one business strengthens the entire Empire.",
    engineHealth: healthLabel(clampedHealth),
    crossBusinessIntelligenceHealth: avgConfidence >= 85 ? "strong" : avgConfidence >= 75 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeRelationshipCount: businessRelationships.length,
    synergyCount: enterpriseSynergies.length,
    knowledgeSharingCount: knowledgeSharing.length,
    crossBusinessOpportunityCount: crossBusinessOpportunities.length,
    averageRelationshipConfidence: avgConfidence,
    businessRelationships,
    enterpriseSynergies,
    knowledgeSharing,
    crossBusinessOpportunities,
    crossBusinessRisks,
    enterprisePatterns,
    strategicRecommendations,
    executiveIntelligence,
    crossBusinessAnalysis,
    crossBusinessPipeline: buildPipeline("continuous_learning"),
    pillowEvaluations,
    crossBusinessPrinciples: [...CROSS_BUSINESS_PRINCIPLES],
    governedDomains: [...GOVERNED_CROSS_BUSINESS_DOMAINS],
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "cross-business intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-13 Cross-Business Intelligence"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring cross-business intelligence health"),
      eccStatus: String(input.ecc?.status ?? "cross-business planning coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE414: true,
  };
}

export function buildFallbackCrossBusinessIntelligence(): CrossBusinessIntelligence {
  return assembleCrossBusinessIntelligence({});
}
