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
  createReturnManagementEngine,
  resetReturnManagementForTesting,
} from "../../return-management/index.js";
import type { ShipmentTrackingEngine } from "../../shipment-tracking-engine/engine.js";
import {
  createReturnsIntelligenceEngine,
  resetReturnsIntelligenceEngineForTesting,
  buildReturnsIntelligenceEngineConfiguration,
  RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  RIE_METADATA_VERSION,
  RIE_CAPABILITIES,
} from "../../returns-intelligence-engine/index.js";
import { appendRieLog, getRieLogs } from "../../returns-intelligence-engine/rie-logging.js";

async function buildReturnsIntelligenceStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Returns Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "returns@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "returns@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-returns",
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
  const returnManagement = createReturnManagementEngine(
    bootstrap,
    null as unknown as ShipmentTrackingEngine,
  );
  await returnManagement.initialize();
  const returnsIntelligence = createReturnsIntelligenceEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    aiSupport,
    tickets,
    returnManagement,
  );
  await returnsIntelligence.initialize();
  return { returnsIntelligence, customerId };
}

describe("Returns Intelligence Engine (R4-13 / PILLOW-RIE-001)", () => {
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
    resetReturnManagementForTesting();
    resetReturnsIntelligenceEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildReturnsIntelligenceEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.eligibilityRules.length >= 1);
    assert.ok(config.riskScoringRules.length >= 1);
    assert.ok(config.recommendationRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { returnsIntelligence } = await buildReturnsIntelligenceStack();
    const state = returnsIntelligence.getState();
    assert.equal(state.engineVersion, "PILLOW-RIE-001");
    assert.equal(state.missionId, "R4-13");
    assert.equal(state.status, "active");
    assert.ok(RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH.includes("RETURNS_INTELLIGENCE"));
    assert.ok(RIE_CAPABILITIES.includes("return_request_analysis"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { returnsIntelligence } = await buildReturnsIntelligenceStack();
    const report = returnsIntelligence.connectReturnsIntelligenceEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, RIE_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.aiCustomerSupportConnected, true);
    assert.equal(report.engineRecord!.ticketManagementEngineConnected, true);
    assert.equal(report.engineRecord!.returnManagementEngineConnected, true);
  });

  test("receives and analyzes return requests", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();

    const report = returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-1001",
      productReference: "SKU-RET-01",
      returnReason: "defective",
      returnReference: "RET-1001",
    });
    assert.equal(report.action, "receive_request");
    assert.equal(report.returnIntelligenceRecords.length, 1);
    assert.match(report.returnIntelligenceRecords[0].returnIntelligenceId, /^rie-rec-/);
    assert.ok(report.returnIntelligenceRecords[0].returnRiskScore >= 0);
    assert.ok(report.returnIntelligenceRecords[0].recommendedAction);
  });

  test("evaluates return eligibility and analyzes history", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();
    returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-1002",
      productReference: "SKU-RET-02",
      returnReason: "wrong_item",
    });

    const eligibility = returnsIntelligence.evaluateReturnEligibility({
      customerId,
      orderReference: "ORD-1003",
      returnReason: "wrong_item",
    });
    assert.equal(eligibility.action, "evaluate_eligibility");
    assert.equal(eligibility.validation.decision, "pass");

    const history = returnsIntelligence.analyzeReturnHistory({ customerId });
    assert.equal(history.action, "analyze_history");
    assert.ok(history.insights.length >= 1);
  });

  test("detects repeat return patterns and generates recommendations", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();

    returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-R1",
      productReference: "SKU-R1",
      returnReason: "changed_mind",
    });
    const second = returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-R2",
      productReference: "SKU-R2",
      returnReason: "changed_mind",
    });

    const patterns = returnsIntelligence.detectRepeatReturnPatterns({ customerId });
    assert.equal(patterns.action, "detect_repeat");
    assert.ok(patterns.insights.length >= 1);

    const recordId = second.returnIntelligenceRecords[0].returnIntelligenceId;
    const recommendation = returnsIntelligence.recommendReturnDecision({
      returnIntelligenceId: recordId,
    });
    assert.equal(recommendation.action, "recommend_decision");
    assert.ok(recommendation.returnIntelligenceRecords[0].recommendedAction);
  });

  test("coordinates communications and generates insights", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();
    const received = returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-COM",
      productReference: "SKU-COM",
      returnReason: "not_as_described",
    });
    const recordId = received.returnIntelligenceRecords[0].returnIntelligenceId;

    const comms = returnsIntelligence.coordinateCustomerCommunications({
      returnIntelligenceId: recordId,
      communicationSummary: "We are reviewing your return request.",
    });
    assert.equal(comms.action, "coordinate_communication");
    assert.ok(comms.insights.length >= 1);

    const insights = returnsIntelligence.generateReturnInsights({ customerId });
    assert.equal(insights.action, "generate_insights");
    assert.ok(insights.insights.length >= 1);
  });

  test("produces machine-readable return intelligence records", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();
    const report = returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-MR",
      productReference: "SKU-MR",
      returnReason: "damaged_in_transit",
    });
    const recordId = report.returnIntelligenceRecords[0].returnIntelligenceId;
    const machine = returnsIntelligence.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.returnIntelligenceId, recordId);
    assert.equal(machine!.metadataVersion, RIE_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("reports return status and health", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();
    returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-H",
      productReference: "SKU-H",
      returnReason: "other",
    });

    const status = returnsIntelligence.reportReturnStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.returnIntelligenceRecords.length >= 1);

    const health = returnsIntelligence.reportReturnHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive values in logs", () => {
    appendRieLog({
      event: "return_analysis",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getRieLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { returnsIntelligence, customerId } = await buildReturnsIntelligenceStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();
    returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: "ORD-C",
      productReference: "SKU-C",
      returnReason: "defective",
    });

    const cockpit = returnsIntelligence.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalReturnIntelligenceRecords >= 1);

    const sync = returnsIntelligence.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
