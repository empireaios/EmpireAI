/** T4-06 — Explain Decisions orchestration controller. */

import { appendExplanationLog } from "./explanation-logging.js";
import {
  ExplainDecisionsManager,
  type ExplainDecisionsEngineBundle,
} from "./explain-decisions-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ExplanationInput,
  ExplanationPerformanceStats,
  ExplanationRunReport,
} from "./types.js";

export class ExplainDecisionsController {
  private config: ExplainDecisionsConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExplanationRunReport | null = null;
  private readonly manager = new ExplainDecisionsManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ExplanationPerformanceStats = {
    totalExplanations: 0,
    successfulExplanations: 0,
    failedExplanations: 0,
    evidenceLinked: 0,
    tradeoffsAnalyzed: 0,
    weakEvidenceWarnings: 0,
    averageExplanationDurationMs: 0,
    peakExplanationDurationMs: 0,
  };

  constructor(
    private readonly engines: ExplainDecisionsEngineBundle,
    config: ExplainDecisionsConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendExplanationLog({
      event: "explain_decisions_initialized",
      level: "info",
      details: "Explain Decisions started",
    });
    try {
      void this.engines.multiProposalGenerator?.getState();
      void this.engines.sideBySideComparison?.getState();
    } catch {
      appendExplanationLog({
        event: "partial_explanation_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendExplanationLog({
      event: "explain_decisions_stop",
      level: "info",
      details: "Explain Decisions stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExplainDecisionsConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExplainDecisionsConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExplanationRunReport | null {
    return this.latestReport;
  }

  getPerformance(): ExplanationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ExplainDecisionsManager {
    return this.manager;
  }

  explain(input: ExplanationInput): ExplanationRunReport {
    if (!this.config.enabled) {
      throw new Error("Explain Decisions is disabled by configuration");
    }
    if (!this.config.supportedExplanationTypes.includes(input.explanationType)) {
      throw new Error(`Unsupported explanation type: ${input.explanationType}`);
    }

    this.status = "loading";

    try {
      this.status = "linking";
      this.status = "explaining";
      const report = this.manager.explain({
        explanationInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "analyzing";
      this.status = "validating";
      this.latestReport = report;

      this.performance.totalExplanations += 1;
      this.performance.evidenceLinked += report.explanation.evidenceReferences.length;
      this.performance.tradeoffsAnalyzed += report.explanation.tradeoffSummary ? 1 : 0;
      this.performance.weakEvidenceWarnings += report.explanation.weakEvidenceNotes.length;
      this.performance.peakExplanationDurationMs = Math.max(
        this.performance.peakExplanationDurationMs,
        report.durationMs,
      );
      this.performance.averageExplanationDurationMs = Math.round(
        (this.performance.averageExplanationDurationMs *
          (this.performance.totalExplanations - 1) +
          report.durationMs) /
          this.performance.totalExplanations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulExplanations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedExplanations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Explanation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordExplanation(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Explanation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedExplanations += 1;
      appendExplanationLog({
        event: "explanation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
