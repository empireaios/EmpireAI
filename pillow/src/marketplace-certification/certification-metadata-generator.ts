/** R1-15 — Certification metadata generator. */

import {
  CERTIFICATION_SCHEMA_VERSION,
  MCT_METADATA_VERSION,
  CERTIFIED_PHASE,
} from "./paths.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MarketplaceCertificationReport,
  MissionValidationResult,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `mct-run-${Date.now()}`;
}

export class CertificationMetadataGenerator {
  buildCertificationReport(input: {
    missionResults: MissionValidationResult[];
    certifiedMissionList: string[];
    connectorValidationStatus: CertificationStatus;
    productNormalizationValidationStatus: CertificationStatus;
    orderNormalizationValidationStatus: CertificationStatus;
    healthMonitoringValidationStatus: CertificationStatus;
    detectedWarnings: string[];
    detectedFailures: string[];
    recoveryStatus: string;
    overallCertificationStatus: CertificationStatus;
    validation: CertificationValidationReport;
    durationMs: number;
  }): MarketplaceCertificationReport {
    return {
      certificationId: buildCertificationReportId(),
      timestamp: new Date().toISOString(),
      certifiedPhase: CERTIFIED_PHASE,
      certifiedMissionList: input.certifiedMissionList,
      missionResults: input.missionResults,
      connectorValidationStatus: input.connectorValidationStatus,
      productNormalizationValidationStatus: input.productNormalizationValidationStatus,
      orderNormalizationValidationStatus: input.orderNormalizationValidationStatus,
      healthMonitoringValidationStatus: input.healthMonitoringValidationStatus,
      detectedWarnings: input.detectedWarnings,
      detectedFailures: input.detectedFailures,
      recoveryStatus: input.recoveryStatus,
      overallCertificationStatus: input.overallCertificationStatus,
      validation: input.validation,
      durationMs: input.durationMs,
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      metadataVersion: MCT_METADATA_VERSION,
    };
  }
}
