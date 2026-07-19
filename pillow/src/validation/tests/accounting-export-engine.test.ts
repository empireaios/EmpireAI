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
  createAccountingExportEngine,
  resetAccountingExportEngineForTesting,
  buildAccountingExportEngineConfiguration,
  ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH,
  AEE_CAPABILITIES,
  ACCOUNTING_EXPORT_ENGINE_ID,
  EXPORT_FORMATS,
} from "../../accounting-export-engine/index.js";
import { appendAeeLog, getAeeLogs } from "../../accounting-export-engine/aee-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildAccountingExportEngineConfiguration>[1],
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
  const engine = createAccountingExportEngine(
    bootstrap,
    ff,
    re,
    ex,
    pc,
    rc,
    ig,
    rf,
    tx,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx };
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
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  rc: Awaited<ReturnType<typeof buildStack>>["rc"],
  ig: Awaited<ReturnType<typeof buildStack>>["ig"],
  rf: Awaited<ReturnType<typeof buildStack>>["rf"],
  tx: Awaited<ReturnType<typeof buildStack>>["tx"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-17001",
    orderReference: "ord-17001",
    paymentAmount: 300,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-aee-001" });
  re.recordMarketplaceRevenue({
    marketplaceReference: "amazon",
    grossRevenue: 1000,
    netRevenue: 900,
  });
  ex.recordSupplierPayment({ supplierReference: "supplier-001", expenseAmount: 400 });
  ex.recordShippingExpense({ expenseAmount: 80 });
  pc.calculateProfit();
  rc.reconcileAll();
  const revenueId = re.getRevenueRecords()[0]!.revenueRecordId;
  ig.createCustomerInvoice({ revenueReference: revenueId });
  rf.processPartialRefund({
    paymentReference: paymentId,
    refundAmount: 25,
    refundReason: "Seed partial refund",
  });
  tx.classifyTaxableTransaction({ revenueReference: revenueId });
  tx.generateTaxSummary();
}

describe("R3-17 Accounting Export Engine", () => {
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
    resetAccountingExportEngineForTesting();
  });

  test("buildAccountingExportEngineConfiguration loads defaults", () => {
    const config = buildAccountingExportEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.defaultExportFormat, "csv");
    assert.ok(AEE_CAPABILITIES.includes("revenue_export"));
    assert.ok(AEE_CAPABILITIES.includes("multi_format_export"));
  });

  test("accounting export engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AEE-001");
    assert.equal(state.missionId, "R3-17");
    assert.ok(ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH.includes("ACCOUNTING_EXPORT"));
  });

  test("connectAccountingExportEngine registers with Financial Framework via R3-17", async () => {
    const { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    const report = engine.connectAccountingExportEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === ACCOUNTING_EXPORT_ENGINE_ID));
  });

  test("connectAccountingExportEngine produces machine-readable aee-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    const report = engine.connectAccountingExportEngine();
    assert.ok(report.exportRunReportId.startsWith("aee-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("aee-"));
    assert.equal(report.engineRecord.engineId, ACCOUNTING_EXPORT_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "AEE-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.taxIntelligenceEngineConnected, true);
  });

  test("exportFinancialRecords exports revenue, expense, invoice, refund, tax and reconciliation records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();
    await seedFinancialData(pg, re, ex, pc, rc, ig, rf, tx);

    const report = engine.exportFinancialRecords({ forceExport: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "export_records");
    const exportRecord = report.exportRecords[0]!;
    assert.ok(exportRecord.exportRecordId.startsWith("aee-rec-"));
    assert.equal(exportRecord.metadataVersion, "AEE-001-v1");
    assert.ok(exportRecord.revenueReferences.length > 0);
    assert.ok(exportRecord.expenseReferences.length > 0);
    assert.ok(exportRecord.invoiceReferences.length > 0);
    assert.ok(exportRecord.refundReferences.length > 0);
    assert.ok(exportRecord.taxReferences.length > 0);
    assert.ok(exportRecord.reconciliationReferences.length > 0);
    assert.equal(exportRecord.exportStatus, "completed");
  });

  test("exportFinancialRecords supports multiple accounting formats", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();
    await seedFinancialData(pg, re, ex, pc, rc, ig, rf, tx);

    for (const format of EXPORT_FORMATS) {
      const report = engine.exportFinancialRecords({
        exportFormat: format,
        forceExport: true,
      });
      assert.notEqual(report.validation.decision, "fail", `${format}: ${report.validation.errors.join("; ")}`);
      assert.equal(report.exportRecords[0]!.exportFormat, format);
    }
  });

  test("validateExport validates exported records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();
    await seedFinancialData(pg, re, ex, pc, rc, ig, rf, tx);
    const exported = engine.exportFinancialRecords({ forceExport: true });

    const report = engine.validateExport({
      exportRecordId: exported.exportRecords[0]!.exportRecordId,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "validate_export");
    assert.equal(report.exportRecords[0]!.validationStatus, "passed");
  });

  test("packageExport packages export for external accounting systems", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();
    await seedFinancialData(pg, re, ex, pc, rc, ig, rf, tx);
    const exported = engine.exportFinancialRecords({ exportFormat: "json", forceExport: true });

    const report = engine.packageExport({
      exportRecordId: exported.exportRecords[0]!.exportRecordId,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "package_export");
    assert.ok(report.packages.length > 0);
    assert.ok(report.packages[0]!.packageId.startsWith("aee-pkg-"));
    assert.ok(report.packages[0]!.content.includes("exportId"));
  });

  test("detectExportFailures detects export failures", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();

    const emptyExport = engine.exportFinancialRecords({ forceExport: true });
    assert.equal(emptyExport.validation.decision, "fail");

    const report = engine.detectExportFailures();
    assert.equal(report.action, "detect_failures");
    assert.ok(report.failures.length > 0);
  });

  test("duplicate export is rejected within frequency window", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();
    await seedFinancialData(pg, re, ex, pc, rc, ig, rf, tx);
    engine.exportFinancialRecords();
    const duplicate = engine.exportFinancialRecords();
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendAeeLog({
      event: "export_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectAccountingExportEngine();
    const logs = getAeeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx);
    engine.connectAccountingExportEngine();
    await seedFinancialData(pg, re, ex, pc, rc, ig, rf, tx);
    engine.exportFinancialRecords({ forceExport: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalExportRecords > 0);
  });
});
