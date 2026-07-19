/** R1-15 — Certification report generator. */

import { appendCertificationLog } from "./mct-logging.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import type { MarketplaceCertificationConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MarketplaceCertificationReport,
  MissionValidationResult,
} from "./types.js";

function missionStatusToCertification(
  results: MissionValidationResult[],
): CertificationStatus {
  if (results.length === 0) return "pending";
  const fails = results.filter((r) => r.status === "fail").length;
  const partials = results.filter((r) => r.status === "partial").length;
  if (fails > 0) return "failed";
  if (partials > 0) return "partial";
  return "certified";
}

function deriveOverallStatus(
  results: MissionValidationResult[],
  config: MarketplaceCertificationConfiguration,
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
    validation: CertificationValidationReport;
    recoveryStatus: string;
    config: MarketplaceCertificationConfiguration;
    durationMs: number;
  }): MarketplaceCertificationReport {
    const connectorMissions = input.missionResults.filter((r) =>
      ["R1-01", "R1-02", "R1-03", "R1-04", "R1-05", "R1-06", "R1-07", "R1-08", "R1-09", "R1-10", "R1-11"].includes(
        r.missionId,
      ),
    );
    const productNorm = input.missionResults.filter((r) => r.missionId === "R1-12");
    const orderNorm = input.missionResults.filter((r) => r.missionId === "R1-13");
    const healthMon = input.missionResults.filter((r) => r.missionId === "R1-14");

    const detectedFailures = input.missionResults.flatMap((m) =>
      m.errors.map((e) => `${m.missionId}: ${e}`),
    );
    const detectedWarnings = input.missionResults.flatMap((m) =>
      m.warnings.map((w) => `${m.missionId}: ${w}`),
    );

    const report = this.metadataGenerator.buildCertificationReport({
      missionResults: input.missionResults,
      certifiedMissionList: input.certifiedMissionList,
      connectorValidationStatus: missionStatusToCertification(connectorMissions),
      productNormalizationValidationStatus: missionStatusToCertification(productNorm),
      orderNormalizationValidationStatus: missionStatusToCertification(orderNorm),
      healthMonitoringValidationStatus: missionStatusToCertification(healthMon),
      detectedWarnings: [...detectedWarnings, ...input.validation.warnings],
      detectedFailures: [...detectedFailures, ...input.validation.errors],
      recoveryStatus: input.recoveryStatus,
      overallCertificationStatus: deriveOverallStatus(input.missionResults, input.config),
      validation: input.validation,
      durationMs: input.durationMs,
    });

    appendCertificationLog({
      event: "report_generation",
      level: report.overallCertificationStatus === "failed" ? "warn" : "info",
      details: `Report ${report.certificationId} · status=${report.overallCertificationStatus}`,
    });

    return report;
  }
}
