import type { ConflictResolutionEngine } from "../conflict-resolution-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { ResourceAllocationEngine } from "../resource-allocation-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  APPROVAL_PIPELINE,
  APPROVAL_PRINCIPLES,
  GOVERNED_APPROVAL_DOMAINS,
  APPROVAL_RULES,
  PILLOW_APPROVAL_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveApprovalIntelligence,
  ApprovalPipelineStep,
  ApprovalPipelinePhase,
  ExecutiveApprovalRequest,
  ApprovalQueueItem,
  ApprovalEscalation,
  ApprovalRuleMetric,
  ApprovalIntelligenceRecommendation,
  PillowApprovalEvaluationMetric,
  GovernedApprovalDomain,
  ApprovalClassification,
  ApprovalLevel,
  EscalationTrigger,
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

function mapDomain(type: ApprovalClassification): GovernedApprovalDomain {
  const map: Record<ApprovalClassification, GovernedApprovalDomain> = {
    strategic: "strategic_approvals",
    business: "business_approvals",
    financial: "financial_approvals",
    commerce: "commerce_approvals",
    engineering: "engineering_approvals",
    architecture: "architecture_approvals",
    investment: "investment_approvals",
    operational: "operational_approvals",
    emergency: "emergency_approvals",
    governance: "governance_approvals",
    production: "production_approvals",
  };
  return map[type];
}

function determineAuthority(input: {
  businessImpact: string;
  financialImpact: string;
  riskLevel: string;
  approvalType: ApprovalClassification;
  confidence: number;
}): { recommended: ApprovalLevel; escalated: boolean; trigger?: EscalationTrigger } {
  const highRisk = input.riskLevel === "high" || input.riskLevel === "critical";
  const criticalBusiness = input.businessImpact === "critical";
  const criticalFinancial =
    input.financialImpact.includes("critical") || input.financialImpact.includes("high ROI");
  const constitutional =
    input.approvalType === "governance" || input.approvalType === "architecture";

  if (input.approvalType === "emergency") {
    return { recommended: "emergency_approval", escalated: true, trigger: "risk_exceeds_threshold" };
  }
  if (constitutional || (criticalBusiness && criticalFinancial) || highRisk) {
    return {
      recommended: "grand_king_approval",
      escalated: true,
      trigger: constitutional
        ? "constitutional_impact_exists"
        : criticalFinancial
          ? "financial_exposure_exceeds_policy"
          : "risk_exceeds_threshold",
    };
  }
  if (criticalBusiness || input.approvalType === "investment" || input.approvalType === "strategic") {
    return {
      recommended: "grand_king_approval",
      escalated: input.approvalType === "investment",
      trigger: input.approvalType === "investment" ? "financial_exposure_exceeds_policy" : "strategic_objectives_affected",
    };
  }
  if (input.approvalType === "operational" && input.confidence >= 85 && !highRisk) {
    return { recommended: "automatic_approval", escalated: false };
  }
  if (input.confidence >= 80 && !highRisk) {
    return { recommended: "pillow_executive_approval", escalated: false };
  }
  return {
    recommended: "grand_king_approval",
    escalated: true,
    trigger: "executive_authority_insufficient",
  };
}

