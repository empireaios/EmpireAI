import type { LocalBusinessLaunchPackConfiguration } from "./configuration.js";
import {
  LBLP_CAPABILITIES,
  LBLP_METADATA_VERSION,
  LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY,
  LOCAL_BUSINESS_LAUNCH_REPORT_VERSION,
} from "./paths.js";
import type {
  DeliverableVerification,
  IntegrationHandshake,
  LaunchPackage,
  LaunchPackageSections,
  LblpCatalog,
  LocalBusinessLaunchPackValidationReport,
  LocalBusinessLaunchReport,
  ReadinessAssessment,
} from "./types.js";

let collectionSeq = 0;
let verificationSeq = 0;
let packageSeq = 0;
let reportSeq = 0;
let runSeq = 0;
let engineSeq = 0;

export function resetLblpSequenceForTesting() {
  collectionSeq = 0;
  verificationSeq = 0;
  packageSeq = 0;
  reportSeq = 0;
  runSeq = 0;
  engineSeq = 0;
}

export function nextCollectionId() {
  collectionSeq += 1;
  return `lblp-col-${String(collectionSeq).padStart(4, "0")}`;
}

export function nextVerificationId() {
  verificationSeq += 1;
  return `lblp-ver-${String(verificationSeq).padStart(4, "0")}`;
}

export function nextPackageId() {
  packageSeq += 1;
  return `lblp-pkg-${String(packageSeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `lblp-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextRunReportId() {
  runSeq += 1;
  return `lblp-run-${String(runSeq).padStart(4, "0")}`;
}

export function nextEngineRecordId() {
  engineSeq += 1;
  return `lblp-eng-${String(engineSeq).padStart(4, "0")}`;
}

export class LaunchPackageBuilder {
  buildCatalog(
    config: LocalBusinessLaunchPackConfiguration,
    reports: LocalBusinessLaunchReport[],
    packages: LaunchPackage[],
    integrations: IntegrationHandshake[],
  ): LblpCatalog {
    return {
      reportVersion: LOCAL_BUSINESS_LAUNCH_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      packages: packages.map((p) => ({ ...p })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: LBLP_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverLaunchBusinessAutomatically: true,
      neverOverrideGovernance: true,
      neverReplaceCertification: true,
      neverClaimReadinessWithoutEvidence: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ711OrLater: true,
      consumableByQ711: true,
    };
  }

  buildReport(params: {
    packageDoc: LaunchPackage;
    verification: DeliverableVerification;
    sections: LaunchPackageSections;
    readinessAssessment: ReadinessAssessment;
    validation: LocalBusinessLaunchPackValidationReport;
    config: LocalBusinessLaunchPackConfiguration;
    reportId?: string;
  }): LocalBusinessLaunchReport {
    const now = new Date().toISOString();
    return {
      reportId: params.reportId ?? nextReportId(),
      timestamp: now,
      businessProjectId: params.packageDoc.businessProjectId,
      businessName: params.packageDoc.businessName,
      businessType: params.packageDoc.businessType,
      executiveSummary: params.sections.executiveSummary,
      deliverableVerification: cloneVerification(params.verification),
      readinessStatus: params.readinessAssessment.readinessStatus,
      riskSummary: [...params.sections.risks],
      outstandingIssues: [...params.sections.outstandingItems],
      approvalRecommendation: params.sections.approvalRecommendation,
      auditStatus:
        params.readinessAssessment.readinessStatus === "ready_for_approval"
          ? "ready_for_q711"
          : params.verification.presentCount > 0
            ? "verified"
            : "outputs_collected",
      confidenceScore: params.readinessAssessment.confidenceScore,
      metadataVersion: LBLP_METADATA_VERSION,
      reportVersion: LOCAL_BUSINESS_LAUNCH_REPORT_VERSION,
      workerId: params.config.workerId || LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.workerId,
      packageId: params.packageDoc.packageId,
      launchPackage: cloneSections(params.sections),
      readinessAssessment: { ...params.readinessAssessment, notes: [...params.readinessAssessment.notes] },
      validation: { ...params.validation, errors: [...params.validation.errors], warnings: [...params.validation.warnings] },
      runTimestamp: now,
      consumableByQ711: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-10:launch-pack:${params.packageDoc.packageId}`,
        `business_project:${params.packageDoc.businessProjectId}`,
        `collection:${params.packageDoc.collection.collectionId}`,
        `verification:${params.verification.verificationId}`,
        ...params.verification.items
          .filter((item) => item.present)
          .flatMap((item) => item.evidenceRefs),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverLaunchBusinessAutomatically: true,
      neverOverrideGovernance: true,
      neverReplaceCertification: true,
      neverClaimReadinessWithoutEvidence: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ711OrLater: true,
    };
  }
}

export function cloneVerification(verification: DeliverableVerification): DeliverableVerification {
  return {
    ...verification,
    items: verification.items.map((item) => ({ ...item, evidenceRefs: [...item.evidenceRefs] })),
    missingItems: [...verification.missingItems],
    criticalItemsMissing: [...verification.criticalItemsMissing],
  };
}

export function cloneSections(sections: LaunchPackageSections): LaunchPackageSections {
  const cloneSection = (s: LaunchPackageSections["businessOverview"]) => ({
    ...s,
    evidenceRefs: [...s.evidenceRefs],
    data: { ...s.data },
  });
  return {
    ...sections,
    businessOverview: cloneSection(sections.businessOverview),
    targetMarket: cloneSection(sections.targetMarket),
    serviceCatalogue: cloneSection(sections.serviceCatalogue),
    pricingSummary: cloneSection(sections.pricingSummary),
    bookingReadiness: cloneSection(sections.bookingReadiness),
    crmReadiness: cloneSection(sections.crmReadiness),
    whatsAppReadiness: cloneSection(sections.whatsAppReadiness),
    localSeoReadiness: cloneSection(sections.localSeoReadiness),
    leadGenerationReadiness: cloneSection(sections.leadGenerationReadiness),
    operationsReadiness: cloneSection(sections.operationsReadiness),
    risks: [...sections.risks],
    assumptions: [...sections.assumptions],
    outstandingItems: [...sections.outstandingItems],
  };
}

export const ALL_CAPABILITIES = [...LBLP_CAPABILITIES];
