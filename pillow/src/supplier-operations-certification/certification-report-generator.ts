/** R2-20 — Certification report generator. */

import { appendCertificationLog } from "./soc-logging.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MissionValidationResult,
  SupplierOperationsCertificationReport,
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
  config: SupplierOperationsCertificationConfiguration,
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
    config: SupplierOperationsCertificationConfiguration;
    durationMs: number;
  }): SupplierOperationsCertificationReport {
    const procurementMissions = input.missionResults.filter((r) =>
      ["R2-07", "R2-08", "R2-09", "R2-19"].includes(r.missionId),
    );
    const fulfilmentMissions = input.missionResults.filter((r) =>
      ["R2-10", "R2-11", "R2-12", "R2-13"].includes(r.missionId),
    );
    const logisticsMissions = input.missionResults.filter((r) =>
      ["R2-17", "R2-18"].includes(r.missionId),
    );
    const warehouseMissions = input.missionResults.filter((r) =>
      ["R2-14", "R2-15"].includes(r.missionId),
    );
    const supplierModuleMissions = input.missionResults.filter((r) =>
      ["R2-01", "R2-02", "R2-03", "R2-04", "R2-05", "R2-06", "R2-16"].includes(r.missionId),
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
      certifiedSupplierModules: supplierModuleMissions
        .filter((m) => m.status !== "fail")
        .map((m) => m.missionId),
      certifiedProcurementStatus: missionStatusToCertification(procurementMissions),
      certifiedFulfilmentStatus: missionStatusToCertification(fulfilmentMissions),
      certifiedLogisticsStatus: missionStatusToCertification(logisticsMissions),
      certifiedWarehouseStatus: missionStatusToCertification(warehouseMissions),
      detectedWarnings: [...detectedWarnings, ...input.validation.warnings],
      detectedFailures: [...detectedFailures, ...input.validation.errors],
      endToEndValidationResult: input.endToEndValidationResult,
      evidenceReferences: input.evidenceReferences,
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
