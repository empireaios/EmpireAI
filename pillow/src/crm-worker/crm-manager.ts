import type { CrmWorkerConfiguration } from "./configuration.js";
import {
  CrmBuilder,
  nextRunReportId,
  normalizeLeadStatus,
  normalizeLifecycleStage,
} from "./crm-builder.js";
import {
  provideBookingLink,
  provideContactFromBookingLink,
  provideContactFromInput,
  provideCrmAnalytics,
  provideFollowUpFromInput,
  provideLeadFromInput,
  provideNoteFromInput,
  provideOpportunityFromInput,
} from "./crm-providers.js";
import { CrmStore } from "./crm-store.js";
import { CrmValidator, HealthMonitor, RecoveryManager } from "./crm-validator.js";
import { appendCrmwLog } from "./crmw-logging.js";
import {
  IntegrationCoordinator,
  type CrmWorkerDependencies,
} from "./integrations.js";
import {
  CRM_WORKER_ID,
  CRMW_CAPABILITIES,
  CRMW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  BookingFixture,
  BookingReport,
  CrmAnalytics,
  CrmInput,
  CrmReport,
  CrmWorkerCatalog,
  CrmWorkerEngineRecord,
  CrmWorkerRunReport,
  CustomerProfile,
  FollowUp,
  IntegrationHandshake,
  LeadRecord,
  OperationalState,
} from "./types.js";

