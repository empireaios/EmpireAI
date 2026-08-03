/** X2-10 — Certification Metadata Generator. */

import { CERTIFIED_MODULE_IDS, PIC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationEngineRecord,
  CertificationRunReport,
  CertificationValidationReport,
  CertifiedModuleId,
  PortfolioIntelligenceCertificationReport,
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
    certificationReports: PortfolioIntelligenceCertificationReport[];
    validation: CertificationValidationReport;
    durationMs: number;
  }): CertificationRunReport {
    return {
      certificationRunReportId: `pic-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      certificationReports: input.certificationReports,
      validation: {
        ...input.validation,
        metadataVersion: PIC_METADATA_VERSION,
      },
      durationMs: input.durationMs,
      metadataVersion: PIC_METADATA_VERSION,
    };
  }
}
