/** R2-20 — Certification metadata generator. */

import {
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_PHASE,
  SOC_METADATA_VERSION,
} from "./paths.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MissionValidationResult,
  SupplierOperationsCertificationReport,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `soc-run-${Date.now()}`;
}

export class CertificationMetadataGenerator {
  buildCertificationReport(input: {
    missionResults: MissionValidationResult[];
    certifiedMissionList: string[];
    certifiedSupplierModules: string[];
    certifiedProcurementStatus: CertificationStatus;
    certifiedFulfilmentStatus: CertificationStatus;
    certifiedLogisticsStatus: CertificationStatus;
    certifiedWarehouseStatus: CertificationStatus;
    detectedWarnings: string[];
    detectedFailures: string[];
    endToEndValidationResult: "pass" | "partial" | "fail";
    evidenceReferences: string[];
    recoveryStatus: string;
    overallCertificationStatus: CertificationStatus;
    validation: CertificationValidationReport;
    durationMs: number;
  }): SupplierOperationsCertificationReport {
    return {
      certificationId: buildCertificationReportId(),
      timestamp: new Date().toISOString(),
      certifiedPhase: CERTIFIED_PHASE,
      certifiedSupplierModules: input.certifiedSupplierModules,
      certifiedProcurementStatus: input.certifiedProcurementStatus,
      certifiedFulfilmentStatus: input.certifiedFulfilmentStatus,
      certifiedLogisticsStatus: input.certifiedLogisticsStatus,
      certifiedWarehouseStatus: input.certifiedWarehouseStatus,
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
      metadataVersion: SOC_METADATA_VERSION,
    };
  }
}
