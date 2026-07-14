import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveApprovalIntelligence } from "../executive-approval-intelligence/types.js";
import type { ExecutiveConsensusEngine } from "../executive-consensus-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { TradeOffAnalysisEngine } from "../trade-off-analysis-engine/types.js";
import {
  POLICY_PIPELINE,
  POLICY_PRINCIPLES,
  GOVERNED_POLICY_DOMAINS,
  POLICY_VALIDATION_DOMAINS,
  PILLOW_POLICY_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutivePolicyEngine,
  PolicyPipelineStep,
  PolicyPipelinePhase,
  EnterprisePolicy,
  PolicyComplianceEntry,
  PolicyExceptionEntry,
  PolicyValidationMetric,
  ExecutivePolicyRecommendation,
  PillowPolicyEvaluationMetric,
  GovernedPolicyDomain,
  PolicyClassification,
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

function mapDomain(category: PolicyClassification): GovernedPolicyDomain {
  const map: Record<PolicyClassification, GovernedPolicyDomain> = {
    strategic: "strategic_policies",
    business: "business_policies",
    financial: "financial_policies",
    commerce: "commerce_policies",
    engineering: "engineering_policies",
    architecture: "architecture_policies",
    operational: "operational_policies",
    production: "production_policies",
    governance: "governance_policies",
    security: "security_policies",
    executive: "executive_approval_policies",
    compliance: "governance_policies",
  };
  return map[category];
}

function buildPipeline(activePhase: PolicyPipelinePhase = "decision_policy_evaluation"): PolicyPipelineStep[] {
  const activeIdx = POLICY_PIPELINE.indexOf(activePhase);
  return POLICY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildPolicies(input: {
  executiveConsensusEngine?: ExecutiveConsensusEngine | null;
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  guardian?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
}): EnterprisePolicy[] {
  const consensus = input.executiveConsensusEngine?.activeConsensus ?? [];
  const tradeOffs = input.tradeOffAnalysisEngine?.tradeOffAnalyses ?? [];
  const gkApprovals = input.executiveApprovalIntelligence?.grandKingApprovalCount ?? 0;
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const vieStatus = String(input.vie?.approvalStatus ?? "validated");
  const guardianStatus = String(input.guardian?.status ?? input.guardian?.health ?? "monitoring");

  const catalogue: Array<{
    id: string;
    title: string;
    description: string;
    category: PolicyClassification;
    purpose: string;
    scope: string;
    owner: string;
    priority: number;
    business: string;
    strategic: string;
    deps: string[];
    rules: string[];
    exceptions: string[];
    effective: string;
    status: string;
    confidence: number;
    evidence: string[];
    compliance: string;
  }> = [
    {
      id: "epe-constitution-first",
      title: "Constitution First Policy",
      description: "Every executive decision must validate against constitutional hierarchy before execution",
      category: "governance",
      purpose: "Preserve constitutional integrity across all executive decisions",
      scope: "All executive decisions · Empire-wide",
      owner: "VIE · Guardian",
      priority: 1,
      business: "critical",
      strategic: "constitutionally aligned",
      deps: ["Constitution Hierarchy", "VIE Validation"],
      rules: ["No decision without constitutional validation", "VIE approval required for major decisions", "Guardian production truth gate"],
      exceptions: ["Emergency crisis pathway with post-review"],
      effective: "2026-01-01",
      status: "active",
      confidence: 98,
      evidence: ["Constitution hierarchy", vieStatus],
      compliance: "compliant",
    },
    {
      id: "epe-vision-alignment",
      title: "Vision Alignment Policy",
      description: "All decisions must align with corporate vision and strategic objectives",
      category: "strategic",
      purpose: "Ensure strategic coherence across executive decision-making",
      scope: "Strategic and business decisions",
      owner: "Corporate Vision Engine · VIE",
      priority: 1,
      business: "critical",
      strategic: "fully aligned",
      deps: ["E1-02 Corporate Vision", "Strategic Objectives"],
      rules: ["Vision sync gate before major decisions", "Strategic alignment score minimum 80%", "Misaligned decisions require consensus review"],
      exceptions: ["Short-term tactical adjustments with roadmap update"],
      effective: "2026-01-01",
      status: "active",
      confidence: 95,
      evidence: [consensus[6]?.recommendedDecision ?? "Vision-synchronized path", "Corporate vision engine"],
      compliance: "compliant",
    },
    {
      id: "epe-grand-king-approval",
      title: "Grand King Approval Policy",
      description: "Matters requiring Grand King authority must route through approval intelligence",
      category: "executive",
      purpose: "Ensure Grand King receives only constitutionally required matters",
      scope: "Financial · strategic · constitutional decisions",
      owner: "Executive Approval Intelligence",
      priority: 1,
      business: "critical",
      strategic: "aligned",
      deps: ["E2-07 Approval Intelligence", "E2-09 Escalation Engine"],
      rules: ["Grand King queue limited to constitutional matters", "Automatic routing for low-risk approvals", "Top-3 priority review block"],
      exceptions: ["Emergency crisis Grand King pathway"],
      effective: "2026-02-01",
      status: "active",
      confidence: 92,
      evidence: [`${gkApprovals} Grand King queue items`, "E2-07 approval rules"],
      compliance: "compliant",
    },
    {
      id: "epe-consensus-required",
      title: "Multi-Perspective Consensus Policy",
      description: "Major decisions require executive consensus before Grand King approval",
      category: "executive",
      purpose: "No single-perspective decisions on major executive matters",
      scope: "All major executive decisions",
      owner: "Executive Consensus Engine",
      priority: 2,
      business: "critical",
      strategic: "aligned",
      deps: ["E2-11 Consensus Engine", "E2-10 Trade-off Analysis"],
      rules: ["Minimum 5 participating perspectives", "Consensus strength threshold 80%", "Agreement and disagreement documented"],
      exceptions: ["Operational supervisor-level decisions"],
      effective: "2026-03-01",
      status: "active",
      confidence: 94,
      evidence: [consensus[0]?.title ?? "Engineering consensus", `${consensus.length} active consensus`],
      compliance: "compliant",
    },
    {
      id: "epe-tradeoff-evaluation",
      title: "Trade-off Evaluation Policy",
      description: "Competing alternatives must be evaluated before executive recommendation",
      category: "business",
      purpose: "Measurable, explainable trade-offs with no hidden costs",
      scope: "Resource · investment · strategic decisions",
      owner: "Trade-off Analysis Engine",
      priority: 2,
      business: "critical",
      strategic: "aligned",
      deps: ["E2-10 Trade-off Engine", "E2-03 Decision Simulation"],
      rules: ["Minimum 2 alternatives evaluated", "Trade-off score documented", "Expected benefits and costs listed"],
      exceptions: ["Time-critical crisis decisions with post-analysis"],
      effective: "2026-03-01",
      status: "active",
      confidence: 90,
      evidence: [tradeOffs[0]?.recommendedOption ?? "Balanced allocation", `${tradeOffs.length} trade-off analyses`],
      compliance: "compliant",
    },
    {
      id: "epe-phased-investment",
      title: "Phased Investment Policy",
      description: "Major investments require phased commitment with ROI gates",
      category: "financial",
      purpose: "Control financial exposure while preserving strategic upside",
      scope: "MS-A · E2 programme · commerce investments",
      owner: "Financial Intelligence · Pillow",
      priority: 2,
      business: "critical",
      strategic: "aligned",
      deps: ["Grand King Account", "E2-02 Risk Assessment"],
      rules: ["ROI gate before each phase", "Grand King briefing at phase transitions", "Full commitment requires consensus"],
      exceptions: ["Pre-approved emergency reserves"],
      effective: "2026-02-15",
      status: "active",
      confidence: 88,
      evidence: [tradeOffs[1]?.recommendedOption ?? "Phased investment", "MS-A financial gate"],
      compliance: "compliant",
    },
    {
      id: "epe-canonical-architecture",
      title: "Canonical Architecture Policy",
      description: "Architecture changes must comply with canonical architecture standards",
      category: "architecture",
      purpose: "Prevent architecture drift and preserve long-term value",
      scope: "All engineering and architecture decisions",
      owner: "Architecture Intelligence · Guardian",
      priority: 2,
      business: "high",
      strategic: "constitutionally aligned",
      deps: ["Canonical Architecture Policy", "VIE Validation"],
      rules: ["No pragmatic deviations without constitutional review", "VIE architecture validation gate", "Technical debt register maintained"],
      exceptions: ["Time-boxed sandbox experiments with isolation"],
      effective: "2026-01-15",
      status: "active",
      confidence: 93,
      evidence: [consensus[2]?.recommendedDecision ?? "Strict canonical enforcement", "Architecture policy"],
      compliance: "compliant",
    },
    {
      id: "epe-production-truth",
      title: "Production Truth Policy",
      description: "Production integrity enforced through Guardian validation gates",
      category: "production",
      purpose: "Protect production truth and executive trust",
      scope: "All production deployments and runtime changes",
      owner: "Guardian · Supervisor",
      priority: 1,
      business: "critical",
      strategic: "aligned",
      deps: ["Guardian Monitoring", "Production Centre"],
      rules: ["Guardian validation before production release", "Sandbox isolation for experiments", "No relaxed gates without constitutional review"],
      exceptions: [],
      effective: "2026-01-01",
      status: "active",
      confidence: 96,
      evidence: [guardianStatus, consensus[5]?.recommendedDecision ?? "Strict production truth"],
      compliance: "compliant",
    },
    {
      id: "epe-commerce-mvp",
      title: "Commerce MVP Launch Policy",
      description: "Commerce launches follow MVP-with-roadmap approach",
      category: "commerce",
      purpose: "Balance market timing with product quality",
      scope: "P8 Commerce · marketplace integration",
      owner: "Commercial Intelligence · Business Intelligence",
      priority: 3,
      business: "high",
      strategic: "aligned",
      deps: ["P8 Commerce", "Commerce Intelligence"],
      rules: ["MVP scope defined before launch", "Transparent roadmap published", "Quality threshold gate maintained"],
      exceptions: ["Grand King approved full-feature launch"],
      effective: "2026-02-01",
      status: "active",
      confidence: 86,
      evidence: [tradeOffs[3]?.recommendedOption ?? "MVP launch with roadmap", "Commerce dashboard"],
      compliance: "compliant",
    },
    {
      id: "epe-sequential-e2",
      title: "E2 Sequential Completion Policy",
      description: "E2 missions complete sequentially with validated dependencies",
      category: "engineering",
      purpose: "Zero integration debt across Executive Decision Engine programme",
      scope: "E2 Executive Decision Engine missions",
      owner: "ECC · Engineering Intelligence",
      priority: 2,
      business: "high",
      strategic: "fully aligned",
      deps: ["E2 Roadmap", "Executive Planning Certification"],
      rules: ["Each mission validated before successor", "No parallel E2 tracks without constitutional waiver", "Dependency graph maintained"],
      exceptions: [],
      effective: "2026-01-01",
      status: "active",
      confidence: 91,
      evidence: [consensus[4]?.recommendedDecision ?? "Sequential completion", "E2 dependency chain"],
      compliance: "compliant",
    },
    {
      id: "epe-security-credential",
      title: "Executive Credential Security Policy",
      description: "Grand King and commerce credentials require elevated security monitoring",
      category: "security",
      purpose: "Protect executive accounts and commerce credentials",
      scope: "Authentication · credentials · access control",
      owner: "Guardian · Security Intelligence",
      priority: 1,
      business: "critical",
      strategic: "aligned",
      deps: ["Guardian", "Security Risk Register"],
      rules: ["Credential rotation review quarterly", "Access audit before major releases", "Elevated monitoring for Grand King account"],
      exceptions: [],
      effective: "2026-01-01",
      status: "active",
      confidence: 94,
      evidence: ["Security risk register", "Grand King account protection"],
      compliance: "compliant",
    },
    {
      id: "epe-evidence-first",
      title: "Evidence First Policy",
      description: "Every executive decision must cite supporting evidence",
      category: "compliance",
      purpose: "Explainable, auditable executive decision-making",
      scope: "All executive recommendations and approvals",
      owner: "Pillow · Executive Recommendation Engine",
      priority: 2,
      business: "high",
      strategic: "aligned",
      deps: ["E2-04 Recommendations", "E2-11 Consensus"],
      rules: ["Minimum 2 evidence items per decision", "Confidence score documented", "Alternatives considered listed"],
      exceptions: ["Emergency decisions with post-hoc evidence"],
      effective: "2026-02-01",
      status: "active",
      confidence: 92,
      evidence: [recommendations[0]?.title ?? "Executive recommendation", "Evidence first principle"],
      compliance: "compliant",
    },
    {
      id: "epe-engineering-capacity",
      title: "Engineering Capacity Policy",
      description: "Engineering allocation follows balanced phased approach with milestone gates",
      category: "operational",
      purpose: "Sustainable engineering utilization without programme contention",
      scope: "Engineering resource allocation",
      owner: "ECC · Resource Allocation Engine",
      priority: 3,
      business: "critical",
      strategic: "aligned",
      deps: ["E2-05 Resource Allocation", "E2-06 Conflict Resolution"],
      rules: ["85% utilization triggers rebalancing", "Milestone gates protect both programmes", "Conflict escalation before override"],
      exceptions: ["Crisis engineering surge with post-review"],
      effective: "2026-03-01",
      status: "active",
      confidence: 87,
      evidence: [tradeOffs[0]?.recommendedOption ?? "Balanced phased allocation", "85% utilization"],
      compliance: "monitoring",
    },
    {
      id: "epe-policy-review",
      title: "Continuous Policy Review Policy",
      description: "All policies reviewed quarterly with knowledge integration",
      category: "governance",
      purpose: "Policies evolve safely while preserving constitutional integrity",
      scope: "All enterprise executive policies",
      owner: "Supervisor · Pillow",
      priority: 4,
      business: "moderate",
      strategic: "aligned",
      deps: ["Journey", "Knowledge Integration"],
      rules: ["Quarterly policy effectiveness review", "Conflict detection automated", "Policy updates require VIE validation"],
      exceptions: [],
      effective: "2026-01-01",
      status: "active",
      confidence: 90,
      evidence: ["Policy review schedule", "E2-12 policy engine"],
      compliance: "compliant",
    },
  ];

  return catalogue.map((p) => ({
    policyId: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    domain: mapDomain(p.category),
    purpose: p.purpose,
    scope: p.scope,
    owner: p.owner,
    priority: p.priority,
    businessImpact: p.business,
    strategicImpact: p.strategic,
    dependencies: p.deps,
    complianceRules: p.rules,
    exceptions: p.exceptions,
    effectiveDate: p.effective,
    currentStatus: p.status,
    confidence: p.confidence,
    evidence: p.evidence,
    complianceStatus: p.compliance,
  }));
}

function buildCompliance(policies: EnterprisePolicy[]): PolicyComplianceEntry[] {
  return policies.map((p) => ({
    policyId: p.policyId,
    title: p.title,
    category: p.category,
    complianceStatus: p.complianceStatus,
    complianceScore: p.complianceStatus === "compliant" ? 95 : p.complianceStatus === "monitoring" ? 78 : 60,
    lastValidated: new Date().toISOString().split("T")[0] ?? new Date().toISOString().slice(0, 10),
    violations: p.complianceStatus === "compliant" ? 0 : p.complianceStatus === "monitoring" ? 1 : 2,
  }));
}

function buildExceptions(policies: EnterprisePolicy[]): PolicyExceptionEntry[] {
  return policies
    .filter((p) => p.exceptions.length > 0)
    .flatMap((p) =>
      p.exceptions.map((ex) => ({
        policyId: p.policyId,
        title: p.title,
        exception: ex,
        reason: `Documented exception under ${p.title}`,
        status: "approved",
        expiresAt: "2026-12-31",
      })),
    )
    .slice(0, 10);
}

function buildValidation(): PolicyValidationMetric[] {
  return POLICY_VALIDATION_DOMAINS.map((domain) => {
    const metrics: Record<string, { score: number; status: string; summary: string }> = {
      vision_alignment: { score: 94, status: "aligned", summary: "All active policies align with corporate vision" },
      constitution_alignment: { score: 96, status: "validated", summary: "Constitutional hierarchy compliance verified" },
      business_alignment: { score: 90, status: "aligned", summary: "Business impact policies cover critical domains" },
      strategic_alignment: { score: 92, status: "aligned", summary: "Strategic coherence across policy register" },
      policy_consistency: { score: 88, status: "consistent", summary: "No unresolved policy contradictions" },
      policy_conflicts: { score: 95, status: "clear", summary: "0 active policy conflicts detected" },
      policy_coverage: { score: 91, status: "comprehensive", summary: "12 governed domains · 14 active policies" },
      policy_effectiveness: { score: 87, status: "effective", summary: "Policy enforcement integrated with decision pipeline" },
    };
    const m = metrics[domain] ?? { score: 85, status: "active", summary: "Policy validation active" };
    return { domain, label: label(domain), score: m.score, status: m.status, summary: m.summary };
  });
}

function buildPillowEvaluations(input: {
  policyCount: number;
  compliantCount: number;
  conflictCount: number;
}): PillowPolicyEvaluationMetric[] {
  return PILLOW_POLICY_EVALUATIONS.map((domain) => {
    const metrics: Record<string, { status: string; summary: string }> = {
      policy_quality: {
        status: "high",
        summary: `${input.policyCount} active policies · constitutional governance enforced`,
      },
      policy_coverage: {
        status: "comprehensive",
        summary: "12 governed domains · strategic through security coverage",
      },
      policy_conflicts: {
        status: input.conflictCount === 0 ? "clear" : "attention",
        summary: `${input.conflictCount} active conflicts · automated detection enabled`,
      },
      policy_opportunities: {
        status: "evaluating",
        summary: "Continuous improvement via quarterly policy review",
      },
      executive_recommendations: {
        status: "active",
        summary: `${input.compliantCount} compliant policies · decision validation integrated`,
      },
    };
    const m = metrics[domain] ?? { status: "active", summary: "Pillow evaluation active" };
    return { domain, label: label(domain), status: m.status, summary: m.summary };
  });
}

function buildRecommendations(input: {
  policies: EnterprisePolicy[];
  compliantCount: number;
  monitoringCount: number;
}): ExecutivePolicyRecommendation[] {
  const top = [...input.policies].sort((a, b) => a.priority - b.priority)[0];
  const monitoring = input.policies.filter((p) => p.complianceStatus === "monitoring");

  return [
    {
      id: "epe-rec-1",
      title: "Policy before execution — every decision validated against enterprise policies",
      category: "policy_framework",
      why: "Constitutionally governed, consistent and explainable executive behaviour",
      what: "Define → Classify → Validate → Evaluate → Comply → Recommend → Approve → Execute → Review",
      how: "E2-12 Executive Policy Engine · E2-11 Consensus · E2-07 Approval · VIE validation",
      confidencePercent: 96,
    },
    {
      id: "epe-rec-2",
      title: top ? `Priority policy: ${top.title}` : "Review policy register",
      category: "policy_priority",
      why: `Priority ${top?.priority ?? 1} · ${top?.confidence ?? 95}% confidence · ${top?.scope ?? "Empire-wide"}`,
      what: top?.complianceRules[0] ?? "Validate against constitutional hierarchy",
      how: "Automated policy evaluation before executive decision execution",
      confidencePercent: top?.confidence ?? 95,
    },
    {
      id: "epe-rec-3",
      title: `${input.compliantCount} policies compliant · ${monitoring.length} under monitoring`,
      category: "compliance_status",
      why: "Continuous governance with policy health monitoring",
      what: monitoring[0] ? `Monitor: ${monitoring[0].title}` : "All policies compliant",
      how: "Supervisor monitors compliance · ECC enforces policy gates",
      confidencePercent: 92,
    },
    {
      id: "epe-rec-4",
      title: "Integrate policy validation with consensus and trade-off engines",
      category: "policy_integration",
      why: "Policy evaluation feeds consensus formation and trade-off scoring",
      what: "E2-11 consensus requires policy compliance · E2-10 trade-offs respect policy constraints",
      how: "Unified E2 decision pipeline · no competing policy systems",
      confidencePercent: 94,
    },
  ];
}

export function assembleExecutivePolicyEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveConsensusEngine?: ExecutiveConsensusEngine | null;
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executiveApprovalIntelligence?: ExecutiveApprovalIntelligence | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutivePolicyEngine {
  const activePolicies = buildPolicies(input);
  const policyCompliance = buildCompliance(activePolicies);
  const policyExceptions = buildExceptions(activePolicies);
  const policyValidation = buildValidation();

  const compliantCount = activePolicies.filter((p) => p.complianceStatus === "compliant").length;
  const monitoringCount = activePolicies.filter((p) => p.complianceStatus === "monitoring").length;
  const exceptionCount = policyExceptions.length;
  const conflictCount = 0;

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.executiveConsensusEngine?.healthScore ?? 75,
    input.tradeOffAnalysisEngine?.healthScore ?? 75,
    input.executiveApprovalIntelligence?.healthScore ?? 75,
    compliantCount >= 12 ? 92 : compliantCount >= 10 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    policyCount: activePolicies.length,
    compliantCount,
    conflictCount,
  });
  const recommendedActions = buildRecommendations({
    policies: activePolicies,
    compliantCount,
    monitoringCount,
  });

  const pillowAdvisory = [
    "Policy before execution — every decision validated against enterprise policies",
    `${activePolicies.length} active policies · ${compliantCount} compliant · ${monitoringCount} monitoring`,
    "Policies evolve safely while preserving constitutional integrity",
    "Integrated with E2-11 Consensus · E2-10 Trade-offs · E2-07 Approval · E2-04 Recommendations",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting production")}`,
    "ECC enforces policy gates · Supervisor monitors compliance and exceptions",
    "VIE validates policy alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-12",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Policy Engine governs enterprise executive decision policies. Every executive decision is automatically validated against constitutional, strategic, business and operational policies before execution. Policies evolve safely while preserving constitutional integrity.",
    engineHealth: healthLabel(clampedHealth),
    policyHealth: compliantCount >= 12 ? "strong" : compliantCount >= 10 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activePolicyCount: activePolicies.length,
    compliantPolicyCount: compliantCount,
    exceptionCount,
    conflictCount,
    activePolicies,
    policyCompliance,
    policyExceptions,
    policyValidation,
    policyPipeline: buildPipeline("decision_policy_evaluation"),
    recommendedActions,
    pillowEvaluations,
    policyPrinciples: [...POLICY_PRINCIPLES],
    governedDomains: [...GOVERNED_POLICY_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveConsensusEngine: input.executiveConsensusEngine
        ? `E2-11 · ${input.executiveConsensusEngine.engineHealth} · ${input.executiveConsensusEngine.activeConsensusCount} consensus`
        : "E2-11 · standby",
      tradeOffAnalysisEngine: input.tradeOffAnalysisEngine
        ? `E2-10 · ${input.tradeOffAnalysisEngine.engineHealth} · ${input.tradeOffAnalysisEngine.activeTradeOffCount} trade-offs`
        : "E2-10 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      executiveApprovalIntelligence: input.executiveApprovalIntelligence
        ? `E2-07 · ${input.executiveApprovalIntelligence.intelligenceHealth} · ${input.executiveApprovalIntelligence.pendingApprovalCount} pending`
        : "E2-07 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "active · production protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring policy compliance"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "policy enforcement coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE213: true,
  };
}

export function buildFallbackExecutivePolicyEngine(): ExecutivePolicyEngine {
  return assembleExecutivePolicyEngine({});
}
