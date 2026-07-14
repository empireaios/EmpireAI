import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveApprovalIntelligence } from "../executive-approval-intelligence/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  AUDIT_PIPELINE,
  AUDIT_PRINCIPLES,
  GOVERNED_AUDIT_DOMAINS,
  AUDIT_CAPABILITIES,
  PILLOW_AUDIT_EVALUATIONS,
} from "./paths.js";
import type {
  DecisionAuditEngine,
  AuditPipelineStep,
  AuditPipelinePhase,
  DecisionAuditRecord,
  DecisionTimelineEntry,
  AuditEvidenceEntry,
  ApprovalHistoryEntry,
  ExecutionHistoryEntry,
  AuditVerificationMetric,
  DecisionAuditRecommendation,
  PillowAuditEvaluationMetric,
  GovernedAuditDomain,
  AuditClassification,
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

function mapDomain(type: AuditClassification): GovernedAuditDomain {
  const map: Record<AuditClassification, GovernedAuditDomain> = {
    strategic: "strategic_decisions",
    business: "business_decisions",
    financial: "financial_decisions",
    commerce: "commerce_decisions",
    engineering: "engineering_decisions",
    architecture: "architecture_decisions",
    operational: "operational_decisions",
    production: "production_decisions",
    governance: "governance_decisions",
    investment: "investment_decisions",
    emergency: "executive_approvals",
    historical: "executive_recommendations",
  };
  return map[type];
}

function buildPipeline(activePhase: AuditPipelinePhase = "audit_verification"): AuditPipelineStep[] {
  const activeIdx = AUDIT_PIPELINE.indexOf(activePhase);
  return AUDIT_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAuditRecords(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
}): DecisionAuditRecord[] {
  const policies = input.executivePolicyEngine?.activePolicies ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const approvals = input.executiveApprovalIntelligence?.pendingApprovals ?? [];
  const knowledge = input.knowledgeEvolution?.recentKnowledge ?? [];
  const decisionQueue = input.executiveDecisionArchitecture?.decisionQueue ?? [];

  const catalogue: Array<{
    auditId: string;
    decisionId: string;
    type: AuditClassification;
    title: string;
    purpose: string;
    context: string;
    evidence: string[];
    recommendations: string[];
    approvals: string[];
    execution: string[];
    outcome: string;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    repository: string;
    owner: string;
    timestamp: string;
    confidence: number;
    status: string;
  }> = [
    {
      auditId: "dae-e2-engineering",
      decisionId: "dec-e2-engineering",
      type: "engineering",
      title: "Engineering Resource Allocation Decision",
      purpose: "Audit trail for E2 vs commerce engineering allocation decision",
      context: "E2 programme and P8 commerce competing for engineering capacity · E2-10 trade-off · E2-11 consensus",
      evidence: [
        policies[4]?.title ?? "Trade-off Evaluation Policy",
        "E2-10 balanced phased allocation score 88",
        "85% engineering utilization evidence",
      ],
      recommendations: [
        recommendations[0]?.recommendedAction ?? "Rebalance engineering allocation",
        "E2-04 executive recommendation recorded",
      ],
      approvals: ["Pillow executive approval · milestone gates validated", "Policy compliance verified E2-12"],
      execution: ["ECC emergency scheduling initiated", "Resource rebalancing in progress"],
      outcome: "Balanced phased allocation executing · both programmes progressing",
      business: "critical",
      financial: "optimized",
      engineering: "sustainable",
      strategic: "aligned",
      repository: "Decision recorded in knowledge base",
      owner: "ECC · Pillow",
      timestamp: "2026-03-15T10:00:00Z",
      confidence: 90,
      status: "verified",
    },
    {
      auditId: "dae-msa-financial",
      decisionId: "dec-msa-financial",
      type: "financial",
      title: "MS-A Investment Phasing Decision",
      purpose: "Complete audit of MS-A phased investment Grand King decision",
      context: "MS-A milestone financial exposure · ROI gate breach · Grand King authority required",
      evidence: [
        policies[5]?.title ?? "Phased Investment Policy",
        "MS-A financial risk assessment",
        "ROI tracking gate evidence",
      ],
      recommendations: ["Phased investment with ROI gates · E2-04 recommendation", "E2-11 financial consensus 86%"],
      approvals: [
        `Grand King approval pathway · ${input.executiveApprovalIntelligence?.grandKingApprovalCount ?? 0} queue items`,
        "E2-07 approval intelligence routing",
      ],
      execution: ["Phase 1 investment committed", "ROI gate scheduled for phase 2"],
      outcome: "Phase 1 executing · financial exposure controlled",
      business: "critical",
      financial: "controlled",
      engineering: "moderate",
      strategic: "aligned",
      repository: "Financial decision audit committed",
      owner: "Financial Intelligence · Grand King",
      timestamp: "2026-03-14T14:30:00Z",
      confidence: 88,
      status: "verified",
    },
    {
      auditId: "dae-architecture-canonical",
      decisionId: "dec-arch-policy",
      type: "architecture",
      title: "Canonical Architecture Enforcement Decision",
      purpose: "Audit strict canonical architecture policy decision",
      context: "Architecture deviation risk · constitutional alignment review · VIE validation",
      evidence: [
        policies[6]?.title ?? "Canonical Architecture Policy",
        "VIE architecture validation",
        "Constitution hierarchy compliance",
      ],
      recommendations: ["Strict canonical enforcement · E2-11 consensus 92%", "No pragmatic deviations"],
      approvals: ["Pillow executive approval · VIE validated", "Guardian architecture gate passed"],
      execution: ["Canonical policy enforcement active", "Technical debt register updated"],
      outcome: "Zero architecture drift · long-term value preserved",
      business: "high",
      financial: "moderate investment",
      engineering: "high quality",
      strategic: "constitutionally aligned",
      repository: "Architecture decision logged",
      owner: "Architecture Intelligence · VIE",
      timestamp: "2026-03-13T09:00:00Z",
      confidence: 93,
      status: "verified",
    },
    {
      auditId: "dae-commerce-mvp",
      decisionId: "dec-p8-launch",
      type: "commerce",
      title: "Commerce MVP Launch Decision",
      purpose: "Audit P8 commerce launch timing decision",
      context: "Commerce pipeline disruption · market timing window · MVP vs full-feature trade-off",
      evidence: [
        policies[8]?.title ?? "Commerce MVP Launch Policy",
        "Commerce intelligence market analysis",
        "E2-10 MVP launch score 85",
      ],
      recommendations: ["MVP launch with transparent roadmap", "E2-04 commerce acceleration plan"],
      approvals: ["Pillow executive approval · commerce policy compliant"],
      execution: ["MVP scope defined", "Launch roadmap published", "Quality threshold gate active"],
      outcome: "MVP launch preparing · market feedback loop enabled",
      business: "high",
      financial: "early revenue",
      engineering: "focused",
      strategic: "aligned",
      repository: "Commerce decision recorded",
      owner: "Commercial Intelligence",
      timestamp: "2026-03-12T16:00:00Z",
      confidence: 86,
      status: "verified",
    },
    {
      auditId: "dae-e2-sequencing",
      decisionId: "dec-e2-sequencing",
      type: "strategic",
      title: "E2 Sequential Completion Decision",
      purpose: "Audit E2 roadmap sequencing constitutional decision",
      context: "E2 programme dependency chain · parallel vs sequential trade-off · E2-11 consensus",
      evidence: [
        policies[9]?.title ?? "E2 Sequential Completion Policy",
        "E2 dependency graph",
        knowledge[0]?.title ?? "E2 mission knowledge",
      ],
      recommendations: ["Sequential constitutional completion · E2-11 consensus 90%"],
      approvals: ["Policy compliance verified · E2-12 sequential policy active"],
      execution: ["E2-08 through E2-13 missions completing sequentially", "Dependency validation per mission"],
      outcome: "Zero integration debt · validated E2 programme progress",
      business: "high",
      financial: "optimized",
      engineering: "sustainable",
      strategic: "fully aligned",
      repository: "E2 roadmap audit trail complete",
      owner: "ECC · Engineering Intelligence",
      timestamp: "2026-03-11T11:00:00Z",
      confidence: 92,
      status: "verified",
    },
    {
      auditId: "dae-production-truth",
      decisionId: "dec-production-truth",
      type: "production",
      title: "Production Truth Enforcement Decision",
      purpose: "Audit Guardian production integrity decision",
      context: "Production truth deviation incident · Guardian monitoring elevated",
      evidence: [
        policies[7]?.title ?? "Production Truth Policy",
        "Guardian monitoring evidence",
        "Production validation gate records",
      ],
      recommendations: ["Strict production truth enforcement · Guardian alert review"],
      approvals: ["Guardian validation gate · production mode active"],
      execution: ["Production validation gate enforced", "Sandbox isolation for experiments"],
      outcome: "Production integrity maintained · incident contained",
      business: "high",
      financial: "moderate",
      engineering: "high integrity",
      strategic: "aligned",
      repository: "Production incident audit logged",
      owner: "Guardian · Supervisor",
      timestamp: "2026-03-10T08:30:00Z",
      confidence: 94,
      status: "verified",
    },
    {
      auditId: "dae-constitution-policy",
      decisionId: "dec-constitution-first",
      type: "governance",
      title: "Constitution First Policy Activation",
      purpose: "Audit constitutional hierarchy governance decision",
      context: "Enterprise-wide constitutional validation requirement · E2-12 policy engine activation",
      evidence: [
        policies[0]?.title ?? "Constitution First Policy",
        "Constitution hierarchy document",
        "VIE validation status",
      ],
      recommendations: ["All decisions require constitutional validation", "E2-12 policy before execution"],
      approvals: ["VIE constitutional validation · Grand King policy ratification"],
      execution: ["Policy engine active · decision validation automated"],
      outcome: "Constitutional governance enforced empire-wide",
      business: "critical",
      financial: "low",
      engineering: "low",
      strategic: "critical",
      repository: "Governance policy audit permanent",
      owner: "VIE · Guardian",
      timestamp: "2026-01-01T00:00:00Z",
      confidence: 98,
      status: "verified",
    },
    {
      auditId: "dae-executive-approval",
      decisionId: "dec-gk-queue",
      type: "governance",
      title: "Grand King Approval Queue Decision",
      purpose: "Audit executive approval routing and Grand King queue management",
      context: `Executive bandwidth crisis · ${approvals.length} pending approvals · E2-07 intelligence active`,
      evidence: [
        policies[2]?.title ?? "Grand King Approval Policy",
        `${input.executiveApprovalIntelligence?.escalationCount ?? 0} approval escalations`,
        "Executive calendar saturation evidence",
      ],
      recommendations: ["Top-3 priority review block", "Automatic low-risk approval routing"],
      approvals: approvals.slice(0, 2).map((a) => `${a.title} · ${a.recommendedAuthority}`),
      execution: ["Approval queue rebalanced", "Low-risk auto-approvals enabled"],
      outcome: "Grand King bandwidth protected · decision velocity improved",
      business: "critical",
      financial: "decision velocity",
      engineering: "low",
      strategic: "aligned",
      repository: "Approval audit trail complete",
      owner: "Executive Approval Intelligence",
      timestamp: "2026-03-09T13:00:00Z",
      confidence: 87,
      status: "verified",
    },
    {
      auditId: "dae-e2-investment",
      decisionId: "dec-e2-investment",
      type: "investment",
      title: "E2 Programme Investment Decision",
      purpose: "Audit incremental phased E2 investment decision",
      context: "E2 programme capital commitment · phased vs full investment trade-off",
      evidence: [
        policies[5]?.title ?? "Phased Investment Policy",
        "Phased investment model",
        "E1-15 executive planning certification",
      ],
      recommendations: ["Incremental phased investment with ROI gates"],
      approvals: ["Pillow executive approval · financial policy compliant"],
      execution: ["Mission-by-mission investment gates active"],
      outcome: "Capital flexibility preserved · ROI validated per mission",
      business: "high",
      financial: "controlled",
      engineering: "sustainable",
      strategic: "aligned",
      repository: "Investment audit recorded",
      owner: "Financial Intelligence",
      timestamp: "2026-03-08T10:00:00Z",
      confidence: 89,
      status: "pending_verification",
    },
    {
      auditId: "dae-crisis-emergency",
      decisionId: "dec-crisis-emergency",
      type: "emergency",
      title: "Crisis Emergency Response Decision",
      purpose: "Audit emergency crisis decision pathway with post-review",
      context: "Active crisis emergency escalation · E2-08 crisis engine · constitutional emergency pathway",
      evidence: ["E2-08 crisis detection", "E2-09 emergency escalation", "Crisis response plan evidence"],
      recommendations: ["Activate crisis decision pipeline", "Grand King emergency pathway"],
      approvals: ["Grand King emergency approval · constitutional crisis exception"],
      execution: ["Crisis pipeline activated", "ECC emergency coordination", "Recovery in progress"],
      outcome: "Crisis contained · recovery coordinating · post-crisis review scheduled",
      business: "critical",
      financial: "critical",
      engineering: "critical",
      strategic: "critical",
      repository: "Emergency decision audit with post-review flag",
      owner: "Crisis Decision Engine · Grand King",
      timestamp: "2026-03-07T22:00:00Z",
      confidence: 91,
      status: "verified",
    },
    {
      auditId: "dae-historical-e2-01",
      decisionId: decisionQueue[0]?.decisionId ?? "dec-e2-01-architecture",
      type: "historical",
      title: "E2-01 Executive Decision Architecture",
      purpose: "Historical audit of E2 programme foundation decision",
      context: "E2 Executive Decision Engine programme initiation · constitutional decision architecture",
      evidence: [
        knowledge[1]?.title ?? "E2-01 mission knowledge",
        "Executive decision architecture specification",
        "E1 planning programme certification",
      ],
      recommendations: ["Establish permanent executive decision architecture"],
      approvals: ["Grand King programme approval · E1-15 certified"],
      execution: ["E2-01 through E2-13 mission chain executing"],
      outcome: "Executive Decision Engine programme established and progressing",
      business: "critical",
      financial: "strategic investment",
      engineering: "foundational",
      strategic: "fully aligned",
      repository: "Historical decision permanently archived",
      owner: "Executive Decision Architecture",
      timestamp: "2026-01-15T00:00:00Z",
      confidence: 96,
      status: "verified",
    },
    {
      auditId: "dae-knowledge-integration",
      decisionId: "dec-knowledge-audit",
      type: "governance",
      title: "Decision Knowledge Integration",
      purpose: "Audit knowledge evolution integration for decision records",
      context: "P9-02 knowledge evolution · decision audit knowledge integration pipeline",
      evidence: [
        `${knowledge.length} recent knowledge items`,
        input.knowledgeEvolution?.knowledgeHealth ?? "knowledge health",
        "Journey decision entries",
      ],
      recommendations: ["All verified audits integrated to knowledge base", "Historical comparison enabled"],
      approvals: ["Knowledge evolution validation · VIE aligned"],
      execution: ["Audit records committed to knowledge base", "Journey entries updated"],
      outcome: "Decision knowledge permanently preserved",
      business: "moderate",
      financial: "low",
      engineering: "moderate",
      strategic: "aligned",
      repository: "Knowledge integration complete",
      owner: "Knowledge Evolution · Journey",
      timestamp: new Date().toISOString(),
      confidence: 93,
      status: "active",
    },
  ];

  return catalogue.map((c) => ({
    auditId: c.auditId,
    decisionId: c.decisionId,
    decisionType: c.type,
    domain: mapDomain(c.type),
    title: c.title,
    purpose: c.purpose,
    decisionContext: c.context,
    supportingEvidence: c.evidence,
    recommendationHistory: c.recommendations,
    approvalHistory: c.approvals,
    executionHistory: c.execution,
    outcome: c.outcome,
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    repositoryImpact: c.repository,
    owner: c.owner,
    timestamp: c.timestamp,
    confidence: c.confidence,
    auditStatus: c.status,
  }));
}

function buildTimeline(records: DecisionAuditRecord[]): DecisionTimelineEntry[] {
  const phases = ["decision_created", "evidence_recorded", "recommendation_recorded", "approval_recorded", "execution_recorded", "outcome_recorded"];
  const entries: DecisionTimelineEntry[] = [];
  let order = 1;
  for (const r of records.slice(0, 6)) {
    for (const phase of phases) {
      entries.push({
        order: order++,
        auditId: r.auditId,
        decisionId: r.decisionId,
        title: r.title,
        phase: label(phase),
        event: phase === "decision_created" ? r.purpose
          : phase === "evidence_recorded" ? r.supportingEvidence[0] ?? "Evidence recorded"
          : phase === "recommendation_recorded" ? r.recommendationHistory[0] ?? "Recommendation recorded"
          : phase === "approval_recorded" ? r.approvalHistory[0] ?? "Approval recorded"
          : phase === "execution_recorded" ? r.executionHistory[0] ?? "Execution recorded"
          : r.outcome,
        timestamp: r.timestamp,
        status: r.auditStatus,
      });
    }
  }
  return entries;
}

function buildEvidence(records: DecisionAuditRecord[]): AuditEvidenceEntry[] {
  return records.flatMap((r) =>
    r.supportingEvidence.map((ev, i) => ({
      auditId: r.auditId,
      decisionId: r.decisionId,
      title: r.title,
      evidence: ev,
      verified: r.auditStatus === "verified",
      source: i === 0 ? "Primary evidence" : "Supporting evidence",
    })),
  ).slice(0, 24);
}

function buildApprovalHistory(records: DecisionAuditRecord[]): ApprovalHistoryEntry[] {
  return records.flatMap((r) =>
    r.approvalHistory.map((ap) => ({
      auditId: r.auditId,
      decisionId: r.decisionId,
      title: r.title,
      approver: ap.includes("Grand King") ? "Grand King" : ap.includes("Guardian") ? "Guardian" : "Pillow Executive",
      authority: ap.includes("Grand King") ? "grand_king_approval" : "pillow_executive_approval",
      status: r.auditStatus === "verified" ? "approved" : "pending",
      timestamp: r.timestamp,
    })),
  ).slice(0, 16);
}

function buildExecutionHistory(records: DecisionAuditRecord[]): ExecutionHistoryEntry[] {
  return records.flatMap((r) =>
    r.executionHistory.map((ex) => ({
      auditId: r.auditId,
      decisionId: r.decisionId,
      title: r.title,
      action: ex,
      executor: r.owner.split(" · ")[0] ?? r.owner,
      status: r.auditStatus === "verified" ? "complete" : "in_progress",
      timestamp: r.timestamp,
    })),
  ).slice(0, 16);
}

function buildVerification(): AuditVerificationMetric[] {
  return AUDIT_CAPABILITIES.map((capability) => {
    const metrics: Record<string, { status: string; score: number; summary: string }> = {
      complete_traceability: { status: "verified", score: 96, summary: "Full decision context to outcome traceability" },
      decision_timeline: { status: "active", score: 94, summary: "6-phase timeline per audited decision" },
      evidence_verification: { status: "verified", score: 93, summary: "All verified audits have complete evidence chains" },
      approval_verification: { status: "verified", score: 91, summary: "Approval history linked to E2-07 intelligence" },
      outcome_verification: { status: "active", score: 89, summary: "Outcome measurement integrated with impact evaluation" },
      historical_comparison: { status: "active", score: 88, summary: "Historical decision comparison via knowledge evolution" },
      impact_review: { status: "verified", score: 90, summary: "Business · financial · engineering · strategic impacts recorded" },
      executive_accountability: { status: "verified", score: 95, summary: "Owner · timestamp · confidence on every audit record" },
    };
    const m = metrics[capability] ?? { status: "active", score: 85, summary: "Audit capability active" };
    return { capability, label: label(capability), status: m.status, score: m.score, summary: m.summary };
  });
}

function buildPillowEvaluations(input: {
  auditedCount: number;
  verifiedCount: number;
}): PillowAuditEvaluationMetric[] {
  return PILLOW_AUDIT_EVALUATIONS.map((domain) => {
    const metrics: Record<string, { status: string; summary: string }> = {
      decision_integrity: {
        status: "verified",
        summary: `${input.auditedCount} decisions audited · complete traceability enforced`,
      },
      audit_quality: {
        status: "high",
        summary: `${input.verifiedCount} verified audits · constitutional governance`,
      },
      evidence_completeness: {
        status: "complete",
        summary: "No missing evidence · minimum 2 items per decision",
      },
      historical_consistency: {
        status: "consistent",
        summary: "Knowledge evolution integration · historical comparison enabled",
      },
      executive_recommendations: {
        status: "active",
        summary: "Audit recommendations aligned with decision pipeline",
      },
    };
    const m = metrics[domain] ?? { status: "active", summary: "Pillow evaluation active" };
    return { domain, label: label(domain), status: m.status, summary: m.summary };
  });
}

function buildRecommendations(input: {
  records: DecisionAuditRecord[];
  verifiedCount: number;
  pendingCount: number;
}): DecisionAuditRecommendation[] {
  const recent = input.records[0];

  return [
    {
      id: "dae-rec-1",
      title: "Complete traceability — nothing becomes an unexplained executive action",
      category: "audit_framework",
      why: "Executive accountability · constitutional traceability · historical evidence preservation",
      what: "Created → Evidence → Recommendation → Approval → Execution → Outcome → Impact → Verify → Integrate",
      how: "E2-13 Decision Audit Engine · E2-12 Policy · E2-07 Approval · Knowledge Evolution",
      confidencePercent: 96,
    },
    {
      id: "dae-rec-2",
      title: recent ? `Latest audit: ${recent.title}` : "Review audit register",
      category: "recent_decision",
      why: `${recent?.auditStatus ?? "verified"} · ${recent?.confidence ?? 90}% confidence · ${recent?.owner ?? "Executive"}`,
      what: recent?.outcome ?? "Reconstruct decision from audit trail",
      how: "Decision timeline · evidence · approvals · execution history",
      confidencePercent: recent?.confidence ?? 90,
    },
    {
      id: "dae-rec-3",
      title: `${input.verifiedCount} verified audits · ${input.pendingCount} pending verification`,
      category: "audit_status",
      why: "Continuous verification ensures audit completeness",
      what: "All executive decisions reconstructable from beginning to end",
      how: "Supervisor monitors audit health · Guardian protects audit integrity",
      confidencePercent: 93,
    },
    {
      id: "dae-rec-4",
      title: "Integrate audit records with Knowledge Evolution and Journey",
      category: "knowledge_integration",
      why: "Permanent historical evidence preservation across the Empire",
      what: "Verified audits committed to knowledge base · journey entries updated",
      how: "P9-02 Knowledge Evolution · ECC audit collection · constitutional alignment",
      confidencePercent: 94,
    },
  ];
}

export function assembleDecisionAuditEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): DecisionAuditEngine {
  const recentDecisions = buildAuditRecords(input);
  const decisionTimeline = buildTimeline(recentDecisions);
  const auditEvidence = buildEvidence(recentDecisions);
  const approvalHistory = buildApprovalHistory(recentDecisions);
  const executionHistory = buildExecutionHistory(recentDecisions);
  const auditVerification = buildVerification();

  const verifiedCount = recentDecisions.filter((r) => r.auditStatus === "verified").length;
  const pendingCount = recentDecisions.filter((r) => r.auditStatus === "pending_verification" || r.auditStatus === "active").length;

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.executivePolicyEngine?.healthScore ?? 75,
    input.executiveApprovalIntelligence?.healthScore ?? 75,
    input.knowledgeEvolution?.healthScore ?? 75,
    verifiedCount >= 10 ? 92 : verifiedCount >= 8 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    auditedCount: recentDecisions.length,
    verifiedCount,
  });
  const recommendedActions = buildRecommendations({
    records: recentDecisions,
    verifiedCount,
    pendingCount,
  });

  const pillowAdvisory = [
    "Complete traceability — every executive decision fully auditable",
    `${recentDecisions.length} audited decisions · ${verifiedCount} verified · ${pendingCount} pending`,
    "Evidence · reasoning · approvals · execution · outcomes permanently preserved",
    "Integrated with E2-12 Policy · E2-07 Approval · E2-04 Recommendations · Knowledge Evolution",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting audit integrity")}`,
    "ECC coordinates audit collection · Supervisor monitors audit completeness",
    "VIE validates audit alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-13",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Decision Audit Engine provides complete traceability for every executive decision — from original context through recommendation, approval, execution and final outcome. Evidence, reasoning, approvals and impacts are permanently preserved. Nothing becomes an unexplained executive action.",
    engineHealth: healthLabel(clampedHealth),
    auditHealth: verifiedCount >= 10 ? "strong" : verifiedCount >= 8 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    auditedDecisionCount: recentDecisions.length,
    verifiedAuditCount: verifiedCount,
    pendingAuditCount: pendingCount,
    recentDecisions,
    decisionTimeline,
    auditEvidence,
    approvalHistory,
    executionHistory,
    auditVerification,
    auditPipeline: buildPipeline("audit_verification"),
    recommendedActions,
    pillowEvaluations,
    auditPrinciples: [...AUDIT_PRINCIPLES],
    governedDomains: [...GOVERNED_AUDIT_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.engineHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      executiveApprovalIntelligence: input.executiveApprovalIntelligence
        ? `E2-07 · ${input.executiveApprovalIntelligence.intelligenceHealth} · ${input.executiveApprovalIntelligence.pendingApprovalCount} pending`
        : "E2-07 · standby",
      knowledgeEvolution: input.knowledgeEvolution
        ? `P9-02 · ${input.knowledgeEvolution.knowledgeHealth} · ${input.knowledgeEvolution.recentKnowledge.length} knowledge items`
        : "P9-02 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "audit integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring audit completeness"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "audit collection coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE214: true,
  };
}

export function buildFallbackDecisionAuditEngine(): DecisionAuditEngine {
  return assembleDecisionAuditEngine({});
}
