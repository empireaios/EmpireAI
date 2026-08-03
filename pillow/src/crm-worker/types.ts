import type {
  BookingReport,
  BookingRecord,
  Q705ConsumableContract,
} from "../booking-worker/types.js";
import type { CrmWorkerConfiguration } from "./configuration.js";
import type {
  CRMW_CAPABILITIES,
  CUSTOMER_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LEAD_STATUSES,
  LIFECYCLE_STAGES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CrmWorkerCapability = (typeof CRMW_CAPABILITIES)[number];

export type { BookingReport, BookingRecord, Q705ConsumableContract };

/** Deterministic fixture mirroring BookingReport shape for tests / offline CRM. */
export type BookingFixture = {
  bookingId: string;
  customerReference: string;
  serviceSelected: string;
  scheduledDateTime: string;
  assignedWorker: string | null;
  bookingStatus: string;
  businessProjectId?: string;
  reportId?: string;
  packageId?: string;
  serviceArea?: string;
  confidenceScore?: number;
};

export type ContactChannel =
  | "phone"
  | "email"
  | "sms"
  | "in_person"
  | "chat"
  | "system"
  | "unknown";

export type ContactHistoryEntry = {
  contactId: string;
  customerId: string;
  timestamp: string;
  channel: ContactChannel;
  summary: string;
  direction: "inbound" | "outbound" | "internal";
  recordedBy: string;
  fabricated: false;
  source: "input" | "fixture" | "linked_booking" | "system";
  relatedBookingId: string | null;
  tags: string[];
};

export type BookingHistoryLink = {
  linkId: string;
  customerId: string;
  bookingId: string;
  customerReference: string;
  serviceSelected: string;
  scheduledDateTime: string;
  assignedWorker: string | null;
  bookingStatus: string;
  linkedAt: string;
  source: "bookingReport" | "bookingId" | "fixtureBooking";
  traceabilityRefs: string[];
};

export type FollowUp = {
  followUpId: string;
  customerId: string;
  leadId: string | null;
  scheduledAt: string;
  dueAt: string;
  status: "scheduled" | "completed" | "cancelled" | "overdue";
  purpose: string;
  completedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerNote = {
  noteId: string;
  customerId: string;
  timestamp: string;
  body: string;
  author: string;
  fabricated: false;
  tags: string[];
};

export type Opportunity = {
  opportunityId: string;
  customerId: string;
  leadId: string | null;
  title: string;
  stage: string;
  estimatedValue: number | null;
  currency: string | null;
  status: "open" | "won" | "lost" | "abandoned";
  createdAt: string;
  updatedAt: string;
  notes: string;
};

export type LeadRecord = {
  leadId: string;
  customerId: string | null;
  businessProjectId: string;
  status: LeadStatus;
  source: string;
  referralSource: string | null;
  capturedAt: string;
  updatedAt: string;
  contactName: string;
  contactChannel: ContactChannel;
  interest: string;
  notes: string;
  tags: string[];
  segments: string[];
};

export type CustomerProfile = {
  customerId: string;
  createdAt: string;
  updatedAt: string;
  businessProjectId: string;
  displayName: string;
  customerReference: string;
  status: CustomerStatus;
  lifecycleStage: LifecycleStage;
  leadStatus: LeadStatus;
  tags: string[];
  segments: string[];
  referralSource: string | null;
  repeatCustomer: boolean;
  outstandingTasks: string[];
  bookingLinkIds: string[];
  leadIds: string[];
  noteIds: string[];
  followUpIds: string[];
  opportunityIds: string[];
  contactHistoryIds: string[];
  auditStatus: "open" | "audited" | "archived";
};

export type CrmAnalytics = {
  analyticsId: string;
  generatedAt: string;
  businessProjectId: string;
  totalCustomers: number;
  totalLeads: number;
  activeCustomers: number;
  repeatCustomers: number;
  openFollowUps: number;
  openOpportunities: number;
  linkedBookings: number;
  leadsByStatus: Record<string, number>;
  customersByLifecycle: Record<string, number>;
  confidenceScore: number;
  notes: string[];
};

export type CrmReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  customerId: string;
  leadStatus: LeadStatus;
  contactHistory: ContactHistoryEntry[];
  bookingHistory: BookingHistoryLink[];
  followUpSchedule: FollowUp[];
  customerLifecycleStage: LifecycleStage;
  outstandingTasks: string[];
  auditStatus: "open" | "audited" | "archived";
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  tags: string[];
  segments: string[];
  referralSource: string | null;
  repeatCustomer: boolean;
  opportunities: Opportunity[];
  communicationHistory: ContactHistoryEntry[];
  consumableByQ706: true;
  neverExecuteMarketingCampaigns: true;
  neverDeliverCustomerJobs: true;
  neverReplaceBookingFunctionality: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateCustomerInteractions: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ706OrLater: true;
  preserveCompleteCustomerHistory: true;
  preserveCompleteTraceability: true;
  preserveCrmAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
};

export type CrmInput = {
  reportId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  followUpId?: string | null;
  opportunityId?: string | null;
  noteId?: string | null;
  contactId?: string | null;
  businessProjectId?: string | null;
  displayName?: string | null;
  customerReference?: string | null;
  customerStatus?: CustomerStatus | string | null;
  lifecycleStage?: LifecycleStage | string | null;
  leadStatus?: LeadStatus | string | null;
  contactName?: string | null;
  contactChannel?: ContactChannel | string | null;
  contactSummary?: string | null;
  contactDirection?: "inbound" | "outbound" | "internal" | null;
  interest?: string | null;
  source?: string | null;
  referralSource?: string | null;
  tags?: string[] | null;
  segments?: string[] | null;
  noteBody?: string | null;
  author?: string | null;
  followUpPurpose?: string | null;
  followUpDueAt?: string | null;
  scheduledAt?: string | null;
  opportunityTitle?: string | null;
  opportunityStage?: string | null;
  estimatedValue?: number | null;
  currency?: string | null;
  outstandingTasks?: string[] | null;
  bookingReport?: BookingReport | null;
  bookingId?: string | null;
  fixtureBooking?: BookingFixture | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeMarketingCampaigns?: boolean;
  deliverCustomerJobs?: boolean;
  replaceBookingFunctionality?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateCustomerInteractions?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ706OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CrmWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CrmWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CRMW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CrmWorkerCapability[];
  totalReports: number;
  totalCustomers: number;
  totalLeads: number;
  lastCustomerId: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type CrmWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  reports: CrmReport[];
  customers: CustomerProfile[];
  leads: LeadRecord[];
  followUps: FollowUp[];
  opportunities: Opportunity[];
  bookingLinks: BookingHistoryLink[];
  analytics: CrmAnalytics | null;
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteMarketingCampaigns: true;
  neverDeliverCustomerJobs: true;
  neverReplaceBookingFunctionality: true;
  neverFabricateCustomerInteractions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ706OrLater: true;
  consumableByQ706: true;
};

export type CrmWorkerRunReport = {
  crmRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_customer_profile"
    | "update_customer_profile"
    | "capture_lead"
    | "update_lead_status"
    | "record_contact"
    | "record_interaction"
    | "link_booking_history"
    | "schedule_follow_up"
    | "complete_follow_up"
    | "track_opportunity"
    | "update_lifecycle_stage"
    | "generate_crm_analytics"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CrmWorkerEngineRecord;
  catalog: CrmWorkerCatalog | null;
  reports: CrmReport[];
  customers: CustomerProfile[];
  leads: LeadRecord[];
  latestReport: CrmReport | null;
  latestCustomer: CustomerProfile | null;
  latestLead: LeadRecord | null;
  latestFollowUp: FollowUp | null;
  latestAnalytics: CrmAnalytics | null;
  integrations: IntegrationHandshake[];
  validation: CrmWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CrmWorkerState = {
  engineVersion: "PILLOW-CRMW-001";
  missionId: "Q7-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: CrmWorkerConfiguration;
  latestReport: CrmWorkerRunReport | null;
  engineRecord: CrmWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalCustomers: number;
    totalLeads: number;
    lastReportId: string | null;
    lastCustomerId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type CrmWorkerCockpitSnapshot = {
  missionId: "Q7-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalCustomers: number;
  totalLeads: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverExecuteMarketingCampaigns: true;
  neverDeliverCustomerJobs: true;
  neverReplaceBookingFunctionality: true;
  neverFabricateCustomerInteractions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ706OrLater: true;
  consumableByQ706: true;
};

/** Stable subset contract for Q7-06. */
export type Q706ConsumableContract = {
  contractVersion: "CRMW-Q706-v1";
  consumableByQ706: true;
  fields: readonly string[];
  types: {
    CrmReport: "CrmReport";
    CustomerProfile: "CustomerProfile";
    LeadRecord: "LeadRecord";
    ContactHistoryEntry: "ContactHistoryEntry";
    BookingHistoryLink: "BookingHistoryLink";
    FollowUp: "FollowUp";
    CrmAnalytics: "CrmAnalytics";
  };
  notes: string[];
  neverExecuteMarketingCampaigns: true;
  neverDeliverCustomerJobs: true;
  neverReplaceBookingFunctionality: true;
  neverFabricateCustomerInteractions: true;
};
