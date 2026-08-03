/** X3-18 — Scale Simulation Engine orchestration controller. */

import { appendSsiLog } from "./ssi-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ScaleSimulationManager } from "./scale-simulation-manager.js";
import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type {
  ScaleSimulationInput,
  SsiPerformanceStats,
  SsiRunReport,
  ConnectScaleSimulationEngineInput,
  EngineStatus,
  RunSsiDiagnosticsInput,
} from "./types.js";

export class ScaleSimulationController {
  private config: ScaleSimulationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SsiRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SsiPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    simulationRuns: 0,
    comparisonsPerformed: 0,
    rankingsPerformed: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: ScaleSimulationManager,
    config: ScaleSimulationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSsiLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Scale Simulation Engine ready — never execute simulated actions against production; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ScaleSimulationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ScaleSimulationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SsiRunReport | null {
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

  getPerformance(): SsiPerformanceStats {
    return { ...this.performance };
  }

  connectScaleSimulationEngine(
    input: ConnectScaleSimulationEngineInput = {},
  ): SsiRunReport {
    if (!this.config.enabled) throw new Error("Scale Simulation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectScaleSimulationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  simulateScalingScenarios(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateScalingScenarios(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateRevenueOutcomes(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateRevenueOutcomes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateProfitOutcomes(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateProfitOutcomes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateOperationalCapacity(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateOperationalCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateSupplierCapacity(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateSupplierCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateWorkforceUtilization(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateWorkforceUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateFinancialImpact(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateFinancialImpact(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  simulateScalingRisks(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "simulating";
    const report = this.manager.simulateScalingRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.simulationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  compareScalingScenarios(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "comparing";
    const report = this.manager.compareScalingScenarios(input, this.config);
    if (report.validation.decision !== "fail") this.performance.comparisonsPerformed += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankSimulationOutcomes(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "comparing";
    const report = this.manager.rankSimulationOutcomes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsPerformed += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendFromSimulation(input: ScaleSimulationInput = {}): SsiRunReport {
    this.status = "recommending";
    const report = this.manager.recommendFromSimulation(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunSsiDiagnosticsInput = {}): SsiRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SsiRunReport): void {
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
    appendSsiLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
