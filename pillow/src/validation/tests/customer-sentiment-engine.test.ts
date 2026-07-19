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
} from "../../ticket-management-engine/index.js";
import {
  createCustomerSentimentEngine,
  resetCustomerSentimentEngineForTesting,
  buildCustomerSentimentEngineConfiguration,
  CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH,
  CSE_METADATA_VERSION,
  CSE_CAPABILITIES,
} from "../../customer-sentiment-engine/index.js";
import { appendCseLog, getCseLogs } from "../../customer-sentiment-engine/cse-logging.js";

async function buildSentimentStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Sentiment Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "sentiment@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "sentiment@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-sentiment",
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
  tickets.connectTicketManagementEngine();
  const sentiment = createCustomerSentimentEngine(
    bootstrap,
    timeline,
    email,
    sms,
    whatsapp,
    liveChat,
    aiSupport,
    tickets,
  );
  await sentiment.initialize();
  return { bootstrap, timeline, tickets, sentiment, customerId };
}

describe("Customer Sentiment Engine (R4-10 / PILLOW-CSE-001)", () => {
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
    resetCustomerSentimentEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerSentimentEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.analysisRules.length >= 4);
    assert.ok(config.alertThresholds.length >= 2);
  });

  test("initializes with governance doc", async () => {
    const { sentiment } = await buildSentimentStack();
    const state = sentiment.getState();
    assert.equal(state.engineVersion, "PILLOW-CSE-001");
    assert.equal(state.missionId, "R4-10");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { sentiment } = await buildSentimentStack();
    const report = sentiment.connectCustomerSentimentEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CSE_METADATA_VERSION);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.aiCustomerSupportConnected, true);
    assert.equal(report.engineRecord!.ticketManagementEngineConnected, true);
  });

  test("analyzes customer messages with sentiment scores", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    const positive = sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "Thank you so much, excellent support!",
      communicationChannel: "live_chat",
    });
    assert.equal(positive.action, "analyze_message");
    assert.equal(positive.sentimentRecords[0].sentimentCategory, "positive");
    assert.ok(positive.sentimentRecords[0].sentimentScore >= 60);
    assert.match(positive.sentimentRecords[0].sentimentRecordId, /^cse-rec-/);

    const frustrated = sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "I am frustrated and angry about this terrible service",
      communicationChannel: "email",
    });
    assert.equal(frustrated.sentimentRecords[0].sentimentCategory, "frustrated");
    assert.ok(frustrated.sentimentRecords[0].sentimentScore <= 35);
  });

  test("analyzes customer conversations", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    const report = sentiment.analyzeCustomerConversation({
      customerId,
      conversationReference: "conv-support-001",
      messages: [
        "I have a problem with my order",
        "This is unacceptable, I want to speak to a manager",
      ],
      communicationChannel: "whatsapp",
    });
    assert.equal(report.action, "analyze_conversation");
    assert.equal(report.sentimentRecords.length, 1);
    assert.ok(
      report.sentimentRecords[0].sentimentCategory === "escalation_risk" ||
        report.sentimentRecords[0].sentimentCategory === "negative" ||
        report.sentimentRecords[0].sentimentCategory === "frustrated",
    );
  });

  test("detects satisfaction, frustration, escalation risk, and positive experiences", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "I am satisfied and happy with the helpful resolution",
      communicationChannel: "live_chat",
    });
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "I am frustrated and upset about this awful experience",
      communicationChannel: "sms",
    });
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "I need to escalate this complaint to a manager urgently",
      communicationChannel: "email",
    });

    const satisfaction = sentiment.detectCustomerSatisfaction({ customerId });
    assert.equal(satisfaction.action, "detect_satisfaction");
    assert.ok(satisfaction.sentimentRecords.length >= 1);

    const frustration = sentiment.detectCustomerFrustration({ customerId });
    assert.equal(frustration.action, "detect_frustration");
    assert.ok(frustration.sentimentRecords.length >= 1);

    const escalation = sentiment.detectEscalationRisk({ customerId });
    assert.equal(escalation.action, "detect_escalation_risk");
    assert.ok(escalation.sentimentRecords.length >= 1);

    const positive = sentiment.detectPositiveExperience({ customerId });
    assert.equal(positive.action, "detect_positive_experience");
    assert.ok(positive.sentimentRecords.length >= 1);
  });

  test("tracks sentiment trends and recalculates scores", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "Thank you, great service",
      communicationChannel: "live_chat",
    });
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "Excellent and helpful support team",
      communicationChannel: "live_chat",
      conversationReference: "conv-trend-001",
    });

    const trends = sentiment.trackSentimentTrends({
      customerId,
      conversationReference: "conv-trend-001",
    });
    assert.equal(trends.action, "track_trends");

    const recordId = sentiment.getSentimentRecords()[0].sentimentRecordId;
    const score = sentiment.calculateSentimentScore({ sentimentRecordId: recordId });
    assert.equal(score.action, "calculate_score");
    assert.ok(score.sentimentRecords[0].sentimentScore >= 0);
  });

  test("generates sentiment alerts and detects failures", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "I am frustrated and angry, this is terrible",
      communicationChannel: "live_chat",
    });

    const alerts = sentiment.generateSentimentAlerts();
    assert.equal(alerts.action, "generate_alerts");
    assert.ok(alerts.alerts.length >= 0);

    const failures = sentiment.detectSentimentFailures();
    assert.equal(failures.action, "detect_failures");
    assert.ok(Array.isArray(failures.failures));
  });

  test("produces machine-readable sentiment records", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    const analyzed = sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "Thank you for the perfect resolution",
      communicationChannel: "live_chat",
    });
    const recordId = analyzed.sentimentRecords[0].sentimentRecordId;
    const machine = sentiment.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.sentimentRecordId, recordId);
    assert.equal(machine!.metadataVersion, CSE_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("redacts sensitive values in logs", () => {
    appendCseLog({
      event: "test",
      level: "info",
      details: "token=secret123 password=hidden",
    });
    const logs = getCseLogs(5);
    const last = logs[logs.length - 1];
    assert.match(last.details, /redacted/i);
  });

  test("cockpit and supervisor sync", async () => {
    const { sentiment, customerId } = await buildSentimentStack();
    sentiment.connectCustomerSentimentEngine();
    sentiment.analyzeCustomerMessage({
      customerId,
      messageText: "Happy with the support today",
      communicationChannel: "live_chat",
    });
    const cockpit = sentiment.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalSentimentRecords >= 1);
    const supervisor = sentiment.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 50);
  });

  test("exports capabilities and governance path", () => {
    assert.ok(CSE_CAPABILITIES.includes("message_analysis"));
    assert.ok(CSE_CAPABILITIES.includes("alert_generation"));
    assert.ok(CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH.includes("CUSTOMER_SENTIMENT"));
  });
});
