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
  buildReconciliationEngineConfiguration,
  RECONCILIATION_ENGINE_SYSTEM_PATH,
  RC_CAPABILITIES,
  RECONCILIATION_ENGINE_ID,
} from "../../reconciliation-engine/index.js";
import { appendRcLog, getRcLogs } from "../../reconciliation-engine/rc-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildReconciliationEngineConfiguration>[1],
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
  const engine = createReconciliationEngine(bootstrap, ff, pg, bi, re, ex, cf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, cf };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  bi.syncTransactionHistory({ includeFixtureTransactions: true });
  re.connectRevenueEngine();
  ex.connectExpenseEngine();
  cf.connectCashFlowMonitor();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
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
  cf.monitorCashFlow();
}

describe("R3-08 Reconciliation Engine", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
    resetProfitCalculationEngineForTesting();
    resetCashFlowMonitorForTesting();
    resetReconciliationEngineForTesting();
  });

  test("buildReconciliationEngineConfiguration loads defaults", () => {
    const config = buildReconciliationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(RC_CAPABILITIES.includes("payment_reconciliation"));
  });

  test("reconciliation engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RC-001");
    assert.equal(state.missionId, "R3-08");
    assert.ok(RECONCILIATION_ENGINE_SYSTEM_PATH.includes("RECONCILIATION"));
  });

  test("connectReconciliationEngine registers with Financial Framework via R3-08", async () => {
    const { engine, ff, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    const report = engine.connectReconciliationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === RECONCILIATION_ENGINE_ID));
  });

  test("connectReconciliationEngine produces machine-readable rc-* engine records", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    const report = engine.connectReconciliationEngine();
    assert.ok(report.reconciliationRunReportId.startsWith("rc-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("rc-"));
    assert.equal(report.engineRecord.engineId, RECONCILIATION_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "RC-001-v1");
    assert.equal(report.engineRecord.paymentGatewayConnected, true);
    assert.equal(report.engineRecord.revenueEngineConnected, true);
  });

  test("reconcilePayments matches payment gateway transactions to revenue", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);

    const report = engine.reconcilePayments();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "reconcile_payments");
    const record = report.reconciliationRecords[0]!;
    assert.ok(record.reconciliationRecordId.startsWith("rc-rec-"));
    assert.equal(record.metadataVersion, "RC-001-v1");
    assert.ok(record.matchedTransactionCount >= 1);
    assert.ok(record.paymentReference);
  });

  test("reconcileBanking reconciles banking transactions", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);

    const report = engine.reconcileBanking();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "reconcile_banking");
    assert.ok(report.reconciliationRecords[0]);
  });

  test("reconcileRevenue reconciles revenue records against payments", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);

    const report = engine.reconcileRevenue();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "reconcile_revenue");
    assert.ok(report.reconciliationRecords[0]!.revenueReference);
  });

  test("reconcileExpenses detects unmatched expense records", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);

    const report = engine.reconcileExpenses();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "reconcile_expenses");
    assert.ok(report.reconciliationRecords[0]!.unmatchedTransactionCount > 0);
  });

  test("reconcileCashFlow reconciles cash flow records", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);

    const report = engine.reconcileCashFlow();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "reconcile_cash_flow");
    assert.ok(report.reconciliationRecords[0]?.cashFlowReference);
  });

  test("reconcileAll produces reconciliation report across sources", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);

    const report = engine.reconcileAll();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "reconcile_all");
    assert.ok(report.report);
    assert.ok(report.reconciliationRecords.length >= 1);
  });

  test("duplicate reconciliation events are rejected", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);
    engine.reconcilePayments();
    const duplicate = engine.reconcilePayments();
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendRcLog({
      event: "reconciliation_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectReconciliationEngine();
    const logs = getRcLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, cf } = await buildStack();
    await connectDependencies(pg, bi, re, ex, cf);
    engine.connectReconciliationEngine();
    await seedFinancialData(pg, re, ex, cf);
    engine.reconcilePayments();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
