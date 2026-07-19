import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createCrmFoundationEngine,
  resetCrmFoundationForTesting,
} from "../../crm-foundation/index.js";
import {
  createCustomerTimelineEngine,
  resetCustomerTimelineEngineForTesting,
} from "../../customer-timeline-engine/index.js";
import {
  createEmailCommunicationEngine,
  resetEmailCommunicationEngineForTesting,
} from "../../email-communication-engine/index.js";
import {
  createSmsCommunicationEngine,
  resetSmsCommunicationEngineForTesting,
} from "../../sms-communication-engine/index.js";
import {
  createWhatsAppIntegration,
  resetWhatsAppIntegrationForTesting,
} from "../../whatsapp-integration/index.js";
import {
  createLiveChatIntegration,
  resetLiveChatIntegrationForTesting,
} from "../../live-chat-integration/index.js";
import {
  createAiCustomerSupport,
  resetAiCustomerSupportForTesting,
} from "../../ai-customer-support/index.js";
import {
  createTicketManagementEngine,
  resetTicketManagementEngineForTesting,
  buildTicketManagementEngineConfiguration,
  TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH,
  TME_METADATA_VERSION,
  TME_CAPABILITIES,
} from "../../ticket-management-engine/index.js";
import { appendTmeLog, getTmeLogs } from "../../ticket-management-engine/tme-logging.js";

async function buildTicketStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Ticket Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "ticket@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "ticket@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-ticket",
    eventDescription: "Prior support activity",
  });
  const email = createEmailCommunicationEngine(bootstrap, crm, timeline);
  await email.initialize();
  email.connectEmailCommunicationEngine();
  const sms = createSmsCommunicationEngine(bootstrap, crm, timeline);
  await sms.initialize();
  sms.connectSmsCommunicationEngine();
  const whatsapp = createWhatsAppIntegration(bootstrap, crm, timeline);
  await whatsapp.initialize();
  whatsapp.connectWhatsAppIntegration();
  const liveChat = createLiveChatIntegration(bootstrap, timeline);
  await liveChat.initialize();
  liveChat.connectLiveChatIntegration();
  const aiSupport = createAiCustomerSupport(
    bootstrap,
    identity,
    crm,
    timeline,
    email,
    sms,
    whatsapp,
    liveChat,
  );
  await aiSupport.initialize();
  aiSupport.connectAiCustomerSupport();
  const tickets = createTicketManagementEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    liveChat,
    aiSupport,
  );
  await tickets.initialize();
  return { bootstrap, identity, crm, timeline, liveChat, aiSupport, tickets, customerId };
}

