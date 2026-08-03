import type { LocalSeoReport } from "../local-seo-worker/types.js";
import type { LeadGenerationWorkerConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CONVERSION_STAGES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LEAD_SOURCES,
  LGW_CAPABILITIES,
  OPERATIONAL_STATES,
  QUALIFICATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];
export type ConversionStage = (typeof CONVERSION_STAGES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LeadGenerationWorkerCapability = (typeof LGW_CAPABILITIES)[number];

export type { LocalSeoReport };

/** Deterministic fixture mirroring LocalSeoReport shape for tests / offline funnel context. */
export type LocalSeoFixture = {
  reportId?: string;
  businessProjectId?: string;
  targetLocation?: string;
  serviceCategory?: string;
  businessName?: string;
  landingPagesGenerated?: Array<{
    pageId?: string;
    pageType?: string;
    title?: string;
    urlRecommendation?: string;
    serviceName?: string;
    locationLabel?: string;
  }>;
  localKeywords?: Array<{ phrase?: string }>;
  confidenceScore?: number;
};

export type EnquiryFormField = {
  fieldId: string;
  name: string;
  label: string;
  fieldType: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
};

export type EnquiryForm = {
  formId: string;
  funnelId: string;
  businessProjectId: string;
  name: string;
  leadSource: LeadSource;
  fields: EnquiryFormField[];
  submitLabel: string;
  landingPageRef: string | null;
  createdAt: string;
  updatedAt: string;
  neverExposeProhibitedPersonalData: true;
};

export type LeadFunnel = {
  funnelId: string;
  businessProjectId: string;
  name: string;
  serviceCategory: string;
  targetLocation: string;
  landingPageRefs: string[];
  formIds: string[];
  leadSourcePrimary: LeadSource;
  status: "draft" | "active" | "paused" | "archived";
  sourceSeoReportId: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string[];
};

export type LeadScore = {
  scoreId: string;
  leadId: string;
  value: number;
  band: "low" | "medium" | "high" | "unknown";
  factors: string[];
  scoredAt: string;
  fabricated: false;
};

export type ConversionStageRecord = {
  stageId: string;
  leadId: string;
  funnelId: string;
  stage: ConversionStage;
  recordedAt: string;
  source: "observed" | "system";
  fabricated: false;
  notes: string;
};

export type CapturedLead = {
  leadId: string;
  funnelId: string;
  formId: string | null;
  businessProjectId: string;
  leadSource: LeadSource;
  qualificationStatus: QualificationStatus;
  conversionStage: ConversionStage;
  contactName: string;
  contactChannel: string;
  contactEmail: string | null;
  contactPhone: string | null;
  interest: string;
  message: string;
  capturedAt: string;
  updatedAt: string;
  score: LeadScore | null;
  crmLeadRef: string | null;
  bookingRef: string | null;
  crmIntegrationStatus: "not_routed" | "routed" | "failed" | "unavailable";
  bookingIntegrationStatus: "not_routed" | "routed" | "failed" | "unavailable" | "not_qualified";
  formSubmission: Record<string, string>;
  sourceSeoReportId: string | null;
  tags: string[];
  fabricated: false;
};

export type FunnelMetrics = {
  metricsId: string;
  funnelId: string;
  businessProjectId: string;
  generatedAt: string;
  totalCapturedLeads: number;
  leadsBySource: Record<string, number>;
  leadsByQualification: Record<string, number>;
  leadsByConversionStage: Record<string, number>;
  qualifiedCount: number;
  routedToCrmCount: number;
  routedToBookingCount: number;
  averageScore: number | null;
  confidenceScore: number;
  derivedFromObservedCapturesOnly: true;
  neverFabricated: true;
  notes: string[];
};

export type SourceAttribution = {
  leadSource: LeadSource;
  landingPageRef: string | null;
  formId: string | null;
  seoKeywordHints: string[];
  utmCampaign: string | null;
};

export type LeadGenerationReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  funnelId: string;
  leadSource: LeadSource;
  leadQualificationStatus: QualificationStatus;
  leadScore: LeadScore | null;
  crmIntegrationStatus: CapturedLead["crmIntegrationStatus"];
  bookingIntegrationStatus: CapturedLead["bookingIntegrationStatus"];
  conversionStage: ConversionStage;
  funnelPerformanceSummary: FunnelMetrics;
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  forms: EnquiryForm[];
  capturedLeads: CapturedLead[];
  sourceAttribution: SourceAttribution;
  sourceSeoReportId: string;
  consumableByQ709: true;
  neverExecuteAdvertisingCampaigns: true;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverDeliverCustomerJobs: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateLeadOrConversionResults: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ709OrLater: true;
  preserveCompleteLeadTraceability: true;
  preserveFunnelAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
};

