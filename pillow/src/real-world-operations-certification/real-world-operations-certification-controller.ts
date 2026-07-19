/** R5-20 — Real World Operations Certification Controller. */

import { appendRwocLog } from "./rwoc-logging.js";
import { RealWorldOperationsCertificationManager } from "./real-world-operations-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CertificationValidator } from "./certification-validator.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";
import type { RealWorldOperationsCertificationContext } from "./real-world-operations-certification-context.js";
import type {
  EngineStatus,
  RealWorldOperationsCertificationPerformanceStats,
  RealWorldOperationsCertificationReport,
  RunRealWorldOperationsCertificationInput,
} from "./types.js";

export class RealWorldOperationsCertificationController {
  private config: RealWorldOperationsCertificationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RealWorldOperationsCertificationReport | null = null;
  private readonly manager: RealWorldOperationsCertificationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly certificationValidator = new CertificationValidator();
  private readonly performance: RealWorldOperationsCertificationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    certificationRuns: 0,
    programmesValidated: 0,
    programmesPassed: 0,
    programmesFailed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly ctx: RealWorldOperationsCertificationContext,
    manager: RealWorldOperationsCertificationManager,
    config: RealWorldOperationsCertificationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRwocLog({
      event: "engine_initialization",
      level: "info",
      details: "Real World Operations Certification ready (R5-20)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RealWorldOperationsCertificationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RealWorldOperationsCertificationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RealWorldOperationsCertificationReport | null {
    return this.latestReport;
  }

  getManager(): RealWorldOperationsCertificationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): RealWorldOperationsCertificationPerformanceStats {
    return { ...this.performance };
  }

  async runRealWorldOperationsCertification(
    input: RunRealWorldOperationsCertificationInput = {},
  ): Promise<RealWorldOperationsCertificationReport> {
    if (!this.config.enabled) {
      throw new Error("Real World Operations Certification is disabled");
    }

    this.status = "certifying";
    this.performance.certificationRuns += 1;
    appendRwocLog({
      event: "certification_start",
      level: "info",
      details: `runRealWorldOperationsCertification started · scope=${this.config.certificationScope}`,
    });

    try {
      const report = await this.manager.runCertification(this.ctx, this.config, input);
      this.finalize(report);
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Certification failed";
      const recovered = this.recoveryManager.recordFailure(message, this.config);
      if (recovered) this.performance.retryAttempts += 1;
      this.performance.failedOperations += 1;
      this.performance.totalOperations += 1;
      this.status = "failed";
      throw error;
    }
  }

  validateLatestReport() {
    const report = this.latestReport;
    if (!report) {
      return this.certificationValidator.validateConfiguration(this.config);
    }
    return this.certificationValidator.validateReport(report);
  }

  private finalize(report: RealWorldOperationsCertificationReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    this.performance.programmesValidated += report.programmeResults.length;
    this.performance.programmesPassed += report.programmeResults.filter(
      (p) => p.status === "pass",
    ).length;
    this.performance.programmesFailed += report.programmeResults.filter(
      (p) => p.status === "fail",
    ).length;

    const duration = report.durationMs;
    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    const passedCount = report.programmeResults.filter((p) => p.status === "pass").length;
    this.healthMonitor.recordCertification(report.overallCertificationStatus, passedCount);

    if (report.overallCertificationStatus === "failed") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `Certification ${report.overallCertificationStatus}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status = "active";
    }

    appendRwocLog({
      event: "certification_completion",
      level: report.overallCertificationStatus === "failed" ? "warn" : "info",
      details: `${report.overallCertificationStatus} · ${duration}ms · readiness=${report.operationalReadinessScore}`,
    });
  }
}
