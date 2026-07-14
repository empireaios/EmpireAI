import type { ConflictResolutionEngine } from "../conflict-resolution-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { CrisisDecisionEngine } from "../crisis-decision-engine/types.js";
import type { ExecutiveApprovalIntelligence } from "../executive-approval-intelligence/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  ESCALATION_PIPELINE,
  ESCALATION_PRINCIPLES,
  GOVERNED_ESCALATION_DOMAINS,
  ESCALATION_RULE_DOMAINS,
  PILLOW_ESCALATION_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveEscalationEngine,
  EscalationPipelineStep,
  EscalationPipelinePhase,
  EnterpriseEscalation,
  EscalationQueueItem,
  AuthorityRoutingEntry,
  EscalationResolutionEntry,
  EscalationRuleMetric,
  ExecutiveEscalationRecommendation,
  PillowEscalationEvaluationMetric,
  GovernedEscalationDomain,
  EscalationClassification,
  EscalationLevel,
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

function mapDomain(category: EscalationClassification): GovernedEscalationDomain {
  const map: Record<EscalationClassification, GovernedEscalationDomain> = {
    strategic: "strategic_escalations",
    business: "business_escalations",
    financial: "financial_escalations",
    commerce: "commerce_escalations",
    engineering: "engineering_escalations",
    architecture: "architecture_escalations",
    operational: "operational_escalations",
    production: "production_escalations",
    security: "security_escalations",
    governance: "governance_escalations",
    executive: "executive_escalations",
  };
  return map[category];
}

