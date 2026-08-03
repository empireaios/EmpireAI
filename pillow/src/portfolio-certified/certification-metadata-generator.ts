/** X2-21 — Certification Metadata Generator. */

import { CERTIFIED_MODULE_IDS, PTC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationEngineRecord,
  CertificationRunReport,
  CertificationValidationReport,
  CertifiedModuleId,
  PortfolioCertificationReport,
} from "./types.js";

export class CertificationMetadataGenerator {
  emptyDependencyPresence(): Record<CertifiedModuleId, boolean> {
    const presence = {} as Record<CertifiedModuleId, boolean>;
    for (const id of CERTIFIED_MODULE_IDS) presence[id] = false;
    return presence;
  }

  buildRunReport(input: {
    action: CertificationRunReport["action"];
    engineRecord: CertificationEngineRecord;
    certificationReports: PortfolioCertificationReport[];
    validation: CertificationValidationReport;
    durationMs: number;
  }): CertificationRunReport {
    return {
      certificationRunReportId: `ptc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      certificationReports: input.certificationReports,
      validation: {
        ...input.validation,
        metadataVersion: PTC_METADATA_VERSION,
      },
      durationMs: input.durationMs,
      metadataVersion: PTC_METADATA_VERSION,
    };
  }
}
