import type { EmpireCertificationReport } from "./types.js";
import { EC_METADATA_VERSION } from "./paths.js";

export class CertificationReportGenerator {
  summarize(report: EmpireCertificationReport): string {
    return `Empire Certified ${report.certificationStatus} score=${report.overallReadinessScore} meta=${EC_METADATA_VERSION}`;
  }
}