function buildPipeline(activePhase: ApprovalPipelinePhase = "authority_determination"): ApprovalPipelineStep[] {
  const activeIdx = APPROVAL_PIPELINE.indexOf(activePhase);
  return APPROVAL_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildApprovals(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  conflictResolutionEngine?: ConflictResolutionEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
}): ExecutiveApprovalRequest[] {
  const decisions = input.executiveDecisionArchitecture?.currentDecisions ?? [];
  const recommendations = input.executiveRecommendationEngine?.priorityQueue ?? [];
  const escalatedConflicts = input.conflictResolutionEngine?.escalations ?? [];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const topSim = input.decisionSimulationEngine?.scenarioComparison.find((s) => s.recommended);

  const catalogue: Array<{
    id: string;
    decisionId: string;
    title: string;
    type: ApprovalClassification;
    purpose: string;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    risk: string;
    deps: string[];
    evidence: string[];
    confidence: number;
    outcome: string;
    status: string;
  }> = [
    {
      id: "eai-ms-a-invest",
      decisionId: "eda-ms-a-invest",
      title: "MS-A Commerce Investment Approval",
      type: "investment",
      purpose: "Authorize phased commerce investment toward USD 100k net profit",
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "aligned",
      risk: "medium",
      deps: ["P8 Commerce", "E2-04 recommendation", "E2-02 risk assessment"],
      evidence: ["MS-A decision", "Simulation outcome", "Risk register"],
      confidence: 68,
      outcome: "pending",
      status: "pending_grand_king",
    },
    {
      id: "eai-e2-complete",
      decisionId: "eda-e2-commence",
      title: "Phase E2 Executive Decision Engine Continuation",
      type: "strategic",
      purpose: "Continue E2 mission sequence through E2-08 Decision Memory",
      business: "high",
      financial: "foundation investment",
      engineering: "critical",
      strategic: "critical",
      risk: "low",
      deps: ["E2-01 through E2-06", "Executive Architecture"],
      evidence: ["E2 roadmap", "Mission dependencies"],
      confidence: 92,
      outcome: "approved",
      status: "pillow_executive_approved",
    },
    {
      id: "eai-arch-policy",
      decisionId: "eda-arch-consolidate",
      title: "Architecture Consolidation Policy Approval",
      type: "architecture",
      purpose: "Maintain no competing systems doctrine across all approvals",
      business: "high",
      financial: "foundation",
      engineering: "critical",
      strategic: "aligned",
      risk: "low",
      deps: ["Canonical Architecture", "E2-01 Decision Architecture"],
      evidence: ["Architecture policy", "Repository integrity"],
      confidence: 94,
      outcome: "approved",
      status: "automatic_approved",
    },
    {
      id: "eai-production-gate",
      decisionId: "eda-production-truth",
      title: "Production-First Execution Gate",
      type: "production",
      purpose: "Gate all execution through production truth validation",
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      risk: "low",
      deps: ["Guardian", "Production Centre"],
      evidence: ["Production mode", "Guardian monitoring"],
      confidence: 90,
      outcome: "approved",
      status: "automatic_approved",
    },
    {
      id: "eai-commerce-defer",
      decisionId: "eda-commerce-expand",
      title: "Commerce Expansion Deferral Approval",
      type: "commerce",
      purpose: "Defer multi-market expansion until MS-A achieved",
      business: "high",
      financial: "risk reduction",
      engineering: "moderate",
      strategic: "aligned",
      risk: "low",
      deps: ["E2-04 defer recommendation", "E2-06 conflict resolution"],
      evidence: ["Conflict resolution", "Resource allocation"],
      confidence: 78,
      outcome: "deferred",
      status: "deferred_approval",
    },
    {
      id: "eai-innovation",
      decisionId: "eda-innovation",
      title: "AI Innovation Experiment Approval",
      type: "engineering",
      purpose: "Authorize capped innovation experiments under constitutional governance",
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      risk: "medium",
      deps: ["P9 AI Evolution", "Scenario Planner"],
      evidence: ["Innovation pipeline", topSim?.title ?? "Simulation"],
      confidence: 72,
      outcome: "pending",
      status: "pending_executive",
    },
    {
      id: "eai-governance-e1",
      decisionId: "eda-e1-governance",
      title: "E1 Planning Governance Continuation",
      type: "governance",
      purpose: "Continue unified E1 planning governance for all approvals",
      business: "high",
      financial: "foundation",
      engineering: "high",
      strategic: "critical",
      risk: "low",
      deps: ["E1-15 Certification", "Planning Dashboard"],
      evidence: ["E1 certification gates"],
      confidence: 95,
      outcome: "approved",
      status: "pillow_executive_approved",
    },
    {
      id: "eai-sim-path",
      decisionId: topSim?.simulationId ?? "sim-top",
      title: topSim ? `Simulated Path Approval: ${topSim.title}` : "Top Simulation Path Approval",
      type: "strategic",
      purpose: "Approve constitutionally aligned simulated decision path",
      business: "high",
      financial: "moderate",
      engineering: "moderate",
      strategic: "aligned",
      risk: topSim?.riskProfile ?? "medium",
      deps: ["E2-03 Decision Simulation", "E2-04 Recommendations"],
      evidence: [`${topSim?.successProbability ?? 70}% success probability`, "Comparative analysis"],
      confidence: topSim?.successProbability ?? 72,
      outcome: "pending",
      status: "pending_grand_king",
    },
  ];

  for (const rec of recommendations.filter((r) => r.priority >= 85).slice(0, 3)) {
    if (catalogue.some((c) => c.title.includes(rec.title.slice(0, 30)))) continue;
    catalogue.push({
      id: `eai-rec-${rec.recommendationId}`,
      decisionId: rec.recommendationId,
      title: `Recommendation Approval: ${rec.title}`,
      type: (rec.recommendationType as ApprovalClassification) || "business",
      purpose: `Approve executive recommendation · priority ${rec.priority}`,
      business: rec.businessImpact,
      financial: "evaluated",
      engineering: "moderate",
      strategic: "aligned",
      risk: "medium",
      deps: ["E2-04 Recommendations"],
      evidence: [`Priority ${rec.priority}`, `${rec.confidence}% confidence`],
      confidence: rec.confidence,
      outcome: "pending",
      status: "pending_executive",
    });
  }

  for (const conflict of escalatedConflicts.slice(0, 2)) {
    catalogue.push({
      id: `eai-conflict-${conflict.conflictId}`,
      decisionId: conflict.conflictId,
      title: `Conflict Resolution Approval: ${conflict.title}`,
      type: "governance",
      purpose: "Grand King approval for escalated conflict resolution",
      business: "critical",
      financial: "moderate",
      engineering: "moderate",
      strategic: "aligned",
      risk: conflict.severity,
      deps: ["E2-06 Conflict Resolution"],
      evidence: [conflict.reason],
      confidence: 85,
      outcome: "pending",
      status: "pending_grand_king",
    });
  }

  for (const decision of decisions.filter((d) => d.status === "pending" || d.status === "queued")) {
    if (catalogue.some((c) => c.decisionId === decision.decisionId)) continue;
    catalogue.push({
      id: `eai-decision-${decision.decisionId}`,
      decisionId: decision.decisionId,
      title: `Decision Approval: ${decision.title}`,
      type: (decision.decisionType as ApprovalClassification) || "strategic",
      purpose: decision.purpose,
      business: decision.businessImpact,
      financial: decision.financialImpact,
      engineering: decision.engineeringImpact,
      strategic: decision.strategicObjective,
      risk: decision.riskAssessment,
      deps: decision.dependencies,
      evidence: decision.evidence,
      confidence: decision.confidence,
      outcome: decision.decisionOutcome,
      status: "pending_review",
    });
  }

  if (criticalRisks.length > 0) {
    catalogue.push({
      id: "eai-risk-mitigation",
      decisionId: criticalRisks[0]!.riskId,
      title: `Risk Mitigation Approval: ${criticalRisks[0]!.title}`,
      type: "financial",
      purpose: "Approve mitigation plan for critical enterprise risk",
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "aligned",
      risk: criticalRisks[0]!.severity,
      deps: ["E2-02 Risk Assessment"],
      evidence: criticalRisks[0]!.evidence,
      confidence: criticalRisks[0]!.confidence,
      outcome: "pending",
      status: "pending_grand_king",
    });
  }

  return catalogue.map((c) => {
    const auth = determineAuthority({
      businessImpact: c.business,
      financialImpact: c.financial,
      riskLevel: c.risk,
      approvalType: c.type,
      confidence: c.confidence,
    });
    return {
      approvalId: c.id,
      decisionId: c.decisionId,
      title: c.title,
      approvalType: c.type,
      domain: mapDomain(c.type),
      authorityLevel: auth.recommended,
      purpose: c.purpose,
      businessImpact: c.business,
      financialImpact: c.financial,
      engineeringImpact: c.engineering,
      strategicImpact: c.strategic,
      riskLevel: c.risk,
      dependencies: c.deps,
      requiredEvidence: c.evidence,
      recommendedAuthority: auth.recommended,
      confidence: c.confidence,
      approvalOutcome: c.outcome,
      escalated: auth.escalated,
      status: c.status,
    };
  });
}

