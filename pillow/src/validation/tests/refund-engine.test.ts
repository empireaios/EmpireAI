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
  buildRefundEngineConfiguration,
  REFUND_ENGINE_SYSTEM_PATH,
  RF_CAPABILITIES,
  REFUND_ENGINE_ID,
} from "../../refund-engine/index.js";
import { appendRfLog, getRfLogs } from "../../refund-engine/rf-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildRefundEngineConfiguration>[1],
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
  const engine = createRefundEngine(bootstrap, ff, pg, bi, re, ex, ig, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, rc, ig };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  rc: Awaited<ReturnType<typeof buildStack>>["rc"],
  ig: Awaited<ReturnType<typeof buildStack>>["ig"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
  rc.connectReconciliationEngine();
  ig.connectInvoiceGenerator();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  ig: Awaited<ReturnType<typeof buildStack>>["ig"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-5001",
    orderReference: "ord-8001",
    paymentAmount: 200,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-rf-001" });
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
  return {
    paymentId,
    invoiceId: invoice.invoiceRecords[0]?.invoiceId ?? null,
  };
}

describe("R3-10 Refund Engine", () => {
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
  });

  test("buildRefundEngineConfiguration loads defaults", () => {
    const config = buildRefundEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(RF_CAPABILITIES.includes("full_refund_processing"));
  });

  test("refund engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RF-001");
    assert.equal(state.missionId, "R3-10");
    assert.ok(REFUND_ENGINE_SYSTEM_PATH.includes("REFUND_ENGINE"));
  });

  test("connectRefundEngine registers with Financial Framework via R3-10", async () => {
    const { engine, ff, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    const report = engine.connectRefundEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === REFUND_ENGINE_ID));
  });

  test("connectRefundEngine produces machine-readable rf-* engine records", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    const report = engine.connectRefundEngine();
    assert.ok(report.refundRunReportId.startsWith("rf-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("rf-"));
    assert.equal(report.engineRecord.engineId, REFUND_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "RF-001-v1");
    assert.equal(report.engineRecord.paymentGatewayConnected, true);
    assert.equal(report.engineRecord.revenueEngineConnected, true);
  });

  test("createRefundRequest creates validated refund request", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const { paymentId } = await seedFinancialData(pg, re, ex, ig);

    const report = engine.createRefundRequest({
      paymentReference: paymentId,
      refundAmount: 50,
      refundReason: "Customer return",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_refund_request");
    const refund = report.refundRecords[0]!;
    assert.ok(refund.refundId.startsWith("rf-rec-"));
    assert.equal(refund.metadataVersion, "RF-001-v1");
    assert.equal(refund.refundStatus, "pending");
    assert.equal(refund.paymentReference, paymentId);
  });

  test("validateRefundEligibility rejects uncaptured payments", async () => {
    const { engine, ff, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const created = pg.createPaymentRequest({
      customerReference: "cust-5002",
      orderReference: "ord-8002",
      paymentAmount: 100,
    });
    const paymentId = created.paymentRecords[0]!.paymentId;

    const report = engine.validateRefundEligibility({
      paymentReference: paymentId,
      refundAmount: 50,
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("not eligible")));
  });

  test("processFullRefund completes refund and updates financial records", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const { paymentId, invoiceId } = await seedFinancialData(pg, re, ex, ig);
    const revenueBefore = re.getRevenueRecords().length;

    const report = engine.processFullRefund({
      paymentReference: paymentId,
      invoiceReference: invoiceId ?? undefined,
      refundReason: "Order cancelled",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "process_full_refund");
    const refund = report.refundRecords[0]!;
    assert.equal(refund.refundStatus, "completed");
    assert.equal(refund.refundAmount, 200);
    assert.ok(re.getRevenueRecords().length > revenueBefore);
    if (invoiceId) {
      const invoice = ig.getInvoiceRecords().find((i) => i.invoiceId === invoiceId);
      assert.equal(invoice?.invoiceStatus, "cancelled");
    }
  });

  test("processPartialRefund processes partial amount", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const { paymentId } = await seedFinancialData(pg, re, ex, ig);

    const report = engine.processPartialRefund({
      paymentReference: paymentId,
      refundAmount: 75,
      refundReason: "Partial return",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "process_partial_refund");
    assert.equal(report.refundRecords[0]?.refundAmount, 75);
    assert.equal(report.refundRecords[0]?.refundStatus, "completed");
  });

  test("duplicate refund requests are rejected", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const { paymentId } = await seedFinancialData(pg, re, ex, ig);

    engine.createRefundRequest({
      paymentReference: paymentId,
      refundAmount: 50,
      refundReason: "Duplicate test",
    });
    const duplicate = engine.createRefundRequest({
      paymentReference: paymentId,
      refundAmount: 50,
      refundReason: "Duplicate test",
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("refund exceeding balance is rejected", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const { paymentId } = await seedFinancialData(pg, re, ex, ig);

    const report = engine.processPartialRefund({
      paymentReference: paymentId,
      refundAmount: 500,
      refundReason: "Over refund",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("exceeds")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendRfLog({
      event: "refund_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectRefundEngine();
    const logs = getRfLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, rc, ig } = await buildStack();
    await connectDependencies(pg, bi, re, ex, rc, ig);
    engine.connectRefundEngine();
    const { paymentId } = await seedFinancialData(pg, re, ex, ig);
    engine.processPartialRefund({
      paymentReference: paymentId,
      refundAmount: 25,
      refundReason: "Health check",
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.lastRefundStatus, "completed");
  });
});
