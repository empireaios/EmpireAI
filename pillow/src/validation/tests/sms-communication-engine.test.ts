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
  createSmsCommunicationEngine,
  resetSmsCommunicationEngineForTesting,
  buildSmsCommunicationEngineConfiguration,
  SMS_COMMUNICATION_ENGINE_SYSTEM_PATH,
  SCE_METADATA_VERSION,
  SCE_CAPABILITIES,
} from "../../sms-communication-engine/index.js";
import { appendSceLog, getSceLogs } from "../../sms-communication-engine/sce-logging.js";

async function buildSmsStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "SMS Test User",
    customerIdentifiers: [
      { identifierType: "phone", identifierValue: "+15551234567", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { phone: "+15551234567" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  const sms = createSmsCommunicationEngine(bootstrap, crm, timeline);
  await sms.initialize();
  return { bootstrap, identity, crm, timeline, sms, customerId };
}

describe("SMS Communication Engine (R4-05 / PILLOW-SCE-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetSmsCommunicationEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildSmsCommunicationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.deliveryRules.length >= 3);
  });

  test("initializes with governance doc", async () => {
    const { sms } = await buildSmsStack();
    const state = sms.getState();
    assert.equal(state.engineVersion, "PILLOW-SCE-001");
    assert.equal(state.missionId, "R4-05");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { sms } = await buildSmsStack();
    const report = sms.connectSmsCommunicationEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, SCE_METADATA_VERSION);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
  });

  test("creates SMS templates", async () => {
    const { sms } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    const report = sms.createSmsTemplate({
      templateName: "Verification Code",
      smsCategory: "verification",
      bodyTemplate: "Your code is {{code}}",
    });
    assert.equal(report.action, "create_template");
    assert.equal(report.templates.length, 1);
    assert.match(report.templates[0].templateId, /^sce-tpl-/);
  });

  test("queues and delivers transactional SMS", async () => {
    const { sms, customerId } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    const tpl = sms.createSmsTemplate({
      templateName: "Order Confirm",
      smsCategory: "transactional",
      bodyTemplate: "Your order is confirmed.",
    });
    const templateId = tpl.templates[0].templateId;
    const sent = sms.sendTransactionalSms({
      customerId,
      recipientPhoneNumber: "+15551234567",
      templateId,
    });
    assert.equal(sent.action, "send_transactional");
    assert.equal(sent.smsRecords[0].deliveryStatus, "queued");
    const delivered = sms.processSmsQueue();
    assert.equal(delivered.smsRecords[0].deliveryStatus, "delivered");
  });

  test("sends notification and verification SMS", async () => {
    const { sms, customerId } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    const notification = sms.sendNotificationSms({
      customerId,
      recipientPhoneNumber: "+15551234567",
    });
    const verification = sms.sendVerificationSms({
      customerId,
      recipientPhoneNumber: "+15551234567",
    });
    assert.equal(notification.action, "send_notification");
    assert.equal(verification.action, "send_verification");
    sms.processSmsQueue();
    assert.ok(sms.getSmsRecords().filter((r) => r.deliveryStatus === "delivered").length >= 2);
  });

  test("tracks delivery confirmation and retries", async () => {
    const { sms, customerId } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    const sent = sms.sendTransactionalSms({
      customerId,
      recipientPhoneNumber: "+15551234567",
    });
    sms.processSmsQueue();
    const smsRecordId = sent.smsRecords[0].smsRecordId;
    const confirmed = sms.trackDeliveryConfirmation({ smsRecordId });
    assert.equal(confirmed.smsRecords[0].deliveryStatus, "confirmed");
    const retried = sms.retrySms({ smsRecordId });
    assert.equal(retried.action, "retry_sms");
    assert.equal(retried.smsRecords[0].deliveryStatus, "queued");
  });

  test("rejects invalid phone numbers", async () => {
    const { sms, customerId } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    const report = sms.sendTransactionalSms({
      customerId,
      recipientPhoneNumber: "not-a-phone",
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("produces machine-readable SMS records", async () => {
    const { sms, customerId } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    const sent = sms.sendNotificationSms({
      customerId,
      recipientPhoneNumber: "+15551234567",
    });
    const smsRecordId = sent.smsRecords[0].smsRecordId;
    const machine = sms.getMachineReadableRecord(smsRecordId);
    assert.ok(machine);
    assert.equal(machine!.metadataVersion, SCE_METADATA_VERSION);
    assert.equal(machine!.smsCategory, "notification");
  });

  test("redacts sensitive values in logs", () => {
    appendSceLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret999 password=hidden",
    });
    const logs = getSceLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret999"));
  });

  test("cockpit and supervisor sync", async () => {
    const { sms, customerId } = await buildSmsStack();
    sms.connectSmsCommunicationEngine();
    sms.sendTransactionalSms({
      customerId,
      recipientPhoneNumber: "+15551234567",
    });
    sms.processSmsQueue();
    const cockpit = sms.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.deliveredSms >= 1);
    const sync = sms.validateForSupervisorSync();
    assert.ok(sync.valid);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(
      SMS_COMMUNICATION_ENGINE_SYSTEM_PATH,
      "docs/governance/EMPIREAI_SMS_COMMUNICATION_ENGINE_SYSTEM.md",
    );
    assert.ok(SCE_CAPABILITIES.includes("transactional_sms"));
    assert.ok(SCE_CAPABILITIES.includes("delivery_confirmation"));
  });
});
