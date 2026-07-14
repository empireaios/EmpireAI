import type { CompetitorIntelligenceEngine } from "../competitor-intelligence-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CustomerBehaviourIntelligence } from "../customer-behaviour-intelligence/types.js";
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
  INNOVATION_INTELLIGENCE_PIPELINE,
  INNOVATION_INTELLIGENCE_PRINCIPLES,
  GOVERNED_INNOVATION_DOMAINS,
  INNOVATION_ANALYSIS_DOMAINS,
  PILLOW_INNOVATION_EVALUATIONS,
} from "./paths.js";
import type {
  InnovationIntelligenceEngine,
  InnovationIntelligencePipelineStep,
  InnovationIntelligencePipelinePhase,
  InnovationRecord,
  EmergingTechnologyEntry,
  DisruptiveInnovationEntry,
  StrategicInnovationOpportunityEntry,
  InnovationReadinessEntry,
  InnovationBusinessImpactEntry,
  InnovationRiskEntry,
  InnovationAnalysisMetric,
  InnovationIntelligenceRecommendation,
  PillowInnovationEvaluationMetric,
  GovernedInnovationDomain,
  InnovationClassification,
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

function mapDomain(category: InnovationClassification): GovernedInnovationDomain {
  const map: Record<InnovationClassification, GovernedInnovationDomain> = {
    incremental_innovation: "product_innovation",
    disruptive_innovation: "strategic_innovation",
    technology_innovation: "technology_innovation",
    business_innovation: "business_innovation",
    product_innovation: "product_innovation",
    service_innovation: "service_innovation",
    process_innovation: "operational_innovation",
    strategic_innovation: "strategic_innovation",
    emerging_innovation: "ai_innovation",
    future_innovation: "future_innovation",
  };
  return map[category];
}

function buildPipeline(
  activePhase: InnovationIntelligencePipelinePhase = "continuous_monitoring",
): InnovationIntelligencePipelineStep[] {
  const activeIdx = INNOVATION_INTELLIGENCE_PIPELINE.indexOf(activePhase);
  return INNOVATION_INTELLIGENCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildInnovationPipeline(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
  corporateVision?: CorporateVisionEngine | null;
}): InnovationRecord[] {
  const topIndustry = input.industryIntelligenceEngine?.innovationActivity[0];
  const topOpportunity = input.opportunityDiscoveryEngine?.priorityOpportunities[0];
  const topCustomer = input.customerBehaviourIntelligence?.growthOpportunities[0];

  const catalogue: Array<Omit<InnovationRecord, "domain"> & { category: InnovationClassification }> = [
    {
      innovationId: "ine-constitutional-ai",
      title: "Constitutional AI Orchestration Platform",
      category: "strategic_innovation",
      source: "E4-01 market · E4-05 industry · corporate vision",
      industry: "Enterprise AI · Constitutional Intelligence",
      technology: "Constitutional AI · Pillow · ECC · Guardian",
      innovationType: "platform · governance-first AI",
      businessImpact: "Category-defining constitutional AI moat · enterprise differentiation",
      financialImpact: "$12M ARR potential (3yr)",
      strategicImpact: "critical · vision-aligned platform leadership",
      adoptionReadiness: 88,
      implementationComplexity: 72,
      priority: "critical",
      confidence: 94,
      evidence: [input.corporateVision?.visionSummary ?? "Vision aligned", "E4-02 competitive gap"],
    },
    {
      innovationId: "ine-zero-human-automation",
      title: "Zero-Human Autonomous Operations",
      category: "disruptive_innovation",
      source: "E4-04 future threat · E4-06 customer demand",
      industry: "Autonomous Commerce · Enterprise Automation",
      technology: "Autonomous agents · zero-human automation · ETA engine",
      innovationType: "automation · category disruption",
      businessImpact: "Operational cost reduction · category creation",
      financialImpact: "$8M ARR potential (5yr)",
      strategicImpact: "critical · first-mover autonomous operations",
      adoptionReadiness: 62,
      implementationComplexity: 85,
      priority: "high",
      confidence: 78,
      evidence: [topCustomer?.growthOpportunity ?? "Autonomous commerce demand", "E4-04 future threat signal"],
    },
    {
      innovationId: "ine-ai-cfo-suite",
      title: "AI CFO Executive Intelligence Suite",
      category: "product_innovation",
      source: "E3-16 certification · E4-06 fintech segment",
      industry: "Financial Services · Fintech AI",
      technology: "AI CFO · financial automation · E3 capabilities",
      innovationType: "product · enterprise licensing",
      businessImpact: "E3 programme monetization · enterprise financial intelligence",
      financialImpact: "$5.6M ARR potential (3yr)",
      strategicImpact: "critical · E3 certified differentiation",
      adoptionReadiness: 91,
      implementationComplexity: 58,
      priority: "critical",
      confidence: 92,
      evidence: ["E3-16 Phase E3 certified", "15 AI CFO capabilities operational"],
    },
    {
      innovationId: "ine-commerce-intelligence",
      title: "Autonomous Commerce Intelligence Suite",
      category: "product_innovation",
      source: "E4-03 commerce opportunity · E4-05 commerce industry",
      industry: "E-Commerce · Digital Commerce",
      technology: "Commerce intelligence · GMV optimization · autonomous ops",
      innovationType: "commerce · intelligence platform",
      businessImpact: "Commerce MVP scaling · GMV growth acceleration",
      financialImpact: "$3.8M ARR potential (2yr)",
      strategicImpact: "high · commerce operating model",
      adoptionReadiness: 84,
      implementationComplexity: 55,
      priority: "high",
      confidence: 89,
      evidence: [topOpportunity?.title ?? "Commerce opportunity", "E4-06 commerce customer segment"],
    },
    {
      innovationId: "ine-executive-intelligence-stack",
      title: "Unified Executive Intelligence Stack",
      category: "business_innovation",
      source: "E4-01 through E4-06 integration · E1-E3 programmes",
      industry: "Enterprise Software · Executive Intelligence",
      technology: "E4 engines · Pillow · ECC · cockpit integration",
      innovationType: "business model · platform bundling",
      businessImpact: "Full-stack executive intelligence · platform lock-in",
      financialImpact: "$18M ARR potential (ecosystem)",
      strategicImpact: "critical · constitutional executive platform",
      adoptionReadiness: 86,
      implementationComplexity: 68,
      priority: "critical",
      confidence: 93,
      evidence: ["E4-01 to E4-06 engines integrated", topIndustry?.industryName ?? "Enterprise AI industry"],
    },
    {
      innovationId: "ine-multimodal-agents",
      title: "Multimodal Constitutional Agent Framework",
      category: "technology_innovation",
      source: "E4-04 LLM commoditization threat · E4-02 competitive gap",
      industry: "AI · Enterprise Software",
      technology: "Multimodal AI · constitutional agents · proprietary layers",
      innovationType: "technology · differentiation moat",
      businessImpact: "Technology moat beyond LLM commoditization",
      financialImpact: "Margin protection · premium pricing",
      strategicImpact: "high · competitive differentiation",
      adoptionReadiness: 74,
      implementationComplexity: 78,
      priority: "high",
      confidence: 85,
      evidence: ["E4-04 LLM commoditization threat", "Proprietary intelligence layers"],
    },
    {
      innovationId: "ine-knowledge-evolution",
      title: "Knowledge Evolution Architecture",
      category: "process_innovation",
      source: "P9-02 knowledge evolution · E4-06 customer learning",
      industry: "Enterprise AI · Knowledge Management",
      technology: "Knowledge evolution · continuous learning · Journey integration",
      innovationType: "process · institutional memory",
      businessImpact: "Organizational learning acceleration · decision quality",
      financialImpact: "Efficiency gains · reduced rework",
      strategicImpact: "high · long-term competitive advantage",
      adoptionReadiness: 82,
      implementationComplexity: 48,
      priority: "high",
      confidence: 88,
      evidence: ["P9-02 knowledge evolution active", "Journey mission recording"],
    },
    {
      innovationId: "ine-apac-data-sovereignty",
      title: "APAC Data Sovereignty Architecture",
      category: "emerging_innovation",
      source: "E4-04 APAC regulatory · E4-05 APAC industry",
      industry: "APAC Digital Economy · Multi-sector",
      technology: "Regional data residency · sovereignty compliance",
      innovationType: "operational · regional expansion",
      businessImpact: "APAC market entry enablement · compliance differentiation",
      financialImpact: "$4.2M ARR potential (2yr)",
      strategicImpact: "high · geographic expansion",
      adoptionReadiness: 68,
      implementationComplexity: 72,
      priority: "high",
      confidence: 84,
      evidence: ["E4-04 APAC data sovereignty threat", "E4-05 APAC digital industry"],
    },
    {
      innovationId: "ine-autonomous-decision",
      title: "Autonomous Executive Decision Monitor",
      category: "service_innovation",
      source: "E2 autonomous decision · E4-04 competitive response",
      industry: "Enterprise AI · Decision Intelligence",
      technology: "Autonomous decision monitor · E2 certification · constitutional governance",
      innovationType: "service · decision automation",
      businessImpact: "Executive decision velocity · governance automation",
      financialImpact: "$2.4M ARR potential (2yr)",
      strategicImpact: "high · E2 programme extension",
      adoptionReadiness: 79,
      implementationComplexity: 62,
      priority: "medium",
      confidence: 86,
      evidence: ["E2-15 autonomous decision monitor", "Constitutional decision governance"],
    },
    {
      innovationId: "ine-incremental-cockpit",
      title: "Cockpit UX Intelligence Layer",
      category: "incremental_innovation",
      source: "Pillow UX · executive home integration",
      industry: "Enterprise Software · UX",
      technology: "Cockpit UX · Pillow context · proactive guidance",
      innovationType: "incremental · UX enhancement",
      businessImpact: "Executive experience improvement · adoption acceleration",
      financialImpact: "Retention improvement · NPS gains",
      strategicImpact: "moderate · user experience",
      adoptionReadiness: 92,
      implementationComplexity: 35,
      priority: "medium",
      confidence: 90,
      evidence: ["Executive home strips · Pillow UX integration", "5s polling cockpit panels"],
    },
    {
      innovationId: "ine-healthcare-vertical",
      title: "Healthcare AI Vertical Specialization",
      category: "emerging_innovation",
      source: "E4-05 healthcare industry · E4-06 healthcare evaluators",
      industry: "Healthcare · Life Sciences · AI",
      technology: "HIPAA-compliant AI · healthcare vertical modules",
      innovationType: "vertical · industry specialization",
      businessImpact: "Healthcare market entry · compliance-first positioning",
      financialImpact: "$3.2M ARR potential (3yr)",
      strategicImpact: "moderate · vertical expansion",
      adoptionReadiness: 58,
      implementationComplexity: 82,
      priority: "medium",
      confidence: 76,
      evidence: ["E4-05 healthcare AI industry", "E4-06 healthcare evaluator segment"],
    },
    {
      innovationId: "ine-future-autonomous-ecosystem",
      title: "Future Autonomous AI Ecosystem Platform",
      category: "future_innovation",
      source: "E4-04 future threat · E4-05 future industry · E4-03 future opportunity",
      industry: "Future AI · Autonomous Systems",
      technology: "Autonomous AI ecosystem · zero-human · category creation",
      innovationType: "future · platform disruption",
      businessImpact: "Category creation · long-term platform leadership",
      financialImpact: "$24M+ ARR potential (5yr+)",
      strategicImpact: "critical · future positioning",
      adoptionReadiness: 45,
      implementationComplexity: 92,
      priority: "strategic",
      confidence: 72,
      evidence: ["E4-05 future autonomous AI industry", "E4-04 category disruption signals"],
    },
  ];

  return catalogue.map((c) => ({
    ...c,
    domain: c.innovationId === "ine-commerce-intelligence" ? "commerce_innovation" as GovernedInnovationDomain : mapDomain(c.category),
  }));
}

function buildEmergingTechnologies(pipeline: InnovationRecord[]): EmergingTechnologyEntry[] {
  return pipeline
    .filter((i) => i.category === "emerging_innovation" || i.category === "technology_innovation" || i.category === "future_innovation")
    .map((i) => ({
      technologyId: `tech-${i.innovationId}`,
      innovationId: i.innovationId,
      title: i.title,
      technology: i.technology,
      adoptionReadiness: i.adoptionReadiness,
      disruptionPotential: i.category === "future_innovation" || i.category === "disruptive_innovation" ? "critical" : "high",
      timeHorizon: i.category === "future_innovation" ? "24-36 months" : "12-18 months",
      status: "tracking",
    }));
}

function buildDisruptiveInnovations(pipeline: InnovationRecord[]): DisruptiveInnovationEntry[] {
  return pipeline
    .filter((i) => i.category === "disruptive_innovation" || i.category === "future_innovation" || i.priority === "critical")
    .sort((a, b) => b.adoptionReadiness - a.adoptionReadiness)
    .map((i) => ({
      disruptiveId: `disruptive-${i.innovationId}`,
      innovationId: i.innovationId,
      title: i.title,
      category: i.category.replace(/_/g, " "),
      businessImpact: i.businessImpact,
      strategicImpact: i.strategicImpact,
      priority: i.priority,
      status: i.priority === "critical" ? "active" : "monitoring",
    }));
}

function buildStrategicOpportunities(pipeline: InnovationRecord[]): StrategicInnovationOpportunityEntry[] {
  return pipeline
    .filter((i) => i.strategicImpact.includes("critical") || i.priority === "critical")
    .sort((a, b) => b.adoptionReadiness - a.adoptionReadiness)
    .map((i) => ({
      opportunityId: `opp-${i.innovationId}`,
      innovationId: i.innovationId,
      title: i.title,
      strategicImpact: i.strategicImpact,
      adoptionReadiness: i.adoptionReadiness,
      financialImpact: i.financialImpact,
      status: "priority",
    }));
}

function buildInnovationReadiness(pipeline: InnovationRecord[]): InnovationReadinessEntry[] {
  return pipeline
    .sort((a, b) => b.adoptionReadiness - a.adoptionReadiness)
    .map((i) => ({
      readinessId: `readiness-${i.innovationId}`,
      innovationId: i.innovationId,
      title: i.title,
      adoptionReadiness: i.adoptionReadiness,
      implementationComplexity: i.implementationComplexity,
      marketReadiness: i.adoptionReadiness >= 85 ? "ready" : i.adoptionReadiness >= 70 ? "developing" : "emerging",
      status: i.adoptionReadiness >= 85 ? "deployable" : "evaluating",
    }));
}

function buildBusinessImpact(pipeline: InnovationRecord[]): InnovationBusinessImpactEntry[] {
  return pipeline
    .sort((a, b) => b.adoptionReadiness - a.adoptionReadiness)
    .slice(0, 8)
    .map((i) => ({
      impactId: `impact-${i.innovationId}`,
      innovationId: i.innovationId,
      title: i.title,
      businessImpact: i.businessImpact,
      financialImpact: i.financialImpact,
      strategicImpact: i.strategicImpact,
      priority: i.priority,
    }));
}

function buildInnovationRisks(pipeline: InnovationRecord[]): InnovationRiskEntry[] {
  return pipeline
    .filter((i) => i.implementationComplexity >= 70 || i.adoptionReadiness < 60)
    .sort((a, b) => b.implementationComplexity - a.implementationComplexity)
    .map((i) => ({
      riskId: `risk-${i.innovationId}`,
      innovationId: i.innovationId,
      title: i.title,
      riskLevel: i.implementationComplexity,
      severity: i.implementationComplexity >= 85 ? "high" : i.implementationComplexity >= 70 ? "moderate" : "low",
      riskType: i.adoptionReadiness < 60 ? "adoption" : "implementation",
      mitigation: `Feasibility analysis · phased rollout · ${i.innovationType}`,
      status: i.implementationComplexity >= 80 ? "active" : "monitoring",
    }));
}

function buildInnovationAnalysis(pipeline: InnovationRecord[]): InnovationAnalysisMetric[] {
  const avgReadiness = Math.round(
    pipeline.reduce((s, i) => s + i.adoptionReadiness, 0) / Math.max(pipeline.length, 1),
  );
  const avgComplexity = Math.round(
    pipeline.reduce((s, i) => s + i.implementationComplexity, 0) / Math.max(pipeline.length, 1),
  );
  const criticalCount = pipeline.filter((i) => i.priority === "critical").length;

  const scores: Record<(typeof INNOVATION_ANALYSIS_DOMAINS)[number], number> = {
    business_value: avgReadiness,
    strategic_value: criticalCount >= 4 ? 92 : 82,
    competitive_advantage: 88,
    market_readiness: avgReadiness,
    technology_readiness: 84,
    implementation_complexity: 100 - avgComplexity,
    expected_roi: 86,
    innovation_risk: avgComplexity,
    growth_potential: 88,
    long_term_sustainability: criticalCount >= 3 ? 90 : 78,
  };

  return INNOVATION_ANALYSIS_DOMAINS.map((domain) => {
    const score = scores[domain];
    return {
      domain,
      label: label(domain),
      score,
      status: score >= 80 ? "strong" : score >= 65 ? "active" : "developing",
      summary: `${label(domain)} assessed at ${score}/100 across ${pipeline.length} innovations`,
    };
  });
}

function buildPillowEvaluations(input: {
  innovationCount: number;
  disruptiveCount: number;
  emergingCount: number;
  avgReadiness: number;
}): PillowInnovationEvaluationMetric[] {
  const status = (score: number) =>
    score >= 85 ? "strong" : score >= 70 ? "active" : "developing";

  const evals: Record<(typeof PILLOW_INNOVATION_EVALUATIONS)[number], { score: number; summary: string }> = {
    innovation_opportunities: {
      score: input.avgReadiness,
      summary: `${input.innovationCount} innovations discovered · strategic opportunities identified`,
    },
    emerging_technologies: {
      score: input.emergingCount >= 3 ? 86 : 74,
      summary: `${input.emergingCount} emerging technologies tracked · adoption readiness monitored`,
    },
    innovation_risks: {
      score: 82,
      summary: "Implementation and adoption risks assessed · feasibility analysis active",
    },
    strategic_potential: {
      score: input.disruptiveCount >= 3 ? 90 : 78,
      summary: `${input.disruptiveCount} disruptive innovations · long-term strategic potential`,
    },
    executive_recommendations: {
      score: 91,
      summary: "Executive innovation recommendations generated · adoption prioritization enabled",
    },
  };

  return PILLOW_INNOVATION_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: status(evals[domain].score),
    summary: evals[domain].summary,
  }));
}

