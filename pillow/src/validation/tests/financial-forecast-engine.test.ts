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
} from "../../cash-flow-monitor/index.js";
import {
  createReconciliationEngine,
  resetReconciliationEngineForTesting,
} from "../../reconciliation-engine/index.js";
import {
  createInvoiceGeneratorEngine,
  resetInvoiceGeneratorForTesting,
} from "../../invoice-generator/index.js";
import {
  createRefundEngine,
  resetRefundEngineForTesting,
} from "../../refund-engine/index.js";
import {
  createTaxIntelligenceEngine,
  resetTaxIntelligenceEngineForTesting,
} from "../../tax-intelligence-engine/index.js";
import {
  createMultiCurrencyEngine,
  resetMultiCurrencyEngineForTesting,
} from "../../multi-currency-engine/index.js";
import {
  createFinancialForecastEngine,
  resetFinancialForecastEngineForTesting,
  buildFinancialForecastEngineConfiguration,
  FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH,
  FCT_CAPABILITIES,
  FINANCIAL_FORECAST_ENGINE_ID,
} from "../../financial-forecast-engine/index.js";
import { appendFctLog, getFctLogs } from "../../financial-forecast-engine/fct-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildFinancialForecastEngineConfiguration>[1],
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
  const cf = createCashFlowMonitorEngine(bootstrap, ff, bi, re, ex, pc);
  await cf.initialize();
  const rc = createReconciliationEngine(bootstrap, ff, pg, bi, re, ex, cf);
  await rc.initialize();
  const ig = createInvoiceGeneratorEngine(bootstrap, ff, re, ex, rc);
  await ig.initialize();
  const rf = createRefundEngine(bootstrap, ff, pg, bi, re, ex, ig);
  await rf.initialize();
  const tx = createTaxIntelligenceEngine(bootstrap, ff, re, ex, pc, rc, ig, rf);
  await tx.initialize();
  const mc = createMultiCurrencyEngine(bootstrap, ff, bi, re, ex, pc, tx);
  await mc.initialize();
  const engine = createFinancialForecastEngine(bootstrap, ff, re, ex, pc, cf, mc, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
  rc: Awaited<ReturnType<typeof buildStack>>["rc"],
  ig: Awaited<ReturnType<typeof buildStack>>["ig"],
  rf: Awaited<ReturnType<typeof buildStack>>["rf"],
  tx: Awaited<ReturnType<typeof buildStack>>["tx"],
  mc: Awaited<ReturnType<typeof buildStack>>["mc"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
  pc.connectProfitCalculationEngine();
  cf.connectCashFlowMonitor();
  rc.connectReconciliationEngine();
  ig.connectInvoiceGenerator();
  rf.connectRefundEngine();
  tx.connectTaxIntelligenceEngine();
  mc.connectMultiCurrencyEngine();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-8001",
    orderReference: "ord-11001",
    paymentAmount: 300,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-fct-001" });
  re.recordMarketplaceRevenue({
    marketplaceReference: "amazon",
    grossRevenue: 1000,
    netRevenue: 900,
  });
  ex.recordSupplierPayment({ supplierReference: "supplier-001", expenseAmount: 400 });
  ex.recordShippingExpense({ expenseAmount: 80 });
  pc.calculateProfit();
  cf.monitorCashFlow();
}

describe("R3-13 Financial Forecast Engine", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
    resetProfitCalculationEngineForTesting();
    resetCashFlowMonitorForTesting();
    resetReconciliationEngineForTesting();
    resetInvoiceGeneratorForTesting();
    resetRefundEngineForTesting();
    resetTaxIntelligenceEngineForTesting();
    resetMultiCurrencyEngineForTesting();
    resetFinancialForecastEngineForTesting();
  });

  test("buildFinancialForecastEngineConfiguration loads defaults", () => {
    const config = buildFinancialForecastEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.defaultForecastPeriod, "30d");
    assert.ok(FCT_CAPABILITIES.includes("revenue_forecasting"));
  });

  test("financial forecast engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FCT-001");
    assert.equal(state.missionId, "R3-13");
    assert.ok(FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH.includes("FINANCIAL_FORECAST"));
  });

  test("connectFinancialForecastEngine registers with Financial Framework via R3-13", async () => {
    const { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    const report = engine.connectFinancialForecastEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === FINANCIAL_FORECAST_ENGINE_ID));
  });

  test("connectFinancialForecastEngine produces machine-readable fct-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    const report = engine.connectFinancialForecastEngine();
    assert.ok(report.forecastRunReportId.startsWith("fct-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("fct-"));
    assert.equal(report.engineRecord.engineId, FINANCIAL_FORECAST_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "FCT-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.cashFlowMonitorConnected, true);
  });

  test("generateFinancialProjection forecasts revenue expense profit and cash flow", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);

    const report = engine.generateFinancialProjection({ forecastPeriod: "30d" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "generate_projection");
    const forecast = report.forecastRecords[0]!;
    assert.ok(forecast.forecastRecordId.startsWith("fct-rec-"));
    assert.equal(forecast.metadataVersion, "FCT-001-v1");
    assert.equal(forecast.forecastPeriod, "30d");
    assert.ok(forecast.revenueForecast > 0);
    assert.ok(forecast.expenseForecast > 0);
    assert.equal(
      forecast.profitForecast,
      Math.round((forecast.revenueForecast - forecast.expenseForecast) * 100) / 100,
    );
    assert.ok(forecast.forecastConfidenceScore >= 50);
    assert.ok(report.trends.length >= 5);
  });

  test("generateFinancialProjection supports multiple forecast periods", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);

    const shortTerm = engine.generateFinancialProjection({ forecastPeriod: "7d" });
    const longTerm = engine.generateFinancialProjection({ forecastPeriod: "annual" });
    assert.notEqual(shortTerm.validation.decision, "fail");
    assert.notEqual(longTerm.validation.decision, "fail");
    assert.ok(
      longTerm.forecastRecords[0]!.revenueForecast > shortTerm.forecastRecords[0]!.revenueForecast,
    );
  });

  test("analyzeFinancialTrends analyzes financial trends", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);

    const report = engine.analyzeFinancialTrends();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "analyze_trends");
    assert.ok(report.trends.some((t) => t.metric === "revenue"));
    assert.ok(report.trends.some((t) => t.metric === "cash_flow"));
  });

  test("detectForecastDeviations detects deviations and risks", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);
    engine.generateFinancialProjection({ forecastPeriod: "30d" });
    const second = engine.generateFinancialProjection({ forecastPeriod: "annual" });

    const report = engine.detectForecastDeviations({
      forecastRecordId: second.forecastRecords[0]?.forecastRecordId,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "detect_deviations");
    assert.ok(report.deviations.length > 0 || report.risks.length > 0);
  });

  test("duplicate forecast projections are rejected", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);
    engine.generateFinancialProjection({ forecastPeriod: "30d" });
    const duplicate = engine.generateFinancialProjection({ forecastPeriod: "30d" });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("invalid forecast period is rejected", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);
    const report = engine.generateFinancialProjection({
      forecastPeriod: "invalid" as "30d",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("Invalid forecast period")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendFctLog({
      event: "forecast_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectFinancialForecastEngine();
    const logs = getFctLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc);
    engine.connectFinancialForecastEngine();
    await seedFinancialData(pg, re, ex, pc, cf);
    engine.generateFinancialProjection({ forecastPeriod: "30d" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.lastConfidenceScore !== null);
  });
});