function buildQueue(approvals: ExecutiveApprovalRequest[]): ApprovalQueueItem[] {
  const priority: Record<string, number> = {
    pending_grand_king: 0,
    pending_executive: 1,
    pending_review: 2,
    escalated: 3,
    deferred_approval: 4,
    pillow_executive_approved: 5,
    automatic_approved: 6,
  };

  return [...approvals]
    .filter((a) => a.approvalOutcome === "pending" || a.status.includes("pending"))
    .sort((a, b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99) || b.confidence - a.confidence)
    .slice(0, 10)
    .map((a, i) => ({
      order: i + 1,
      approvalId: a.approvalId,
      title: a.title,
      approvalType: a.approvalType,
      authorityLevel: a.authorityLevel,
      recommendedAuthority: a.recommendedAuthority,
      riskLevel: a.riskLevel,
      confidence: a.confidence,
      status: a.status,
    }));
}

function buildEscalations(approvals: ExecutiveApprovalRequest[]): ApprovalEscalation[] {
  const triggers: Record<ApprovalLevel, EscalationTrigger> = {
    grand_king_approval: "executive_authority_insufficient",
    emergency_approval: "risk_exceeds_threshold",
    escalated: "constitutional_impact_exists",
    pillow_executive_approval: "executive_authority_insufficient",
    automatic_approval: "executive_authority_insufficient",
    deferred_approval: "financial_exposure_exceeds_policy",
    rejected: "risk_exceeds_threshold",
  };

  return approvals
    .filter((a) => a.escalated && a.approvalOutcome === "pending")
    .map((a, i) => ({
      order: i + 1,
      approvalId: a.approvalId,
      title: a.title,
      trigger:
        a.approvalType === "investment"
          ? "financial_exposure_exceeds_policy"
          : a.approvalType === "governance" || a.approvalType === "architecture"
            ? "constitutional_impact_exists"
            : a.riskLevel === "high" || a.riskLevel === "critical"
              ? "risk_exceeds_threshold"
              : triggers[a.authorityLevel] ?? "executive_authority_insufficient",
      reason: `${label(a.authorityLevel)} required · ${a.businessImpact} business impact · ${a.riskLevel} risk`,
      requiredAuthority: a.recommendedAuthority,
    }));
}