export class CrmManager {
  private engineRecord: CrmWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: CrmWorkerCatalog | null = null;
  private readonly store = new CrmStore();
  private readonly builder = new CrmBuilder();
  private readonly validator = new CrmValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: CrmWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CrmWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listCustomers(),
      this.store.listLeads(),
      this.store.listFollowUps(),
      this.store.listOpportunities(),
      this.store.listBookingLinks(),
      this.store.getLatestAnalytics(),
      this.handshakes,
    );
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getCustomers() {
    return this.store.listCustomers();
  }

  getLeads() {
    return this.store.listLeads();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getLatestCustomerId() {
    return this.store.getLatestCustomerId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: CrmWorkerConfiguration,
  ): CrmWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.refreshCatalog(config);
    this.ensureRecord("connected", config);
    appendCrmwLog({
      event: "connect",
      details: `CRM Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      {
        validationReportId: `crmw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["CRM Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CRMW_METADATA_VERSION,
      },
      started,
    );
  }

  createCustomerProfile(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.crmRulesEnabled) {
      return this.disabled(
        "create_customer_profile",
        config,
        !config.enabled ? "CRM Worker is disabled" : "CRM rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("create_customer_profile", input, config, started);
    }
    const customer = this.builder.createCustomerProfile(input, config);
    const saved = this.store.saveCustomer(customer, "create_customer_profile");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: "create_customer_profile",
      details: `customer=${saved.customerId}`,
    });
    return this.report(
      "create_customer_profile",
      this.getCatalog(),
      [],
      [saved],
      [],
      null,
      saved,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  updateCustomerProfile(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("update_customer_profile", input, config, started);
    }
    const existing = this.requireCustomer(input);
    if (!existing) {
      return this.missingCustomer("update_customer_profile", config, started);
    }
    const now = new Date().toISOString();
    const updated: CustomerProfile = {
      ...existing,
      updatedAt: now,
      displayName: input.displayName?.trim() || existing.displayName,
      customerReference: input.customerReference?.trim() || existing.customerReference,
      businessProjectId: input.businessProjectId?.trim() || existing.businessProjectId,
      status: input.customerStatus
        ? (normalizeStatus(input.customerStatus, config.customerStatuses) as CustomerProfile["status"])
        : existing.status,
      tags: input.tags ? [...input.tags] : existing.tags,
      segments: input.segments ? [...input.segments] : existing.segments,
      referralSource:
        input.referralSource !== undefined
          ? input.referralSource?.trim() || null
          : existing.referralSource,
      outstandingTasks: input.outstandingTasks
        ? [...input.outstandingTasks]
        : existing.outstandingTasks,
    };
    const saved = this.store.saveCustomer(updated, "update_customer_profile");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "update_customer_profile",
      this.getCatalog(),
      [],
      [saved],
      [],
      null,
      saved,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  captureLead(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.crmRulesEnabled) {
      return this.disabled(
        "capture_lead",
        config,
        !config.enabled ? "CRM Worker is disabled" : "CRM rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("capture_lead", input, config, started);
    }

    let customer = this.requireCustomer(input);
    if (!customer && (input.displayName || input.customerReference || input.contactName)) {
      const created = this.createCustomerProfile(
        {
          ...input,
          displayName: input.displayName || input.contactName || input.customerReference,
          lifecycleStage: input.lifecycleStage ?? "lead",
          leadStatus: input.leadStatus ?? "new",
        },
        config,
      );
      customer = created.latestCustomer;
    }
    const lead = provideLeadFromInput(input, config, customer?.customerId ?? null);
    const savedLead = this.store.saveLead(lead, "capture_lead");
    if (customer) {
      const linked: CustomerProfile = {
        ...customer,
        updatedAt: new Date().toISOString(),
        leadIds: customer.leadIds.includes(savedLead.leadId)
          ? customer.leadIds
          : [...customer.leadIds, savedLead.leadId],
        leadStatus: savedLead.status,
        lifecycleStage:
          customer.lifecycleStage === "unknown" || customer.lifecycleStage === "lead"
            ? "lead"
            : customer.lifecycleStage,
      };
      customer = this.store.saveCustomer(linked, "link_lead");
    }
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: "capture_lead",
      details: `lead=${savedLead.leadId} customer=${customer?.customerId ?? "none"}`,
    });
    return this.report(
      "capture_lead",
      this.getCatalog(),
      [],
      customer ? [customer] : [],
      [savedLead],
      null,
      customer,
      savedLead,
      null,
      null,
      validation,
      started,
    );
  }

  updateLeadStatus(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("update_lead_status", input, config, started);
    }
    const leadId = input.leadId?.trim() || this.store.getLatestLeadId();
    const lead = leadId ? this.store.getLead(leadId) : null;
    if (!lead) {
      const validation = this.validator.finalize(
        "fail",
        ["CRM Worker requires an existing lead to update status"],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(
        "update_lead_status",
        this.getCatalog(),
        [],
        [],
        [],
        null,
        null,
        null,
        null,
        null,
        validation,
        started,
      );
    }
    const updated: LeadRecord = {
      ...lead,
      status: normalizeLeadStatus(input.leadStatus ?? lead.status, config.leadStatuses),
      updatedAt: new Date().toISOString(),
      notes: input.noteBody?.trim() || lead.notes,
    };
    const savedLead = this.store.saveLead(updated, "update_lead_status");
    let customer: CustomerProfile | null = null;
    if (savedLead.customerId) {
      const existing = this.store.getCustomer(savedLead.customerId);
      if (existing) {
        customer = this.store.saveCustomer(
          {
            ...existing,
            leadStatus: savedLead.status,
            updatedAt: new Date().toISOString(),
          },
          "sync_lead_status",
        );
      }
    }
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "update_lead_status",
      this.getCatalog(),
      [],
      customer ? [customer] : [],
      [savedLead],
      null,
      customer,
      savedLead,
      null,
      null,
      validation,
      started,
    );
  }

  recordContact(input: CrmInput, config: CrmWorkerConfiguration) {
    return this.recordContactOrInteraction("record_contact", input, config);
  }

  recordInteraction(input: CrmInput, config: CrmWorkerConfiguration) {
    return this.recordContactOrInteraction("record_interaction", input, config);
  }

  private recordContactOrInteraction(
    action: "record_contact" | "record_interaction",
    input: CrmInput,
    config: CrmWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    if (input.fabricateCustomerInteractions === true) {
      return this.boundaryFail(action, input, config, started);
    }
    const customer = this.requireCustomer(input);
    if (!customer) {
      return this.missingCustomer(action, config, started);
    }
    const contact = provideContactFromInput(input, customer.customerId);
    const note = provideNoteFromInput(input, customer.customerId);
    if (!contact && !note) {
      const validation = this.validator.finalize(
        "fail",
        [
          "CRM Worker requires contactSummary or noteBody from input — never fabricates interactions",
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(
        action,
        this.getCatalog(),
        [],
        [customer],
        [],
        null,
        customer,
        null,
        null,
        null,
        validation,
        started,
      );
    }
    let updated = { ...customer, updatedAt: new Date().toISOString() };
    if (contact) {
      this.store.saveContact(contact, action);
      updated.contactHistoryIds = updated.contactHistoryIds.includes(contact.contactId)
        ? updated.contactHistoryIds
        : [...updated.contactHistoryIds, contact.contactId];
    }
    if (note) {
      this.store.saveNote(note, "record_note");
      updated.noteIds = updated.noteIds.includes(note.noteId)
        ? updated.noteIds
        : [...updated.noteIds, note.noteId];
    }
    const saved = this.store.saveCustomer(updated, action);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: action,
      details: `customer=${saved.customerId} contact=${contact?.contactId ?? "none"}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [],
      [saved],
      [],
      null,
      saved,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  linkBookingHistory(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("link_booking_history", input, config, started);
    }
    const resolved = this.resolveBooking(input);
    if (!resolved.booking) {
      const validation = this.validator.finalize(
        "fail",
        [
          "CRM Worker requires bookingReport, bookingId + bookingWorker, or fixtureBooking to link history",
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(
        "link_booking_history",
        this.getCatalog(),
        [],
        [],
        [],
        null,
        null,
        null,
        null,
        null,
        validation,
        started,
      );
    }

    let customer =
      this.requireCustomer(input) ||
      this.store.findCustomerByReference(resolved.booking.customerReference);
    if (!customer) {
      const created = this.createCustomerProfile(
        {
          businessProjectId:
            input.businessProjectId ||
            ("businessProjectId" in resolved.booking
              ? resolved.booking.businessProjectId
              : null) ||
            "unspecified",
          customerReference: resolved.booking.customerReference,
          displayName: resolved.booking.customerReference,
          lifecycleStage: "active_customer",
          leadStatus: "won",
          validated: true,
        },
        config,
      );
      customer = created.latestCustomer;
    }
    if (!customer) {
      return this.missingCustomer("link_booking_history", config, started);
    }

    if (resolved.source === "none") {
      return this.missingCustomer("link_booking_history", config, started);
    }
    const link = provideBookingLink(
      resolved.booking,
      customer.customerId,
      resolved.source,
    );
    const savedLink = this.store.saveBookingLink(link, "link_booking_history");
    const systemContact = provideContactFromBookingLink(savedLink);
    this.store.saveContact(systemContact, "link_booking_contact");

    const bookingCount = this.store.listBookingLinks(customer.customerId).length;
    const updated: CustomerProfile = {
      ...customer,
      updatedAt: new Date().toISOString(),
      bookingLinkIds: customer.bookingLinkIds.includes(savedLink.linkId)
        ? customer.bookingLinkIds
        : [...customer.bookingLinkIds, savedLink.linkId],
      contactHistoryIds: customer.contactHistoryIds.includes(systemContact.contactId)
        ? customer.contactHistoryIds
        : [...customer.contactHistoryIds, systemContact.contactId],
      lifecycleStage:
        customer.lifecycleStage === "lead" || customer.lifecycleStage === "prospect"
          ? "active_customer"
          : customer.lifecycleStage,
      repeatCustomer: bookingCount > 1 || customer.repeatCustomer,
      leadStatus:
        customer.leadStatus === "new" || customer.leadStatus === "unknown"
          ? "won"
          : customer.leadStatus,
    };
    const savedCustomer = this.store.saveCustomer(updated, "link_booking_history");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: "link_booking_history",
      details: `customer=${savedCustomer.customerId} booking=${savedLink.bookingId}`,
    });
    return this.report(
      "link_booking_history",
      this.getCatalog(),
      [],
      [savedCustomer],
      [],
      null,
      savedCustomer,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  scheduleFollowUp(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("schedule_follow_up", input, config, started);
    }
    const customer = this.requireCustomer(input);
    if (!customer) {
      return this.missingCustomer("schedule_follow_up", config, started);
    }
    const followUp = provideFollowUpFromInput(input, customer.customerId);
    if (!followUp) {
      const validation = this.validator.finalize(
        "fail",
        ["CRM Worker requires followUpPurpose and followUpDueAt/scheduledAt"],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(
        "schedule_follow_up",
        this.getCatalog(),
        [],
        [customer],
        [],
        null,
        customer,
        null,
        null,
        null,
        validation,
        started,
      );
    }
    const savedFu = this.store.saveFollowUp(followUp, "schedule_follow_up");
    const updated: CustomerProfile = {
      ...customer,
      updatedAt: new Date().toISOString(),
      followUpIds: customer.followUpIds.includes(savedFu.followUpId)
        ? customer.followUpIds
        : [...customer.followUpIds, savedFu.followUpId],
      outstandingTasks: customer.outstandingTasks.includes(savedFu.purpose)
        ? customer.outstandingTasks
        : [...customer.outstandingTasks, `follow_up:${savedFu.purpose}`],
    };
    const savedCustomer = this.store.saveCustomer(updated, "schedule_follow_up");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: "schedule_follow_up",
      details: `followUp=${savedFu.followUpId}`,
    });
    return this.report(
      "schedule_follow_up",
      this.getCatalog(),
      [],
      [savedCustomer],
      [],
      null,
      savedCustomer,
      null,
      savedFu,
      null,
      validation,
      started,
    );
  }

  completeFollowUp(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("complete_follow_up", input, config, started);
    }
    const followUpId = input.followUpId?.trim();
    const followUp = followUpId ? this.store.getFollowUp(followUpId) : null;
    if (!followUp) {
      const validation = this.validator.finalize(
        "fail",
        ["CRM Worker requires an existing followUpId to complete"],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(
        "complete_follow_up",
        this.getCatalog(),
        [],
        [],
        [],
        null,
        null,
        null,
        null,
        null,
        validation,
        started,
      );
    }
    const now = new Date().toISOString();
    const completed: FollowUp = {
      ...followUp,
      status: "completed",
      completedAt: now,
      updatedAt: now,
      notes: input.noteBody?.trim() || followUp.notes,
    };
    const savedFu = this.store.saveFollowUp(completed, "complete_follow_up");
    let customer = this.store.getCustomer(savedFu.customerId);
    if (customer) {
      const taskKey = `follow_up:${savedFu.purpose}`;
      customer = this.store.saveCustomer(
        {
          ...customer,
          updatedAt: now,
          outstandingTasks: customer.outstandingTasks.filter((t) => t !== taskKey),
        },
        "complete_follow_up",
      );
    }
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "complete_follow_up",
      this.getCatalog(),
      [],
      customer ? [customer] : [],
      [],
      null,
      customer,
      null,
      savedFu,
      null,
      validation,
      started,
    );
  }

  trackOpportunity(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("track_opportunity", input, config, started);
    }
    const customer = this.requireCustomer(input);
    if (!customer) {
      return this.missingCustomer("track_opportunity", config, started);
    }
    const opportunity = provideOpportunityFromInput(input, customer.customerId);
    if (!opportunity) {
      const validation = this.validator.finalize(
        "fail",
        ["CRM Worker requires opportunityTitle from input"],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(
        "track_opportunity",
        this.getCatalog(),
        [],
        [customer],
        [],
        null,
        customer,
        null,
        null,
        null,
        validation,
        started,
      );
    }
    const savedOpp = this.store.saveOpportunity(opportunity, "track_opportunity");
    const updated: CustomerProfile = {
      ...customer,
      updatedAt: new Date().toISOString(),
      opportunityIds: customer.opportunityIds.includes(savedOpp.opportunityId)
        ? customer.opportunityIds
        : [...customer.opportunityIds, savedOpp.opportunityId],
    };
    const savedCustomer = this.store.saveCustomer(updated, "track_opportunity");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "track_opportunity",
      this.getCatalog(),
      [],
      [savedCustomer],
      [],
      null,
      savedCustomer,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  updateLifecycleStage(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("update_lifecycle_stage", input, config, started);
    }
    const customer = this.requireCustomer(input);
    if (!customer) {
      return this.missingCustomer("update_lifecycle_stage", config, started);
    }
    const updated: CustomerProfile = {
      ...customer,
      updatedAt: new Date().toISOString(),
      lifecycleStage: normalizeLifecycleStage(
        input.lifecycleStage ?? customer.lifecycleStage,
        config.lifecycleStages,
      ),
      leadStatus: input.leadStatus
        ? normalizeLeadStatus(input.leadStatus, config.leadStatuses)
        : customer.leadStatus,
      repeatCustomer:
        input.lifecycleStage === "repeat_customer" ? true : customer.repeatCustomer,
    };
    const saved = this.store.saveCustomer(updated, "update_lifecycle_stage");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: "update_lifecycle_stage",
      details: `customer=${saved.customerId} stage=${saved.lifecycleStage}`,
    });
    return this.report(
      "update_lifecycle_stage",
      this.getCatalog(),
      [],
      [saved],
      [],
      null,
      saved,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  generateCrmAnalytics(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("generate_crm_analytics", input, config, started);
    }
    const businessProjectId =
      input.businessProjectId?.trim() ||
      this.store.listCustomers()[0]?.businessProjectId ||
      "unspecified";
    const analytics = provideCrmAnalytics({
      businessProjectId,
      customers: this.store.listCustomers(),
      leads: this.store.listLeads(),
      followUps: this.store.listFollowUps(),
      opportunities: this.store.listOpportunities(),
      bookingLinks: this.store.listBookingLinks(),
    });
    const saved = this.store.saveAnalytics(analytics);
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendCrmwLog({
      event: "generate_crm_analytics",
      details: `analytics=${saved.analyticsId}`,
    });
    return this.report(
      "generate_crm_analytics",
      this.getCatalog(),
      [],
      this.store.listCustomers(),
      this.store.listLeads(),
      null,
      null,
      null,
      null,
      saved,
      validation,
      started,
    );
  }

  produceReport(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.crmRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled ? "CRM Worker is disabled" : "CRM rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    let customer = this.requireCustomer(input);
    if (!customer) {
      const created = this.createCustomerProfile(input, config);
      customer = created.latestCustomer;
      if (!customer || created.validation.decision === "fail") {
        return {
          ...created,
          action: "produce_report" as const,
        };
      }
    }

    const contacts = this.store.listContacts(customer.customerId);
    const bookingLinks = this.store.listBookingLinks(customer.customerId);
    const followUps = this.store.listFollowUps(customer.customerId);
    const opportunities = this.store.listOpportunities(customer.customerId);
    const report = this.builder.assembleReport({
      customer,
      contacts,
      bookingLinks,
      followUps,
      opportunities,
      config,
    });
    const savedReport = this.store.saveReport(report, "produce_report");
    this.refreshCatalog(config);
    const validation = this.validator.validateReports(
      [savedReport],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      savedReport,
      customer,
    );
    appendCrmwLog({
      event: "produce_report",
      details: `report=${savedReport.reportId} customer=${customer.customerId}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [savedReport],
      [customer],
      this.store.listLeads().filter((l) => l.customerId === customer!.customerId),
      savedReport,
      customer,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  produceCrmReport(input: CrmInput, config: CrmWorkerConfiguration) {
    return this.produceReport(input, config);
  }

  submitReport(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let report =
      (input.reportId ? this.store.getReport(input.reportId) : null) ??
      this.store.listReports().at(-1) ??
      null;
    if (!report) {
      const generated = this.produceReport(input, config);
      report = generated.latestReport;
      if (!report || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = this.store.markSubmitted(report.reportId, submission.executiveReportId) ?? report;
    }
    const customer = this.store.getCustomer(report.customerId);
    this.refreshCatalog(config);
    const validation = this.validator.validateReports(
      report ? [report] : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
      customer,
    );
    appendCrmwLog({
      event: "submit_report",
      details: `report=${report?.reportId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      report ? [report] : [],
      customer ? [customer] : [],
      [],
      report,
      customer,
      null,
      null,
      null,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    const validation = this.validator.finalize("pass", [], [], started);
    this.ensureRecord("active", config);
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listCustomers(),
      this.store.listLeads(),
      null,
      null,
      null,
      null,
      this.store.getLatestAnalytics(),
      validation,
      started,
    );
  }

  validate(input: CrmInput, config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.listReports();
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      input,
      started,
      { allowIncompleteReport: reports.length === 0 },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
    );
    return this.report(
      "validate",
      this.getCatalog(),
      reports,
      this.store.listCustomers(),
      this.store.listLeads(),
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  diagnostics(config: CrmWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["CRM Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCrmwLog({
      event: "diagnostics",
      details: `reports=${this.store.reportCount()} customers=${this.store.customerCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listCustomers(),
      this.store.listLeads(),
      null,
      null,
      null,
      null,
      this.store.getLatestAnalytics(),
      validation,
      started,
    );
  }

  private resolveBooking(input: CrmInput): {
    booking: BookingReport | BookingFixture | null;
    source: "bookingReport" | "bookingId" | "fixtureBooking" | "none";
  } {
    if (input.bookingReport) {
      return { booking: input.bookingReport, source: "bookingReport" };
    }
    if (input.fixtureBooking) {
      return { booking: input.fixtureBooking, source: "fixtureBooking" };
    }
    if (input.bookingId?.trim()) {
      const found = this.integrations.resolveBookingById(input.bookingId.trim());
      if (found) {
        return {
          booking: {
            bookingId: found.bookingId,
            customerReference: found.customerReference,
            serviceSelected: found.serviceSelected,
            scheduledDateTime: found.scheduledDateTime,
            assignedWorker: found.assignedWorker,
            bookingStatus: found.bookingStatus,
            businessProjectId:
              "businessProjectId" in found ? found.businessProjectId : undefined,
          },
          source: "bookingId",
        };
      }
    }
    return { booking: null, source: "none" };
  }

  private requireCustomer(input: CrmInput): CustomerProfile | null {
    if (input.customerId?.trim()) {
      return this.store.getCustomer(input.customerId.trim());
    }
    if (input.customerReference?.trim()) {
      return this.store.findCustomerByReference(input.customerReference.trim());
    }
    const latest = this.store.getLatestCustomerId();
    return latest ? this.store.getCustomer(latest) : null;
  }

  private missingCustomer(
    action: CrmWorkerRunReport["action"],
    config: CrmWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.finalize(
      "fail",
      ["CRM Worker requires an existing customer profile (customerId or customerReference)"],
      [],
      started,
    );
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: CrmWorkerRunReport["action"],
    input: CrmInput,
    config: CrmWorkerConfiguration,
    started: number,
  ) {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendCrmwLog({
      event: action,
      details: `boundary_fail errors=${errors.length}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private disabled(
    action: CrmWorkerRunReport["action"],
    config: CrmWorkerConfiguration,
    reason: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [reason], [], started);
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private refreshCatalog(config: CrmWorkerConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listCustomers(),
      this.store.listLeads(),
      this.store.listFollowUps(),
      this.store.listOpportunities(),
      this.store.listBookingLinks(),
      this.store.getLatestAnalytics(),
      this.handshakes,
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: CrmWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: CrmReport | null = null,
    latestCustomer: CustomerProfile | null = null,
  ) {
    const decision =
      validationStatus === "failed"
        ? "fail"
        : validationStatus === "partial"
          ? "partial"
          : validationStatus === "passed"
            ? "pass"
            : "pass";
    this.engineRecord = {
      engineRecordId: `crmw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CRM_WORKER_ID,
      engineVersion: "PILLOW-CRMW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(decision, config.enabled),
      validationStatus,
      supportedCapabilities: [...CRMW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalCustomers: this.store.customerCount(),
      totalLeads: this.store.leadCount(),
      lastCustomerId: latestCustomer?.customerId ?? this.store.getLatestCustomerId(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CRMW_METADATA_VERSION,
    };
  }

  private report(
    action: CrmWorkerRunReport["action"],
    catalog: CrmWorkerCatalog | null,
    reports: CrmReport[],
    customers: CustomerProfile[],
    leads: LeadRecord[],
    latestReport: CrmReport | null,
    latestCustomer: CustomerProfile | null,
    latestLead: LeadRecord | null,
    latestFollowUp: FollowUp | null,
    latestAnalytics: CrmAnalytics | null,
    validation: CrmWorkerRunReport["validation"],
    started: number,
  ): CrmWorkerRunReport {
    return {
      crmRunReportId: nextRunReportId(),
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      catalog,
      reports,
      customers,
      leads,
      latestReport,
      latestCustomer,
      latestLead,
      latestFollowUp,
      latestAnalytics,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CRMW_METADATA_VERSION,
    };
  }
}

function normalizeStatus(value: string, allowed: string[]): string {
  const v = value.trim().toLowerCase();
  return allowed.includes(v) ? v : "unknown";
}

function cloneCatalog(catalog: CrmWorkerCatalog): CrmWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    customers: catalog.customers.map((c) => ({ ...c })),
    leads: catalog.leads.map((l) => ({ ...l })),
    followUps: catalog.followUps.map((f) => ({ ...f })),
    opportunities: catalog.opportunities.map((o) => ({ ...o })),
    bookingLinks: catalog.bookingLinks.map((b) => ({ ...b })),
    analytics: catalog.analytics ? { ...catalog.analytics } : null,
    integrations: catalog.integrations.map((i) => ({ ...i })),
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
