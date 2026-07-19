/** R3-18 — Certification metadata generator. */

import {
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_PHASE,
  FOC_METADATA_VERSION,
} from "./paths.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MissionValidationResult,
  FinancialOperationsCertificationReport,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `foc-run-${Date.now()}`;
}

export class CertificationMetadataGenerator {
  buildCertificationReport(input: {
    missionResults: MissionValidationResult[];
    certifiedMissionList: string[];
    certifiedFinancialModules: string[];
    certifiedPaymentStatus: CertificationStatus;
    certifiedBankingStatus: CertificationStatus;
    certifiedRevenueStatus: CertificationStatus;
    certifiedExpenseStatus: CertificationStatus;
    certifiedProfitabilityStatus: CertificationStatus;
    certifiedCashFlowStatus: CertificationStatus;
    detectedWarnings: string[];
    detectedFailures: string[];
    endToEndValidationResult: "pass" | "partial" | "fail";
    evidenceReferences: string[];
    recoveryStatus: string;
    overallCertificationStatus: CertificationStatus;
    validation: CertificationValidationReport;
    durationMs: number;
  }): FinancialOperationsCertificationReport {
    return {
      certificationId: buildCertificationReportId(),
      timestamp: new Date().toISOString(),
      certifiedPhase: CERTIFIED_PHASE,
      certifiedFinancialModules: input.certifiedFinancialModules,
      certifiedPaymentStatus: input.certifiedPaymentStatus,
      certifiedBankingStatus: input.certifiedBankingStatus,
      certifiedRevenueStatus: input.certifiedRevenueStatus,
      certifiedExpenseStatus: input.certifiedExpenseStatus,
      certifiedProfitabilityStatus: input.certifiedProfitabilityStatus,
      certifiedCashFlowStatus: input.certifiedCashFlowStatus,
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
      metadataVersion: FOC_METADATA_VERSION,
    };
  }
}
