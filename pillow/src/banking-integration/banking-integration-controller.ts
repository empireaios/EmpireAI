/** R3-03 — Banking Integration Controller. */

import { appendBiLog } from "./bi-logging.js";
import { BankingIntegrationManager } from "./banking-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type {
  BankingIntegrationRunReport,
  BankingPerformanceStats,
  ConnectBankingIntegrationInput,
  EngineStatus,
  HandleBankingNotificationInput,
  RegisterBankingProviderInput,
  SyncAccountBalancesInput,
  SyncBankAccountsInput,
  SyncTransactionHistoryInput,
} from "./types.js";

export class BankingIntegrationController {
  private config: BankingIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BankingIntegrationRunReport | null = null;
  private readonly manager: BankingIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BankingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    accountSyncs: 0,
    balanceSyncs: 0,
    transactionSyncs: 0,
    notificationsHandled: 0,
    rateLimitedOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: BankingIntegrationManager, config: BankingIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBiLog({
      event: "integration_initialization",
      level: "info",
      details: "Banking Integration ready (R3-03)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BankingIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BankingIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BankingIntegrationRunReport | null {
    return this.latestReport;
  }

  getManager(): BankingIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): BankingPerformanceStats {
    return { ...this.performance };
  }

  connectBankingIntegration(
    input: ConnectBankingIntegrationInput = {},
  ): BankingIntegrationRunReport {
    if (!this.config.enabled) throw new Error("Banking Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendBiLog({
      event: "connection_attempt",
      level: "info",
      details: "connectBankingIntegration started",
    });
    const report = this.manager.connectBankingIntegration(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  registerBankingProvider(input: RegisterBankingProviderInput): BankingIntegrationRunReport {
    const report = this.manager.registerBankingProvider(input, this.config);
    this.finalizeOperation(report, "register_provider");
    return report;
  }

  syncBankAccounts(input: SyncBankAccountsInput = {}): BankingIntegrationRunReport {
    this.status = "synchronizing";
    this.performance.accountSyncs += 1;
    const report = this.manager.syncBankAccounts(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedOperations += 1;
    }
    this.finalizeOperation(report, "sync_accounts");
    return report;
  }

  syncAccountBalances(input: SyncAccountBalancesInput = {}): BankingIntegrationRunReport {
    this.status = "synchronizing";
    this.performance.balanceSyncs += 1;
    const report = this.manager.syncAccountBalances(input, this.config);
    this.finalizeOperation(report, "sync_balances");
    return report;
  }

  syncTransactionHistory(
    input: SyncTransactionHistoryInput = {},
  ): BankingIntegrationRunReport {
    this.status = "synchronizing";
    this.performance.transactionSyncs += 1;
    const report = this.manager.syncTransactionHistory(input, this.config);
    this.finalizeOperation(report, "sync_transactions");
    return report;
  }

  handleBankingNotification(
    input: HandleBankingNotificationInput,
  ): BankingIntegrationRunReport {
    this.performance.notificationsHandled += 1;
    const report = this.manager.handleBankingNotification(input, this.config);
    this.finalizeOperation(report, "handle_notification");
    return report;
  }

  private finalizeOperation(report: BankingIntegrationRunReport, action: string): void {
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
        report.integrationRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendBiLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
