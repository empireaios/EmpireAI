/** PILLOW-MC-001 — Multi-Currency Engine types (R3-12). */

import type {
  CONVERSION_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MC_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";

export type MultiCurrencyEngineVersion = "PILLOW-MC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];
export type McCapability = (typeof MC_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type MultiCurrencyEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: McCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  bankingIntegrationConnected: boolean;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  taxIntelligenceEngineConnected: boolean;
};

export type CurrencyRecord = {
  currencyRecordId: string;
  timestamp: string;
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  convertedAmount: number;
  originalAmount: number;
  exchangeRateSource: string;
  conversionStatus: ConversionStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ExchangeRateRecord = {
  rateId: string;
  timestamp: string;
  sourceCurrency: string;
  targetCurrency: string;
  rate: number;
  provider: string;
  metadataVersion: string;
};

export type CurrencyGainLossRecord = {
  gainLossId: string;
  timestamp: string;
  sourceCurrency: string;
  reportingCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  gainLossAmount: number;
  metadataVersion: string;
};

export type CurrencyAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  currencyRecordId: string | null;
};

export type CurrencySummary = {
  summaryId: string;
  timestamp: string;
  reportingCurrency: string;
  totalConversions: number;
  totalConvertedAmount: number;
  totalGainLoss: number;
  byCurrencyPair: Record<string, { count: number; totalConverted: number }>;
  metadataVersion: string;
};

export type CurrencyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MultiCurrencyRunReport = {
  currencyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "record_transaction_currency"
    | "convert_currency"
    | "refresh_exchange_rates"
    | "calculate_gain_loss"
    | "generate_summary";
  engineRecord: MultiCurrencyEngineRecord;
  currencyRecords: CurrencyRecord[];
  exchangeRates: ExchangeRateRecord[];
  gainLossRecords: CurrencyGainLossRecord[];
  anomalies: CurrencyAnomaly[];
  summary: CurrencySummary | null;
  validation: CurrencyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CurrencyHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CurrencyValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCurrencyRecords: number;
  aggregateConvertedAmount: number;
  lastConversionStatus: ConversionStatus | null;
  notes: string[];
};

export type CurrencyPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  conversionsPerformed: number;
  exchangeRatesRefreshed: number;
  gainLossCalculations: number;
  summariesGenerated: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type McLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MultiCurrencyEngineState = {
  engineVersion: MultiCurrencyEngineVersion;
  missionId: "R3-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: MultiCurrencyEngineConfiguration;
  latestReport: MultiCurrencyRunReport | null;
  engineRecord: MultiCurrencyEngineRecord | null;
  health: CurrencyHealthReport;
  performance: CurrencyPerformanceStats;
};

export type CurrencyCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: CurrencyValidationReport["decision"] | null;
  totalCurrencyRecords: number;
  aggregateConvertedAmount: number;
  lastConversionStatus: ConversionStatus | null;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectMultiCurrencyEngineInput = {
  forceReconnect?: boolean;
};

export type RecordTransactionCurrencyInput = {
  sourceCurrency: string;
  originalAmount: number;
  revenueReference?: string;
  expenseReference?: string;
};

export type ConvertCurrencyInput = {
  sourceCurrency: string;
  targetCurrency: string;
  originalAmount: number;
};

export type RefreshExchangeRatesInput = {
  forceRefresh?: boolean;
};

export type CalculateCurrencyGainLossInput = {
  sourceCurrency: string;
  originalAmount: number;
  reportingCurrency?: string;
};

export type GenerateCurrencySummaryInput = {
  reportingCurrency?: string;
};
