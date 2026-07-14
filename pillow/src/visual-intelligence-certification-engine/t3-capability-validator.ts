/** T5-10 — T3 Autonomous Builder programme validator. */

import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { ProgrammeValidationResult } from "./types.js";

export class T3CapabilityValidator {
  async validate(
    engine: AutonomousBuilderCertificationEngine,
    config: VisualIntelligenceCertificationConfiguration,
  ): Promise<ProgrammeValidationResult> {
    const started = Date.now();
    appendCertificationLog({
      event: "programme_validation_start",
      level: "info",
      details: "Validating T3 Autonomous Builder",
    });

    const result: ProgrammeValidationResult = {
      programmeId: "T3",
      programmeName: "Autonomous Builder",
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
          result.errors.push("T3 nested certification failed");
        }
      } else {
        const latest = engine.getLatestReport();
        if (latest) {
          result.missionsValidated = latest.missionResults.length;
          result.missionsPassed = latest.missionResults.filter((m) => m.passed).length;
          result.evidenceReferences.push(latest.certificationReportId);
        } else {
          result.warnings.push("No prior T3 certification report — using supervisor sync only");
        }
      }

      if (config.validateHealthReporting && state.health.status === "failed") {
        result.errors.push("T3 health reporting indicates failed status");
      }
      if (supervisor.readinessScore < config.requiredPassThreshold) {
        result.warnings.push(
          `T3 readiness ${supervisor.readinessScore} below threshold ${config.requiredPassThreshold}`,
        );
      }

      result.passed =
        supervisor.valid &&
        result.errors.length === 0 &&
        supervisor.readinessScore >= config.requiredPassThreshold;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "T3 validation failed");
    }

    result.durationMs = Date.now() - started;
    appendCertificationLog({
      event: "programme_validation_end",
      level: result.passed ? "info" : "warn",
      details: `T3 ${result.passed ? "PASS" : "FAIL"} · ${result.durationMs}ms`,
    });
    return result;
  }
}
