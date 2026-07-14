/** T4-10 — Certification report generation and persistence. */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CERTIFICATION_REPORT_VERSION } from "./paths.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { ExecutiveCollaborationCertificationConfiguration } from "./configuration.js";
import type {
  CertificationDecision,
  CertificationStatus,
  E2eValidationResult,
  ExecutiveCollaborationCertificationReport,
  GovernanceSummary,
  MissionValidationResult,
  PerformanceSummary,
  RecoveryResult,
} from "./types.js";

export function buildCertificationReportId(): string {
  return `exc-report-${Date.now()}`;
}

export class CertificationReportGenerator {
  generate(input: {
    repositoryRoot: string;
    config: ExecutiveCollaborationCertificationConfiguration;
    missionResults: MissionValidationResult[];
    e2eResult: E2eValidationResult;
    recoveryResults: RecoveryResult[];
    status: CertificationStatus;
    decision: CertificationDecision;
  }): ExecutiveCollaborationCertificationReport {
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

    const governance: GovernanceSummary = {
      grandKingAuthorityPreserved: e2eSteps.some(
        (s) => s.step.includes("Grand King approval") && s.passed,
      ),
      approvalRequiredBeforeUxChanges: e2eSteps.some(
        (s) => s.step.includes("blocks unapproved") && s.passed,
      ),
      noAutomaticApprovals: !errors.some((e) =>
        e.toLowerCase().includes("auto-approve"),
      ),
      noAutomaticUxExecution: e2eSteps.every(
        (s) => !s.details.includes("auto-executed"),
      ),
      traceabilityPreserved: input.missionResults.every((m) => m.details.length > 0),
      collaborationTransparencyVerified: e2eSteps.some(
        (s) => s.step.includes("Continuous collaboration") && s.passed,
      ),
      warnings: warnings.filter(
        (w) =>
          w.toLowerCase().includes("governance") ||
          w.toLowerCase().includes("approval") ||
          w.toLowerCase().includes("grand king"),
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

    const report: ExecutiveCollaborationCertificationReport = {
      certificationReportId: buildCertificationReportId(),
      certificationTimestamp: new Date().toISOString(),
      t4CertificationStatus: input.status,
      validatedMissionList: input.missionResults.map((m) => m.missionId),
      missionResults: input.missionResults,
      endToEndValidationResult: input.e2eResult,
      errors,
      warnings,
      recoveryResults: input.recoveryResults,
      performanceSummary: performance,
      governanceSummary: governance,
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
    config: ExecutiveCollaborationCertificationConfiguration,
    report: ExecutiveCollaborationCertificationReport,
  ): string {
    const dir = join(repositoryRoot, config.reportOutputRoot);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "latest-certification-report.json");
    writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
    return path;
  }
}
