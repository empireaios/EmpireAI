import type { ConflictResolutionEngine } from "../conflict-resolution-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveApprovalIntelligence } from "../executive-approval-intelligence/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CRISIS_PIPELINE,
  CRISIS_PRINCIPLES,
  GOVERNED_CRISIS_DOMAINS,
  CRISIS_RESPONSE_DOMAINS,
  PILLOW_CRISIS_EVALUATIONS,
} from "./paths.js";
import type {
  CrisisDecisionEngine,
  CrisisPipelineStep,
  CrisisPipelinePhase,
  EnterpriseCrisis,
  CrisisResponsePlan,
  RecoveryProgressEntry,
  ExecutiveCrisisAction,
  CrisisDecisionRecommendation,
  PillowCrisisEvaluationMetric,
  GovernedCrisisDomain,
  CrisisClassification,
  CrisisSeverityLevel,
  CrisisResponseDomain,
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

function mapDomain(category: CrisisClassification): GovernedCrisisDomain {
  const map: Record<CrisisClassification, GovernedCrisisDomain> = {
    business: "business_crises",
    production: "production_incidents",
    infrastructure: "infrastructure_failures",
    security: "security_events",
    financial: "financial_emergencies",
    commerce: "commerce_disruptions",
    operational: "business_crises",
    architecture: "architecture_emergencies",
    executive: "executive_escalations",
    reputation: "reputation_events",
    runtime: "critical_runtime_failures",
    supplier: "supplier_failures",
  };
  return map[category];
}

function buildPipeline(activePhase: CrisisPipelinePhase = "crisis_decision"): CrisisPipelineStep[] {
  const activeIdx = CRISIS_PIPELINE.indexOf(activePhase);
  return CRISIS_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildCrises(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  conflictResolutionEngine?: ConflictResolutionEngine | null;
  guardian?: Record<string, unknown> | null;
}): EnterpriseCrisis[] {
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const escalations = input.conflictResolutionEngine?.escalations ?? [];
  const gkApprovals = input.executiveApprovalIntelligence?.escalations ?? [];
  const bottlenecks = input.riskAssessmentEngine?.criticalRisks ?? [];
  const guardianStatus = String(input.guardian?.status ?? input.guardian?.health ?? "monitoring");

  const catalogue: Array<{
    id: string;
    title: string;
    description: string;
    category: CrisisClassification;
    source: string;
    severity: CrisisSeverityLevel;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    riskScore: number;
    affected: string[];
    deps: string[];
    status: string;
    actions: string[];
    confidence: number;
    evidence: string[];
    recovery: number;
    authority: string;
  }> = [
    {
      id: "cde-engineering-capacity",
      title: "Engineering Capacity Crisis",
      description: "E2 programme and commerce execution competing for critical engineering capacity",
      category: "business",
      source: "Resource Allocation · Conflict Resolution",
      severity: "high",
      business: "critical",
      financial: "high exposure",
      engineering: "critical",
      strategic: "aligned",
      riskScore: 72,
      affected: ["E2 Roadmap", "P8 Commerce", "Engineering"],
      deps: ["E2-05 Resource Allocation", "E2-06 Conflict Resolution"],
      status: "coordinating",
      actions: ["Rebalance engineering allocation", "Defer non-critical missions", "ECC emergency scheduling"],
      confidence: 85,
      evidence: ["Engineering bottleneck", "85% utilization"],
      recovery: 45,
      authority: "pillow_executive_approval",
    },
    {
      id: "cde-msa-financial",
      title: "MS-A Financial Emergency Watch",
      description: "MS-A milestone delay risk requires accelerated executive decision coordination",
      category: "financial",
      source: "Risk Assessment Engine",
      severity: "high",
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "high",
      riskScore: 68,
      affected: ["P8 Commerce", "Grand King Account", "MS-A Milestone"],
      deps: ["E2-02 Risk Assessment", "E2-04 Recommendations"],
      status: "monitoring",
      actions: ["Weekly ROI gates", "Phased investment review", "Grand King financial briefing"],
      confidence: 72,
      evidence: [criticalRisks[0]?.title ?? "MS-A financial risk", "ROI tracking"],
      recovery: 30,
      authority: "grand_king_approval",
    },
    {
      id: "cde-executive-bandwidth",
      title: "Executive Attention Bandwidth Crisis",
      description: "Pending decisions and escalations exceed Grand King review capacity",
      category: "executive",
      source: "Executive Approval Intelligence",
      severity: "high",
      business: "critical",
      financial: "decision velocity",
      engineering: "low",
      strategic: "aligned",
      riskScore: 75,
      affected: ["Grand King", "Executive Calendar", "Decision Queue"],
      deps: ["E2-07 Approval Intelligence", "E2-01 Decision Queue"],
      status: "active",
      actions: ["Top-3 priority review block", "Automatic low-risk approvals", "Defer non-critical decisions"],
      confidence: 88,
      evidence: [`${gkApprovals.length} escalated approvals`, "Executive calendar"],
      recovery: 55,
      authority: "grand_king_approval",
    },
    {
      id: "cde-production-truth",
      title: "Production Truth Validation Incident",
      description: "Potential production-truth deviation detected — Guardian monitoring elevated",
      category: "production",
      source: "Guardian Monitoring",
      severity: "medium",
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      riskScore: 55,
      affected: ["Production Centre", "Guardian", "Browser Truth"],
      deps: ["Guardian", "Supervisor", "Production Mode"],
      status: "contained",
      actions: ["Guardian alert review", "Production validation gate", "Sandbox isolation"],
      confidence: 90,
      evidence: [guardianStatus, "Production mode active"],
      recovery: 80,
      authority: "pillow_executive_approval",
    },
    {
      id: "cde-security-credential",
      title: "Executive Credential Security Event",
      description: "Grand King account and commerce credentials require elevated security monitoring",
      category: "security",
      source: "Risk Assessment · Guardian",
      severity: "high",
      business: "critical",
      financial: "critical",
      engineering: "high",
      strategic: "high",
      riskScore: 70,
      affected: ["Grand King Account", "Commerce Credentials", "Audit Logger"],
      deps: ["Guardian", "Credential Vault", "Security Audit"],
      status: "monitoring",
      actions: ["Credential rotation review", "Audit trail verification", "Least-privilege enforcement"],
      confidence: 85,
      evidence: [bottlenecks.find((b) => b.title.includes("Credential"))?.title ?? "Security risk register"],
      recovery: 60,
      authority: "grand_king_approval",
    },
    {
      id: "cde-arch-emergency",
      title: "Architecture Integrity Emergency Watch",
      description: "Innovation velocity may introduce systems competing with canonical architecture",
      category: "architecture",
      source: "Architecture Governance",
      severity: "medium",
      business: "high",
      financial: "foundation",
      engineering: "critical",
      strategic: "aligned",
      riskScore: 48,
      affected: ["Canonical Architecture", "P9 AI Evolution", "Repository"],
      deps: ["E1-01 Executive Architecture", "No competing systems doctrine"],
      status: "monitoring",
      actions: ["Policy resolution enforcement", "Architecture review gate", "Consolidation audit"],
      confidence: 94,
      evidence: ["Canonical architecture policy"],
      recovery: 85,
      authority: "pillow_executive_approval",
    },
    {
      id: "cde-commerce-disruption",
      title: "Commerce Pipeline Disruption Watch",
      description: "Commerce operations dependency chain requires continuity monitoring",
      category: "commerce",
      source: "Commerce Operating Model",
      severity: "medium",
      business: "high",
      financial: "high",
      engineering: "moderate",
      strategic: "aligned",
      riskScore: 52,
      affected: ["P8 Commerce", "Business Factory", "Commercial Intelligence"],
      deps: ["Commerce Operating Model", "Business Factory"],
      status: "monitoring",
      actions: ["Supplier continuity check", "Revenue pipeline review", "Fallback commerce path"],
      confidence: 78,
      evidence: ["Commerce dashboard", "Commercial intelligence"],
      recovery: 70,
      authority: "pillow_executive_approval",
    },
    {
      id: "cde-runtime-stability",
      title: "Critical Runtime Stability Watch",
      description: "Infrastructure and compute utilization approaching threshold under E2 load",
      category: "runtime",
      source: "Infrastructure Monitor",
      severity: "medium",
      business: "moderate",
      financial: "moderate OpEx",
      engineering: "high",
      strategic: "foundation",
      riskScore: 50,
      affected: ["Railway", "Vercel", "Pillow Host", "Compute"],
      deps: ["Scaling Architecture", "Performance Governance"],
      status: "monitoring",
      actions: ["Auto-scale verification", "Load threshold review", "ECC resource emergency allocation"],
      confidence: 82,
      evidence: ["Infrastructure monitor", "65% compute utilization"],
      recovery: 75,
      authority: "automatic_approval",
    },
  ];

  for (const esc of escalations.slice(0, 2)) {
    catalogue.push({
      id: `cde-escalation-${esc.conflictId}`,
      title: `Escalated Conflict Crisis: ${esc.title}`,
      description: esc.reason,
      category: "executive",
      source: "Conflict Resolution Engine",
      severity: esc.severity === "critical" ? "critical" : "high",
      business: "critical",
      financial: "moderate",
      engineering: "moderate",
      strategic: "aligned",
      riskScore: esc.severity === "critical" ? 85 : 70,
      affected: ["Conflict Resolution", "Executive Approval"],
      deps: ["E2-06 Conflict Resolution", "E2-07 Approval Intelligence"],
      status: "active",
      actions: ["Grand King resolution approval", "ECC conflict coordination", "Supervisor monitoring"],
      confidence: 85,
      evidence: [esc.reason],
      recovery: 25,
      authority: "grand_king_approval",
    });
  }

  for (const decision of (input.executiveDecisionArchitecture?.currentDecisions.filter(
    (d) => d.riskAssessment === "high" || d.riskAssessment === "critical",
  ) ?? []).slice(0, 2)) {
    catalogue.push({
      id: `cde-decision-${decision.decisionId}`,
      title: `High-Risk Decision Crisis: ${decision.title}`,
      description: decision.purpose,
      category: "business",
      source: "Executive Decision Architecture",
      severity: "high",
      business: decision.businessImpact,
      financial: decision.financialImpact,
      engineering: decision.engineeringImpact,
      strategic: decision.strategicObjective,
      riskScore: 65,
      affected: decision.dependencies,
      deps: decision.dependencies,
      status: "evaluating",
      actions: ["Crisis decision pipeline", "Simulation review", "Grand King approval if required"],
      confidence: decision.confidence,
      evidence: decision.evidence,
      recovery: 20,
      authority: "grand_king_approval",
    });
  }

  return catalogue.map((c) => ({
    crisisId: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    domain: mapDomain(c.category),
    detectionSource: c.source,
    severity: c.severity,
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    riskScore: c.riskScore,
    affectedSystems: c.affected,
    dependencies: c.deps,
    currentStatus: c.status,
    recommendedActions: c.actions,
    confidence: c.confidence,
    evidence: c.evidence,
    recoveryProgress: c.recovery,
    requiredAuthority: c.authority,
  }));
}

function buildResponsePlans(crises: EnterpriseCrisis[]): CrisisResponsePlan[] {
  const plans: CrisisResponsePlan[] = [];

  for (const crisis of crises.filter((c) => c.severity !== "resolved" && c.severity !== "monitoring").slice(0, 5)) {
    const values: Record<CrisisResponseDomain, { value: string; status: string }> = {
      required_executive_authority: { value: label(crisis.requiredAuthority), status: "determined" },
      immediate_actions: { value: crisis.recommendedActions[0] ?? "Assess and contain", status: "active" },
      resource_requirements: { value: "ECC emergency allocation · Supervisor coordination", status: "planned" },
      recovery_strategy: { value: crisis.recommendedActions.join(" · "), status: "in_progress" },
      communication_plan: { value: "Executive notification · transparent status updates", status: "active" },
      business_continuity_actions: { value: `Maintain ${crisis.businessImpact} operations · constitutional governance`, status: "enforced" },
      executive_notifications: {
        value: crisis.requiredAuthority.includes("grand_king") ? "Grand King notified" : "Pillow executive notified",
        status: "sent",
      },
    };

    for (const domain of CRISIS_RESPONSE_DOMAINS) {
      plans.push({
        crisisId: crisis.crisisId,
        title: crisis.title,
        domain,
        label: label(domain),
        value: values[domain]?.value ?? "coordinating",
        status: values[domain]?.status ?? "active",
      });
    }
  }

  return plans;
}

function buildRecoveryProgress(crises: EnterpriseCrisis[]): RecoveryProgressEntry[] {
  return crises
    .filter((c) => c.currentStatus !== "resolved")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)
    .map((c) => ({
      crisisId: c.crisisId,
      title: c.title,
      severity: c.severity,
      recoveryProgress: c.recoveryProgress,
      recoveryStrategy: c.recommendedActions.join(" · "),
      status: c.currentStatus,
    }));
}

