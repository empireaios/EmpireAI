/** R3-18 — Certification report generator. */

import { appendCertificationLog } from "./foc-logging.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  CertificationValidationReport,
  MissionValidationResult,
  FinancialOperationsCertificationReport,
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
  config: FinancialOperationsCertificationConfiguration,
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
    config: FinancialOperationsCertificationConfiguration;
    durationMs: number;
  }): FinancialOperationsCertificationReport {
    const paymentMissions = input.missionResults.filter((r) => r.missionId === "R3-02");
    const bankingMissions = input.missionResults.filter((r) => r.missionId === "R3-03");
    const revenueMissions = input.missionResults.filter((r) => r.missionId === "R3-04");
    const expenseMissions = input.missionResults.filter((r) => r.missionId === "R3-05");
    const profitMissions = input.missionResults.filter((r) => r.missionId === "R3-06");
    const cashFlowMissions = input.missionResults.filter((r) => r.missionId === "R3-07");
    const financialModuleMissions = input.missionResults.filter((r) =>
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
      certifiedFinancialModules: financialModuleMissions
        .filter((m) => m.status !== "fail")
        .map((m) => m.missionId),
      certifiedPaymentStatus: missionStatusToCertification(paymentMissions),
      certifiedBankingStatus: missionStatusToCertification(bankingMissions),
      certifiedRevenueStatus: missionStatusToCertification(revenueMissions),
      certifiedExpenseStatus: missionStatusToCertification(expenseMissions),
      certifiedProfitabilityStatus: missionStatusToCertification(profitMissions),
      certifiedCashFlowStatus: missionStatusToCertification(cashFlowMissions),
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
