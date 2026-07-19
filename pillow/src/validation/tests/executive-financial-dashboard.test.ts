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
} from "../../budget-management-engine/index.js";
import {
  createFinancialRiskMonitor,
  resetFinancialRiskMonitorForTesting,
} from "../../financial-risk-monitor/index.js";
import {
  createExecutiveFinancialDashboard,
  resetExecutiveFinancialDashboardForTesting,
  buildExecutiveFinancialDashboardConfiguration,
  EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH,
  EFD_CAPABILITIES,
  EXECUTIVE_FINANCIAL_DASHBOARD_ID,
} from "../../executive-financial-dashboard/index.js";
import { appendEfdLog, getEfdLogs } from "../../executive-financial-dashboard/efd-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildExecutiveFinancialDashboardConfiguration>[1],
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
  const bmg = createBudgetManagementEngine(bootstrap, ff, re, ex, pc, cf, fct);
  await bmg.initialize();
  const frm = createFinancialRiskMonitor(bootstrap, ff, re, ex, pc, cf, fct, bmg);
  await frm.initialize();
  const engine = createExecutiveFinancialDashboard(
    bootstrap,
    ff,
    re,
    ex,
    pc,
    cf,
    fct,
    bmg,
    frm,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm };
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
  bmg: Awaited<ReturnType<typeof buildStack>>["bmg"],
  frm: Awaited<ReturnType<typeof buildStack>>["frm"],
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
  bmg.connectBudgetManagementEngine();
  frm.connectFinancialRiskMonitor();
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
  fct: Awaited<ReturnType<typeof buildStack>>["fct"],
  bmg: Awaited<ReturnType<typeof buildStack>>["bmg"],
  frm: Awaited<ReturnType<typeof buildStack>>["frm"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-10001",
    orderReference: "ord-16001",
    paymentAmount: 300,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-efd-001" });
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
  bmg.createBudget({
    budgetPeriod: "monthly",
    budgetCategory: "supplies",
    budgetAllocation: 100,
  });
  bmg.trackBudgetUtilization();
  frm.calculateFinancialRiskScore();
}

describe("R3-16 Executive Financial Dashboard", () => {
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
    resetFinancialRiskMonitorForTesting();
    resetExecutiveFinancialDashboardForTesting();
  });

  test("buildExecutiveFinancialDashboardConfiguration loads defaults", () => {
    const config = buildExecutiveFinancialDashboardConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.dashboardRefreshFrequencyMs, 60000);
    assert.ok(EFD_CAPABILITIES.includes("revenue_display"));
    assert.ok(EFD_CAPABILITIES.includes("kpi_aggregation"));
  });

  test("executive financial dashboard initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-EFD-001");
    assert.equal(state.missionId, "R3-16");
    assert.ok(EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH.includes("EXECUTIVE_FINANCIAL_DASHBOARD"));
  });

  test("connectExecutiveFinancialDashboard registers with Financial Framework via R3-16", async () => {
    const { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    const report = engine.connectExecutiveFinancialDashboard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === EXECUTIVE_FINANCIAL_DASHBOARD_ID));
  });

  test("connectExecutiveFinancialDashboard produces machine-readable efd-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    const report = engine.connectExecutiveFinancialDashboard();
    assert.ok(report.dashboardRunReportId.startsWith("efd-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("efd-"));
    assert.equal(report.engineRecord.engineId, EXECUTIVE_FINANCIAL_DASHBOARD_ID);
    assert.equal(report.engineRecord.metadataVersion, "EFD-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.financialRiskMonitorConnected, true);
  });

  test("refreshExecutiveDashboard displays revenue, expenses, profit, cash flow, budgets, forecasts, and risks", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    engine.connectExecutiveFinancialDashboard();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg, frm);

    const report = engine.refreshExecutiveDashboard({ forceRefresh: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "refresh_dashboard");
    const snapshot = report.snapshots[0]!;
    assert.ok(snapshot.dashboardId.startsWith("efd-rec-"));
    assert.equal(snapshot.metadataVersion, "EFD-001-v1");
    assert.ok(snapshot.revenueSummary.total > 0);
    assert.ok(snapshot.expenseSummary.total > 0);
    assert.ok(snapshot.profitSummary.netProfit !== 0);
    assert.ok(snapshot.cashFlowSummary.liquidity >= 0);
    assert.ok(snapshot.budgetSummary.count > 0);
    assert.ok(snapshot.forecastSummary.revenueForecast >= 0);
    assert.ok(snapshot.financialRiskSummary.riskScore >= 0);
    assert.ok(snapshot.kpiSummary.kpis.length > 0);
    assert.ok(snapshot.trendSummary.trends.length > 0);
    assert.ok(report.widgets.length > 0);
  });

  test("generateExecutiveSummary produces executive summary", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    engine.connectExecutiveFinancialDashboard();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg, frm);

    const report = engine.generateExecutiveSummary();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "generate_summary");
    assert.ok(report.snapshots.length > 0);
  });

  test("aggregateFinancialKpis aggregates executive KPIs", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    engine.connectExecutiveFinancialDashboard();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg, frm);

    const report = engine.aggregateFinancialKpis();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "aggregate_kpis");
    assert.ok(report.snapshots[0]!.kpiSummary.kpis.length >= 3);
    assert.ok(report.widgets.some((w) => w.widgetType === "kpi"));
  });

  test("getDashboardWidgets serves dashboard widgets", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    engine.connectExecutiveFinancialDashboard();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg, frm);
    engine.refreshExecutiveDashboard({ forceRefresh: true });

    const report = engine.getDashboardWidgets({
      widgetTypes: ["revenue", "expense", "profit", "cash_flow", "risk"],
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "get_widgets");
    assert.equal(report.widgets.length, 5);
    assert.ok(report.widgets.every((w) => w.status === "ready" || w.status === "degraded"));
  });

  test("duplicate dashboard refresh is rejected", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    engine.connectExecutiveFinancialDashboard();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg, frm);
    engine.refreshExecutiveDashboard();
    const duplicate = engine.refreshExecutiveDashboard();
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendEfdLog({
      event: "dashboard_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectExecutiveFinancialDashboard();
    const logs = getEfdLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm } =
      await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm);
    engine.connectExecutiveFinancialDashboard();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg, frm);
    engine.refreshExecutiveDashboard({ forceRefresh: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalSnapshots > 0);
    assert.ok(cockpit.lastRefreshAt !== null);
  });
});
