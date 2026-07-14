/** T1-10 — Certification report generation and persistence. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CERTIFICATION_REPORT_VERSION } from "./paths.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { VisualFoundationCertificationConfiguration } from "./configuration.js";
import type {
  CertificationDecision,
  CertificationStatus,
  DataSafetySummary,
  E2eValidationResult,
  MissionValidationResult,
  PerformanceSummary,
  RecoveryResult,
  VisualFoundationCertificationReport,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `vfc-report-${Date.now()}`;
}

export class CertificationReportGenerator {
  generate(input: {
    repositoryRoot: string;
    config: VisualFoundationCertificationConfiguration;
    missionResults: MissionValidationResult[];
    e2eResult: E2eValidationResult;
    recoveryResults: RecoveryResult[];
    status: CertificationStatus;
    decision: CertificationDecision;
  }): VisualFoundationCertificationReport {
    const errors = input.missionResults.flatMap((m) =>
      m.errors.map((e) => `${m.missionId}: ${e}`),
    );
    const warnings = input.missionResults.flatMap((m) =>
      m.warnings.map((w) => `${m.missionId}: ${w}`),
    );
    if (!input.e2eResult.passed) {
      errors.push(`E2E: ${input.e2eResult.summary}`);
    }

    const missionsPassed = input.missionResults.filter((m) => m.passed).length;
    const missionsFailed = input.missionResults.length - missionsPassed;
    const totalMissionDuration = input.missionResults.reduce((s, m) => s + m.durationMs, 0);

    const dataSafety: DataSafetySummary = {
      sensitiveMaskingActive: input.missionResults
        .filter((m) => ["T1-06", "T1-08", "T1-09"].includes(m.missionId))
        .every((m) => m.details.some((d) => d.includes("masking active"))),
      missionsWithMasking: input.missionResults
        .filter((m) => m.details.some((d) => d.includes("masking active")))
        .map((m) => m.missionId),
      warnings: warnings.filter((w) => w.toLowerCase().includes("sensitive")),
    };

    const performance: PerformanceSummary = {
      totalDurationMs: totalMissionDuration + input.e2eResult.durationMs,
      missionsValidated: input.missionResults.length,
      missionsPassed,
      missionsFailed,
      averageMissionDurationMs:
        input.missionResults.length > 0
          ? Math.round(totalMissionDuration / input.missionResults.length)
          : 0,
      endToEndDurationMs: input.e2eResult.durationMs,
    };

    const report: VisualFoundationCertificationReport = {
      certificationReportId: buildCertificationReportId(),
      certificationTimestamp: new Date().toISOString(),
      t1CertificationStatus: input.status,
      validatedMissionList: input.missionResults.map((m) => m.missionId),
      missionResults: input.missionResults,
      endToEndValidationResult: input.e2eResult,
      errors,
      warnings,
      recoveryResults: input.recoveryResults,
      performanceSummary: performance,
      dataSafetySummary: dataSafety,
      finalCertificationDecision: input.decision,
      metadataVersion: CERTIFICATION_REPORT_VERSION,
      reportOutputPath: null,
    };

    report.reportOutputPath = this.persist(input.repositoryRoot, input.config, report);
    appendCertificationLog({
      event: "report_generation",
      level: "info",
      details: `Report ${report.certificationReportId} · decision=${report.finalCertificationDecision}`,
    });

    return report;
  }

  private persist(
    repositoryRoot: string,
    config: VisualFoundationCertificationConfiguration,
    report: VisualFoundationCertificationReport,
  ): string {
    const dir = join(repositoryRoot, config.reportOutputRoot);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "latest-certification-report.json");
    writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
    return path;
  }
}
