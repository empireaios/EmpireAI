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
  buildInvoiceGeneratorConfiguration,
  INVOICE_GENERATOR_SYSTEM_PATH,
  IG_CAPABILITIES,
  INVOICE_GENERATOR_ID,
} from "../../invoice-generator/index.js";
import { appendIgLog, getIgLogs } from "../../invoice-generator/ig-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildInvoiceGeneratorConfiguration>[1],
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
  const engine = createInvoiceGeneratorEngine(bootstrap, ff, re, ex, rc, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, rc };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  rc: Awaited<ReturnType<typeof buildStack>>["rc"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
  rc.connectReconciliationEngine();
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
}

describe("R3-09 Invoice Generator", () => {
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
  });

  test("buildInvoiceGeneratorConfiguration loads defaults", () => {
    const config = buildInvoiceGeneratorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(IG_CAPABILITIES.includes("customer_invoice_creation"));
  });

  test("invoice generator initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-IG-001");
    assert.equal(state.missionId, "R3-09");
    assert.ok(INVOICE_GENERATOR_SYSTEM_PATH.includes("INVOICE_GENERATOR"));
  });

  test("connectInvoiceGenerator registers with Financial Framework via R3-09", async () => {
    const { engine, ff, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    const report = engine.connectInvoiceGenerator();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === INVOICE_GENERATOR_ID));
  });

  test("connectInvoiceGenerator produces machine-readable inv-* generator records", async () => {
    const { engine, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    const report = engine.connectInvoiceGenerator();
    assert.ok(report.invoiceRunReportId.startsWith("inv-run-"));
    assert.ok(report.generatorRecord.generatorRecordId.startsWith("inv-"));
    assert.equal(report.generatorRecord.generatorId, INVOICE_GENERATOR_ID);
    assert.equal(report.generatorRecord.metadataVersion, "IG-001-v1");
    assert.equal(report.generatorRecord.revenueEngineConnected, true);
    assert.equal(report.generatorRecord.expenseEngineConnected, true);
  });

  test("createCustomerInvoice generates invoice with totals and tax", async () => {
    const { engine, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    engine.connectInvoiceGenerator();
    await seedFinancialData(pg, re, ex);
    const revenueId = re.getRevenueRecords()[0]!.revenueRecordId;

    const report = engine.createCustomerInvoice({ revenueReference: revenueId });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_customer_invoice");
    const invoice = report.invoiceRecords[0]!;
    assert.ok(invoice.invoiceId.startsWith("inv-rec-"));
    assert.ok(invoice.invoiceNumber.startsWith("INV-"));
    assert.equal(invoice.metadataVersion, "IG-001-v1");
    assert.ok(invoice.invoiceAmount > 0);
    assert.ok(invoice.taxAmount > 0);
    assert.ok(invoice.lineItems.length > 0);
    assert.equal(invoice.revenueReference, revenueId);
  });

  test("createSupplierInvoice generates supplier invoice from expense", async () => {
    const { engine, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    engine.connectInvoiceGenerator();
    await seedFinancialData(pg, re, ex);
    const expenseId = ex.getExpenseRecords().find((e) => e.supplierReference === "supplier-001")!
      .expenseRecordId;

    const report = engine.createSupplierInvoice({ expenseReference: expenseId });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "create_supplier_invoice");
    const invoice = report.invoiceRecords[0]!;
    assert.equal(invoice.supplierReference, "supplier-001");
    assert.equal(invoice.expenseReference, expenseId);
    assert.ok(invoice.invoiceAmount > 150);
  });

  test("updateInvoiceStatus manages invoice lifecycle", async () => {
    const { engine, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    engine.connectInvoiceGenerator();
    await seedFinancialData(pg, re, ex);
    const revenueId = re.getRevenueRecords()[0]!.revenueRecordId;
    const created = engine.createCustomerInvoice({ revenueReference: revenueId });
    const invoiceId = created.invoiceRecords[0]!.invoiceId;

    const report = engine.updateInvoiceStatus({ invoiceId, invoiceStatus: "sent" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "update_invoice_status");
    assert.equal(report.invoiceRecords[0]?.invoiceStatus, "sent");
  });

  test("duplicate invoice generation requests are rejected", async () => {
    const { engine, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    engine.connectInvoiceGenerator();
    await seedFinancialData(pg, re, ex);
    const revenueId = re.getRevenueRecords()[0]!.revenueRecordId;
    engine.createCustomerInvoice({ revenueReference: revenueId });
    const duplicate = engine.createCustomerInvoice({ revenueReference: revenueId });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendIgLog({
      event: "invoice_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectInvoiceGenerator();
    const logs = getIgLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, rc } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc);
    engine.connectInvoiceGenerator();
    await seedFinancialData(pg, re, ex);
    const revenueId = re.getRevenueRecords()[0]!.revenueRecordId;
    engine.createCustomerInvoice({ revenueReference: revenueId });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
