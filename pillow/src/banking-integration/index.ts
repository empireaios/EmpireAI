/** PILLOW-BI-001 — Banking Integration exports (R3-03). */

export {
  BankingIntegrationEngine,
  createBankingIntegrationEngine,
  resetBankingIntegrationForTesting,
} from "./engine.js";

export {
  buildBankingIntegrationConfiguration,
  DEFAULT_BANKING_INTEGRATION_CONFIGURATION,
  type BankingIntegrationConfiguration,
} from "./configuration.js";

export {
  BANKING_INTEGRATION_SYSTEM_PATH,
  BI_METADATA_VERSION,
  BANKING_INTEGRATION_ID,
  BI_CAPABILITIES,
  ENGINE_STATUSES,
  INTEGRATION_STATES,
} from "./paths.js";

export type {
  BankingIntegrationEngineVersion,
  BankingIntegrationRecord,
  BankingRecord,
  BankingTransactionRecord,
  BankingIntegrationRunReport,
  BankingIntegrationState,
  BankingCockpitSnapshot,
  BankingHealthReport,
  BankingPerformanceStats,
  ConnectBankingIntegrationInput,
  RegisterBankingProviderInput,
  SyncBankAccountsInput,
  SyncAccountBalancesInput,
  SyncTransactionHistoryInput,
  HandleBankingNotificationInput,
  BiCapability,
  EngineStatus,
  IntegrationState,
  AuthenticationStatus,
  ConnectionStatus,
  SyncStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
