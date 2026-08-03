/** X1-15 — Certification Metadata Generator. */

import {
  CFC_CAPABILITIES,
  CFC_METADATA_VERSION,
  CERTIFIED_MODULE_IDS,
  COMPANY_FACTORY_CERTIFIED_ID,
} from "./paths.js";
import type {
  CertificationEngineRecord,
  CertificationRunReport,
  CertificationValidationReport,
  CompanyFactoryCertificationReport,
  HealthStatus,
  OperationalState,
  ValidationStatus,
} from "./types.js";

export class CertificationMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: OperationalState;
    validationStatus: ValidationStatus;
    dependencyPresence: CertificationEngineRecord["dependencyPresence"];
    healthStatus?: HealthStatus;
  }): CertificationEngineRecord {
    return {
      engineRecordId: `cfc-eng-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      engineId: COMPANY_FACTORY_CERTIFIED_ID,
      engineVersion: "PILLOW-CFC-001",
      currentOperationalState: input.operationalState,
      healthStatus:
        input.healthStatus ??
        (input.operationalState === "failed"
          ? "failed"
          : input.operationalState === "suspended"
            ? "degraded"
            : "healthy"),
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CFC_CAPABILITIES],
      frameworkModuleId: input.frameworkModuleId,
      dependencyPresence: input.dependencyPresence,
      metadataVersion: CFC_METADATA_VERSION,
    };
  }

  emptyDependencyPresence(): CertificationEngineRecord["dependencyPresence"] {
    return Object.fromEntries(CERTIFIED_MODULE_IDS.map((id) => [id, false])) as CertificationEngineRecord["dependencyPresence"];
  }

  buildRunReport(input: {
    action: CertificationRunReport["action"];
    engineRecord: CertificationEngineRecord;
    certificationReports: CompanyFactoryCertificationReport[];
    validation: CertificationValidationReport;
    durationMs: number;
  }): CertificationRunReport {
    return {
      certificationRunReportId: `cfc-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      certificationReports: input.certificationReports,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CFC_METADATA_VERSION,
    };
  }
}
