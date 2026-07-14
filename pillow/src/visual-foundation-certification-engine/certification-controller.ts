/** T1-10 — Visual Foundation Certification orchestration controller. */

import { appendCertificationLog } from "./certification-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { VisualFoundationCertificationManager } from "./visual-foundation-certification-manager.js";
import { T1CapabilityValidator, type T1EngineBundle } from "./t1-capability-validator.js";
import { EndToEndFoundationTestRunner } from "./end-to-end-foundation-test-runner.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import type { VisualFoundationCertificationConfiguration } from "./configuration.js";
import type {
  CertificationDecision,
  CertificationPerformanceStats,
  CertificationStatus,
  RecoveryResult,
  VisualFoundationCertificationReport,
} from "./types.js";

export class CertificationController {
  private config: VisualFoundationCertificationConfiguration;
  private status: CertificationStatus = "idle";
  private latestReport: VisualFoundationCertificationReport | null = null;
  private performance: CertificationPerformanceStats = {
    totalCertifications: 0,
    successfulCertifications: 0,
    failedCertifications: 0,
    averageCertificationDurationMs: 0,
    peakCertificationDurationMs: 0,
  };

  private readonly sessionManager = new VisualFoundationCertificationManager();
  private readonly capabilityValidator = new T1CapabilityValidator();
  private readonly e2eRunner = new EndToEndFoundationTestRunner();
  private readonly reportGenerator = new CertificationReportGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  constructor(
    private repositoryRoot: string,
    private engines: T1EngineBundle,
    config: VisualFoundationCertificationConfiguration,
  ) {
    this.config = config;
  }

  getStatus(): CertificationStatus {
    return this.status;
  }

  getConfiguration(): VisualFoundationCertificationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: VisualFoundationCertificationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): VisualFoundationCertificationReport | null {
    return this.latestReport;
  }

  getPerformance(): CertificationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  async runCertification(): Promise<VisualFoundationCertificationReport> {
    if (this.sessionManager.isRunning()) {
      throw new Error("Certification already running");
    }

    this.sessionManager.startRun();
    this.status = "running";
    const started = Date.now();
    const recoveryResults: RecoveryResult[] = [];

    appendCertificationLog({
      event: "certification_start",
      level: "info",
      details: "Visual Foundation certification started",
    });

    try {
      const missionResults = this.capabilityValidator.validateAll(this.engines, this.config);
      const e2eResult = this.config.requireEndToEndPass
        ? await this.e2eRunner.run(this.engines)
        : {
            passed: true,
            steps: [],
            durationMs: 0,
            summary: "E2E validation skipped by configuration",
          };

      const missionsPassed = missionResults.filter((m) => m.passed).length;
      const allMissionsPass = missionsPassed === missionResults.length;
      const e2eOk = !this.config.requireEndToEndPass || e2eResult.passed;

      let decision: CertificationDecision = "fail";
      if (allMissionsPass && e2eOk) decision = "pass";
      else if (missionsPassed >= Math.ceil(missionResults.length * 0.7) && e2eOk) {
        decision = "conditional";
      }

      const certStatus = this.sessionManager.deriveStatus(
        missionsPassed,
        missionResults.length,
        e2eResult.passed,
        this.config.requireEndToEndPass,
      );

      const report = this.reportGenerator.generate({
        repositoryRoot: this.repositoryRoot,
        config: this.config,
        missionResults,
        e2eResult,
        recoveryResults,
        status: certStatus,
        decision,
      });

      this.latestReport = report;
      this.status = certStatus;
      this.performance.totalCertifications += 1;
      const duration = Date.now() - started;
      if (decision === "pass") {
        this.performance.successfulCertifications += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedCertifications += 1;
        const shouldRetry = this.recoveryManager.recordFailure(
          `Certification decision: ${decision}`,
          this.config,
        );
        if (shouldRetry) {
          recoveryResults.push({
            subsystem: "certification",
            attempted: true,
            succeeded: false,
            details: "Recovery scheduled for next run",
          });
        }
      }
      this.performance.averageCertificationDurationMs = Math.round(
        (this.performance.averageCertificationDurationMs *
          (this.performance.totalCertifications - 1) +
          duration) /
          this.performance.totalCertifications,
      );
      if (duration > this.performance.peakCertificationDurationMs) {
        this.performance.peakCertificationDurationMs = duration;
      }
      this.healthMonitor.recordCertification(decision);

      appendCertificationLog({
        event: "certification_end",
        level: decision === "pass" ? "info" : "warn",
        details: `Certification ${decision.toUpperCase()} · ${duration}ms`,
      });

      return report;
    } finally {
      this.sessionManager.endRun();
    }
  }
}
