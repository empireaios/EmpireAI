/** T5-10 — T4 Executive Collaboration programme validator. */

import type { ExecutiveCollaborationCertificationEngine } from "../executive-collaboration-certification-engine/engine.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { ProgrammeValidationResult } from "./types.js";

export class T4CapabilityValidator {
  async validate(
    engine: ExecutiveCollaborationCertificationEngine,
    config: VisualIntelligenceCertificationConfiguration,
  ): Promise<ProgrammeValidationResult> {
    const started = Date.now();
    appendCertificationLog({
      event: "programme_validation_start",
      level: "info",
      details: "Validating T4 Executive Collaboration",
    });

    const result: ProgrammeValidationResult = {
      programmeId: "T4",
      programmeName: "Executive Collaboration",
      passed: false,
      healthStatus: "unknown",
      readinessScore: 0,
      missionsValidated: 0,
      missionsPassed: 0,
      details: [],
      warnings: [],
      errors: [],
      evidenceReferences: [],
      durationMs: 0,
    };

    try {
      const state = engine.getState();
      result.healthStatus = state.health.status;
      const supervisor = engine.validateForSupervisorSync();
      result.readinessScore = supervisor.readinessScore;
      result.details.push(`Engine version: ${state.engineVersion}`);
      result.details.push(...supervisor.notes);

      if (config.runNestedProgrammeCertifications) {
        const report = await engine.runCertification();
        result.missionsValidated = report.missionResults.length;
        result.missionsPassed = report.missionResults.filter((m) => m.passed).length;
        result.evidenceReferences.push(report.certificationReportId);
        result.details.push(`Nested certification: ${report.finalCertificationDecision}`);
        if (report.finalCertificationDecision === "fail") {
          result.errors.push("T4 nested certification failed");
        }
      } else {
        const latest = engine.getLatestReport();
        if (latest) {
          result.missionsValidated = latest.missionResults.length;
          result.missionsPassed = latest.missionResults.filter((m) => m.passed).length;
          result.evidenceReferences.push(latest.certificationReportId);
        } else {
          result.warnings.push("No prior T4 certification report — using supervisor sync only");
        }
      }

      if (config.validateHealthReporting && state.health.status === "failed") {
        result.errors.push("T4 health reporting indicates failed status");
      }
      if (supervisor.readinessScore < config.requiredPassThreshold) {
        result.warnings.push(
          `T4 readiness ${supervisor.readinessScore} below threshold ${config.requiredPassThreshold}`,
        );
      }

      result.passed =
        supervisor.valid &&
        result.errors.length === 0 &&
        supervisor.readinessScore >= config.requiredPassThreshold;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "T4 validation failed");
    }

    result.durationMs = Date.now() - started;
    appendCertificationLog({
      event: "programme_validation_end",
      level: result.passed ? "info" : "warn",
      details: `T4 ${result.passed ? "PASS" : "FAIL"} · ${result.durationMs}ms`,
    });
    return result;
  }
}
