import { nextAcceptancePackId, nextReportId } from "./audit-store.js";
import {
  EAPRT_METADATA_VERSION,
  EXECUTIVE_ACCEPTANCE_PACK_REPORT_VERSION,
  EXECUTIVE_ACCEPTANCE_PACK_RUNTIME_VERSION,
  EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH,
} from "./paths.js";
import type {
  AuditStatus,
  AuditSummary,
  CertificationSummary,
  DeploymentRecommendation,
  EaprtValidationReport,
  ExecutiveAcceptance,
  ExecutiveAcceptancePackReport,
  ExecutiveChecklistItem,
  GovernanceSummary,
  IntegrationVerification,
  ProductionReadinessSummary,
  Q1109ContractConsumption,
  ReadinessClassification,
  ReadinessDecision,
  RiskSummary,
} from "./types.js";

export function mapDecisionToAuditStatus(
  decision: ReadinessDecision,
  validationDecision: "pass" | "partial" | "fail",
  classification: ReadinessClassification,
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  if (classification === "missing") return "missing";
  if (classification === "failed") return "failed";
  if (classification === "blocked") return "blocked";
  if (decision === "certify" && classification === "certified") return "certified";
  if (classification === "partially_certified") return "partially_certified";
  if (decision === "defer" || classification === "deferred") return "deferred";
  if (decision === "certify") return "certified";
  return "unknown";
}

export type BuildReportParams = {
  reportId?: string | null;
  repositoryVersion: string;
  executiveSummary: string;
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  riskSummary: RiskSummary;
  outstandingIssues: string[];
  deploymentRecommendation: DeploymentRecommendation;
  executiveChecklist: ExecutiveChecklistItem[];
  integrationVerification: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
  decision: ReadinessDecision;
  confidenceScore: number;
  validation: EaprtValidationReport;
  workerId: string;
  consumableByQ1110: boolean;
  readinessClassification: ReadinessClassification;
};

export function buildAcceptancePack(params: BuildReportParams): ExecutiveAcceptance {
  const now = new Date().toISOString();
  return {
    acceptancePackId: nextAcceptancePackId(),
    repositoryVersion: params.repositoryVersion,
    certificationSummary: params.certificationSummary,
    auditSummary: params.auditSummary,
    readinessSummary: params.productionReadinessSummary,
    riskSummary: params.riskSummary,
    outstandingIssues: params.outstandingIssues,
    deploymentRecommendation: params.deploymentRecommendation,
    executiveChecklist: params.executiveChecklist,
    supportingEvidence: [
      ...params.certificationSummary.evidence,
      ...params.auditSummary.evidence,
      ...params.productionReadinessSummary.evidence,
    ],
    auditReference: `eaprt:${params.reportId?.trim() || "pending"}`,
    generationTimestamp: now,
  };
}

export function buildReport(params: BuildReportParams): ExecutiveAcceptancePackReport {
  const now = new Date().toISOString();
  const reportId = params.reportId?.trim() || nextReportId();
  const acceptancePack = buildAcceptancePack({ ...params, reportId });
  const auditStatus = mapDecisionToAuditStatus(
    params.decision,
    params.validation.decision,
    params.readinessClassification,
  );

  return {
    reportId,
    timestamp: now,
    packVersion: EXECUTIVE_ACCEPTANCE_PACK_RUNTIME_VERSION,
    engineId: "PILLOW-EAPRT-001",
    missionId: "Q11-09",
    executiveSummary: params.executiveSummary,
    certificationSummary: params.certificationSummary,
    auditSummary: params.auditSummary,
    productionReadinessSummary: params.productionReadinessSummary,
    riskSummary: params.riskSummary,
    outstandingIssues: params.outstandingIssues,
    deploymentRecommendation: params.deploymentRecommendation,
    executiveChecklist: params.executiveChecklist,
    supportingEvidence: acceptancePack.supportingEvidence,
    confidenceScore: params.confidenceScore,
    metadataVersion: EAPRT_METADATA_VERSION,
    reportVersion: EXECUTIVE_ACCEPTANCE_PACK_REPORT_VERSION,
    workerId: params.workerId,
    acceptancePack,
    decision: params.decision,
    auditStatus,
    validation: params.validation,
    integrationSummary: params.integrationVerification,
    governanceSummary: params.governanceSummary,
    q1109ContractConsumed: params.q1109ContractConsumed,
    consumableByQ1110: params.consumableByQ1110,
    neverImplementQ1110OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    ninthQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-09:executive-acceptance-pack",
      "q11-08:financial-readiness-audit",
      "pillow:executive-acceptance-gate",
      EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH,
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutablePackHistory: true,
    preserveAuditHistory: true,
    deterministicPackBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAcceptanceEvidence: true,
    neverHideFailedAudits: true,
    neverApproveProductionDeployment: true,
    neverOverrideFailedCertifications: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: ExecutiveAcceptancePackReport[],
  integrations: import("./types.js").IntegrationHandshake[],
) {
  return {
    reportVersion: EXECUTIVE_ACCEPTANCE_PACK_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((h) => ({ ...h })),
    metadataVersion: EAPRT_METADATA_VERSION,
    executiveAuthority: "pillow" as const,
    neverFabricateAcceptanceEvidence: true as const,
    neverHideFailedAudits: true as const,
    neverApproveProductionDeployment: true as const,
    neverOverridePillow: true as const,
    neverOverrideGrandKing: true as const,
    neverImplementQ1110OrLater: true as const,
    ninthQ11Gate: true as const,
  };
}
