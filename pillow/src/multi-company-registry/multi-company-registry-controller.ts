/** X2-02 — Multi-Company Registry orchestration controller. */

import { appendMcrLog } from "./mcr-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { MultiCompanyRegistryManager } from "./multi-company-registry-manager.js";
import type { MultiCompanyRegistryConfiguration } from "./configuration.js";
import type {
  AdvanceLifecycleInput,
  ClassifyCompanyInput,
  ConnectMultiCompanyRegistryInput,
  DetectDuplicatesInput,
  EngineStatus,
  RecommendRegistryInput,
  RegisterCompanyInput,
  RegistryPerformanceStats,
  RegistryRunReport,
  RunRegistryDiagnosticsInput,
  UpdateCompanyProfileInput,
  UpdateOwnershipInput,
} from "./types.js";

export class MultiCompanyRegistryController {
  private config: MultiCompanyRegistryConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RegistryRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RegistryPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    companiesRegistered: 0,
    profileUpdates: 0,
    classifications: 0,
    lifecycleTransitions: 0,
    duplicatesDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: MultiCompanyRegistryManager,
    config: MultiCompanyRegistryConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMcrLog({
      event: "framework_initialized",
      level: "info",
      details: "Multi-Company Registry ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MultiCompanyRegistryConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MultiCompanyRegistryConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RegistryRunReport | null {
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

  getPerformance(): RegistryPerformanceStats {
    return { ...this.performance };
  }

  connectMultiCompanyRegistry(
    input: ConnectMultiCompanyRegistryInput = {},
  ): RegistryRunReport {
    if (!this.config.enabled) throw new Error("Multi-Company Registry is disabled");
    this.status = "connecting";
    const report = this.manager.connectMultiCompanyRegistry(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  registerCompany(input: RegisterCompanyInput): RegistryRunReport {
    this.status = "registering";
    const report = this.manager.registerCompany(input, this.config);
    if (report.validation.decision !== "fail") this.performance.companiesRegistered += 1;
    this.finalizeOperation(report);
    return report;
  }

  updateProfile(input: UpdateCompanyProfileInput): RegistryRunReport {
    this.status = "updating";
    const report = this.manager.updateProfile(input, this.config);
    if (report.validation.decision !== "fail") this.performance.profileUpdates += 1;
    this.finalizeOperation(report);
    return report;
  }

  updateOwnership(input: UpdateOwnershipInput): RegistryRunReport {
    const report = this.manager.updateOwnership(input, this.config);
    if (report.validation.decision !== "fail") this.performance.profileUpdates += 1;
    this.finalizeOperation(report);
    return report;
  }

  classifyCompany(input: ClassifyCompanyInput): RegistryRunReport {
    const report = this.manager.classifyCompany(input, this.config);
    if (report.validation.decision !== "fail") this.performance.classifications += 1;
    this.finalizeOperation(report);
    return report;
  }

  advanceLifecycle(input: AdvanceLifecycleInput): RegistryRunReport {
    const report = this.manager.advanceLifecycle(input, this.config);
    if (report.validation.decision !== "fail") this.performance.lifecycleTransitions += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): RegistryRunReport {
    const report = this.manager.detectDuplicates(input, this.config);
    this.performance.duplicatesDetected += report.companyRecords.length;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendRegistryInput = {}): RegistryRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunRegistryDiagnosticsInput = {}): RegistryRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: RegistryRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendMcrLog({
      event: "registry_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
