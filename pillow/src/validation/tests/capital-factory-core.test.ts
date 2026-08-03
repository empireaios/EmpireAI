import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CAPFC_CAPITAL_CATEGORIES,
  CAPFC_LIFECYCLE_STATUSES,
  CAPITAL_PROJECT_VERSION,
  CAPITAL_FACTORY_REPORT_VERSION,
  buildCapitalFactoryCoreConfiguration,
  createCapitalFactoryCore,
  resetCapitalFactoryCoreForTesting,
  type CapfcInput,
} from "../../capital-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleProjectInput(overrides: Partial<CapfcInput> = {}): CapfcInput {
  return {
    capitalBusinessId: "capfc-biz-growth-01",
    capitalProjectName: "Empire Growth Capital Pool",
    capitalCategory: "growth_allocation",
    region: "SG",
    financialPeriod: "2026-Q3",
    capitalObjective: "Coordinate growth capital allocation from registration to operations.",
    executiveSummary: "Capital Factory orchestration mission.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createCapitalFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCapitalFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q9-01 Capital Factory Core", () => {
  beforeEach(resetCapitalFactoryCoreForTesting);

  test("1 locks mandatory capital-factory-core boundaries", () => {
    const c = buildCapitalFactoryCoreConfiguration(REPO_ROOT, {
      neverPerformAccounting: false as never,
      neverForecastFinances: false as never,
      neverExecuteInvestmentsAutomatically: false as never,
      neverFabricateFinancialStatus: false as never,
      neverFabricateWorkerStatus: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ902OrLater: false as never,
    });
    assert.equal(c.neverPerformAccounting, true);
    assert.equal(c.neverForecastFinances, true);
    assert.equal(c.neverExecuteInvestmentsAutomatically, true);
    assert.equal(c.neverFabricateFinancialStatus, true);
    assert.equal(c.neverFabricateWorkerStatus, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ902OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveFactoryAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-CAPFC-001 for Q9-01 with categories and lifecycle statuses", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q9-01");
    assert.equal(state.engineVersion, "PILLOW-CAPFC-001");
    for (const category of CAPFC_CAPITAL_CATEGORIES) {
      assert.ok(state.configuration.capitalCategories.includes(category));
    }
    for (const stage of CAPFC_LIFECYCLE_STATUSES) {
      assert.ok(state.configuration.lifecycleStatuses.includes(stage));
    }
  });

  test("3 creates capital project", async () => {
    const report = (await build()).registerCapitalProject(sampleProjectInput());
    assert.equal(report.action, "register_capital_project");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestProject!.factoryProjectId.startsWith("capfc-prj-"));
    assert.equal(report.latestProject!.capitalProjectId, report.latestProject!.factoryProjectId);
    assert.equal(report.latestProject!.capitalBusinessId, "capfc-biz-growth-01");
    assert.equal(report.latestProject!.capitalCategory, "growth_allocation");
    assert.equal(report.latestProject!.financialPeriod, "2026-Q3");
    assert.equal(report.latestProject!.capitalStatus, "registered");
    assert.equal(report.latestProject!.lifecycleStatus, "project_registered");
    assert.equal(report.latestProject!.currentStatus, "active");
    assert.equal(report.latestProject!.metadataVersion, "CAPFC-001-v1");
    assert.equal(report.latestProject!.projectVersion, CAPITAL_PROJECT_VERSION);
  });

  test("4 factory lifecycle operational — advances stages, blocks skip to operating", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());

    const blocked = engine.coordinateLifecycle({ lifecycleTarget: "operating", validated: true });
    assert.equal(blocked.validation.decision, "fail");

    const coordinated = engine.coordinateWorkers({
      workerRoles: ["accounting_worker"],
      assignedWorkers: ["wkr-capfc-acct-01"],
      validated: true,
    });
    assert.equal(coordinated.latestProject!.lifecycleStatus, "workers_coordinated");

    const prep = engine.coordinateLifecycle({ lifecycleTarget: "preparation", validated: true });
    assert.equal(prep.validation.decision, "pass");
    assert.equal(prep.latestProject!.lifecycleStatus, "preparation");

    const review = engine.manageLifecycle({ lifecycleTarget: "readiness_review", validated: true });
    assert.equal(review.latestProject!.lifecycleStatus, "readiness_review");

    const operating = engine.coordinateLifecycle({ lifecycleTarget: "operating", validated: true });
    assert.equal(operating.validation.decision, "pass");
    assert.equal(operating.latestProject!.lifecycleStatus, "operating");
    assert.equal(operating.latestProject!.capitalStatus, "ready");
  });

  test("5 worker orchestration / assign workers registers structural role slots", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());
    const coordinated = engine.coordinateWorkers({
      workerRoles: ["accounting_worker", "forecasting_worker"],
      assignedWorkers: ["wkr-capfc-acct-01"],
      validated: true,
    });
    assert.equal(coordinated.action, "coordinate_workers");
    assert.equal(coordinated.validation.decision, "pass");
    const matrix = coordinated.latestProject!.workerStatusMatrix;
    assert.ok(matrix.find((e) => e.workerRole === "accounting_worker" && e.status === "assigned"));
    assert.ok(matrix.find((e) => e.workerRole === "forecasting_worker" && e.status === "unassigned"));

    const assigned = engine.assignWorkers({
      workerStatusUpdates: [
        { workerRole: "forecasting_worker", workerId: "wkr-capfc-fcst-01", status: "ready" },
      ],
      validated: true,
    });
    assert.equal(assigned.action, "assign_workers");
    assert.ok(
      assigned.latestProject!.workerStatusMatrix.find(
        (e) => e.workerRole === "forecasting_worker" && e.status === "ready",
      ),
    );
  });

  test("6 tracks project status and manages worker dependencies", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());
    engine.coordinateWorkers({
      workerRoles: ["accounting_worker", "forecasting_worker"],
      validated: true,
    });

    const tracked = engine.trackProjectProgress({ lifecycleTarget: "preparation", validated: true });
    assert.equal(tracked.action, "track_project_progress");
    assert.equal(tracked.validation.decision, "pass");
    assert.equal(tracked.latestProject!.lifecycleStatus, "preparation");
    assert.ok(tracked.latestProject!.progressSummary.percentComplete > 0);

    const deps = engine.manageWorkerDependencies({
      dependencyEdges: [
        {
          fromRole: "accounting_worker",
          toRole: "forecasting_worker",
          dependencyType: "sequential",
        },
      ],
      validated: true,
    });
    assert.equal(deps.action, "manage_worker_dependencies");
    assert.ok(
      deps.latestProject!.dependencyGraph.some(
        (e) => e.fromRole === "accounting_worker" && e.toRole === "forecasting_worker",
      ),
    );
  });

  test("7 monitors factory readiness across concurrent projects", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());
    engine.registerCapitalProject(
      sampleProjectInput({
        capitalBusinessId: "capfc-biz-treasury-01",
        capitalProjectName: "Treasury Reserve Pool",
        capitalCategory: "treasury",
        region: "US",
      }),
    );

    const readiness = engine.monitorFactoryReadiness();
    assert.equal(readiness.action, "monitor_factory_readiness");
    assert.ok(readiness.factoryReadiness);
    assert.equal(readiness.factoryReadiness!.totalProjects, 2);
    assert.ok(
      ["unknown", "not_ready", "partial", "ready", "blocked"].includes(
        readiness.factoryReadiness!.overallReadiness,
      ),
    );
  });

  test("8 produces executive summary and full Capital Factory Report consumable by Q9-02", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());
    engine.coordinateWorkers({
      workerRoles: ["accounting_worker"],
      assignedWorkers: ["wkr-capfc-acct-01"],
      validated: true,
    });

    const summary = engine.produceExecutiveSummary({ validated: true });
    assert.equal(summary.action, "produce_executive_summary");
    assert.ok(summary.latestProject!.executiveSummary.includes("Empire Growth Capital Pool"));

    const report = engine.produceCapitalFactoryReport({ validated: true });
    assert.equal(report.action, "produce_capital_factory_report");
    assert.equal(report.validation.decision, "pass");
    const cfr = report.latestReport!;
    assert.equal(cfr.factoryId, "capital-factory-core");
    assert.ok(cfr.timestamp);
    assert.ok(cfr.capitalProjectId);
    assert.equal(cfr.financialPeriod, "2026-Q3");
    assert.ok(cfr.capitalStatus);
    assert.equal(cfr.capitalBusinessId, "capfc-biz-growth-01");
    assert.equal(cfr.capitalProjectName, "Empire Growth Capital Pool");
    assert.ok(cfr.lifecycleStatus);
    assert.ok(Array.isArray(cfr.workerStatusMatrix));
    assert.ok(cfr.capitalAllocationSummary);
    assert.equal(cfr.capitalAllocationSummary.fabricated, false);
    assert.ok(cfr.readinessStatus);
    assert.ok(Array.isArray(cfr.outstandingTasks));
    assert.ok(Array.isArray(cfr.risks));
    assert.ok(cfr.executiveSummary);
    assert.ok(cfr.auditStatus);
    assert.ok(typeof cfr.confidenceScore === "number");
    assert.ok(cfr.confidenceScore >= 0 && cfr.confidenceScore <= 100);
    assert.equal(cfr.metadataVersion, "CAPFC-001-v1");
    assert.equal(cfr.reportVersion, CAPITAL_FACTORY_REPORT_VERSION);
    assert.equal(cfr.consumableByQ902, true);
    assert.equal(cfr.neverPerformAccounting, true);
    assert.equal(cfr.neverForecastFinances, true);
    assert.equal(cfr.neverExecuteInvestmentsAutomatically, true);
    assert.equal(cfr.neverFabricateFinancialStatus, true);
    assert.equal(cfr.neverFabricateWorkerStatus, true);
    assert.equal(cfr.neverBypassGrandKingApproval, true);
  });

  test("9 supports multi-business concurrent projects", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());
    engine.registerCapitalProject(
      sampleProjectInput({
        capitalBusinessId: "capfc-biz-working-01",
        capitalProjectName: "Working Capital Pool",
        capitalCategory: "working_capital",
        region: "US",
      }),
    );

    const projects = engine.getProjects();
    assert.ok(projects.length >= 2);
    assert.ok(projects.some((p) => p.capitalBusinessId === "capfc-biz-growth-01"));
    assert.ok(projects.some((p) => p.capitalBusinessId === "capfc-biz-working-01"));

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.projects.length >= 2);
  });

  test("10 submit report through ERR when injected", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-capfc-test-${Date.now()}` }],
          }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    engine.registerCapitalProject(sampleProjectInput());
    engine.coordinateWorkers({
      workerRoles: ["accounting_worker"],
      assignedWorkers: ["wkr-capfc-acct-01"],
      validated: true,
    });
    engine.produceReport({ validated: true });

    const submit = engine.submitReport({ validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(
      submit.validation.decision === "pass" || submit.validation.decision === "partial",
    );
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
    assert.equal(submit.latestReport!.auditStatus, "passed");
  });

  test("11 rejects Q9-02 and forbidden CAPFC boundary attempts", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());
    assert.equal(
      engine.registerCapitalProject(sampleProjectInput({ performAccounting: true })).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.coordinateWorkers({ forecastFinances: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateLifecycle({ executeInvestmentsAutomatically: true, validated: true })
        .validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateWorkers({ fabricateWorkerStatus: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ implementQ902OrLater: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ missionId: "Q9-02", validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overrideGrandKing: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateLifecycle({ bypassGrandKingApproval: true, validated: true }).validation
        .decision,
      "fail",
    );
  });

  test("12 Q9-02 consumable contract + cockpit / executive dashboard snapshot", async () => {
    const engine = await build();
    engine.registerCapitalProject(sampleProjectInput());

    const contract = engine.getQ902ConsumableContract();
    assert.equal(contract.missionId, "Q9-01");
    assert.equal(contract.consumerMissionId, "Q9-02");
    assert.equal(contract.neverImplementQ902OrLater, true);
    assert.ok(contract.exposedFields.includes("capitalBusinessId"));
    assert.ok(contract.workerRoleCatalog.length > 0);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-01");
    assert.equal(cockpit.neverPerformAccounting, true);
    assert.equal(cockpit.neverForecastFinances, true);
    assert.equal(cockpit.neverExecuteInvestmentsAutomatically, true);
    assert.equal(cockpit.neverFabricateWorkerStatus, true);
    assert.equal(cockpit.neverImplementQ902OrLater, true);
    assert.ok(cockpit.latestCapitalBusinessId);
    assert.ok(cockpit.totalProjects >= 1);
    assert.equal(cockpit.workerId, "wkr-capital-factory-core-01");

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.projects.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(
      diagnostics.validation.decision === "pass" || diagnostics.validation.decision === "partial",
    );
  });
});
