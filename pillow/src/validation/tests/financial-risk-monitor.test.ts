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
  buildFinancialRiskMonitorConfiguration,
  FINANCIAL_RISK_MONITOR_SYSTEM_PATH,
  FRM_CAPABILITIES,
  FINANCIAL_RISK_MONITOR_ID,
} from "../../financial-risk-monitor/index.js";
import { appendFrmLog, getFrmLogs } from "../../financial-risk-monitor/frm-logging.js";

async function buildStack(
  configOverrides?: Parameters<typeof buildFinancialRiskMonitorConfiguration>[1],
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
  const engine = createFinancialRiskMonitor(bootstrap, ff, re, ex, pc, cf, fct, bmg, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg };
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
}

async function seedFinancialData(
  pg: Awaited<ReturnType<typeof buildStack>>["pg"],
  re: Awaited<ReturnType<typeof buildStack>>["re"],
  ex: Awaited<ReturnType<typeof buildStack>>["ex"],
  pc: Awaited<ReturnType<typeof buildStack>>["pc"],
  cf: Awaited<ReturnType<typeof buildStack>>["cf"],
  fct: Awaited<ReturnType<typeof buildStack>>["fct"],
  bmg: Awaited<ReturnType<typeof buildStack>>["bmg"],
) {
  const created = pg.createPaymentRequest({
    customerReference: "cust-10001",
    orderReference: "ord-13001",
    paymentAmount: 300,
  });
  const paymentId = created.paymentRecords[0]!.paymentId;
  pg.processPaymentAuthorization({ paymentId });
  pg.processPaymentCapture({ paymentId });
  re.recordCompletedPayment({ paymentId, businessReference: "biz-frm-001" });
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
}

describe("R3-15 Financial Risk Monitor", () => {
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
  });

  test("buildFinancialRiskMonitorConfiguration loads defaults", () => {
    const config = buildFinancialRiskMonitorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.compositeRiskThreshold, 65);
    assert.ok(FRM_CAPABILITIES.includes("financial_health_monitoring"));
  });

  test("financial risk monitor initializes with doctrine doc", async () => {
    const { engine } = await buildStack();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FRM-001");
    assert.equal(state.missionId, "R3-15");
    assert.ok(FINANCIAL_RISK_MONITOR_SYSTEM_PATH.includes("FINANCIAL_RISK_MONITOR"));
  });

  test("connectFinancialRiskMonitor registers with Financial Framework via R3-15", async () => {
    const { engine, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    const report = engine.connectFinancialRiskMonitor();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = ff.getRegisteredModules();
    assert.ok(modules.some((m) => m.financialModuleIdentifier === FINANCIAL_RISK_MONITOR_ID));
  });

  test("connectFinancialRiskMonitor produces machine-readable frm-* engine records", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    const report = engine.connectFinancialRiskMonitor();
    assert.ok(report.riskRunReportId.startsWith("frm-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("frm-"));
    assert.equal(report.engineRecord.engineId, FINANCIAL_RISK_MONITOR_ID);
    assert.equal(report.engineRecord.metadataVersion, "FRM-001-v1");
    assert.equal(report.engineRecord.revenueEngineConnected, true);
    assert.equal(report.engineRecord.budgetManagementEngineConnected, true);
  });

  test("monitorFinancialHealth monitors financial health", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);

    const report = engine.monitorFinancialHealth({ riskCategory: "composite" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "monitor_health");
    const risk = report.riskRecords[0]!;
    assert.ok(risk.financialRiskId.startsWith("frm-rec-"));
    assert.equal(risk.metadataVersion, "FRM-001-v1");
    assert.ok(risk.riskScore >= 0 && risk.riskScore <= 100);
    assert.ok(["healthy", "warning", "critical", "unknown"].includes(risk.liquidityStatus));
  });

  test("calculateFinancialRiskScore calculates risk scores", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);

    const report = engine.calculateFinancialRiskScore({ riskCategory: "liquidity" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "calculate_risk_score");
    assert.ok(report.riskRecords[0]!.riskScore >= 0);
    assert.ok(report.riskRecords[0]!.revenueRisk >= 0);
    assert.ok(report.riskRecords[0]!.expenseRisk >= 0);
  });

  test("detectFinancialAnomalies detects financial anomalies", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);
    const scored = engine.calculateFinancialRiskScore();

    const report = engine.detectFinancialAnomalies({
      riskRecordId: scored.riskRecords[0]?.financialRiskId,
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "detect_anomalies");
    assert.ok(report.anomalies.length > 0);
  });

  test("detectThresholdBreaches detects threshold breaches", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);
    engine.calculateFinancialRiskScore();

    const report = engine.detectThresholdBreaches();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "detect_threshold_breaches");
    assert.ok(report.alerts.length > 0);
    assert.ok(report.alerts.some((a) => a.thresholdBreached));
  });

  test("generateFinancialRiskAlerts generates alerts", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);
    engine.calculateFinancialRiskScore();

    const report = engine.generateFinancialRiskAlerts();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "generate_alerts");
    assert.ok(report.alerts.length > 0);
  });

  test("duplicate health monitoring is rejected", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);
    engine.monitorFinancialHealth({ riskCategory: "composite" });
    const duplicate = engine.monitorFinancialHealth({ riskCategory: "composite" });
    assert.equal(duplicate.validation.decision, "fail");
    assert.ok(duplicate.validation.errors.some((e) => e.includes("Duplicate")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildStack();
    appendFrmLog({
      event: "risk_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 card=4111",
    });
    await engine.connectFinancialRiskMonitor();
    const logs = getFrmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg } = await buildStack();
    await connectDependencies(pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg);
    engine.connectFinancialRiskMonitor();
    await seedFinancialData(pg, re, ex, pc, cf, fct, bmg);
    engine.calculateFinancialRiskScore();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.lastRiskScore !== null);
  });
});
