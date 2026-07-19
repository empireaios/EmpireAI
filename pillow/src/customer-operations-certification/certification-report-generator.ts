/** R4-19 — Certification report generator. */

import { appendCocLog } from "./coc-logging.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MissionValidationResult,
  CustomerOperationsCertificationReport,
} from "./types.js";

function missionStatusToCertification(results: MissionValidationResult[]): CertificationStatus {
  if (results.length === 0) return "pending";
  const fails = results.filter((r) => r.status === "fail").length;
  const partials = results.filter((r) => r.status === "partial").length;
  if (fails > 0) return "failed";
  if (partials > 0) return "partial";
  return "certified";
}

function deriveOverallStatus(
  results: MissionValidationResult[],
  config: CustomerOperationsCertificationConfiguration,
): CertificationStatus {
  if (results.length === 0) return "failed";
  const passed = results.filter((r) => r.status === "pass").length;
  const passPercent = Math.round((passed / results.length) * 100);
  if (passPercent >= config.passThresholdPercent) {
    const hasPartial = results.some((r) => r.status === "partial");
    const hasFail = results.some((r) => r.status === "fail");
    if (hasFail) return "failed";
    return hasPartial ? "partial" : "certified";
  }
  if (passPercent >= Math.floor(config.passThresholdPercent * 0.7)) return "partial";
  return "failed";
}

export class CertificationReportGenerator {
  private readonly metadataGenerator = new CertificationMetadataGenerator();

  generate(input: {
    missionResults: MissionValidationResult[];
    certifiedMissionList: string[];
    endToEndValidationResult: "pass" | "partial" | "fail";
    evidenceReferences: string[];
    validation: CertificationValidationReport;
    recoveryStatus: string;
    config: CustomerOperationsCertificationConfiguration;
    durationMs: number;
  }): CustomerOperationsCertificationReport {
    const identityMissions = input.missionResults.filter((r) => r.missionId === "R4-01");
    const crmMissions = input.missionResults.filter((r) =>
      ["R4-02", "R4-03"].includes(r.missionId),
    );
    const communicationMissions = input.missionResults.filter((r) =>
      ["R4-04", "R4-05", "R4-06", "R4-07"].includes(r.missionId),
    );
    const supportMissions = input.missionResults.filter((r) =>
      ["R4-08", "R4-09"].includes(r.missionId),
    );
    const analyticsMissions = input.missionResults.filter((r) =>
      ["R4-10", "R4-11", "R4-12", "R4-13", "R4-14", "R4-15"].includes(r.missionId),
    );
    const intelligenceMissions = input.missionResults.filter((r) =>
      ["R4-16", "R4-17", "R4-18"].includes(r.missionId),
    );
    const customerModuleMissions = input.missionResults.filter((r) =>
      input.certifiedMissionList.includes(r.missionId),
    );

    const detectedFailures = input.missionResults.flatMap((m) =>
      m.errors.map((e) => `${m.missionId}: ${e}`),
    );
    const detectedWarnings = input.missionResults.flatMap((m) =>
      m.warnings.map((w) => `${m.missionId}: ${w}`),
    );

    const report = this.metadataGenerator.buildCertificationReport({
      missionResults: input.missionResults,
      certifiedMissionList: input.certifiedMissionList,
      certifiedCustomerModules: customerModuleMissions
        .filter((m) => m.status !== "fail")
        .map((m) => m.missionId),
      certifiedCrmStatus: missionStatusToCertification(crmMissions),
      certifiedCommunicationStatus: missionStatusToCertification(communicationMissions),
      certifiedSupportStatus: missionStatusToCertification(supportMissions),
      certifiedAnalyticsStatus: missionStatusToCertification(analyticsMissions),
      certifiedCustomerIntelligenceStatus: missionStatusToCertification(intelligenceMissions),
      detectedWarnings: [...detectedWarnings, ...input.validation.warnings],
      detectedFailures: [...detectedFailures, ...input.validation.errors],
      endToEndValidationResult: input.endToEndValidationResult,
      evidenceReferences: input.evidenceReferences,
      recoveryStatus: input.recoveryStatus,
      overallCertificationStatus: deriveOverallStatus(input.missionResults, input.config),
      validation: input.validation,
      durationMs: input.durationMs,
    });

    if (identityMissions.some((m) => m.status === "fail")) {
      report.detectedFailures.push("R4-01: Customer identity validation failed");
    }

    appendCocLog({
      event: "report_generation",
      level: report.overallCertificationStatus === "failed" ? "warn" : "info",
      details: `Report ${report.certificationId} · status=${report.overallCertificationStatus}`,
    });

    return report;
  }
}
