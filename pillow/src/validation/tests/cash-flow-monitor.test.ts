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
} from "../../profit-calculation-engine/index.js";
import {
  createCashFlowMonitorEngine,
  resetCashFlowMonitorForTesting,
  buildCashFlowMonitorConfiguration,
  CASH_FLOW_MONITOR_SYSTEM_PATH,
  CF_CAPABILITIES,
  CASH_FLOW_MONITOR_ID,
} from "../../cash-flow-monitor/index.js";
import { appendCfLog, getCfLogs } from "../../cash-flow-monitor/cf-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildCashFlowMonitorConfiguration>[1],
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
  const pc = createProfitCalculationEngine(bootstrap, ff, re, ex);
  await pc.initialize();
  const engine = createCashFlowMonitorEngine(bootstrap, ff, bi, re, ex, pc, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
  pc.connectProfitCalculationEngine();
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

describe("R3-07 Cash Flow Monitor", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
    resetProfitCalculationEngineForTesting();
    resetCashFlowMonitorForTesting();
  });

  test("buildCashFlowMonitorConfiguration loads defaults", () => {
    const config = buildCashFlowMonitorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(CF_CAPABILITIES.includes("liquidity_monitoring"));
  });

  test("cash flow monitor initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CF-001");
    assert.equal(state.missionId, "R3-07");
    assert.ok(CASH_FLOW_MONITOR_SYSTEM_PATH.includes("CASH_FLOW_MONITOR"));
  });

  test("connectCashFlowMonitor registers with Financial Framework via R3-07", async () => {
    const { engine, ff, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    const report = engine.connectCashFlowMonitor();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === CASH_FLOW_MONITOR_ID));
  });

  test("connectCashFlowMonitor produces machine-readable cf-* monitor records", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    const report = engine.connectCashFlowMonitor();
    assert.ok(report.cashFlowRunReportId.startsWith("cf-run-"));
    assert.ok(report.monitorRecord.monitorRecordId.startsWith("cf-"));
    assert.equal(report.monitorRecord.monitorId, CASH_FLOW_MONITOR_ID);
    assert.equal(report.monitorRecord.metadataVersion, "CF-001-v1");
    assert.equal(report.monitorRecord.bankingIntegrationConnected, true);
    assert.equal(report.monitorRecord.revenueEngineConnected, true);
    assert.equal(report.monitorRecord.expenseEngineConnected, true);
  });

  test("monitorCashFlow computes net cash flow and liquidity status", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);
    pc.calculateProfit();

    const report = engine.monitorCashFlow();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "monitor");
    const record = report.cashFlowRecords[0]!;
    assert.ok(record.cashFlowRecordId.startsWith("cf-rec-"));
    assert.equal(record.metadataVersion, "CF-001-v1");
    assert.ok(record.cashInflow > 0);
    assert.ok(record.cashOutflow > 0);
    assert.equal(record.netCashFlow, record.cashInflow - record.cashOutflow);
    assert.ok(["healthy", "adequate", "low", "critical"].includes(record.liquidityStatus));
  });

  test("monitorInflows tracks cash inflows", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);

    const report = engine.monitorInflows();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "monitor_inflows");
    assert.equal(report.cashFlowRecords[0]?.cashOutflow, 0);
    assert.ok((report.cashFlowRecords[0]?.cashInflow ?? 0) > 0);
  });

  test("monitorOutflows tracks cash outflows and detects negative net cash flow", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);

    const report = engine.monitorOutflows();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "monitor_outflows");
    assert.equal(report.cashFlowRecords[0]?.cashInflow, 0);
    assert.ok((report.cashFlowRecords[0]?.cashOutflow ?? 0) > 0);
    assert.ok(report.cashFlowRecords[0]!.netCashFlow < 0);
    assert.ok(report.anomalies.some((a) => a.description.includes("Negative net cash flow")));
  });

  test("monitorLiquidity assesses account balance liquidity", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);

    const report = engine.monitorLiquidity();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "monitor_liquidity");
    assert.ok(report.cashFlowRecords[0]?.openingBalance >= 0);
  });

  test("forecastCashAvailability generates short-term forecast", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);

    const report = engine.forecastCashAvailability({ horizonDays: 7 });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "forecast");
    assert.ok(report.forecast);
    assert.ok(report.forecast!.forecastId.startsWith("cf-fcst-"));
    assert.equal(report.forecast!.horizonDays, 7);
  });

  test("aggregateCashFlow aggregates cash flow records", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);
    engine.monitorInflows();
    engine.monitorOutflows();

    const report = engine.aggregateCashFlow();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "aggregate");
    assert.ok(report.aggregation);
    assert.equal(report.aggregation!.totalRecords, 2);
  });

  test("duplicate cash flow monitoring events are rejected", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);
    engine.monitorCashFlow();
    const duplicate = engine.monitorCashFlow();
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendCfLog({
      event: "cash_flow_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectCashFlowMonitor();
    const logs = getCfLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc);
    engine.connectCashFlowMonitor();
    await seedFinancialData(pg, re, ex);
    engine.monitorCashFlow();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
