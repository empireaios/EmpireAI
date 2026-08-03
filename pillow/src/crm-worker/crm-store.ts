import type {
  BookingHistoryLink,
  ContactHistoryEntry,
  CrmAnalytics,
  CrmReport,
  CustomerNote,
  CustomerProfile,
  FollowUp,
  LeadRecord,
  Opportunity,
} from "./types.js";

/** Authoritative in-memory CRMW store — customers, leads, contacts, history, reports. */
export class CrmStore {
  private customers = new Map<string, CustomerProfile>();
  private leads = new Map<string, LeadRecord>();
  private contacts = new Map<string, ContactHistoryEntry>();
  private notes = new Map<string, CustomerNote>();
  private followUps = new Map<string, FollowUp>();
  private opportunities = new Map<string, Opportunity>();
  private bookingLinks = new Map<string, BookingHistoryLink>();
  private reports = new Map<string, CrmReport>();
  private latestAnalytics: CrmAnalytics | null = null;
  private latestCustomerId: string | null = null;
  private latestLeadId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: CrmReport[]) {
    this.customers.clear();
    this.leads.clear();
    this.contacts.clear();
    this.notes.clear();
    this.followUps.clear();
    this.opportunities.clear();
    this.bookingLinks.clear();
    this.reports.clear();
    this.latestAnalytics = null;
    this.latestCustomerId = null;
    this.latestLeadId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestCustomerId = report.customerId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.customerId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  customerCount() {
    return this.customers.size;
  }

  leadCount() {
    return this.leads.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listCustomers() {
    return [...this.customers.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneCustomer);
  }

  listLeads() {
    return [...this.leads.values()]
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
      .map(cloneLead);
  }

  listContacts(customerId?: string) {
    return [...this.contacts.values()]
      .filter((c) => !customerId || c.customerId === customerId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneContact);
  }

  listNotes(customerId?: string) {
    return [...this.notes.values()]
      .filter((n) => !customerId || n.customerId === customerId)
      .map((n) => ({ ...n, tags: [...n.tags], fabricated: false as const }));
  }

  listFollowUps(customerId?: string) {
    return [...this.followUps.values()]
      .filter((f) => !customerId || f.customerId === customerId)
      .map((f) => ({ ...f }));
  }

  listOpportunities(customerId?: string) {
    return [...this.opportunities.values()]
      .filter((o) => !customerId || o.customerId === customerId)
      .map((o) => ({ ...o }));
  }

  listBookingLinks(customerId?: string) {
    return [...this.bookingLinks.values()]
      .filter((b) => !customerId || b.customerId === customerId)
      .map(cloneBookingLink);
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  getCustomer(customerId: string) {
    const customer = this.customers.get(customerId);
    return customer ? cloneCustomer(customer) : null;
  }

  getLead(leadId: string) {
    const lead = this.leads.get(leadId);
    return lead ? cloneLead(lead) : null;
  }

  getFollowUp(followUpId: string) {
    const followUp = this.followUps.get(followUpId);
    return followUp ? { ...followUp } : null;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  getLatestCustomerId() {
    return this.latestCustomerId;
  }

  getLatestLeadId() {
    return this.latestLeadId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getLatestAnalytics() {
    return this.latestAnalytics ? { ...this.latestAnalytics } : null;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  findCustomerByReference(customerReference: string) {
    const ref = customerReference.trim().toLowerCase();
    const found = [...this.customers.values()].find(
      (c) =>
        c.customerReference.toLowerCase() === ref ||
        c.displayName.toLowerCase() === ref ||
        c.customerId.toLowerCase() === ref,
    );
    return found ? cloneCustomer(found) : null;
  }

  saveCustomer(customer: CustomerProfile, action = "save_customer") {
    this.customers.set(customer.customerId, cloneCustomer(customer));
    this.latestCustomerId = customer.customerId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: customer.customerId,
      action,
      details: `status=${customer.status} lifecycle=${customer.lifecycleStage}`,
    });
    return cloneCustomer(customer);
  }

  saveLead(lead: LeadRecord, action = "save_lead") {
    this.leads.set(lead.leadId, cloneLead(lead));
    this.latestLeadId = lead.leadId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: lead.leadId,
      action,
      details: `status=${lead.status} customer=${lead.customerId ?? "none"}`,
    });
    return cloneLead(lead);
  }

  saveContact(contact: ContactHistoryEntry, action = "record_contact") {
    const locked = cloneContact(contact);
    this.contacts.set(contact.contactId, locked);
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: contact.customerId,
      action,
      details: `contact=${contact.contactId} channel=${contact.channel}`,
    });
    return locked;
  }

  saveNote(note: CustomerNote, action = "record_note") {
    const locked = { ...note, tags: [...note.tags], fabricated: false as const };
    this.notes.set(note.noteId, locked);
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: note.customerId,
      action,
      details: `note=${note.noteId}`,
    });
    return locked;
  }

  saveFollowUp(followUp: FollowUp, action = "schedule_follow_up") {
    this.followUps.set(followUp.followUpId, { ...followUp });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: followUp.customerId,
      action,
      details: `followUp=${followUp.followUpId} status=${followUp.status}`,
    });
    return { ...followUp };
  }

  saveOpportunity(opportunity: Opportunity, action = "track_opportunity") {
    this.opportunities.set(opportunity.opportunityId, { ...opportunity });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: opportunity.customerId,
      action,
      details: `opportunity=${opportunity.opportunityId} status=${opportunity.status}`,
    });
    return { ...opportunity };
  }

  saveBookingLink(link: BookingHistoryLink, action = "link_booking_history") {
    const locked = cloneBookingLink(link);
    this.bookingLinks.set(link.linkId, locked);
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: link.customerId,
      action,
      details: `booking=${link.bookingId} source=${link.source}`,
    });
    return locked;
  }

  saveReport(report: CrmReport, action = "save_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.latestCustomerId = report.customerId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.customerId,
      action,
      details: `confidence=${report.confidenceScore} report=${report.reportId}`,
    });
    return cloneReport(report);
  }

  saveAnalytics(analytics: CrmAnalytics) {
    this.latestAnalytics = { ...analytics };
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: analytics.analyticsId,
      action: "generate_crm_analytics",
      details: `customers=${analytics.totalCustomers} leads=${analytics.totalLeads}`,
    });
    return { ...analytics };
  }

  markSubmitted(reportId: string, executiveReportId: string) {
    const current = this.reports.get(reportId);
    if (!current) return null;
    const updated: CrmReport = {
      ...cloneReport(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.saveReport(updated, "submit_report");
  }
}

function cloneCustomer(customer: CustomerProfile): CustomerProfile {
  return {
    ...customer,
    tags: [...customer.tags],
    segments: [...customer.segments],
    outstandingTasks: [...customer.outstandingTasks],
    bookingLinkIds: [...customer.bookingLinkIds],
    leadIds: [...customer.leadIds],
    noteIds: [...customer.noteIds],
    followUpIds: [...customer.followUpIds],
    opportunityIds: [...customer.opportunityIds],
    contactHistoryIds: [...customer.contactHistoryIds],
  };
}

function cloneLead(lead: LeadRecord): LeadRecord {
  return {
    ...lead,
    tags: [...lead.tags],
    segments: [...lead.segments],
  };
}

function cloneContact(contact: ContactHistoryEntry): ContactHistoryEntry {
  return {
    ...contact,
    tags: [...contact.tags],
    fabricated: false,
  };
}

function cloneBookingLink(link: BookingHistoryLink): BookingHistoryLink {
  return {
    ...link,
    traceabilityRefs: [...link.traceabilityRefs],
  };
}

function cloneReport(report: CrmReport): CrmReport {
  return {
    ...report,
    outstandingTasks: [...report.outstandingTasks],
    tags: [...report.tags],
    segments: [...report.segments],
    contactHistory: report.contactHistory.map(cloneContact),
    communicationHistory: report.communicationHistory.map(cloneContact),
    bookingHistory: report.bookingHistory.map(cloneBookingLink),
    followUpSchedule: report.followUpSchedule.map((f) => ({ ...f })),
    opportunities: report.opportunities.map((o) => ({ ...o })),
    traceabilityRefs: [...report.traceabilityRefs],
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
  };
}
