/** R2-20 — Supplier Operations Certification Controller. */

import { appendCertificationLog } from "./soc-logging.js";
import { SupplierOperationsCertificationManager } from "./supplier-operations-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CertificationValidator } from "./certification-validator.js";
import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";
import type { SupplierOperationsCertificationContext } from "./supplier-operations-certification-context.js";
import type {
  EngineStatus,
  RunSupplierCertificationInput,
  SupplierOperationsCertificationPerformanceStats,
  SupplierOperationsCertificationReport,
} from "./types.js";

export class SupplierOperationsCertificationController {
  private config: SupplierOperationsCertificationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierOperationsCertificationReport | null = null;
  private readonly manager: SupplierOperationsCertificationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly certificationValidator = new CertificationValidator();
  private readonly performance: SupplierOperationsCertificationPerformanceStats = {
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
    private readonly ctx: SupplierOperationsCertificationContext,
    manager: SupplierOperationsCertificationManager,
    config: SupplierOperationsCertificationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCertificationLog({
      event: "engine_initialization",
      level: "info",
      details: "Supplier Operations Certification ready (R2-20)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierOperationsCertificationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierOperationsCertificationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierOperationsCertificationReport | null {
    return this.latestReport;
  }

  getManager(): SupplierOperationsCertificationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SupplierOperationsCertificationPerformanceStats {
    return { ...this.performance };
  }

  async runSupplierCertification(
    input: RunSupplierCertificationInput = {},
  ): Promise<SupplierOperationsCertificationReport> {
    if (!this.config.enabled) {
      throw new Error("Supplier Operations Certification is disabled");
    }

    this.status = "certifying";
    this.performance.certificationRuns += 1;
    appendCertificationLog({
      event: "certification_start",
      level: "info",
      details: `runSupplierCertification started · scope=${this.config.certificationScope}`,
    });

    let report: SupplierOperationsCertificationReport;
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
        this.config.retryDelayMs *
        Math.pow(this.config.retryBackoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      appendCertificationLog({
        event: "certification_retry",
        level: "info",
        details: `Retrying supplier certification (attempt ${attempt + 1})`,
      });
    }

    this.finalizeOperation(report!);
    return report!;
  }

  validateLatestReport(): ReturnType<CertificationValidator["validateReportIntegrity"]> {
    if (!this.latestReport) {
      throw new Error("No supplier certification report available to validate");
    }
    return this.certificationValidator.validateReportIntegrity(this.latestReport);
  }

  private finalizeOperation(report: SupplierOperationsCertificationReport): void {
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

    appendCertificationLog({
      event: "certification_complete",
      level: report.overallCertificationStatus === "failed" ? "warn" : "info",
      details: `Supplier certification ${report.overallCertificationStatus} · ${duration}ms`,
    });
  }
}
