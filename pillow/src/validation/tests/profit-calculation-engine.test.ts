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
} from "../../revenue-engine/index.js";
import {
  createExpenseEngine,
  resetExpenseEngineForTesting,
} from "../../expense-engine/index.js";
import {
  createProfitCalculationEngine,
  resetProfitCalculationEngineForTesting,
  buildProfitCalculationEngineConfiguration,
  PROFIT_CALCULATION_ENGINE_SYSTEM_PATH,
  PC_CAPABILITIES,
  PROFIT_CALCULATION_ENGINE_ID,
} from "../../profit-calculation-engine/index.js";
import { appendPcLog, getPcLogs } from "../../profit-calculation-engine/pc-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildProfitCalculationEngineConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const ff = createFinancialFrameworkEngine(bootstrap);
  await ff.initialize();
  const pg = createPaymentGatewayIntegrationEngine(bootstrap, ff);
  await pg.initialize();
  const bi = createBankingIntegrationEngine(bootstrap, ff);
  await bi.initialize();
  const re = createRevenueEngine(bootstrap, ff, pg, bi);
  await re.initialize();
  const ex = createExpenseEngine(bootstrap, ff, pg, bi, re);
  await ex.initialize();
  const engine = createProfitCalculationEngine(bootstrap, ff, re, ex, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-4001",
    orderReference: "ord-7001",
    paymentAmount: 200,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-001" });
  re.recordMarketplaceRevenue({
    marketplaceReference: "amazon",
    grossRevenue: 500,
    netRevenue: 450,
  });
  ex.recordSupplierPayment({
    supplierReference: "supplier-001",
    expenseAmount: 150,
  });
  ex.recordShippingExpense({ expenseAmount: 30 });
  ex.recordAdvertisingExpense({ expenseAmount: 50 });
  ex.recordPlatformFee({ expenseAmount: 20 });
}

describe("R3-06 Profit Calculation Engine", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
    resetProfitCalculationEngineForTesting();
  });

  test("buildProfitCalculationEngineConfiguration loads defaults", () => {
    const config = buildProfitCalculationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(PC_CAPABILITIES.includes("gross_profit_calculation"));
  });

  test("profit calculation engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PC-001");
    assert.equal(state.missionId, "R3-06");
    assert.ok(PROFIT_CALCULATION_ENGINE_SYSTEM_PATH.includes("PROFIT_CALCULATION"));
  });

  test("connectProfitCalculationEngine registers with Financial Framework via R3-06", async () => {
    const { engine, ff, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    const report = engine.connectProfitCalculationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === PROFIT_CALCULATION_ENGINE_ID));
  });

  test("connectProfitCalculationEngine produces machine-readable pc-* engine records", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    const report = engine.connectProfitCalculationEngine();
    assert.ok(report.profitRunReportId.startsWith("pc-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("pc-"));
    assert.equal(report.engineRecord.engineId, PROFIT_CALCULATION_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "PC-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.expenseEngineConnected, true);
  });

  test("calculateProfit computes gross, operating, net profit and margin", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);

    const report = engine.calculateProfit();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "calculate");
    const profit = report.profitRecords[0]!;
    assert.ok(profit.profitRecordId.startsWith("pc-rec-"));
    assert.equal(profit.metadataVersion, "PC-001-v1");
    assert.ok(profit.grossProfit > 0);
    assert.ok(typeof profit.operatingProfit === "number");
    assert.ok(typeof profit.netProfit === "number");
    assert.ok(typeof profit.profitMargin === "number");
  });

  test("calculateProfitByMarketplace calculates marketplace profit", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);

    const report = engine.calculateProfitByMarketplace({ marketplaceReference: "amazon" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.profitRecords[0]?.marketplaceReference, "amazon");
  });

  test("calculateProfitBySupplier calculates supplier profit", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);

    const report = engine.calculateProfitBySupplier({ supplierReference: "supplier-001" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.profitRecords[0]?.supplierReference, "supplier-001");
  });

  test("calculateProfitByOrder calculates order profit", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);

    const report = engine.calculateProfitByOrder({ orderReference: "ord-7001" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.profitRecords[0]?.orderReference, "ord-7001");
  });

  test("aggregateProfit aggregates profit records", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);
    engine.calculateProfit();
    engine.calculateProfitByMarketplace({ marketplaceReference: "amazon" });

    const report = engine.aggregateProfit();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "aggregate");
    assert.ok(report.aggregation);
    assert.equal(report.aggregation!.totalRecords, 2);
  });

  test("duplicate profit calculations are rejected", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);
    engine.calculateProfit();
    const duplicate = engine.calculateProfit();
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendPcLog({
      event: "profit_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectProfitCalculationEngine();
    const logs = getPcLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex } = await buildStack();
    await connectDependencies(pg, bi, re, ex);
    engine.connectProfitCalculationEngine();
    await seedFinancialData(pg, re, ex);
    engine.calculateProfit();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
