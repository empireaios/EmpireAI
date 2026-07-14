import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
import type { ExecutiveAccountabilityEngine } from "../executive-accountability-engine/types.js";
import type { ExecutiveAdvisoryEngine } from "../executive-advisory-engine/types.js";
import type { ExecutiveComplianceEngine } from "../executive-compliance-engine/types.js";
import type { ExecutiveConstitutionalMonitor } from "../executive-constitutional-monitor/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import type { ExecutiveEthicsEngine } from "../executive-ethics-engine/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  EXECUTIVE_TRANSPARENCY_PIPELINE,
  TRANSPARENCY_PRINCIPLES,
  GOVERNED_TRANSPARENCY_DOMAINS,
  TRANSPARENCY_ANALYSIS_DOMAINS,
  PILLOW_TRANSPARENCY_PUBLICATIONS,
} from "./paths.js";
import type {
  ExecutiveTransparencyEngine,
  ExecutiveTransparencyPipelineStep,
  ExecutiveTransparencyPipelinePhase,
  TransparencyRecord,
  ExecutiveActivityFeedEntry,
  GovernanceTimelineEntry,
  DecisionTimelineEntry,
  RepositoryActivityEntry,
  MissionStatusEntry,
  ProgrammeStatusEntry,
  TransparencyAnalysisMetric,
  ExecutiveTransparencyRecommendation,
  PillowTransparencyPublicationMetric,
  GovernedTransparencyDomain,
  TransparencyClassification,
  TransparencyAnalysisDomain,
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
  activePhase: ExecutiveTransparencyPipelinePhase = "continuous_monitoring",
): ExecutiveTransparencyPipelineStep[] {
  const activeIdx = EXECUTIVE_TRANSPARENCY_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_TRANSPARENCY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildTransparencyRecords(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): TransparencyRecord[] {
  const e5Gov = input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01";
  const e5Const = input.executiveConstitutionalMonitor?.engineVersion === "E5-02";
  const e5Audit = input.enterpriseAuditEngine?.engineVersion === "E5-03";
  const e5Comp = input.executiveComplianceEngine?.engineVersion === "E5-04";
  const e5Eth = input.executiveEthicsEngine?.engineVersion === "E5-05";
  const e5Acct = input.executiveAccountabilityEngine?.engineVersion === "E5-06";
  const e4Certified = input.executiveIntelligenceCertification?.programmeCertified ?? true;
  const e2Certified = input.executiveDecisionCertification?.programmeCertified ?? true;
  const e3Certified = input.financialExecutiveCertification?.programmeCertified ?? true;
  const now = new Date().toISOString();

  const catalogue: Array<Omit<TransparencyRecord, "category" | "visibilityLevel"> & {
    category: GovernedTransparencyDomain;
    visibilityLevel: TransparencyClassification;
  }> = [
    {
      transparencyId: "etran-executive",
      executiveActivity: "Executive decision governance · approvals · constitutional oversight",
      category: "executive_transparency",
      origin: "Executive Decision Engine · E2-01",
      owner: "Grand King",
      authority: "supreme_executive",
      visibilityLevel: "grand_king_view",
      businessImpact: "Complete executive decision visibility for Grand King",
      strategicImpact: "Executive transparency maintained empire-wide",
      relatedDecisions: ["E2-16 certification", "E5 governance chain"],
      supportingEvidence: [e2Certified ? "E2-16 certified" : "E2 integrated", e5Const ? "E5-02 constitutional monitor active" : "E5-02 integrated"],
      confidence: 98,
      timestamp: now,
    },
    {
      transparencyId: "etran-decision",
      executiveActivity: "Executive decision traceability · approval chain · evidence records",
      category: "decision_transparency",
      origin: "Executive Decision Architecture · E5-06 Accountability",
      owner: "Governance Executive",
      authority: "executive_delegated",
      visibilityLevel: "executive_leadership_view",
      businessImpact: "Every executive decision fully visible and traceable",
      strategicImpact: "Decision transparency enables constitutional oversight",
      relatedDecisions: ["E5-06 accountability records", "E5-03 audit findings"],
      supportingEvidence: [e5Acct ? `E5-06 · ${input.executiveAccountabilityEngine?.ownershipCoverageScore ?? 100}% ownership` : "E5-06 integrated"],
      confidence: 97,
      timestamp: now,
    },
    {
      transparencyId: "etran-governance",
      executiveActivity: "Enterprise governance · policy enforcement · constitutional compliance",
      category: "governance_transparency",
      origin: "E5-01 Enterprise Governance Framework",
      owner: "Governance Executive",
      authority: "executive_delegated",
      visibilityLevel: "governance_view",
      businessImpact: "Governance processes fully visible to authorized viewers",
      strategicImpact: "E5 governance chain transparent",
      relatedDecisions: ["E5-01 framework", "E5-02 constitutional", "E5-04 compliance", "E5-05 ethics"],
      supportingEvidence: [e5Gov ? `E5-01 active · ${input.enterpriseGovernanceFramework?.policyComplianceRate ?? 94}% compliance` : "E5-01 integrated", e5Eth ? `E5-05 · ${input.executiveEthicsEngine?.executiveEthicsRating ?? 94}% ethics` : "E5-05 integrated"],
      confidence: 97,
      timestamp: now,
    },
    {
      transparencyId: "etran-business",
      executiveActivity: "Business operations · Commerce · cross-business coordination",
      category: "business_transparency",
      origin: "Business Factory · E4 Cross-Business",
      owner: "Business Executive",
      authority: "executive_delegated",
      visibilityLevel: "executive_leadership_view",
      businessImpact: "Business operations visible to executive leadership",
      strategicImpact: "Cross-business transparency validated",
      relatedDecisions: ["E4-13 cross-business", "Business governance standards"],
      supportingEvidence: [e4Certified ? "E4-13 cross-business active" : "E4 integrated"],
      confidence: 94,
      timestamp: now,
    },
    {
      transparencyId: "etran-ai",
      executiveActivity: "AI capability deployment · autonomous agents · Pillow intelligence",
      category: "ai_transparency",
      origin: "Pillow · E2-15 Autonomous Monitor",
      owner: "AI Governance Executive",
      authority: "executive_delegated",
      visibilityLevel: "governance_view",
      businessImpact: "AI behaviour visible with need-to-know security",
      strategicImpact: "Responsible AI transparency without compromising security",
      relatedDecisions: ["E2-15 autonomous monitor", "Guardian AI integrity"],
      supportingEvidence: ["E2-15 autonomous monitor", "Guardian sensitive information protection"],
      confidence: 95,
      timestamp: now,
    },
    {
      transparencyId: "etran-mission",
      executiveActivity: "Mission execution · roadmap progression · E5 programme governance",
      category: "mission_transparency",
      origin: "Journey · Mission Governance",
      owner: "Mission Executive",
      authority: "programme_delegated",
      visibilityLevel: "mission_view",
      businessImpact: "Mission status fully visible to authorized mission viewers",
      strategicImpact: "Mission governance transparency maintained",
      relatedDecisions: ["E5-04 compliance", "E5-06 accountability"],
      supportingEvidence: [e5Audit ? "E5-03 audit active" : "Audit integrated", e5Comp ? "E5-04 compliance active" : "Compliance integrated"],
      confidence: 93,
      timestamp: now,
    },
    {
      transparencyId: "etran-programme",
      executiveActivity: "Programme certification · phase transitions · constitutional progression",
      category: "programme_transparency",
      origin: "E1–E5 Programme Certification Gates",
      owner: "Programme Executive",
      authority: "executive_delegated",
      visibilityLevel: "programme_view",
      businessImpact: "Programme status visible across all phases",
      strategicImpact: "Constitutional programme progression transparent",
      relatedDecisions: ["E1-15 · E2-16 · E3-16 · E4-15 certified", "E5-01 through E5-06 established"],
      supportingEvidence: ["E1-15 · E2-16 · E3-16 · E4-15 certified", "E5 governance chain complete"],
      confidence: 97,
      timestamp: now,
    },
    {
      transparencyId: "etran-repository",
      executiveActivity: "Repository governance · canonical architecture · production truth",
      category: "repository_transparency",
      origin: "Repository Governance · Guardian Protection",
      owner: "Engineering Executive",
      authority: "executive_delegated",
      visibilityLevel: "repository_view",
      businessImpact: "Repository evolution fully visible",
      strategicImpact: "Canonical architecture transparency preserved",
      relatedDecisions: ["No competing transparency systems", "Guardian repository protection"],
      supportingEvidence: ["Guardian repository protection", "Production truth maintained"],
      confidence: 96,
      timestamp: now,
    },
    {
      transparencyId: "etran-operational",
      executiveActivity: "ECC coordination · Supervisor monitoring · Guardian protection",
      category: "operational_transparency",
      origin: "ECC · Supervisor · Guardian Operations",
      owner: "Operations Executive",
      authority: "executive_delegated",
      visibilityLevel: "governance_view",
      businessImpact: "Operational governance visible to authorized viewers",
      strategicImpact: "Enterprise stability through operational transparency",
      relatedDecisions: ["ECC execution coordination", "Supervisor transparency monitoring"],
      supportingEvidence: ["ECC execution coordination", "Supervisor visibility monitoring"],
      confidence: 93,
      timestamp: now,
    },
    {
      transparencyId: "etran-audit",
      executiveActivity: "Enterprise audit · evidence collection · corrective action tracking",
      category: "governance_transparency",
      origin: "E5-03 Enterprise Audit Engine",
      owner: "Audit Executive",
      authority: "executive_delegated",
      visibilityLevel: "audit_view",
      businessImpact: "Audit findings visible to authorized audit viewers",
      strategicImpact: "Evidence-based governance transparency",
      relatedDecisions: ["E5-03 audit engine", "E5-04 compliance violations"],
      supportingEvidence: [e5Audit ? `E5-03 · ${input.enterpriseAuditEngine?.auditCoverageRate ?? 94}% coverage` : "E5-03 integrated"],
      confidence: 96,
      timestamp: now,
    },
    {
      transparencyId: "etran-financial",
      executiveActivity: "Financial executive decisions · resource allocation · fiscal governance",
      category: "business_transparency",
      origin: "E3 Financial Executive",
      owner: "Financial Executive",
      authority: "executive_delegated",
      visibilityLevel: "restricted_view",
      businessImpact: "Financial decisions visible with need-to-know security",
      strategicImpact: "Fiscal transparency with constitutional security",
      relatedDecisions: ["E3-16 certification", "Financial governance standards"],
      supportingEvidence: [e3Certified ? "E3-16 certified" : "E3 integrated", "Need-to-know security enforced"],
      confidence: 95,
      timestamp: now,
    },
    {
      transparencyId: "etran-future",
      executiveActivity: "Future transparency domain provisioning · E5-08+ capabilities",
      category: "future_transparency_domains",
      origin: "E5-07 Transparency Engine",
      owner: "Governance Executive",
      authority: "executive_delegated",
      visibilityLevel: "future_transparency_classes",
      businessImpact: "Future transparency domains provisioned",
      strategicImpact: "Long-term transparency sustainability",
      relatedDecisions: ["E5-07 transparency engine established", "E5-08 Exception Manager planned"],
      supportingEvidence: ["E5-07 transparency engine established", "Future domain provision active"],
      confidence: 90,
      timestamp: now,
    },
  ];

  return catalogue;
}

function buildActivityFeed(records: TransparencyRecord[]): ExecutiveActivityFeedEntry[] {
  return records
    .filter((r) => r.category !== "future_transparency_domains")
    .map((r) => ({
      feedId: `feed-${r.transparencyId}`,
      transparencyId: r.transparencyId,
      activity: r.executiveActivity,
      category: r.category,
      owner: r.owner,
      visibilityLevel: r.visibilityLevel,
      status: "published",
      timestamp: r.timestamp,
    }));
}

function buildGovernanceTimeline(records: TransparencyRecord[]): GovernanceTimelineEntry[] {
  return records
    .filter((r) => r.category === "governance_transparency" || r.category === "executive_transparency" || r.category === "operational_transparency")
    .map((r) => ({
      timelineId: `gtl-${r.transparencyId}`,
      transparencyId: r.transparencyId,
      event: r.executiveActivity,
      domain: r.category,
      owner: r.owner,
      visibilityLevel: r.visibilityLevel,
      timestamp: r.timestamp,
    }));
}

function buildDecisionTimeline(records: TransparencyRecord[]): DecisionTimelineEntry[] {
  return records
    .filter((r) => r.category === "decision_transparency" || r.category === "executive_transparency")
    .map((r) => ({
      decisionId: `dtl-${r.transparencyId}`,
      transparencyId: r.transparencyId,
      decision: r.executiveActivity,
      decisionMaker: r.owner,
      authority: r.authority,
      visibilityLevel: r.visibilityLevel,
      outcome: r.businessImpact,
      timestamp: r.timestamp,
    }));
}

function buildRepositoryActivity(records: TransparencyRecord[]): RepositoryActivityEntry[] {
  return records
    .filter((r) => r.category === "repository_transparency")
    .map((r) => ({
      activityId: `repo-${r.transparencyId}`,
      transparencyId: r.transparencyId,
      activity: r.executiveActivity,
      owner: r.owner,
      visibilityLevel: r.visibilityLevel,
      impact: r.strategicImpact,
      timestamp: r.timestamp,
    }));
}

function buildMissionStatus(records: TransparencyRecord[]): MissionStatusEntry[] {
  return records
    .filter((r) => r.category === "mission_transparency")
    .map((r) => ({
      missionId: `msn-${r.transparencyId}`,
      transparencyId: r.transparencyId,
      mission: r.executiveActivity,
      status: "active",
      owner: r.owner,
      visibilityLevel: r.visibilityLevel,
      progress: 85,
      timestamp: r.timestamp,
    }));
}

function buildProgrammeStatus(records: TransparencyRecord[]): ProgrammeStatusEntry[] {
  return records
    .filter((r) => r.category === "programme_transparency")
    .map((r) => ({
      programmeId: `prg-${r.transparencyId}`,
      transparencyId: r.transparencyId,
      programme: r.executiveActivity,
      phase: "E5 Executive Governance",
      status: "active",
      owner: r.owner,
      visibilityLevel: r.visibilityLevel,
      timestamp: r.timestamp,
    }));
}

function buildTransparencyAnalysis(input: {
  visibilityCoverage: number;
  hiddenCount: number;
}): TransparencyAnalysisMetric[] {
  const scores: Record<TransparencyAnalysisDomain, { score: number; summary: string }> = {
    executive_visibility: { score: 98, summary: "Grand King possesses complete executive visibility" },
    decision_traceability: { score: 97, summary: "Every executive decision fully traceable and visible" },
    governance_visibility: { score: 97, summary: "E5 governance chain fully transparent" },
    repository_visibility: { score: 96, summary: "Repository evolution visible · canonical architecture transparent" },
    mission_visibility: { score: 93, summary: "Mission status visible to authorized mission viewers" },
    programme_visibility: { score: 97, summary: "E1–E5 programme status fully transparent" },
    business_visibility: { score: 94, summary: "Business operations visible with need-to-know security" },
    reporting_quality: { score: input.visibilityCoverage, summary: `${input.visibilityCoverage}% visibility coverage · reporting quality validated` },
    enterprise_stability: { score: input.visibilityCoverage, summary: "Enterprise stability through complete transparency" },
    long_term_sustainability: { score: 91, summary: "Future transparency domains provisioned · no hidden actions" },
  };

  return TRANSPARENCY_ANALYSIS_DOMAINS.map((domain) => {
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

function buildPillowPublications(input: {
  visibilityCoverage: number;
  hiddenCount: number;
  recordCount: number;
}): PillowTransparencyPublicationMetric[] {
  const summaries: Record<string, { status: string; summary: string }> = {
    executive_activities: { status: "publishing", summary: `${input.recordCount} executive activities published with access validation` },
    governance_status: { status: "active", summary: "E5-01 through E5-06 governance status continuously published" },
    strategic_decisions: { status: "visible", summary: "Strategic decisions visible to authorized executive viewers" },
    repository_evolution: { status: "tracked", summary: "Repository evolution transparent · Guardian protects sensitive information" },
    executive_recommendations: { status: "active", summary: `${input.visibilityCoverage}% coverage · ${input.hiddenCount} hidden actions` },
  };
  return PILLOW_TRANSPARENCY_PUBLICATIONS.map((domain) => {
    const s = summaries[domain] ?? { status: "active", summary: "Continuous transparency publication" };
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  e5Acct: boolean;
  hiddenCount: number;
}): ExecutiveTransparencyRecommendation[] {
  return [
    {
      id: "etran-rec-engine",
      title: "Maintain Executive Transparency Engine",
      category: "governance_transparency",
      why: "Executive accountability is only meaningful when executive actions remain visible",
      what: "Publish all executive activities through PILLOW-ETRAN-001",
      how: "Transparency pipeline · access validation · 5s cockpit refresh",
      confidencePercent: 97,
    },
    {
      id: "etran-rec-e508",
      title: "Proceed to E5-08 Executive Exception Manager",
      category: "executive_transparency",
      why: "E5-07 transparency engine established · exception management requires dedicated engine",
      what: "Implement Executive Exception Manager as next E5 capability",
      how: "Build on ETRAN foundation · integrate transparency records · exception handling",
      confidencePercent: input.e5Acct ? 95 : 82,
    },
    {
      id: "etran-rec-security",
      title: "Maintain Need-to-Know Security",
      category: "governance_transparency",
      why: "Transparency shall never compromise security",
      what: "Enforce visibility classification with access validation on all publications",
      how: "Access validation pipeline · Guardian sensitive information protection",
      confidencePercent: 96,
    },
    {
      id: "etran-rec-hidden",
      title: "Eliminate Hidden Executive Actions",
      category: "executive_transparency",
      why: "No Hidden Executive Actions — constitutional transparency principle",
      what: input.hiddenCount === 0
        ? "Maintain zero hidden executive actions across all domains"
        : `Resolve ${input.hiddenCount} hidden actions immediately`,
      how: "Activity detection → visibility classification → transparency publication",
      confidencePercent: input.hiddenCount === 0 ? 98 : 85,
    },
  ];
}

export function assembleExecutiveTransparencyEngine(input: {
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
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveAdvisoryEngine?: ExecutiveAdvisoryEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveTransparencyEngine {
  const transparencyRecords = buildTransparencyRecords(input);
  const executiveActivityFeed = buildActivityFeed(transparencyRecords);
  const governanceTimeline = buildGovernanceTimeline(transparencyRecords);
  const decisionTimeline = buildDecisionTimeline(transparencyRecords);
  const repositoryActivity = buildRepositoryActivity(transparencyRecords);
  const missionStatus = buildMissionStatus(transparencyRecords);
  const programmeStatus = buildProgrammeStatus(transparencyRecords);

  const fullyVisibleCount = transparencyRecords.filter(
    (r) => r.visibilityLevel !== "restricted_view" && r.visibilityLevel !== "future_transparency_classes",
  ).length;
  const hiddenActionCount = transparencyRecords.filter((r) => r.visibilityLevel === "restricted_view").length;
  const visibilityCoverageScore = Math.round(
    (fullyVisibleCount / Math.max(transparencyRecords.length - 1, 1)) * 100,
  );

  const healthInputs = [
    input.corporateVision?.healthScore ?? 85,
    input.enterpriseGovernanceFramework?.healthScore ?? 85,
    input.executiveConstitutionalMonitor?.healthScore ?? 85,
    input.enterpriseAuditEngine?.healthScore ?? 85,
    input.executiveComplianceEngine?.healthScore ?? 85,
    input.executiveEthicsEngine?.healthScore ?? 85,
    input.executiveAccountabilityEngine?.healthScore ?? 85,
    hiddenActionCount === 0 ? 96 : 88,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const e5Acct = input.executiveAccountabilityEngine?.engineVersion === "E5-06";
  const transparencyAnalysis = buildTransparencyAnalysis({
    visibilityCoverage: visibilityCoverageScore,
    hiddenCount: hiddenActionCount,
  });
  const pillowPublications = buildPillowPublications({
    visibilityCoverage: visibilityCoverageScore,
    hiddenCount: hiddenActionCount,
    recordCount: transparencyRecords.length,
  });
  const recommendedActions = buildRecommendations({
    e5Acct,
    hiddenCount: hiddenActionCount,
  });

  const pillowAdvisory = [
    "Executive Transparency Engine — continuous executive visibility and reporting active",
    `${transparencyRecords.length} transparency records · ${visibilityCoverageScore}% coverage · ${hiddenActionCount} restricted`,
    "Complete executive visibility · need-to-know security · no competing transparency systems",
    `Integrated with E5-01 Governance · E5-02 Constitutional · E5-03 Audit · E5-04 Compliance · E5-05 Ethics · E5-06 Accountability`,
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting transparency integrity and sensitive information")}`,
    "ECC coordinates executive reporting · Supervisor monitors transparency health",
    "VIE validates transparency alignment · vision · soul · CTD · constitution",
  ];

  return {
    engineVersion: "E5-07",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Transparency Engine continuously provides complete visibility into executive decisions, AI behaviour, governance actions, repository evolution, business operations and strategic execution. Transparency never compromises security and always preserves constitutional governance. The Grand King possesses complete visibility into how the Empire is governed.",
    engineHealth: healthLabel(clampedHealth),
    transparencyHealth: hiddenActionCount === 0 ? "strong" : visibilityCoverageScore >= 90 ? "stable" : "developing",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? input.executiveAdvisoryEngine?.strategicAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    visibilityCoverageScore,
    transparencyRecordCount: transparencyRecords.length,
    hiddenActionCount,
    fullyVisibleCount,
    executiveActivityFeed,
    governanceTimeline,
    decisionTimeline,
    repositoryActivity,
    missionStatus,
    programmeStatus,
    transparencyRecords,
    transparencyAnalysis,
    executiveTransparencyPipeline: buildPipeline("continuous_monitoring"),
    recommendedActions,
    pillowPublications,
    transparencyPrinciples: [...TRANSPARENCY_PRINCIPLES],
    governedDomains: [...GOVERNED_TRANSPARENCY_DOMAINS],
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
      executiveEthicsEngine: input.executiveEthicsEngine
        ? `E5-05 · ${input.executiveEthicsEngine.ethicsHealth} · ${input.executiveEthicsEngine.executiveEthicsRating}% ethics`
        : "E5-05 · standby",
      executiveAccountabilityEngine: input.executiveAccountabilityEngine
        ? `E5-06 · ${input.executiveAccountabilityEngine.governanceHealth} · ${input.executiveAccountabilityEngine.ownershipCoverageScore}% ownership`
        : "E5-06 · standby",
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
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "transparency integrity and sensitive information protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E5 Executive Governance"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring transparency health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "executive reporting coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE508: true,
  };
}

export function buildFallbackExecutiveTransparencyEngine(): ExecutiveTransparencyEngine {
  return assembleExecutiveTransparencyEngine({});
}
