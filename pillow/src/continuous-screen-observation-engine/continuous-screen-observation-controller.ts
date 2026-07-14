/** T5-01 — Continuous Screen Observation orchestration controller. */

import { appendObservationLog } from "./observation-logging.js";
import { ContinuousScreenObservationManager } from "./continuous-screen-observation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ContinuousScreenObservationConfiguration } from "./configuration.js";
import type {
  ContinuousObservationRunReport,
  ContinuousScreenObservationInput,
  ContinuousScreenObservationPerformanceStats,
  EngineStatus,
  ContinuousScreenObservationEngineBundle,
} from "./types.js";

export class ContinuousScreenObservationController {
  private config: ContinuousScreenObservationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ContinuousObservationRunReport | null = null;
  private readonly manager = new ContinuousScreenObservationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousMonitoringActive = false;
  private observationTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: ContinuousScreenObservationPerformanceStats = {
    totalObservations: 0,
    successfulObservations: 0,
    failedObservations: 0,
    screenChangesDetected: 0,
    routeChangesDetected: 0,
    layoutChangesDetected: 0,
    componentChangesDetected: 0,
    stateChangesDetected: 0,
    averageObservationDurationMs: 0,
    peakObservationDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: ContinuousScreenObservationEngineBundle,
    config: ContinuousScreenObservationConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendObservationLog({
      event: "continuous_observation_initialized",
      level: "info",
      details: "Continuous Screen Observation engine ready (observe-only)",
    });
    if (this.config.continuousObservationEnabled && this.config.enabled) {
      this.startContinuousObservation();
    }
  }

  stop(): void {
    this.stopContinuousObservation();
    this.status = "stopped";
    appendObservationLog({
      event: "continuous_observation_stop",
      level: "info",
      details: "Continuous Screen Observation stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousMonitoringActive(): boolean {
    return this.continuousMonitoringActive;
  }

  getConfiguration(): ContinuousScreenObservationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ContinuousScreenObservationConfiguration): void {
    const wasActive = this.continuousMonitoringActive;
    if (wasActive) this.stopContinuousObservation();
    this.config = config;
    if (config.continuousObservationEnabled && config.enabled) {
      this.startContinuousObservation();
    }
  }

  getLatestReport(): ContinuousObservationRunReport | null {
    return this.latestReport;
  }

  getLatestObservation() {
    return this.manager.getLatestObservation();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getPerformance(): ContinuousScreenObservationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ContinuousScreenObservationManager {
    return this.manager;
  }

  startContinuousObservation(): void {
    if (!this.config.enabled || this.observationTimer) return;
    this.continuousMonitoringActive = true;
    this.status = "observing";
    appendObservationLog({
      event: "continuous_observation_start",
      level: "info",
      details: "Permanent UI awareness activated",
    });
    this.observationTimer = setInterval(() => {
      try {
        this.observe({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.observationFrequencyMs);
  }

  stopContinuousObservation(): void {
    if (this.observationTimer) {
      clearInterval(this.observationTimer);
      this.observationTimer = null;
    }
    this.continuousMonitoringActive = false;
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.observationSessionId);
    }
    appendObservationLog({
      event: "continuous_observation_end",
      level: "info",
      details: "Permanent UI awareness deactivated",
    });
  }

  observe(input: ContinuousScreenObservationInput = {}): ContinuousObservationRunReport {
    if (!this.config.enabled) {
      throw new Error("Continuous Screen Observation is disabled by configuration");
    }
    if (!this.config.observeOnlyMode) {
      throw new Error("Continuous Screen Observation must remain observe-only");
    }

    this.status = "detecting_changes";

    try {
      this.status = "recording";
      const report = this.manager.observe({
        observationInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalObservations += 1;
      this.performance.screenChangesDetected += report.observation.detectedScreenChanges.length;
      this.performance.routeChangesDetected += report.observation.detectedStateChanges.filter(
        (c) => c.startsWith("route:"),
      ).length;
      this.performance.layoutChangesDetected += report.observation.detectedLayoutChanges.length;
      this.performance.componentChangesDetected +=
        report.observation.detectedComponentChanges.length;
      this.performance.stateChangesDetected += report.observation.detectedStateChanges.length;
      this.performance.peakObservationDurationMs = Math.max(
        this.performance.peakObservationDurationMs,
        report.durationMs,
      );
      this.performance.averageObservationDurationMs = Math.round(
        (this.performance.averageObservationDurationMs *
          (this.performance.totalObservations - 1) +
          report.durationMs) /
          this.performance.totalObservations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulObservations += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordObservation(true, report.validation.decision);
        this.status = this.continuousMonitoringActive ? "observing" : "idle";
      } else {
        this.performance.failedObservations += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordObservation(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedObservations += 1;
      const message = error instanceof Error ? error.message : "Observation failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
