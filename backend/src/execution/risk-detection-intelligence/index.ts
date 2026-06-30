export {
  DETECTION_SEVERITIES,
  trafficDropDetectionSchema,
  validateTrafficDropDetection,
} from "./models/traffic-drop-detection.js";
export type { DetectionSeverity, TrafficDropDetection } from "./models/traffic-drop-detection.js";

export {
  supplierFailureDetectionSchema,
  validateSupplierFailureDetection,
} from "./models/supplier-failure-detection.js";
export type { SupplierFailureDetection } from "./models/supplier-failure-detection.js";

export {
  campaignFailureDetectionSchema,
  validateCampaignFailureDetection,
} from "./models/campaign-failure-detection.js";
export type { CampaignFailureDetection } from "./models/campaign-failure-detection.js";

export {
  chargebackRiskDetectionSchema,
  validateChargebackRiskDetection,
} from "./models/chargeback-risk-detection.js";
export type { ChargebackRiskDetection } from "./models/chargeback-risk-detection.js";

export {
  inventoryRiskDetectionSchema,
  validateInventoryRiskDetection,
} from "./models/inventory-risk-detection.js";
export type { InventoryRiskDetection } from "./models/inventory-risk-detection.js";

export {
  seoPenaltyDetectionSchema,
  validateSeoPenaltyDetection,
} from "./models/seo-penalty-detection.js";
export type { SeoPenaltyDetection } from "./models/seo-penalty-detection.js";

export {
  RISK_ALERT_CATEGORIES,
  riskAlertSchema,
  validateRiskAlert,
} from "./models/risk-alert.js";
export type { RiskAlertCategory, RiskAlert } from "./models/risk-alert.js";

export {
  RISK_DETECTION_SIGNAL_TYPES,
  riskDetectionSignalSchema,
  validateRiskDetectionSignal,
} from "./models/risk-detection-signal.js";
export type { RiskDetectionSignalType, RiskDetectionSignal } from "./models/risk-detection-signal.js";

export {
  riskDetectionReportSchema,
  validateRiskDetectionReport,
} from "./models/risk-detection-report.js";
export type {
  RiskDetectionReportId,
  RiskDetectionReport,
  RiskDetectionReportCreateInput,
} from "./models/risk-detection-report.js";

export {
  riskDetectionRecordSchema,
  validateRiskDetectionRecord,
} from "./models/risk-detection-record.js";
export type {
  RiskDetectionRecordId,
  RiskDetectionRecord,
  RiskDetectionRecordCreateInput,
} from "./models/risk-detection-record.js";

export type {
  RiskDetectionIntelligenceRepositoryQuery,
  RiskDetectionIntelligenceRepository,
} from "./repositories/risk-detection-intelligence-repository.js";

export {
  InMemoryRiskDetectionIntelligenceRepository,
  createInMemoryRiskDetectionIntelligenceRepository,
} from "./repositories/in-memory-risk-detection-intelligence-repository.js";

export {
  RISK_DETECTION_SIGNAL_WEIGHTS,
  generateRiskDetection,
  riskDetectionIntelligenceScoring,
} from "./scoring/risk-detection-intelligence-scoring.js";
export type {
  RiskDetectionBrandInput,
  RiskDetectionMetricsInput,
  RiskDetectionInput,
  RiskDetectionBreakdown,
} from "./scoring/risk-detection-intelligence-scoring.js";

export {
  RiskDetectionIntelligenceEngine,
  defaultRiskDetectionIntelligenceEngine,
} from "./engines/risk-detection-intelligence-engine.js";

export {
  RISK_DETECTION_INTELLIGENCE_MODULE_ID,
  RISK_DETECTION_INTELLIGENCE_MODULE_VERSION,
  RISK_DETECTION_INTELLIGENCE_CAPABILITIES,
  RISK_DETECTION_INTELLIGENCE_MODULE_CONTRACT,
  RiskDetectionIntelligenceModule,
  createRiskDetectionIntelligenceModule,
  riskDetectionIntelligenceModule,
} from "./contract/risk-detection-intelligence-module.js";
export type {
  RiskDetectionIntelligenceModuleId,
  RiskDetectionIntelligenceCapability,
  RiskDetectionIntelligenceModuleContract,
} from "./contract/risk-detection-intelligence-module.js";
