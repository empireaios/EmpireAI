import type { SalesPageWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PAGE_TYPES,
  PRODUCT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  SPW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type PageType = (typeof PAGE_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SalesPageWorkerCapability = (typeof SPW_CAPABILITIES)[number];

export type LandingPageSection = {
  sectionId: string;
  sectionType: string;
  title: string;
  order: number;
  summary?: string;
};

export type FeatureSection = {
  sectionId: string;
  title: string;
  body: string;
  order: number;
};

export type PricingPresentation = {
  sectionId: string;
  headline: string;
  tiers: Array<{ name: string; priceLabel: string; includes: string[] }>;
  notes: string;
};

export type SalesTestimonial = {
  testimonialId: string;
  quote: string;
  attribution: string;
  fabricated: false;
  status: "placeholder" | "approved";
  approved: boolean;
};

export type FaqItem = {
  faqId: string;
  question: string;
  answer: string;
};

export type CtaBlock = {
  ctaId: string;
  label: string;
  supportingCopy: string;
  placement: string;
};

export type GuaranteeBlock = {
  guaranteeId: string;
  title: string;
  body: string;
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

/** Machine-readable Sales Page Report (Q5-08). */
export type SalesPageReport = {
  salesPageId: string;
  timestamp: string;
  productId: string;
  productTitle: string;
  landingPageStructure: LandingPageSection[];
  headline: string;
  ctaSummary: string;
  sectionsGenerated: string[];
  assetsReferenced: string[];
  complianceReview: string;
  qualityReview: string;
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  pageType: PageType;
  productType: ProductType;
  headlines: string[];
  benefitCopy: string;
  featureSections: FeatureSection[];
  pricingPresentation: PricingPresentation | null;
  testimonials: SalesTestimonial[];
  faqs: FaqItem[];
  ctas: CtaBlock[];
  guarantees: GuaranteeBlock[];
  exportFormats: string[];
  readabilityOptimized: boolean;
  conversionOptimized: boolean;
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
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishWebsites: true;
  neverPublishPagesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ509OrLater: true;
  neverFabricateTestimonials: true;
  followApprovedProductInformation: true;
  produceOriginalSalesCopy: true;
  preserveCompleteTraceability: true;
  maintainEmpireAiBrandingStandards: true;
  performQualityReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type SalesPageContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | null;
  pageType?: PageType | null;
  targetAudience?: string | null;
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  productDescription?: string | null;
  pricingHint?: string | null;
  approvedTestimonials?: Array<{ quote: string; attribution?: string }> | null;
  designAssetRefs?: string[];
  receivedProductInformation?: boolean;
};

export type SalesPageWorkerInput = {
  salesPageId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  productType?: ProductType | string | null;
  pageType?: PageType | string | null;
  productCategory?: string | null;
  productDescription?: string | null;
  targetAudience?: string | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  pricingHint?: string | null;
  approvedTestimonials?: Array<{ quote: string; attribution?: string }> | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  processPayments?: boolean;
  deliverProducts?: boolean;
  publishWebsites?: boolean;
  publishPagesDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ509OrLater?: boolean;
  fabricateTestimonials?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SalesPageWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SalesPageWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SPW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SalesPageWorkerCapability[];
  totalSalesPages: number;
  lastSalesPageId: string | null;
  lastPageType: PageType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SalesPageWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  salesPages: SalesPageReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishWebsites: true;
  neverPublishPagesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateTestimonials: true;
};

export type SalesPageWorkerRunReport = {
  salesPageRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_information"
    | "generate_complete_landing_page_structure"
    | "generate_compelling_headlines"
    | "generate_benefit_driven_copy"
    | "generate_feature_sections"
    | "generate_pricing_presentation"
    | "generate_testimonials_or_placeholders"
    | "generate_faq_sections"
    | "generate_call_to_action_sections"
    | "generate_guarantee_sections"
    | "optimize_page_structure_for_readability_and_conversion"
    | "produce_sales_page_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: SalesPageWorkerEngineRecord;
  catalog: SalesPageWorkerCatalog | null;
  salesPages: SalesPageReport[];
  latestSalesPage: SalesPageReport | null;
  integrations: IntegrationHandshake[];
  validation: SalesPageWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SalesPageWorkerState = {
  engineVersion: "PILLOW-SPW-001";
  missionId: "Q5-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: SalesPageWorkerConfiguration;
  latestReport: SalesPageWorkerRunReport | null;
  engineRecord: SalesPageWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalSalesPages: number;
    lastSalesPageId: string | null;
    lastPageType: PageType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type SalesPageWorkerCockpitSnapshot = {
  missionId: "Q5-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalSalesPages: number;
  latestSalesPageId: string | null;
  lastPageType: PageType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishWebsites: true;
  neverPublishPagesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateTestimonials: true;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  complianceReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  readabilityOptimized: boolean;
  conversionOptimized: boolean;
};
