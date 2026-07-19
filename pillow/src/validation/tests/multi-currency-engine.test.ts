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
  buildMultiCurrencyEngineConfiguration,
  MULTI_CURRENCY_ENGINE_SYSTEM_PATH,
  MC_CAPABILITIES,
  MULTI_CURRENCY_ENGINE_ID,
} from "../../multi-currency-engine/index.js";
import { appendMcLog, getMcLogs } from "../../multi-currency-engine/mc-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildMultiCurrencyEngineConfiguration>[1],
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
  const engine = createMultiCurrencyEngine(bootstrap, ff, bi, re, ex, pc, tx, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, rc, ig, rf, tx };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  rc: Awaited<ReturnType<typeof buildStack>>["rc"],
  ig: Awaited<ReturnType<typeof buildStack>>["ig"],
  rf: Awaited<ReturnType<typeof buildStack>>["rf"],
  tx: Awaited<ReturnType<typeof buildStack>>["tx"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
  pc.connectProfitCalculationEngine();
  rc.connectReconciliationEngine();
  ig.connectInvoiceGenerator();
  rf.connectRefundEngine();
  tx.connectTaxIntelligenceEngine();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-7001",
    orderReference: "ord-10001",
    paymentAmount: 200,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-mc-001" });
  re.recordMarketplaceRevenue({
    marketplaceReference: "amazon",
    grossRevenue: 500,
    netRevenue: 450,
    currency: "EUR",
  });
  ex.recordSupplierPayment({
    supplierReference: "supplier-001",
    expenseAmount: 150,
    currency: "GBP",
  });
  return {
    revenueId: re.getRevenueRecords().find((r) => r.currency === "EUR")!.revenueRecordId,
    expenseId: ex.getExpenseRecords().find((e) => e.currency === "GBP")!.expenseRecordId,
  };
}

describe("R3-12 Multi-Currency Engine", () => {
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
  });

  test("buildMultiCurrencyEngineConfiguration loads defaults", () => {
    const config = buildMultiCurrencyEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.reportingCurrency, "USD");
    assert.ok(MC_CAPABILITIES.includes("currency_conversion"));
    assert.ok(config.supportedCurrencies.includes("EUR"));
  });

  test("multi-currency engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MC-001");
    assert.equal(state.missionId, "R3-12");
    assert.ok(MULTI_CURRENCY_ENGINE_SYSTEM_PATH.includes("MULTI_CURRENCY"));
  });

  test("connectMultiCurrencyEngine registers with Financial Framework via R3-12", async () => {
    const { engine, ff, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    const report = engine.connectMultiCurrencyEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === MULTI_CURRENCY_ENGINE_ID));
    assert.ok(report.exchangeRates.length > 0);
  });

  test("connectMultiCurrencyEngine produces machine-readable mc-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    const report = engine.connectMultiCurrencyEngine();
    assert.ok(report.currencyRunReportId.startsWith("mc-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("mc-"));
    assert.equal(report.engineRecord.engineId, MULTI_CURRENCY_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "MC-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.taxIntelligenceEngineConnected, true);
  });

  test("convertCurrency converts EUR to USD accurately", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();

    const report = engine.convertCurrency({
      sourceCurrency: "EUR",
      targetCurrency: "USD",
      originalAmount: 100,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const record = report.currencyRecords[0]!;
    assert.ok(record.currencyRecordId.startsWith("mc-rec-"));
    assert.equal(record.metadataVersion, "MC-001-v1");
    assert.equal(record.conversionStatus, "completed");
    assert.equal(record.sourceCurrency, "EUR");
    assert.equal(record.targetCurrency, "USD");
    assert.ok(record.exchangeRate > 1);
    assert.equal(record.convertedAmount, Math.round(100 * record.exchangeRate * 100) / 100);
  });

  test("recordTransactionCurrency records revenue transaction currency", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();
    const { revenueId } = await seedFinancialData(pg, re, ex);

    const report = engine.recordTransactionCurrency({
      sourceCurrency: "EUR",
      originalAmount: 450,
      revenueReference: revenueId,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "record_transaction_currency");
    assert.equal(report.currencyRecords[0]?.sourceCurrency, "EUR");
  });

  test("refreshExchangeRates manages historical exchange rates", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();

    const refresh = engine.refreshExchangeRates({ forceRefresh: true });
    assert.notEqual(refresh.validation.decision, "fail");
    assert.ok(refresh.exchangeRates.length > 0);
    const history = engine.getExchangeRateHistory();
    assert.ok(history.length >= refresh.exchangeRates.length);
  });

  test("calculateCurrencyGainLoss computes reporting currency gain/loss", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();

    const report = engine.calculateCurrencyGainLoss({
      sourceCurrency: "EUR",
      originalAmount: 100,
      reportingCurrency: "USD",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "calculate_gain_loss");
    assert.ok(report.gainLossRecords.length === 1);
    assert.notEqual(report.gainLossRecords[0]!.gainLossAmount, 0);
  });

  test("generateCurrencySummary produces reporting currency breakdown", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();
    engine.convertCurrency({ sourceCurrency: "EUR", targetCurrency: "USD", originalAmount: 100 });
    engine.convertCurrency({ sourceCurrency: "GBP", targetCurrency: "USD", originalAmount: 50 });

    const summary = engine.generateCurrencySummary();
    assert.notEqual(summary.validation.decision, "fail");
    assert.ok(summary.summary);
    assert.ok(summary.summary!.totalConversions >= 2);
    assert.equal(summary.summary!.reportingCurrency, "USD");
  });

  test("duplicate currency conversions are rejected", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();
    engine.convertCurrency({ sourceCurrency: "EUR", targetCurrency: "USD", originalAmount: 100 });
    const duplicate = engine.convertCurrency({
      sourceCurrency: "EUR",
      targetCurrency: "USD",
      originalAmount: 100,
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("invalid currency codes are rejected", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();
    const report = engine.convertCurrency({
      sourceCurrency: "XYZ",
      targetCurrency: "USD",
      originalAmount: 100,
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("Unsupported")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendMcLog({
      event: "currency_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectMultiCurrencyEngine();
    const logs = getMcLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf, tx);
    engine.connectMultiCurrencyEngine();
    engine.convertCurrency({ sourceCurrency: "EUR", targetCurrency: "USD", originalAmount: 100 });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.lastConversionStatus, "completed");
  });
});
