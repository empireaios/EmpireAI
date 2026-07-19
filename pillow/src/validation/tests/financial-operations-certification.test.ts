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
} from "../../executive-financial-dashboard/index.js";
import {
  createAccountingExportEngine,
  resetAccountingExportEngineForTesting,
} from "../../accounting-export-engine/index.js";
import {
  createFinancialOperationsCertificationEngine,
  resetFinancialOperationsCertificationForTesting,
  buildFinancialOperationsCertificationConfiguration,
  FINANCIAL_OPERATIONS_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_MISSIONS,
  FOC_METADATA_VERSION,
} from "../../financial-operations-certification/index.js";
import {
  appendCertificationLog,
  getCertificationLogs,
} from "../../financial-operations-certification/foc-logging.js";

async function buildFullFinancialStack(
  configOverrides?: Parameters<typeof buildFinancialOperationsCertificationConfiguration>[1],
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
  const efd = createExecutiveFinancialDashboard(
    bootstrap,
    ff,
    re,
    ex,
    pc,
    cf,
    fct,
    bmg,
    frm,
  );
  await efd.initialize();
  const aee = createAccountingExportEngine(bootstrap, ff, re, ex, pc, rc, ig, rf, tx);
  await aee.initialize();
  const certification = createFinancialOperationsCertificationEngine(
    bootstrap,
    {
      financialFramework: ff,
      paymentGateway: pg,
      bankingIntegration: bi,
      revenueEngine: re,
      expenseEngine: ex,
      profitCalculationEngine: pc,
      cashFlowMonitor: cf,
      reconciliationEngine: rc,
      invoiceGenerator: ig,
      refundEngine: rf,
      taxIntelligenceEngine: tx,
      multiCurrencyEngine: mc,
      financialForecastEngine: fct,
      budgetManagementEngine: bmg,
      financialRiskMonitor: frm,
      executiveFinancialDashboard: efd,
      accountingExportEngine: aee,
    },
    { configuration: configOverrides },
  );
  await certification.initialize();
  return { certification, ff, pg, bi, re, ex, pc, cf, rc, ig, rf, tx, mc, fct, bmg, frm, efd, aee };
}

describe("R3-18 Financial Operations Certification", () => {
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
    resetAccountingExportEngineForTesting();
    resetFinancialOperationsCertificationForTesting();
  });

  test("buildFinancialOperationsCertificationConfiguration loads defaults", () => {
    const config = buildFinancialOperationsCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.certificationScope, "full");
    assert.equal(config.passThresholdPercent, 85);
    assert.equal(config.includeSmokeTests, true);
    assert.equal(config.safeTestMode, true);
  });

  test("financial operations certification initializes with doctrine doc", async () => {
    const { certification } = await buildFullFinancialStack();
    const state = certification.getState();
    assert.equal(state.engineVersion, "PILLOW-FOC-001");
    assert.equal(state.missionId, "R3-18");
    assert.ok(FINANCIAL_OPERATIONS_CERTIFICATION_SYSTEM_PATH.includes("FINANCIAL_OPERATIONS"));
  });

  test("runFinancialOperationsCertification validates all R3-01 through R3-17 missions", async () => {
    const { certification } = await buildFullFinancialStack();
    const report = await certification.runFinancialOperationsCertification({
      includeSmokeTests: true,
    });
    assert.equal(report.missionResults.length, CERTIFIED_MISSIONS.length);
    assert.equal(report.certifiedMissionList.length, CERTIFIED_MISSIONS.length);
    assert.ok(
      ["certified", "partial"].includes(report.overallCertificationStatus),
      report.detectedFailures.join("; "),
    );
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
  });

  test("runFinancialOperationsCertification produces machine-readable foc-run-* certification reports", async () => {
    const { certification } = await buildFullFinancialStack();
    const report = await certification.runFinancialOperationsCertification();
    assert.ok(report.certificationId.startsWith("foc-run-"));
    assert.equal(report.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.equal(report.metadataVersion, FOC_METADATA_VERSION);
    assert.equal(report.certifiedPhase, "Financial Infrastructure");
  });

  test("financial framework and payment missions are certified", async () => {
    const { certification } = await buildFullFinancialStack();
    const report = await certification.runFinancialOperationsCertification({
      includeSmokeTests: true,
    });
    const coreMissions = report.missionResults.filter((r) =>
      ["R3-01", "R3-02", "R3-03"].includes(r.missionId),
    );
    assert.equal(coreMissions.length, 3);
    assert.ok(
      coreMissions.every((m) => m.status !== "fail"),
      report.detectedFailures.join("; "),
    );
    assert.ok(["certified", "partial"].includes(report.certifiedPaymentStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedBankingStatus));
  });

  test("revenue, expense, profit and cash flow certification statuses are reported", async () => {
    const { certification } = await buildFullFinancialStack();
    const report = await certification.runFinancialOperationsCertification({
      includeSmokeTests: true,
    });
    assert.ok(["certified", "partial"].includes(report.certifiedRevenueStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedExpenseStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedProfitabilityStatus));
    assert.ok(["certified", "partial"].includes(report.certifiedCashFlowStatus));
    const coreMissions = report.missionResults.filter((r) =>
      ["R3-04", "R3-05", "R3-06", "R3-07"].includes(r.missionId),
    );
    assert.equal(coreMissions.length, 4);
  });

  test("reporting and export missions are certified", async () => {
    const { certification } = await buildFullFinancialStack();
    const report = await certification.runFinancialOperationsCertification({
      includeSmokeTests: true,
    });
    const reportingMissions = report.missionResults.filter((r) =>
      ["R3-12", "R3-13", "R3-14", "R3-15", "R3-16", "R3-17"].includes(r.missionId),
    );
    assert.equal(reportingMissions.length, 6);
    assert.ok(
      reportingMissions.every((m) => m.status !== "fail"),
      report.detectedFailures.join("; "),
    );
    assert.ok(["pass", "partial"].includes(report.endToEndValidationResult));
  });

  test("validateLatestReport validates certification report integrity", async () => {
    const { certification } = await buildFullFinancialStack();
    await certification.runFinancialOperationsCertification({ includeSmokeTests: true });
    const validation = certification.validateLatestReport();
    assert.notEqual(validation.decision, "fail", validation.errors.join("; "));
  });

  test("governance safety redacts sensitive values in certification logs", async () => {
    const { certification } = await buildFullFinancialStack();
    appendCertificationLog({
      event: "certification_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 token=xyz",
    });
    await certification.runFinancialOperationsCertification();
    const logs = getCertificationLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { certification } = await buildFullFinancialStack();
    await certification.runFinancialOperationsCertification({ includeSmokeTests: true });
    const sync = certification.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = certification.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.ok(cockpit.missionsCertified > 0);
  });
});
