/** T4-05 — Side-by-Side Comparison orchestration controller. */

import { appendComparisonLog } from "./comparison-logging.js";
import {
  SideBySideComparisonManager,
  type SideBySideComparisonEngineBundle,
} from "./side-by-side-comparison-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type {
  ComparisonInput,
  ComparisonPerformanceStats,
  ComparisonRunReport,
  EngineStatus,
} from "./types.js";

export class SideBySideComparisonController {
  private config: SideBySideComparisonConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ComparisonRunReport | null = null;
  private readonly manager = new SideBySideComparisonManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ComparisonPerformanceStats = {
    totalComparisons: 0,
    successfulComparisons: 0,
    failedComparisons: 0,
    totalOptionsCompared: 0,
    previewsLinked: 0,
    uxScoresCompared: 0,
    averageComparisonDurationMs: 0,
    peakComparisonDurationMs: 0,
  };

  constructor(
    private readonly engines: SideBySideComparisonEngineBundle,
    config: SideBySideComparisonConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendComparisonLog({
      event: "side_by_side_comparison_initialized",
      level: "info",
      details: "Side-by-Side Comparison started",
    });
    try {
      void this.engines.multiProposalGenerator?.getState();
      void this.engines.previewGenerator?.getState();
    } catch {
      appendComparisonLog({
        event: "partial_comparison_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendComparisonLog({
      event: "side_by_side_comparison_stop",
      level: "info",
      details: "Side-by-Side Comparison stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SideBySideComparisonConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SideBySideComparisonConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ComparisonRunReport | null {
    return this.latestReport;
  }

  getPerformance(): ComparisonPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): SideBySideComparisonManager {
    return this.manager;
  }

  compare(input: ComparisonInput): ComparisonRunReport {
    if (!this.config.enabled) {
      throw new Error("Side-by-Side Comparison is disabled by configuration");
    }
    if (!this.config.supportedComparisonTypes.includes(input.comparisonType)) {
      throw new Error(`Unsupported comparison type: ${input.comparisonType}`);
    }

    this.status = "loading";

    try {
      this.status = "comparing";
      const report = this.manager.compare({
        comparisonInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "highlighting";
      this.status = "validating";
      this.latestReport = report;

      const options = report.comparison.comparedOptions.length;
      this.performance.totalComparisons += 1;
      this.performance.totalOptionsCompared += options;
      this.performance.previewsLinked += report.comparison.sourcePreviewBuildIds.length;
      this.performance.uxScoresCompared += report.comparison.sourceUxScoreIds.length;
      this.performance.peakComparisonDurationMs = Math.max(
        this.performance.peakComparisonDurationMs,
        report.durationMs,
      );
      this.performance.averageComparisonDurationMs = Math.round(
        (this.performance.averageComparisonDurationMs *
          (this.performance.totalComparisons - 1) +
          report.durationMs) /
          this.performance.totalComparisons,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulComparisons += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedComparisons += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Comparison decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordComparison(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Comparison failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedComparisons += 1;
      appendComparisonLog({
        event: "comparison_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
