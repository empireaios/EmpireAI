/** X2-17 — Company Lifecycle Manager orchestration controller. */

import { appendClmLog } from "./clm-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CompanyLifecycleManagerCore } from "./company-lifecycle-manager.js";
import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type {
  AssessMaturityInput,
  ConnectCompanyLifecycleManagerInput,
  DetectTransitionsInput,
  EngineStatus,
  GenerateLifecycleRecommendationsInput,
  LifecyclePerformanceStats,
  LifecycleRunReport,
  ManageLifecycleStageInput,
  ManageStageActionInput,
  RunLifecycleAnalyticsInput,
  RunLifecycleDiagnosticsInput,
} from "./types.js";

export class CompanyLifecycleController {
  private config: CompanyLifecycleManagerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LifecycleRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LifecyclePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    stageManagementOps: 0,
    maturityAssessments: 0,
    transitionsDetected: 0,
    launchOps: 0,
    growthOps: 0,
    matureOps: 0,
    retirementOps: 0,
    recommendationsGenerated: 0,
    analyticsRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CompanyLifecycleManagerCore,
    config: CompanyLifecycleManagerConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendClmLog({
      event: "framework_initialized",
      level: "info",
      details: "Company Lifecycle Manager ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CompanyLifecycleManagerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CompanyLifecycleManagerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LifecycleRunReport | null {
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

  getPerformance(): LifecyclePerformanceStats {
    return { ...this.performance };
  }

  connectCompanyLifecycleManager(
    input: ConnectCompanyLifecycleManagerInput = {},
  ): LifecycleRunReport {
    if (!this.config.enabled) throw new Error("Company Lifecycle Manager is disabled");
    this.status = "connecting";
    const report = this.manager.connectCompanyLifecycleManager(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageStage(input: ManageLifecycleStageInput): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.manageStage(input, this.config);
    if (report.validation.decision !== "fail") this.performance.stageManagementOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessMaturity(input: AssessMaturityInput): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.assessMaturity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.maturityAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectTransitions(input: DetectTransitionsInput = {}): LifecycleRunReport {
    this.status = "transitioning";
    const report = this.manager.detectTransitions(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.transitionsDetected += report.lifecycleRecords.filter(
        (r) =>
          r.lifecycleStatus === "transition_recommended" ||
          r.lifecycleStatus === "transition_pending",
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  manageLaunch(input: ManageStageActionInput): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.manageLaunch(input, this.config);
    if (report.validation.decision !== "fail") this.performance.launchOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageGrowth(input: ManageStageActionInput): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.manageGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.growthOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageMature(input: ManageStageActionInput): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.manageMature(input, this.config);
    if (report.validation.decision !== "fail") this.performance.matureOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageRetirement(input: ManageStageActionInput): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.manageRetirement(input, this.config);
    if (report.validation.decision !== "fail") this.performance.retirementOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: GenerateLifecycleRecommendationsInput = {},
  ): LifecycleRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runAnalytics(input: RunLifecycleAnalyticsInput = {}): LifecycleRunReport {
    this.status = "assessing";
    const report = this.manager.runAnalytics(input, this.config);
    if (report.validation.decision !== "fail") this.performance.analyticsRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunLifecycleDiagnosticsInput = {}): LifecycleRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: LifecycleRunReport): void {
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
    appendClmLog({
      event: "lifecycle_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
