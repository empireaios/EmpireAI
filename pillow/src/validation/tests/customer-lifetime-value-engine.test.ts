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
  createLoyaltyProgrammeEngine,
  resetLoyaltyProgrammeEngineForTesting,
} from "../../loyalty-programme-engine/index.js";
import {
  createCustomerRiskEngine,
  resetCustomerRiskEngineForTesting,
} from "../../customer-risk-engine/index.js";
import {
  createCustomerLifetimeValueEngine,
  resetCustomerLifetimeValueEngineForTesting,
  buildCustomerLifetimeValueEngineConfiguration,
  CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH,
  CLVE_METADATA_VERSION,
  CLVE_CAPABILITIES,
} from "../../customer-lifetime-value-engine/index.js";
import { appendClveLog, getClveLogs } from "../../customer-lifetime-value-engine/clve-logging.js";

async function buildClvStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "CLV Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "clv@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "analytics-team",
    contactInformation: { email: "clv@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordPurchase({
    customerId,
    eventReference: "purchase-seed",
    eventDescription: "Initial purchase",
  });

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

  const loyalty = createLoyaltyProgrammeEngine(bootstrap, identity, crm, timeline, null, null);
  await loyalty.initialize();
  const risk = createCustomerRiskEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    null,
    null,
    null,
    null,
  );
  await risk.initialize();

  const clv = createCustomerLifetimeValueEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    revenue,
    profit,
    loyalty,
    risk,
    { configuration: { highValueThreshold: 300 } },
  );
  await clv.initialize();
  return { clv, revenue, customerId };
}

function seedRevenue(
  revenue: Awaited<ReturnType<typeof buildClvStack>>["revenue"],
  customerId: string,
) {
  for (let i = 0; i < 3; i += 1) {
    revenue.recordRevenueEvent({
      revenueSource: "marketplace",
      customerReference: customerId,
      marketplaceReference: `mkt-clv-${i}`,
      businessReference: `ord-clv-${i}`,
      grossRevenue: 200 + i,
      netRevenue: 200 + i,
    });
  }
}

describe("Customer Lifetime Value Engine (R4-15 / PILLOW-CLVE-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
    resetProfitCalculationEngineForTesting();
    resetLoyaltyProgrammeEngineForTesting();
    resetCustomerRiskEngineForTesting();
    resetCustomerLifetimeValueEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerLifetimeValueEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.clvCalculationRules.length >= 1);
    assert.ok(config.predictionRules.length >= 1);
    assert.ok(config.retentionRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { clv } = await buildClvStack();
    const state = clv.getState();
    assert.equal(state.engineVersion, "PILLOW-CLVE-001");
    assert.equal(state.missionId, "R4-15");
    assert.equal(state.status, "active");
    assert.ok(CUSTOMER_LIFETIME_VALUE_ENGINE_SYSTEM_PATH.includes("LIFETIME_VALUE"));
    assert.ok(CLVE_CAPABILITIES.includes("clv_calculation"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { clv } = await buildClvStack();
    const report = clv.connectClvEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CLVE_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.revenueEngineConnected, true);
    assert.equal(report.engineRecord!.profitCalculationEngineConnected, true);
  });

  test("calculates customer lifetime value from revenue signals", async () => {
    const { clv, revenue, customerId } = await buildClvStack();
    seedRevenue(revenue, customerId);
    clv.connectClvEngine();

    const report = clv.calculateCustomerLifetimeValue({ customerId });
    assert.equal(report.action, "calculate_clv");
    assert.equal(report.clvRecords.length, 1);
    assert.match(report.clvRecords[0].clvRecordId, /^clve-rec-/);
    assert.equal(report.clvRecords[0].revenueContribution, 603);
    assert.equal(report.clvRecords[0].purchaseFrequency, 3);
    assert.equal(report.clvRecords[0].averageOrderValue, 201);
    assert.ok(report.clvRecords[0].lifetimeValue > 0);
    assert.ok(report.clvRecords[0].predictedLifetimeValue >= report.clvRecords[0].lifetimeValue);
  });

  test("tracks revenue, profitability, retention and purchase metrics", async () => {
    const { clv, revenue, customerId } = await buildClvStack();
    seedRevenue(revenue, customerId);
    clv.connectClvEngine();

    const revenueReport = clv.trackCustomerRevenueContribution({ customerId });
    assert.equal(revenueReport.action, "track_revenue");
    assert.equal(revenueReport.clvRecords[0].revenueContribution, 603);

    const profitReport = clv.trackCustomerProfitability({ customerId });
    assert.equal(profitReport.action, "track_profitability");
    assert.ok(profitReport.clvRecords[0].profitContribution >= 0);

    const retentionReport = clv.trackCustomerRetention({ customerId });
    assert.equal(retentionReport.action, "track_retention");
    assert.ok(retentionReport.clvRecords[0].retentionScore >= 0);

    const frequencyReport = clv.trackPurchaseFrequency({ customerId });
    assert.equal(frequencyReport.action, "track_purchase_frequency");
    assert.equal(frequencyReport.clvRecords[0].purchaseFrequency, 3);

    const aovReport = clv.trackAverageOrderValue({ customerId });
    assert.equal(aovReport.action, "track_average_order_value");
    assert.equal(aovReport.clvRecords[0].averageOrderValue, 201);
  });

  test("predicts future customer value and identifies high-value customers", async () => {
    const { clv, revenue, customerId } = await buildClvStack();
    seedRevenue(revenue, customerId);
    clv.connectClvEngine();
    clv.calculateCustomerLifetimeValue({ customerId });

    const prediction = clv.predictFutureCustomerValue({ customerId });
    assert.equal(prediction.action, "predict_future_value");
    assert.ok(prediction.clvRecords[0].predictedLifetimeValue > 0);
    assert.ok(prediction.insights.length >= 1);

    const highValue = clv.identifyHighValueCustomers({ customerId });
    assert.equal(highValue.action, "identify_high_value");
    assert.ok(highValue.insights.length >= 1);
    assert.match(highValue.insights[0].insightId, /^clve-insight-/);
  });

  test("produces machine-readable CLV records", async () => {
    const { clv, revenue, customerId } = await buildClvStack();
    seedRevenue(revenue, customerId);
    clv.connectClvEngine();
    const report = clv.calculateCustomerLifetimeValue({ customerId });
    const recordId = report.clvRecords[0].clvRecordId;
    const machine = clv.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.clvRecordId, recordId);
    assert.equal(machine!.metadataVersion, CLVE_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("reports CLV status and health", async () => {
    const { clv, revenue, customerId } = await buildClvStack();
    seedRevenue(revenue, customerId);
    clv.connectClvEngine();
    clv.calculateCustomerLifetimeValue({ customerId });

    const status = clv.reportClvStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.clvRecords.length >= 1);

    const health = clv.reportClvHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive log values", () => {
    appendClveLog({
      event: "clv_calculation",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getClveLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { clv, revenue, customerId } = await buildClvStack();
    seedRevenue(revenue, customerId);
    clv.connectClvEngine();
    clv.calculateCustomerLifetimeValue({ customerId });

    const cockpit = clv.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalClvRecords >= 1);

    const sync = clv.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
