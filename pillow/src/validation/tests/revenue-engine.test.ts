import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
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
  buildRevenueEngineConfiguration,
  REVENUE_ENGINE_SYSTEM_PATH,
  RE_CAPABILITIES,
  REVENUE_ENGINE_ID,
} from "../../revenue-engine/index.js";
import { appendReLog, getReLogs } from "../../revenue-engine/re-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildRevenueEngineConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const ff = createFinancialFrameworkEngine(bootstrap);
  await ff.initialize();
  const pg = createPaymentGatewayIntegrationEngine(bootstrap, ff);
  await pg.initialize();
  const bi = createBankingIntegrationEngine(bootstrap, ff);
  await bi.initialize();
  const engine = createRevenueEngine(bootstrap, ff, pg, bi, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi };
}

async function connectDependencies(pg: Awaited<ReturnType<typeof buildStack>>["pg"], bi: Awaited<ReturnType<typeof buildStack>>["bi"]) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
}

describe("R3-04 Revenue Engine", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
  });

  test("buildRevenueEngineConfiguration loads defaults", () => {
    const config = buildRevenueEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.defaultCurrency, "USD");
    assert.ok(RE_CAPABILITIES.includes("gross_revenue_tracking"));
  });

  test("revenue engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RE-001");
    assert.equal(state.missionId, "R3-04");
    assert.ok(REVENUE_ENGINE_SYSTEM_PATH.includes("REVENUE_ENGINE"));
  });

  test("connectRevenueEngine registers with Financial Framework via R3-04", async () => {
    const { engine, ff, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    const report = engine.connectRevenueEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === REVENUE_ENGINE_ID));
  });

  test("connectRevenueEngine produces machine-readable re-* engine records", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    const report = engine.connectRevenueEngine();
    assert.ok(report.revenueRunReportId.startsWith("re-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("re-"));
    assert.equal(report.engineRecord.engineId, REVENUE_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "RE-001-v1");
    assert.equal(report.engineRecord.paymentGatewayConnected, true);
    assert.equal(report.engineRecord.bankingIntegrationConnected, true);
  });

  test("recordCompletedPayment consumes R3-02 payment records", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    const created = pg.createPaymentRequest({
      customerReference: "cust-2001",
      orderReference: "ord-6001",
      paymentAmount: 99.99,
    });
    const paymentId = created.paymentRecords[0]!.paymentId;
    pg.processPaymentAuthorization({ paymentId });
    pg.processPaymentCapture({ paymentId });

    const report = engine.recordCompletedPayment({ paymentId, businessReference: "biz-001" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "record_payment");
    assert.equal(report.revenueRecords.length, 1);
    const revenue = report.revenueRecords[0]!;
    assert.ok(revenue.revenueRecordId.startsWith("re-rec-"));
    assert.equal(revenue.revenueSource, "payment");
    assert.equal(revenue.paymentReference, paymentId);
    assert.equal(revenue.grossRevenue, 99.99);
    assert.equal(revenue.netRevenue, 99.99);
    assert.equal(revenue.metadataVersion, "RE-001-v1");
  });

  test("recordMarketplaceRevenue tracks marketplace income", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    const report = engine.recordMarketplaceRevenue({
      marketplaceReference: "amazon",
      customerReference: "cust-3001",
      businessReference: "biz-amazon",
      grossRevenue: 250.0,
      netRevenue: 220.0,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.revenueRecords[0]?.marketplaceReference, "amazon");
    assert.equal(report.revenueRecords[0]?.grossRevenue, 250);
    assert.equal(report.revenueRecords[0]?.netRevenue, 220);
  });

  test("recordSupplierSettlement consumes R3-03 banking references", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    const report = engine.recordSupplierSettlement({
      bankingReference: "acct-operating-001",
      businessReference: "biz-settlement",
      grossRevenue: 500.0,
      netRevenue: 480.0,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.revenueRecords[0]?.bankingReference, "acct-operating-001");
    assert.equal(report.revenueRecords[0]?.revenueSource, "supplier_settlement");
  });

  test("recordRevenueRefund impacts net revenue", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    const created = pg.createPaymentRequest({
      customerReference: "cust-2002",
      orderReference: "ord-6002",
      paymentAmount: 50,
    });
    const paymentId = created.paymentRecords[0]!.paymentId;
    pg.processPaymentAuthorization({ paymentId });
    pg.processPaymentCapture({ paymentId });
    engine.recordCompletedPayment({ paymentId });

    const report = engine.recordRevenueRefund({
      paymentReference: paymentId,
      refundAmount: 25,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.revenueRecords[0]?.revenueSource, "refund");
    assert.equal(report.revenueRecords[0]?.grossRevenue, -25);
    assert.equal(report.revenueRecords[0]?.netRevenue, -25);
  });

  test("aggregateRevenue calculates gross and net revenue by marketplace and business", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    engine.recordMarketplaceRevenue({
      marketplaceReference: "amazon",
      businessReference: "biz-a",
      grossRevenue: 100,
      netRevenue: 90,
    });
    engine.recordMarketplaceRevenue({
      marketplaceReference: "etsy",
      businessReference: "biz-b",
      grossRevenue: 50,
      netRevenue: 45,
    });

    const report = engine.aggregateRevenue();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "aggregate");
    assert.ok(report.aggregation);
    assert.equal(report.aggregation!.grossRevenue, 150);
    assert.equal(report.aggregation!.netRevenue, 135);
    assert.equal(report.aggregation!.byMarketplace.amazon?.grossRevenue, 100);
    assert.equal(report.aggregation!.byBusiness["biz-b"]?.netRevenue, 45);
  });

  test("duplicate revenue events are rejected", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    engine.recordMarketplaceRevenue({
      marketplaceReference: "amazon",
      grossRevenue: 10,
    });
    const duplicate = engine.recordMarketplaceRevenue({
      marketplaceReference: "amazon",
      grossRevenue: 10,
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("missing payment records are handled", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();

    const report = engine.recordCompletedPayment({ paymentId: "pg-pay-missing" });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("not found")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendReLog({
      event: "revenue_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectRevenueEngine();
    const logs = getReLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi } = await buildStack();
    await connectDependencies(pg, bi);
    engine.connectRevenueEngine();
    engine.recordMarketplaceRevenue({
      marketplaceReference: "shopify",
      grossRevenue: 75,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.grossRevenue >= 75);
  });
});
