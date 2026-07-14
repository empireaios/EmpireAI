/** T5-10 — Production readiness validator. */

import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { ProductionReadinessResult, VisualIntelligenceEngineBundle } from "./types.js";

export class ProductionReadinessValidator {
  validate(
    engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
  ): ProductionReadinessResult {
    appendCertificationLog({
      event: "production_readiness_start",
      level: "info",
      details: "Production readiness validation started",
    });

    const subsystems = [
      { name: "T5-01 Observation", health: engines.continuousScreenObservation.getState().health },
      { name: "T5-02 UX Audit", health: engines.autonomousUxAudit.getState().health },
      { name: "T5-03 Opportunity", health: engines.uxOpportunityDiscovery.getState().health },
      { name: "T5-04 Productivity", health: engines.productivityIntelligence.getState().health },
      { name: "T5-05 Workflow", health: engines.workflowEvolution.getState().health },
      { name: "T5-06 Adaptive", health: engines.adaptiveInterface.getState().health },
      { name: "T5-07 UX Evolution", health: engines.continuousUxEvolution.getState().health },
      { name: "T5-08 Workspace", health: engines.executiveWorkspaceIntelligence.getState().health },
      { name: "T5-09 Self-Improving", health: engines.selfImprovingUx.getState().health },
      { name: "Approval Workflow", health: engines.approvalWorkflow.getState().health },
    ];

    const healthy = subsystems.filter(
      (s) => s.health.status === "healthy" || s.health.status === "standby",
    );
    const readinessScore = Math.round((healthy.length / subsystems.length) * 100);
    const details = subsystems.map((s) => `${s.name}: ${s.health.status}`);
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const s of subsystems) {
      if (config.validateHealthReporting && s.health.status === "failed") {
        errors.push(`${s.name} health is failed`);
      } else if (s.health.status === "degraded") {
        warnings.push(`${s.name} health is degraded`);
      }
    }

    const recoveryOperational =
      !config.recoveryVerificationRulesEnabled ||
      subsystems.every((s) => s.health.status !== "failed");

    const passed =
      readinessScore >= config.requiredPassThreshold &&
      errors.length === 0 &&
      recoveryOperational;

    appendCertificationLog({
      event: "production_readiness_end",
      level: passed ? "info" : "warn",
      details: `Production readiness ${passed ? "PASS" : "FAIL"} · score=${readinessScore}`,
    });

    return {
      passed,
      readinessScore,
      subsystemsHealthy: healthy.length,
      subsystemsTotal: subsystems.length,
      recoveryOperational,
      details,
      warnings,
      errors,
    };
  }
}
