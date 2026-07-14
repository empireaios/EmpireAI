/** T5-10 — End-to-end Visual Intelligence lifecycle validator. */

import { appendCertificationLog } from "./certification-logging.js";
import type { E2eValidationResult, VisualIntelligenceEngineBundle } from "./types.js";

export class EndToEndVisualIntelligenceValidator {
  async run(engines: VisualIntelligenceEngineBundle): Promise<E2eValidationResult> {
    const started = Date.now();
    const steps: E2eValidationResult["steps"] = [];

    appendCertificationLog({
      event: "e2e_validation_start",
      level: "info",
      details: "End-to-end Visual Intelligence validation started",
    });

    const runStep = (step: string, fn: () => boolean, details: string) => {
      try {
        const passed = fn();
        steps.push({ step, passed, details });
        return passed;
      } catch (error) {
        steps.push({
          step,
          passed: false,
          details: error instanceof Error ? error.message : details,
        });
        return false;
      }
    };

    const hasRecordCount = (count: number, latest: unknown[] | null | undefined) =>
      count > 0 || (latest?.length ?? 0) > 0;

    runStep(
        "visual_observation",
        () => {
          const report = engines.continuousScreenObservation.observe({
            uiSnapshot: {
              screenId: "vic-e2e-screen",
              routeOrViewId: "/certify",
              surfaceStates: ["ready"],
            },
          });
          return Boolean(report.observation?.observationId);
        },
        "Continuous screen observation produces records",
      );

      runStep(
        "ux_audit",
        () => {
          const report = engines.autonomousUxAudit.audit();
          return Boolean(report.audit?.auditId);
        },
        "Autonomous UX audit produces records",
      );

      runStep(
        "opportunity_discovery",
        () => {
          const report = engines.uxOpportunityDiscovery.discover();
          return report.opportunities.length > 0;
        },
        "UX opportunity discovery produces records",
      );

      runStep(
        "productivity_intelligence",
        () => {
          const report = engines.productivityIntelligence.learn();
          const state = engines.productivityIntelligence.getState();
          return hasRecordCount(report.records.length, state.latestReport?.records);
        },
        "Productivity intelligence produces records",
      );

      runStep(
        "workflow_evolution",
        () => {
          const report = engines.workflowEvolution.evolve();
          const state = engines.workflowEvolution.getState();
          return hasRecordCount(report.records.length, state.latestReport?.records);
        },
        "Workflow evolution produces records",
      );

      runStep(
        "adaptive_interface",
        () => {
          const report = engines.adaptiveInterface.adapt();
          const state = engines.adaptiveInterface.getState();
          return hasRecordCount(report.records.length, state.latestReport?.records);
        },
        "Adaptive interface produces records",
      );

      runStep(
        "ux_evolution",
        () => {
          const report = engines.continuousUxEvolution.optimize();
          const state = engines.continuousUxEvolution.getState();
          return hasRecordCount(report.records.length, state.latestReport?.records);
        },
        "Continuous UX evolution produces records",
      );

      runStep(
        "workspace_intelligence",
        () => {
          const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
          const state = engines.executiveWorkspaceIntelligence.getState();
          return hasRecordCount(report.records.length, state.latestReport?.records);
        },
        "Executive workspace intelligence produces records",
      );

      runStep(
        "self_improving_ux",
        () => {
          const report = engines.selfImprovingUx.learnUx();
          const state = engines.selfImprovingUx.getState();
          const records =
            report.records.length > 0
              ? report.records
              : (state.latestReport?.records ?? []);
          return records.length > 0 && records.every((r) => r.learnOnly === true);
        },
        "Self-improving UX learning produces learn-only records",
      );

      runStep(
        "approval_governance",
        () => {
          const state = engines.approvalWorkflow.getState();
          return state.health.status !== "failed";
        },
        "Approval workflow remains operational (Grand King gate)",
      );

    const passed = steps.length > 0 && steps.every((s) => s.passed);
    const durationMs = Date.now() - started;

    appendCertificationLog({
      event: "e2e_validation_end",
      level: passed ? "info" : "warn",
      details: `E2E ${passed ? "PASS" : "FAIL"} · ${steps.filter((s) => s.passed).length}/${steps.length} steps · ${durationMs}ms`,
    });

    return {
      passed,
      steps,
      durationMs,
      summary: passed
        ? `All ${steps.length} Visual Intelligence lifecycle steps passed`
        : `${steps.filter((s) => !s.passed).length} lifecycle step(s) failed`,
    };
  }
}
