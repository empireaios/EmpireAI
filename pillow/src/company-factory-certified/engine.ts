import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCompanyFactoryCertifiedConfiguration,
  type CompanyFactoryCertifiedConfiguration,
} from "./configuration.js";
import { appendCfcLog, getCfcLogs, resetCfcLogsForTesting } from "./cfc-logging.js";
import { COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationActionInput,
  CertificationCockpitSnapshot,
  CertificationRunReport,
  CertifyCompanyFactoryInput,
  CompanyFactoryCertifiedState,
  ConnectCompanyFactoryCertifiedInput,
} from "./types.js";
import { CompanyFactoryCertificationController } from "./company-factory-certification-controller.js";
import {
  CompanyFactoryCertificationManager,
  type CompanyFactoryCertifiedDependencies,
} from "./company-factory-certification-manager.js";

export interface CompanyFactoryCertifiedOptions {
  configuration?: Partial<CompanyFactoryCertifiedConfiguration>;
}

export type { CompanyFactoryCertifiedDependencies };

/**
 * Company Factory Certified (PILLOW-CFC-001 / X1-15).
 * Certification suite — validates X1-01 through X1-14 in safe test mode.
 */
export class CompanyFactoryCertified {
  private initializedAt: string | null = null;
  private readonly controller: CompanyFactoryCertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CompanyFactoryCertifiedDependencies,
    options: CompanyFactoryCertifiedOptions = {},
  ) {
    const config = buildCompanyFactoryCertifiedConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CompanyFactoryCertificationManager(dependencies);
    this.controller = new CompanyFactoryCertificationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CompanyFactoryCertifiedState> {
    const doc = await this.reader.readText(COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH);
    if (!doc?.includes("Company Factory Certified")) {
      throw new Error(
        `${COMPANY_FACTORY_CERTIFIED_SYSTEM_PATH} missing — requires X1-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCfcLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-15 Company Factory Certified initialized",
    });
    return this.getState();
  }

  getState(): CompanyFactoryCertifiedState {
    if (!this.initializedAt) {
      throw new Error("Company Factory Certified not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-CFC-001",
      missionId: "X1-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCompanyFactoryCertified(
    input: ConnectCompanyFactoryCertifiedInput = {},
  ): CertificationRunReport {
    return this.controller.connectCompanyFactoryCertified(input);
  }

  certifyCompanyFactory(input: CertifyCompanyFactoryInput = {}): CertificationRunReport {
    return this.controller.certifyCompanyFactory(input);
  }

  validateCompanyFramework(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateCompanyFramework(input);
  }

  validateOpportunityDiscovery(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateOpportunityDiscovery(input);
  }

  validateMarketValidation(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateMarketValidation(input);
  }

  validateBusinessModel(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateBusinessModel(input);
  }

  validateBrand(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateBrand(input);
  }

  validateStore(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateStore(input);
  }

  validateProductPortfolio(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateProductPortfolio(input);
  }

  validateLaunch(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.validateLaunch(input);
  }

  runEndToEndCompanyCreation(input: CertificationActionInput = {}): CertificationRunReport {
    return this.controller.runEndToEndCompanyCreation(input);
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
    overrides: Partial<CompanyFactoryCertifiedConfiguration>,
  ): CompanyFactoryCertifiedState {
    const next = buildCompanyFactoryCertifiedConfiguration(this.bootstrap.repositoryRoot, {
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
        `Company Factory Certified status: ${state.status}`,
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

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCertificationReports: state.health.totalCertificationReports,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getCfcLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCompanyFactoryCertified(
  bootstrap: EmpireBootstrapContext,
  dependencies: CompanyFactoryCertifiedDependencies,
  options?: CompanyFactoryCertifiedOptions,
): CompanyFactoryCertified {
  return new CompanyFactoryCertified(bootstrap, dependencies, options);
}

export function resetCompanyFactoryCertifiedForTesting(): void {
  resetCfcLogsForTesting();
  new CompanyFactoryCertificationManager({
    companyFactoryFramework: null,
    businessOpportunityDiscovery: null,
    marketValidationEngine: null,
    businessModelGenerator: null,
    brandCreationEngine: null,
    domainDigitalAssetPlanner: null,
    storeGenerationEngine: null,
    productPortfolioBuilder: null,
    pricingStrategyEngine: null,
    launchReadinessValidator: null,
    businessLaunchOrchestrator: null,
    growthInitializationEngine: null,
    launchMonitoringEngine: null,
    firstRevenueOptimizer: null,
  }).resetForTesting();
}
