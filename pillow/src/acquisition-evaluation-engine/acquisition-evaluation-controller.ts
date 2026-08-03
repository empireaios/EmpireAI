/** X2-15 — Acquisition Evaluation Engine orchestration controller. */

import { appendAeeLog } from "./aee-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { AcquisitionEvaluationManager } from "./acquisition-evaluation-manager.js";
import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";
import type {
  AcquisitionPerformanceStats,
  AcquisitionRunReport,
  ConnectAcquisitionEvaluationEngineInput,
  DiscoverAcquisitionCandidatesInput,
  EngineStatus,
  EvaluateAcquisitionInput,
  GenerateAcquisitionRecommendationsInput,
  RankAcquisitionOpportunitiesInput,
  RunAcquisitionDiagnosticsInput,
} from "./types.js";

export class AcquisitionEvaluationController {
  private config: AcquisitionEvaluationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AcquisitionRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AcquisitionPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    candidatesDiscovered: 0,
    opportunitiesEvaluated: 0,
    strategicEvaluations: 0,
    financialEvaluations: 0,
    operationalEvaluations: 0,
    riskEvaluations: 0,
    valueEstimations: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: AcquisitionEvaluationManager,
    config: AcquisitionEvaluationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAeeLog({
      event: "framework_initialized",
      level: "info",
      details: "Acquisition Evaluation Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AcquisitionEvaluationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AcquisitionEvaluationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AcquisitionRunReport | null {
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

  getPerformance(): AcquisitionPerformanceStats {
    return { ...this.performance };
  }

  connectAcquisitionEvaluationEngine(
    input: ConnectAcquisitionEvaluationEngineInput = {},
  ): AcquisitionRunReport {
    if (!this.config.enabled) throw new Error("Acquisition Evaluation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectAcquisitionEvaluationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  discoverCandidates(input: DiscoverAcquisitionCandidatesInput = {}): AcquisitionRunReport {
    this.status = "discovering";
    const report = this.manager.discoverCandidates(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.candidatesDiscovered += report.acquisitionRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  evaluateOpportunity(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateOpportunity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunitiesEvaluated += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateStrategicFit(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateStrategicFit(input, this.config);
    if (report.validation.decision !== "fail") this.performance.strategicEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateFinancial(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateFinancial(input, this.config);
    if (report.validation.decision !== "fail") this.performance.financialEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateOperationalMaturity(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateOperationalMaturity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.operationalEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateRisks(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  estimateValue(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.estimateValue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.valueEstimations += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankOpportunities(input: RankAcquisitionOpportunitiesInput = {}): AcquisitionRunReport {
    this.status = "evaluating";
    const report = this.manager.rankOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: GenerateAcquisitionRecommendationsInput = {},
  ): AcquisitionRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunAcquisitionDiagnosticsInput = {}): AcquisitionRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: AcquisitionRunReport): void {
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
    appendAeeLog({
      event: "acquisition_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
