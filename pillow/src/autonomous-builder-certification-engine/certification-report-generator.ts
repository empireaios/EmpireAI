/** T3-10 — Certification report generation and persistence. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CERTIFICATION_REPORT_VERSION } from "./paths.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { AutonomousBuilderCertificationConfiguration } from "./configuration.js";
import type {
  AutonomousBuilderCertificationReport,
  CertificationDecision,
  CertificationStatus,
  E2eValidationResult,
  MissionValidationResult,
  PerformanceSummary,
  ProductionSafetySummary,
  RecoveryResult,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `abc-report-${Date.now()}`;
}

export class CertificationReportGenerator {
  generate(input: {
    repositoryRoot: string;
    config: AutonomousBuilderCertificationConfiguration;
    missionResults: MissionValidationResult[];
    e2eResult: E2eValidationResult;
    recoveryResults: RecoveryResult[];
    status: CertificationStatus;
    decision: CertificationDecision;
  }): AutonomousBuilderCertificationReport {
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

    const e2eSteps = input.e2eResult.steps;
    const productionSafety: ProductionSafetySummary = {
      productionSafetyVerified: input.config.validateProductionSafety,
      validationBeforeAcceptance: e2eSteps.some(
        (s) => s.step.includes("validation") && s.passed,
      ),
      regressionProtectionEnforced: e2eSteps.some(
        (s) => s.step.toLowerCase().includes("regression") && s.passed,
      ),
      rollbackCapabilityAvailable: e2eSteps.some(
        (s) => s.step.includes("Rollback") && s.passed,
      ),
      documentationComplete: e2eSteps.some(
        (s) => s.step.toLowerCase().includes("documentation") && s.passed,
      ),
      traceabilityPreserved: input.missionResults.every(
        (m) => m.missionId !== "T3-09" || m.passed,
      ),
      warnings: warnings.filter(
        (w) =>
          w.toLowerCase().includes("production") ||
          w.toLowerCase().includes("safety") ||
          w.toLowerCase().includes("design system"),
      ),
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

    const report: AutonomousBuilderCertificationReport = {
      certificationReportId: buildCertificationReportId(),
      certificationTimestamp: new Date().toISOString(),
      t3CertificationStatus: input.status,
      validatedMissionList: input.missionResults.map((m) => m.missionId),
      missionResults: input.missionResults,
      endToEndValidationResult: input.e2eResult,
      errors,
      warnings,
      recoveryResults: input.recoveryResults,
      performanceSummary: performance,
      productionSafetySummary: productionSafety,
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
    config: AutonomousBuilderCertificationConfiguration,
    report: AutonomousBuilderCertificationReport,
  ): string {
    const dir = join(repositoryRoot, config.reportOutputRoot);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "latest-certification-report.json");
    writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
    return path;
  }
}
