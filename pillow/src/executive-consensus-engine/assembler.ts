import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { TradeOffAnalysisEngine } from "../trade-off-analysis-engine/types.js";
import {
  CONSENSUS_PIPELINE,
  CONSENSUS_PRINCIPLES,
  GOVERNED_CONSENSUS_DOMAINS,
  CONSENSUS_PARTICIPANTS,
  CONSENSUS_ANALYSIS_DIMENSIONS,
  PILLOW_CONSENSUS_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveConsensusEngine,
  ConsensusPipelineStep,
  ConsensusPipelinePhase,
  ExecutiveConsensus,
  ExecutivePerspective,
  ConsensusAgreementEntry,
  ConsensusDisagreementEntry,
  ConsensusAnalysisMetric,
  ExecutiveConsensusRecommendation,
  PillowConsensusEvaluationMetric,
  GovernedConsensusDomain,
  ConsensusClassification,
  ConsensusParticipant,
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

function mapDomain(category: ConsensusClassification): GovernedConsensusDomain {
  const map: Record<ConsensusClassification, GovernedConsensusDomain> = {
    strategic: "strategic_consensus",
    business: "business_consensus",
    financial: "financial_consensus",
    commerce: "commerce_consensus",
    engineering: "engineering_consensus",
    architecture: "architecture_consensus",
    operational: "operational_consensus",
    production: "production_consensus",
    governance: "governance_consensus",
    investment: "investment_consensus",
    executive: "executive_consensus",
  };
  return map[category];
}

function buildPipeline(activePhase: ConsensusPipelinePhase = "consensus_formation"): ConsensusPipelineStep[] {
  const activeIdx = CONSENSUS_PIPELINE.indexOf(activePhase);
  return CONSENSUS_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildPerspectives(input: {
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  guardian?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
}): ExecutivePerspective[] {
  const tradeOffs = input.tradeOffAnalysisEngine?.tradeOffAnalyses ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const guardianStatus = String(input.guardian?.status ?? input.guardian?.health ?? "monitoring");
  const vieStatus = String(input.vie?.approvalStatus ?? "validated");

  const perspectiveData: Array<{
    participant: ConsensusParticipant;
    perspective: string;
    alignment: string;
    confidence: number;
    evidence: string[];
  }> = [
    {
      participant: "pillow",
      perspective: "Balanced phased allocation recommended — constitutional path preserves both E2 and commerce progress",
      alignment: "aligned",
      confidence: 90,
      evidence: [tradeOffs[0]?.recommendedOption ?? "Trade-off analysis", "Executive planning certification"],
    },
    {
      participant: "ecc",
      perspective: "Mission scheduling supports sequential E2 completion with parallel validation gates",
      alignment: "aligned",
      confidence: 88,
      evidence: ["ECC execution coordination", "Dependency resolution active"],
    },
    {
      participant: "supervisor",
      perspective: "Decision readiness high for phased investment — monitoring consensus quality",
      alignment: "aligned",
      confidence: 86,
      evidence: ["Supervisor monitoring", "Execution stability confirmed"],
    },
    {
      participant: "guardian",
      perspective: "Production truth enforcement required — strict canonical path protects constitutional integrity",
      alignment: "aligned",
      confidence: 92,
      evidence: [guardianStatus, "Production mode active"],
    },
    {
      participant: "vie",
      perspective: `Vision alignment ${vieStatus} — consensus must preserve constitutional hierarchy`,
      alignment: "aligned",
      confidence: 94,
      evidence: ["VIE validation", "Corporate vision alignment"],
    },
    {
      participant: "business_intelligence",
      perspective: "Commerce milestones require balanced engineering allocation — revenue and E2 both critical",
      alignment: "aligned",
      confidence: 82,
      evidence: ["Business health metrics", "Commerce dashboard"],
    },
    {
      participant: "commercial_intelligence",
      perspective: "MVP launch with roadmap preferred — market timing window supports early entry",
      alignment: "aligned",
      confidence: 84,
      evidence: ["Commercial intelligence", "Market analysis"],
    },
    {
      participant: "financial_intelligence",
      perspective: "Phased MS-A investment with ROI gates — controls financial exposure while preserving upside",
      alignment: "aligned",
      confidence: 87,
      evidence: [criticalRisks[0]?.title ?? "MS-A financial risk", "ROI tracking"],
    },
    {
      participant: "engineering_intelligence",
      perspective: "Sequential constitutional E2 completion preferred over parallel tracks — reduces integration risk",
      alignment: "aligned",
      confidence: 89,
      evidence: ["Engineering capacity model", "85% utilization"],
    },
    {
      participant: "architecture_intelligence",
      perspective: "Strict canonical enforcement — no pragmatic deviations that compromise long-term value",
      alignment: "aligned",
      confidence: 91,
      evidence: ["Canonical architecture policy", recommendations[0]?.title ?? "Architecture recommendation"],
    },
  ];

  return perspectiveData.map((p) => ({
    participant: p.participant,
    label: label(p.participant),
    perspective: p.perspective,
    alignment: p.alignment,
    confidence: p.confidence,
    evidence: p.evidence,
  }));
}

function buildConsensusCatalogue(input: {
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
}): Array<{
  consensusId: string;
  decisionId: string;
  title: string;
  purpose: string;
  category: ConsensusClassification;
  perspectives: string[];
  agreement: string[];
  disagreement: string[];
  evidence: string[];
  business: string;
  financial: string;
  engineering: string;
  strategic: string;
  risk: string;
  strength: number;
  confidence: number;
  recommended: string;
  status: string;
}> {
  const tradeOffs = input.tradeOffAnalysisEngine?.tradeOffAnalyses ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];

  return [
    {
      consensusId: "ece-engineering-allocation",
      decisionId: "dec-e2-engineering",
      title: "Engineering Resource Allocation Consensus",
      purpose: "Unify executive perspectives on E2 vs commerce engineering allocation",
      category: "engineering",
      perspectives: ["Pillow", "ECC", "Engineering Intelligence", "Business Intelligence", "Financial Intelligence"],
      agreement: [
        "Balanced phased allocation is constitutionally preferred",
        "Milestone gates protect both programmes",
        "85% utilization requires active rebalancing",
      ],
      disagreement: [
        "Commerce team prefers 65% commerce allocation",
        "E2 programme advocates 70% E2 priority",
      ],
      evidence: [tradeOffs[0]?.recommendedOption ?? "Balanced phased allocation", "E2-10 trade-off score 88"],
      business: "critical",
      financial: "optimized",
      engineering: "sustainable",
      strategic: "aligned",
      risk: "Low — gated milestones",
      strength: 88,
      confidence: 90,
      recommended: "Balanced Phased Allocation with milestone gates",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-msa-investment",
      decisionId: "dec-msa-financial",
      title: "MS-A Investment Phasing Consensus",
      purpose: "Coordinate financial intelligence on MS-A investment approach",
      category: "financial",
      perspectives: ["Financial Intelligence", "Pillow", "VIE", "Business Intelligence", "Supervisor"],
      agreement: [
        "Phased investment reduces financial exposure",
        "ROI gates validate each phase before commitment",
        "Grand King briefing required for phase transitions",
      ],
      disagreement: [
        "Full investment advocates cite market timing urgency",
      ],
      evidence: [criticalRisks[0]?.title ?? "MS-A financial risk", tradeOffs[1]?.recommendedOption ?? "Phased investment"],
      business: "critical",
      financial: "controlled",
      engineering: "moderate",
      strategic: "aligned",
      risk: "Low — gated phases",
      strength: 86,
      confidence: 88,
      recommended: "Phased Investment with ROI Gates",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-architecture-canonical",
      decisionId: "dec-arch-policy",
      title: "Canonical Architecture Consensus",
      purpose: "Unify architecture and governance perspectives on constitutional compliance",
      category: "architecture",
      perspectives: ["Architecture Intelligence", "Guardian", "VIE", "Pillow", "Engineering Intelligence"],
      agreement: [
        "Strict canonical enforcement preserves long-term value",
        "No pragmatic deviations without constitutional review",
        "VIE validation required before architecture changes",
      ],
      disagreement: [
        "Delivery teams note 20% slower initial velocity with strict enforcement",
      ],
      evidence: ["Canonical architecture policy", "VIE validation", tradeOffs[2]?.recommendedOption ?? "Constitutional canonical path"],
      business: "high",
      financial: "moderate investment",
      engineering: "high quality",
      strategic: "constitutionally aligned",
      risk: "Minimal — constitutional",
      strength: 92,
      confidence: 93,
      recommended: "Strict Canonical Enforcement",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-commerce-launch",
      decisionId: "dec-p8-launch",
      title: "Commerce Launch Timing Consensus",
      purpose: "Synthesize commercial and business intelligence on launch strategy",
      category: "commerce",
      perspectives: ["Commercial Intelligence", "Business Intelligence", "Pillow", "ECC", "Financial Intelligence"],
      agreement: [
        "MVP launch with transparent roadmap preferred",
        "Market feedback loop accelerates product-market fit",
        "Full-feature launch risks missing market window",
      ],
      disagreement: [
        "Quality advocates prefer full-feature launch for brand protection",
      ],
      evidence: [tradeOffs[3]?.recommendedOption ?? "MVP launch with roadmap", "Commerce intelligence"],
      business: "high",
      financial: "early revenue",
      engineering: "focused",
      strategic: "aligned",
      risk: "Moderate — managed MVP",
      strength: 85,
      confidence: 86,
      recommended: "MVP Launch with Roadmap",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-e2-sequencing",
      decisionId: "dec-e2-sequencing",
      title: "E2 Roadmap Sequencing Consensus",
      purpose: "Coordinate engineering and strategic perspectives on programme sequencing",
      category: "strategic",
      perspectives: ["Engineering Intelligence", "Pillow", "VIE", "ECC", "Supervisor"],
      agreement: [
        "Sequential constitutional completion reduces integration risk",
        "Each E2 mission validated before successor begins",
        "Parallel tracks create dependency conflicts",
      ],
      disagreement: [
        "Timeline pressure advocates parallel E2-10 through E2-15 execution",
      ],
      evidence: [tradeOffs[4]?.recommendedOption ?? "Sequential constitutional completion", "E2 dependency chain"],
      business: "high",
      financial: "optimized",
      engineering: "sustainable",
      strategic: "fully aligned",
      risk: "Minimal",
      strength: 90,
      confidence: 92,
      recommended: "Sequential Constitutional Completion",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-production-truth",
      decisionId: "dec-production-truth",
      title: "Production Truth Enforcement Consensus",
      purpose: "Unify Guardian and engineering perspectives on production integrity",
      category: "production",
      perspectives: ["Guardian", "Supervisor", "Architecture Intelligence", "Pillow", "VIE"],
      agreement: [
        "Strict production truth enforcement protects executive trust",
        "Guardian validation gates are non-negotiable",
        "Development velocity must not compromise production integrity",
      ],
      disagreement: [
        "Development teams request relaxed gates for iteration speed",
      ],
      evidence: [tradeOffs[6]?.recommendedOption ?? "Constitutional production truth", "Guardian monitoring"],
      business: "high",
      financial: "moderate",
      engineering: "high integrity",
      strategic: "aligned",
      risk: "Minimal",
      strength: 91,
      confidence: 93,
      recommended: "Strict Production Truth Enforcement",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-strategic-vision",
      decisionId: "dec-vision-priority",
      title: "Strategic Vision Priority Consensus",
      purpose: "Synthesize strategic perspectives on revenue vs decision engine balance",
      category: "strategic",
      perspectives: ["VIE", "Pillow", "Business Intelligence", "Financial Intelligence", "Commercial Intelligence"],
      agreement: [
        "Vision-synchronized balanced path aligns with corporate vision",
        "Neither revenue-only nor E2-only strategy is constitutionally optimal",
        "Sustainable growth requires both tracks",
      ],
      disagreement: [
        "Revenue-first advocates cite immediate financial targets",
      ],
      evidence: [tradeOffs[5]?.recommendedOption ?? "Vision-synchronized balanced path", recommendations[1]?.title ?? "Strategic recommendation"],
      business: "critical",
      financial: "optimized",
      engineering: "balanced",
      strategic: "fully aligned",
      risk: "Low — vision validated",
      strength: 89,
      confidence: 90,
      recommended: "Vision-Synchronized Balanced Path",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-e2-investment",
      decisionId: "dec-e2-investment",
      title: "E2 Programme Investment Consensus",
      purpose: "Coordinate financial and strategic intelligence on E2 investment approach",
      category: "investment",
      perspectives: ["Financial Intelligence", "Pillow", "VIE", "Engineering Intelligence", "Supervisor"],
      agreement: [
        "Incremental phased investment with ROI gates recommended",
        "Mission-by-mission validation preserves capital flexibility",
        "Full commitment increases financial exposure unnecessarily",
      ],
      disagreement: [
        "Acceleration advocates prefer full E2 budget commitment",
      ],
      evidence: [tradeOffs[7]?.recommendedOption ?? "Incremental phased investment", "E1-15 certification"],
      business: "high",
      financial: "controlled",
      engineering: "sustainable",
      strategic: "aligned",
      risk: "Low — gated",
      strength: 87,
      confidence: 89,
      recommended: "Incremental Phased Investment",
      status: "evaluating",
    },
    {
      consensusId: "ece-governance-constitutional",
      decisionId: "dec-governance",
      title: "Constitutional Governance Consensus",
      purpose: "Unify governance perspectives on decision pathway validation",
      category: "governance",
      perspectives: ["VIE", "Guardian", "Pillow", "Architecture Intelligence", "Supervisor"],
      agreement: [
        "Constitutional hierarchy validation required before major decisions",
        "No single-perspective decisions permitted",
        "Consensus formation mandatory for Grand King approvals",
      ],
      disagreement: [],
      evidence: ["Constitution hierarchy", "E2-11 consensus framework"],
      business: "high",
      financial: "low",
      engineering: "low",
      strategic: "critical",
      risk: "Minimal",
      strength: 96,
      confidence: 95,
      recommended: "Constitutional Consensus Pathway",
      status: "consensus_formed",
    },
    {
      consensusId: "ece-executive-bandwidth",
      decisionId: "dec-executive-queue",
      title: "Executive Decision Queue Consensus",
      purpose: "Coordinate executive perspectives on decision prioritization",
      category: "executive",
      perspectives: ["Pillow", "ECC", "Supervisor", "Financial Intelligence", "Business Intelligence"],
      agreement: [
        "Top-3 priority review block protects Grand King bandwidth",
        "Consensus pre-filters low-risk decisions for automatic routing",
        "Multi-perspective reasoning improves decision quality",
      ],
      disagreement: [
        "Urgency advocates want immediate Grand King review for all financial decisions",
      ],
      evidence: ["Executive calendar", "E2-09 escalation routing"],
      business: "critical",
      financial: "decision velocity",
      engineering: "low",
      strategic: "aligned",
      risk: "Moderate — bandwidth management",
      strength: 84,
      confidence: 87,
      recommended: "Top-3 Priority Review with Consensus Pre-filter",
      status: "active",
    },
  ];
}

function buildConsensus(catalogue: ReturnType<typeof buildConsensusCatalogue>): ExecutiveConsensus[] {
  return catalogue.map((c) => ({
    consensusId: c.consensusId,
    decisionId: c.decisionId,
    title: c.title,
    purpose: c.purpose,
    category: c.category,
    domain: mapDomain(c.category),
    participatingPerspectives: c.perspectives,
    areasOfAgreement: c.agreement,
    areasOfDisagreement: c.disagreement,
    supportingEvidence: c.evidence,
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    riskAssessment: c.risk,
    consensusStrength: c.strength,
    confidence: c.confidence,
    recommendedDecision: c.recommended,
    status: c.status,
  }));
}

function buildAgreementAreas(consensus: ExecutiveConsensus[]): ConsensusAgreementEntry[] {
  return consensus.flatMap((c) =>
    c.areasOfAgreement.map((area, i) => ({
      consensusId: c.consensusId,
      area,
      summary: `${c.title} — agreement ${i + 1}`,
      participants: c.participatingPerspectives,
      strength: c.consensusStrength,
    })),
  ).slice(0, 24);
}

function buildDisagreementAreas(consensus: ExecutiveConsensus[]): ConsensusDisagreementEntry[] {
  return consensus
    .filter((c) => c.areasOfDisagreement.length > 0)
    .flatMap((c) =>
      c.areasOfDisagreement.map((area) => ({
        consensusId: c.consensusId,
        area,
        summary: `${c.title} — dissenting view`,
        dissentingPerspectives: c.participatingPerspectives.slice(-2),
        resolution: c.recommendedDecision,
      })),
    )
    .slice(0, 12);
}

function buildConsensusAnalysis(consensus: ExecutiveConsensus[]): ConsensusAnalysisMetric[] {
  const entries: ConsensusAnalysisMetric[] = [];
  for (const c of consensus.slice(0, 6)) {
    for (const dim of CONSENSUS_ANALYSIS_DIMENSIONS.slice(0, 5)) {
      const scores: Record<string, number> = {
        agreement_level: c.consensusStrength,
        strategic_alignment: c.strategicImpact === "fully aligned" || c.strategicImpact === "constitutionally aligned" ? 92 : 80,
        business_value: c.businessImpact === "critical" ? 88 : 75,
        financial_value: c.financialImpact === "optimized" || c.financialImpact === "controlled" ? 86 : 72,
        engineering_value: c.engineeringImpact === "sustainable" || c.engineeringImpact === "high quality" ? 88 : 70,
        risk: c.riskAssessment.includes("Minimal") || c.riskAssessment.includes("Low") ? 90 : 65,
        executive_confidence: c.confidence,
        decision_robustness: Math.round((c.consensusStrength + c.confidence) / 2),
        long_term_value: c.strategicImpact.includes("aligned") ? 88 : 72,
      };
      entries.push({
        consensusId: c.consensusId,
        title: c.title,
        dimension: dim,
        score: scores[dim] ?? c.consensusStrength,
        summary: `${label(dim)} · ${c.title}`,
      });
    }
  }
  return entries;
}

function buildPillowEvaluations(input: {
  activeCount: number;
  strongCount: number;
  perspectiveCount: number;
}): PillowConsensusEvaluationMetric[] {
  return PILLOW_CONSENSUS_EVALUATIONS.map((domain) => {
    const metrics: Record<string, { status: string; summary: string }> = {
      executive_perspectives: {
        status: "coordinating",
        summary: `${input.perspectiveCount} executive perspectives · multi-intelligence reasoning`,
      },
      consensus_quality: {
        status: "strong",
        summary: `${input.strongCount} strong consensus decisions · explainable reasoning`,
      },
      strategic_tradeoffs: {
        status: "integrated",
        summary: "E2-10 trade-off analysis feeds consensus formation",
      },
      executive_recommendations: {
        status: "unified",
        summary: `${input.activeCount} active consensus · unified constitutional recommendations`,
      },
      decision_robustness: {
        status: "evaluating",
        summary: "Decision robustness scored across agreement · risk · long-term value",
      },
    };
    const m = metrics[domain] ?? { status: "active", summary: "Pillow evaluation active" };
    return { domain, label: label(domain), status: m.status, summary: m.summary };
  });
}

function buildRecommendations(input: {
  consensus: ExecutiveConsensus[];
  strongCount: number;
}): ExecutiveConsensusRecommendation[] {
  const top = [...input.consensus].sort((a, b) => b.consensusStrength - a.consensusStrength)[0];
  const evaluating = input.consensus.filter((c) => c.status === "evaluating" || c.status === "active");

  return [
    {
      id: "ece-rec-1",
      title: "No single-perspective decisions — multi-executive consensus mandatory",
      category: "consensus_framework",
      why: "Executive collaboration improves decision quality while preserving accountability",
      what: "Context → Evidence → Perspectives → Trade-offs → Risk → Consensus → Recommend → Approve",
      how: "E2-11 Executive Consensus Engine · E2-10 Trade-offs · E2-04 Recommendations · VIE validation",
      confidencePercent: 95,
    },
    {
      id: "ece-rec-2",
      title: top ? `Strongest consensus: ${top.title}` : "Review consensus register",
      category: "priority_consensus",
      why: `${top?.consensusStrength ?? 0}% strength · ${top?.confidence ?? 85}% confidence · ${top?.participatingPerspectives.length ?? 0} perspectives`,
      what: top?.recommendedDecision ?? "Form executive consensus",
      how: "Multi-perspective synthesis · transparent agreement and disagreement",
      confidencePercent: top?.confidence ?? 90,
    },
    {
      id: "ece-rec-3",
      title: `${input.strongCount} decisions with strong executive consensus`,
      category: "consensus_quality",
      why: "Consensus strength above 85% indicates robust multi-perspective alignment",
      what: `${evaluating.length} decisions still forming consensus`,
      how: "Pillow coordinates perspectives · Supervisor monitors quality",
      confidencePercent: 92,
    },
    {
      id: "ece-rec-4",
      title: "Present agreement and disagreement transparently to Grand King",
      category: "executive_transparency",
      why: "Grand King sees what executives agree on, where they disagree, and why",
      what: "Supporting evidence · business/financial/engineering/strategic impact · risk assessment",
      how: "E2-11 Cockpit panel · constitutional governance · explainable consensus",
      confidencePercent: 94,
    },
  ];
}

export function assembleExecutiveConsensusEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveConsensusEngine {
  const executivePerspectives = buildPerspectives(input);
  const catalogue = buildConsensusCatalogue(input);
  const activeConsensus = buildConsensus(catalogue);
  const agreementAreas = buildAgreementAreas(activeConsensus);
  const disagreementAreas = buildDisagreementAreas(activeConsensus);
  const consensusAnalysis = buildConsensusAnalysis(activeConsensus);

  const activeCount = activeConsensus.filter(
    (c) => c.status === "consensus_formed" || c.status === "evaluating" || c.status === "active",
  ).length;
  const strongCount = activeConsensus.filter((c) => c.consensusStrength >= 85).length;
  const pendingCount = activeConsensus.filter((c) => c.status === "evaluating" || c.status === "active").length;

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.riskAssessmentEngine?.healthScore ?? 75,
    input.tradeOffAnalysisEngine?.healthScore ?? 75,
    input.executiveRecommendationEngine?.healthScore ?? 75,
    strongCount >= 6 ? 90 : strongCount >= 4 ? 80 : 70,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    activeCount,
    strongCount,
    perspectiveCount: executivePerspectives.length,
  });
  const recommendedActions = buildRecommendations({ consensus: activeConsensus, strongCount });

  const pillowAdvisory = [
    "Multi-perspective executive reasoning — no single-perspective decisions",
    `${activeCount} active consensus · ${strongCount} strong · ${executivePerspectives.length} participating perspectives`,
    "Agreement and disagreement presented transparently to Grand King",
    "Integrated with E2-10 Trade-offs · E2-04 Recommendations · E2-03 Simulation",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting production")}`,
    "ECC coordinates consensus workflow · Supervisor monitors consensus quality",
    "VIE validates consensus alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-11",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Consensus Engine synthesizes multiple executive perspectives into one unified constitutional recommendation. Coordinated reasoning across Pillow, ECC, Supervisor, Guardian, VIE and executive intelligence improves decision quality while preserving executive accountability.",
    engineHealth: healthLabel(clampedHealth),
    consensusHealth: strongCount >= 6 ? "strong" : strongCount >= 4 ? "forming" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeConsensusCount: activeCount,
    strongConsensusCount: strongCount,
    pendingConsensusCount: pendingCount,
    executivePerspectives,
    activeConsensus,
    agreementAreas,
    disagreementAreas,
    consensusAnalysis,
    consensusPipeline: buildPipeline("consensus_formation"),
    recommendedActions,
    pillowEvaluations,
    consensusPrinciples: [...CONSENSUS_PRINCIPLES],
    governedDomains: [...GOVERNED_CONSENSUS_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth} · ${input.decisionSimulationEngine.activeSimulationCount} simulations`
        : "E2-03 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      tradeOffAnalysisEngine: input.tradeOffAnalysisEngine
        ? `E2-10 · ${input.tradeOffAnalysisEngine.engineHealth} · ${input.tradeOffAnalysisEngine.activeTradeOffCount} trade-offs`
        : "E2-10 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "active · production protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring consensus progress"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "consensus workflow coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE212: true,
  };
}

export function buildFallbackExecutiveConsensusEngine(): ExecutiveConsensusEngine {
  return assembleExecutiveConsensusEngine({});
}
