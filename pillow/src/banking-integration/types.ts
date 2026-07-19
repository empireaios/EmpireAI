/** PILLOW-BI-001 — Banking Integration types (R3-03). */

import type {
  ACCOUNT_TYPES,
  AUTHENTICATION_STATUSES,
  BI_CAPABILITIES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INTEGRATION_STATES,
  SESSION_STATUSES,
  SYNC_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";

export type BankingIntegrationEngineVersion = "PILLOW-BI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type IntegrationState = (typeof INTEGRATION_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type SyncStatus = (typeof SYNC_STATUSES)[number];
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type BiCapability = (typeof BI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BankingIntegrationRecord = {
  integrationRecordId: string;
  timestamp: string;
  bankingProviderId: string;
  integrationVersion: string;
  providerIdentifier: string;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: BiCapability[];
  currentOperationalState: IntegrationState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkModuleId: string | null;
};

export type BankingRecord = {
  bankingRecordId: string;
  timestamp: string;
  bankingProviderId: string;
  bankAccountReference: string;
  accountType: AccountType;
  accountBalance: number;
  currency: string;
  synchronizationStatus: SyncStatus;
  lastSynchronizationTimestamp: string | null;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type BankingTransactionRecord = {
  transactionId: string;
  bankingRecordId: string;
  timestamp: string;
  amount: number;
  currency: string;
  transactionType: "credit" | "debit";
  description: string;
  postedAt: string;
  metadataVersion: string;
};

export type BankingAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type BankingConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type BankingNotificationResult = {
  notificationId: string;
  accepted: boolean;
  verified: boolean;
  bankingRecordId: string | null;
  details: string;
};

export type BankingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BankingIntegrationRunReport = {
  integrationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_provider"
    | "sync_accounts"
    | "sync_balances"
    | "sync_transactions"
    | "handle_notification";
  integrationRecord: BankingIntegrationRecord;
  bankingRecords: BankingRecord[];
  transactionRecords: BankingTransactionRecord[];
  validation: BankingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BankingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  integrationEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: BankingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  synchronizedAccounts: number;
  notes: string[];
};

export type BankingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  accountSyncs: number;
  balanceSyncs: number;
  transactionSyncs: number;
  notificationsHandled: number;
  rateLimitedOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BankingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BankingIntegrationState = {
  engineVersion: BankingIntegrationEngineVersion;
  missionId: "R3-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: BankingIntegrationConfiguration;
  latestReport: BankingIntegrationRunReport | null;
  integrationRecord: BankingIntegrationRecord | null;
  health: BankingHealthReport;
  performance: BankingPerformanceStats;
};

export type BankingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: IntegrationState | null;
  lastDecision: BankingValidationReport["decision"] | null;
  synchronizedAccounts: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectBankingIntegrationInput = {
  credentialRef?: string;
  providerIdentifier?: string;
  forceReconnect?: boolean;
};

export type RegisterBankingProviderInput = {
  providerIdentifier: string;
  providerVersion?: string;
};

export type SyncBankAccountsInput = {
  providerIdentifier?: string;
  includeFixtureAccounts?: boolean;
};

export type SyncAccountBalancesInput = {
  bankAccountReference?: string;
  includeFixtureBalances?: boolean;
};

export type SyncTransactionHistoryInput = {
  bankAccountReference?: string;
  includeFixtureTransactions?: boolean;
};

export type HandleBankingNotificationInput = {
  topic: string;
  payloadRef: string;
  bankAccountReference?: string;
};
