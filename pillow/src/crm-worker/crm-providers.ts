import {
  nextAnalyticsId,
  nextBookingLinkId,
  nextContactId,
  nextFollowUpId,
  nextLeadId,
  nextNoteId,
  nextOpportunityId,
  normalizeLeadStatus,
} from "./crm-builder.js";
import type { CrmWorkerConfiguration } from "./configuration.js";
import type {
  BookingFixture,
  BookingHistoryLink,
  BookingReport,
  ContactChannel,
  ContactHistoryEntry,
  CrmAnalytics,
  CrmInput,
  CustomerNote,
  CustomerProfile,
  FollowUp,
  LeadRecord,
  Opportunity,
} from "./types.js";

/** Profiles, leads, contacts, follow-ups, analytics — fixture/input driven; never invent interactions. */

export function provideLeadFromInput(
  input: CrmInput,
  config: CrmWorkerConfiguration,
  customerId: string | null,
): LeadRecord {
  const now = new Date().toISOString();
  return {
    leadId: input.leadId?.trim() || nextLeadId(),
    customerId,
    businessProjectId: input.businessProjectId?.trim() || "unspecified",
    status: normalizeLeadStatus(input.leadStatus ?? "new", config.leadStatuses),
    source: input.source?.trim() || "manual",
    referralSource: input.referralSource?.trim() || null,
    capturedAt: now,
    updatedAt: now,
    contactName: input.contactName?.trim() || input.displayName?.trim() || "unnamed",
    contactChannel: normalizeChannel(input.contactChannel),
    interest: input.interest?.trim() || "general",
    notes: input.noteBody?.trim() || "",
    tags: [...(input.tags ?? [])],
    segments: [...(input.segments ?? [])],
  };
}

export function provideContactFromInput(
  input: CrmInput,
  customerId: string,
): ContactHistoryEntry | null {
  const summary = input.contactSummary?.trim();
  if (!summary) return null;
  return {
    contactId: input.contactId?.trim() || nextContactId(),
    customerId,
    timestamp: new Date().toISOString(),
    channel: normalizeChannel(input.contactChannel),
    summary,
    direction: input.contactDirection ?? "outbound",
    recordedBy: input.author?.trim() || "wkr-crm-01",
    fabricated: false,
    source: "input",
    relatedBookingId: input.bookingId?.trim() || null,
    tags: [...(input.tags ?? [])],
  };
}

export function provideNoteFromInput(
  input: CrmInput,
  customerId: string,
): CustomerNote | null {
  const body = input.noteBody?.trim();
  if (!body) return null;
  return {
    noteId: input.noteId?.trim() || nextNoteId(),
    customerId,
    timestamp: new Date().toISOString(),
    body,
    author: input.author?.trim() || "wkr-crm-01",
    fabricated: false,
    tags: [...(input.tags ?? [])],
  };
}

export function provideFollowUpFromInput(
  input: CrmInput,
  customerId: string,
): FollowUp | null {
  const purpose = input.followUpPurpose?.trim();
  const dueAt = input.followUpDueAt?.trim() || input.scheduledAt?.trim();
  if (!purpose || !dueAt) return null;
  const now = new Date().toISOString();
  return {
    followUpId: input.followUpId?.trim() || nextFollowUpId(),
    customerId,
    leadId: input.leadId?.trim() || null,
    scheduledAt: input.scheduledAt?.trim() || now,
    dueAt,
    status: "scheduled",
    purpose,
    completedAt: null,
    notes: input.noteBody?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };
}

export function provideOpportunityFromInput(
  input: CrmInput,
  customerId: string,
): Opportunity | null {
  const title = input.opportunityTitle?.trim();
  if (!title) return null;
  const now = new Date().toISOString();
  return {
    opportunityId: input.opportunityId?.trim() || nextOpportunityId(),
    customerId,
    leadId: input.leadId?.trim() || null,
    title,
    stage: input.opportunityStage?.trim() || "open",
    estimatedValue: input.estimatedValue ?? null,
    currency: input.currency?.trim() || null,
    status: "open",
    createdAt: now,
    updatedAt: now,
    notes: input.noteBody?.trim() || "",
  };
}

export function provideBookingLink(
  booking: BookingReport | BookingFixture,
  customerId: string,
  source: BookingHistoryLink["source"],
): BookingHistoryLink {
  return {
    linkId: nextBookingLinkId(),
    customerId,
    bookingId: booking.bookingId,
    customerReference: booking.customerReference,
    serviceSelected: booking.serviceSelected,
    scheduledDateTime: booking.scheduledDateTime,
    assignedWorker: booking.assignedWorker,
    bookingStatus: booking.bookingStatus,
    linkedAt: new Date().toISOString(),
    source,
    traceabilityRefs: [
      `q7-04:booking:${booking.bookingId}`,
      `q7-05:customer:${customerId}`,
    ],
  };
}

export function provideContactFromBookingLink(
  link: BookingHistoryLink,
): ContactHistoryEntry {
  return {
    contactId: nextContactId(),
    customerId: link.customerId,
    timestamp: link.linkedAt,
    channel: "system",
    summary: `Linked booking ${link.bookingId} (${link.serviceSelected}) status=${link.bookingStatus}`,
    direction: "internal",
    recordedBy: "wkr-crm-01",
    fabricated: false,
    source: "linked_booking",
    relatedBookingId: link.bookingId,
    tags: ["booking_link"],
  };
}

export function provideCrmAnalytics(params: {
  businessProjectId: string;
  customers: CustomerProfile[];
  leads: LeadRecord[];
  followUps: FollowUp[];
  opportunities: Opportunity[];
  bookingLinks: BookingHistoryLink[];
}): CrmAnalytics {
  const leadsByStatus: Record<string, number> = {};
  for (const lead of params.leads) {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] ?? 0) + 1;
  }
  const customersByLifecycle: Record<string, number> = {};
  for (const customer of params.customers) {
    customersByLifecycle[customer.lifecycleStage] =
      (customersByLifecycle[customer.lifecycleStage] ?? 0) + 1;
  }
  const activeCustomers = params.customers.filter((c) => c.status === "active").length;
  const repeatCustomers = params.customers.filter((c) => c.repeatCustomer).length;
  const openFollowUps = params.followUps.filter((f) => f.status === "scheduled").length;
  const openOpportunities = params.opportunities.filter((o) => o.status === "open").length;
  const confidence = Math.max(
    0.4,
    Math.min(
      0.95,
      0.5 +
        (params.customers.length ? 0.15 : 0) +
        (params.bookingLinks.length ? 0.15 : 0) +
        (params.leads.length ? 0.1 : 0),
    ),
  );
  return {
    analyticsId: nextAnalyticsId(),
    generatedAt: new Date().toISOString(),
    businessProjectId: params.businessProjectId,
    totalCustomers: params.customers.length,
    totalLeads: params.leads.length,
    activeCustomers,
    repeatCustomers,
    openFollowUps,
    openOpportunities,
    linkedBookings: params.bookingLinks.length,
    leadsByStatus,
    customersByLifecycle,
    confidenceScore: Number(confidence.toFixed(2)),
    notes: [
      "CRM analytics derived from recorded profiles, leads, contacts, and linked bookings only.",
      "No fabricated interactions or marketing campaign execution.",
    ],
  };
}

function normalizeChannel(value: string | null | undefined): ContactChannel {
  const v = (value ?? "unknown").trim().toLowerCase();
  if (
    v === "phone" ||
    v === "email" ||
    v === "sms" ||
    v === "in_person" ||
    v === "chat" ||
    v === "system" ||
    v === "unknown"
  ) {
    return v;
  }
  return "unknown";
}
