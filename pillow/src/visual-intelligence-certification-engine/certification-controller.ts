/** T5-10 — Visual Intelligence Certification orchestration controller. */

import { appendCertificationLog } from "./certification-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { VisualIntelligenceCertificationManager } from "./visual-intelligence-certification-manager.js";
import { TSeriesCertificationCoordinator } from "./t-series-certification-coordinator.js";
import { EndToEndVisualIntelligenceValidator } from "./end-to-end-visual-intelligence-validator.js";
import { ProductionReadinessValidator } from "./production-readiness-validator.js";
import { GovernanceComplianceValidator } from "./governance-compliance-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import { CertificationValidator } from "./certification-validator.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import type {
  CertificationDecision,
  CertificationPerformanceStats,
  CertificationStatus,
  RecoveryVerificationResult,
  VisualIntelligenceCertificationInput,
  VisualIntelligenceCertificationReport,
  VisualIntelligenceEngineBundle,
} from "./types.js";

export class CertificationController {
  private config: VisualIntelligenceCertificationConfiguration;
  private status: CertificationStatus = "idle";
  private latestReport: VisualIntelligenceCertificationReport | null = null;
  private performance: CertificationPerformanceStats = {
    totalCertifications: 0,
    successfulCertifications: 0,
    failedCertifications: 0,
    averageCertificationDurationMs: 0,
    peakCertificationDurationMs: 0,
  };

  private readonly sessionManager = new VisualIntelligenceCertificationManager();
  private readonly coordinator = new TSeriesCertificationCoordinator();
  private readonly e2eValidator = new EndToEndVisualIntelligenceValidator();
  private readonly productionValidator = new ProductionReadinessValidator();
  private readonly governanceValidator = new GovernanceComplianceValidator();
  private readonly reportGenerator = new CertificationReportGenerator();
  private readonly outputValidator = new CertificationValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  constructor(
    private repositoryRoot: string,
    private engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
  ) {
    this.config = config;
  }

  getStatus(): CertificationStatus {
    return this.status;
  }

  getConfiguration(): VisualIntelligenceCertificationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: VisualIntelligenceCertificationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): VisualIntelligenceCertificationReport | null {
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

  async certifyVisualIntelligence(
    input: VisualIntelligenceCertificationInput = {},
  ): Promise<VisualIntelligenceCertificationReport> {
    if (!this.config.enabled) {
      throw new Error("Visual Intelligence Certification is disabled by configuration");
    }
    if (this.sessionManager.isRunning()) {
      throw new Error("Certification already running");
    }

    this.sessionManager.startRun();
    this.status = "running";
    const started = Date.now();
    const recoveryResults: RecoveryVerificationResult[] = [];

    appendCertificationLog({
      event: "certification_start",
      level: "info",
      details: "Visual Intelligence certification started (certify-only)",
    });

    try {
      const scope = input.validationScope ?? this.config.validationScope;

      const programmeResults = await this.coordinator.validateProgrammes(
        this.engines,
        this.config,
        scope,
      );
      const t5MissionResults = this.coordinator.validateT5Missions(this.engines, this.config);

      const e2eResult = this.config.requireEndToEndPass
        ? await this.e2eValidator.run(this.engines)
        : {
            passed: true,
            steps: [],
            durationMs: 0,
            summary: "E2E validation skipped by configuration",
          };

      const productionReadiness = this.config.requireProductionReadiness
        ? this.productionValidator.validate(this.engines, this.config)
        : {
            passed: true,
            readinessScore: 100,
            subsystemsHealthy: 0,
            subsystemsTotal: 0,
            recoveryOperational: true,
            details: ["Production readiness skipped by configuration"],
            warnings: [],
            errors: [],
          };

      const governance = this.config.requireGovernanceCompliance
        ? this.governanceValidator.validate(this.engines, this.config)
        : {
            passed: true,
            grandKingAuthorityPreserved: true,
            noAutonomousApproval: true,
            noAutonomousUxDeployment: true,
            validationMandatory: true,
            auditabilityPreserved: true,
            traceabilityPreserved: true,
            learnOnlyModeVerified: true,
            recommendOnlyModeVerified: true,
            details: ["Governance verification skipped by configuration"],
            warnings: [],
            errors: [],
          };

      const programmesPassed = programmeResults.filter((p) => p.passed).length;
      const t5Passed = t5MissionResults.filter((m) => m.passed).length;
      const allProgrammesPass = programmesPassed === programmeResults.length;
      const allT5Pass = t5Passed === t5MissionResults.length;
      const e2eOk = !this.config.requireEndToEndPass || e2eResult.passed;
      const productionOk = !this.config.requireProductionReadiness || productionReadiness.passed;
      const governanceOk = !this.config.requireGovernanceCompliance || governance.passed;

      let decision: CertificationDecision = "fail";
      if (allProgrammesPass && allT5Pass && e2eOk && productionOk && governanceOk) {
        decision = "pass";
      } else if (
        programmesPassed + t5Passed >=
          Math.ceil((programmeResults.length + t5MissionResults.length) * 0.7) &&
        e2eOk &&
        governanceOk
      ) {
        decision = "conditional";
      }

      const certStatus = this.sessionManager.deriveStatus(
        programmesPassed,
        programmeResults.length,
        t5Passed,
        t5MissionResults.length,
        e2eResult.passed,
        governance.passed,
        this.config.requireEndToEndPass,
      );

      const report = this.reportGenerator.generate({
        repositoryRoot: this.repositoryRoot,
        config: this.config,
        programmeResults,
        t5MissionResults,
        e2eResult,
        productionReadiness,
        governance,
        recoveryResults,
        status: certStatus,
        decision,
      });

      const outputValidation = this.outputValidator.validate(report);
      if (outputValidation.decision === "fail") {
        report.detectedFailures.push(...outputValidation.errors);
      }

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
        details: `Visual Intelligence certification ${decision.toUpperCase()} · ${duration}ms`,
      });

      return report;
    } finally {
      this.sessionManager.endRun();
    }
  }
}