function buildExecutiveActions(crises: EnterpriseCrisis[]): ExecutiveCrisisAction[] {
  return crises
    .filter((c) => c.severity === "critical" || c.severity === "high")
    .slice(0, 8)
    .map((c, i) => ({
      order: i + 1,
      crisisId: c.crisisId,
      title: c.title,
      action: c.recommendedActions[0] ?? "Coordinate crisis response",
      authority: label(c.requiredAuthority),
      status: c.currentStatus,
    }));
}

function buildRecommendations(input: {
  crises: EnterpriseCrisis[];
  criticalCount: number;
}): CrisisDecisionRecommendation[] {
  const top = [...input.crises].sort((a, b) => b.riskScore - a.riskScore)[0];
  const active = input.crises.filter((c) => c.currentStatus === "active" || c.currentStatus === "coordinating");

  return [
    {
      id: "cde-rec-1",
      title: "Activate constitutional crisis pipeline for all critical situations",
      category: "crisis_framework",
      why: "Rapid response without constitutional compromise · business continuity under pressure",
      what: "Detect → Classify → Impact → Risk → Decide → Execute → Recover → Review",
      how: "E2-08 Crisis Decision Engine · Guardian protection · VIE validation",
      confidencePercent: 94,
    },
    {
      id: "cde-rec-2",
      title: top ? `Priority crisis: ${top.title}` : "Review active crisis register",
      category: "crisis_response",
      why: `${top?.severity ?? "high"} severity · risk score ${top?.riskScore ?? 0} · ${top?.confidence ?? 0}% confidence`,
      what: top?.recommendedActions[0] ?? "Coordinate crisis response",
      how: "ECC execution · Supervisor monitoring · Guardian protection",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "cde-rec-3",
      title: `${input.criticalCount} critical/high crises require executive coordination`,
      category: "executive_coordination",
      why: "Crisis decisions integrated with E2-07 approval authority",
      what: `${active.length} active crises · approval authority pre-determined`,
      how: "E2-07 Approval Intelligence · emergency approval pathway",
      confidencePercent: 90,
    },
    {
      id: "cde-rec-4",
      title: "Maintain Guardian production integrity during all crisis execution",
      category: "guardian_integration",
      why: "Production truth and constitutional integrity protected under pressure",
      what: "Guardian monitoring · production validation · runtime stability",
      how: "Guardian · Production Centre · controlled execution doctrine",
      confidencePercent: 92,
    },
    {
      id: "cde-rec-5",
      title: "Prepare E2-09 Executive Escalation Engine integration",
      category: "e2_roadmap",
      why: "Escalation engine extends crisis coordination for executive-level events",
      what: "Extend crisis engine with dedicated executive escalation pathways",
      how: "E2-09 mission · integrate with executive_escalations domain",
      confidencePercent: 86,
    },
  ];
}