describe("Ticket Management Engine (R4-09 / PILLOW-TME-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetEmailCommunicationEngineForTesting();
    resetSmsCommunicationEngineForTesting();
    resetWhatsAppIntegrationForTesting();
    resetLiveChatIntegrationForTesting();
    resetAiCustomerSupportForTesting();
    resetTicketManagementEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildTicketManagementEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.classificationRules.length >= 4);
  });

  test("initializes with governance doc", async () => {
    const { tickets } = await buildTicketStack();
    const state = tickets.getState();
    assert.equal(state.engineVersion, "PILLOW-TME-001");
    assert.equal(state.missionId, "R4-09");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { tickets } = await buildTicketStack();
    const report = tickets.connectTicketManagementEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, TME_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.liveChatIntegrationConnected, true);
    assert.equal(report.engineRecord!.aiCustomerSupportConnected, true);
  });

  test("creates support tickets with classification and assignment", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    const report = tickets.createSupportTicket({
      customerId,
      subject: "Payment issue with invoice",
      description: "I was charged twice on my last bill",
    });
    assert.equal(report.action, "create_ticket");
    assert.equal(report.ticketRecords[0].ticketCategory, "billing");
    assert.equal(report.ticketRecords[0].ticketPriority, "high");
    assert.equal(report.ticketRecords[0].assignedOwner, "billing-team");
    assert.match(report.ticketRecords[0].ticketId, /^tme-tkt-/);
  });

  test("classifies ticket categories", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    const created = tickets.createSupportTicket({
      customerId,
      subject: "General question",
      description: "Need help",
    });
    const ticketId = created.ticketRecords[0].ticketId;
    const classified = tickets.classifyTicketCategory({
      ticketId,
      subject: "Shipping delay",
      description: "My order has not arrived",
    });
    assert.equal(classified.ticketRecords[0].ticketCategory, "shipping");
  });

  test("assigns ticket priority and ownership", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    const created = tickets.createSupportTicket({
      customerId,
      subject: "Help needed",
      description: "General support request",
    });
    const ticketId = created.ticketRecords[0].ticketId;
    const priority = tickets.assignTicketPriority({ ticketId, priority: "critical" });
    assert.equal(priority.ticketRecords[0].ticketPriority, "critical");
    const ownership = tickets.assignTicketOwnership({ ticketId, ownerId: "escalation-team" });
    assert.equal(ownership.ticketRecords[0].assignedOwner, "escalation-team");
    assert.equal(ownership.ticketRecords[0].currentStatus, "assigned");
  });

  test("tracks ticket lifecycle", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    const created = tickets.createSupportTicket({
      customerId,
      subject: "Technical bug",
      description: "Application crashes on login",
    });
    const ticketId = created.ticketRecords[0].ticketId;
    tickets.assignTicketOwnership({ ticketId, ownerId: "support-team" });
    const inProgress = tickets.trackTicketLifecycle({ ticketId, status: "in_progress" });
    assert.equal(inProgress.ticketRecords[0].currentStatus, "in_progress");
    assert.equal(inProgress.ticketRecords[0].resolutionStatus, "in_progress");
    const resolved = tickets.trackTicketLifecycle({
      ticketId,
      status: "resolved",
      resolutionStatus: "resolved",
    });
    assert.equal(resolved.ticketRecords[0].currentStatus, "resolved");
    assert.equal(resolved.ticketRecords[0].resolutionStatus, "resolved");
  });

  test("links tickets to customers, conversations, and timelines", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    const created = tickets.createSupportTicket({
      customerId,
      subject: "Account access",
      description: "Cannot login to account",
    });
    const ticketId = created.ticketRecords[0].ticketId;
    const customerLink = tickets.linkTicketToCustomer({ ticketId, customerId });
    assert.equal(customerLink.ticketRecords[0].customerId, customerId);
    const convLink = tickets.linkTicketToConversation({
      ticketId,
      conversationReference: "conv-live-chat-001",
    });
    assert.equal(convLink.ticketRecords[0].conversationReference, "conv-live-chat-001");
    const timelineLink = tickets.linkTicketToTimeline({ ticketId });
    assert.ok(timelineLink.ticketRecords[0].relatedTimelineReference);
  });

  test("detects overdue and stalled tickets", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine({
      forceReconnect: false,
    });
    tickets.createSupportTicket({
      customerId,
      subject: "Open ticket",
      description: "Still waiting for response",
    });
    const overdue = tickets.detectOverdueTickets();
    assert.equal(overdue.action, "detect_overdue");
    const stalled = tickets.detectStalledTickets();
    assert.equal(stalled.action, "detect_stalled");
  });

  test("produces machine-readable ticket records", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    const created = tickets.createSupportTicket({
      customerId,
      subject: "Refund request",
      description: "Need refund for duplicate charge",
    });
    const ticketId = created.ticketRecords[0].ticketId;
    const machine = tickets.getMachineReadableRecord(ticketId);
    assert.ok(machine);
    assert.equal(machine!.ticketId, ticketId);
    assert.equal(machine!.metadataVersion, TME_METADATA_VERSION);
    assert.equal(machine!.ticketCategory, "billing");
  });

  test("redacts sensitive values in logs", () => {
    appendTmeLog({
      event: "test",
      level: "info",
      details: "token=secret123 password=hidden",
    });
    const logs = getTmeLogs(5);
    const last = logs[logs.length - 1];
    assert.match(last.details, /redacted/i);
  });

  test("cockpit and supervisor sync", async () => {
    const { tickets, customerId } = await buildTicketStack();
    tickets.connectTicketManagementEngine();
    tickets.createSupportTicket({
      customerId,
      subject: "Support request",
      description: "Need assistance",
    });
    const cockpit = tickets.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalTickets >= 1);
    const supervisor = tickets.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 50);
  });

  test("exports capabilities and governance path", () => {
    assert.ok(TME_CAPABILITIES.includes("ticket_creation"));
    assert.ok(TME_CAPABILITIES.includes("lifecycle_tracking"));
    assert.ok(TICKET_MANAGEMENT_ENGINE_SYSTEM_PATH.includes("TICKET_MANAGEMENT"));
  });
});
