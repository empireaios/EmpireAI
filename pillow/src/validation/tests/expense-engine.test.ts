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
  buildExpenseEngineConfiguration,
  EXPENSE_ENGINE_SYSTEM_PATH,
  EX_CAPABILITIES,
  EXPENSE_ENGINE_ID,
} from "../../expense-engine/index.js";
import { appendExLog, getExLogs } from "../../expense-engine/ex-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildExpenseEngineConfiguration>[1],
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
  const engine = createExpenseEngine(bootstrap, ff, pg, bi, re, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re };
}

async function connectDependencies(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  bi: Awaited<ReturnType<typeof buildStack>>["bi"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
) {
  pg.connectPaymentGateway();
  bi.connectBankingIntegration();
  bi.syncBankAccounts({ includeFixtureAccounts: true });
  re.connectRevenueEngine();
}

describe("R3-05 Expense Engine", () => {
  beforeEach(() => {
    resetFinancialFrameworkForTesting();
    resetPaymentGatewayIntegrationForTesting();
    resetBankingIntegrationForTesting();
    resetRevenueEngineForTesting();
    resetExpenseEngineForTesting();
  });

  test("buildExpenseEngineConfiguration loads defaults", () => {
    const config = buildExpenseEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.defaultCurrency, "USD");
    assert.ok(EX_CAPABILITIES.includes("expense_category_tracking"));
  });

  test("expense engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EX-001");
    assert.equal(state.missionId, "R3-05");
    assert.ok(EXPENSE_ENGINE_SYSTEM_PATH.includes("EXPENSE_ENGINE"));
  });

  test("connectExpenseEngine registers with Financial Framework via R3-05", async () => {
    const { engine, ff, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    const report = engine.connectExpenseEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === EXPENSE_ENGINE_ID));
  });

  test("connectExpenseEngine produces machine-readable ex-* engine records", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    const report = engine.connectExpenseEngine();
    assert.ok(report.expenseRunReportId.startsWith("ex-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("ex-"));
    assert.equal(report.engineRecord.engineId, EXPENSE_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "EX-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
  });

  test("recordSupplierPayment produces machine-readable expense records", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();

    const report = engine.recordSupplierPayment({
      supplierReference: "supplier-001",
      bankingReference: "acct-operating-001",
      expenseAmount: 1500,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "record_supplier_payment");
    const expense = report.expenseRecords[0]!;
    assert.ok(expense.expenseRecordId.startsWith("ex-rec-"));
    assert.equal(expense.expenseCategory, "supplier_payment");
    assert.equal(expense.supplierReference, "supplier-001");
    assert.equal(expense.metadataVersion, "EX-001-v1");
  });

  test("recordShippingExpense and recordAdvertisingExpense work", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();

    const shipping = engine.recordShippingExpense({ expenseAmount: 45.5 });
    assert.notEqual(shipping.validation.decision, "fail");
    assert.equal(shipping.expenseRecords[0]?.expenseCategory, "shipping");

    const advertising = engine.recordAdvertisingExpense({ expenseAmount: 200 });
    assert.notEqual(advertising.validation.decision, "fail");
    assert.equal(advertising.expenseRecords[0]?.expenseCategory, "advertising");
  });

  test("recordPlatformFee and recordOperationalExpense work", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();

    const fee = engine.recordPlatformFee({ expenseAmount: 29.99 });
    assert.notEqual(fee.validation.decision, "fail");
    assert.equal(fee.expenseRecords[0]?.expenseCategory, "platform_fee");

    const operational = engine.recordOperationalExpense({
      expenseAmount: 500,
      bankingReference: "acct-operating-001",
    });
    assert.notEqual(operational.validation.decision, "fail");
    assert.equal(operational.expenseRecords[0]?.expenseCategory, "operational");
  });

  test("recurring expenses are tracked via recurring category", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();

    const report = engine.recordOperationalExpense({
      expenseAmount: 99,
      recurring: true,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.expenseRecords[0]?.expenseCategory, "recurring");
    const state = engine.getState();
    assert.equal(state.health.recurringExpenses, 99);
  });

  test("aggregateExpenses calculates totals by category", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();

    engine.recordShippingExpense({ expenseAmount: 50 });
    engine.recordAdvertisingExpense({ expenseAmount: 100 });
    engine.recordPlatformFee({ expenseAmount: 25 });

    const report = engine.aggregateExpenses();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "aggregate");
    assert.ok(report.aggregation);
    assert.equal(report.aggregation!.totalExpenses, 175);
    assert.equal(report.aggregation!.byCategory.shipping?.totalAmount, 50);
    assert.equal(report.aggregation!.byCategory.advertising?.count, 1);
  });

  test("duplicate expense events are rejected", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();

    engine.recordShippingExpense({ expenseAmount: 10 });
    const duplicate = engine.recordShippingExpense({ expenseAmount: 10 });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendExLog({
      event: "expense_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectExpenseEngine();
    const logs = getExLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re } = await buildStack();
    await connectDependencies(pg, bi, re);
    engine.connectExpenseEngine();
    engine.recordOperationalExpense({ expenseAmount: 75 });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalExpenses >= 75);
  });
});
