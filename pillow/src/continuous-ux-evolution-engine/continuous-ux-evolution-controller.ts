/** T5-07 — Continuous UX Evolution orchestration controller. */

import { appendEvolutionLog } from "./cue-logging.js";
import type { ContinuousUxEvolutionConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  ContinuousUxEvolutionEngineBundle,
  ContinuousUxEvolutionInput,
  ContinuousUxEvolutionRunReport,
  EvolutionCategory,
  EvolutionPerformanceStats,
  EngineStatus,
  UxEvolutionRecord,
} from "./types.js";
import { ContinuousUxEvolutionManager } from "./continuous-ux-evolution-manager.js";

function countCategory(
  records: { evolutionCategory: EvolutionCategory }[],
  categories: EvolutionCategory[],
): number {
  return records.filter((r) => categories.includes(r.evolutionCategory)).length;
}

export class ContinuousUxEvolutionController {
  private config: ContinuousUxEvolutionConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ContinuousUxEvolutionRunReport | null = null;
  private readonly manager = new ContinuousUxEvolutionManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousEvolutionActive = false;
  private evolutionTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: EvolutionPerformanceStats = {
    totalEvolutionCycles: 0,
    successfulEvolutionCycles: 0,
    failedEvolutionCycles: 0,
    totalImprovements: 0,
    layoutEvolutions: 0,
    navigationEvolutions: 0,
    accessibilityEvolutions: 0,
    workflowEvolutions: 0,
    trendAnalyses: 0,
    duplicatesSkipped: 0,
    averageEvolutionDurationMs: 0,
    peakEvolutionDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: ContinuousUxEvolutionEngineBundle,
    config: ContinuousUxEvolutionConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendEvolutionLog({
      event: "continuous_ux_evolution_initialized",
      level: "info",
      details: "Continuous UX Evolution engine ready (recommend-only)",
    });
    if (this.config.continuousEvolutionEnabled && this.config.enabled) {
      this.startContinuousEvolution();
    }
  }

  stop(): void {
    this.stopContinuousEvolution();
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousEvolutionActive(): boolean {
    return this.continuousEvolutionActive;
  }

  getConfiguration(): ContinuousUxEvolutionConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ContinuousUxEvolutionConfiguration): void {
    const wasActive = this.continuousEvolutionActive;
    if (wasActive) this.stopContinuousEvolution();
    this.config = config;
    if (config.continuousEvolutionEnabled && config.enabled) {
      this.startContinuousEvolution();
    }
  }

  getLatestReport(): ContinuousUxEvolutionRunReport | null {
    return this.latestReport;
  }

  getTopImprovements(): UxEvolutionRecord[] {
    return this.manager.getTopImprovements();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getEvolutionHistory() {
    return this.manager.getHistoryManager().getHistory();
  }

  getPerformance(): EvolutionPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ContinuousUxEvolutionManager {
    return this.manager;
  }

  startContinuousEvolution(): void {
    if (!this.config.enabled || this.evolutionTimer) return;
    this.continuousEvolutionActive = true;
    this.status = "evolving";
    this.manager.getSessionManager().setContinuousEvolutionActive(true);
    appendEvolutionLog({
      event: "continuous_ux_evolution_start",
      level: "info",
      details: "Continuous UX evolution activated",
    });
    this.evolutionTimer = setInterval(() => {
      try {
        this.optimize({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.evolutionFrequencyMs);
  }

  stopContinuousEvolution(): void {
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = null;
    }
    this.continuousEvolutionActive = false;
    this.manager.getSessionManager().setContinuousEvolutionActive(false);
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.evolutionSessionId);
    }
    appendEvolutionLog({
      event: "continuous_ux_evolution_end",
      level: "info",
      details: "Continuous UX evolution deactivated",
    });
  }

  optimize(input: ContinuousUxEvolutionInput = {}): ContinuousUxEvolutionRunReport {
    if (!this.config.enabled) {
      throw new Error("Continuous UX Evolution is disabled by configuration");
    }
    if (!this.config.recommendOnlyMode) {
      throw new Error("Continuous UX Evolution must remain recommend-only");
    }

    this.status = "analyzing_trends";
    this.performance.trendAnalyses += 1;

    try {
      this.status = "generating_recommendations";
      const report = this.manager.optimize({
        evolutionInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalEvolutionCycles += 1;
      this.performance.totalImprovements += report.records.length;

      const records = report.records;
      this.performance.layoutEvolutions += countCategory(records, [
        "layout_evolution",
        "component_evolution",
        "visual_consistency_evolution",
      ]);
      this.performance.navigationEvolutions += countCategory(records, [
        "navigation_evolution",
        "dashboard_evolution",
      ]);
      this.performance.accessibilityEvolutions += countCategory(records, [
        "accessibility_evolution",
      ]);
      this.performance.workflowEvolutions += countCategory(records, [
        "workflow_evolution",
        "productivity_evolution",
        "operational_efficiency_evolution",
      ]);

      this.performance.peakEvolutionDurationMs = Math.max(
        this.performance.peakEvolutionDurationMs,
        report.durationMs,
      );
      this.performance.averageEvolutionDurationMs = Math.round(
        (this.performance.averageEvolutionDurationMs *
          (this.performance.totalEvolutionCycles - 1) +
          report.durationMs) /
          this.performance.totalEvolutionCycles,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulEvolutionCycles += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordEvolution(true, report.validation.decision);
        this.status = this.continuousEvolutionActive ? "evolving" : "idle";
      } else {
        this.performance.failedEvolutionCycles += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordEvolution(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedEvolutionCycles += 1;
      const message = error instanceof Error ? error.message : "Evolution failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
