import { Q8_MISSIONS } from "./mission-catalog.js";
import { nextReportId } from "./certification-store.js";
import { AFCRT_METADATA_VERSION, AFFILIATE_CERTIFICATION_REPORT_VERSION } from "./paths.js";
import type {
  AuditStatus,
  CertificationDecision,
  ComponentStatusRow,
  DeliverableVerification,
  GovernanceCompliance,
  IntegrationHandshake,
  IntegrationVerification,
  LaunchPackContractConsumption,
  LbcCatalog,
  AffiliateCertificationReport,
  AffiliateCertificationValidationReport,
  OperationalReadiness,
  ProductionReadiness,
  ReportingCapability,
  WorkflowCompleteness,
} from "./types.js";

export function buildDeliverableVerification(
  matrix: ComponentStatusRow[],
): DeliverableVerification {
  const items = matrix.map((row) => ({
    missionId: row.missionId,
    label: row.expectedDeliverable,
    present: row.status === "Completed",
    critical: true as const,
    evidenceRefs: [row.moduleEvidence, row.finalPassEvidence, row.runtimeEvidence].filter(Boolean),
    notes: row.reason,
  }));
  const presentCount = items.filter((i) => i.present).length;
  const missingItems = items.filter((i) => !i.present).map((i) => i.missionId);
  return {
    verificationId: `afcrt-ver-${Date.now()}`,
    verifiedAt: new Date().toISOString(),
    items,
    requiredCount: items.length,
    presentCount,
    allRequiredPresent: presentCount === items.length,
    missingItems,
    criticalItemsMissing: missingItems,
  };
}

export function computeConfidenceScore(matrix: ComponentStatusRow[]): number {
  if (matrix.length === 0) return 0;
  const completed = matrix.filter((row) => row.status === "Completed").length;
  return Math.round((completed / matrix.length) * 100) / 100;
}

export function buildRisksAndFindings(
  matrix: ComponentStatusRow[],
  integration: IntegrationVerification,
  productionReadiness: ProductionReadiness,
  governanceCompliance: GovernanceCompliance,
  operationalReadiness: OperationalReadiness,
  workflowCompleteness: WorkflowCompleteness,
): { risks: string[]; outstandingFindings: string[] } {
  const risks: string[] = [];
  const outstandingFindings: string[] = [];

  for (const row of matrix) {
    if (row.status === "Missing") {
      risks.push(`${row.missionId} (${row.missionName}) module is missing from the repository`);
      outstandingFindings.push(`${row.missionId}: module not found — implementation required upstream`);
    } else if (row.status === "Broken / Deviating") {
      risks.push(`${row.missionId} (${row.missionName}) evidence is broken or deviating: ${row.reason}`);
      outstandingFindings.push(`${row.missionId}: ${row.reason}`);
    } else if (row.status === "Partially Implemented") {
      risks.push(`${row.missionId} (${row.missionName}) is only partially implemented: ${row.reason}`);
      outstandingFindings.push(`${row.missionId}: ${row.reason}`);
    } else if (row.status === "Intentionally Deferred") {
      outstandingFindings.push(`${row.missionId}: intentionally deferred — ${row.reason}`);
    }
  }

  for (const row of integration.rows) {
    if (!row.allBound) {
      risks.push(`${row.missionId} integration incomplete: missing binds [${row.missingBinds.join(",")}]`);
      outstandingFindings.push(`${row.missionId}: integration binds missing [${row.missingBinds.join(",")}]`);
    }
  }

  if (!governanceCompliance.compliant) {
    for (const doc of governanceCompliance.missingDocs) {
      risks.push(`Governance document missing or incomplete: ${doc}`);
      outstandingFindings.push(`Governance: ${doc} missing or missing required label`);
    }
  }

  if (!operationalReadiness.ready && operationalReadiness.totalCount > 0) {
    outstandingFindings.push(
      `Operational readiness incomplete: ${operationalReadiness.reachableCount}/${operationalReadiness.totalCount} injected workers reachable`,
    );
  }

  if (!workflowCompleteness.complete) {
    for (const stage of workflowCompleteness.stages) {
      if (!stage.dependenciesSatisfied) {
        outstandingFindings.push(`${stage.missionId}: workflow dependency chain incomplete — ${stage.evidence}`);
      }
    }
  }

  if (!productionReadiness.ready) {
    outstandingFindings.push(
      `Production readiness incomplete: ${productionReadiness.finalPassCount}/${productionReadiness.finalPassTotal} missions carry prior FINAL PASS evidence`,
    );
  }

  return { risks, outstandingFindings };
}

