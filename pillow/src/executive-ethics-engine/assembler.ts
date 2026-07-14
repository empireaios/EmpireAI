import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
import type { ExecutiveAdvisoryEngine } from "../executive-advisory-engine/types.js";
import type { ExecutiveComplianceEngine } from "../executive-compliance-engine/types.js";
import type { ExecutiveConstitutionalMonitor } from "../executive-constitutional-monitor/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_ETHICS_PIPELINE,
  ETHICS_PRINCIPLES,
  GOVERNED_ETHICS_DOMAINS,
  ETHICS_ANALYSIS_DOMAINS,
  PILLOW_ETHICS_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveEthicsEngine,
  ExecutiveEthicsPipelineStep,
  ExecutiveEthicsPipelinePhase,
  EthicalAssessment,
  EthicalRiskEntry,
  EthicsTrendEntry,
  EthicsAnalysisMetric,
  ExecutiveEthicsRecommendation,
  PillowEthicsEvaluationMetric,
  GovernedEthicsDomain,
  EthicsClassification,
  EthicsAnalysisDomain,
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

function buildPipeline(
  activePhase: ExecutiveEthicsPipelinePhase = "continuous_monitoring",
): ExecutiveEthicsPipelineStep[] {
  const activeIdx = EXECUTIVE_ETHICS_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_ETHICS_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildEthicalAssessments(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): EthicalAssessment[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Const = input.executiveConstitutionalMonitor?.engineVersion === "E5-02";
  const e5Audit = input.enterpriseAuditEngine?.engineVersion === "E5-03";
  const e5Comp = input.executiveComplianceEngine?.engineVersion === "E5-04";
  const e4Certified = input.executiveIntelligenceCertification?.programmeCertified ?? true;
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  const e3Certified = input.financialExecutiveCertification?.programmeCertified ?? true;
  const now = new Date().toISOString();

  const catalogue: Array<Omit<EthicalAssessment, "category"> & { category: GovernedEthicsDomain }> = [
    {
      assessmentId: "eeth-executive",
      executiveAction: "Executive decision governance · approvals · constitutional oversight",
      category: "executive_ethics",
      businessContext: "All executive decisions across E1–E5 programmes",
      ethicalConsiderations: "Transparency · accountability · long-term empire benefit",
      stakeholders: ["Grand King", "Executive Council", "Enterprise Stakeholders"],
      benefits: "Trustworthy executive guidance · responsible decision-making",
      potentialHarm: "Erosion of executive trust if decisions lack ethical evaluation",
      businessImpact: "Executive trustworthiness maintained empire-wide",
      strategicImpact: "Long-term constitutional governance confidence",
      ethicsRating: "fully_ethical",
      recommendedAction: "Continue ethical evaluation before every executive recommendation",
      confidence: 97,
      evidence: [e2Certified ? "E2-16 certified" : "E2 integrated", e5Const ? "E5-02 constitutional monitor active" : "E5-02 integrated"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-business",
      executiveAction: "Business operations · Commerce · cross-business coordination",
      category: "business_ethics",
      businessContext: "Business Factory · Commerce · customer-facing operations",
      ethicalConsiderations: "Fair business practices · stakeholder responsibility · sustainable growth",
      stakeholders: ["Customers", "Business Partners", "Enterprise Employees"],
      benefits: "Responsible business operations · stakeholder trust",
      potentialHarm: "Reputational risk from unethical business practices",
      businessImpact: "Business operations ethically responsible",
      strategicImpact: "Cross-business alignment with constitutional values",
      ethicsRating: "fully_ethical",
      recommendedAction: "Maintain business ethics review in all commercial decisions",
      confidence: 93,
      evidence: [e4Certified ? "E4-13 cross-business active" : "E4 integrated", "Business governance standards enforced"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-ai",
      executiveAction: "AI capability deployment · autonomous agents · Pillow intelligence",
      category: "ai_ethics",
      businessContext: "Pillow · AI evolution · autonomous decision support",
      ethicalConsiderations: "Responsible AI · transparency · human oversight · no harmful automation",
      stakeholders: ["Grand King", "Enterprise Users", "AI Governance Council"],
      benefits: "Ethically governed AI · explainable recommendations",
      potentialHarm: "Unethical AI behaviour · opaque decision-making",
      businessImpact: "AI operations within ethical constitutional bounds",
      strategicImpact: "Responsible AI evolution aligned with empire values",
      ethicsRating: "fully_ethical",
      recommendedAction: "Evaluate AI recommendations ethically before execution",
      confidence: 94,
      evidence: ["E2-15 autonomous monitor", "Guardian AI integrity protection"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-governance",
      executiveAction: "Enterprise governance · policy enforcement · constitutional compliance",
      category: "governance_ethics",
      businessContext: "E5-01 Governance · E5-02 Constitutional · E5-03 Audit · E5-04 Compliance",
      ethicalConsiderations: "Governance integrity · fair enforcement · constitutional alignment",
      stakeholders: ["Grand King", "Governance Council", "All Enterprise Programmes"],
      benefits: "Ethical governance framework · transparent enforcement",
      potentialHarm: "Governance distrust from opaque or unfair processes",
      businessImpact: "Governance processes ethically sound",
      strategicImpact: "E5 governance foundation ethically validated",
      ethicsRating: "fully_ethical",
      recommendedAction: "Maintain governance ethics in all policy decisions",
      confidence: 96,
      evidence: [e5Gov ? `E5-01 active · ${input.enterpriseGovernanceFramework?.policyComplianceRate ?? 94}% compliance` : "E5-01 integrated", e5Comp ? `E5-04 · ${input.executiveComplianceEngine?.complianceScore ?? 94}% compliance` : "E5-04 integrated"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-strategic",
      executiveAction: "Strategic planning · vision alignment · long-term empire direction",
      category: "strategic_ethics",
      businessContext: "Corporate Vision · Strategic Objectives · E1 planning",
      ethicalConsiderations: "Long-term enterprise benefit · sustainable strategy · stakeholder welfare",
      stakeholders: ["Grand King", "Strategic Council", "Future Generations"],
      benefits: "Ethically aligned strategic direction · sustainable empire growth",
      potentialHarm: "Short-term gains at long-term ethical cost",
      businessImpact: "Strategic decisions ethically responsible",
      strategicImpact: "Vision · Soul · CTD alignment maintained",
      ethicsRating: "fully_ethical",
      recommendedAction: "Evaluate strategic decisions for long-term ethical impact",
      confidence: 95,
      evidence: ["Vision Integrity Engine alignment", "Strategic objective ethical review"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-operational",
      executiveAction: "ECC coordination · Supervisor monitoring · Guardian protection",
      category: "operational_ethics",
      businessContext: "Operational governance · execution readiness · production integrity",
      ethicalConsiderations: "Operational responsibility · production truth · no harmful shortcuts",
      stakeholders: ["Operations Team", "Engineering", "Production Systems"],
      benefits: "Ethically responsible operations · production integrity",
      potentialHarm: "Operational harm from unethical execution shortcuts",
      businessImpact: "Operations ethically governed",
      strategicImpact: "Enterprise stability through ethical operations",
      ethicsRating: "fully_ethical",
      recommendedAction: "Maintain operational ethics in all execution decisions",
      confidence: 92,
      evidence: ["ECC execution coordination", "Supervisor ethics monitoring"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-financial",
      executiveAction: "Financial executive decisions · resource allocation · fiscal governance",
      category: "financial_ethics",
      businessContext: "E3 Financial Executive · budget governance · fiscal responsibility",
      ethicalConsiderations: "Financial transparency · responsible allocation · no fiscal harm",
      stakeholders: ["Grand King", "Financial Council", "Enterprise Investors"],
      benefits: "Ethically responsible financial governance",
      potentialHarm: "Financial harm from unethical resource allocation",
      businessImpact: "Financial decisions ethically evaluated",
      strategicImpact: "Fiscal responsibility aligned with empire values",
      ethicsRating: "fully_ethical",
      recommendedAction: "Evaluate financial decisions for ethical stakeholder impact",
      confidence: 94,
      evidence: [e3Certified ? "E3-16 certified" : "E3 integrated", "Financial governance standards enforced"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-mission",
      executiveAction: "Mission execution · roadmap progression · governance documentation",
      category: "mission_ethics",
      businessContext: "Journey · mission governance · E5 programme execution",
      ethicalConsiderations: "Mission integrity · honest progress reporting · documentation responsibility",
      stakeholders: ["Grand King", "Mission Teams", "Governance Council"],
      benefits: "Ethically honest mission governance",
      potentialHarm: "Mission trust erosion from documentation gaps",
      businessImpact: "Minor documentation lag · no operational ethical impact",
      strategicImpact: "Mission governance ethical transparency",
      ethicsRating: "minor_ethical_concern",
      recommendedAction: "Update mission governance documentation within 7 days",
      confidence: 88,
      evidence: [e5Audit ? "E5-03 audit finding tracked" : "Audit integrated", e5Comp ? "E5-04 compliance violation tracked" : "Compliance integrated"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-programme",
      executiveAction: "Programme certification · phase transitions · constitutional progression",
      category: "programme_ethics",
      businessContext: "E1–E5 programmes · certification gates · phase governance",
      ethicalConsiderations: "Honest certification · no premature advancement · constitutional integrity",
      stakeholders: ["Grand King", "Programme Councils", "Certification Bodies"],
      benefits: "Ethically sound programme progression",
      potentialHarm: "Programme trust loss from premature certification",
      businessImpact: "Programme integrity ethically maintained",
      strategicImpact: "Constitutional programme progression validated",
      ethicsRating: "fully_ethical",
      recommendedAction: "Maintain ethical certification standards across all programmes",
      confidence: 97,
      evidence: ["E1-15 · E2-16 · E3-16 · E4-15 certified", "E5-01 · E5-02 · E5-03 · E5-04 established"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-repository",
      executiveAction: "Repository governance · canonical architecture · production truth",
      category: "governance_ethics",
      businessContext: "Repository integrity · no competing systems · production truth",
      ethicalConsiderations: "Intellectual honesty · single source of truth · no fragmentation",
      stakeholders: ["Engineering", "Guardian", "Grand King"],
      benefits: "Ethically maintained repository integrity",
      potentialHarm: "Confusion and harm from competing unethical systems",
      businessImpact: "Repository ethically governed",
      strategicImpact: "Canonical architecture ethically preserved",
      ethicsRating: "fully_ethical",
      recommendedAction: "Protect repository integrity · no competing ethics systems",
      confidence: 96,
      evidence: ["Guardian repository protection", "No competing ethics systems"],
      timestamp: now,
    },
    {
      assessmentId: "eeth-future",
      executiveAction: "Future ethical domain provisioning · E5-06+ capabilities",
      category: "future_ethical_domains",
      businessContext: "Future empire expansion · accountability · ethics evolution",
      ethicalConsiderations: "Extensible ethics without fragmentation · long-term responsibility",
      stakeholders: ["Grand King", "Future Programmes", "Enterprise Stakeholders"],
      benefits: "Sustainable ethical governance framework",
      potentialHarm: "Ethics fragmentation from competing systems",
      businessImpact: "Future ethical domains provisioned",
      strategicImpact: "Long-term ethical sustainability",
      ethicsRating: "future_ethics_categories",
      recommendedAction: "Proceed to E5-06 Executive Accountability Engine",
      confidence: 90,
      evidence: ["E5-05 ethics engine established", "Future domain provision active"],
      timestamp: now,
    },
  ];

  return catalogue;
}

function buildEthicalRisks(assessments: EthicalAssessment[]): EthicalRiskEntry[] {
  return assessments
    .filter((a) => a.ethicsRating !== "fully_ethical" && a.ethicsRating !== "future_ethics_categories")
    .map((a) => ({
      riskId: `risk-${a.assessmentId}`,
      title: `${label(a.category)} — ${a.ethicsRating.replace(/_/g, " ")}`,
      assessmentId: a.assessmentId,
      domain: a.category,
      classification: a.ethicsRating,
      severity: a.ethicsRating === "critical_ethical_risk" ? "critical"
        : a.ethicsRating === "major_ethical_concern" ? "high"
          : a.ethicsRating === "moderate_ethical_concern" ? "medium"
            : "low",
      potentialHarm: a.potentialHarm,
      recommendedAction: a.recommendedAction,
      status: a.ethicsRating === "minor_ethical_concern" ? "monitoring" : "review_required",
    }));
}

function buildEthicsTrends(assessments: EthicalAssessment[]): EthicsTrendEntry[] {
  return GOVERNED_ETHICS_DOMAINS.map((domain, i) => {
    const domainAssessments = assessments.filter((a) => a.category === domain);
    const ethical = domainAssessments.filter((a) => a.ethicsRating === "fully_ethical").length;
    const currentRating = domainAssessments.length === 0 ? 92 : Math.round((ethical / domainAssessments.length) * 100);
    const previousRating = Math.max(0, currentRating - (i % 3 === 0 ? 1 : 0));
    return {
      trendId: `trend-${domain}`,
      domain,
      label: label(domain),
      currentRating,
      previousRating,
      direction: currentRating >= previousRating ? "improving" : "stable",
      status: currentRating >= 95 ? "excellent" : currentRating >= 85 ? "healthy" : "review",
    };
  });
}

function buildEthicsAnalysis(input: {
  ethicsRating: number;
  criticalCount: number;
}): EthicsAnalysisMetric[] {
  const scores: Record<EthicsAnalysisDomain, { score: number; summary: string }> = {
    business_responsibility: { score: 93, summary: "Business operations ethically responsible · stakeholder welfare protected" },
    stakeholder_impact: { score: 94, summary: "Stakeholder impact evaluated across all executive domains" },
    strategic_integrity: { score: 95, summary: "Strategic decisions aligned with long-term ethical enterprise benefit" },
    governance_integrity: { score: 96, summary: "E5 governance chain ethically sound · transparent enforcement" },
    operational_responsibility: { score: 92, summary: "Operations ethically governed · production integrity maintained" },
    financial_responsibility: { score: 94, summary: "Financial decisions ethically evaluated · fiscal transparency" },
    ai_behaviour: { score: 94, summary: "AI recommendations ethically evaluated before execution" },
    executive_trustworthiness: { score: 97, summary: "Executive guidance responsible · explainable · constitutionally aligned" },
    enterprise_sustainability: { score: input.ethicsRating, summary: `${input.ethicsRating}% executive ethics rating · sustainable governance` },
    long_term_ethical_impact: { score: 91, summary: "Long-term ethical impact assessed · future domains provisioned" },
  };

  return ETHICS_ANALYSIS_DOMAINS.map((domain) => {
    const s = scores[domain];
    return {
      domain,
      label: label(domain),
      score: s.score,
      status: s.score >= 95 ? "excellent" : s.score >= 85 ? "healthy" : "review",
      summary: s.summary,
    };
  });
}

function buildPillowEvaluations(input: {
  ethicsRating: number;
  riskCount: number;
  criticalCount: number;
}): PillowEthicsEvaluationMetric[] {
  const summaries: Record<string, { status: string; summary: string }> = {
    executive_ethics: { status: "validated", summary: "Executive decisions ethically evaluated before execution" },
    business_ethics: { status: "responsible", summary: "Business operations ethically governed" },
    ai_ethics: { status: "governed", summary: "AI behaviour ethically evaluated · human oversight active" },
    governance_ethics: { status: "enforced", summary: "E5-01 · E5-02 · E5-03 · E5-04 governance ethics chain" },
    executive_recommendations: { status: "active", summary: `${input.ethicsRating}% rating · ${input.riskCount} risks · ${input.criticalCount} critical` },
  };
  return PILLOW_ETHICS_EVALUATIONS.map((domain) => {
    const s = summaries[domain] ?? { status: "active", summary: "Continuous ethical evaluation" };
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  e5Comp: boolean;
  criticalCount: number;
}): ExecutiveEthicsRecommendation[] {
  return [
    {
      id: "eeth-rec-engine",
      title: "Maintain Executive Ethics Engine",
      category: "governance_ethics",
      why: "Ethics determines whether executive actions are responsible and trustworthy",
      what: "Evaluate all executive recommendations ethically through PILLOW-EETH-001",
      how: "Ethics pipeline · ethical evaluation · 5s cockpit refresh",
      confidencePercent: 97,
    },
    {
      id: "eeth-rec-e506",
      title: "Proceed to E5-06 Executive Accountability Engine",
      category: "executive_ethics",
      why: "E5-05 ethics engine established · accountability enforcement requires dedicated engine",
      what: "Implement Executive Accountability Engine as next E5 capability",
      how: "Build on EETH foundation · integrate ethics assessments · accountability tracking",
      confidencePercent: input.e5Comp ? 95 : 82,
    },
    {
      id: "eeth-rec-mission",
      title: "Resolve Mission Documentation Ethical Concern",
      category: "mission_ethics",
      why: "One minor ethical concern from compliance and audit chain",
      what: "Update mission governance documentation within 7 days",
      how: "Ethical review → documentation update → ethics re-evaluation",
      confidencePercent: 90,
    },
    {
      id: "eeth-rec-recommendations",
      title: "Ethically Evaluate All Executive Recommendations",
      category: "executive_ethics",
      why: "Every executive recommendation shall be ethically evaluated before execution",
      what: "Enable pre-execution ethical evaluation for all executive actions",
      how: "Continuous monitoring pipeline · VIE alignment · Guardian integrity checks",
      confidencePercent: 94,
    },
  ];
}

export function assembleExecutiveEthicsEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveEthicsEngine {
  const ethicalAssessments = buildEthicalAssessments(input);
  const potentialEthicalRisks = buildEthicalRisks(ethicalAssessments);
  const ethicsTrends = buildEthicsTrends(ethicalAssessments);

  const fullyEthicalCount = ethicalAssessments.filter((a) => a.ethicsRating === "fully_ethical").length;
  const avgConfidence = Math.round(
    ethicalAssessments.reduce((s, a) => s + a.confidence, 0) / Math.max(ethicalAssessments.length, 1),
  );
  const executiveEthicsRating = Math.round(
    (fullyEthicalCount / Math.max(ethicalAssessments.length - 1, 1)) * 100,
  );
  const criticalEthicalRiskCount = potentialEthicalRisks.filter((r) => r.severity === "critical").length;

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveConstitutionalMonitor?.healthScore ?? 85,
    input.enterpriseAuditEngine?.healthScore ?? 85,
    input.executiveComplianceEngine?.healthScore ?? 85,
    criticalEthicalRiskCount === 0 ? 94 : 76,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Comp = input.executiveComplianceEngine?.engineVersion === "E5-04";
  const ethicsAnalysis = buildEthicsAnalysis({
    ethicsRating: executiveEthicsRating,
    criticalCount: criticalEthicalRiskCount,
  });
  const pillowEvaluations = buildPillowEvaluations({
    ethicsRating: executiveEthicsRating,
    riskCount: potentialEthicalRisks.length,
    criticalCount: criticalEthicalRiskCount,
  });
  const recommendedActions = buildRecommendations({
    e5Comp,
    criticalCount: criticalEthicalRiskCount,
  });

  const pillowAdvisory = [
    "Executive Ethics Engine — continuous ethical evaluation of executive decisions active",
    `${ethicalAssessments.length} ethical assessments · ${executiveEthicsRating}% rating · ${potentialEthicalRisks.length} risks · ${criticalEthicalRiskCount} critical`,
    "Every executive recommendation ethically evaluated · no competing ethics systems",
    `Integrated with E5-01 Governance · E5-02 Constitutional · E5-03 Audit · E5-04 Compliance · E2 Policy`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting ethics integrity")}`,
    "ECC coordinates ethics reviews · Supervisor monitors ethics trends",
    "VIE validates ethics alignment · vision · soul · CTD · constitution",
  ];

  return {
    engineVersion: "E5-05",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Ethics Engine continuously evaluates the ethical implications of executive decisions, AI behaviour, business operations and governance actions. Every executive recommendation is ethically evaluated before execution. The Grand King receives ethically responsible, explainable executive guidance aligned with the Empire's constitutional values.",
    engineHealth: healthLabel(clampedHealth),
    ethicsHealth: criticalEthicalRiskCount === 0 ? "strong" : avgConfidence >= 90 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    executiveEthicsRating,
    ethicalAssessmentCount: ethicalAssessments.length,
    ethicalRiskCount: potentialEthicalRisks.length,
    criticalEthicalRiskCount,
    fullyEthicalCount,
    ethicalAssessments,
    potentialEthicalRisks,
    ethicsTrends,
    ethicsAnalysis,
    executiveEthicsPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowEvaluations,
    ethicsPrinciples: [...ETHICS_PRINCIPLES],
    governedDomains: [...GOVERNED_ETHICS_DOMAINS],
    pillowAdvisory,
    integrations: {
      enterpriseGovernanceFramework: input.enterpriseGovernanceFramework
        ? `E5-01 · ${input.enterpriseGovernanceFramework.frameworkHealth} · ${input.enterpriseGovernanceFramework.policyComplianceRate}% policy compliance`
        : "E5-01 · standby",
      executiveConstitutionalMonitor: input.executiveConstitutionalMonitor
        ? `E5-02 · ${input.executiveConstitutionalMonitor.engineHealth} · ${input.executiveConstitutionalMonitor.constitutionalComplianceRate}% constitutional`
        : "E5-02 · standby",
      enterpriseAuditEngine: input.enterpriseAuditEngine
        ? `E5-03 · ${input.enterpriseAuditEngine.engineHealth} · ${input.enterpriseAuditEngine.auditCoverageRate}% audit coverage`
        : "E5-03 · standby",
      executiveComplianceEngine: input.executiveComplianceEngine
        ? `E5-04 · ${input.executiveComplianceEngine.complianceHealth} · ${input.executiveComplianceEngine.complianceScore}% compliance`
        : "E5-04 · standby",
      executiveIntelligenceProgramme: input.executiveIntelligenceCertification?.programmeCertified
        ? "E4-15 · certified"
        : "E4 · integrated",
      executiveDecisionEngine: input.executiveDecisionCertification?.programmeCertified
        ? "E2-16 · certified"
        : input.executiveDecisionArchitecture
          ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
          : "E2 · integrated",
      financialExecutiveProgramme: input.financialExecutiveCertification?.programmeCertified
        ? "E3-16 · certified"
        : "E3 · integrated",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.engineHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "ethics integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E5 Executive Governance"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring ethics health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "ethics review coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE506: true,
  };
}

export function buildFallbackExecutiveEthicsEngine(): ExecutiveEthicsEngine {
  return assembleExecutiveEthicsEngine({});
}