function buildPipeline(activePhase: EscalationPipelinePhase = "authority_determination"): EscalationPipelineStep[] {
  const activeIdx = ESCALATION_PIPELINE.indexOf(activePhase);
  return ESCALATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildEscalations(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  crisisDecisionEngine?: CrisisDecisionEngine | null;
  conflictResolutionEngine?: ConflictResolutionEngine | null;
  guardian?: Record<string, unknown> | null;
}): EnterpriseEscalation[] {
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const approvalEscalations = input.executiveApprovalIntelligence?.escalations ?? [];
  const conflictEscalations = input.conflictResolutionEngine?.escalations ?? [];
  const criticalCrises =
    input.crisisDecisionEngine?.activeCrises.filter(
      (c) => c.severity === "critical" || c.severity === "high",
    ) ?? [];
  const guardianStatus = String(input.guardian?.status ?? input.guardian?.health ?? "monitoring");

  const catalogue: Array<{
    id: string;
    title: string;
    description: string;
    category: EscalationClassification;
    trigger: string;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    severity: string;
    priority: number;
    level: EscalationLevel;
    authority: string;
    action: string;
    confidence: number;
    evidence: string[];
    resolution: string;
    progress: number;
  }> = [
    {
      id: "eee-msa-financial",
      title: "MS-A Financial Exposure Escalation",
      description: "MS-A milestone delay risk exceeds executive delegation threshold — Grand King authority required",
      category: "financial",
      trigger: "Financial exposure threshold · ROI gate breach",
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "high",
      severity: "high",
      priority: 1,
      level: "grand_king",
      authority: "grand_king_approval",
      action: "Grand King financial decision · phased investment review",
      confidence: 88,
      evidence: [criticalRisks[0]?.title ?? "MS-A financial risk", "ROI tracking gate"],
      resolution: "pending_grand_king",
      progress: 20,
    },
    {
      id: "eee-engineering-capacity",
      title: "Engineering Capacity Conflict Escalation",
      description: "E2 programme and commerce execution competing for critical engineering bandwidth",
      category: "engineering",
      trigger: "Resource conflict · capacity threshold",
      business: "critical",
      financial: "high exposure",
      engineering: "critical",
      strategic: "aligned",
      severity: "high",
      priority: 2,
      level: "executive",
      authority: "pillow_executive_approval",
      action: "Rebalance engineering allocation · defer non-critical missions",
      confidence: 85,
      evidence: ["Engineering bottleneck", "85% utilization"],
      resolution: "routing",
      progress: 45,
    },
    {
      id: "eee-executive-bandwidth",
      title: "Executive Attention Bandwidth Escalation",
      description: "Pending decisions and escalations exceed Grand King review capacity",
      category: "executive",
      trigger: "Approval queue threshold · executive calendar saturation",
      business: "critical",
      financial: "decision velocity",
      engineering: "low",
      strategic: "aligned",
      severity: "high",
      priority: 1,
      level: "grand_king",
      authority: "grand_king_approval",
      action: "Top-3 priority review block · automatic low-risk approvals",
      confidence: 90,
      evidence: [`${approvalEscalations.length} approval escalations`, "Executive calendar"],
      resolution: "active",
      progress: 55,
    },
    {
      id: "eee-production-truth",
      title: "Production Truth Deviation Escalation",
      description: "Potential production-truth deviation detected — Guardian monitoring elevated",
      category: "production",
      trigger: "Guardian alert · production validation gate",
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      severity: "medium",
      priority: 3,
      level: "supervisor",
      authority: "supervisor_coordination",
      action: "Guardian alert review · production validation gate",
      confidence: 92,
      evidence: [guardianStatus, "Production mode active"],
      resolution: "monitoring",
      progress: 70,
    },
    {
      id: "eee-security-credential",
      title: "Executive Credential Security Escalation",
      description: "Grand King account and commerce credentials require elevated security monitoring",
      category: "security",
      trigger: "Security risk register · credential exposure watch",
      business: "critical",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      severity: "high",
      priority: 2,
      level: "executive",
      authority: "pillow_executive_approval",
      action: "Credential rotation review · access audit",
      confidence: 87,
      evidence: ["Security risk register", "Grand King account protection"],
      resolution: "contained",
      progress: 65,
    },
    {
      id: "eee-architecture-canonical",
      title: "Canonical Architecture Policy Escalation",
      description: "Architecture deviation risk requires constitutional alignment review",
      category: "architecture",
      trigger: "Constitutional impact · architecture policy gate",
      business: "high",
      financial: "low",
      engineering: "critical",
      strategic: "aligned",
      severity: "medium",
      priority: 4,
      level: "executive",
      authority: "pillow_executive_approval",
      action: "VIE architecture validation · canonical policy review",
      confidence: 91,
      evidence: ["Canonical architecture policy", "VIE validation"],
      resolution: "reviewing",
      progress: 40,
    },
    {
      id: "eee-commerce-disruption",
      title: "Commerce Pipeline Disruption Escalation",
      description: "Commerce execution delays threaten revenue milestones",
      category: "commerce",
      trigger: "Commerce KPI threshold · supplier delay",
      business: "critical",
      financial: "high",
      engineering: "moderate",
      strategic: "high",
      severity: "high",
      priority: 2,
      level: "executive",
      authority: "pillow_executive_approval",
      action: "Commerce acceleration plan · supplier contingency",
      confidence: 78,
      evidence: ["Commerce dashboard", "P8 milestone tracking"],
      resolution: "active",
      progress: 35,
    },
    {
      id: "eee-infrastructure-capacity",
      title: "Infrastructure Capacity Escalation",
      description: "Compute utilization approaching capacity limits during E2 programme execution",
      category: "operational",
      trigger: "Infrastructure monitor · 65% utilization threshold",
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      severity: "medium",
      priority: 5,
      level: "supervisor",
      authority: "supervisor_coordination",
      action: "ECC resource allocation · scaling review",
      confidence: 82,
      evidence: ["Infrastructure monitor", "65% compute utilization"],
      resolution: "monitoring",
      progress: 60,
    },
    {
      id: "eee-governance-constitutional",
      title: "Constitutional Governance Escalation",
      description: "Decision pathway requires constitutional hierarchy validation before executive action",
      category: "governance",
      trigger: "Constitutional impact · governance policy",
      business: "high",
      financial: "low",
      engineering: "low",
      strategic: "critical",
      severity: "medium",
      priority: 3,
      level: "executive",
      authority: "pillow_executive_approval",
      action: "Constitution hierarchy review · VIE alignment gate",
      confidence: 95,
      evidence: ["Constitution hierarchy", "VIE approval status"],
      resolution: "validated",
      progress: 85,
    },
    {
      id: "eee-strategic-roadmap",
      title: "Strategic Roadmap Alignment Escalation",
      description: "E2 programme sequencing conflicts with strategic objective priorities",
      category: "strategic",
      trigger: "Strategic importance · roadmap divergence",
      business: "high",
      financial: "moderate",
      engineering: "moderate",
      strategic: "critical",
      severity: "medium",
      priority: 4,
      level: "executive",
      authority: "pillow_executive_approval",
      action: "Strategic objective re-prioritization · roadmap sync",
      confidence: 80,
      evidence: ["Strategic objectives", "E2 roadmap alignment"],
      resolution: "coordinating",
      progress: 50,
    },
    {
      id: "eee-crisis-emergency",
      title: "Active Crisis Emergency Escalation",
      description: "Critical crisis requires immediate executive intervention pathway",
      category: "business",
      trigger: "Crisis severity threshold · E2-08 crisis detection",
      business: "critical",
      financial: "critical",
      engineering: "critical",
      strategic: "critical",
      severity: "critical",
      priority: 1,
      level: "emergency",
      authority: "grand_king_emergency",
      action: criticalCrises[0]?.recommendedActions[0] ?? "Activate crisis decision pipeline",
      confidence: 93,
      evidence: [criticalCrises[0]?.title ?? "Active crisis register", "E2-08 Crisis Engine"],
      resolution: "emergency_active",
      progress: 25,
    },
    {
      id: "eee-conflict-escalation",
      title: "Unresolved Conflict Escalation",
      description: "Enterprise conflict exceeds resolution authority — executive routing required",
      category: "business",
      trigger: "Conflict resolution timeout · escalation policy",
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      severity: "high",
      priority: 3,
      level: "executive",
      authority: "pillow_executive_approval",
      action: conflictEscalations[0]?.reason ?? "Executive conflict mediation",
      confidence: 84,
      evidence: [conflictEscalations[0]?.title ?? "Conflict register", "E2-06 Conflict Resolution"],
      resolution: "escalated",
      progress: 30,
    },
    {
      id: "eee-info-monitoring",
      title: "Routine Operational Monitoring",
      description: "Low-impact operational signals logged for supervisor awareness — no executive action required",
      category: "operational",
      trigger: "Informational threshold · continuous monitoring",
      business: "low",
      financial: "negligible",
      engineering: "low",
      strategic: "aligned",
      severity: "low",
      priority: 8,
      level: "informational",
      authority: "supervisor_monitoring",
      action: "Continue monitoring · log to knowledge base",
      confidence: 98,
      evidence: ["Supervisor monitoring", "Continuous health checks"],
      resolution: "informational",
      progress: 100,
    },
    {
      id: "eee-resolved-approval",
      title: "Resolved Approval Escalation",
      description: "Previously escalated approval resolved through constitutional pathway",
      category: "executive",
      trigger: "Approval resolution · knowledge integration",
      business: "moderate",
      financial: "resolved",
      engineering: "low",
      strategic: "aligned",
      severity: "low",
      priority: 10,
      level: "resolved",
      authority: "resolved",
      action: "Knowledge integration complete",
      confidence: 100,
      evidence: ["E2-07 Approval Intelligence", "Resolution logged"],
      resolution: "resolved",
      progress: 100,
    },
  ];

  return catalogue.map((e) => ({
    escalationId: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    domain: mapDomain(e.category),
    trigger: e.trigger,
    businessImpact: e.business,
    financialImpact: e.financial,
    engineeringImpact: e.engineering,
    strategicImpact: e.strategic,
    severity: e.severity,
    priority: e.priority,
    escalationLevel: e.level,
    requiredAuthority: e.authority,
    recommendedAction: e.action,
    confidence: e.confidence,
    evidence: e.evidence,
    resolutionStatus: e.resolution,
    resolutionProgress: e.progress,
  }));
}

