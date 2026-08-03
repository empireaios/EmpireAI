import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUTOMATION_STEP_TYPES,
  CONVERSATION_STATUSES,
  INTEGRATION_TARGETS,
  MESSAGE_DIRECTIONS,
  WAW_CAPABILITIES,
  WAW_METADATA_VERSION,
  WHATSAPP_REPORT_VERSION,
  buildWhatsAppWorkerConfiguration,
  createWhatsAppWorker,
  resetWhatsAppWorkerForTesting,
  type CrmFixture,
  type WhatsAppInput,
} from "../../whatsapp-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleFixtureCrm(): CrmFixture {
  return {
    reportId: "crmw-rpt-fixture-001",
    businessProjectId: "lbfc-prj-cleaning-01",
    customerId: "crmw-cust-fixture-001",
    customerReference: "cust-orchard-home-01",
    leadStatus: "new",
    customerLifecycleStage: "lead",
    confidenceScore: 0.8,
    outstandingTasks: [],
  };
}

function sampleInput(overrides: Partial<WhatsAppInput> = {}): WhatsAppInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    customerReference: "cust-orchard-home-01",
    labels: ["cleaning", "orchard"],
    grandKingInstructions: "WhatsApp structural signals only; no CRM/booking replacement.",
    pillowCommandConfirmed: true,
    validated: true,
    evidenceMode: "fixture",
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createWhatsAppWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWhatsAppWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-06 WhatsApp Worker", () => {
  beforeEach(resetWhatsAppWorkerForTesting);

  test("1 locks mandatory whatsapp-worker boundaries", () => {
    const c = buildWhatsAppWorkerConfiguration(REPO_ROOT, {
      neverReplaceCrm: false as never,
      neverReplaceBookingWorker: false as never,
      neverReplaceOperationsWorker: false as never,
      neverModifyUnrelatedPlatformComponents: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricateMessageDeliveryResults: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ707OrLater: false as never,
      preserveCompleteTraceability: false as never,
      preserveConversationHistory: false as never,
      preserveAuditHistory: false as never,
      neverExposeCredentials: false as never,
      neverExposeProhibitedPersonalData: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverReplaceCrm, true);
    assert.equal(c.neverReplaceBookingWorker, true);
    assert.equal(c.neverReplaceOperationsWorker, true);
    assert.equal(c.neverModifyUnrelatedPlatformComponents, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricateMessageDeliveryResults, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ707OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveConversationHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeProhibitedPersonalData, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-WAW-001 for Q7-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-06");
    assert.equal(state.engineVersion, "PILLOW-WAW-001");
    assert.equal(state.configuration.workerId, "wkr-whatsapp-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(WAW_CAPABILITIES.includes("receive_inbound_enquiry"));
    assert.ok(WAW_CAPABILITIES.includes("trigger_crm_workflow"));
    for (const status of [
      "open",
      "awaiting_customer",
      "awaiting_agent",
      "automated",
      "escalated",
      "resolved",
      "closed",
      "failed",
      "unknown",
    ]) {
      assert.ok((CONVERSATION_STATUSES as readonly string[]).includes(status));
    }
    for (const direction of ["inbound", "outbound"]) {
      assert.ok((MESSAGE_DIRECTIONS as readonly string[]).includes(direction));
    }
    for (const step of [
      "enquiry_received",
      "auto_reply",
      "template_send",
      "booking_trigger",
      "crm_trigger",
      "escalate_human",
      "unknown",
    ]) {
      assert.ok((AUTOMATION_STEP_TYPES as readonly string[]).includes(step));
    }
  });

  test("3 receive inbound enquiry", async () => {
    const engine = await build();
    const received = engine.receiveInboundEnquiry(
      sampleInput({
        messageBody: "Hi, I need a residential cleaning quote",
      }),
    );
    assert.equal(received.action, "receive_inbound_enquiry");
    assert.notEqual(received.validation.decision, "fail");
    assert.ok(received.latestConversation);
    assert.ok(received.latestConversation!.conversationId.startsWith("waw-conv-"));
    assert.equal(received.latestConversation!.customerReference, "cust-orchard-home-01");
    assert.equal(received.latestMessage!.direction, "inbound");
    assert.equal(received.latestMessage!.deliveryStatus, "received");
    assert.ok(engine.getConversations().length >= 1);
  });

  test("4 send automated reply (fixture transport observed success only)", async () => {
    const engine = await build();
    const workflow = engine.runAutomatedWorkflow(
      sampleInput({
        messageBody: "Need cleaning this weekend",
        deliveryFixture: { passed: true, reason: "fixture_observed_pass", transportMessageId: "fixture-tx-001" },
      }),
    );
    assert.equal(workflow.action, "run_automated_workflow");
    assert.notEqual(workflow.validation.decision, "fail");
    assert.ok(workflow.latestMessage);
    assert.equal(workflow.latestMessage!.direction, "outbound");
    assert.equal(workflow.latestMessage!.deliveryStatus, "delivered");
    assert.equal(workflow.latestMessage!.deliveryOutcome?.passed, true);
    assert.equal(workflow.latestMessage!.deliveryOutcome?.observed, true);
    assert.equal(workflow.latestMessage!.evidenceMode, "fixture");
    assert.equal(workflow.latestConversation!.status, "automated");

    const noFixture = engine.sendOutboundMessage(
      sampleInput({
        conversationId: workflow.latestConversation!.conversationId,
        messageBody: "Follow-up without fixture",
        evidenceMode: "fixture",
      }),
    );
    assert.equal(noFixture.latestMessage!.deliveryStatus, "failed");
    assert.equal(noFixture.latestMessage!.deliveryOutcome?.passed, false);
    assert.equal(
      noFixture.latestMessage!.deliveryOutcome?.reason,
      "no_fixture_delivery_result_observed",
    );
  });

  test("5 conversation history preserved", async () => {
    const engine = await build();
    const inbound = engine.receiveInboundEnquiry(
      sampleInput({ messageBody: "First message" }),
    );
    const convId = inbound.latestConversation!.conversationId;
    engine.sendOutboundMessage(
      sampleInput({
        conversationId: convId,
        messageBody: "Auto reply",
        deliveryFixture: { passed: true, reason: "fixture_ok" },
      }),
    );
    engine.receiveInboundEnquiry(
      sampleInput({
        conversationId: convId,
        messageBody: "Second customer message",
      }),
    );
    const history = engine.getConversationHistory(sampleInput({ conversationId: convId }));
    assert.equal(history.action, "get_conversation_history");
    assert.ok(history.messages.length >= 3);
    assert.equal(history.messages[0]!.body, "First message");
    assert.ok(history.messages.some((m) => m.direction === "outbound"));
    assert.ok(history.messages.some((m) => m.body === "Second customer message"));
  });

  test("6 CRM integration trigger functioning (injected mock)", async () => {
    const crmCalls: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createWhatsAppWorker(bootstrap, {
      dependencies: {
        crmWorker: {
          captureLead: (input) => {
            crmCalls.push(`captureLead:${String(input.customerReference)}`);
            return { ok: true };
          },
          recordContact: (input) => {
            crmCalls.push(`recordContact:${String(input.contactChannel)}`);
            return { ok: true };
          },
          scheduleFollowUp: () => {
            crmCalls.push("scheduleFollowUp");
            return { ok: true };
          },
          getQ706ConsumableContract: () => ({
            contractVersion: "CRMW-Q706-v1",
            consumableByQ706: true as const,
            fields: ["customerId"] as const,
            types: {
              CrmReport: "CrmReport" as const,
              CustomerProfile: "CustomerProfile" as const,
              LeadRecord: "LeadRecord" as const,
              ContactHistoryEntry: "ContactHistoryEntry" as const,
              BookingHistoryLink: "BookingHistoryLink" as const,
              FollowUp: "FollowUp" as const,
              CrmAnalytics: "CrmAnalytics" as const,
            },
            notes: [],
            neverExecuteMarketingCampaigns: true as const,
            neverDeliverCustomerJobs: true as const,
            neverReplaceBookingFunctionality: true as const,
            neverFabricateCustomerInteractions: true as const,
          }),
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "CRM trigger enquiry", fixtureCrm: sampleFixtureCrm() }));
    const triggered = engine.triggerCrmWorkflow(sampleInput({ fixtureCrm: sampleFixtureCrm() }));
    assert.equal(triggered.action, "trigger_crm_workflow");
    assert.notEqual(triggered.validation.decision, "fail");
    assert.equal(triggered.latestConversation!.crmIntegrationStatus, "triggered");
    assert.ok(crmCalls.some((c) => c.startsWith("captureLead:")));
    assert.ok(crmCalls.some((c) => c.startsWith("recordContact:")));
  });

  test("7 Booking integration trigger functioning (injected mock)", async () => {
    const bookingCalls: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createWhatsAppWorker(bootstrap, {
      dependencies: {
        bookingWorker: {
          createBooking: (input) => {
            bookingCalls.push(`createBooking:${String(input.customerReference)}`);
            return { bookingId: "bkw-bk-mock-001" };
          },
          generateConfirmation: () => {
            bookingCalls.push("generateConfirmation");
            return { confirmationId: "bkw-conf-mock-001" };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "Book me please" }));
    const triggered = engine.triggerBookingWorkflow(sampleInput());
    assert.equal(triggered.action, "trigger_booking_workflow");
    assert.notEqual(triggered.validation.decision, "fail");
    assert.equal(triggered.latestConversation!.bookingIntegrationStatus, "triggered");
    assert.ok(bookingCalls.includes("createBooking:cust-orchard-home-01"));
    assert.ok(bookingCalls.includes("generateConfirmation"));
  });

  test("8 reminder workflow", async () => {
    const engine = await build();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "Remind me" }));
    const reminder = engine.scheduleReminder(
      sampleInput({
        reminderPurpose: "quote_follow_up",
        reminderDueAt: "2026-08-12T09:00:00.000Z",
        messageBody: "Reminder: cleaning quote pending",
      }),
    );
    assert.equal(reminder.action, "schedule_reminder");
    assert.equal(reminder.validation.decision, "pass");
    assert.ok(reminder.latestReminder);
    assert.ok(reminder.latestReminder!.reminderId.startsWith("waw-rem-"));
    assert.equal(reminder.latestReminder!.status, "scheduled");
    assert.equal(reminder.latestReminder!.purpose, "quote_follow_up");
  });

  test("9 conversation escalation to human", async () => {
    const engine = await build();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "Speak to a person" }));
    const escalated = engine.escalateToHuman(
      sampleInput({
        escalationReason: "customer_requested_human",
        assignedAgent: "agent-ops-01",
      }),
    );
    assert.equal(escalated.action, "escalate_to_human");
    assert.equal(escalated.validation.decision, "pass");
    assert.equal(escalated.latestConversation!.status, "escalated");
    assert.equal(escalated.latestConversation!.assignedAgent, "agent-ops-01");
    assert.ok(escalated.latestEscalation);
    assert.equal(escalated.latestEscalation!.reason, "customer_requested_human");
  });

  test("10 full WhatsApp Report required fields + consumableByQ707", async () => {
    const engine = await build();
    engine.receiveInboundEnquiry(
      sampleInput({ messageBody: "Full report path", labels: ["cleaning"] }),
    );
    engine.runAutomatedWorkflow(
      sampleInput({
        deliveryFixture: { passed: true, reason: "fixture_ok" },
      }),
    );
    engine.scheduleReminder(
      sampleInput({
        reminderPurpose: "nudge",
        reminderDueAt: "2026-08-15T09:00:00.000Z",
      }),
    );
    const report = engine.produceWhatsAppReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("waw-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.ok(latest.conversationId.startsWith("waw-conv-"));
    assert.equal(latest.customerReference, "cust-orchard-home-01");
    assert.ok(latest.messageDirection);
    assert.ok(latest.conversationStatus);
    assert.ok(Array.isArray(latest.templatesUsed));
    assert.ok(Array.isArray(latest.automationSteps));
    assert.ok(latest.crmIntegrationStatus);
    assert.ok(latest.bookingIntegrationStatus);
    assert.ok(latest.auditStatus);
    assert.ok(Array.isArray(latest.outstandingIssues));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, WAW_METADATA_VERSION);
    assert.equal(latest.reportVersion, WHATSAPP_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-whatsapp-01");
    assert.ok(Array.isArray(latest.messages));
    assert.ok(latest.messages.length >= 1);
    assert.ok(Array.isArray(latest.labels));
    assert.ok(Array.isArray(latest.mediaAttachments));
    assert.ok(Array.isArray(latest.reminderSchedule));
    assert.equal(latest.consumableByQ707, true);
    assert.equal(latest.neverReplaceCrm, true);
    assert.equal(latest.neverReplaceBookingWorker, true);
    assert.equal(latest.neverFabricateMessageDeliveryResults, true);
    assert.equal(latest.neverImplementQ707OrLater, true);
    assert.equal(latest.preserveConversationHistory, true);
    assert.equal(latest.preserveAuditHistory, true);
    assert.ok(latest.evidenceMode);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.equal(latest.submittedToExecutiveReporting, false);
  });

  test("11 ERR submit when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createWhatsAppWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-waw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "Submit path" }));
    const produced = engine.produceWhatsAppReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-06"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-waw-001");
  });

  test("12 rejects Q7-07 / fabricate delivery / replace CRM / replace booking", async () => {
    const engine = await build();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "boundary base" }));
    for (const forbidden of [
      { missionId: "Q7-07" },
      { implementQ707OrLater: true },
      { fabricateMessageDeliveryResults: true },
      { replaceCrm: true },
      { replaceBookingWorker: true },
      { replaceOperationsWorker: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceWhatsAppReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("13 Q7-07 consumable contract + cockpit", async () => {
    const engine = await build();
    engine.receiveInboundEnquiry(sampleInput({ messageBody: "cockpit path" }));
    engine.sendOutboundMessage(
      sampleInput({
        messageBody: "reply",
        deliveryFixture: { passed: true, reason: "ok" },
      }),
    );
    engine.produceWhatsAppReport(sampleInput());

    const contract = engine.getQ707ConsumableContract();
    assert.equal(contract.consumableByQ707, true);
    assert.equal(contract.contractVersion, "WAW-Q707-v1");
    assert.ok(contract.fields.includes("conversationId"));
    assert.ok(contract.fields.includes("messages"));
    assert.equal(contract.neverReplaceCrm, true);
    assert.equal(contract.neverFabricateMessageDeliveryResults, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-06");
    assert.ok(cockpit.totalReports >= 1);
    assert.ok(cockpit.totalConversations >= 1);
    assert.equal(cockpit.consumableByQ707, true);
    assert.equal(cockpit.neverImplementQ707OrLater, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.list().reports.length >= 1);
    assert.ok(engine.getConversations().length >= 1);
    assert.ok(engine.getReports().length >= 1);
  });
});
