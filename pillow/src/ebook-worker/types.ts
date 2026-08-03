import type { EbookWorkerConfiguration } from "./configuration.js";
import type {
  EBW_CAPABILITIES,
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
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type EbookWorkerCapability = (typeof EBW_CAPABILITIES)[number];

export type EbookChapterStructureEntry = {
  chapterNumber: number;
  title: string;
  summary?: string;
  wordCount?: number;
};

export type EbookChapter = {
  chapterNumber: number;
  title: string;
  summary: string;
  body: string;
  wordCount: number;
};

export type EbookOutlineSection = {
  sectionNumber: number;
  title: string;
  description: string;
};

export type EbookOutline = {
  title: string;
  subtitle: string;
  tableOfContents: string[];
  sections: EbookOutlineSection[];
  learningObjectives: string[];
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

/** Machine-readable Ebook Report (Q5-03). */
export type EbookReport = {
  ebookId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  productType: ProductType;
  targetAudience: string;
  chapterStructure: EbookChapterStructureEntry[];
  wordCount: number;
  includedResources: string[];
  qualityReview: string;
  exportFormats: string[];
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  outline: EbookOutline | null;
  chapters: EbookChapter[];
  formattingApplied: boolean;
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
  neverImplementQ504OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalContent: true;
  preserveCompleteTraceability: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type EbookContext = {
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

export type EbookWorkerInput = {
  ebookId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | string | null;
  targetAudience?: string | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  chapterCount?: number | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverProductsToCustomers?: boolean;
  publishProductsDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ504OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type EbookWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EbookWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EBW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EbookWorkerCapability[];
  totalEbooks: number;
  lastEbookId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type EbookWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  ebooks: EbookReport[];
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

export type EbookWorkerRunReport = {
  ebookRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_research"
    | "create_product_outline"
    | "create_chapter_structure"
    | "generate_complete_written_content"
    | "generate_tables_checklists_summaries"
    | "generate_references_and_appendices"
    | "apply_consistent_formatting"
    | "perform_self_review"
    | "prepare_export_ready_ebook_assets"
    | "produce_ebook_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: EbookWorkerEngineRecord;
  catalog: EbookWorkerCatalog | null;
  ebooks: EbookReport[];
  latestEbook: EbookReport | null;
  integrations: IntegrationHandshake[];
  validation: EbookWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EbookWorkerState = {
  engineVersion: "PILLOW-EBW-001";
  missionId: "Q5-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: EbookWorkerConfiguration;
  latestReport: EbookWorkerRunReport | null;
  engineRecord: EbookWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalEbooks: number;
    lastEbookId: string | null;
    lastProductType: ProductType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type EbookWorkerCockpitSnapshot = {
  missionId: "Q5-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEbooks: number;
  latestEbookId: string | null;
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
};