function buildPillowEvaluations(input: {
  crises: EnterpriseCrisis[];
  recommendations: CrisisDecisionRecommendation[];
  healthScore: number;
}): PillowCrisisEvaluationMetric[] {
  const active = input.crises.filter((c) => c.currentStatus !== "resolved" && c.severity !== "monitoring");
  const values: Record<string, { status: string; summary: string }> = {
    crisis_severity: {
      status: input.crises.some((c) => c.severity === "critical") ? "elevated" : "managed",
      summary: `${input.crises.filter((c) => c.severity === "critical" || c.severity === "high").length} critical/high · continuous classification`,
    },
    response_options: { status: "evaluated", summary: `${active.length} active crises · response plans generated` },
    business_continuity: { status: "enforced", summary: "Constitutional governance maintained under pressure" },
    recovery_strategies: {
      status: "coordinating",
      summary: `Average recovery ${Math.round(input.crises.reduce((s, c) => s + c.recoveryProgress, 0) / Math.max(input.crises.length, 1))}%`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 4 ? "strong" : "building",
      summary: `${input.recommendations.length} crisis decision recommendations`,
    },
    strategic_risks: {
      status: "monitored",
      summary: `${input.crises.filter((c) => c.strategicImpact === "high" || c.strategicImpact === "critical").length} strategic-impact crises`,
    },
  };

  return PILLOW_CRISIS_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow crisis evaluation active",
  }));
}

