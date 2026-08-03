/** X2-11 — Cross-Company Resource Engine orchestration controller. */

import { appendCcreLog } from "./ccre-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CrossCompanyResourceManager } from "./cross-company-resource-manager.js";
import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type {
  AllocateResourceInput,
  ConnectCrossCompanyResourceInput,
  DetectIdleResourcesInput,
  DetectResourceConflictsInput,
  EngineStatus,
  OptimizeResourcesInput,
  RecommendResourceInput,
  RegisterResourceInput,
  ResourcePerformanceStats,
  ResourceRunReport,
  RunResourceDiagnosticsInput,
} from "./types.js";

export class CrossCompanyResourceController {
  private config: CrossCompanyResourceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ResourceRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ResourcePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    resourcesRegistered: 0,
    allocationsProposed: 0,
    idleDetections: 0,
    conflictDetections: 0,
    optimizationsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CrossCompanyResourceManager,
    config: CrossCompanyResourceEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCcreLog({
      event: "framework_initialized",
      level: "info",
      details: "Cross-Company Resource Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CrossCompanyResourceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CrossCompanyResourceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ResourceRunReport | null {
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

  getPerformance(): ResourcePerformanceStats {
    return { ...this.performance };
  }

  connectCrossCompanyResourceEngine(
    input: ConnectCrossCompanyResourceInput = {},
  ): ResourceRunReport {
    if (!this.config.enabled) throw new Error("Cross-Company Resource Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCrossCompanyResourceEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  registerResource(input: RegisterResourceInput): ResourceRunReport {
    this.status = "registering";
    const report = this.manager.registerResource(input, this.config);
    if (report.validation.decision !== "fail") this.performance.resourcesRegistered += 1;
    this.finalizeOperation(report);
    return report;
  }

  allocateResource(input: AllocateResourceInput): ResourceRunReport {
    this.status = "allocating";
    const report = this.manager.allocateResource(input, this.config);
    if (report.validation.decision !== "fail") this.performance.allocationsProposed += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectIdleResources(input: DetectIdleResourcesInput = {}): ResourceRunReport {
    const report = this.manager.detectIdleResources(input, this.config);
    if (report.validation.decision !== "fail") this.performance.idleDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectConflicts(input: DetectResourceConflictsInput = {}): ResourceRunReport {
    const report = this.manager.detectConflicts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.conflictDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizeResources(input: OptimizeResourcesInput = {}): ResourceRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeResources(input, this.config);
    if (report.validation.decision !== "fail") this.performance.optimizationsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendResourceInput = {}): ResourceRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunResourceDiagnosticsInput = {}): ResourceRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ResourceRunReport): void {
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
    appendCcreLog({
      event: "resource_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
