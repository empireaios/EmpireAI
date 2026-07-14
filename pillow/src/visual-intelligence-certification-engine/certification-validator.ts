/** T5-10 — Output certification report validator. */

import type { VisualIntelligenceCertificationReport } from "./types.js";

export type CertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export class CertificationValidator {
  validate(report: VisualIntelligenceCertificationReport): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!report.certificationId.startsWith("vic-report-")) {
      errors.push("Invalid certification ID prefix");
    }
    if (!report.timestamp) errors.push("Missing timestamp");
    if (!report.certificationVersion) errors.push("Missing certification version");
    if (report.certifiedProgrammes.length === 0) warnings.push("No certified programmes listed");
    if (report.certifiedMissions.length === 0) warnings.push("No certified missions listed");
    if (!report.governanceComplianceResult.grandKingAuthorityPreserved) {
      errors.push("Grand King authority not preserved");
    }
    if (!report.governanceComplianceResult.learnOnlyModeVerified) {
      errors.push("Learn-only mode not verified");
    }
    if (report.confidenceScore < 0 || report.confidenceScore > 100) {
      errors.push("Confidence score out of range");
    }
    if (report.detectedFailures.length > 0 && report.finalCertificationDecision === "pass") {
      warnings.push("Pass decision with detected failures");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `vic-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: report.metadataVersion,
    };
  }
}
