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
  buildTaxIntelligenceEngineConfiguration,
  TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  TX_CAPABILITIES,
  TAX_INTELLIGENCE_ENGINE_ID,
} from "../../tax-intelligence-engine/index.js";
import { appendTxLog, getTxLogs } from "../../tax-intelligence-engine/tx-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildTaxIntelligenceEngineConfiguration>[1],
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
  const engine = createTaxIntelligenceEngine(bootstrap, ff, re, ex, pc, rc, ig, rf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, rc, ig, rf };
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
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  ig: Awaited<ReturnType<typeof buildStack>>["ig"],
  rf: Awaited<ReturnType<typeof buildStack>>["rf"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-6001",
    orderReference: "ord-9001",
    paymentAmount: 200,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-tx-001" });
  re.recordMarketplaceRevenue({
    marketplaceReference: "amazon",
    grossRevenue: 500,
    netRevenue: 450,
  });
  ex.recordSupplierPayment({
    supplierReference: "supplier-001",
    expenseAmount: 150,
  });
  const revenueId = re.getRevenueRecords()[0]!.revenueRecordId;
  const invoice = ig.createCustomerInvoice({ revenueReference: revenueId });
  const invoiceId = invoice.invoiceRecords[0]!.invoiceId;
  const refund = rf.processPartialRefund({
    paymentReference: paymentId,
    refundAmount: 25,
    refundReason: "Seed partial refund",
  });
  const refundId = refund.refundRecords[0]?.refundId ?? null;
  return { paymentId, revenueId, invoiceId, refundId };
}

describe("R3-11 Tax Intelligence Engine", () => {
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
  });

  test("buildTaxIntelligenceEngineConfiguration loads defaults", () => {
    const config = buildTaxIntelligenceEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(TX_CAPABILITIES.includes("tax_liability_calculation"));
    assert.ok(config.jurisdictionRates.some((r) => r.jurisdiction === "EU"));
  });

  test("tax intelligence engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-TX-001");
    assert.equal(state.missionId, "R3-11");
    assert.ok(TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH.includes("TAX_INTELLIGENCE"));
  });

  test("connectTaxIntelligenceEngine registers with Financial Framework via R3-11", async () => {
    const { engine, ff, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    const report = engine.connectTaxIntelligenceEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === TAX_INTELLIGENCE_ENGINE_ID));
  });

  test("connectTaxIntelligenceEngine produces machine-readable tx-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    const report = engine.connectTaxIntelligenceEngine();
    assert.ok(report.taxRunReportId.startsWith("tx-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("tx-"));
    assert.equal(report.engineRecord.engineId, TAX_INTELLIGENCE_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "TX-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.refundEngineConnected, true);
  });

  test("classifyTaxableTransaction classifies revenue and invoice references", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { revenueId, invoiceId } = await seedFinancialData(pg, re, ex, ig, rf);

    const revenueReport = engine.classifyTaxableTransaction({ revenueReference: revenueId });
    assert.notEqual(revenueReport.validation.decision, "fail");
    assert.equal(revenueReport.taxRecords[0]?.taxStatus, "classified");
    assert.equal(revenueReport.taxRecords[0]?.taxCategory, "sales_tax");

    const invoiceReport = engine.classifyTaxableTransaction({
      invoiceReference: invoiceId,
      taxJurisdiction: "EU",
    });
    assert.notEqual(invoiceReport.validation.decision, "fail");
    assert.equal(invoiceReport.taxRecords[0]?.taxCategory, "vat");
    assert.equal(invoiceReport.taxRecords[0]?.taxJurisdiction, "EU");
  });

  test("calculateTaxLiability computes US and EU tax amounts", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { invoiceId } = await seedFinancialData(pg, re, ex, ig, rf);

    const usReport = engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "US",
    });
    assert.notEqual(usReport.validation.decision, "fail");
    assert.equal(usReport.taxRecords[0]?.taxAmount, 8);
    assert.equal(usReport.taxRecords[0]?.taxRate, 0.08);
    assert.equal(usReport.taxRecords[0]?.taxStatus, "calculated");

    const euReport = engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "EU",
      taxCategory: "vat",
    });
    assert.notEqual(euReport.validation.decision, "fail");
    assert.equal(euReport.taxRecords[0]?.taxAmount, 20);
    assert.equal(euReport.taxRecords[0]?.taxRate, 0.2);
  });

  test("calculateTaxAdjustment applies refund tax adjustment", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { refundId } = await seedFinancialData(pg, re, ex, ig, rf);
    assert.ok(refundId);

    const report = engine.calculateTaxAdjustment({ refundReference: refundId! });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "calculate_adjustment");
    assert.equal(report.taxRecords[0]?.taxStatus, "adjusted");
    assert.equal(report.taxRecords[0]?.taxCategory, "refund_adjustment");
    assert.ok(report.taxRecords[0]!.taxAmount < 0);
  });

  test("recordTaxPayment tracks tax payment lifecycle", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { invoiceId } = await seedFinancialData(pg, re, ex, ig, rf);

    const liability = engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "US",
    });
    const taxRecordId = liability.taxRecords[0]!.taxRecordId;

    const payment = engine.recordTaxPayment({ taxRecordId, paymentAmount: 8 });
    assert.notEqual(payment.validation.decision, "fail");
    assert.equal(payment.taxRecords[0]?.taxStatus, "paid");
  });

  test("generateTaxSummary produces jurisdiction breakdown", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { invoiceId } = await seedFinancialData(pg, re, ex, ig, rf);

    engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "US",
    });
    engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "EU",
      taxCategory: "vat",
    });

    const summary = engine.generateTaxSummary();
    assert.notEqual(summary.validation.decision, "fail");
    assert.ok(summary.summary);
    assert.ok(summary.summary!.recordCount >= 2);
    assert.ok(summary.summary!.byJurisdiction.US);
    assert.ok(summary.summary!.byJurisdiction.EU);
  });

  test("duplicate tax calculations are rejected", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { invoiceId } = await seedFinancialData(pg, re, ex, ig, rf);

    engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "US",
    });
    const duplicate = engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "US",
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendTxLog({
      event: "tax_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectTaxIntelligenceEngine();
    const logs = getTxLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, rc, ig, rf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, rc, ig, rf);
    engine.connectTaxIntelligenceEngine();
    const { invoiceId } = await seedFinancialData(pg, re, ex, ig, rf);
    engine.calculateTaxLiability({
      invoiceReference: invoiceId,
      taxableAmount: 100,
      taxJurisdiction: "US",
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.lastTaxStatus, "calculated");
  });
});
