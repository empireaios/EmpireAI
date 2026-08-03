/** PILLOW-ILE-001 — International Logistics Engine types (X4-08). */

import type {
  ENGINE_STATUSES,
  FULFILLMENT_STATUSES,
  HEALTH_STATUSES,
  ILE_CAPABILITIES,
  LOGISTICS_CATEGORIES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";

export type InternationalLogisticsEngineVersion = "PILLOW-ILE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type IleCapability = (typeof ILE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type LogisticsCategory = (typeof LOGISTICS_CATEGORIES)[number];
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type LogisticsRecord = {
  logisticsRecordId: string;
  timestamp: string;
  companyReference: string;
  originRegion: string;
  destinationRegion: string;
  logisticsProvider: string;
  deliveryPerformance: number;
  shippingCost: number;
  costUnit: "structural_units";
  fulfillmentStatus: FulfillmentStatus;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  logisticsCategory: LogisticsCategory;
  riskLevel: RiskLevel;
  riskScore: number;
  bottleneckDetected: boolean;
  fulfillmentRiskDetected: boolean;
  routeOptimized: boolean;
  logisticsTraceId: string;
  structuralSignalOnly: true;
  neverRecommendWithUnvalidatedLogisticsData: true;
  unvalidatedRecommendationClaim: "none";
};

export type InternationalLogisticsEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: IleCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
    currencyIntelligence: boolean;
    regionalComplianceEngine: boolean;
    globalTaxIntelligence: boolean;
  };
  metadataVersion: string;
};

export type LogisticsRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  originRegion: string;
  destinationRegion: string;
  logisticsProvider: string;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverRecommendWithUnvalidatedLogisticsData: true;
  unvalidatedRecommendationClaim: "none";
};

export type LogisticsValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type IleRunReport = {
  logisticsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_shipping_networks"
    | "monitor_providers"
    | "monitor_shipping_performance"
    | "monitor_delivery_times"
    | "monitor_fulfillment_capacity"
    | "monitor_shipping_costs"
    | "detect_bottlenecks"
    | "detect_fulfillment_risks"
    | "optimize_routes"
    | "recommend_logistics"
    | "diagnostics";
  engineRecord: InternationalLogisticsEngineRecord;
  logisticsRecords: LogisticsRecord[];
  recommendations: LogisticsRecommendation[];
  validation: LogisticsValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type IleHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LogisticsValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalLogisticsRecords: number;
  bottleneckCount: number;
  fulfillmentRiskCount: number;
  notes: string[];
};

export type IlePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  shippingNetworkOps: number;
  providerMonitors: number;
  performanceMonitors: number;
  deliveryMonitors: number;
  capacityMonitors: number;
  costMonitors: number;
  bottleneckDetections: number;
  fulfillmentRiskDetections: number;
  routeOptimizations: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type InternationalLogisticsEngineState = {
  engineVersion: InternationalLogisticsEngineVersion;
  missionId: "X4-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: InternationalLogisticsEngineConfiguration;
  latestReport: IleRunReport | null;
  engineRecord: InternationalLogisticsEngineRecord | null;
  health: IleHealthReport;
  performance: IlePerformanceStats;
};

export type IleCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LogisticsValidationReport["decision"] | null;
  totalLogisticsRecords: number;
  bottleneckCount: number;
  fulfillmentRiskCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type IleLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectInternationalLogisticsEngineInput = Record<string, unknown>;

export type LogisticsAnalysisInput = {
  companyReference?: string;
  originRegion?: string;
  destinationRegion?: string;
  logisticsProvider?: string;
  logisticsCategory?: LogisticsCategory;
  deliveryPerformanceHint?: number;
  shippingCostHint?: number;
  riskHint?: number;
  bottleneckHint?: boolean;
  fulfillmentRiskHint?: boolean;
  validated?: boolean;
};

export type RunIleDiagnosticsInput = {
  companyReference?: string;
  originRegion?: string;
  destinationRegion?: string;
};
