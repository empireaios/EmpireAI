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
  buildAiCustomerSupportConfiguration,
  AI_CUSTOMER_SUPPORT_SYSTEM_PATH,
  ACS_METADATA_VERSION,
  ACS_CAPABILITIES,
} from "../../ai-customer-support/index.js";
import { appendAcsLog, getAcsLogs } from "../../ai-customer-support/acs-logging.js";

async function buildAiSupportStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "AI Support Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "ai-support@example.com", channel: null },
      { identifierType: "phone", identifierValue: "+15551112222", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "ai-support@example.com", phone: "+15551112222" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-support",
    eventDescription: "Prior support interaction",
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
  return { bootstrap, identity, crm, timeline, email, sms, whatsapp, liveChat, aiSupport, customerId };
}

describe("AI Customer Support (R4-08 / PILLOW-ACS-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetEmailCommunicationEngineForTesting();
    resetSmsCommunicationEngineForTesting();
    resetWhatsAppIntegrationForTesting();
    resetLiveChatIntegrationForTesting();
    resetAiCustomerSupportForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildAiCustomerSupportConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.channelRules.length >= 4);
  });

  test("initializes with governance doc", async () => {
    const { aiSupport } = await buildAiSupportStack();
    const state = aiSupport.getState();
    assert.equal(state.engineVersion, "PILLOW-ACS-001");
    assert.equal(state.missionId, "R4-08");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { aiSupport } = await buildAiSupportStack();
    const report = aiSupport.connectAiCustomerSupport();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, ACS_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.emailEngineConnected, true);
    assert.equal(report.engineRecord!.smsEngineConnected, true);
    assert.equal(report.engineRecord!.whatsAppIntegrationConnected, true);
    assert.equal(report.engineRecord!.liveChatIntegrationConnected, true);
  });

  test("receives enquiries and understands intent", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const enquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "live_chat",
      enquiryText: "I need help with my order delivery",
    });
    assert.equal(enquiry.action, "receive_enquiry");
    assert.equal(enquiry.aiSupportRecords[0].customerIntent, "order_inquiry");
    const recordId = enquiry.aiSupportRecords[0].aiSupportRecordId;
    const intent = aiSupport.understandCustomerIntent({ aiSupportRecordId: recordId });
    assert.equal(intent.aiSupportRecords[0].customerIntent, "order_inquiry");
  });

  test("retrieves customer context from CRM and timeline", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const context = aiSupport.retrieveCustomerContext({ customerId });
    assert.equal(context.action, "retrieve_context");
    assert.equal(context.contexts[0].crmProfileFound, true);
    assert.ok(context.contexts[0].timelineRecordCount >= 1);
  });

  test("generates AI responses autonomously", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const enquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "email",
      enquiryText: "What is the status of my account?",
    });
    const recordId = enquiry.aiSupportRecords[0].aiSupportRecordId;
    aiSupport.retrieveCustomerContext({ customerId });
    const response = aiSupport.generateAiResponse({ aiSupportRecordId: recordId });
    assert.equal(response.action, "generate_response");
    assert.ok(response.aiSupportRecords[0].aiResponseReference);
    assert.match(response.aiSupportRecords[0].aiResponseReference!, /^acs-res-/);
  });

  test("escalates complex enquiries", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const enquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "live_chat",
      enquiryText: "I want to speak to a manager urgently",
    });
    const recordId = enquiry.aiSupportRecords[0].aiSupportRecordId;
    assert.equal(enquiry.aiSupportRecords[0].escalationStatus, "pending");
    const escalated = aiSupport.escalateEnquiry({
      aiSupportRecordId: recordId,
      reason: "Customer requested manager",
    });
    assert.equal(escalated.aiSupportRecords[0].escalationStatus, "escalated");
  });

  test("handles multi-channel support via live chat and email", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const chatEnquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "live_chat",
      enquiryText: "Help with my support request",
    });
    const chatRecordId = chatEnquiry.aiSupportRecords[0].aiSupportRecordId;
    aiSupport.retrieveCustomerContext({ customerId });
    aiSupport.generateAiResponse({ aiSupportRecordId: chatRecordId });
    const chatDelivered = aiSupport.handleMultiChannelSupport({ aiSupportRecordId: chatRecordId });
    assert.equal(chatDelivered.action, "multi_channel_support");
    assert.equal(chatDelivered.aiSupportRecords[0].resolutionStatus, "resolved");

    const emailEnquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "email",
      enquiryText: "Billing question about my invoice",
    });
    const emailRecordId = emailEnquiry.aiSupportRecords[0].aiSupportRecordId;
    aiSupport.generateAiResponse({ aiSupportRecordId: emailRecordId });
    const emailDelivered = aiSupport.handleMultiChannelSupport({
      aiSupportRecordId: emailRecordId,
      recipientAddress: "ai-support@example.com",
    });
    assert.equal(emailDelivered.aiSupportRecords[0].resolutionStatus, "resolved");
  });

  test("handles SMS and WhatsApp channels", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const smsEnquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "sms",
      enquiryText: "Order tracking update please",
    });
    const smsRecordId = smsEnquiry.aiSupportRecords[0].aiSupportRecordId;
    aiSupport.retrieveCustomerContext({ customerId });
    aiSupport.generateAiResponse({ aiSupportRecordId: smsRecordId });
    const smsDelivered = aiSupport.handleMultiChannelSupport({
      aiSupportRecordId: smsRecordId,
      recipientPhoneNumber: "+15551112222",
    });
    assert.equal(smsDelivered.aiSupportRecords[0].resolutionStatus, "resolved");

    const waEnquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "whatsapp",
      enquiryText: "Need assistance with payment",
    });
    const waRecordId = waEnquiry.aiSupportRecords[0].aiSupportRecordId;
    aiSupport.generateAiResponse({ aiSupportRecordId: waRecordId });
    const waDelivered = aiSupport.handleMultiChannelSupport({
      aiSupportRecordId: waRecordId,
      recipientPhoneNumber: "+15551112222",
    });
    assert.equal(waDelivered.aiSupportRecords[0].resolutionStatus, "resolved");
  });

  test("generates support summaries", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const enquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "live_chat",
      enquiryText: "General help needed",
    });
    const recordId = enquiry.aiSupportRecords[0].aiSupportRecordId;
    const summary = aiSupport.generateSupportSummary({ aiSupportRecordId: recordId });
    assert.equal(summary.action, "generate_summary");
    assert.ok(summary.summaries[0].summaryText.includes(customerId));
  });

  test("produces machine-readable support records", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    const enquiry = aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "email",
      enquiryText: "Test enquiry",
    });
    const recordId = enquiry.aiSupportRecords[0].aiSupportRecordId;
    const machine = aiSupport.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.metadataVersion, ACS_METADATA_VERSION);
    assert.equal(machine!.communicationChannel, "email");
  });

  test("redacts sensitive values in logs", () => {
    appendAcsLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret999 password=hidden",
    });
    const logs = getAcsLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret999"));
  });

  test("cockpit and supervisor sync", async () => {
    const { aiSupport, customerId } = await buildAiSupportStack();
    aiSupport.connectAiCustomerSupport();
    aiSupport.receiveCustomerEnquiry({
      customerId,
      communicationChannel: "live_chat",
      enquiryText: "Help me please",
    });
    const cockpit = aiSupport.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalAiSupportRecords >= 1);
    const sync = aiSupport.validateForSupervisorSync();
    assert.ok(sync.valid);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(
      AI_CUSTOMER_SUPPORT_SYSTEM_PATH,
      "docs/governance/EMPIREAI_AI_CUSTOMER_SUPPORT_SYSTEM.md",
    );
    assert.ok(ACS_CAPABILITIES.includes("autonomous_response"));
    assert.ok(ACS_CAPABILITIES.includes("escalation"));
    assert.ok(ACS_CAPABILITIES.includes("whatsapp_support"));
  });
});
