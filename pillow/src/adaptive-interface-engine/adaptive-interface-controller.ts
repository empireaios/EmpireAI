/** T5-06 — Adaptive Interface orchestration controller. */

import { appendAdaptiveLog } from "./adaptive-logging.js";
import type { AdaptiveInterfaceConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  AdaptationCategory,
  AdaptiveInterfaceEngineBundle,
  AdaptiveInterfaceInput,
  AdaptiveInterfaceRunReport,
  AdaptivePerformanceStats,
  EngineStatus,
} from "./types.js";
import { AdaptiveInterfaceManager } from "./adaptive-interface-manager.js";

function countCategory(
  records: { adaptationCategory: AdaptationCategory }[],
  categories: AdaptationCategory[],
): number {
  return records.filter((r) => categories.includes(r.adaptationCategory)).length;
}

export class AdaptiveInterfaceController {
  private config: AdaptiveInterfaceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AdaptiveInterfaceRunReport | null = null;
  private readonly manager = new AdaptiveInterfaceManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousAdaptationActive = false;
  private adaptationTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: AdaptivePerformanceStats = {
    totalAdaptationCycles: 0,
    successfulAdaptationCycles: 0,
    failedAdaptationCycles: 0,
    totalAdaptations: 0,
    layoutAdaptations: 0,
    navigationAdaptations: 0,
    workspaceAdaptations: 0,
    contextDetections: 0,
    duplicatesSkipped: 0,
    averageAdaptationDurationMs: 0,
    peakAdaptationDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: AdaptiveInterfaceEngineBundle,
    config: AdaptiveInterfaceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendAdaptiveLog({
      event: "adaptive_interface_initialized",
      level: "info",
      details: "Adaptive Interface engine ready (recommend-only)",
    });
    if (this.config.continuousAdaptationEnabled && this.config.enabled) {
      this.startContinuousAdaptation();
    }
  }

  stop(): void {
    this.stopContinuousAdaptation();
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousAdaptationActive(): boolean {
    return this.continuousAdaptationActive;
  }

  getConfiguration(): AdaptiveInterfaceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AdaptiveInterfaceConfiguration): void {
    const wasActive = this.continuousAdaptationActive;
    if (wasActive) this.stopContinuousAdaptation();
    this.config = config;
    if (config.continuousAdaptationEnabled && config.enabled) {
      this.startContinuousAdaptation();
    }
  }

  getLatestReport(): AdaptiveInterfaceRunReport | null {
    return this.latestReport;
  }

  getTopAdaptations() {
    return this.manager.getTopAdaptations();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getActiveProfile() {
    return this.manager.getProfileManager().getActiveProfile();
  }

  getPerformance(): AdaptivePerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): AdaptiveInterfaceManager {
    return this.manager;
  }

  startContinuousAdaptation(): void {
    if (!this.config.enabled || this.adaptationTimer) return;
    this.continuousAdaptationActive = true;
    this.status = "adapting";
    this.manager.getSessionManager().setContinuousAdaptationActive(true);
    appendAdaptiveLog({
      event: "adaptive_interface_start",
      level: "info",
      details: "Continuous adaptation activated",
    });
    this.adaptationTimer = setInterval(() => {
      try {
        this.adapt({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.contextDetectionFrequencyMs);
  }

  stopContinuousAdaptation(): void {
    if (this.adaptationTimer) {
      clearInterval(this.adaptationTimer);
      this.adaptationTimer = null;
    }
    this.continuousAdaptationActive = false;
    this.manager.getSessionManager().setContinuousAdaptationActive(false);
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.adaptationSessionId);
    }
    appendAdaptiveLog({
      event: "adaptive_interface_end",
      level: "info",
      details: "Continuous adaptation deactivated",
    });
  }

  adapt(input: AdaptiveInterfaceInput = {}): AdaptiveInterfaceRunReport {
    if (!this.config.enabled) {
      throw new Error("Adaptive Interface is disabled by configuration");
    }
    if (!this.config.recommendOnlyMode) {
      throw new Error("Adaptive Interface must remain recommend-only");
    }

    this.status = "detecting_context";
    this.performance.contextDetections += 1;

    try {
      this.status = "generating_adaptations";
      const report = this.manager.adapt({
        adaptationInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalAdaptationCycles += 1;
      this.performance.totalAdaptations += report.records.length;

      const records = report.records;
      this.performance.layoutAdaptations += countCategory(records, [
        "adaptive_layout",
        "adaptive_information_hierarchy",
        "adaptive_visual_emphasis",
      ]);
      this.performance.navigationAdaptations += countCategory(records, [
        "adaptive_navigation",
        "adaptive_shortcut_placement",
      ]);
      this.performance.workspaceAdaptations += countCategory(records, [
        "adaptive_workspace",
        "adaptive_panel_organization",
        "adaptive_dashboard",
      ]);

      this.performance.peakAdaptationDurationMs = Math.max(
        this.performance.peakAdaptationDurationMs,
        report.durationMs,
      );
      this.performance.averageAdaptationDurationMs = Math.round(
        (this.performance.averageAdaptationDurationMs *
          (this.performance.totalAdaptationCycles - 1) +
          report.durationMs) /
          this.performance.totalAdaptationCycles,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulAdaptationCycles += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordAdaptation(true, report.validation.decision);
        this.status = this.continuousAdaptationActive ? "adapting" : "idle";
      } else {
        this.performance.failedAdaptationCycles += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordAdaptation(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedAdaptationCycles += 1;
      const message = error instanceof Error ? error.message : "Adaptation failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
