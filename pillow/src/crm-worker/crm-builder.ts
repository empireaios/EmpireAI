import type { CrmWorkerConfiguration } from "./configuration.js";
import {
  CRM_REPORT_VERSION,
  CRM_WORKER_IDENTITY,
  CRMW_METADATA_VERSION,
} from "./paths.js";
import type {
  BookingHistoryLink,
  ContactHistoryEntry,
  CrmAnalytics,
  CrmInput,
  CrmReport,
  CrmWorkerCatalog,
  CustomerProfile,
  FollowUp,
  IntegrationHandshake,
  LeadRecord,
  LeadStatus,
  LifecycleStage,
  Opportunity,
} from "./types.js";

let customerSeq = 0;
let leadSeq = 0;
let noteSeq = 0;
let followUpSeq = 0;
let contactSeq = 0;
let bookingLinkSeq = 0;
let opportunitySeq = 0;
let reportSeq = 0;
let analyticsSeq = 0;
let runSeq = 0;

export function resetCrmSequenceForTesting() {
  customerSeq = 0;
  leadSeq = 0;
  noteSeq = 0;
  followUpSeq = 0;
  contactSeq = 0;
  bookingLinkSeq = 0;
  opportunitySeq = 0;
  reportSeq = 0;
  analyticsSeq = 0;
  runSeq = 0;
}

export function nextCustomerId() {
  customerSeq += 1;
  return `crmw-cust-${String(customerSeq).padStart(4, "0")}`;
}

export function nextLeadId() {
  leadSeq += 1;
  return `crmw-lead-${String(leadSeq).padStart(4, "0")}`;
}

export function nextNoteId() {
  noteSeq += 1;
  return `crmw-note-${String(noteSeq).padStart(4, "0")}`;
}

export function nextFollowUpId() {
  followUpSeq += 1;
  return `crmw-fu-${String(followUpSeq).padStart(4, "0")}`;
}

export function nextContactId() {
  contactSeq += 1;
  return `crmw-contact-${String(contactSeq).padStart(4, "0")}`;
}

export function nextBookingLinkId() {
  bookingLinkSeq += 1;
  return `crmw-blink-${String(bookingLinkSeq).padStart(4, "0")}`;
}

export function nextOpportunityId() {
  opportunitySeq += 1;
  return `crmw-opp-${String(opportunitySeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `crmw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextAnalyticsId() {
  analyticsSeq += 1;
  return `crmw-eng-${String(analyticsSeq).padStart(4, "0")}`;
}

export function nextRunReportId() {
  runSeq += 1;
  return `crmw-run-${String(runSeq).padStart(4, "0")}`;
}

export function normalizeLeadStatus(
  value: string | null | undefined,
  allowed: LeadStatus[],
): LeadStatus {
  const v = (value ?? "new").trim().toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as LeadStatus) : "unknown";
}

export function normalizeLifecycleStage(
  value: string | null | undefined,
  allowed: LifecycleStage[],
): LifecycleStage {
  const v = (value ?? "lead").trim().toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as LifecycleStage) : "unknown";
}

export class CrmBuilder {
  buildCatalog(
    config: CrmWorkerConfiguration,
    reports: CrmReport[],
    customers: CustomerProfile[],
    leads: LeadRecord[],
    followUps: FollowUp[],
    opportunities: Opportunity[],
    bookingLinks: BookingHistoryLink[],
    analytics: CrmAnalytics | null,
    integrations: IntegrationHandshake[],
  ): CrmWorkerCatalog {
    return {
      reportVersion: CRM_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      customers: customers.map((c) => ({ ...c })),
      leads: leads.map((l) => ({ ...l })),
      followUps: followUps.map((f) => ({ ...f })),
      opportunities: opportunities.map((o) => ({ ...o })),
      bookingLinks: bookingLinks.map((b) => ({ ...b })),
      analytics: analytics ? { ...analytics } : null,
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: CRMW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteMarketingCampaigns: true,
      neverDeliverCustomerJobs: true,
      neverReplaceBookingFunctionality: true,
      neverFabricateCustomerInteractions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ706OrLater: true,
      consumableByQ706: true,
    };
  }

