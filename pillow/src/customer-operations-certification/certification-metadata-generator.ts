/** R4-19 — Certification metadata generator. */

import {
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_PHASE,
  COC_METADATA_VERSION,
} from "./paths.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MissionValidationResult,
  CustomerOperationsCertificationReport,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `coc-run-${Date.now()}`;
}

export class CertificationMetadataGenerator {
  buildCertificationReport(input: {
    missionResults: MissionValidationResult[];
    certifiedMissionList: string[];
    certifiedCustomerModules: string[];
    certifiedCrmStatus: CertificationStatus;
    certifiedCommunicationStatus: CertificationStatus;
    certifiedSupportStatus: CertificationStatus;
    certifiedAnalyticsStatus: CertificationStatus;
    certifiedCustomerIntelligenceStatus: CertificationStatus;
    detectedWarnings: string[];
    detectedFailures: string[];
    endToEndValidationResult: "pass" | "partial" | "fail";
    evidenceReferences: string[];
    recoveryStatus: string;
    overallCertificationStatus: CertificationStatus;
    validation: CertificationValidationReport;
    durationMs: number;
  }): CustomerOperationsCertificationReport {
    return {
      certificationId: buildCertificationReportId(),
      timestamp: new Date().toISOString(),
      certifiedPhase: CERTIFIED_PHASE,
      certifiedCustomerModules: input.certifiedCustomerModules,
      certifiedCrmStatus: input.certifiedCrmStatus,
      certifiedCommunicationStatus: input.certifiedCommunicationStatus,
      certifiedSupportStatus: input.certifiedSupportStatus,
      certifiedAnalyticsStatus: input.certifiedAnalyticsStatus,
      certifiedCustomerIntelligenceStatus: input.certifiedCustomerIntelligenceStatus,
      certifiedMissionList: input.certifiedMissionList,
      missionResults: input.missionResults,
      detectedWarnings: input.detectedWarnings,
      detectedFailures: input.detectedFailures,
      endToEndValidationResult: input.endToEndValidationResult,
      evidenceReferences: input.evidenceReferences,
      recoveryStatus: input.recoveryStatus,
      overallCertificationStatus: input.overallCertificationStatus,
      validation: input.validation,
      durationMs: input.durationMs,
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      metadataVersion: COC_METADATA_VERSION,
    };
  }

  toMachineReadable(report: CustomerOperationsCertificationReport): Record<string, unknown> {
    return { ...report };
  }
}
