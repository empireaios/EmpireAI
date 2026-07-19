/** R3-03 — Banking Integration Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import {
  BANKING_INTEGRATION_ID,
  BI_API_ENDPOINTS,
  BI_METADATA_VERSION,
} from "./paths.js";
import { appendBiLog } from "./bi-logging.js";
import { BankingProviderRegistry } from "./banking-provider-registry.js";
import { BankingAuthenticationManager } from "./banking-authentication-manager.js";
import { BankingApiClient } from "./banking-api-client.js";
import { BankAccountSynchronizationEngine } from "./bank-account-synchronization-engine.js";
import { AccountBalanceSynchronizationEngine } from "./account-balance-synchronization-engine.js";
import { TransactionSynchronizationEngine } from "./transaction-synchronization-engine.js";
import { BankingNotificationHandler } from "./banking-notification-handler.js";
import { BankingRateLimitManager } from "./banking-rate-limit-manager.js";
import { BankingRetryManager } from "./banking-retry-manager.js";
import { BankingValidator } from "./banking-validator.js";
import { BankingMetadataGenerator, mapAuthToValidation } from "./banking-metadata-generator.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type {
  BankingIntegrationRecord,
  BankingIntegrationRunReport,
  ConnectBankingIntegrationInput,
  HandleBankingNotificationInput,
  RegisterBankingProviderInput,
  SyncAccountBalancesInput,
  SyncBankAccountsInput,
  SyncTransactionHistoryInput,
} from "./types.js";

export class BankingIntegrationManager {
  private integrationRecord: BankingIntegrationRecord | null = null;
  private readonly registry = new BankingProviderRegistry();
  private readonly authManager = new BankingAuthenticationManager();
  private readonly apiClient = new BankingApiClient();
  private readonly rateLimitManager = new BankingRateLimitManager();
  private readonly retryManager = new BankingRetryManager();
  private readonly validator = new BankingValidator();
  private readonly metadataGenerator = new BankingMetadataGenerator();
  private readonly accountSyncEngine: BankAccountSynchronizationEngine;
  private readonly balanceSyncEngine: AccountBalanceSynchronizationEngine;
  private readonly transactionSyncEngine: TransactionSynchronizationEngine;
  private readonly notificationHandler: BankingNotificationHandler;

  constructor(private readonly framework: FinancialFrameworkEngine | null) {
    this.accountSyncEngine = new BankAccountSynchronizationEngine(
      this.registry,
      this.metadataGenerator,
    );
    this.balanceSyncEngine = new AccountBalanceSynchronizationEngine(this.registry);
    this.transactionSyncEngine = new TransactionSynchronizationEngine(
      this.registry,
      this.metadataGenerator,
    );
    this.notificationHandler = new BankingNotificationHandler(this.registry);
  }

  getIntegrationRecord(): BankingIntegrationRecord | null {
    return this.integrationRecord;
  }

  getRegistry(): BankingProviderRegistry {
    return this.registry;
  }

  getBankingRecords() {
    return this.registry.listAccounts();
  }

  getTransactionRecords() {
    return this.registry.listTransactions();
  }

  private checkRateLimit(config: BankingIntegrationConfiguration): boolean {
    if (!config.rateLimitEnabled) return true;
    const check = this.rateLimitManager.check(
      BANKING_INTEGRATION_ID,
      config.operationsPerMinute,
      config.rateLimitWindowMs,
    );
    return check.allowed;
  }

  registerWithFramework(
    config: BankingIntegrationConfiguration,
    providerIdentifier: string,
  ): { frameworkModuleId: string | null; validation: BankingIntegrationRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const endpoint = config.useSandbox ? BI_API_ENDPOINTS.sandbox : BI_API_ENDPOINTS.production;

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: BANKING_INTEGRATION_ID,
        moduleVersion: BI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "R3-03",
        authenticationMethod: "oauth2",
        credentialRef: config.credentialRef,
        apiEndpointConfig: {
          baseUrl: endpoint,
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "account.updated",
            "balance.changed",
            "transaction.posted",
            "notification.received",
          ],
          maxEventsPerMinute: config.operationsPerMinute,
          windowMs: config.rateLimitWindowMs,
        },
        rateLimitConfig: {
          enabled: config.rateLimitEnabled,
          requestsPerMinute: config.operationsPerMinute,
          burstLimit: config.burstLimit,
          windowMs: config.rateLimitWindowMs,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendBiLog({
      event: "integration_initialization",
      level: "info",
      details: `Registered banking integration with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `bi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BI_METADATA_VERSION,
      },
    };
  }

  connectBankingIntegration(
    input: ConnectBankingIntegrationInput,
    config: BankingIntegrationConfiguration,
  ): BankingIntegrationRunReport {
    const started = Date.now();
    const credentialRef = input.credentialRef ?? config.credentialRef;
    const providerIdentifier = input.providerIdentifier ?? "plaid";

    const frameworkReg = this.registerWithFramework(config, providerIdentifier);
    const auth = this.authManager.authenticate(credentialRef, config);

    if (!auth.authenticated) {
      const record = this.metadataGenerator.buildIntegrationRecord({
        frameworkModuleId: frameworkReg.frameworkModuleId,
        auth,
        connection: null,
        operationalState: "failed",
        validationStatus: "failed",
        credentialRefPresent: auth.credentialRefPresent,
        providerIdentifier,
      });
      this.integrationRecord = record;
      const validation = this.validator.validateIntegrationRecord(record);
      validation.decision = "fail";
      validation.errors.push("Banking authentication failed");
      return this.metadataGenerator.buildRunReport({
        action: "connect",
        integrationRecord: record,
        bankingRecords: [],
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.registry.registerProvider({ providerIdentifier });

    if (this.framework) {
      this.framework.activateFinancialModule(BANKING_INTEGRATION_ID);
    }

    const connection = this.apiClient.testConnection(config);
    const record = this.metadataGenerator.buildIntegrationRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      auth,
      connection,
      operationalState: connection.passed ? "active" : "failed",
      validationStatus: mapAuthToValidation(auth),
      credentialRefPresent: auth.credentialRefPresent,
      providerIdentifier,
    });
    this.integrationRecord = record;

    const validation = this.validator.validateIntegrationRecord(record);
    if (!connection.passed) {
      validation.decision = "fail";
      validation.errors.push("Banking connection test failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      integrationRecord: record,
      bankingRecords: [],
      transactionRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  registerBankingProvider(
    input: RegisterBankingProviderInput,
    config: BankingIntegrationConfiguration,
  ): BankingIntegrationRunReport {
    const started = Date.now();
    this.registry.registerProvider(input);

    const record =
      this.integrationRecord ??
      this.metadataGenerator.buildIntegrationRecord({
        frameworkModuleId: null,
        auth: {
          authenticated: false,
          authenticationStatus: "unauthenticated",
          sessionStatus: "none",
          credentialRefPresent: false,
          tokenExposed: false,
          details: "Not connected",
        },
        connection: null,
        operationalState: "registered",
        validationStatus: "pending",
        credentialRefPresent: false,
        providerIdentifier: input.providerIdentifier,
      });

    const validation = this.validator.validateIntegrationRecord(record);
    if (!config.bankingProviderRulesEnabled) {
      validation.warnings.push("Banking provider rules disabled");
    }

    return this.metadataGenerator.buildRunReport({
      action: "register_provider",
      integrationRecord: record,
      bankingRecords: [],
      transactionRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  syncBankAccounts(
    input: SyncBankAccountsInput,
    config: BankingIntegrationConfiguration,
  ): BankingIntegrationRunReport {
    const started = Date.now();
    const record = this.integrationRecord;
    if (!record || record.currentOperationalState !== "active") {
      throw new Error("Banking integration not connected");
    }

    if (!this.checkRateLimit(config)) {
      const validation = this.validator.validateIntegrationRecord(record);
      validation.warnings.push("Operation was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "sync_accounts",
        integrationRecord: record,
        bankingRecords: [],
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    try {
      const accounts = this.accountSyncEngine.syncAccounts(input, config);
      const validation = this.validator.validateIntegrationRecord(record);
      for (const acct of accounts) {
        const acctVal = this.validator.validateBankingRecord(acct);
        if (acctVal.warnings.length > 0) validation.warnings.push(...acctVal.warnings);
      }

      if (this.framework) {
        for (const acct of accounts) {
          this.framework.routeFinancialEvent({
            financialModuleIdentifier: BANKING_INTEGRATION_ID,
            topic: "account.updated",
            payloadRef: acct.bankingRecordId,
          });
        }
      }

      return this.metadataGenerator.buildRunReport({
        action: "sync_accounts",
        integrationRecord: record,
        bankingRecords: accounts,
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateIntegrationRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Account sync failed");
      return this.metadataGenerator.buildRunReport({
        action: "sync_accounts",
        integrationRecord: record,
        bankingRecords: [],
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  syncAccountBalances(
    input: SyncAccountBalancesInput,
    config: BankingIntegrationConfiguration,
  ): BankingIntegrationRunReport {
    const started = Date.now();
    const record = this.integrationRecord;
    if (!record) throw new Error("Banking integration not connected");

    try {
      const accounts = this.balanceSyncEngine.syncBalances(input, config);
      const validation = this.validator.validateIntegrationRecord(record);

      if (this.framework) {
        for (const acct of accounts) {
          this.framework.routeFinancialEvent({
            financialModuleIdentifier: BANKING_INTEGRATION_ID,
            topic: "balance.changed",
            payloadRef: acct.bankingRecordId,
          });
        }
      }

      return this.metadataGenerator.buildRunReport({
        action: "sync_balances",
        integrationRecord: record,
        bankingRecords: accounts,
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateIntegrationRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Balance sync failed");
      return this.metadataGenerator.buildRunReport({
        action: "sync_balances",
        integrationRecord: record,
        bankingRecords: [],
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  syncTransactionHistory(
    input: SyncTransactionHistoryInput,
    config: BankingIntegrationConfiguration,
  ): BankingIntegrationRunReport {
    const started = Date.now();
    const record = this.integrationRecord;
    if (!record) throw new Error("Banking integration not connected");

    try {
      const transactions = this.transactionSyncEngine.syncTransactions(input, config);
      const accounts = this.registry.listAccounts();
      const validation = this.validator.validateIntegrationRecord(record);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: BANKING_INTEGRATION_ID,
          topic: "transaction.posted",
          payloadRef: `sync-${transactions.length}-transactions`,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "sync_transactions",
        integrationRecord: record,
        bankingRecords: accounts,
        transactionRecords: transactions,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateIntegrationRecord(record);
      validation.decision = "fail";
      validation.errors.push(
        error instanceof Error ? error.message : "Transaction sync failed",
      );
      return this.metadataGenerator.buildRunReport({
        action: "sync_transactions",
        integrationRecord: record,
        bankingRecords: [],
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  handleBankingNotification(
    input: HandleBankingNotificationInput,
    config: BankingIntegrationConfiguration,
  ): BankingIntegrationRunReport {
    const started = Date.now();
    const record = this.integrationRecord;

    if (!record) {
      const validation = this.validator.validateConfiguration(config);
      validation.decision = "fail";
      validation.errors.push("Banking integration not connected");
      return this.metadataGenerator.buildRunReport({
        action: "handle_notification",
        integrationRecord: this.metadataGenerator.buildIntegrationRecord({
          frameworkModuleId: null,
          auth: {
            authenticated: false,
            authenticationStatus: "unauthenticated",
            sessionStatus: "none",
            credentialRefPresent: false,
            tokenExposed: false,
            details: "Not connected",
          },
          connection: null,
          operationalState: "failed",
          validationStatus: "failed",
          credentialRefPresent: false,
          providerIdentifier: "unknown",
        }),
        bankingRecords: [],
        transactionRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const notification = this.notificationHandler.handle(input, config);
    const validation = this.validator.validateIntegrationRecord(record);
    if (!notification.accepted) {
      validation.decision = "fail";
      validation.errors.push(notification.details);
    }

    if (this.framework && notification.accepted) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: BANKING_INTEGRATION_ID,
        topic: input.topic,
        payloadRef: input.payloadRef,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "handle_notification",
      integrationRecord: record,
      bankingRecords: this.registry.listAccounts(),
      transactionRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.integrationRecord = null;
    this.registry.resetForTesting();
    this.authManager.resetForTesting();
    this.rateLimitManager.resetForTesting();
    this.retryManager.resetForTesting();
  }
}