  createCustomerProfile(
    input: CrmInput,
    config: CrmWorkerConfiguration,
  ): CustomerProfile {
    const now = new Date().toISOString();
    const customerId = input.customerId?.trim() || nextCustomerId();
    const customerReference =
      input.customerReference?.trim() ||
      input.displayName?.trim() ||
      `ref-${customerId}`;
    return {
      customerId,
      createdAt: now,
      updatedAt: now,
      businessProjectId: input.businessProjectId?.trim() || "unspecified",
      displayName: input.displayName?.trim() || customerReference,
      customerReference,
      status: normalizeCustomerStatus(input.customerStatus, config.customerStatuses),
      lifecycleStage: normalizeLifecycleStage(input.lifecycleStage, config.lifecycleStages),
      leadStatus: normalizeLeadStatus(input.leadStatus, config.leadStatuses),
      tags: [...(input.tags ?? [])],
      segments: [...(input.segments ?? [])],
      referralSource: input.referralSource?.trim() || null,
      repeatCustomer: false,
      outstandingTasks: [...(input.outstandingTasks ?? [])],
      bookingLinkIds: [],
      leadIds: [],
      noteIds: [],
      followUpIds: [],
      opportunityIds: [],
      contactHistoryIds: [],
      auditStatus: "open",
    };
  }

  assembleReport(params: {
    customer: CustomerProfile;
    contacts: ContactHistoryEntry[];
    bookingLinks: BookingHistoryLink[];
    followUps: FollowUp[];
    opportunities: Opportunity[];
    config: CrmWorkerConfiguration;
  }): CrmReport {
    const { customer, contacts, bookingLinks, followUps, opportunities, config } = params;
    const confidence = Math.max(
      0.4,
      Math.min(
        0.95,
        0.55 +
          (contacts.length ? 0.1 : 0) +
          (bookingLinks.length ? 0.15 : 0) +
          (followUps.length ? 0.05 : 0) +
          (customer.repeatCustomer ? 0.1 : 0),
      ),
    );
    return {
      reportId: nextReportId(),
      timestamp: new Date().toISOString(),
      businessProjectId: customer.businessProjectId,
      customerId: customer.customerId,
      leadStatus: customer.leadStatus,
      contactHistory: contacts.map((c) => ({ ...c, tags: [...c.tags], fabricated: false as const })),
      bookingHistory: bookingLinks.map((b) => ({
        ...b,
        traceabilityRefs: [...b.traceabilityRefs],
      })),
      followUpSchedule: followUps.map((f) => ({ ...f })),
      customerLifecycleStage: customer.lifecycleStage,
      outstandingTasks: [...customer.outstandingTasks],
      auditStatus: customer.auditStatus,
      confidenceScore: Number(confidence.toFixed(2)),
      metadataVersion: CRMW_METADATA_VERSION,
      reportVersion: CRM_REPORT_VERSION,
      workerId: config.workerId || CRM_WORKER_IDENTITY.workerId,
      tags: [...customer.tags],
      segments: [...customer.segments],
      referralSource: customer.referralSource,
      repeatCustomer: customer.repeatCustomer,
      opportunities: opportunities.map((o) => ({ ...o })),
      communicationHistory: contacts.map((c) => ({
        ...c,
        tags: [...c.tags],
        fabricated: false as const,
      })),
      consumableByQ706: true,
      neverExecuteMarketingCampaigns: true,
      neverDeliverCustomerJobs: true,
      neverReplaceBookingFunctionality: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateCustomerInteractions: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ706OrLater: true,
      preserveCompleteCustomerHistory: true,
      preserveCompleteTraceability: true,
      preserveCrmAuditHistory: true,
      neverExposeCredentials: true,
      neverExposeProhibitedPersonalData: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-05:crm:${customer.customerId}`,
        ...bookingLinks.map((b) => `q7-04:booking:${b.bookingId}`),
      ],
    };
  }
}

function normalizeCustomerStatus(
  value: string | null | undefined,
  allowed: CrmWorkerConfiguration["customerStatuses"],
): CrmWorkerConfiguration["customerStatuses"][number] {
  const v = (value ?? "active").trim().toLowerCase();
  return (allowed as readonly string[]).includes(v)
    ? (v as CrmWorkerConfiguration["customerStatuses"][number])
    : "unknown";
}
