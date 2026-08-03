import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildBudgetPlanningWorkerConfiguration,
  createBudgetPlanningWorker,
  resetBudgetPlanningWorkerForTesting,
  type BpwInput,
} from "../../budget-planning-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createBudgetPlanningWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBudgetPlanningWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "bpw-biz-growth-01";

describe("Q9-04 Budget Planning Worker", () => {
  beforeEach(resetBudgetPlanningWorkerForTesting);

  test("1 locks mandatory budget-planning-worker boundaries", () => {
    const c = buildBudgetPlanningWorkerConfiguration(REPO_ROOT, {
      neverFabricateBudgetValuesOrSpendingData: false as never,
      neverApproveExpenditure: false as never,
      neverExecutePayments: false as never,
      neverForecastRevenue: false as never,
      neverReplaceProfitabilityWorker: false as never,
      neverModifyAccountingRecords: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ905OrLater: false as never,
      preserveHistoricalBudgetRevisions: false as never,
    });
    assert.equal(c.neverFabricateBudgetValuesOrSpendingData, true);
    assert.equal(c.neverApproveExpenditure, true);
    assert.equal(c.neverExecutePayments, true);
    assert.equal(c.neverForecastRevenue, true);
    assert.equal(c.neverReplaceProfitabilityWorker, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ905OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveHistoricalBudgetRevisions, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-BPW-001 for Q9-04 with budget category/period catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-04");
    assert.equal(state.engineVersion, "PILLOW-BPW-001");
    for (const category of ["project", "business", "advertising", "infrastructure"]) {
      assert.ok(state.configuration.budgetCategories.includes(category));
    }
    for (const period of ["annual", "quarterly", "monthly", "custom"]) {
      assert.ok(state.configuration.budgetPeriods.includes(period));
    }
    assert.equal(state.configuration.workerId, "wkr-budget-planning-01");
  });

  test("3 creates a project budget with explicit planned amount", async () => {
    const engine = await build();
    const result = engine.createProjectBudget({
      capitalBusinessId: BIZ,
      capitalProjectId: "capfc-prj-0001",
      budgetOwner: "exec-capital-01",
      plannedAmount: 10000,
      budgetPeriod: "2026-08",
      approvalStatus: "approved",
      validated: true,
    });
    assert.equal(result.action, "create_project_budget");
    assert.equal(result.validation.decision, "pass");
    const budget = result.budget!;
    assert.equal(budget.budgetCategory, "project");
    assert.equal(budget.plannedAmount.minorUnits, 1000000);
    assert.equal(budget.plannedAmount.currency, "SGD");
    assert.equal(budget.capitalProjectId, "capfc-prj-0001");
    assert.equal(budget.capitalBusinessId, BIZ);
    assert.equal(budget.approvalStatus, "approved");
    assert.equal(budget.fabricated, false);
    assert.equal(budget.revisionNumber, 1);
    assert.equal(budget.revisionHistory.length, 0);
    assert.ok(budget.traceabilityRefs.length > 0);
  });

  test("4 creates a business budget with explicit planned amount", async () => {
    const engine = await build();
    const result = engine.createBusinessBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 500000,
      budgetPeriod: "annual",
      validated: true,
    });
    assert.equal(result.action, "create_business_budget");
    const budget = result.budget!;
    assert.equal(budget.budgetCategory, "business");
    assert.equal(budget.plannedAmount.minorUnits, 500000);
    assert.equal(budget.budgetPeriod, "annual");
    assert.equal(budget.capitalBusinessId, BIZ);
  });

  test("5 creates an advertising budget with explicit planned amount", async () => {
    const engine = await build();
    const result = engine.createAdvertisingBudget({
      capitalBusinessId: BIZ,
      plannedAmount: "2500.00",
      budgetPeriod: "2026-Q3",
      validated: true,
    });
    assert.equal(result.action, "create_advertising_budget");
    const budget = result.budget!;
    assert.equal(budget.budgetCategory, "advertising");
    assert.equal(budget.plannedAmount.minorUnits, 250000);
    assert.equal(budget.budgetPeriod, "quarterly");
    assert.equal(budget.periodLabel, "2026-Q3");
  });

  test("6 creates an infrastructure budget with explicit planned amount", async () => {
    const engine = await build();
    const result = engine.createInfrastructureBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 750000,
      budgetPeriod: "2026",
      validated: true,
    });
    assert.equal(result.action, "create_infrastructure_budget");
    const budget = result.budget!;
    assert.equal(budget.budgetCategory, "infrastructure");
    assert.equal(budget.budgetPeriod, "annual");
    assert.equal(budget.periodLabel, "2026");
    assert.equal(budget.plannedAmount.minorUnits, 750000);
  });

  test("7 calculates utilisation, remaining, and variance using integer minor units only", async () => {
    const engine = await build();
    const created = engine.createProjectBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 100000,
      actualExpenditureMinor: 42500,
      budgetPeriod: "2026-08",
      validated: true,
    });
    const budget = created.budget!;
    assert.equal(budget.plannedAmount.minorUnits, 100000);
    assert.equal(budget.actualExpenditure.minorUnits, 42500);
    assert.equal(budget.remainingBudget.minorUnits, 57500);
    // (42500 * 10000 / 100000) / 100 = 42.5% — derived purely from integer basis points.
    assert.equal(budget.budgetUtilisationPercentage, 42.5);
    assert.equal(budget.varianceAmount.minorUnits, -57500);
    assert.equal(budget.variancePercentage, -57.5);
    assert.equal(budget.actualExpenditureEvidencePresent, true);

    const tracked = engine.trackBudgetUtilisation({
      budgetId: budget.budgetId,
      spendingActuals: [{ budgetId: budget.budgetId, amountMinor: 90000 }],
      validated: true,
    });
    const trackedBudget = tracked.budget!;
    assert.equal(trackedBudget.actualExpenditure.minorUnits, 90000);
    assert.equal(trackedBudget.budgetUtilisationPercentage, 90);
    assert.equal(trackedBudget.remainingBudget.minorUnits, 10000);
  });

  test("8 detects overspending and underspending budgets from evidence", async () => {
    const engine = await build();
    const overspent = engine.createProjectBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 100000,
      actualExpenditureMinor: 135000,
      budgetPeriod: "2026-08",
      validated: true,
    }).budget!;
    const underspent = engine.createBusinessBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 100000,
      actualExpenditureMinor: 5000,
      budgetPeriod: "2026-08",
      validated: true,
    }).budget!;

    const overruns = engine.detectBudgetOverruns({ capitalBusinessId: BIZ, validated: true });
    assert.equal(overruns.action, "detect_budget_overruns");
    const overspendFinding = overruns.variances.find((v) => v.budgetId === overspent.budgetId);
    assert.ok(overspendFinding);
    assert.equal(overspendFinding!.signal, "overspending");
    assert.equal(overspendFinding!.severity, "high");
    assert.equal(overspendFinding!.fabricated, false);
    assert.ok(overspendFinding!.sourceRefs.length > 0);

    const under = engine.detectUnderutilisedBudgets({ capitalBusinessId: BIZ, validated: true });
    assert.equal(under.action, "detect_underutilised_budgets");
    const underspendFinding = under.variances.find((v) => v.budgetId === underspent.budgetId);
    assert.ok(underspendFinding);
    assert.equal(underspendFinding!.signal, "underspending");
    assert.equal(underspendFinding!.fabricated, false);

    const compared = engine.compareActualVsBudget({ capitalBusinessId: BIZ, validated: true });
    assert.equal(compared.action, "compare_actual_vs_budget");
    assert.ok(compared.variances.some((v) => v.signal === "overspending"));
    assert.ok(compared.variances.some((v) => v.signal === "underspending"));
  });

  test("9 generates evidence-based recommendations from variance findings", async () => {
    const engine = await build();
    const overspent = engine.createProjectBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 100000,
      actualExpenditureMinor: 160000,
      budgetPeriod: "2026-08",
      validated: true,
    }).budget!;

    const result = engine.recommendBudgetAdjustments({ capitalBusinessId: BIZ, validated: true });
    assert.equal(result.action, "recommend_budget_adjustments");
    assert.ok(result.recommendations.length >= 1);
    const recommendation = result.recommendations.find((r) => r.budgetId === overspent.budgetId)!;
    assert.ok(recommendation);
    assert.ok(["decrease", "freeze", "investigate"].includes(recommendation.action));
    assert.equal(recommendation.fabricated, false);
    assert.ok(recommendation.evidenceRefs.length > 0);
    assert.ok(recommendation.rationale.length > 0);

    const stored = engine.getRecommendations();
    assert.ok(stored.length >= 1);
  });

  test("10 produces full Budget Planning Report with consumableByQ905 and submits through ERR", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({ records: [{ reportId: `ert-bpw-test-${Date.now()}` }] }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    engine.createProjectBudget({
      capitalBusinessId: BIZ,
      capitalProjectId: "capfc-prj-0001",
      plannedAmountMinor: 100000,
      actualExpenditureMinor: 80000,
      budgetPeriod: "2026-08",
      approvalStatus: "approved",
      validated: true,
    });
    engine.createAdvertisingBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 50000,
      actualExpenditureMinor: 60000,
      budgetPeriod: "2026-08",
      approvalStatus: "approved",
      validated: true,
    });

    const result = engine.produceBudgetPlanningReport({
      capitalBusinessId: BIZ,
      capitalProjectId: "capfc-prj-0001",
      budgetPeriod: "2026-08",
      scope: "business",
      validated: true,
    });
    assert.equal(result.action, "produce_budget_planning_report");
    const report = result.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.budgetPeriod, "monthly");
    assert.equal(report.budgetScope, "business");
    assert.ok(Array.isArray(report.budgetCategories));
    assert.equal(report.plannedBudget.minorUnits, 150000);
    assert.equal(report.actualSpending.minorUnits, 140000);
    assert.equal(report.remainingBudget.minorUnits, 10000);
    assert.ok(typeof report.budgetUtilisation === "number");
    assert.ok(report.varianceSummary);
    assert.ok(Array.isArray(report.budgetRisks));
    assert.ok(Array.isArray(report.adjustmentRecommendations));
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 100);
    assert.equal(report.capitalBusinessId, BIZ);
    assert.equal(report.budgets.length, 2);
    assert.equal(report.consumableByQ905, true);
    assert.equal(report.neverFabricateBudgetValuesOrSpendingData, true);
    assert.equal(report.neverApproveExpenditure, true);
    assert.equal(report.neverExecutePayments, true);
    assert.equal(report.neverForecastRevenue, true);
    assert.equal(report.neverReplaceProfitabilityWorker, true);
    assert.equal(report.neverModifyAccountingRecords, true);
    assert.equal(report.neverBypassGrandKingApproval, true);
    assert.equal(report.preserveCompleteTraceability, true);
    assert.equal(report.preserveHistoricalBudgetRevisions, true);

    const submit = engine.submitReport({ capitalBusinessId: BIZ, validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(submit.validation.decision === "pass" || submit.validation.decision === "partial");
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
    assert.equal(submit.latestReport!.auditStatus, "passed");

    // Historical reports are preserved, not overwritten.
    assert.ok(engine.getReports().length >= 1);
  });

  test("11 rejects Q9-05+ missions and every forbidden BPW boundary", async () => {
    const engine = await build();
    const baseline: BpwInput = { capitalBusinessId: BIZ, plannedAmountMinor: 10000, validated: true };

    assert.equal(engine.createProjectBudget({ ...baseline, fabricateBudgetValuesOrSpendingData: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, approveExpenditure: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, executePayments: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, forecastRevenue: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, replaceProfitabilityWorker: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, modifyAccountingRecords: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, overrideApprovedArchitecture: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, bypassGrandKingApproval: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, implementQ905OrLater: true }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, missionId: "Q9-05" }).validation.decision, "fail");
    assert.equal(engine.createProjectBudget({ ...baseline, missionId: "Q9-06" }).validation.decision, "fail");
  });

  test("12 exposes Q905 consumable contract and cockpit snapshot; preserves revision history", async () => {
    const engine = await build();
    const created = engine.createProjectBudget({
      capitalBusinessId: BIZ,
      plannedAmountMinor: 100000,
      actualExpenditureMinor: 20000,
      budgetPeriod: "2026-08",
      approvalStatus: "draft",
      validated: true,
    });
    const budgetId = created.budget!.budgetId;
    assert.equal(created.budget!.revisionNumber, 1);
    assert.equal(created.budget!.revisionHistory.length, 0);

    const revised = engine.createBudget({
      budgetId,
      plannedAmountMinor: 120000,
      budgetCategory: "project",
      budgetPeriod: "2026-08",
      approvalStatus: "revised",
      reason: "Scope increase approved by Grand King",
      validated: true,
    });
    const revisedBudget = revised.budget!;
    assert.equal(revisedBudget.revisionNumber, 2);
    assert.equal(revisedBudget.revisionHistory.length, 1);
    assert.equal(revisedBudget.revisionHistory[0]!.previousPlannedAmount!.minorUnits, 100000);
    assert.ok(revisedBudget.revisionHistory[0]!.changedFields.includes("plannedAmount"));
    assert.equal(revisedBudget.plannedAmount.minorUnits, 120000);
    // Actual expenditure carried forward from the prior state — never reset/fabricated.
    assert.equal(revisedBudget.actualExpenditure.minorUnits, 20000);

    const contract = engine.getQ905ConsumableContract();
    assert.equal(contract.missionId, "Q9-04");
    assert.equal(contract.consumerMissionId, "Q9-05");
    assert.equal(contract.neverImplementQ905OrLater, true);
    assert.ok(contract.exposedFields.includes("varianceSummary"));
    assert.ok(contract.budgetCategoryCatalog.includes("project"));
    assert.ok(contract.currencyCatalog.includes("SGD"));

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-04");
    assert.equal(cockpit.neverFabricateBudgetValuesOrSpendingData, true);
    assert.equal(cockpit.neverApproveExpenditure, true);
    assert.equal(cockpit.neverExecutePayments, true);
    assert.equal(cockpit.neverForecastRevenue, true);
    assert.equal(cockpit.neverReplaceProfitabilityWorker, true);
    assert.equal(cockpit.neverImplementQ905OrLater, true);
    assert.equal(cockpit.consumableByQ905, true);
    assert.ok(cockpit.totalBudgets >= 1);
    assert.equal(cockpit.workerId, "wkr-budget-planning-01");
    assert.equal(cockpit.latestCapitalBusinessId, BIZ);

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.budgets.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(diagnostics.validation.decision === "pass" || diagnostics.validation.decision === "partial");
  });
});