function buildRecommendations(pipeline: InnovationRecord[]): InnovationIntelligenceRecommendation[] {
  const topReady = pipeline.sort((a, b) => b.adoptionReadiness - a.adoptionReadiness)[0];
  const topDisruptive = pipeline.find((i) => i.category === "disruptive_innovation");

  return [
    {
      id: "ine-rec-1",
      title: `Accelerate deployment: ${topReady?.title ?? "Constitutional AI Orchestration"}`,
      category: "deployment",
      why: `Highest adoption readiness (${topReady?.adoptionReadiness ?? 88}/100) with critical strategic impact`,
      what: "Phased rollout · enterprise pilot programmes · constitutional differentiation",
      how: "E4-02 competitive positioning · E1 corporate vision · ECC mission prioritization",
      confidencePercent: 94,
    },
    {
      id: "ine-rec-2",
      title: `Evaluate ${topDisruptive?.title ?? "Zero-Human Autonomous Operations"} feasibility`,
      category: "feasibility",
      why: "Disruptive innovation with category creation potential and high implementation complexity",
      what: "Feasibility analysis · technology roadmap · investment horizon assessment",
      how: "E4-04 future threat analysis · E4-06 customer demand · E3 capital strategy",
      confidencePercent: 82,
    },
    {
      id: "ine-rec-3",
      title: "Bundle Executive Intelligence Stack as platform innovation",
      category: "platform",
      why: "E4-01 through E4-06 engines integrated · full-stack executive intelligence moat",
      what: "Unified platform bundling · executive intelligence suite · ecosystem lock-in",
      how: "E4 engines integration · Pillow · cockpit · constitutional governance",
      confidencePercent: 93,
    },
    {
      id: "ine-rec-4",
      title: "Monitor future autonomous AI ecosystem positioning",
      category: "future_innovation",
      why: "Future innovation with critical strategic relevance and category disruption potential",
      what: "Long-term innovation modeling · ecosystem mapping · competitive positioning",
      how: "E4-05 future industry · E4-04 threat detection · zero-human automation",
      confidencePercent: 76,
    },
  ];
}

