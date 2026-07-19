/** PILLOW-CSE-001 — Customer Sentiment Engine (R4-10). */

export {
  CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH,
  CSE_METADATA_VERSION,
  CUSTOMER_SENTIMENT_ENGINE_ID,
  ENGINE_STATUSES,
  ENGINE_STATES,
  COMMUNICATION_CHANNELS,
  SENTIMENT_CATEGORIES,
  ALERT_STATUSES,
  CSE_CAPABILITIES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerSentimentEngineConfiguration,
  loadCustomerSentimentEngineConfigFile,
  DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION,
  type CustomerSentimentEngineConfiguration,
  type AnalysisRule,
  type AlertThresholdRule,
  type TrendRule,
} from "./configuration.js";

export type {
  CustomerSentimentEngineVersion,
  EngineStatus,
  EngineState,
  CommunicationChannel,
  SentimentCategory,
  AlertStatus,
  CseCapability,
  ValidationStatus,
  HealthStatus,
  SentimentEngineRecord,
  SentimentRecord,
  SentimentAlert,
  SentimentTrend,
  SentimentFailure,
  SentimentValidationReport,
  SentimentRunReport,
  SentimentHealthReport,
  SentimentPerformanceStats,
  SentimentCockpitSnapshot,
  CseLogEntry,
  ConnectCustomerSentimentEngineInput,
  AnalyzeCustomerMessageInput,
  AnalyzeCustomerConversationInput,
  DetectCustomerSatisfactionInput,
  DetectCustomerFrustrationInput,
  DetectEscalationRiskInput,
  DetectPositiveExperienceInput,
  TrackSentimentTrendsInput,
  CalculateSentimentScoreInput,
  GenerateSentimentAlertsInput,
  DetectSentimentFailuresInput,
  CustomerSentimentEngineState,
} from "./types.js";

export {
  CustomerSentimentEngine,
  createCustomerSentimentEngine,
  resetCustomerSentimentEngineForTesting,
  type CustomerSentimentEngineOptions,
} from "./engine.js";

export { CustomerSentimentManager } from "./customer-sentiment-manager.js";
export { CustomerSentimentController } from "./customer-sentiment-controller.js";
export { SentimentAnalysisEngine } from "./sentiment-analysis-engine.js";
export { ConversationAnalysisEngine } from "./conversation-analysis-engine.js";
export { SentimentScoringEngine } from "./sentiment-scoring-engine.js";
export { TrendAnalysisEngine } from "./trend-analysis-engine.js";
export { SentimentAlertEngine } from "./sentiment-alert-engine.js";
export { SentimentAnalyticsEngine } from "./sentiment-analytics-engine.js";
export { SentimentValidationEngine } from "./sentiment-validation-engine.js";
export { SentimentMetadataGenerator } from "./sentiment-metadata-generator.js";
export { SentimentValidator } from "./sentiment-validator.js";
export { HealthMonitor } from "./health-monitor.js";
export { RecoveryManager } from "./recovery-manager.js";
export { SentimentRegistry } from "./sentiment-registry.js";
export { appendCseLog, getCseLogs, resetCseLogsForTesting } from "./cse-logging.js";
