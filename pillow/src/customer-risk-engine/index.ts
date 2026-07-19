export {
  CUSTOMER_RISK_ENGINE_SYSTEM_PATH,
  CUSTOMER_RISK_ENGINE_ID,
  CRE_METADATA_VERSION,
  CRE_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  RISK_CATEGORIES,
  RISK_LEVELS,
  RECOMMENDED_ACTIONS,
  ALERT_STATUSES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerRiskEngineConfiguration,
  DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION,
  type CustomerRiskEngineConfiguration,
  type FraudDetectionRule,
  type RiskThresholdRule,
  type AlertRule,
} from "./configuration.js";

export {
  CustomerRiskEngine,
  createCustomerRiskEngine,
  resetCustomerRiskEngineForTesting,
  type CustomerRiskEngineOptions,
} from "./engine.js";

export type {
  CustomerRiskEngineVersion,
  CustomerRiskEngineState,
  CustomerRiskEngineRecord,
  CustomerRiskRecord,
  CustomerRiskAlert,
  CustomerRiskFailure,
  CustomerRiskValidationReport,
  CustomerRiskRunReport,
  CustomerRiskHealthReport,
  CustomerRiskPerformanceStats,
  CustomerRiskCockpitSnapshot,
  ConnectCustomerRiskEngineInput,
  EvaluateCustomerRiskInput,
  DetectFraudIndicatorsInput,
  DetectAccountAbuseInput,
  DetectSuspiciousPurchasingInput,
  DetectSuspiciousReturnBehaviourInput,
  DetectSuspiciousCommunicationInput,
  CalculateCustomerRiskScoreInput,
  GenerateCustomerRiskAlertsInput,
  RecommendMitigationActionsInput,
  DetectCustomerRiskFailuresInput,
  EngineStatus,
  EngineState,
  RiskCategory,
  RiskLevel,
  RecommendedAction,
  AlertStatus,
  HealthStatus,
} from "./types.js";

export { appendCreLog, getCreLogs, resetCreLogsForTesting } from "./cre-logging.js";
