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
  createLoyaltyProgrammeEngine,
  resetLoyaltyProgrammeEngineForTesting,
} from "../../loyalty-programme-engine/index.js";
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
} from "../../customer-risk-engine/index.js";
import {
  createFinancialFrameworkEngine,
  resetFinancialFrameworkForTesting,
} from "../../financial-framework/index.js";
import {
  createPaymentGatewayIntegrationEngine,
  resetPaymentGatewayIntegrationForTesting,
} from "../../payment-gateway-integration/index.js";
import {
  createBankingIntegrationEngine,
  resetBankingIntegrationForTesting,
} from "../../banking-integration/index.js";
import {
  createRevenueEngine,
  resetRevenueEngineForTesting,
} from "../../revenue-engine/index.js";
import {
  createExpenseEngine,
  resetExpenseEngineForTesting,
} from "../../expense-engine/index.js";
import {
  createProfitCalculationEngine,
  resetProfitCalculationEngineForTesting,
} from "../../profit-calculation-engine/index.js";
import {
  createCustomerLifetimeValueEngine,
  resetCustomerLifetimeValueEngineForTesting,
} from "../../customer-lifetime-value-engine/index.js";
import {
  createCustomerSegmentationEngine,
  resetCustomerSegmentationEngineForTesting,
} from "../../customer-segmentation-engine/index.js";
import {
  createCustomerJourneyIntelligenceEngine,
  resetCustomerJourneyIntelligenceEngineForTesting,
} from "../../customer-journey-intelligence-engine/index.js";
import {
  createExecutiveCustomerDashboard,
  resetExecutiveCustomerDashboardForTesting,
} from "../../executive-customer-dashboard/index.js";
import {
  createCustomerOperationsCertificationEngine,
  resetCustomerOperationsCertificationForTesting,
  buildCustomerOperationsCertificationConfiguration,
  CUSTOMER_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_MISSIONS,
  COC_METADATA_VERSION,
} from "../../customer-operations-certification/index.js";
import {
  appendCocLog,
  getCocLogs,
} from "../../customer-operations-certification/coc-logging.js";

async function buildFullCustomerStack(
  configOverrides?: Parameters<typeof buildCustomerOperationsCertificationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Certification Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "cert@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "cert-team",
    contactInformation: { email: "cert@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordPurchase({
    customerId,
    eventReference: "purchase-cert",
    eventDescription: "Certification seed purchase",
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
  const loyalty = createLoyaltyProgrammeEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    sentiment,
    reviews,
  );
  await loyalty.initialize();
  loyalty.connectLoyaltyProgrammeEngine();
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
  returnsIntelligence.connectReturnsIntelligenceEngine();
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
  customerRisk.connectCustomerRiskEngine();

  const ff = createFinancialFrameworkEngine(bootstrap);
  await ff.initialize();
  const pg = createPaymentGatewayIntegrationEngine(bootstrap, ff);
  await pg.initialize();
  const bi = createBankingIntegrationEngine(bootstrap, ff);
  await bi.initialize();
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  const revenue = createRevenueEngine(bootstrap, ff, pg, bi);
  await revenue.initialize();
  revenue.connectRevenueEngine();
  const expense = createExpenseEngine(bootstrap, ff, pg, bi, revenue);
  await expense.initialize();
  expense.connectExpenseEngine();
  const profit = createProfitCalculationEngine(bootstrap, ff, revenue, expense);
  await profit.initialize();
  profit.connectProfitCalculationEngine();

  const clv = createCustomerLifetimeValueEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    revenue,
    profit,
    loyalty,
    customerRisk,
  );
  await clv.initialize();
  clv.connectClvEngine();

  const segmentation = createCustomerSegmentationEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    sentiment,
    loyalty,
    customerRisk,
    clv,
  );
  await segmentation.initialize();
  segmentation.connectSegmentationEngine();

  const journey = createCustomerJourneyIntelligenceEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    sentiment,
    clv,
    segmentation,
  );
  await journey.initialize();
  journey.connectJourneyIntelligenceEngine();

  const dashboard = createExecutiveCustomerDashboard(
    bootstrap,
    identity,
    crm,
    timeline,
    aiSupport,
    sentiment,
    reviews,
    loyalty,
    customerRisk,
    clv,
    segmentation,
    journey,
  );
  await dashboard.initialize();
  dashboard.connectExecutiveCustomerDashboard();

  const certification = createCustomerOperationsCertificationEngine(
    bootstrap,
    {
      customerIdentityEngine: identity,
      crmFoundation: crm,
      customerTimelineEngine: timeline,
      emailCommunicationEngine: email,
      smsCommunicationEngine: sms,
      whatsAppIntegration: whatsapp,
      liveChatIntegration: liveChat,
      aiCustomerSupport: aiSupport,
      ticketManagementEngine: tickets,
      customerSentimentEngine: sentiment,
      reviewManagementEngine: reviews,
      loyaltyProgrammeEngine: loyalty,
      returnsIntelligenceEngine: returnsIntelligence,
      customerRiskEngine: customerRisk,
      customerLifetimeValueEngine: clv,
      customerSegmentationEngine: segmentation,
      customerJourneyIntelligenceEngine: journey,
      executiveCustomerDashboard: dashboard,
    },
    { configuration: configOverrides },
  );
  await certification.initialize();
  return { certification, customerId };
}

