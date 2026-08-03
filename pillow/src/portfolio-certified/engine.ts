/** X2-21 — Portfolio Certified engine facade. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioCertifiedConfiguration,
  type PortfolioCertifiedConfiguration,
} from "./configuration.js";
import { appendPtcLog, getPtcLogs, resetPtcLogsForTesting } from "./ptc-logging.js";
import { PORTFOLIO_CERTIFIED_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationActionInput,
  CertificationCockpitSnapshot,
  CertificationRunReport,
  CertifyPortfolioInput,
  ConnectPortfolioCertifiedInput,
  PortfolioCertifiedState,
} from "./types.js";
import { PortfolioCertificationController } from "./portfolio-certification-controller.js";
import {
  PortfolioCertificationManager,
  type PortfolioCertifiedDependencies,
} from "./portfolio-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioCertifiedOptions {
  configuration?: Partial<PortfolioCertifiedConfiguration>;
}

export type { PortfolioCertifiedDependencies };

/**
 * Portfolio Certified (PILLOW-PTC-001 / X2-21).
 * Final Portfolio Intelligence programme certification — X2-01 through X2-20 in safe test mode.
 */
export class PortfolioCertified {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioCertifiedDependencies,
    options: PortfolioCertifiedOptions = {},
  ) {
    const config = buildPortfolioCertifiedConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioCertificationManager(dependencies);
    this.controller = new PortfolioCertificationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioCertifiedState> {
    const doc = await this.reader.readText(PORTFOLIO_CERTIFIED_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Certified")) {
      throw new Error(
        `${PORTFOLIO_CERTIFIED_SYSTEM_PATH} missing — requires X2-21 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPtcLog({
      event: "engine_initialization",
      level: "info",
      details: "X2-21 Portfolio Certified initialized — safe test mode",
    });
    return this.getState();
  }

  getState(): PortfolioCertifiedState {
    if (!this.initializedAt) {
      throw new Error("Portfolio Certified not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-PTC-001",
      missionId: "X2-21",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioCertified(input: ConnectPortfolioCertifiedInput = {}): CertificationRunReport {
    return this.controller.connectPortfolioCertified(input);
  }

  certifyPortfolio(input: CertifyPortfolioInput = {}): CertificationRunReport {
    return this.controller.certifyPortfolio(input);
  }

  validateCrossModule(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateCrossModule(input);
  }

  validateEndToEnd(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateEndToEnd(input);
  }

  validateExecutiveGovernance(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateExecutiveGovernance(input);
  }

  generateCertificationReport(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.generateCertificationReport(input);
  }

  runDiagnostics(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.runDiagnostics(input);
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
    overrides: Partial<PortfolioCertifiedConfiguration>,
  ): PortfolioCertifiedState {
    const next = buildPortfolioCertifiedConfiguration(this.bootstrap.repositoryRoot, {
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
    const latestCert = this.getCertificationReports().at(-1);
    const score = latestCert?.overallPortfolioReadinessScore
      ?? (report
        ? report.validation.decision === "pass"
          ? 100
          : report.validation.decision === "partial"
            ? 70
            : 40
        : state.health.healthScore);

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Portfolio Certified status: ${state.status}`,
        latestCert
          ? `Overall: ${latestCert.overallCertificationStatus} · readiness=${latestCert.overallPortfolioReadinessScore}`
          : "No portfolio certification runs yet",
        "Safe test mode — production systems unmodified",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const latestCert = this.getCertificationReports().at(-1);
    const deps = record?.dependencyPresence;
    const dependenciesConnected = deps
      ? Object.values(deps).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCertificationReports: state.health.totalCertificationReports,
      overallCertificationStatus: latestCert?.overallCertificationStatus ?? null,
      overallPortfolioReadinessScore: latestCert?.overallPortfolioReadinessScore ?? null,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getPtcLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioCertified(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioCertifiedDependencies,
  options?: PortfolioCertifiedOptions,
): PortfolioCertified {
  return new PortfolioCertified(bootstrap, dependencies, options);
}

export function resetPortfolioCertifiedForTesting(): void {
  resetPtcLogsForTesting();
  new PortfolioCertificationManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
    portfolioBalanceEngine: null,
    businessHealthRanking: null,
    portfolioIntelligenceCertified: null,
    crossCompanyResourceEngine: null,
    sharedCustomerIntelligence: null,
    sharedSupplierIntelligence: null,
    portfolioForecastEngine: null,
    acquisitionEvaluationEngine: null,
    portfolioOptimizationEngine: null,
    companyLifecycleManager: null,
    portfolioExpansionPlanner: null,
    enterpriseValueEngine: null,
    autonomousPortfolioBoard: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
