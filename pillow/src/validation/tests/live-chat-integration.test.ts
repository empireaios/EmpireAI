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
  createLiveChatIntegration,
  resetLiveChatIntegrationForTesting,
  buildLiveChatIntegrationConfiguration,
  LIVE_CHAT_INTEGRATION_SYSTEM_PATH,
  LCI_METADATA_VERSION,
  LCI_CAPABILITIES,
} from "../../live-chat-integration/index.js";
import { appendLciLog, getLciLogs } from "../../live-chat-integration/lci-logging.js";

async function buildLiveChatStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Live Chat Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "livechat-test@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "livechat-test@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  const liveChat = createLiveChatIntegration(bootstrap, timeline);
  await liveChat.initialize();
  return { bootstrap, identity, crm, timeline, liveChat, customerId };
}

describe("Live Chat Integration (R4-07 / PILLOW-LCI-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetLiveChatIntegrationForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildLiveChatIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.sessionRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { liveChat } = await buildLiveChatStack();
    const state = liveChat.getState();
    assert.equal(state.engineVersion, "PILLOW-LCI-001");
    assert.equal(state.missionId, "R4-07");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with timeline link", async () => {
    const { liveChat } = await buildLiveChatStack();
    const report = liveChat.connectLiveChatIntegration();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, LCI_METADATA_VERSION);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
  });

  test("creates live chat sessions", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const report = liveChat.createChatSession({ customerId });
    assert.equal(report.action, "create_session");
    assert.equal(report.liveChatRecords.length, 1);
    assert.match(report.liveChatRecords[0].chatSessionId, /^lci-ses-/);
    assert.equal(report.liveChatRecords[0].chatStatus, "waiting");
    assert.ok(report.liveChatRecords[0].relatedTimelineEvent);
  });

  test("receives customer messages and processes queue", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const session = liveChat.createChatSession({ customerId });
    const chatSessionId = session.liveChatRecords[0].chatSessionId;
    const received = liveChat.receiveCustomerMessage({
      chatSessionId,
      body: "I need help with my order",
    });
    assert.equal(received.action, "receive_message");
    assert.equal(received.messages[0].sender, "customer");
    const processed = liveChat.processChatQueue();
    assert.equal(processed.action, "process_queue");
    assert.ok(processed.messages.length >= 1);
  });

  test("sends support responses and assigns sessions", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const session = liveChat.createChatSession({ customerId });
    const chatSessionId = session.liveChatRecords[0].chatSessionId;
    liveChat.receiveCustomerMessage({ chatSessionId, body: "Hello" });
    const assigned = liveChat.assignChatSession({ chatSessionId, handlerId: "agent-001" });
    assert.equal(assigned.action, "assign_session");
    assert.equal(assigned.liveChatRecords[0].assignedHandler, "agent-001");
    const response = liveChat.sendSupportResponse({
      chatSessionId,
      handlerId: "agent-001",
      body: "How can I help you today?",
    });
    assert.equal(response.action, "send_response");
    assert.equal(response.messages[0].sender, "agent");
  });

  test("manages conversations and tracks status", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const session = liveChat.createChatSession({ customerId });
    const conversationId = session.liveChatRecords[0].conversationId;
    const chatSessionId = session.liveChatRecords[0].chatSessionId;
    const managed = liveChat.manageChatConversation({ conversationId, status: "resolved" });
    assert.equal(managed.action, "manage_conversation");
    const tracked = liveChat.trackChatStatus({ chatSessionId, chatStatus: "resolved" });
    assert.equal(tracked.liveChatRecords[0].chatStatus, "resolved");
  });

  test("tracks response time", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const session = liveChat.createChatSession({ customerId });
    const chatSessionId = session.liveChatRecords[0].chatSessionId;
    const tracked = liveChat.trackResponseTime({ chatSessionId, responseTimeMs: 4500 });
    assert.equal(tracked.liveChatRecords[0].responseTimeMs, 4500);
  });

  test("links chat events to customer timeline", async () => {
    const { liveChat, timeline, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const beforeCount = timeline.getTimelineRecords().length;
    const session = liveChat.createChatSession({ customerId });
    const chatSessionId = session.liveChatRecords[0].chatSessionId;
    liveChat.receiveCustomerMessage({ chatSessionId, body: "Timeline test" });
    liveChat.sendSupportResponse({
      chatSessionId,
      handlerId: "agent-002",
      body: "Response for timeline",
    });
    assert.ok(timeline.getTimelineRecords().length > beforeCount);
  });

  test("produces machine-readable live chat records", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    const session = liveChat.createChatSession({ customerId });
    const chatSessionId = session.liveChatRecords[0].chatSessionId;
    const machine = liveChat.getMachineReadableRecord(chatSessionId);
    assert.ok(machine);
    assert.equal(machine!.metadataVersion, LCI_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
    assert.ok(machine!.conversationId);
  });

  test("redacts sensitive values in logs", () => {
    appendLciLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret999 password=hidden",
    });
    const logs = getLciLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret999"));
  });

  test("cockpit and supervisor sync", async () => {
    const { liveChat, customerId } = await buildLiveChatStack();
    liveChat.connectLiveChatIntegration();
    liveChat.createChatSession({ customerId });
    const cockpit = liveChat.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalLiveChatRecords >= 1);
    const sync = liveChat.validateForSupervisorSync();
    assert.ok(sync.valid);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(
      LIVE_CHAT_INTEGRATION_SYSTEM_PATH,
      "docs/governance/EMPIREAI_LIVE_CHAT_INTEGRATION_SYSTEM.md",
    );
    assert.ok(LCI_CAPABILITIES.includes("session_creation"));
    assert.ok(LCI_CAPABILITIES.includes("timeline_linking"));
  });
});
