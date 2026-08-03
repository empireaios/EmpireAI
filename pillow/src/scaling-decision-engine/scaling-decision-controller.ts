/** X3-03 — Scaling Decision Engine orchestration controller. */

import { appendSdeLog } from "./sde-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ScalingDecisionManager } from "./scaling-decision-manager.js";
import type { ScalingDecisionEngineConfiguration } from "./configuration.js";
import type {
  ConnectScalingDecisionEngineInput,
  EngineStatus,
  RunSdeDiagnosticsInput,
  ScalingDecisionInput,
  SdePerformanceStats,
  SdeRunReport,
} from "./types.js";

export class ScalingDecisionController {
  private config: ScalingDecisionEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SdeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SdePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    candidateEvaluations: 0,
    readinessAssessments: 0,
    riskAssessments: 0,
    decisionsProduced: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: ScalingDecisionManager,
    config: ScalingDecisionEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSdeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Scaling Decision Engine ready — never approve scaling without validation; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ScalingDecisionEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ScalingDecisionEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SdeRunReport | null {
    return this.latestReport;
  }

  getManager() {
    return this.manager;
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getPerformance(): SdePerformanceStats {
    return { ...this.performance };
  }

  connectScalingDecisionEngine(
    input: ConnectScalingDecisionEngineInput = {},
  ): SdeRunReport {
    if (!this.config.enabled) throw new Error("Scaling Decision Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectScalingDecisionEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  evaluateCandidate(input: ScalingDecisionInput = {}): SdeRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateCandidate(input, this.config);
    if (report.validation.decision !== "fail") this.performance.candidateEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessReadiness(input: ScalingDecisionInput = {}): SdeRunReport {
    this.status = "assessing";
    const report = this.manager.assessReadiness(input, this.config);
    if (report.validation.decision !== "fail") this.performance.readinessAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessRisk(input: ScalingDecisionInput = {}): SdeRunReport {
    this.status = "assessing";
    const report = this.manager.assessRisk(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  decideScale(input: ScalingDecisionInput = {}): SdeRunReport {
    this.status = "deciding";
    const report = this.manager.decideScale(input, this.config);
    if (report.validation.decision !== "fail") this.performance.decisionsProduced += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankPriorities(input: ScalingDecisionInput = {}): SdeRunReport {
    this.status = "ranking";
    const report = this.manager.rankPriorities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: ScalingDecisionInput = {}): SdeRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunSdeDiagnosticsInput = {}): SdeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SdeRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision);
    this.status = "active";
    appendSdeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
