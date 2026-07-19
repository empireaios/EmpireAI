/** R4-19 — Customer Operations Certification Controller. */

import { appendCocLog } from "./coc-logging.js";
import { CustomerOperationsCertificationManager } from "./customer-operations-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CertificationValidator } from "./certification-validator.js";
import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";
import type { CustomerOperationsCertificationContext } from "./customer-operations-certification-context.js";
import type {
  EngineStatus,
  RunCustomerOperationsCertificationInput,
  CustomerOperationsCertificationPerformanceStats,
  CustomerOperationsCertificationReport,
} from "./types.js";

export class CustomerOperationsCertificationController {
  private config: CustomerOperationsCertificationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CustomerOperationsCertificationReport | null = null;
  private readonly manager: CustomerOperationsCertificationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly certificationValidator = new CertificationValidator();
  private readonly performance: CustomerOperationsCertificationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    certificationRuns: 0,
    missionsValidated: 0,
    missionsPassed: 0,
    missionsFailed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly ctx: CustomerOperationsCertificationContext,
    manager: CustomerOperationsCertificationManager,
    config: CustomerOperationsCertificationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCocLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Operations Certification ready (R4-19)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerOperationsCertificationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerOperationsCertificationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CustomerOperationsCertificationReport | null {
    return this.latestReport;
  }

  getManager(): CustomerOperationsCertificationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CustomerOperationsCertificationPerformanceStats {
    return { ...this.performance };
  }

  async runCustomerOperationsCertification(
    input: RunCustomerOperationsCertificationInput = {},
  ): Promise<CustomerOperationsCertificationReport> {
    if (!this.config.enabled) {
      throw new Error("Customer Operations Certification is disabled");
    }

    this.status = "certifying";
    this.performance.certificationRuns += 1;
    appendCocLog({
      event: "certification_start",
      level: "info",
      details: `runCustomerOperationsCertification started · scope=${this.config.certificationScope}`,
    });

    let report: CustomerOperationsCertificationReport;
    let attempt = 0;
    const maxAttempts = this.config.autoRecover ? this.config.maxRetryAttempts + 1 : 1;

    while (true) {
      attempt += 1;
      report = await this.manager.runCertification(this.ctx, this.config, input);
      report.recoveryStatus = this.recoveryManager.getRecoveryStatus();

      if (
        report.overallCertificationStatus !== "failed" ||
        attempt >= maxAttempts ||
        !this.recoveryManager.recordFailure(
          `Certification failed on attempt ${attempt}`,
          this.config,
        )
      ) {
        break;
      }

      this.performance.retryAttempts += 1;
      const delay =
        this.config.retryDelayMs * Math.pow(this.config.retryBackoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      appendCocLog({
        event: "certification_retry",
        level: "info",
        details: `Retrying customer certification (attempt ${attempt + 1})`,
      });
    }

    this.finalizeOperation(report!);
    return report!;
  }

  validateLatestReport(): ReturnType<CertificationValidator["validateReportIntegrity"]> {
    if (!this.latestReport) {
      throw new Error("No customer certification report available to validate");
    }
    return this.certificationValidator.validateReportIntegrity(this.latestReport);
  }

  private finalizeOperation(report: CustomerOperationsCertificationReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    this.performance.missionsValidated += report.missionResults.length;
    this.performance.missionsPassed += report.missionResults.filter(
      (r) => r.status === "pass",
    ).length;
    this.performance.missionsFailed += report.missionResults.filter(
      (r) => r.status === "fail",
    ).length;

    const duration = report.durationMs;
    const passed = report.missionResults.filter((r) => r.status === "pass").length;

    if (report.overallCertificationStatus === "failed") {
      this.performance.failedOperations += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.overallCertificationStatus === "partial" ? "degraded" : "active";
    }

    this.healthMonitor.recordCertification(report.overallCertificationStatus, passed);

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs *
        (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    appendCocLog({
      event: "certification_complete",
      level: report.overallCertificationStatus === "failed" ? "warn" : "info",
      details: `Customer certification ${report.overallCertificationStatus} · ${duration}ms`,
    });
  }
}