describe("R4-19 Customer Operations Certification", () => {
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
    resetLoyaltyProgrammeEngineForTesting();
    resetReturnManagementForTesting();
    resetReturnsIntelligenceEngineForTesting();
    resetCustomerRiskEngineForTesting();
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
    resetProfitCalculationEngineForTesting();
    resetCustomerLifetimeValueEngineForTesting();
    resetCustomerSegmentationEngineForTesting();
    resetCustomerJourneyIntelligenceEngineForTesting();
    resetExecutiveCustomerDashboardForTesting();
    resetCustomerOperationsCertificationForTesting();
  });

  test("buildCustomerOperationsCertificationConfiguration loads defaults", () => {
    const config = buildCustomerOperationsCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.certificationScope, "full");
    assert.equal(config.passThresholdPercent, 85);
    assert.equal(config.includeSmokeTests, true);
    assert.equal(config.safeTestMode, true);
  });

  test("customer operations certification initializes with doctrine doc", async () => {
    const { certification } = await buildFullCustomerStack();
    const state = certification.getState();
    assert.equal(state.engineVersion, "PILLOW-COC-001");
    assert.equal(state.missionId, "R4-19");
    assert.ok(CUSTOMER_OPERATIONS_CERTIFICATION_SYSTEM_PATH.includes("CUSTOMER_OPERATIONS"));
  });

  test("runCustomerOperationsCertification validates all R4-01 through R4-18 missions", async () => {
    const { certification } = await buildFullCustomerStack();
    const report = await certification.runCustomerOperationsCertification({
      includeSmokeTests: true,
    });
    assert.equal(report.missionResults.length, CERTIFIED_MISSIONS.length);
    assert.equal(report.certifiedMissionList.length, CERTIFIED_MISSIONS.length);
    assert.ok(
      ["certified", "partial"].includes(report.overallCertificationStatus),
      report.detectedFailures.join("; "),
    );
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
  });

  test("runCustomerOperationsCertification produces machine-readable coc-run-* certification reports", async () => {
    const { certification } = await buildFullCustomerStack();
    const report = await certification.runCustomerOperationsCertification();
    assert.ok(report.certificationId.startsWith("coc-run-"));
    assert.equal(report.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.equal(report.metadataVersion, COC_METADATA_VERSION);
    assert.equal(report.certifiedPhase, "Customer Operations");
  });

  test("identity, CRM and communication missions are certified", async () => {
    const { certification } = await buildFullCustomerStack();
    const report = await certification.runCustomerOperationsCertification({
      includeSmokeTests: true,
    });
    const coreMissions = report.missionResults.filter((r) =>
      ["R4-01", "R4-02", "R4-03", "R4-04"].includes(r.missionId),
    );
    assert.equal(coreMissions.length, 4);
    assert.ok(
      coreMissions.every((m) => m.status !== "fail"),
      report.detectedFailures.join("; "),
    );
    assert.ok(["certified", "partial"].includes(report.certifiedCrmStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedCommunicationStatus));
  });

  test("support, analytics and intelligence certification statuses are reported", async () => {
    const { certification } = await buildFullCustomerStack();
    const report = await certification.runCustomerOperationsCertification({
      includeSmokeTests: true,
    });
    assert.ok(["certified", "partial"].includes(report.certifiedSupportStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedAnalyticsStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedCustomerIntelligenceStatus));
    const supportMissions = report.missionResults.filter((r) =>
      ["R4-08", "R4-09"].includes(r.missionId),
    );
    assert.equal(supportMissions.length, 2);
    const intelligenceMissions = report.missionResults.filter((r) =>
      ["R4-16", "R4-17", "R4-18"].includes(r.missionId),
    );
    assert.equal(intelligenceMissions.length, 3);
    assert.ok(["pass", "partial"].includes(report.endToEndValidationResult));
  });

  test("validateLatestReport validates certification report integrity", async () => {
    const { certification } = await buildFullCustomerStack();
    await certification.runCustomerOperationsCertification({ includeSmokeTests: true });
    const validation = certification.validateLatestReport();
    assert.notEqual(validation.decision, "fail", validation.errors.join("; "));
  });

  test("governance safety redacts sensitive values in certification logs", async () => {
    const { certification } = await buildFullCustomerStack();
    appendCocLog({
      event: "certification_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 token=xyz",
    });
    await certification.runCustomerOperationsCertification();
    const logs = getCocLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { certification } = await buildFullCustomerStack();
    await certification.runCustomerOperationsCertification({ includeSmokeTests: true });
    const sync = certification.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = certification.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.ok(cockpit.missionsCertified > 0);
  });
});