function buildApprovalRules(): ApprovalRuleMetric[] {
  const values: Record<string, { status: string; summary: string }> = {
    business_value: { status: "active", summary: "Critical business impact → Grand King approval" },
    financial_exposure: { status: "active", summary: "Investment/financial critical → Grand King approval" },
    strategic_importance: { status: "active", summary: "Strategic decisions → executive or Grand King review" },
    architectural_impact: { status: "active", summary: "Architecture/governance → constitutional review" },
    operational_risk: { status: "active", summary: "Low-risk operational → automatic when confidence ≥ 85%" },
    production_impact: { status: "active", summary: "Production gates → automatic when production-validated" },
    constitutional_impact: { status: "enforced", summary: "Constitutional impact → mandatory Grand King approval" },
    executive_policy: { status: "active", summary: "Least necessary escalation · explainable authority" },
  };

  return APPROVAL_RULES.map((rule) => ({
    rule,
    label: label(rule),
    status: values[rule]?.status ?? "active",
    summary: values[rule]?.summary ?? "Approval rule active",
  }));
}

function buildRecommendations(input: {
  approvals: ExecutiveApprovalRequest[];
  escalations: ApprovalEscalation[];
  queue: ApprovalQueueItem[];
}): ApprovalIntelligenceRecommendation[] {
  const top = input.queue[0];
  const pendingGk = input.approvals.filter((a) => a.authorityLevel === "grand_king_approval" && a.approvalOutcome === "pending");

  return [
    {
      id: "eai-rec-1",
      title: "Apply constitutional approval pipeline to every executive decision",
      category: "approval_framework",
      why: "No unauthorized decisions · least necessary escalation · explainable governance",
      what: "Classify → Assess → Determine Authority → Approve → Execute → Integrate",
      how: "E2-07 Executive Approval Intelligence · Pillow approval gates · VIE validation",
      confidencePercent: 94,
    },
    {
      id: "eai-rec-2",
      title: top ? `Next approval: ${top.title}` : "Review approval queue",
      category: "approval_queue",
      why: `${label(top?.recommendedAuthority ?? "pending")} · ${top?.riskLevel ?? "medium"} risk · ${top?.confidence ?? 0}% confidence`,
      what: top?.title ?? "Process pending approvals",
      how: "ECC release · Supervisor monitoring · Journey recording",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "eai-rec-3",
      title: `${pendingGk.length} items require Grand King approval`,
      category: "grand_king",
      why: "Constitutional escalation · financial/strategic/constitutional impact",
      what: pendingGk.map((a) => a.title).slice(0, 2).join(" · ") || "No Grand King queue",
      how: "Grand King review · approval outcome recording",
      confidencePercent: 90,
    },
    {
      id: "eai-rec-4",
      title: "Integrate escalated conflicts with approval authority",
      category: "conflict_integration",
      why: "E2-06 escalations map directly to approval authority determination",
      what: `${input.escalations.length} escalations linked to approval queue`,
      how: "E2-06 Conflict Resolution · resolution_approval bridge",
      confidencePercent: 88,
    },
    {
      id: "eai-rec-5",
      title: "Prepare E2-08 Decision Memory Engine integration",
      category: "e2_roadmap",
      why: "Approval outcomes feed decision memory for continuous learning",
      what: "Extend approval intelligence with decision memory recording",
      how: "E2-08 mission · integrate with knowledge_integration pipeline phase",
      confidencePercent: 86,
    },
  ];
}

