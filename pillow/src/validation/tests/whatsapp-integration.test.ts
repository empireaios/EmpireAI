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
  createWhatsAppIntegration,
  resetWhatsAppIntegrationForTesting,
  buildWhatsAppIntegrationConfiguration,
  WHATSAPP_INTEGRATION_SYSTEM_PATH,
  WAI_METADATA_VERSION,
  WAI_CAPABILITIES,
} from "../../whatsapp-integration/index.js";
import { appendWaiLog, getWaiLogs } from "../../whatsapp-integration/wai-logging.js";

async function buildWhatsAppStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "WhatsApp Test User",
    customerIdentifiers: [
      { identifierType: "phone", identifierValue: "+15559876543", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { phone: "+15559876543" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  const whatsapp = createWhatsAppIntegration(bootstrap, crm, timeline);
  await whatsapp.initialize();
  return { bootstrap, identity, crm, timeline, whatsapp, customerId };
}

describe("WhatsApp Integration (R4-06 / PILLOW-WAI-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetWhatsAppIntegrationForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildWhatsAppIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.messagingRules.length >= 4);
  });

  test("initializes with governance doc", async () => {
    const { whatsapp } = await buildWhatsAppStack();
    const state = whatsapp.getState();
    assert.equal(state.engineVersion, "PILLOW-WAI-001");
    assert.equal(state.missionId, "R4-06");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { whatsapp } = await buildWhatsAppStack();
    const report = whatsapp.connectWhatsAppIntegration();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, WAI_METADATA_VERSION);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
  });

  test("creates WhatsApp templates", async () => {
    const { whatsapp } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const report = whatsapp.createWhatsAppTemplate({
      templateName: "Order Update",
      messageCategory: "template",
      bodyTemplate: "Your order {{orderId}} is ready.",
    });
    assert.equal(report.action, "create_template");
    assert.equal(report.templates.length, 1);
    assert.match(report.templates[0].templateId, /^wai-tpl-/);
  });

  test("queues and delivers transactional WhatsApp", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const tpl = whatsapp.createWhatsAppTemplate({
      templateName: "Order Confirm",
      messageCategory: "transactional",
      bodyTemplate: "Your order is confirmed.",
    });
    const templateId = tpl.templates[0].templateId;
    const sent = whatsapp.sendTransactionalWhatsApp({
      customerId,
      recipientPhoneNumber: "+15559876543",
      templateId,
    });
    assert.equal(sent.action, "send_transactional");
    assert.equal(sent.whatsAppRecords[0].deliveryStatus, "queued");
    assert.match(sent.whatsAppRecords[0].conversationId, /^wai-con-/);
    const delivered = whatsapp.processMessageQueue();
    assert.equal(delivered.whatsAppRecords[0].deliveryStatus, "delivered");
  });

  test("sends notification and template WhatsApp messages", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const notification = whatsapp.sendNotificationWhatsApp({
      customerId,
      recipientPhoneNumber: "+15559876543",
    });
    const template = whatsapp.sendTemplateWhatsApp({
      customerId,
      recipientPhoneNumber: "+15559876543",
    });
    assert.equal(notification.action, "send_notification");
    assert.equal(template.action, "send_template");
    whatsapp.processMessageQueue();
    assert.ok(
      whatsapp.getWhatsAppRecords().filter((r) => r.deliveryStatus === "delivered").length >= 2,
    );
  });

  test("receives inbound messages and manages conversations", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const inbound = whatsapp.receiveInboundMessage({
      customerId,
      senderPhoneNumber: "+15559876543",
      body: "Hello, I need help with my order",
    });
    assert.equal(inbound.action, "receive_inbound");
    assert.equal(inbound.whatsAppRecords[0].messageCategory, "inbound");
    assert.equal(inbound.whatsAppRecords[0].deliveryStatus, "delivered");
    const conversationId = inbound.conversations[0].conversationId;
    const managed = whatsapp.manageConversation({
      customerId,
      recipientPhoneNumber: "+15559876543",
      conversationId,
      status: "closed",
    });
    assert.equal(managed.action, "manage_conversation");
    assert.equal(managed.conversations[0].status, "closed");
  });

  test("tracks delivery and read receipts", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const sent = whatsapp.sendTransactionalWhatsApp({
      customerId,
      recipientPhoneNumber: "+15559876543",
    });
    whatsapp.processMessageQueue();
    const whatsAppRecordId = sent.whatsAppRecords[0].whatsAppRecordId;
    const delivery = whatsapp.trackDelivery({ whatsAppRecordId });
    assert.equal(delivery.whatsAppRecords[0].deliveryStatus, "delivered");
    const read = whatsapp.trackReadReceipt({ whatsAppRecordId });
    assert.equal(read.whatsAppRecords[0].readStatus, "read");
  });

  test("rejects invalid phone numbers", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const report = whatsapp.sendTransactionalWhatsApp({
      customerId,
      recipientPhoneNumber: "not-a-phone",
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("produces machine-readable WhatsApp records", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    const sent = whatsapp.sendNotificationWhatsApp({
      customerId,
      recipientPhoneNumber: "+15559876543",
    });
    const whatsAppRecordId = sent.whatsAppRecords[0].whatsAppRecordId;
    const machine = whatsapp.getMachineReadableRecord(whatsAppRecordId);
    assert.ok(machine);
    assert.equal(machine!.metadataVersion, WAI_METADATA_VERSION);
    assert.equal(machine!.messageCategory, "notification");
    assert.ok(machine!.conversationId);
  });

  test("redacts sensitive values in logs", () => {
    appendWaiLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret999 password=hidden",
    });
    const logs = getWaiLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret999"));
  });

  test("cockpit and supervisor sync", async () => {
    const { whatsapp, customerId } = await buildWhatsAppStack();
    whatsapp.connectWhatsAppIntegration();
    whatsapp.sendTransactionalWhatsApp({
      customerId,
      recipientPhoneNumber: "+15559876543",
    });
    whatsapp.processMessageQueue();
    const cockpit = whatsapp.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.deliveredMessages >= 1);
    const sync = whatsapp.validateForSupervisorSync();
    assert.ok(sync.valid);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(
      WHATSAPP_INTEGRATION_SYSTEM_PATH,
      "docs/governance/EMPIREAI_WHATSAPP_INTEGRATION_SYSTEM.md",
    );
    assert.ok(WAI_CAPABILITIES.includes("transactional_whatsapp"));
    assert.ok(WAI_CAPABILITIES.includes("inbound_messages"));
    assert.ok(WAI_CAPABILITIES.includes("read_receipt_tracking"));
  });
});
