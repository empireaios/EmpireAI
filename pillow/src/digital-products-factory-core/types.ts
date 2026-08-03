import type { DigitalProductsFactoryCoreConfiguration } from "./configuration.js";
import type {
  ANALYTICS_STATUSES,
  APPROVAL_STATUSES,
  DPF_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  FULFILMENT_STATUSES,
  INTEGRATION_TARGETS,
  LEARNING_STATUSES,
  MISSION_STATUSES,
  OPERATIONAL_STATES,
  PIPELINE_STAGES,
  PIPELINE_TYPES,
  PRODUCTION_STATUSES,
  PRODUCT_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type PipelineType = (typeof PIPELINE_TYPES)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type ContentStage = PipelineStage;
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];
export type AnalyticsStatus = (typeof ANALYTICS_STATUSES)[number];
export type LearningStatus = (typeof LEARNING_STATUSES)[number];
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type DigitalProductsFactoryCoreCapability = (typeof DPF_CAPABILITIES)[number];

/** Machine-readable Digital Product Business Mission (Q5-01). */
export type DigitalProductBusinessMission = {
  factoryMissionId: string;
  timestamp: string;
  businessId: string;
  businessName: string;
  missionObjective: string;
  productPortfolio: string[];
  activeProducts: string[];
  productType: ProductType | string;
  pipelineId: string | null;
  pipelineType: PipelineType | string;
  pipelineName: string | null;
  currentPipelineStage: PipelineStage | string;
  currentStatus: MissionStatus | string;
  assignedWorkers: string[];
  assignedWorkerRoles: string[];
  approvalStatus: ApprovalStatus | string;
  fulfilmentStatus: FulfilmentStatus | string;
  analyticsStatus: AnalyticsStatus | string;
  learningStatus: LearningStatus | string;
  productionStatus: ProductionStatus | string;
  executiveSummary: string;
  missionCoordinationRef: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  missionVersion: string;
  workerId: string;
  neverCreateEbooks: true;
  neverCreateCourses: true;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ502OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Machine-readable Digital Products Factory Report (Q5-01). */
export type DigitalProductsFactoryReport = {
  factoryMissionId: string;
  timestamp: string;
  businessId: string;
  productPortfolio: string[];
  activeProducts: string[];
  currentPipelineStage: PipelineStage | string;
  assignedWorkers: string[];
  fulfilmentStatus: FulfilmentStatus | string;
  analyticsStatus: AnalyticsStatus | string;
  learningStatus: LearningStatus | string;
  executiveSummary: string;
  metadataVersion: string;
  approvalStatus: ApprovalStatus | string;
  productionStatus: ProductionStatus | string;
  missionCoordinationRef: string | null;
  executiveReportId: string | null;
  submittedToExecutiveReporting: boolean;
  assignedWorkerRoles: string[];
  pipelineId: string | null;
  pipelineType: PipelineType | string;
  productType: ProductType | string;
  businessName: string;
  traceabilityRefs: string[];
  preservedDecisions: string[];
  workerId: string;
  reportVersion: string;
  neverCreateEbooks: true;
  neverCreateCourses: true;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ502OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export type DigitalProductsFactoryCoreInput = {
  factoryMissionId?: string | null;
  businessId?: string | null;
  businessName?: string | null;
  missionObjective?: string | null;
  productPortfolio?: string[] | null;
  activeProducts?: string[] | null;
  productType?: ProductType | string | null;
  pipelineId?: string | null;
  pipelineType?: PipelineType | string | null;
  pipelineName?: string | null;
  currentPipelineStage?: PipelineStage | string | null;
  assignedWorkers?: string[] | null;
  assignedWorkerRoles?: string[] | null;
  approvalStatus?: ApprovalStatus | string | null;
  fulfilmentStatus?: FulfilmentStatus | string | null;
  analyticsStatus?: AnalyticsStatus | string | null;
  learningStatus?: LearningStatus | string | null;
  productionStatus?: ProductionStatus | string | null;
  executiveSummary?: string | null;
  grandKingApproved?: boolean | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  createEbooks?: boolean;
  createCourses?: boolean;
  buildSalesPages?: boolean;
  processPayments?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ502OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type DigitalProductsFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DigitalProductsFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DPF-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DigitalProductsFactoryCoreCapability[];
  totalMissions: number;
  lastProductType: ProductType | string | null;
  lastPipelineType: PipelineType | string | null;
  lastMissionId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type DigitalProductsFactoryCoreCatalog = {
  missionVersion: string;
  reportVersion: string;
  workerId: string;
  productTypes: string[];
  pipelineTypes: string[];
  missions: DigitalProductBusinessMission[];
  reports: DigitalProductsFactoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverCreateEbooks: true;
  neverCreateCourses: true;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type DigitalProductsFactoryCoreRunReport = {
  digitalProductsFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_digital_product_business_mission"
    | "register_digital_product_business"
    | "coordinate_product_creation"
    | "coordinate_design_branding"
    | "coordinate_sales_page"
    | "coordinate_checkout"
    | "coordinate_fulfilment"
    | "coordinate_customer_delivery"
    | "coordinate_analytics"
    | "coordinate_learning"
    | "track_business_lifecycle"
    | "manage_lifecycle"
    | "coordinate_workers"
    | "coordinate_approval"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: DigitalProductsFactoryCoreEngineRecord;
  catalog: DigitalProductsFactoryCoreCatalog | null;
  missions: DigitalProductBusinessMission[];
  latestMission: DigitalProductBusinessMission | null;
  latestReport: DigitalProductsFactoryReport | null;
  integrations: IntegrationHandshake[];
  validation: DigitalProductsFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DigitalProductsFactoryCoreState = {
  engineVersion: "PILLOW-DPF-001";
  missionId: "Q5-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: DigitalProductsFactoryCoreConfiguration;
  latestReport: DigitalProductsFactoryCoreRunReport | null;
  engineRecord: DigitalProductsFactoryCoreEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMissions: number;
    lastMissionId: string | null;
    notes: string[];
  };
};

export type DigitalProductsFactoryCoreCockpitSnapshot = {
  missionId: "Q5-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  latestMissionId: string | null;
  workerId: string;
  neverCreateEbooks: true;
  neverCreateCourses: true;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
