import { nextAcceptanceId, nextAuthorisationId, nextReportId } from "./audit-store.js";
import {
  GKAGT_METADATA_VERSION,
  GRAND_KING_ACCEPTANCE_GATE_REPORT_VERSION,
  GRAND_KING_ACCEPTANCE_GATE_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  CertificationSummary,
  DeploymentAuthorisation,
  GkagtValidationReport,
  GrandKingAcceptance,
  GrandKingAcceptanceReport,
  GrandKingDecision,
  ProductionReadinessPresentation,
  ProductionReadinessSummary,
  PrerequisiteVerification,
  Q1110ContractConsumption,
  ReReviewStatus,
  DeploymentAuthorisationStatus,
} from "./types.js";

export function mapDecisionToAuditStatus(
  decision: GrandKingDecision,
  validationDecision: "pass" | "partial" | "fail",
  authStatus: DeploymentAuthorisationStatus,
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  if (decision === "reject") return "rejected";
  if (authStatus === "authorised" && decision === "approve") return "certified";
  if (decision === "defer") return "deferred";
  if (decision === "pending") return "draft";
  if (authStatus === "blocked") return "blocked";
  return "unknown";
}

export type BuildReportParams = {
  reportId?: string | null;
  repositoryVersion: string;
  executiveAcceptanceSummary: string;
  certificationSummary: CertificationSummary | null;
  productionReadinessSummary: ProductionReadinessSummary | null;
  grandKingDecision: GrandKingDecision;
  deploymentAuthorisationStatus: DeploymentAuthorisationStatus;
  outstandingIssues: string[];
  supportingEvidence: string[];
  confidenceScore: number;
  validation: GkagtValidationReport;
  workerId: string;
  prerequisites: PrerequisiteVerification;
  q1110ContractConsumed: Q1110ContractConsumption;
  consumableByQ1201: boolean;
  reReviewStatus: ReReviewStatus;
  decisionComments: string | null;
  decisionTimestamp: string | null;
  packReference: string | null;
  deploymentAuthorisation: DeploymentAuthorisation | null;
  decisionHistoryRefs: string[];
};

export function buildAcceptance(params: BuildReportParams): GrandKingAcceptance {
  const certificationStatus = params.prerequisites.allPrerequisitesMet ? "certified" : params.prerequisites.packDecisionCertify ? "partially_certified" : "blocked";
  return {
    acceptanceId: nextAcceptanceId(),
    repositoryVersion: params.repositoryVersion,
    certificationStatus,
    executiveAcceptancePackReference: params.packReference ?? "none",
    productionReadinessStatus: params.productionReadinessSummary?.overallClassification ?? "missing",
    grandKingDecision: params.grandKingDecision,
    decisionTimestamp: params.decisionTimestamp,
    decisionComments: params.decisionComments,
    deploymentAuthorisationStatus: params.deploymentAuthorisationStatus,
    reReviewStatus: params.reReviewStatus,
    supportingEvidence: params.supportingEvidence,
    auditReference: `gkagt:${params.reportId?.trim() || "pending"}`,
  };
}

export function buildDeploymentAuthorisation(
  acceptanceId: string,
  packReportId: string,
  evidence: string[],
): DeploymentAuthorisation {
  return {
    authorisationId: nextAuthorisationId(),
    issuedAt: new Date().toISOString(),
    acceptanceId,
    packReportId,
    grandKingDecision: "approve",
    deploymentAuthorisationStatus: "authorised",
    evidence,
  };
}

export function buildReport(params: BuildReportParams): GrandKingAcceptanceReport {
  const now = new Date().toISOString();
  const reportId = params.reportId?.trim() || nextReportId();
  const acceptance = buildAcceptance({ ...params, reportId });
  const auditStatus = mapDecisionToAuditStatus(
    params.grandKingDecision,
    params.validation.decision,
    params.deploymentAuthorisationStatus,
  );

  return {
    reportId,
    timestamp: now,
    approvalVersion: GRAND_KING_ACCEPTANCE_GATE_RUNTIME_VERSION,
    engineId: "PILLOW-GKAGT-001",
    missionId: "Q11-10",
    executiveAcceptanceSummary: params.executiveAcceptanceSummary,
    certificationSummary: params.certificationSummary,
    productionReadinessSummary: params.productionReadinessSummary,
    grandKingDecision: params.grandKingDecision,
    deploymentAuthorisationStatus: params.deploymentAuthorisationStatus,
    outstandingIssues: params.outstandingIssues,
    supportingEvidence: params.supportingEvidence,
    auditStatus,
    confidenceScore: params.confidenceScore,
    metadataVersion: GKAGT_METADATA_VERSION,
    reportVersion: GRAND_KING_ACCEPTANCE_GATE_REPORT_VERSION,
    workerId: params.workerId,
    acceptance,
    decisionHistoryRefs: params.decisionHistoryRefs,
    validation: params.validation,
    q1110ContractConsumed: params.q1110ContractConsumed,
    consumableByQ1201: params.consumableByQ1201,
    neverImplementQ1201OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    finalQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    deploymentAuthorisation: params.deploymentAuthorisation,
    reReviewStatus: params.reReviewStatus,
    traceabilityRefs: [
      params.packReference ?? "no-pack",
      `decision=${params.grandKingDecision}`,
      `auth=${params.deploymentAuthorisationStatus}`,
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableApprovalHistory: true,
    preserveAuditHistory: true,
    deterministicGateBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateApprovalEvidence: true,
    neverBypassGrandKingApproval: true,
    neverAuthoriseWithoutApproval: true,
    neverOverrideFailedCertifications: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: GrandKingAcceptanceReport[],
  handshakes: Array<{ target: string; status: string }>,
) {
  return {
    reportVersion: GRAND_KING_ACCEPTANCE_GATE_REPORT_VERSION,
    workerId,
    reports,
    integrations: handshakes,
    metadataVersion: GKAGT_METADATA_VERSION,
    executiveAuthority: "grand_king" as const,
    neverFabricateApprovalEvidence: true as const,
    neverBypassGrandKingApproval: true as const,
    neverAuthoriseWithoutApproval: true as const,
    neverImplementQ1201OrLater: true as const,
    finalQ11Gate: true as const,
  };
}

export function presentProductionReadiness(
  presentation: Omit<ProductionReadinessPresentation, "presentedAt"> & { presentedAt?: string },
): ProductionReadinessPresentation {
  return {
    presentedAt: presentation.presentedAt ?? new Date().toISOString(),
    executiveAcceptanceSummary: presentation.executiveAcceptanceSummary,
    certificationSummary: presentation.certificationSummary,
    productionReadinessSummary: presentation.productionReadinessSummary,
    deploymentRecommendation: presentation.deploymentRecommendation,
    riskSummary: presentation.riskSummary,
    outstandingIssues: presentation.outstandingIssues,
    presentationPayload: presentation.presentationPayload,
    evidence: presentation.evidence,
  };
}
