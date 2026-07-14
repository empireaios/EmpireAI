/** T4-03 — Screen Annotation orchestration controller. */

import { appendAnnotationLog } from "./annotation-logging.js";
import {
  ScreenAnnotationManager,
  type ScreenAnnotationEngineBundle,
} from "./screen-annotation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import type {
  AnnotationInput,
  AnnotationPerformanceStats,
  AnnotationRunReport,
  EngineStatus,
} from "./types.js";

export class ScreenAnnotationController {
  private config: ScreenAnnotationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AnnotationRunReport | null = null;
  private readonly manager = new ScreenAnnotationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AnnotationPerformanceStats = {
    totalAnnotations: 0,
    successfulAnnotations: 0,
    failedAnnotations: 0,
    totalIntentsGenerated: 0,
    clarificationsRequested: 0,
    uxFindingsLinked: 0,
    averageAnnotationDurationMs: 0,
    peakAnnotationDurationMs: 0,
  };

  constructor(
    private readonly engines: ScreenAnnotationEngineBundle,
    config: ScreenAnnotationConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendAnnotationLog({
      event: "screen_annotation_engine_initialized",
      level: "info",
      details: "Screen Annotation started",
    });
    try {
      void this.engines.uiStateMapper?.getState();
      void this.engines.autonomousBuilderCertification?.getState();
    } catch {
      appendAnnotationLog({
        event: "partial_annotation_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendAnnotationLog({
      event: "screen_annotation_engine_stop",
      level: "info",
      details: "Screen Annotation stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ScreenAnnotationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ScreenAnnotationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AnnotationRunReport | null {
    return this.latestReport;
  }

  getPerformance(): AnnotationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ScreenAnnotationManager {
    return this.manager;
  }

  annotate(annotation: AnnotationInput): AnnotationRunReport {
    if (!this.config.enabled) {
      throw new Error("Screen Annotation is disabled by configuration");
    }

    this.status = "capturing";

    try {
      this.status = "mapping";
      const report = this.manager.annotate({
        annotation,
        config: this.config,
        engines: this.engines,
      });

      const latest = report.latestAnnotation;
      if (latest?.processingStatus === "awaiting_clarification") {
        this.status = "clarifying";
      } else {
        this.status = "generating";
      }

      this.latestReport = report;
      this.performance.totalAnnotations += 1;
      this.performance.totalIntentsGenerated += report.latestIntent ? 1 : 0;
      this.performance.clarificationsRequested += report.latestIntent?.clarificationRequirement
        ? 1
        : 0;
      this.performance.uxFindingsLinked += latest?.linkedUxFindingIds.length ?? 0;
      this.performance.peakAnnotationDurationMs = Math.max(
        this.performance.peakAnnotationDurationMs,
        report.durationMs,
      );
      this.performance.averageAnnotationDurationMs = Math.round(
        (this.performance.averageAnnotationDurationMs *
          (this.performance.totalAnnotations - 1) +
          report.durationMs) /
          this.performance.totalAnnotations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulAnnotations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedAnnotations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Annotation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordAnnotation(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Annotation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedAnnotations += 1;
      appendAnnotationLog({
        event: "annotation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