function buildQueue(escalations: EnterpriseEscalation[]): EscalationQueueItem[] {
  return [...escalations]
    .filter((e) => e.escalationLevel !== "resolved" && e.escalationLevel !== "informational")
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 12)
    .map((e, i) => ({
      order: i + 1,
      escalationId: e.escalationId,
      title: e.title,
      escalationLevel: e.escalationLevel,
      priority: e.priority,
      requiredAuthority: label(e.requiredAuthority),
      status: e.resolutionStatus,
    }));
}

function buildAuthorityRouting(escalations: EnterpriseEscalation[]): AuthorityRoutingEntry[] {
  return escalations
    .filter((e) => e.escalationLevel !== "informational" && e.escalationLevel !== "resolved")
    .slice(0, 10)
    .map((e) => ({
      escalationId: e.escalationId,
      title: e.title,
      escalationLevel: e.escalationLevel,
      requiredAuthority: label(e.requiredAuthority),
      routingReason: `${label(e.escalationLevel)} · ${e.trigger}`,
      status: e.resolutionStatus,
    }));
}

function buildResolutionStatus(escalations: EnterpriseEscalation[]): EscalationResolutionEntry[] {
  return escalations
    .filter((e) => e.resolutionProgress < 100)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8)
    .map((e) => ({
      escalationId: e.escalationId,
      title: e.title,
      escalationLevel: e.escalationLevel,
      resolutionStatus: e.resolutionStatus,
      resolutionProgress: e.resolutionProgress,
      recommendedAction: e.recommendedAction,
    }));
}

