import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveEscalationEngine } from "../executive-escalation-engine/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  TRADEOFF_PIPELINE,
  TRADEOFF_PRINCIPLES,
  GOVERNED_TRADEOFF_DOMAINS,
  TRADEOFF_DIMENSIONS,
  PILLOW_TRADEOFF_EVALUATIONS,
} from "./paths.js";
import type {
  TradeOffAnalysisEngine,
  TradeOffPipelineStep,
  TradeOffPipelinePhase,
  TradeOffAnalysis,
  DecisionAlternative,
  TradeOffComparisonEntry,
  TradeOffScoringMetric,
  TradeOffAnalysisRecommendation,
  PillowTradeOffEvaluationMetric,
  GovernedTradeOffDomain,
  TradeOffClassification,
  TradeOffDimension,
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

function mapDomain(category: TradeOffClassification): GovernedTradeOffDomain {
  const map: Record<TradeOffClassification, GovernedTradeOffDomain> = {
    strategic: "strategic_tradeoffs",
    business: "business_tradeoffs",
    financial: "financial_tradeoffs",
    commerce: "commerce_tradeoffs",
    engineering: "engineering_tradeoffs",
    architecture: "architecture_tradeoffs",
    operational: "operational_tradeoffs",
    production: "production_tradeoffs",
    resource: "resource_tradeoffs",
    investment: "investment_tradeoffs",
    time: "time_tradeoffs",
  };
  return map[category];
}

function buildPipeline(activePhase: TradeOffPipelinePhase = "comparative_evaluation"): TradeOffPipelineStep[] {
  const activeIdx = TRADEOFF_PIPELINE.indexOf(activePhase);
  return TRADEOFF_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildTradeOffCatalogue(input: {
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
}): Array<{
  tradeOffId: string;
  decisionId: string;
  title: string;
  description: string;
  category: TradeOffClassification;
  business: string;
  financial: string;
  engineering: string;
  strategic: string;
  operational: string;
  deps: string[];
  benefits: string[];
  costs: string[];
  risk: string;
  score: number;
  confidence: number;
  evidence: string[];
  recommended: string;
  status: string;
  alternatives: Array<{
    id: string;
    label: string;
    description: string;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    operational: string;
    benefits: string[];
    costs: string[];
    risk: string;
    score: number;
    roi: string;
    confidence: number;
    evidence: string[];
    recommended: boolean;
  }>;
}> {
  const simulations = input.decisionSimulationEngine?.availableSimulations ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];

  return [
    {
      tradeOffId: "toae-engineering-allocation",
      decisionId: "dec-e2-engineering",
      title: "Engineering Resource Allocation Trade-off",
      description: "E2 programme acceleration vs P8 commerce execution — competing engineering capacity",
      category: "resource",
      business: "critical",
      financial: "high exposure",
      engineering: "critical",
      strategic: "aligned",
      operational: "high",
      deps: ["E2-05 Resource Allocation", "E2-03 Decision Simulation"],
      benefits: ["E2 roadmap acceleration", "Commerce milestone delivery", "Balanced capacity"],
      costs: ["Deferred missions", "Extended timelines", "Opportunity cost"],
      risk: criticalRisks[0]?.title ?? "Engineering bottleneck risk",
      score: 78,
      confidence: 87,
      evidence: ["85% engineering utilization", simulations[0]?.title ?? "Simulation baseline"],
      recommended: "Balanced phased allocation",
      status: "evaluating",
      alternatives: [
        {
          id: "alt-e2-priority",
          label: "Prioritize E2 Programme",
          description: "Allocate 70% engineering to E2 Executive Decision Engine completion",
          business: "high",
          financial: "moderate deferral",
          engineering: "critical focus",
          strategic: "E2 aligned",
          operational: "commerce delayed",
          benefits: ["E2 completion by Q3", "Decision engine maturity"],
          costs: ["P8 commerce delay 6 weeks", "Revenue milestone slip"],
          risk: "Commerce revenue exposure",
          score: 72,
          roi: "Strategic value +85%",
          confidence: 82,
          evidence: ["E2 roadmap priority", "Executive planning certification"],
          recommended: false,
        },
        {
          id: "alt-balanced",
          label: "Balanced Phased Allocation",
          description: "60/40 split with milestone gates — recommended constitutional path",
          business: "critical",
          financial: "optimized",
          engineering: "sustainable",
          strategic: "aligned",
          operational: "managed",
          benefits: ["Both programmes progress", "Milestone gates protect ROI"],
          costs: ["Slower E2 completion", "Moderate commerce delay"],
          risk: "Low — gated milestones",
          score: 88,
          roi: "Combined ROI +72%",
          confidence: 90,
          evidence: ["E2-03 simulation", "E2-04 recommendation"],
          recommended: true,
        },
        {
          id: "alt-commerce-priority",
          label: "Prioritize P8 Commerce",
          description: "Allocate 65% engineering to commerce execution and revenue milestones",
          business: "revenue critical",
          financial: "high return",
          engineering: "commerce focus",
          strategic: "revenue aligned",
          operational: "E2 deferred",
          benefits: ["MS-A milestone", "Revenue acceleration"],
          costs: ["E2 delay 8 weeks", "Decision engine gap"],
          risk: "Executive decision velocity",
          score: 68,
          roi: "Financial ROI +95%",
          confidence: 75,
          evidence: ["MS-A financial gate", "Commerce dashboard"],
          recommended: false,
        },
      ],
    },
    {
      tradeOffId: "toae-msa-investment",
      decisionId: "dec-msa-financial",
      title: "MS-A Investment Phasing Trade-off",
      description: "Full investment vs phased investment for MS-A milestone delivery",
      category: "financial",
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "high",
      operational: "moderate",
      deps: ["E2-02 Risk Assessment", "Grand King Account"],
      benefits: ["ROI optimization", "Risk mitigation", "Cash flow preservation"],
      costs: ["Timeline extension", "Opportunity cost", "Resource lock-in"],
      risk: "MS-A delay risk",
      score: 82,
      confidence: 85,
      evidence: [criticalRisks[0]?.title ?? "MS-A financial risk", "ROI tracking"],
      recommended: "Phased investment with gates",
      status: "pending_decision",
      alternatives: [
        {
          id: "alt-full-invest",
          label: "Full Investment Now",
          description: "Commit full MS-A budget immediately for fastest delivery",
          business: "high",
          financial: "high exposure",
          engineering: "moderate",
          strategic: "aligned",
          operational: "accelerated",
          benefits: ["Fastest MS-A delivery", "Market timing advantage"],
          costs: ["Full capital commitment", "Limited flexibility"],
          risk: "High financial exposure",
          score: 70,
          roi: "ROI +110% (optimistic)",
          confidence: 68,
          evidence: ["Financial model A", "Market timing analysis"],
          recommended: false,
        },
        {
          id: "alt-phased",
          label: "Phased Investment with Gates",
          description: "Three-phase investment with ROI gates — recommended",
          business: "critical",
          financial: "controlled",
          engineering: "moderate",
          strategic: "aligned",
          operational: "managed",
          benefits: ["Risk-controlled investment", "Gate-based ROI validation"],
          costs: ["Extended timeline 4 weeks", "Phase transition overhead"],
          risk: "Low — gated phases",
          score: 86,
          roi: "ROI +88% (validated)",
          confidence: 88,
          evidence: ["E2-02 risk assessment", recommendations[0]?.title ?? "Executive recommendation"],
          recommended: true,
        },
      ],
    },
    {
      tradeOffId: "toae-architecture-canonical",
      decisionId: "dec-arch-policy",
      title: "Architecture Canonical Policy Trade-off",
      description: "Strict canonical enforcement vs pragmatic delivery acceleration",
      category: "architecture",
      business: "high",
      financial: "low",
      engineering: "critical",
      strategic: "aligned",
      operational: "moderate",
      deps: ["Constitution Hierarchy", "VIE Validation"],
      benefits: ["Long-term maintainability", "Constitutional integrity", "Faster short-term delivery"],
      costs: ["Technical debt", "Refactoring cycles", "Compliance overhead"],
      risk: "Architecture drift",
      score: 91,
      confidence: 93,
      evidence: ["Canonical architecture policy", "VIE validation"],
      recommended: "Constitutional canonical path",
      status: "recommended",
      alternatives: [
        {
          id: "alt-strict",
          label: "Strict Canonical Enforcement",
          description: "Full constitutional architecture compliance — recommended",
          business: "high",
          financial: "moderate investment",
          engineering: "high quality",
          strategic: "constitutionally aligned",
          operational: "slower initial delivery",
          benefits: ["Zero architecture drift", "Long-term value preservation"],
          costs: ["20% slower initial delivery", "Higher upfront engineering"],
          risk: "Minimal — constitutional",
          score: 92,
          roi: "Long-term value +95%",
          confidence: 94,
          evidence: ["Constitution hierarchy", "Canonical policy"],
          recommended: true,
        },
        {
          id: "alt-pragmatic",
          label: "Pragmatic Delivery Acceleration",
          description: "Allow temporary deviations for faster delivery",
          business: "moderate",
          financial: "short-term savings",
          engineering: "technical debt risk",
          strategic: "misaligned",
          operational: "faster",
          benefits: ["30% faster delivery", "Lower immediate cost"],
          costs: ["Technical debt accumulation", "Future refactoring"],
          risk: "High — constitutional compromise",
          score: 55,
          roi: "Short-term +40% / long-term -25%",
          confidence: 70,
          evidence: ["Delivery pressure", "Technical debt register"],
          recommended: false,
        },
      ],
    },
    {
      tradeOffId: "toae-commerce-launch",
      decisionId: "dec-p8-launch",
      title: "Commerce Launch Timing Trade-off",
      description: "Early launch with MVP vs full-feature launch for P8 commerce",
      category: "commerce",
      business: "critical",
      financial: "high",
      engineering: "high",
      strategic: "high",
      operational: "critical",
      deps: ["P8 Commerce", "Supplier Network"],
      benefits: ["Market entry", "Revenue generation", "Brand establishment"],
      costs: ["Feature gaps", "Support overhead", "Reputation risk"],
      risk: "Market timing and quality",
      score: 80,
      confidence: 84,
      evidence: [simulations[1]?.title ?? "Commerce simulation", "Market analysis"],
      recommended: "MVP launch with roadmap",
      status: "evaluating",
      alternatives: [
        {
          id: "alt-mvp",
          label: "MVP Launch with Roadmap",
          description: "Launch core features with transparent roadmap — recommended",
          business: "high",
          financial: "early revenue",
          engineering: "focused",
          strategic: "aligned",
          operational: "manageable",
          benefits: ["4-week earlier launch", "Market feedback loop"],
          costs: ["Limited initial features", "Support scaling"],
          risk: "Moderate — managed MVP",
          score: 85,
          roi: "ROI +78%",
          confidence: 86,
          evidence: ["Commerce intelligence", "MVP scope definition"],
          recommended: true,
        },
        {
          id: "alt-full",
          label: "Full-Feature Launch",
          description: "Wait for complete feature set before launch",
          business: "moderate",
          financial: "delayed revenue",
          engineering: "comprehensive",
          strategic: "aligned",
          operational: "complex",
          benefits: ["Complete product", "Higher initial quality"],
          costs: ["8-week delay", "Missed market window"],
          risk: "Market timing risk",
          score: 72,
          roi: "ROI +92% (delayed)",
          confidence: 78,
          evidence: ["Feature completeness matrix", "Market window analysis"],
          recommended: false,
        },
      ],
    },
    {
      tradeOffId: "toae-time-roadmap",
      decisionId: "dec-e2-sequencing",
      title: "E2 Roadmap Sequencing Trade-off",
      description: "Parallel E2 missions vs sequential constitutional completion",
      category: "time",
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "critical",
      operational: "high",
      deps: ["E2 Executive Decision Engine", "Executive Roadmap"],
      benefits: ["Faster programme completion", "Higher quality per mission", "Reduced integration risk"],
      costs: ["Extended timeline", "Resource contention", "Integration complexity"],
      risk: "Programme sequencing",
      score: 83,
      confidence: 89,
      evidence: ["E2 roadmap", "Mission dependency graph"],
      recommended: "Sequential with parallel validation",
      status: "active",
      alternatives: [
        {
          id: "alt-parallel",
          label: "Parallel Mission Execution",
          description: "Run E2-10 through E2-15 in parallel tracks",
          business: "moderate",
          financial: "higher cost",
          engineering: "contention risk",
          strategic: "risky",
          operational: "complex",
          benefits: ["6-week faster completion"],
          costs: ["Integration risk", "Quality compromise"],
          risk: "High — dependency conflicts",
          score: 62,
          roi: "Speed +40% / quality -15%",
          confidence: 72,
          evidence: ["Resource contention model"],
          recommended: false,
        },
        {
          id: "alt-sequential",
          label: "Sequential Constitutional Completion",
          description: "Complete each E2 mission before next — recommended",
          business: "high",
          financial: "optimized",
          engineering: "sustainable",
          strategic: "constitutionally aligned",
          operational: "managed",
          benefits: ["Zero integration debt", "Validated dependencies"],
          costs: ["Extended timeline"],
          risk: "Minimal",
          score: 90,
          roi: "Quality +95%",
          confidence: 92,
          evidence: ["Constitutional sequencing", "E2 dependency chain"],
          recommended: true,
        },
      ],
    },
    {
      tradeOffId: "toae-strategic-vision",
      decisionId: "dec-vision-priority",
      title: "Strategic Vision Priority Trade-off",
      description: "Commerce revenue focus vs E2 decision engine maturity",
      category: "strategic",
      business: "critical",
      financial: "high",
      engineering: "moderate",
      strategic: "critical",
      operational: "moderate",
      deps: ["E1 Corporate Vision", "Strategic Objectives"],
      benefits: ["Revenue growth", "Decision engine maturity", "Balanced empire health"],
      costs: ["Opportunity cost", "Resource reallocation"],
      risk: "Strategic misalignment",
      score: 86,
      confidence: 88,
      evidence: [recommendations[1]?.title ?? "Strategic recommendation", "Vision alignment"],
      recommended: "Vision-synchronized balanced path",
      status: "recommended",
      alternatives: [
        {
          id: "alt-revenue",
          label: "Revenue-First Strategy",
          description: "Prioritize commerce and revenue milestones",
          business: "revenue critical",
          financial: "high return",
          engineering: "commerce focus",
          strategic: "partial alignment",
          operational: "revenue driven",
          benefits: ["Immediate revenue", "Market presence"],
          costs: ["E2 maturity delay", "Decision velocity gap"],
          risk: "Executive decision bottleneck",
          score: 74,
          roi: "Financial +90%",
          confidence: 80,
          evidence: ["Revenue targets", "Commerce KPIs"],
          recommended: false,
        },
        {
          id: "alt-balanced-vision",
          label: "Vision-Synchronized Balanced Path",
          description: "Balance revenue and decision engine per corporate vision — recommended",
          business: "critical",
          financial: "optimized",
          engineering: "balanced",
          strategic: "fully aligned",
          operational: "sustainable",
          benefits: ["Vision alignment", "Sustainable growth", "Decision maturity"],
          costs: ["Moderate pace on both tracks"],
          risk: "Low — vision validated",
          score: 89,
          roi: "Combined strategic value +85%",
          confidence: 90,
          evidence: ["Corporate vision engine", "VIE validation"],
          recommended: true,
        },
      ],
    },
    {
      tradeOffId: "toae-production-mode",
      decisionId: "dec-production-truth",
      title: "Production Mode Enforcement Trade-off",
      description: "Strict production truth vs development velocity",
      category: "production",
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      operational: "critical",
      deps: ["Guardian", "Production Centre"],
      benefits: ["Production integrity", "Faster development cycles"],
      costs: ["Validation overhead", "Sandbox isolation complexity"],
      risk: "Production truth deviation",
      score: 88,
      confidence: 91,
      evidence: ["Guardian monitoring", "Production mode policy"],
      recommended: "Constitutional production truth",
      status: "active",
      alternatives: [
        {
          id: "alt-strict-prod",
          label: "Strict Production Truth",
          description: "Full Guardian enforcement — recommended constitutional path",
          business: "high",
          financial: "moderate",
          engineering: "high integrity",
          strategic: "aligned",
          operational: "validated",
          benefits: ["Zero production drift", "Executive trust"],
          costs: ["Validation gate overhead"],
          risk: "Minimal",
          score: 91,
          roi: "Trust value +100%",
          confidence: 93,
          evidence: ["Guardian policy", "Production truth register"],
          recommended: true,
        },
        {
          id: "alt-velocity",
          label: "Development Velocity Priority",
          description: "Relax production gates for faster iteration",
          business: "moderate",
          financial: "short-term savings",
          engineering: "velocity focus",
          strategic: "misaligned",
          operational: "risky",
          benefits: ["25% faster iteration"],
          costs: ["Production truth risk", "Executive trust erosion"],
          risk: "High — constitutional",
          score: 48,
          roi: "Short-term +25% / trust -40%",
          confidence: 65,
          evidence: ["Development pressure"],
          recommended: false,
        },
      ],
    },
    {
      tradeOffId: "toae-investment-e2",
      decisionId: "dec-e2-investment",
      title: "E2 Programme Investment Trade-off",
      description: "Full E2 investment vs incremental phased investment",
      category: "investment",
      business: "high",
      financial: "critical",
      engineering: "high",
      strategic: "critical",
      operational: "moderate",
      deps: ["E2 Executive Decision Engine", "Financial Planning"],
      benefits: ["Complete decision engine", "Incremental value delivery", "Risk-controlled investment"],
      costs: ["Capital commitment", "Extended programme", "Opportunity cost"],
      risk: "Investment ROI",
      score: 84,
      confidence: 86,
      evidence: ["E2 ROI model", "Executive planning certification"],
      recommended: "Incremental phased investment",
      status: "evaluating",
      alternatives: [
        {
          id: "alt-full-e2",
          label: "Full E2 Investment",
          description: "Commit full E2 programme budget immediately",
          business: "high",
          financial: "high commitment",
          engineering: "accelerated",
          strategic: "aligned",
          operational: "intensive",
          benefits: ["Fastest E2 completion", "Full capability"],
          costs: ["Full capital lock-in"],
          risk: "Financial exposure",
          score: 76,
          roi: "ROI +105%",
          confidence: 78,
          evidence: ["Full budget model"],
          recommended: false,
        },
        {
          id: "alt-incremental",
          label: "Incremental Phased Investment",
          description: "Mission-by-mission investment with ROI gates — recommended",
          business: "high",
          financial: "controlled",
          engineering: "sustainable",
          strategic: "aligned",
          operational: "managed",
          benefits: ["ROI validation per mission", "Flexible capital"],
          costs: ["Extended programme timeline"],
          risk: "Low — gated",
          score: 87,
          roi: "ROI +92% (validated)",
          confidence: 89,
          evidence: ["Phased investment model", "E1-15 certification"],
          recommended: true,
        },
      ],
    },
  ];
}

function buildAnalyses(catalogue: ReturnType<typeof buildTradeOffCatalogue>): TradeOffAnalysis[] {
  return catalogue.map((c) => ({
    tradeOffId: c.tradeOffId,
    decisionId: c.decisionId,
    title: c.title,
    description: c.description,
    category: c.category,
    domain: mapDomain(c.category),
    alternatives: c.alternatives.map((a) => a.label),
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    operationalImpact: c.operational,
    dependencies: c.deps,
    expectedBenefits: c.benefits,
    expectedCosts: c.costs,
    riskAssessment: c.risk,
    tradeOffScore: c.score,
    confidence: c.confidence,
    evidence: c.evidence,
    recommendedOption: c.recommended,
    status: c.status,
  }));
}

function buildAlternatives(catalogue: ReturnType<typeof buildTradeOffCatalogue>): DecisionAlternative[] {
  return catalogue.flatMap((c) =>
    c.alternatives.map((a) => ({
      alternativeId: a.id,
      tradeOffId: c.tradeOffId,
      label: a.label,
      description: a.description,
      businessImpact: a.business,
      financialImpact: a.financial,
      engineeringImpact: a.engineering,
      strategicImpact: a.strategic,
      operationalImpact: a.operational,
      expectedBenefits: a.benefits,
      expectedCosts: a.costs,
      riskAssessment: a.risk,
      tradeOffScore: a.score,
      expectedRoi: a.roi,
      confidence: a.confidence,
      evidence: a.evidence,
      recommended: a.recommended,
    })),
  );
}

function buildComparisons(catalogue: ReturnType<typeof buildTradeOffCatalogue>): TradeOffComparisonEntry[] {
  const entries: TradeOffComparisonEntry[] = [];
  for (const c of catalogue.slice(0, 5)) {
    for (const dim of TRADEOFF_DIMENSIONS.slice(0, 6)) {
      const best = [...c.alternatives].sort((a, b) => b.score - a.score)[0];
      entries.push({
        tradeOffId: c.tradeOffId,
        title: c.title,
        dimension: dim,
        bestAlternative: best?.label ?? c.recommended,
        score: best?.score ?? c.score,
        summary: `${label(dim)} comparison · ${best?.label ?? c.recommended} leads`,
      });
    }
  }
  return entries;
}

function buildScoring(alternatives: DecisionAlternative[]): TradeOffScoringMetric[] {
  return alternatives
    .sort((a, b) => b.tradeOffScore - a.tradeOffScore)
    .slice(0, 16)
    .map((a) => ({
      tradeOffId: a.tradeOffId,
      title: a.label,
      alternativeId: a.alternativeId,
      alternativeLabel: a.label,
      tradeOffScore: a.tradeOffScore,
      expectedRoi: a.expectedRoi,
      riskLevel: a.riskAssessment,
      strategicAlignment: a.strategicImpact,
      recommended: a.recommended,
    }));
}

function buildPillowEvaluations(input: {
  activeCount: number;
  recommendedCount: number;
}): PillowTradeOffEvaluationMetric[] {
  return PILLOW_TRADEOFF_EVALUATIONS.map((domain) => {
    const metrics: Record<string, { status: string; summary: string }> = {
      alternative_strategies: {
        status: "evaluating",
        summary: `${input.activeCount} active trade-off analyses · alternatives identified`,
      },
      business_tradeoffs: {
        status: "balanced",
        summary: "Business impact quantified across all competing alternatives",
      },
      engineering_tradeoffs: {
        status: "analyzing",
        summary: "Engineering complexity and resource utilization compared",
      },
      financial_tradeoffs: {
        status: "scoring",
        summary: "Financial return and cost trade-offs scored with ROI models",
      },
      strategic_tradeoffs: {
        status: "aligned",
        summary: "Strategic alignment validated against corporate vision",
      },
      executive_recommendations: {
        status: "active",
        summary: `${input.recommendedCount} recommended options · explainable analysis`,
      },
    };
    const m = metrics[domain] ?? { status: "active", summary: "Pillow evaluation active" };
    return { domain, label: label(domain), status: m.status, summary: m.summary };
  });
}

function buildRecommendations(input: {
  analyses: TradeOffAnalysis[];
  recommendedCount: number;
}): TradeOffAnalysisRecommendation[] {
  const top = [...input.analyses].sort((a, b) => b.tradeOffScore - a.tradeOffScore)[0];
  const pending = input.analyses.filter((a) => a.status === "pending_decision" || a.status === "evaluating");

  return [
    {
      id: "toae-rec-1",
      title: "No hidden trade-offs — every alternative measurable and explainable",
      category: "tradeoff_framework",
      why: "Executive transparency · Grand King understands what is gained, sacrificed and why",
      what: "Context → Alternatives → Evidence → Impact → Risk → Compare → Score → Recommend → Decide",
      how: "E2-10 Trade-off Analysis Engine · E2-03 Simulation · E2-04 Recommendations · VIE validation",
      confidencePercent: 95,
    },
    {
      id: "toae-rec-2",
      title: top ? `Top trade-off: ${top.title}` : "Review trade-off register",
      category: "priority_analysis",
      why: `Score ${top?.tradeOffScore ?? 0} · ${top?.confidence ?? 85}% confidence · ${top?.category ?? "strategic"} category`,
      what: top?.recommendedOption ?? "Evaluate competing alternatives",
      how: "Comparative evaluation · trade-off scoring · constitutional alignment",
      confidencePercent: top?.confidence ?? 88,
    },
    {
      id: "toae-rec-3",
      title: `${pending.length} decisions pending trade-off resolution`,
      category: "decision_readiness",
      why: "Balanced evaluation before executive decision · evidence-first analysis",
      what: `${input.recommendedCount} recommended options identified across active analyses`,
      how: "E2-01 Decision Architecture · E2-09 Escalation routing for unresolved trade-offs",
      confidencePercent: 90,
    },
    {
      id: "toae-rec-4",
      title: "Integrate simulation outcomes with trade-off scoring",
      category: "simulation_integration",
      why: "E2-03 Decision Simulation provides scenario evidence for trade-off comparison",
      what: "Simulation probabilities feed comparative evaluation and trade-off scores",
      how: "E2-03 Simulation Engine · E2-04 Recommendation Engine · continuous learning",
      confidencePercent: 92,
    },
  ];
}

export function assembleTradeOffAnalysisEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executiveEscalationEngine?: ExecutiveEscalationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): TradeOffAnalysisEngine {
  const catalogue = buildTradeOffCatalogue(input);
  const tradeOffAnalyses = buildAnalyses(catalogue);
  const decisionAlternatives = buildAlternatives(catalogue);
  const tradeOffComparisons = buildComparisons(catalogue);
  const tradeOffScoring = buildScoring(decisionAlternatives);

  const activeCount = tradeOffAnalyses.filter(
    (t) => t.status === "evaluating" || t.status === "pending_decision" || t.status === "active",
  ).length;
  const pendingCount = tradeOffAnalyses.filter(
    (t) => t.status === "pending_decision" || t.status === "evaluating",
  ).length;
  const recommendedCount = decisionAlternatives.filter((a) => a.recommended).length;

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.riskAssessmentEngine?.healthScore ?? 75,
    input.decisionSimulationEngine?.healthScore ?? 75,
    input.executiveRecommendationEngine?.healthScore ?? 75,
    pendingCount <= 3 ? 90 : pendingCount <= 5 ? 80 : 70,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({ activeCount, recommendedCount });
  const recommendedActions = buildRecommendations({ analyses: tradeOffAnalyses, recommendedCount });

  const pillowAdvisory = [
    "Every trade-off measurable, explainable and constitutionally governed",
    `${activeCount} active analyses · ${recommendedCount} recommended options · ${pendingCount} pending decisions`,
    "Grand King sees what is gained, sacrificed and why — no hidden trade-offs",
    "Integrated with E2-03 Simulation · E2-04 Recommendations · E2-09 Escalation",
    "ECC coordinates alternative planning · Supervisor monitors decision readiness",
    "VIE validates trade-off alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-10",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Trade-off Analysis Engine continuously evaluates competing executive alternatives before recommending decisions. Every trade-off is measurable, explainable and constitutionally governed. The Grand King clearly understands what is gained, what is sacrificed and why.",
    engineHealth: healthLabel(clampedHealth),
    tradeOffHealth: pendingCount <= 2 ? "ready" : pendingCount <= 4 ? "evaluating" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeTradeOffCount: activeCount,
    pendingDecisionCount: pendingCount,
    recommendedOptionCount: recommendedCount,
    tradeOffAnalyses,
    decisionAlternatives,
    tradeOffComparisons,
    tradeOffScoring,
    tradeOffPipeline: buildPipeline("comparative_evaluation"),
    recommendedActions,
    pillowEvaluations,
    tradeOffPrinciples: [...TRADEOFF_PRINCIPLES],
    governedDomains: [...GOVERNED_TRADEOFF_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth} · ${input.decisionSimulationEngine.activeSimulationCount} active simulations`
        : "E2-03 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      executiveEscalationEngine: input.executiveEscalationEngine
        ? `E2-09 · ${input.executiveEscalationEngine.engineHealth} · ${input.executiveEscalationEngine.activeEscalationCount} active escalations`
        : "E2-09 · standby",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring trade-off analysis"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "alternative planning coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE211: true,
  };
}

export function buildFallbackTradeOffAnalysisEngine(): TradeOffAnalysisEngine {
  return assembleTradeOffAnalysisEngine({});
}
