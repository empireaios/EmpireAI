/** PILLOW-SGE-001 — Store Generation Engine types (X1-07). */

import type {
  DEPLOYMENT_READINESS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SGE_CAPABILITIES,
  STOREFRONT_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { StoreGenerationEngineConfiguration } from "./configuration.js";

export type StoreGenerationEngineVersion = "PILLOW-SGE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SgeCapability = (typeof SGE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type StorefrontStatus = (typeof STOREFRONT_STATUSES)[number];
export type DeploymentReadiness = (typeof DEPLOYMENT_READINESS)[number];

export type StorefrontEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SgeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessModelGenerator: boolean;
    brandCreationEngine: boolean;
    domainDigitalAssetPlanner: boolean;
  };
  metadataVersion: string;
};

export type StorefrontRecord = {
  storefrontId: string;
  timestamp: string;
  companyReference: string;
  brandReference: string;
  domainPlanReference: string;
  websiteStructureReference: string;
  navigationStructure: string;
  homepageLayout: string;
  productCatalogueStructure: string;
  categoryStructure: string;
  companyInformationPages: string;
  legalPageTemplates: string;
  deploymentPackageReference: string;
  storefrontStatus: StorefrontStatus;
  deploymentReadiness: DeploymentReadiness;
  storefrontFingerprint: string;
  structuralSignalOnly: true;
  automaticDeployment: false;
  fabricatedStorefrontFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type StorefrontValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type StorefrontRunReport = {
  storefrontRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "generate_storefront"
    | "create_website_structure"
    | "create_navigation_structure"
    | "create_homepage_layout"
    | "create_product_catalogue_structure"
    | "create_category_structure"
    | "create_company_information_pages"
    | "prepare_legal_page_templates"
    | "prepare_deployment_package";
  engineRecord: StorefrontEngineRecord;
  storefrontRecords: StorefrontRecord[];
  validation: StorefrontValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type StorefrontHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: StorefrontValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalStorefrontRecords: number;
  notes: string[];
};

export type StorefrontPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  storefrontsGenerated: number;
  websiteStructureRuns: number;
  navigationRuns: number;
  catalogueRuns: number;
  deploymentPackageRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type StorefrontLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type StoreGenerationEngineState = {
  engineVersion: StoreGenerationEngineVersion;
  missionId: "X1-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: StoreGenerationEngineConfiguration;
  latestReport: StorefrontRunReport | null;
  engineRecord: StorefrontEngineRecord | null;
  health: StorefrontHealthReport;
  performance: StorefrontPerformanceStats;
};

export type StorefrontCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: StorefrontValidationReport["decision"] | null;
  totalStorefrontRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectStoreGenerationEngineInput = {
  forceReconnect?: boolean;
};

export type GenerateStorefrontInput = {
  companyReference?: string;
  brandReference?: string;
  domainPlanReference?: string;
  industry?: string;
  validated?: boolean;
};

export type StorefrontActionInput = {
  storefrontId?: string;
  companyReference?: string;
  brandReference?: string;
  domainPlanReference?: string;
  industry?: string;
  validated?: boolean;
};
