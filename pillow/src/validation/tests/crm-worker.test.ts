import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CRM_REPORT_VERSION,
  CRMW_CAPABILITIES,
  CRMW_METADATA_VERSION,
  CUSTOMER_STATUSES,
  INTEGRATION_TARGETS,
  LEAD_STATUSES,
  LIFECYCLE_STAGES,
  buildCrmWorkerConfiguration,
  createCrmWorker,
  resetCrmWorkerForTesting,
  type BookingFixture,
  type CrmInput,
} from "../../crm-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleFixtureBooking(): BookingFixture {
  return {
    bookingId: "bkw-bk-fixture-001",
    customerReference: "cust-orchard-home-01",
    serviceSelected: "residential cleaning — Basic",
    scheduledDateTime: "2026-08-10T10:00:00.000Z",
    assignedWorker: "wkr-tech-clean-01",
    bookingStatus: "confirmed",
    businessProjectId: "lbfc-prj-cleaning-01",
    reportId: "bkw-rpt-fixture-001",
    packageId: "sow-pkg-001",
    serviceArea: "Orchard",
    confidenceScore: 0.85,
  };
}

function sampleInput(overrides: Partial<CrmInput> = {}): CrmInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    displayName: "Orchard Home Customer",
    customerReference: "cust-orchard-home-01",
    tags: ["cleaning", "orchard"],
    segments: ["busy homeowners"],
    referralSource: "local-search",
    grandKingInstructions: "CRM structural signals only; no campaigns or job delivery.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createCrmWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCrmWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-05 CRM Worker", () => {
  beforeEach(resetCrmWorkerForTesting);

  test("1 locks mandatory crm-worker boundaries", () => {
    const c = buildCrmWorkerConfiguration(REPO_ROOT, {
      neverExecuteMarketingCampaigns: false as never,
      neverDeliverCustomerJobs: false as never,
      neverReplaceBookingFunctionality: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricateCustomerInteractions: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ706OrLater: false as never,
      preserveCompleteCustomerHistory: false as never,
      preserveCompleteTraceability: false as never,
      preserveCrmAuditHistory: false as never,
      neverExposeCredentials: false as never,
      neverExposeProhibitedPersonalData: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverExecuteMarketingCampaigns, true);
    assert.equal(c.neverDeliverCustomerJobs, true);
    assert.equal(c.neverReplaceBookingFunctionality, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricateCustomerInteractions, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ706OrLater, true);
    assert.equal(c.preserveCompleteCustomerHistory, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveCrmAuditHistory, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeProhibitedPersonalData, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-CRMW-001 for Q7-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-05");
    assert.equal(state.engineVersion, "PILLOW-CRMW-001");
    assert.equal(state.configuration.workerId, "wkr-crm-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(CRMW_CAPABILITIES.includes("create_customer_profile"));
    assert.ok(CRMW_CAPABILITIES.includes("link_booking_history"));
    for (const status of [
      "new",
      "contacted",
      "qualified",
      "proposal",
      "won",
      "lost",
      "nurture",
      "unknown",
    ]) {
      assert.ok((LEAD_STATUSES as readonly string[]).includes(status));
    }
    for (const stage of [
      "lead",
      "prospect",
      "active_customer",
      "repeat_customer",
      "inactive",
      "churned",
      "unknown",
    ]) {
      assert.ok((LIFECYCLE_STAGES as readonly string[]).includes(stage));
    }
    for (const status of ["active", "inactive", "blocked", "archived", "unknown"]) {
      assert.ok((CUSTOMER_STATUSES as readonly string[]).includes(status));
    }
  });

  test("3 creates customer profile", async () => {
    const engine = await build();
    const created = engine.createCustomerProfile(sampleInput());
    assert.equal(created.action, "create_customer_profile");
    assert.notEqual(created.validation.decision, "fail");
    assert.ok(created.latestCustomer);
    assert.ok(created.latestCustomer!.customerId.startsWith("crmw-cust-"));
    assert.equal(created.latestCustomer!.customerReference, "cust-orchard-home-01");
    assert.equal(created.latestCustomer!.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(created.latestCustomer!.status, "active");
    assert.ok(engine.getCustomers().length >= 1);
  });

  test("4 captures lead", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    const lead = engine.captureLead(
      sampleInput({
        contactName: "Orchard Home Customer",
        contactChannel: "phone",
        interest: "residential cleaning",
        leadStatus: "new",
        source: "web_form",
      }),
    );
    assert.equal(lead.action, "capture_lead");
    assert.notEqual(lead.validation.decision, "fail");
    assert.ok(lead.latestLead);
    assert.ok(lead.latestLead!.leadId.startsWith("crmw-lead-"));
    assert.equal(lead.latestLead!.status, "new");
    assert.equal(lead.latestLead!.interest, "residential cleaning");
    assert.ok(engine.getLeads().length >= 1);
  });

  test("5 records contact history", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    const contact = engine.recordContact(
      sampleInput({
        contactSummary: "Initial qualification call regarding residential cleaning",
        contactChannel: "phone",
        contactDirection: "outbound",
        tags: ["qualification"],
      }),
    );
    assert.equal(contact.action, "record_contact");
    assert.equal(contact.validation.decision, "pass");
    assert.ok(contact.latestCustomer);
    assert.ok(contact.latestCustomer!.contactHistoryIds.length >= 1);

    const withoutSummary = engine.recordContact(sampleInput());
    assert.equal(withoutSummary.validation.decision, "fail");
  });

  test("6 schedules follow-up", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    const scheduled = engine.scheduleFollowUp(
      sampleInput({
        followUpPurpose: "post-booking satisfaction check",
        followUpDueAt: "2026-08-12T09:00:00.000Z",
      }),
    );
    assert.equal(scheduled.action, "schedule_follow_up");
    assert.equal(scheduled.validation.decision, "pass");
    assert.ok(scheduled.latestFollowUp);
    assert.ok(scheduled.latestFollowUp!.followUpId.startsWith("crmw-fu-"));
    assert.equal(scheduled.latestFollowUp!.status, "scheduled");
    assert.equal(scheduled.latestFollowUp!.purpose, "post-booking satisfaction check");
  });

  test("7 links booking history from fixture", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    const linked = engine.linkBookingHistory(
      sampleInput({
        fixtureBooking: sampleFixtureBooking(),
      }),
    );
    assert.equal(linked.action, "link_booking_history");
    assert.notEqual(linked.validation.decision, "fail");
    assert.ok(linked.latestCustomer);
    assert.ok(linked.latestCustomer!.bookingLinkIds.length >= 1);
    assert.equal(linked.latestCustomer!.lifecycleStage, "active_customer");

    const report = engine.produceCrmReport(sampleInput());
    assert.ok(report.latestReport!.bookingHistory.length >= 1);
    assert.equal(report.latestReport!.bookingHistory[0]!.bookingId, "bkw-bk-fixture-001");
    assert.equal(report.latestReport!.bookingHistory[0]!.source, "fixtureBooking");
  });

  test("8 updates CRM lifecycle", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput({ lifecycleStage: "lead" }));
    const updated = engine.updateLifecycleStage(
      sampleInput({
        lifecycleStage: "repeat_customer",
        leadStatus: "won",
      }),
    );
    assert.equal(updated.action, "update_lifecycle_stage");
    assert.equal(updated.validation.decision, "pass");
    assert.equal(updated.latestCustomer!.lifecycleStage, "repeat_customer");
    assert.equal(updated.latestCustomer!.leadStatus, "won");
    assert.equal(updated.latestCustomer!.repeatCustomer, true);
  });

  test("9 full CRM Report required fields + consumableByQ706", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    engine.captureLead(
      sampleInput({
        contactName: "Orchard Home Customer",
        interest: "residential cleaning",
        leadStatus: "qualified",
      }),
    );
    engine.recordContact(
      sampleInput({
        contactSummary: "Discussed package options",
        contactChannel: "email",
      }),
    );
    engine.linkBookingHistory(sampleInput({ fixtureBooking: sampleFixtureBooking() }));
    engine.scheduleFollowUp(
      sampleInput({
        followUpPurpose: "confirm appointment",
        followUpDueAt: "2026-08-09T09:00:00.000Z",
      }),
    );
    const report = engine.produceCrmReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("crmw-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.ok(latest.customerId.startsWith("crmw-cust-"));
    assert.ok(latest.leadStatus);
    assert.ok(Array.isArray(latest.contactHistory));
    assert.ok(latest.contactHistory.length >= 1);
    assert.ok(Array.isArray(latest.bookingHistory));
    assert.ok(latest.bookingHistory.length >= 1);
    assert.ok(Array.isArray(latest.followUpSchedule));
    assert.ok(latest.customerLifecycleStage);
    assert.ok(Array.isArray(latest.outstandingTasks));
    assert.ok(latest.auditStatus);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, CRMW_METADATA_VERSION);
    assert.equal(latest.reportVersion, CRM_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-crm-01");
    assert.ok(Array.isArray(latest.tags));
    assert.ok(Array.isArray(latest.segments));
    assert.equal(typeof latest.repeatCustomer, "boolean");
    assert.ok(Array.isArray(latest.opportunities));
    assert.ok(Array.isArray(latest.communicationHistory));
    assert.equal(latest.consumableByQ706, true);
    assert.equal(latest.neverExecuteMarketingCampaigns, true);
    assert.equal(latest.neverDeliverCustomerJobs, true);
    assert.equal(latest.neverReplaceBookingFunctionality, true);
    assert.equal(latest.neverFabricateCustomerInteractions, true);
    assert.equal(latest.neverImplementQ706OrLater, true);
    assert.equal(latest.preserveCompleteCustomerHistory, true);
    assert.equal(latest.preserveCrmAuditHistory, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.equal(latest.submittedToExecutiveReporting, false);
  });

  test("10 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCrmWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-crmw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.createCustomerProfile(sampleInput());
    const produced = engine.produceCrmReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-05"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-crmw-001");
  });

  test("11 rejects Q7-06 / fabricate interactions / execute campaigns / deliver jobs / replace booking", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    for (const forbidden of [
      { missionId: "Q7-06" },
      { implementQ706OrLater: true },
      { fabricateCustomerInteractions: true },
      { executeMarketingCampaigns: true },
      { deliverCustomerJobs: true },
      { replaceBookingFunctionality: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceCrmReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("12 Q7-06 consumable contract + cockpit + analytics", async () => {
    const engine = await build();
    engine.createCustomerProfile(sampleInput());
    engine.captureLead(
      sampleInput({
        contactName: "Orchard Home Customer",
        interest: "residential cleaning",
      }),
    );
    engine.linkBookingHistory(sampleInput({ fixtureBooking: sampleFixtureBooking() }));
    engine.produceCrmReport(sampleInput());

    const analytics = engine.generateCrmAnalytics(sampleInput());
    assert.equal(analytics.action, "generate_crm_analytics");
    assert.ok(analytics.latestAnalytics);
    assert.ok(analytics.latestAnalytics!.analyticsId.startsWith("crmw-eng-"));
    assert.ok(analytics.latestAnalytics!.totalCustomers >= 1);
    assert.ok(analytics.latestAnalytics!.linkedBookings >= 1);

    const contract = engine.getQ706ConsumableContract();
    assert.equal(contract.consumableByQ706, true);
    assert.equal(contract.contractVersion, "CRMW-Q706-v1");
    assert.ok(contract.fields.includes("customerId"));
    assert.ok(contract.fields.includes("bookingHistory"));
    assert.equal(contract.neverExecuteMarketingCampaigns, true);
    assert.equal(contract.neverFabricateCustomerInteractions, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-05");
    assert.ok(cockpit.totalReports >= 1);
    assert.ok(cockpit.totalCustomers >= 1);
    assert.equal(cockpit.consumableByQ706, true);
    assert.equal(cockpit.neverImplementQ706OrLater, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.list().reports.length >= 1);
    assert.ok(engine.getCustomers().length >= 1);
    assert.ok(engine.getLeads().length >= 1);
    assert.ok(engine.getReports().length >= 1);
  });
});