export function mapDecisionToAuditStatus(
  decision: CertificationDecision,
  validationDecision: "pass" | "partial" | "fail",
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  switch (decision) {
    case "Certified":
      return "certified";
    case "Conditionally_Certified":
      return "conditionally_certified";
    case "Not_Certified":
      return "not_certified";
    case "Failed":
      return "failed";
    case "Deferred":
      return "deferred";
    default:
      return "unknown";
  }
}

export function buildTraceabilityRefs(
  matrix: ComponentStatusRow[],
  deliverableVerification: DeliverableVerification,
): string[] {
  return [
    "q8-11:affiliate-certification",
    ...matrix.map((row) => `mission:${row.missionId}:module:${row.modulePath}`),
    ...deliverableVerification.items
      .filter((item) => item.present)
      .flatMap((item) => item.evidenceRefs),
  ];
}

export type BuildReportParams = {
  reportId?: string | null;
  factoryName: string;
  componentStatusMatrix: ComponentStatusRow[];
  deliverableVerification: DeliverableVerification;
  integrationVerification: IntegrationVerification;
  productionReadiness: ProductionReadiness;
  governanceCompliance: GovernanceCompliance;
  operationalReadiness: OperationalReadiness;
  workflowCompleteness: WorkflowCompleteness;
  reportingCapability: ReportingCapability;
  launchPackContractConsumed: LaunchPackContractConsumption;
  certificationDecision: CertificationDecision;
  risks: string[];
  outstandingFindings: string[];
  validation: AffiliateCertificationValidationReport;
  workerId: string;
};

export function buildReport(params: BuildReportParams): AffiliateCertificationReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.componentStatusMatrix);
  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    factoryName: params.factoryName,
    certificationScope: Q8_MISSIONS.map((m) => m.missionId),
    componentStatusMatrix: params.componentStatusMatrix,
    deliverableVerification: params.deliverableVerification,
    integrationVerification: params.integrationVerification,
    productionReadiness: params.productionReadiness,
    governanceCompliance: params.governanceCompliance,
    operationalReadiness: params.operationalReadiness,
    workflowCompleteness: params.workflowCompleteness,
    reportingCapability: params.reportingCapability,
    launchPackContractConsumed: params.launchPackContractConsumed,
    risks: params.risks,
    outstandingFindings: params.outstandingFindings,
    certificationDecision: params.certificationDecision,
    auditStatus: mapDecisionToAuditStatus(params.certificationDecision, params.validation.decision),
    confidenceScore,
    metadataVersion: AFCRT_METADATA_VERSION,
    reportVersion: AFFILIATE_CERTIFICATION_REPORT_VERSION,
    workerId: params.workerId,
    validation: params.validation,
    runTimestamp: now,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: buildTraceabilityRefs(params.componentStatusMatrix, params.deliverableVerification),
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    neverFabricateVerificationResults: true,
    neverCertifyUnsupportedFunctionality: true,
    neverImplementMissingFunctionality: true,
    neverAutoCorrectFailedImplementations: true,
    neverOverrideGovernance: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ901OrLater: true,
    finalQ8Gate: true,
    consumableByFutureSeries: false,
  };
}

export function buildCatalog(
  workerId: string,
  reports: AffiliateCertificationReport[],
  integrations: IntegrationHandshake[],
): LbcCatalog {
  return {
    reportVersion: AFFILIATE_CERTIFICATION_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: AFCRT_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateVerificationResults: true,
    neverCertifyUnsupportedFunctionality: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ901OrLater: true,
    finalQ8Gate: true,
  };
}
