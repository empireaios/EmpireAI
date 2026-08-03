import type { DesignWorkerConfiguration } from "./configuration.js";
import type {
  ASSET_TYPES,
  DW_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PRODUCT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type AssetType = (typeof ASSET_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type DesignWorkerCapability = (typeof DW_CAPABILITIES)[number];

export type DesignAsset = {
  assetId: string;
  title: string;
  assetType: string;
  description: string;
  dimensions?: string;
  formatHint?: string;
};

export type BrandingThemeDetails = {
  primaryColor: string;
  accentColor: string;
  typography: string;
  mood: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type SelfReviewFinding = {
  findingId: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
};

/** Machine-readable Design Worker Report (Q5-07). */
export type DesignWorkerReport = {
  designReportId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  assetTypesCreated: string[];
  brandingTheme: string;
  previewAssets: DesignAsset[];
  mockupAssets: DesignAsset[];
  exportFormats: string[];
  qualityReview: string;
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  productType: ProductType;
  productCategory: string;
  brandingThemeDetails: BrandingThemeDetails;
  ebookCovers: DesignAsset[];
  courseCovers: DesignAsset[];
  brandingAssets: DesignAsset[];
  promotionalGraphics: DesignAsset[];
  allAssets: DesignAsset[];
  brandingConsistencyValidated: boolean;
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  selfReviewSummary: string;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishAssetsDirectly: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ508OrLater: true;
  followApprovedProductIntent: true;
  produceOriginalVisualAssets: true;
  maintainConsistentBranding: true;
  preserveCompleteTraceability: true;
  performQualityReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type DesignContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | null;
  targetAudience?: string | null;
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  brandingTheme?: string | null;
  receivedProductInformation?: boolean;
};

export type DesignWorkerInput = {
  designReportId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | string | null;
  productCategory?: string | null;
  brandingTheme?: string | null;
  targetAudience?: string | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  assetCount?: number | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverProducts?: boolean;
  publishAssetsDirectly?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ508OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type DesignWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DesignWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DesignWorkerCapability[];
  totalDesignReports: number;
  lastDesignReportId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type DesignWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  designReports: DesignWorkerReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishAssetsDirectly: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type DesignWorkerRunReport = {
  designRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_information"
    | "generate_ebook_covers"
    | "generate_course_covers"
    | "generate_product_branding_assets"
    | "generate_promotional_graphics"
    | "generate_realistic_product_mockups"
    | "generate_preview_images"
    | "maintain_visual_branding_consistency"
    | "prepare_export_ready_design_assets"
    | "produce_design_worker_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: DesignWorkerEngineRecord;
  catalog: DesignWorkerCatalog | null;
  designReports: DesignWorkerReport[];
  latestDesignReport: DesignWorkerReport | null;
  integrations: IntegrationHandshake[];
  validation: DesignWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DesignWorkerState = {
  engineVersion: "PILLOW-DW-001";
  missionId: "Q5-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: DesignWorkerConfiguration;
  latestReport: DesignWorkerRunReport | null;
  engineRecord: DesignWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalDesignReports: number;
    lastDesignReportId: string | null;
    lastProductType: ProductType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type DesignWorkerCockpitSnapshot = {
  missionId: "Q5-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalDesignReports: number;
  latestDesignReportId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishAssetsDirectly: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  brandingConsistencyValidated: boolean;
};