function buildEscalationRules(): EscalationRuleMetric[] {
  return ESCALATION_RULE_DOMAINS.map((rule) => {
    const summaries: Record<string, string> = {
      business_impact: "Business impact threshold determines minimum escalation level",
      financial_exposure: "Financial exposure above delegation limit routes to Grand King",
      strategic_importance: "Strategic alignment gaps escalate to executive authority",
      operational_risk: "Operational risk within supervisor delegation stays at supervisor level",
      production_risk: "Production integrity events escalate through Guardian pathway",
      architecture_impact: "Architecture deviations require constitutional review",
      constitutional_impact: "Constitutional impact always escalates minimum to executive",
      executive_policy: "Executive policy gates prevent unnecessary Grand King escalation",
    };
    return {
      rule,
      label: label(rule),
      status: "active",
      summary: summaries[rule] ?? "Escalation rule active",
    };
  });
}

function buildPillowEvaluations(input: {
  grandKingCount: number;
  activeCount: number;
}): PillowEscalationEvaluationMetric[] {
  return PILLOW_ESCALATION_EVALUATIONS.map((domain) => {
    const metrics: Record<string, { status: string; summary: string }> = {
      escalation_events: {
        status: "monitoring",
        summary: `${input.activeCount} active escalations · event detection continuous`,
      },
      escalation_policies: {
        status: "enforced",
        summary: "Least necessary escalation · constitutional policy gates active",
      },
      authority_requirements: {
        status: "routing",
        summary: `${input.grandKingCount} Grand King escalations · authority pre-determined`,
      },
      strategic_risks: {
        status: "evaluating",
        summary: "Strategic risk integration with E2-02 Risk Assessment",
      },
      executive_recommendations: {
        status: "active",
        summary: "Executive recommendations aligned with escalation pipeline",
      },
    };
    const m = metrics[domain] ?? { status: "active", summary: "Pillow evaluation active" };
    return { domain, label: label(domain), status: m.status, summary: m.summary };
  });
}

function buildRecommendations(input: {
  escalations: EnterpriseEscalation[];
  grandKingCount: number;
}): ExecutiveEscalationRecommendation[] {
  const top = [...input.escalations]
    .filter((e) => e.escalationLevel !== "resolved" && e.escalationLevel !== "informational")
    .sort((a, b) => a.priority - b.priority)[0];

  return [
    {
      id: "eee-rec-1",
      title: "Apply least-necessary escalation — Grand King receives only constitutional matters",
      category: "escalation_framework",
      why: "Executive attention focused only where constitutionally required · no unnecessary escalation",
      what: "Detect → Impact → Risk → Authority → Classify → Recommend → Approve → Respond → Resolve",
      how: "E2-09 Executive Escalation Engine · E2-07 Approval Intelligence · VIE validation",
      confidencePercent: 95,
    },
    {
      id: "eee-rec-2",
      title: top ? `Priority escalation: ${top.title}` : "Review escalation queue",
      category: "authority_routing",
      why: `${label(top?.escalationLevel ?? "executive")} level · priority ${top?.priority ?? 1} · ${top?.confidence ?? 85}% confidence`,
      what: top?.recommendedAction ?? "Route to correct authority level",
      how: "ECC routing · Supervisor monitoring · Guardian protection",
      confidencePercent: top?.confidence ?? 88,
    },
    {
      id: "eee-rec-3",
      title: `${input.grandKingCount} matters require Grand King authority`,
      category: "grand_king_routing",
      why: "Grand King escalation minimization · only constitutional and emergency matters",
      what: "Pre-filter low-risk escalations · automatic supervisor and executive routing",
      how: "E2-07 Approval Intelligence · executive policy gates",
      confidencePercent: 92,
    },
    {
      id: "eee-rec-4",
      title: "Integrate crisis escalations with E2-08 Crisis Decision Engine",
      category: "crisis_integration",
      why: "Emergency escalations bridge crisis detection to executive authority",
      what: "Crisis severity → emergency escalation → Grand King emergency pathway",
      how: "E2-08 Crisis Engine · E2-09 Escalation Engine · constitutional governance",
      confidencePercent: 90,
    },
  ];
}

export function assembleExecutiveEscalationEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  crisisDecisionEngine?: CrisisDecisionEngine | null;
  conflictResolutionEngine?: ConflictResolutionEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveEscalationEngine {
  const activeEscalations = buildEscalations(input);
  const activeCount = activeEscalations.filter(
    (e) => e.escalationLevel !== "resolved" && e.escalationLevel !== "informational",
  ).length;
  const grandKingCount = activeEscalations.filter(
    (e) =>
      e.escalationLevel === "grand_king" ||
      e.escalationLevel === "emergency" ||
      e.escalationLevel === "critical",
  ).length;
  const supervisorCount = activeEscalations.filter((e) => e.escalationLevel === "supervisor").length;
  const resolvedCount = activeEscalations.filter((e) => e.escalationLevel === "resolved").length;

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.riskAssessmentEngine?.healthScore ?? 75,
    input.executiveApprovalIntelligence?.healthScore ?? 75,
    input.crisisDecisionEngine?.healthScore ?? 75,
    grandKingCount <= 3 ? 90 : grandKingCount <= 5 ? 80 : 70,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const escalationQueue = buildQueue(activeEscalations);
  const authorityRouting = buildAuthorityRouting(activeEscalations);
  const resolutionStatus = buildResolutionStatus(activeEscalations);
  const escalationRules = buildEscalationRules();
  const pillowEvaluations = buildPillowEvaluations({ grandKingCount, activeCount });
  const recommendedActions = buildRecommendations({ escalations: activeEscalations, grandKingCount });

  const pillowAdvisory = [
    "Least necessary escalation — Grand King receives only constitutional matters",
    `${grandKingCount} Grand King escalations · ${supervisorCount} supervisor-level · ${activeCount} active total`,
    "Authority routing integrated with E2-07 Approval Intelligence and E2-08 Crisis Engine",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting production")}`,
    "ECC coordinates escalation routing · Supervisor monitors escalation queue",
    "VIE validates escalation alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-09",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Escalation Engine governs enterprise escalation workflows — automatically determining when, why, to whom and with what urgency every escalation occurs. Grand King receives only matters requiring Grand King authority. Least necessary escalation preserves executive bandwidth while maintaining constitutional governance.",
    engineHealth: healthLabel(clampedHealth),
    escalationHealth: grandKingCount <= 3 ? "controlled" : grandKingCount <= 5 ? "elevated" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeEscalationCount: activeCount,
    grandKingEscalationCount: grandKingCount,
    supervisorEscalationCount: supervisorCount,
    resolvedEscalationCount: resolvedCount,
    activeEscalations,
    escalationQueue,
    authorityRouting,
    resolutionStatus,
    escalationPipeline: buildPipeline("authority_determination"),
    escalationRules,
    recommendedActions,
    pillowEvaluations,
    escalationPrinciples: [...ESCALATION_PRINCIPLES],
    governedDomains: [...GOVERNED_ESCALATION_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      executiveApprovalIntelligence: input.executiveApprovalIntelligence
        ? `E2-07 · ${input.executiveApprovalIntelligence.intelligenceHealth} · ${input.executiveApprovalIntelligence.escalationCount} approval escalations`
        : "E2-07 · standby",
      crisisDecisionEngine: input.crisisDecisionEngine
        ? `E2-08 · ${input.crisisDecisionEngine.engineHealth} · ${input.crisisDecisionEngine.activeCrisisCount} active crises`
        : "E2-08 · standby",
      conflictResolutionEngine: input.conflictResolutionEngine
        ? `E2-06 · ${input.conflictResolutionEngine.engineHealth} · ${input.conflictResolutionEngine.escalationCount} conflict escalations`
        : "E2-06 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "active · production protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring escalation queue"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "escalation routing coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE210: true,
  };
}

export function buildFallbackExecutiveEscalationEngine(): ExecutiveEscalationEngine {
  return assembleExecutiveEscalationEngine({});
}
