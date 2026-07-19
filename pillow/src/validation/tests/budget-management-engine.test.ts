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
} from "../../financial-forecast-engine/index.js";
import {
  createBudgetManagementEngine,
  resetBudgetManagementEngineForTesting,
  buildBudgetManagementEngineConfiguration,
  BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH,
  BMG_CAPABILITIES,
  BUDGET_MANAGEMENT_ENGINE_ID,
} from "../../budget-management-engine/index.js";
import { appendBmgLog, getBmgLogs } from "../../budget-management-engine/bmg-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildBudgetManagementEngineConfiguration>[1],
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
  const fct = createFinancialForecastEngine(bootstrap, ff, re, ex, pc, cf, mc);
  await fct.initialize();
  const engine = createBudgetManagementEngine(bootstrap, ff, re, ex, pc, cf, fct, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct };
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
  fct: Awaited<ReturnType<typeof buildStack>>["fct"],
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
  fct.connectFinancialForecastEngine();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
  fct: Awaited<ReturnType<typeof buildStack>>["fct"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-9001",
    orderReference: "ord-12001",
    paymentAmount: 300,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-bmg-001" });
  re.recordMarketplaceRevenue({
    marketplaceReference: "amazon",
    grossRevenue: 1000,
    netRevenue: 900,
  });
  ex.recordSupplierPayment({ supplierReference: "supplier-001", expenseAmount: 400 });
  ex.recordShippingExpense({ expenseAmount: 80 });
  pc.calculateProfit();
  cf.monitorCashFlow();
  fct.generateFinancialProjection({ forecastPeriod: "30d" });
}

describe("R3-14 Budget Management Engine", () => {
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
    resetBudgetManagementEngineForTesting();
  });

  test("buildBudgetManagementEngineConfiguration loads defaults", () => {
    const config = buildBudgetManagementEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.defaultBudgetPeriod, "monthly");
    assert.ok(BMG_CAPABILITIES.includes("budget_creation"));
  });

  test("budget management engine initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BMG-001");
    assert.equal(state.missionId, "R3-14");
    assert.ok(BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH.includes("BUDGET_MANAGEMENT"));
  });

  test("connectBudgetManagementEngine registers with Financial Framework via R3-14", async () => {
    const { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    const report = engine.connectBudgetManagementEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === BUDGET_MANAGEMENT_ENGINE_ID));
  });

  test("connectBudgetManagementEngine produces machine-readable bmg-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    const report = engine.connectBudgetManagementEngine();
    assert.ok(report.budgetRunReportId.startsWith("bmg-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("bmg-"));
    assert.equal(report.engineRecord.engineId, BUDGET_MANAGEMENT_ENGINE_ID);
    assert.equal(report.engineRecord.metadataVersion, "BMG-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.cashFlowMonitorConnected, true);
  });

  test("createBudget creates budgets with machine-readable records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);

    const report = engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 1000,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_budget");
    const budget = report.budgetRecords[0]!;
    assert.ok(budget.budgetRecordId.startsWith("bmg-rec-"));
    assert.equal(budget.metadataVersion, "BMG-001-v1");
    assert.equal(budget.budgetPeriod, "monthly");
    assert.equal(budget.budgetCategory, "supplies");
    assert.equal(budget.budgetAllocation, 1000);
    assert.ok(budget.actualExpenditure >= 0);
    assert.equal(
      budget.remainingBudget,
      Math.round((budget.budgetAllocation - budget.actualExpenditure) * 100) / 100,
    );
  });

  test("allocateBudget manages budget allocations", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    const created = engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "operations",
      budgetAllocation: 500,
    });
    const budgetId = created.budgetRecords[0]!.budgetRecordId;

    const report = engine.allocateBudget({
      budgetRecordId: budgetId,
      additionalAllocation: 200,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "allocate_budget");
    assert.equal(report.budgetRecords[0]!.budgetAllocation, 700);
  });

  test("trackBudgetUtilization tracks budget utilization", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 1000,
    });

    const report = engine.trackBudgetUtilization();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "track_utilization");
    assert.ok(report.budgetRecords[0]!.budgetUtilizationPercentage >= 0);
  });

  test("compareActualVsBudget compares actual versus budget", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 1000,
    });

    const report = engine.compareActualVsBudget();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "compare_actual");
    assert.ok(report.validation.warnings.some((w) => w.includes("Actual")));
  });

  test("detectBudgetOverruns and detectBudgetVariances detect issues", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 100,
    });
    engine.trackBudgetUtilization();

    const overruns = engine.detectBudgetOverruns();
    assert.notEqual(overruns.validation.decision, "fail");
    assert.equal(overruns.action, "detect_overruns");

    const variances = engine.detectBudgetVariances();
    assert.notEqual(variances.validation.decision, "fail");
    assert.equal(variances.action, "detect_variances");
    assert.ok(variances.variances.length > 0 || overruns.overruns.length > 0);
  });

  test("generateBudgetRecommendations generates recommendations", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 100,
    });
    engine.trackBudgetUtilization();

    const report = engine.generateBudgetRecommendations();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "generate_recommendations");
    assert.ok(report.recommendations.length > 0);
  });

  test("duplicate budgets are rejected", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 1000,
    });
    const duplicate = engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 1000,
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendBmgLog({
      event: "budget_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectBudgetManagementEngine();
    const logs = getBmgLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct);
    engine.connectBudgetManagementEngine();
    await seedFinancialData(pg, re, ex, pc, cf, fct);
    engine.createBudget({
      budgetPeriod: "monthly",
      budgetCategory: "supplies",
      budgetAllocation: 1000,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.lastUtilizationPercentage !== null);
  });
});