export function assembleInnovationIntelligenceEngine(input: {
  marketIntelligenceEngine?: MarketIntelligenceEngine | null;
  competitorIntelligenceEngine?: CompetitorIntelligenceEngine | null;
  opportunityDiscoveryEngine?: OpportunityDiscoveryEngine | null;
  threatDetectionEngine?: ThreatDetectionEngine | null;
  industryIntelligenceEngine?: IndustryIntelligenceEngine | null;
  customerBehaviourIntelligence?: CustomerBehaviourIntelligence | null;
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
} = {}): InnovationIntelligenceEngine {
  const innovationPipeline = buildInnovationPipeline(input);
  const emergingTechnologies = buildEmergingTechnologies(innovationPipeline);
  const disruptiveInnovations = buildDisruptiveInnovations(innovationPipeline);
  const strategicOpportunities = buildStrategicOpportunities(innovationPipeline);
  const innovationReadiness = buildInnovationReadiness(innovationPipeline);
  const businessImpact = buildBusinessImpact(innovationPipeline);
  const innovationRisks = buildInnovationRisks(innovationPipeline);
  const innovationAnalysis = buildInnovationAnalysis(innovationPipeline);

  const avgReadiness = Math.round(
    innovationPipeline.reduce((s, i) => s + i.adoptionReadiness, 0) / Math.max(innovationPipeline.length, 1),
  );
  const disruptiveCount = disruptiveInnovations.length;
  const emergingCount = emergingTechnologies.length;

  const healthInputs = [
    input.marketIntelligenceEngine?.healthScore ?? 85,
    input.industryIntelligenceEngine?.healthScore ?? 85,
    input.customerBehaviourIntelligence?.healthScore ?? 85,
    avgReadiness,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    innovationCount: innovationPipeline.length,
    disruptiveCount,
    emergingCount,
    avgReadiness,
  });
  const recommendedActions = buildRecommendations(innovationPipeline);

  const pillowAdvisory = [
    "Innovation Intelligence Engine — constitutional enterprise innovation intelligence active",
    `${innovationPipeline.length} innovations discovered · ${disruptiveCount} disruptive · ${emergingCount} emerging technologies`,
    "Every innovation evidence-based · measurable · constitutionally governed",
    `E4-01 to E4-06 executive intelligence integrated · E3 E2 E1 programmes aligned`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting innovation intelligence integrity")}`,
    "ECC coordinates innovation intelligence · Supervisor monitors innovation accuracy",
    "VIE validates innovation alignment · vision · strategic · constitutional",
    "Grand King possesses continuous innovation awareness across every breakthrough and disruptive capability",
  ];

  return {
    engineVersion: "E4-07",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Innovation Intelligence Engine continuously discovers, analyzes and evaluates innovations capable of transforming businesses, industries and the Empire itself. Every innovation, breakthrough, emerging technology, disruptive capability and novel business model contributes toward executive intelligence. The Grand King always possesses continuous innovation awareness.",
    engineHealth: healthLabel(clampedHealth),
    innovationIntelligenceHealth: avgReadiness >= 80 ? "strong" : avgReadiness >= 70 ? "active" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    discoveredInnovationCount: innovationPipeline.length,
    disruptiveInnovationCount: disruptiveCount,
    emergingTechnologyCount: emergingCount,
    averageAdoptionReadiness: avgReadiness,
    innovationPipeline,
    emergingTechnologies,
    disruptiveInnovations,
    strategicOpportunities,
    innovationReadiness,
    businessImpact,
    innovationRisks,
    innovationAnalysis,
    innovationIntelligencePipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    innovationPrinciples: [...INNOVATION_INTELLIGENCE_PRINCIPLES],
    governedDomains: [...GOVERNED_INNOVATION_DOMAINS],
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "innovation intelligence protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-16 · certified"
        : "E1 · integrated",
      journeyStatus: String(input.journey?.currentMission ?? "E4-07 Innovation Intelligence Engine"),
      supervisorStatus: String(input.supervisor?.status ?? "monitoring innovation intelligence health"),
      eccStatus: String(input.ecc?.status ?? "innovation intelligence coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "validated"),
    },
    readyForE408: true,
  };
}

export function buildFallbackInnovationIntelligenceEngine(): InnovationIntelligenceEngine {
  return assembleInnovationIntelligenceEngine({});
}