function buildPillowEvaluations(input: {
  approvals: ExecutiveApprovalRequest[];
  recommendations: ApprovalIntelligenceRecommendation[];
  healthScore: number;
}): PillowApprovalEvaluationMetric[] {
  const pending = input.approvals.filter((a) => a.approvalOutcome === "pending" || a.status.includes("pending"));
  const values: Record<string, { status: string; summary: string }> = {
    approval_requests: {
      status: pending.length >= 5 ? "elevated" : "active",
      summary: `${pending.length} pending approvals · ${input.approvals.length} total tracked`,
    },
    approval_policies: { status: "enforced", summary: "8 approval rules · constitutional governance" },
    escalation_requirements: {
      status: "evaluated",
      summary: `${input.approvals.filter((a) => a.escalated).length} escalations · least necessary escalation`,
    },
    executive_authority: {
      status: "transparent",
      summary: `${input.approvals.filter((a) => a.authorityLevel === "pillow_executive_approval").length} Pillow executive · ${input.approvals.filter((a) => a.authorityLevel === "automatic_approval").length} automatic`,
    },
    approval_recommendations: {
      status: input.recommendations.length >= 4 ? "strong" : "building",
      summary: `${input.recommendations.length} approval intelligence recommendations`,
    },
  };

  return PILLOW_APPROVAL_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow approval evaluation active",
  }));
}

export function assembleExecutiveApprovalIntelligence(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  conflictResolutionEngine?: ConflictResolutionEngine | null;
  resourceAllocationEngine?: ResourceAllocationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveApprovalIntelligence {
  const pendingApprovals = buildApprovals(input);
  const approvalQueue = buildQueue(pendingApprovals);
  const escalations = buildEscalations(pendingApprovals);
  const approvalRules = buildApprovalRules();
  const recommendedActions = buildRecommendations({
    approvals: pendingApprovals,
    escalations,
    queue: approvalQueue,
  });

  const pendingCount = pendingApprovals.filter(
    (a) => a.approvalOutcome === "pending" || a.status.includes("pending"),
  ).length;
  const gkCount = pendingApprovals.filter((a) => a.authorityLevel === "grand_king_approval" && a.approvalOutcome === "pending").length;
  const autoCount = pendingApprovals.filter((a) => a.authorityLevel === "automatic_approval").length;

  const healthScore = Math.round(
    (pendingApprovals.reduce((s, a) => s + a.confidence, 0) / Math.max(pendingApprovals.length, 1) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.conflictResolutionEngine?.healthScore ?? 80)) /
      3,
  );

  const pillowEvaluations = buildPillowEvaluations({
    approvals: pendingApprovals,
    recommendations: recommendedActions,
    healthScore,
  });

  const pillowAdvisory = [
    `Intelligence health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${pendingCount} pending · ${gkCount} Grand King · ${autoCount} automatic · explainable authority`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing approval systems · consolidates Pillow approval gates`,
    `Least necessary escalation · Grand King only when constitutionally required`,
    `Ready for E2-08 Decision Memory Engine`,
  ];

  return {
    intelligenceVersion: "E2-07",
    computedAt: new Date().toISOString(),
    intelligenceSummary:
      "One permanent Executive Approval Intelligence — constitutional authority determining what proceeds automatically, what requires Executive approval, what requires Grand King approval and why, with explainable governance and least necessary escalation",
    intelligenceHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    approvalHealth: pendingCount <= 5 ? "stable" : pendingCount <= 10 ? "attention" : "elevated",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    pendingApprovalCount: pendingCount,
    grandKingApprovalCount: gkCount,
    automaticApprovalCount: autoCount,
    escalationCount: escalations.length,
    pendingApprovals,
    approvalQueue,
    escalations,
    approvalRules,
    approvalPipeline: buildPipeline("approval_recommendation"),
    recommendedActions,
    pillowEvaluations,
    approvalPrinciples: [...APPROVAL_PRINCIPLES],
    governedDomains: [...GOVERNED_APPROVAL_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth}`
        : "E2-02 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth}`
        : "E2-03 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth}`
        : "E2-04 · standby",
      conflictResolutionEngine: input.conflictResolutionEngine
        ? `E2-06 · ${input.conflictResolutionEngine.engineHealth} · ${input.conflictResolutionEngine.escalationCount} escalations`
        : "E2-06 · standby",
      pillowApprovalGates: "Pillow Approval Gate Engine · complementary · no competing systems",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring approvals"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "approval queue coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE208: true,
  };
}

export function buildFallbackExecutiveApprovalIntelligence(): ExecutiveApprovalIntelligence {
  return assembleExecutiveApprovalIntelligence({});
}
