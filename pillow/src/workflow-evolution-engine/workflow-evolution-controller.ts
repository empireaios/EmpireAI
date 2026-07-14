/** T5-05 — Workflow Evolution orchestration controller. */

import { appendEvolutionLog } from "./workflow-logging.js";
import type { WorkflowEvolutionConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  EngineStatus,
  EvolutionCategory,
  EvolutionPerformanceStats,
  WorkflowEvolutionEngineBundle,
  WorkflowEvolutionInput,
  WorkflowEvolutionRunReport,
} from "./types.js";
import { WorkflowEvolutionManager } from "./workflow-evolution-manager.js";

function countCategory(
  records: { evolutionCategory: EvolutionCategory }[],
  categories: EvolutionCategory[],
): number {
  return records.filter((r) => categories.includes(r.evolutionCategory)).length;
}

export class WorkflowEvolutionController {
  private config: WorkflowEvolutionConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WorkflowEvolutionRunReport | null = null;
  private readonly manager = new WorkflowEvolutionManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousEvolutionActive = false;
  private evolutionTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: EvolutionPerformanceStats = {
    totalEvolutionCycles: 0,
    successfulEvolutionCycles: 0,
    failedEvolutionCycles: 0,
    totalRecommendations: 0,
    simplificationRecommendations: 0,
    navigationRecommendations: 0,
    accelerationRecommendations: 0,
    frictionDetections: 0,
    duplicatesSkipped: 0,
    averageEvolutionDurationMs: 0,
    peakEvolutionDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: WorkflowEvolutionEngineBundle,
    config: WorkflowEvolutionConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendEvolutionLog({
      event: "workflow_evolution_initialized",
      level: "info",
      details: "Workflow Evolution engine ready (recommend-only)",
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

  getConfiguration(): WorkflowEvolutionConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WorkflowEvolutionConfiguration): void {
    const wasActive = this.continuousEvolutionActive;
    if (wasActive) this.stopContinuousEvolution();
    this.config = config;
    if (config.continuousEvolutionEnabled && config.enabled) {
      this.startContinuousEvolution();
    }
  }

  getLatestReport(): WorkflowEvolutionRunReport | null {
    return this.latestReport;
  }

  getTopRecommendations() {
    return this.manager.getTopRecommendations();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
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

  getManager(): WorkflowEvolutionManager {
    return this.manager;
  }

  startContinuousEvolution(): void {
    if (!this.config.enabled || this.evolutionTimer) return;
    this.continuousEvolutionActive = true;
    this.status = "evolving";
    this.manager.getSessionManager().setContinuousEvolutionActive(true);
    appendEvolutionLog({
      event: "workflow_evolution_start",
      level: "info",
      details: "Continuous workflow evolution activated",
    });
    this.evolutionTimer = setInterval(() => {
      try {
        this.evolve({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.analysisFrequencyMs);
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
      event: "workflow_evolution_end",
      level: "info",
      details: "Continuous workflow evolution deactivated",
    });
  }

  evolve(input: WorkflowEvolutionInput = {}): WorkflowEvolutionRunReport {
    if (!this.config.enabled) {
      throw new Error("Workflow Evolution is disabled by configuration");
    }
    if (!this.config.recommendOnlyMode) {
      throw new Error("Workflow Evolution must remain recommend-only");
    }

    this.status = "analyzing_workflows";

    try {
      this.status = "detecting_friction";
      const report = this.manager.evolve({
        evolutionInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalEvolutionCycles += 1;
      this.performance.totalRecommendations += report.records.length;

      const records = report.records;
      this.performance.simplificationRecommendations += countCategory(records, [
        "workflow_simplification",
        "task_reduction",
        "user_effort_reduction",
      ]);
      this.performance.navigationRecommendations += countCategory(records, [
        "navigation_simplification",
        "screen_transition_reduction",
        "click_reduction",
      ]);
      this.performance.accelerationRecommendations += countCategory(records, [
        "workflow_acceleration",
        "productivity_improvement",
      ]);
      this.performance.frictionDetections += countCategory(records, [
        "process_optimization",
        "operational_efficiency",
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
