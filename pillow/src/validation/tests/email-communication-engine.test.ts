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
  buildEmailCommunicationEngineConfiguration,
  EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH,
  ECE_METADATA_VERSION,
  ECE_CAPABILITIES,
} from "../../email-communication-engine/index.js";
import { appendEceLog, getEceLogs } from "../../email-communication-engine/ece-logging.js";

async function buildEmailStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Email Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "email-test@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "email-test@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  const email = createEmailCommunicationEngine(bootstrap, crm, timeline);
  await email.initialize();
  return { bootstrap, identity, crm, timeline, email, customerId };
}

describe("Email Communication Engine (R4-04 / PILLOW-ECE-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetEmailCommunicationEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildEmailCommunicationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.deliveryRules.length >= 4);
  });

  test("initializes with governance doc", async () => {
    const { email } = await buildEmailStack();
    const state = email.getState();
    assert.equal(state.engineVersion, "PILLOW-ECE-001");
    assert.equal(state.missionId, "R4-04");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { email } = await buildEmailStack();
    const report = email.connectEmailCommunicationEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, ECE_METADATA_VERSION);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
  });

  test("creates email templates", async () => {
    const { email } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    const report = email.createEmailTemplate({
      templateName: "Welcome",
      emailCategory: "transactional",
      subject: "Welcome to EmpireAI",
      bodyTemplate: "Hello {{name}}, welcome!",
    });
    assert.equal(report.action, "create_template");
    assert.equal(report.templates.length, 1);
    assert.match(report.templates[0].templateId, /^ece-tpl-/);
  });

  test("queues and delivers transactional email", async () => {
    const { email, customerId } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    const tpl = email.createEmailTemplate({
      templateName: "Order Confirm",
      emailCategory: "transactional",
      subject: "Order confirmed",
      bodyTemplate: "Your order is confirmed.",
    });
    const templateId = tpl.templates[0].templateId;
    const sent = email.sendTransactionalEmail({
      customerId,
      recipientAddress: "email-test@example.com",
      templateId,
    });
    assert.equal(sent.action, "send_transactional");
    assert.equal(sent.emailRecords[0].deliveryStatus, "queued");
    const delivered = email.processEmailQueue();
    assert.equal(delivered.emailRecords[0].deliveryStatus, "delivered");
  });

  test("sends marketing, notification and support emails", async () => {
    const { email, customerId } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    const marketing = email.sendMarketingEmail({
      customerId,
      recipientAddress: "email-test@example.com",
    });
    const notification = email.sendNotificationEmail({
      customerId,
      recipientAddress: "email-test@example.com",
    });
    const support = email.sendSupportEmail({
      customerId,
      recipientAddress: "email-test@example.com",
    });
    assert.equal(marketing.action, "send_marketing");
    assert.equal(notification.action, "send_notification");
    assert.equal(support.action, "send_support");
    email.processEmailQueue();
    assert.ok(email.getEmailRecords().filter((r) => r.deliveryStatus === "delivered").length >= 3);
  });

  test("tracks email opens and clicks", async () => {
    const { email, customerId } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    const sent = email.sendTransactionalEmail({
      customerId,
      recipientAddress: "email-test@example.com",
    });
    email.processEmailQueue();
    const emailRecordId = sent.emailRecords[0].emailRecordId;
    const opened = email.trackEmailOpen({ emailRecordId });
    assert.equal(opened.emailRecords[0].openStatus, "opened");
    const clicked = email.trackEmailClick({ emailRecordId });
    assert.equal(clicked.emailRecords[0].clickStatus, "clicked");
  });

  test("rejects invalid email addresses", async () => {
    const { email, customerId } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    const report = email.sendTransactionalEmail({
      customerId,
      recipientAddress: "not-an-email",
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("produces machine-readable email records", async () => {
    const { email, customerId } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    const sent = email.sendNotificationEmail({
      customerId,
      recipientAddress: "email-test@example.com",
    });
    const emailRecordId = sent.emailRecords[0].emailRecordId;
    const machine = email.getMachineReadableRecord(emailRecordId);
    assert.ok(machine);
    assert.equal(machine!.metadataVersion, ECE_METADATA_VERSION);
    assert.equal(machine!.emailCategory, "notification");
  });

  test("redacts sensitive values in logs", () => {
    appendEceLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret999 password=hidden",
    });
    const logs = getEceLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret999"));
  });

  test("cockpit and supervisor sync", async () => {
    const { email, customerId } = await buildEmailStack();
    email.connectEmailCommunicationEngine();
    email.sendTransactionalEmail({
      customerId,
      recipientAddress: "email-test@example.com",
    });
    email.processEmailQueue();
    const cockpit = email.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.deliveredEmails >= 1);
    const sync = email.validateForSupervisorSync();
    assert.ok(sync.valid);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(
      EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH,
      "docs/governance/EMPIREAI_EMAIL_COMMUNICATION_ENGINE_SYSTEM.md",
    );
    assert.ok(ECE_CAPABILITIES.includes("transactional_email"));
    assert.ok(ECE_CAPABILITIES.includes("open_tracking"));
  });
});
