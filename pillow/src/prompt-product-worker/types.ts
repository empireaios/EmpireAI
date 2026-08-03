import type { PromptProductWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PPW_CAPABILITIES,
  PRODUCT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  TARGET_AI_PLATFORMS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type TargetAiPlatform = (typeof TARGET_AI_PLATFORMS)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type PromptProductWorkerCapability = (typeof PPW_CAPABILITIES)[number];

export type PromptLibraryEntry = {
  promptId: string;
  title: string;
  category: string;
  template: string;
  variables?: string[];
  platformHints?: string[];
};

export type WorkflowComponent = {
  componentId: string;
  name: string;
  description: string;
  stepOrder?: number;
};

export type PromptArchitecture = {
  architectureId: string;
  title: string;
  layers: string[];
  categories: string[];
  designPrinciples: string[];
  platformStrategy: string;
};

export type StructuredPromptPack = {
  packId: string;
  name: string;
  category: string;
  promptIds: string[];
  description: string;
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

/** Machine-readable Prompt Product Report (Q5-04). */
export type PromptProductReport = {
  promptProductId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  targetAiPlatforms: string[];
  promptCategories: string[];
  promptLibrary: PromptLibraryEntry[];
  workflowComponents: WorkflowComponent[];
  userInstructions: string;
  qualityReview: string;
  exportFormats: string[];
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  productType: ProductType;
  promptArchitecture: PromptArchitecture | null;
  structuredPacks: StructuredPromptPack[];
  consistencyValidated: boolean;
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
  neverProcessCustomerPayments: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ505OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalPromptProducts: true;
  preserveCompleteTraceability: true;
  validatePromptQuality: true;
  includeUserDocumentation: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type PromptProductContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | null;
  targetAudience?: string | null;
  targetAiPlatforms?: TargetAiPlatform[];
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  receivedResearch?: boolean;
};

export type PromptProductWorkerInput = {
  promptProductId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | string | null;
  targetAudience?: string | null;
  targetAiPlatforms?: Array<TargetAiPlatform | string> | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildSalesPages?: boolean;
  processPayments?: boolean;
  processCustomerPayments?: boolean;
  deliverProducts?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ505OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PromptProductWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PromptProductWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PPW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PromptProductWorkerCapability[];
  totalPromptProducts: number;
  lastPromptProductId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PromptProductWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  promptProducts: PromptProductReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildSalesPages: true;
  neverProcessCustomerPayments: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type PromptProductWorkerRunReport = {
  promptProductRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_research"
    | "design_prompt_architecture"
    | "create_prompt_libraries"
    | "create_reusable_prompt_templates"
    | "create_ai_workflow_products"
    | "organize_prompts_into_structured_packs"
    | "generate_user_instructions"
    | "validate_prompt_consistency"
    | "package_export_ready_prompt_products"
    | "produce_prompt_product_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: PromptProductWorkerEngineRecord;
  catalog: PromptProductWorkerCatalog | null;
  promptProducts: PromptProductReport[];
  latestPromptProduct: PromptProductReport | null;
  integrations: IntegrationHandshake[];
  validation: PromptProductWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PromptProductWorkerState = {
  engineVersion: "PILLOW-PPW-001";
  missionId: "Q5-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: PromptProductWorkerConfiguration;
  latestReport: PromptProductWorkerRunReport | null;
  engineRecord: PromptProductWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPromptProducts: number;
    lastPromptProductId: string | null;
    lastProductType: ProductType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type PromptProductWorkerCockpitSnapshot = {
  missionId: "Q5-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalPromptProducts: number;
  latestPromptProductId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverBuildSalesPages: true;
  neverProcessCustomerPayments: true;
  neverDeliverProducts: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ConsistencyValidationResult = {
  passed: boolean;
  consistencyValidated: boolean;
  summary: string;
  qualityReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
};
