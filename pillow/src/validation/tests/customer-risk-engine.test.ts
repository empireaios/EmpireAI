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
} from "../../customer-sentiment-engine/index.js";
import {
  createReviewManagementEngine,
  resetReviewManagementEngineForTesting,
} from "../../review-management-engine/index.js";
import {
  createReturnManagementEngine,
  resetReturnManagementForTesting,
} from "../../return-management/index.js";
import type { ShipmentTrackingEngine } from "../../shipment-tracking-engine/engine.js";
import {
  createReturnsIntelligenceEngine,
  resetReturnsIntelligenceEngineForTesting,
} from "../../returns-intelligence-engine/index.js";
import {
  createCustomerRiskEngine,
  resetCustomerRiskEngineForTesting,
  buildCustomerRiskEngineConfiguration,
  CUSTOMER_RISK_ENGINE_SYSTEM_PATH,
  CRE_METADATA_VERSION,
  CRE_CAPABILITIES,
} from "../../customer-risk-engine/index.js";
import { appendCreLog, getCreLogs } from "../../customer-risk-engine/cre-logging.js";

async function buildCustomerRiskStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Risk Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "risk@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "risk-team",
    contactInformation: { email: "risk@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-risk",
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
  sentiment.connectCustomerSentimentEngine();
  const reviews = createReviewManagementEngine(
    bootstrap,
    identity,
    timeline,
    sentiment,
    aiSupport,
  );
  await reviews.initialize();
  reviews.connectReviewManagementEngine();
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
  const customerRisk = createCustomerRiskEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    tickets,
    sentiment,
    reviews,
    returnsIntelligence,
  );
  await customerRisk.initialize();
  return { customerRisk, returnsIntelligence, sentiment, customerId };
}

function seedRiskSignals(
  returnsIntelligence: Awaited<ReturnType<typeof buildCustomerRiskStack>>["returnsIntelligence"],
  customerId: string,
) {
  returnsIntelligence.connectReturnsIntelligenceEngine();
  for (let i = 0; i < 3; i += 1) {
    returnsIntelligence.receiveReturnRequest({
      customerId,
      orderReference: `ORD-RISK-${i}`,
      productReference: `SKU-RISK-${i}`,
      returnReason: "changed_mind",
    });
  }
}

describe("Customer Risk Engine (R4-14 / PILLOW-CRE-001)", () => {
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
    resetReviewManagementEngineForTesting();
    resetReturnManagementForTesting();
    resetReturnsIntelligenceEngineForTesting();
    resetCustomerRiskEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerRiskEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.fraudDetectionRules.length >= 1);
    assert.ok(config.riskThresholdRules.length >= 1);
    assert.ok(config.alertRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { customerRisk } = await buildCustomerRiskStack();
    const state = customerRisk.getState();
    assert.equal(state.engineVersion, "PILLOW-CRE-001");
    assert.equal(state.missionId, "R4-14");
    assert.equal(state.status, "active");
    assert.ok(CUSTOMER_RISK_ENGINE_SYSTEM_PATH.includes("CUSTOMER_RISK"));
    assert.ok(CRE_CAPABILITIES.includes("fraud_detection"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { customerRisk, returnsIntelligence } = await buildCustomerRiskStack();
    returnsIntelligence.connectReturnsIntelligenceEngine();
    const report = customerRisk.connectCustomerRiskEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CRE_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.ticketManagementEngineConnected, true);
    assert.equal(report.engineRecord!.sentimentEngineConnected, true);
    assert.equal(report.engineRecord!.reviewManagementEngineConnected, true);
    assert.equal(report.engineRecord!.returnsIntelligenceEngineConnected, true);
  });

  test("evaluates customer risk with fraud and abuse indicators", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();

    const report = customerRisk.evaluateCustomerRisk({ customerId, riskCategory: "composite" });
    assert.equal(report.action, "evaluate_risk");
    assert.equal(report.customerRiskRecords.length, 1);
    assert.match(report.customerRiskRecords[0].customerRiskId, /^cre-rec-/);
    assert.ok(report.customerRiskRecords[0].riskScore > 0);
    assert.ok(report.customerRiskRecords[0].riskIndicators.length >= 1);
    assert.ok(report.customerRiskRecords[0].recommendedAction);
  });

  test("detects fraud, abuse, and behaviour categories", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();

    const fraud = customerRisk.detectFraudIndicators({ customerId });
    assert.equal(fraud.action, "detect_fraud");
    assert.ok(fraud.customerRiskRecords[0].riskCategory === "fraud");

    const abuse = customerRisk.detectAccountAbuse({ customerId });
    assert.equal(abuse.action, "detect_abuse");
    assert.ok(abuse.customerRiskRecords[0].riskCategory === "abuse");

    const purchasing = customerRisk.detectSuspiciousPurchasingBehaviour({ customerId });
    assert.equal(purchasing.action, "detect_purchasing");

    const returns = customerRisk.detectSuspiciousReturnBehaviour({ customerId });
    assert.equal(returns.action, "detect_returns");

    const communication = customerRisk.detectSuspiciousCommunicationPatterns({ customerId });
    assert.equal(communication.action, "detect_communication");
  });

  test("calculates risk score and generates alerts", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();
    customerRisk.evaluateCustomerRisk({ customerId });

    const score = customerRisk.calculateCustomerRiskScore({ customerId });
    assert.equal(score.action, "calculate_score");
    assert.ok(score.customerRiskRecords[0].riskScore >= 0);

    const alerts = customerRisk.generateCustomerRiskAlerts({ customerId });
    assert.equal(alerts.action, "generate_alerts");
    if (alerts.alerts.length > 0) {
      assert.match(alerts.alerts[0].alertId, /^cre-alert-/);
    }
  });

  test("recommends mitigation actions", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();
    const evaluated = customerRisk.evaluateCustomerRisk({ customerId });
    const recordId = evaluated.customerRiskRecords[0].customerRiskId;

    const mitigation = customerRisk.recommendMitigationActions({ customerRiskId: recordId });
    assert.equal(mitigation.action, "recommend_mitigation");
    assert.ok(mitigation.customerRiskRecords[0].recommendedAction);
  });

  test("produces machine-readable customer risk records", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();
    const report = customerRisk.evaluateCustomerRisk({ customerId });
    const recordId = report.customerRiskRecords[0].customerRiskId;
    const machine = customerRisk.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.customerRiskId, recordId);
    assert.equal(machine!.metadataVersion, CRE_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("reports customer risk status and health", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();
    customerRisk.evaluateCustomerRisk({ customerId });

    const status = customerRisk.reportCustomerRiskStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.customerRiskRecords.length >= 1);

    const health = customerRisk.reportCustomerRiskHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("detects failures and redacts sensitive log values", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();
    customerRisk.evaluateCustomerRisk({ customerId });

    const failures = customerRisk.detectCustomerRiskFailures();
    assert.equal(failures.action, "detect_failures");

    appendCreLog({
      event: "risk_evaluation",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getCreLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { customerRisk, returnsIntelligence, customerId } = await buildCustomerRiskStack();
    seedRiskSignals(returnsIntelligence, customerId);
    customerRisk.connectCustomerRiskEngine();
    customerRisk.evaluateCustomerRisk({ customerId });

    const cockpit = customerRisk.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalCustomerRiskRecords >= 1);

    const sync = customerRisk.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
