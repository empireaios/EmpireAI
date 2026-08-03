import type { TemplateBuilderWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PRODUCT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  SUPPORTED_ASSET_FORMATS,
  TBW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type SupportedAssetFormat = (typeof SUPPORTED_ASSET_FORMATS)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type TemplateBuilderWorkerCapability = (typeof TBW_CAPABILITIES)[number];

export type TemplateSection = {
  heading: string;
  content: string;
};

export type ReusableTemplateAsset = {
  assetId: string;
  title: string;
  templateType: string;
  description: string;
  body: string;
  sections?: TemplateSection[];
};

export type PlannerTask = {
  taskId: string;
  title: string;
  description: string;
  dueOffsetDays?: number;
};

export type PlannerWeek = {
  weekNumber: number;
  theme: string;
  tasks: PlannerTask[];
};

export type TemplatePlanner = {
  assetId: string;
  title: string;
  description: string;
  weeks: PlannerWeek[];
};

export type TemplateSpreadsheet = {
  assetId: string;
  title: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
};

export type ContractClause = {
  clauseId: string;
  title: string;
  body: string;
};

export type TemplateContract = {
  assetId: string;
  title: string;
  description: string;
  clauses: ContractClause[];
};

export type FormField = {
  fieldId: string;
  label: string;
  fieldType: string;
  required: boolean;
  helperText?: string;
};

export type TemplateForm = {
  assetId: string;
  title: string;
  description: string;
  fields: FormField[];
};

export type ChecklistItem = {
  itemId: string;
  label: string;
  completedDefault: boolean;
};

export type TemplateChecklist = {
  assetId: string;
  title: string;
  description: string;
  items: ChecklistItem[];
};

export type PromptLibraryEntry = {
  promptId: string;
  title: string;
  category: string;
  prompt: string;
  usageNotes: string;
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

/** Machine-readable Template Builder Report (Q5-06). */
export type TemplateBuilderReport = {
  templateProductId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  productCategory: string;
  templateTypes: string[];
  includedAssets: string[];
  targetAudience: string;
  supportedFormats: string[];
  qualityReview: string;
  exportFormats: string[];
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  productType: ProductType;
  templates: ReusableTemplateAsset[];
  planners: TemplatePlanner[];
  spreadsheets: TemplateSpreadsheet[];
  contracts: TemplateContract[];
  forms: TemplateForm[];
  checklists: TemplateChecklist[];
  promptLibrary: PromptLibraryEntry[];
  usabilityValidated: boolean;
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
  neverDeliverProductsToCustomers: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ507OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalReusableAssets: true;
  preserveCompleteTraceability: true;
  validateUsabilityBeforeSubmission: true;
  performSelfReview: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type TemplateContext = {
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
  receivedResearch?: boolean;
};

export type TemplateBuilderWorkerInput = {
  templateProductId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | string | null;
  productCategory?: string | null;
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
  deliverProductsToCustomers?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ507OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type TemplateBuilderWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TemplateBuilderWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-TBW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TemplateBuilderWorkerCapability[];
  totalTemplateProducts: number;
  lastTemplateProductId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type TemplateBuilderWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  templateProducts: TemplateBuilderReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProductsToCustomers: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type TemplateBuilderWorkerRunReport = {
  templateRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_research"
    | "generate_reusable_templates"
    | "generate_planners"
    | "generate_spreadsheets"
    | "generate_contracts_and_document_templates"
    | "generate_business_forms_and_checklists"
    | "generate_reusable_prompt_libraries"
    | "validate_usability_and_completeness"
    | "prepare_export_ready_template_packages"
    | "produce_template_builder_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: TemplateBuilderWorkerEngineRecord;
  catalog: TemplateBuilderWorkerCatalog | null;
  templateProducts: TemplateBuilderReport[];
  latestTemplateProduct: TemplateBuilderReport | null;
  integrations: IntegrationHandshake[];
  validation: TemplateBuilderWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TemplateBuilderWorkerState = {
  engineVersion: "PILLOW-TBW-001";
  missionId: "Q5-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: TemplateBuilderWorkerConfiguration;
  latestReport: TemplateBuilderWorkerRunReport | null;
  engineRecord: TemplateBuilderWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalTemplateProducts: number;
    lastTemplateProductId: string | null;
    lastProductType: ProductType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type TemplateBuilderWorkerCockpitSnapshot = {
  missionId: "Q5-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalTemplateProducts: number;
  latestTemplateProductId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProductsToCustomers: true;
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
  usabilityValidated: boolean;
};