export type LeadGenInput = {
  reportId?: string | null;
  funnelId?: string | null;
  formId?: string | null;
  leadId?: string | null;
  businessProjectId?: string | null;
  businessName?: string | null;
  funnelName?: string | null;
  formName?: string | null;
  serviceCategory?: string | null;
  targetLocation?: string | null;
  leadSource?: LeadSource | string | null;
  qualificationStatus?: QualificationStatus | string | null;
  conversionStage?: ConversionStage | string | null;
  contactName?: string | null;
  contactChannel?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  interest?: string | null;
  message?: string | null;
  formSubmission?: Record<string, string> | null;
  landingPageRef?: string | null;
  utmCampaign?: string | null;
  tags?: string[] | null;
  localSeoReport?: LocalSeoReport | null;
  seoReportId?: string | null;
  fixtureLocalSeo?: LocalSeoFixture | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeAdvertisingCampaigns?: boolean;
  replaceCrm?: boolean;
  replaceBookingWorker?: boolean;
  deliverCustomerJobs?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateLeadOrConversionResults?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ709OrLater?: boolean;
};

export type FunnelSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "building" | "reported" | "submitted" | "rejected";
  input: LeadGenInput;
  funnelId: string | null;
  sourceSeoReportId: string | null;
  seoSource: "localSeoReport" | "seoReportId" | "fixtureLocalSeo" | "none";
  businessName: string;
  targetLocation: string;
  serviceCategory: string;
  metrics: FunnelMetrics | null;
};

export type FunnelContext = {
  funnelId: string;
  businessProjectId: string;
  sourceSeoReportId: string;
  businessName: string;
  serviceCategory: string;
  targetLocation: string;
  landingPageRefs: string[];
  keywordHints: string[];
  localSeo: LocalSeoReport | LocalSeoFixture | null;
  now: string;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LeadGenerationWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LeadGenerationWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LGW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LeadGenerationWorkerCapability[];
  totalReports: number;
  totalFunnels: number;
  totalLeads: number;
  lastFunnelId: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LeadGenerationWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: LeadGenerationReport[];
  funnels: LeadFunnel[];
  forms: EnquiryForm[];
  leads: CapturedLead[];
  metrics: FunnelMetrics[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteAdvertisingCampaigns: true;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverDeliverCustomerJobs: true;
  neverFabricateLeadOrConversionResults: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ709OrLater: true;
  consumableByQ709: true;
};

export type LeadGenerationWorkerRunReport = {
  lgwRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_lead_funnel"
    | "generate_enquiry_form"
    | "capture_lead"
    | "qualify_lead"
    | "score_lead"
    | "route_lead_to_crm"
    | "route_lead_to_booking"
    | "track_conversion_stage"
    | "measure_funnel_performance"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: LeadGenerationWorkerEngineRecord;
  catalog: LeadGenerationWorkerCatalog | null;
  reports: LeadGenerationReport[];
  funnels: LeadFunnel[];
  forms: EnquiryForm[];
  leads: CapturedLead[];
  latestReport: LeadGenerationReport | null;
  latestFunnel: LeadFunnel | null;
  latestForm: EnquiryForm | null;
  latestLead: CapturedLead | null;
  latestMetrics: FunnelMetrics | null;
  integrations: IntegrationHandshake[];
  validation: LeadGenerationWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LeadGenerationWorkerState = {
  engineVersion: "PILLOW-LGW-001";
  missionId: "Q7-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: LeadGenerationWorkerConfiguration;
  latestReport: LeadGenerationWorkerRunReport | null;
  engineRecord: LeadGenerationWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalFunnels: number;
    totalLeads: number;
    lastReportId: string | null;
    lastFunnelId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type LeadGenerationWorkerCockpitSnapshot = {
  missionId: "Q7-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalFunnels: number;
  totalLeads: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverExecuteAdvertisingCampaigns: true;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverDeliverCustomerJobs: true;
  neverFabricateLeadOrConversionResults: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ709OrLater: true;
  consumableByQ709: true;
};

/** Stable subset contract for Q7-09 downstream consumers. */
export type Q709ConsumableContract = {
  contractVersion: "LGW-Q709-v1";
  consumableByQ709: true;
  fields: readonly string[];
  types: {
    LeadGenerationReport: "LeadGenerationReport";
    LeadFunnel: "LeadFunnel";
    EnquiryForm: "EnquiryForm";
    CapturedLead: "CapturedLead";
    FunnelMetrics: "FunnelMetrics";
    LeadScore: "LeadScore";
    ConversionStageRecord: "ConversionStageRecord";
  };
  notes: string[];
  neverExecuteAdvertisingCampaigns: true;
  neverReplaceCrm: true;
  neverReplaceBookingWorker: true;
  neverDeliverCustomerJobs: true;
  neverFabricateLeadOrConversionResults: true;
};
