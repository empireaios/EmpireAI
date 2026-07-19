/** R4-01 — Customer Identity Controller. */

import { appendCieLog } from "./cie-logging.js";
import { CustomerIdentityManager } from "./customer-identity-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerIdentityEngineConfiguration } from "./configuration.js";
import type {
  ConnectCustomerIdentityEngineInput,
  CreateCustomerIdentityInput,
  CustomerIdentityRunReport,
  DetectDuplicateIdentitiesInput,
  EngineStatus,
  CustomerIdentityPerformanceStats,
  LinkCustomerIdentityInput,
  MergeCustomerIdentitiesInput,
  ResolveCustomerIdentityInput,
} from "./types.js";

export class CustomerIdentityController {
  private config: CustomerIdentityEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CustomerIdentityRunReport | null = null;
  private readonly manager: CustomerIdentityManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CustomerIdentityPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    identitiesCreated: 0,
    identitiesLinked: 0,
    duplicatesDetected: 0,
    identitiesMerged: 0,
    identitiesResolved: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CustomerIdentityManager, config: CustomerIdentityEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCieLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Identity Engine ready (R4-01)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerIdentityEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerIdentityEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CustomerIdentityRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerIdentityManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CustomerIdentityPerformanceStats {
    return {
      ...this.performance,
      retryAttempts: this.manager.getRetryManager().getRetryAttempts(),
    };
  }

  connectCustomerIdentityEngine(
    input: ConnectCustomerIdentityEngineInput = {},
  ): CustomerIdentityRunReport {
    if (!this.config.enabled) throw new Error("Customer Identity Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCustomerIdentityEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createCustomerIdentity(
    input: CreateCustomerIdentityInput = {},
  ): CustomerIdentityRunReport {
    this.status = "processing";
    this.performance.identitiesCreated += 1;
    const report = this.manager.createCustomerIdentity(input, this.config);
    this.finalizeOperation(report, "create_identity");
    return report;
  }

  linkCustomerIdentity(input: LinkCustomerIdentityInput): CustomerIdentityRunReport {
    this.status = "processing";
    this.performance.identitiesLinked += 1;
    const report = this.manager.linkCustomerIdentity(input, this.config);
    this.finalizeOperation(report, "link_identity");
    return report;
  }

  detectDuplicateIdentities(
    input: DetectDuplicateIdentitiesInput = {},
  ): CustomerIdentityRunReport {
    const report = this.manager.detectDuplicateIdentities(input, this.config);
    this.performance.duplicatesDetected += report.duplicateMatches.length;
    this.finalizeOperation(report, "detect_duplicates");
    return report;
  }

  mergeCustomerIdentities(input: MergeCustomerIdentitiesInput): CustomerIdentityRunReport {
    this.status = "processing";
    this.performance.identitiesMerged += 1;
    const report = this.manager.mergeCustomerIdentities(input, this.config);
    this.finalizeOperation(report, "merge_identities");
    return report;
  }

  resolveCustomerIdentity(input: ResolveCustomerIdentityInput): CustomerIdentityRunReport {
    this.performance.identitiesResolved += 1;
    const report = this.manager.resolveCustomerIdentity(input, this.config);
    this.finalizeOperation(report, "resolve_identity");
    return report;
  }

  private finalizeOperation(report: CustomerIdentityRunReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendCieLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
