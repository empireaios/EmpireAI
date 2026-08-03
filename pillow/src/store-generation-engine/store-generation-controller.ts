/** X1-07 — Store Generation Controller. */

import { appendSgeLog } from "./sge-logging.js";
import { StoreGenerationManager } from "./store-generation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { StoreGenerationEngineConfiguration } from "./configuration.js";
import type {
  ConnectStoreGenerationEngineInput,
  EngineStatus,
  GenerateStorefrontInput,
  StorefrontActionInput,
  StorefrontPerformanceStats,
  StorefrontRunReport,
} from "./types.js";

export class StoreGenerationController {
  private config: StoreGenerationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: StorefrontRunReport | null = null;
  private readonly manager: StoreGenerationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: StorefrontPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    storefrontsGenerated: 0,
    websiteStructureRuns: 0,
    navigationRuns: 0,
    catalogueRuns: 0,
    deploymentPackageRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: StoreGenerationManager, config: StoreGenerationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSgeLog({
      event: "engine_initialization",
      level: "info",
      details: "Store Generation Engine ready (X1-07)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): StoreGenerationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: StoreGenerationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): StorefrontRunReport | null {
    return this.latestReport;
  }

  getManager(): StoreGenerationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): StorefrontPerformanceStats {
    return { ...this.performance };
  }

  connectStoreGenerationEngine(
    input: ConnectStoreGenerationEngineInput = {},
  ): StorefrontRunReport {
    if (!this.config.enabled) throw new Error("Store Generation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectStoreGenerationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateStorefront(input: GenerateStorefrontInput = {}): StorefrontRunReport {
    this.status = "generating";
    this.performance.storefrontsGenerated += 1;
    const report = this.manager.generateStorefront(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createWebsiteStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    this.performance.websiteStructureRuns += 1;
    const report = this.manager.createWebsiteStructure(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createNavigationStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    this.performance.navigationRuns += 1;
    const report = this.manager.createNavigationStructure(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createHomepageLayout(input: StorefrontActionInput = {}): StorefrontRunReport {
    const report = this.manager.createHomepageLayout(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createProductCatalogueStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    this.performance.catalogueRuns += 1;
    const report = this.manager.createProductCatalogueStructure(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCategoryStructure(input: StorefrontActionInput = {}): StorefrontRunReport {
    this.performance.catalogueRuns += 1;
    const report = this.manager.createCategoryStructure(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createCompanyInformationPages(input: StorefrontActionInput = {}): StorefrontRunReport {
    const report = this.manager.createCompanyInformationPages(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  prepareLegalPageTemplates(input: StorefrontActionInput = {}): StorefrontRunReport {
    const report = this.manager.prepareLegalPageTemplates(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  prepareDeploymentPackage(input: StorefrontActionInput = {}): StorefrontRunReport {
    this.performance.deploymentPackageRuns += 1;
    const report = this.manager.prepareDeploymentPackage(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: StorefrontRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendSgeLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