export function assembleCrisisDecisionEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  conflictResolutionEngine?: ConflictResolutionEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown>;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): CrisisDecisionEngine {
  const activeCrises = buildCrises(input);
  const crisisResponsePlans = buildResponsePlans(activeCrises);
  const recoveryProgress = buildRecoveryProgress(activeCrises);
  const executiveActions = buildExecutiveActions(activeCrises);

  const criticalCount = activeCrises.filter((c) => c.severity === "critical" || c.severity === "high").length;
  const activeCount = activeCrises.filter((c) => c.currentStatus !== "resolved").length;

  const recommendedActions = buildRecommendations({ crises: activeCrises, criticalCount });

  const healthScore = Math.round(
    100 -
      criticalCount * 4 -
      activeCount * 2 +
      (input.corporateVision?.healthScore ?? 80) / 10 +
      (input.executiveApprovalIntelligence?.healthScore ?? 80) / 10,
  );
  const clampedHealth = Math.max(0, Math.min(100, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    crises: activeCrises,
    recommendations: recommendedActions,
    healthScore: clampedHealth,
  });

  const pillowAdvisory = [
    `Engine health: ${clampedHealth}/100 (${healthLabel(clampedHealth)})`,
    `${activeCrises.length} crises tracked · ${criticalCount} critical/high · rapid constitutional response`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `EmpireAI stable under pressure · no constitutional compromise`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting production")}`,
    `Ready for E2-09 Executive Escalation Engine`,
  ];

  return {
    engineVersion: "E2-08",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Crisis Decision Engine — constitutional executive system governing decision-making during emergencies and high-impact situations with rapid response, controlled execution, business continuity and post-crisis review",
    engineHealth: `${clampedHealth}/100 · ${healthLabel(clampedHealth)}`,
    crisisHealth: criticalCount >= 3 ? "elevated" : criticalCount >= 1 ? "attention" : "stable",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeCrisisCount: activeCrises.length,
    criticalCrisisCount: criticalCount,
    activeCrises,
    crisisResponsePlans,
    recoveryProgress,
    executiveActions,
    crisisPipeline: buildPipeline("recovery_coordination"),
    recommendedActions,
    pillowEvaluations,
    crisisPrinciples: [...CRISIS_PRINCIPLES],
    governedDomains: [...GOVERNED_CRISIS_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      executiveApprovalIntelligence: input.executiveApprovalIntelligence
        ? `E2-07 · ${input.executiveApprovalIntelligence.intelligenceHealth} · ${input.executiveApprovalIntelligence.grandKingApprovalCount} Grand King queue`
        : "E2-07 · standby",
      conflictResolutionEngine: input.conflictResolutionEngine
        ? `E2-06 · ${input.conflictResolutionEngine.engineHealth} · ${input.conflictResolutionEngine.escalationCount} escalations`
        : "E2-06 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "active · production protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring crises"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "crisis execution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE209: true,
  };
}

export function buildFallbackCrisisDecisionEngine(): CrisisDecisionEngine {
  return assembleCrisisDecisionEngine({});
}
