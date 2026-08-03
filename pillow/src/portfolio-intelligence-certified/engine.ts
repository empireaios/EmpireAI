import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioIntelligenceCertifiedConfiguration,
  type PortfolioIntelligenceCertifiedConfiguration,
} from "./configuration.js";
import { appendPicLog, getPicLogs, resetPicLogsForTesting } from "./pic-logging.js";
import { PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationActionInput,
  CertificationCockpitSnapshot,
  CertificationRunReport,
  CertifyPortfolioIntelligenceInput,
  ConnectPortfolioIntelligenceCertifiedInput,
  PortfolioIntelligenceCertifiedState,
} from "./types.js";
import { PortfolioIntelligenceCertificationController } from "./portfolio-intelligence-certification-controller.js";
import {
  PortfolioIntelligenceCertificationManager,
  type PortfolioIntelligenceCertifiedDependencies,
} from "./portfolio-intelligence-certification-manager.js";

export interface PortfolioIntelligenceCertifiedOptions {
  configuration?: Partial<PortfolioIntelligenceCertifiedConfiguration>;
}

export type { PortfolioIntelligenceCertifiedDependencies };

/**
 * Portfolio Intelligence Certified (PILLOW-PIC-001 / X2-10).
 * Certification suite — validates X2-01 through X2-09 in safe test mode.
 */
export class PortfolioIntelligenceCertified {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioIntelligenceCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioIntelligenceCertifiedDependencies,
    options: PortfolioIntelligenceCertifiedOptions = {},
  ) {
    const config = buildPortfolioIntelligenceCertifiedConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioIntelligenceCertificationManager(dependencies);
    this.controller = new PortfolioIntelligenceCertificationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioIntelligenceCertifiedState> {
    const doc = await this.reader.readText(PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Intelligence Certified")) {
      throw new Error(
        `${PORTFOLIO_INTELLIGENCE_CERTIFIED_SYSTEM_PATH} missing — requires X2-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPicLog({
      event: "engine_initialization",
      level: "info",
      details: "X2-10 Portfolio Intelligence Certified initialized",
    });
    return this.getState();
  }

  getState(): PortfolioIntelligenceCertifiedState {
    if (!this.initializedAt) {
      throw new Error("Portfolio Intelligence Certified not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const certificationReports = this.controller.getManager().getCertificationReports();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCertificationReports: certificationReports.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PIC-001",
      missionId: "X2-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioIntelligenceCertified(
    input: ConnectPortfolioIntelligenceCertifiedInput = {},
  ): CertificationRunReport {
    return this.controller.connectPortfolioIntelligenceCertified(input);
  }

  certifyPortfolioIntelligence(
    input: CertifyPortfolioIntelligenceInput = {},
  ): CertificationRunReport {
    return this.controller.certifyPortfolioIntelligence(input);
  }

  validateEnterprisePortfolio(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateEnterprisePortfolio(input);
  }

  validateCompanyRegistry(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateCompanyRegistry(input);
  }

  validatePortfolioAnalytics(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validatePortfolioAnalytics(input);
  }

  validateKnowledgeSharing(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateKnowledgeSharing(input);
  }

  validateCapitalDistribution(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateCapitalDistribution(input);
  }

  validateExecutiveDashboard(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateExecutiveDashboard(input);
  }

  validatePortfolioRisk(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validatePortfolioRisk(input);
  }

  validatePortfolioBalance(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validatePortfolioBalance(input);
  }

  validateBusinessHealth(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateBusinessHealth(input);
  }

  runEndToEndPortfolio(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.runEndToEndPortfolio(input);
  }

  generateCertificationReport(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.generateCertificationReport(input);
  }

  getLatestReport(): CertificationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCertificationReports() {
    return this.controller.getManager().getCertificationReports();
  }

  updateConfiguration(
    overrides: Partial<PortfolioIntelligenceCertifiedConfiguration>,
  ): PortfolioIntelligenceCertifiedState {
    const next = buildPortfolioIntelligenceCertifiedConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Portfolio Intelligence Certified status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No certification operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;
    const reports = this.getCertificationReports();
    const latestCert = reports.length > 0 ? reports[reports.length - 1]! : null;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCertificationReports: state.health.totalCertificationReports,
      overallCertificationStatus: latestCert?.overallCertificationStatus ?? null,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getPicLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioIntelligenceCertified(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioIntelligenceCertifiedDependencies,
  options?: PortfolioIntelligenceCertifiedOptions,
): PortfolioIntelligenceCertified {
  return new PortfolioIntelligenceCertified(bootstrap, dependencies, options);
}

export function resetPortfolioIntelligenceCertifiedForTesting(): void {
  resetPicLogsForTesting();
  new PortfolioIntelligenceCertificationManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
    portfolioBalanceEngine: null,
    businessHealthRanking: null,
  }).resetForTesting();
}
