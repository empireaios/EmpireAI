import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import {
  buildBankingIntegrationConfiguration,
  type BankingIntegrationConfiguration,
} from "./configuration.js";
import { appendBiLog, getBiLogs, resetBiLogsForTesting } from "./bi-logging.js";
import { BANKING_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  BankingCockpitSnapshot,
  BankingIntegrationRunReport,
  BankingIntegrationState,
  ConnectBankingIntegrationInput,
  HandleBankingNotificationInput,
  RegisterBankingProviderInput,
  SyncAccountBalancesInput,
  SyncBankAccountsInput,
  SyncTransactionHistoryInput,
} from "./types.js";
import { BankingIntegrationController } from "./banking-integration-controller.js";
import { BankingIntegrationManager } from "./banking-integration-manager.js";

export interface BankingIntegrationOptions {
  configuration?: Partial<BankingIntegrationConfiguration>;
}

/**
 * Banking Integration (PILLOW-BI-001 / R3-03).
 * Bank connectivity through the Financial Framework — structural API, no live HTTP.
 */
export class BankingIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: BankingIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    options: BankingIntegrationOptions = {},
  ) {
    const config = buildBankingIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BankingIntegrationManager(financialFramework);
    this.controller = new BankingIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BankingIntegrationState> {
    const doc = await this.reader.readText(BANKING_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Banking Integration")) {
      throw new Error(
        `${BANKING_INTEGRATION_SYSTEM_PATH} missing — Banking Integration requires R3-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBiLog({
      event: "integration_initialization",
      level: "info",
      details: "R3-03 Banking Integration initialized",
    });
    return this.getState();
  }

  getState(): BankingIntegrationState {
    if (!this.initializedAt) {
      throw new Error("Banking Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getIntegrationRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      synchronizedAccounts: this.controller.getManager().getBankingRecords().length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BI-001",
      missionId: "R3-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      integrationRecord: record,
      health,
      performance,
    };
  }

  connectBankingIntegration(
    input: ConnectBankingIntegrationInput = {},
  ): BankingIntegrationRunReport {
    return this.controller.connectBankingIntegration(input);
  }

  registerBankingProvider(input: RegisterBankingProviderInput): BankingIntegrationRunReport {
    return this.controller.registerBankingProvider(input);
  }

  syncBankAccounts(input: SyncBankAccountsInput = {}): BankingIntegrationRunReport {
    return this.controller.syncBankAccounts(input);
  }

  syncAccountBalances(input: SyncAccountBalancesInput = {}): BankingIntegrationRunReport {
    return this.controller.syncAccountBalances(input);
  }

  syncTransactionHistory(
    input: SyncTransactionHistoryInput = {},
  ): BankingIntegrationRunReport {
    return this.controller.syncTransactionHistory(input);
  }

  handleBankingNotification(
    input: HandleBankingNotificationInput,
  ): BankingIntegrationRunReport {
    return this.controller.handleBankingNotification(input);
  }

  getLatestReport(): BankingIntegrationRunReport | null {
    return this.controller.getLatestReport();
  }

  getIntegrationRecord() {
    return this.controller.getManager().getIntegrationRecord();
  }

  getBankingRecords() {
    return this.controller.getManager().getBankingRecords();
  }

  getTransactionRecords() {
    return this.controller.getManager().getTransactionRecords();
  }

  updateConfiguration(
    overrides: Partial<BankingIntegrationConfiguration>,
  ): BankingIntegrationState {
    const next = buildBankingIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Banking integration status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No banking operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BankingCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.integrationRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      authenticationStatus: record?.authenticationStatus ?? null,
      connectionStatus: record?.connectionStatus ?? null,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      synchronizedAccounts: state.performance.accountSyncs,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getBiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBankingIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  options?: BankingIntegrationOptions,
): BankingIntegrationEngine {
  return new BankingIntegrationEngine(bootstrap, financialFramework, options);
}

export function resetBankingIntegrationForTesting(): void {
  resetBiLogsForTesting();
  new BankingIntegrationManager(null).resetForTesting();
}
