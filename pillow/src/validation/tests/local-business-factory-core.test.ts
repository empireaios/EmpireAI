import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  LBFC_APPROVAL_STATUSES,
  LBFC_BUSINESS_CATEGORIES,
  LBFC_LIFECYCLE_STAGES,
  LOCAL_BUSINESS_FACTORY_REPORT_VERSION,
  LOCAL_BUSINESS_MISSION_VERSION,
  buildLocalBusinessFactoryCoreConfiguration,
  createLocalBusinessFactoryCore,
  resetLocalBusinessFactoryCoreForTesting,
  type LocalBusinessFactoryCoreInput,
} from "../../local-business-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleProjectInput(
  overrides: Partial<LocalBusinessFactoryCoreInput> = {},
): LocalBusinessFactoryCoreInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    businessName: "Empire Clean Co",
    businessCategory: "cleaning",
    businessObjective: "Coordinate local cleaning business from opportunity to operations.",
    executiveSummary: "Local business orchestration mission.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createLocalBusinessFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createLocalBusinessFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-01 Local Business Factory Core", () => {
  beforeEach(resetLocalBusinessFactoryCoreForTesting);

  test("1 locks mandatory local-business-factory-core boundaries", () => {
    const c = buildLocalBusinessFactoryCoreConfiguration(REPO_ROOT, {
      neverPerformSpecialistWorkerFunctions: false as never,
      neverReplaceQ7Workers: false as never,
      neverModifyUnrelatedFactories: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricateOperationalStatus: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ702OrLater: false as never,
    });
    assert.equal(c.neverPerformSpecialistWorkerFunctions, true);
    assert.equal(c.neverReplaceQ7Workers, true);
    assert.equal(c.neverModifyUnrelatedFactories, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricateOperationalStatus, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ702OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-LBFC-001 for Q7-01 with categories and lifecycle stages", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-01");
    assert.equal(state.engineVersion, "PILLOW-LBFC-001");
    for (const category of LBFC_BUSINESS_CATEGORIES) {
      assert.ok(state.configuration.businessCategories.includes(category));
    }
    for (const stage of LBFC_LIFECYCLE_STAGES) {
      assert.ok(state.configuration.lifecycleStages.includes(stage));
    }
    for (const status of LBFC_APPROVAL_STATUSES) {
      assert.ok(state.configuration.approvalStatuses.includes(status));
    }
  });

  test("3 registers a local business project", async () => {
    const report = (await build()).registerLocalBusinessProject(sampleProjectInput());
    assert.equal(report.action, "register_local_business_project");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestProject!.factoryMissionId.startsWith("lbfc-msn-"));
    assert.equal(report.latestProject!.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(report.latestProject!.businessCategory, "cleaning");
    assert.equal(report.latestProject!.currentLifecycleStage, "project_registered");
    assert.equal(report.latestProject!.currentStatus, "active");
    assert.equal(report.latestProject!.metadataVersion, "LBFC-001-v1");
    assert.equal(report.latestProject!.missionVersion, LOCAL_BUSINESS_MISSION_VERSION);
  });

  test("4 tracks lifecycle / project progress", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    const tracked = engine.trackProjectProgress({
      currentLifecycleStage: "preparation",
      validated: true,
    });
    assert.equal(tracked.action, "track_project_progress");
    assert.equal(tracked.validation.decision, "pass");
    assert.equal(tracked.latestProject!.currentLifecycleStage, "preparation");
    assert.equal(tracked.latestProject!.currentStatus, "preparing");

    const lifecycle = engine.coordinateLifecycle({
      currentLifecycleStage: "workers_assigned",
      validated: true,
    });
    assert.equal(lifecycle.action, "coordinate_lifecycle");
    assert.equal(lifecycle.latestProject!.currentLifecycleStage, "workers_assigned");
  });

  test("5 coordinates and assigns workers", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    const coordinated = engine.coordinateWorkers({
      assignedWorkers: ["wkr-local-ops-01", "wkr-local-sales-01"],
      assignedWorkerRoles: ["operations_coordinator", "sales_coordinator"],
      validated: true,
    });
    assert.equal(coordinated.action, "coordinate_workers");
    assert.equal(coordinated.validation.decision, "pass");
    assert.ok(coordinated.latestProject!.assignedWorkers.includes("wkr-local-ops-01"));
    assert.equal(coordinated.latestProject!.currentLifecycleStage, "workers_assigned");

    const assigned = engine.assignWorkers({
      assignedWorkers: ["wkr-local-fulfilment-01"],
      assignedWorkerRoles: ["fulfilment_coordinator"],
      validated: true,
    });
    assert.equal(assigned.action, "assign_workers");
    assert.ok(assigned.latestProject!.assignedWorkers.includes("wkr-local-fulfilment-01"));
  });

  test("6 coordinates approval and rejects bypass", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    const bypass = engine.coordinateApproval({ bypassApproval: true, validated: true });
    assert.equal(bypass.validation.decision, "fail");
    assert.equal(bypass.latestProject!.approvalStatus, "blocked_bypass_attempt");

    const noGk = engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: false,
      validated: true,
    });
    assert.equal(noGk.validation.decision, "fail");

    const approved = engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    assert.equal(approved.validation.decision, "pass");
    assert.equal(approved.latestProject!.approvalStatus, "approved");
  });

  test("7 coordinates launch readiness", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    const readiness = engine.coordinateLaunchReadiness({
      launchReadiness: "ready",
      validated: true,
    });
    assert.equal(readiness.action, "coordinate_launch_readiness");
    assert.equal(readiness.validation.decision, "pass");
    assert.equal(readiness.latestProject!.currentLifecycleStage, "launch_readiness");
    assert.equal(readiness.latestProject!.launchReadiness, "ready");
  });

  test("8 produces Local Business Factory Report with required fields", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    engine.coordinateWorkers({
      assignedWorkers: ["wkr-local-ops-01"],
      assignedWorkerRoles: ["operations_coordinator"],
      validated: true,
    });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    engine.coordinateLaunchReadiness({ launchReadiness: "ready", validated: true });
    engine.coordinateCustomerAcquisition({
      customerAcquisitionStatus: "active",
      validated: true,
    });
    engine.coordinateFulfilment({ validated: true });
    engine.coordinateOngoingOperations({
      operationalStatus: "operating",
      validated: true,
    });

    const report = engine.produceLocalBusinessFactoryReport({ validated: true });
    assert.equal(report.action, "produce_local_business_factory_report");
    assert.equal(report.validation.decision, "pass");
    const lbfr = report.latestReport!;
    assert.equal(lbfr.factoryId, "local-business-factory-core");
    assert.ok(lbfr.timestamp);
    assert.equal(lbfr.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(lbfr.businessCategory, "cleaning");
    assert.equal(lbfr.businessName, "Empire Clean Co");
    assert.ok(lbfr.currentLifecycleStage);
    assert.ok(Array.isArray(lbfr.assignedWorkers));
    assert.ok(lbfr.launchReadiness);
    assert.ok(lbfr.customerAcquisitionStatus);
    assert.ok(lbfr.operationalStatus);
    assert.ok(Array.isArray(lbfr.outstandingIssues));
    assert.ok(lbfr.executiveSummary);
    assert.ok(typeof lbfr.confidenceScore === "number");
    assert.ok(lbfr.confidenceScore >= 0 && lbfr.confidenceScore <= 100);
    assert.equal(lbfr.metadataVersion, "LBFC-001-v1");
    assert.equal(lbfr.reportVersion, LOCAL_BUSINESS_FACTORY_REPORT_VERSION);
    assert.equal(lbfr.neverPerformSpecialistWorkerFunctions, true);
    assert.equal(lbfr.neverFabricateOperationalStatus, true);
    assert.equal(lbfr.neverBypassGrandKingApproval, true);
  });

  test("9 audit trail functioning", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    engine.coordinateLifecycle({ currentLifecycleStage: "preparation", validated: true });
    engine.produceReport({ validated: true });
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 2);
    assert.ok(audit.some((e) => e.action === "register_local_business_project"));
    assert.ok(audit.some((e) => e.action.includes("report") || e.action === "produce_report"));
  });

  test("10 submit report through ERR when injected", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-lbfc-test-${Date.now()}` }],
          }),
        },
      },
    });
    engine.registerLocalBusinessProject(sampleProjectInput());
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
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
  });

  test("11 rejects Q7-02 and specialist worker function attempts", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    assert.equal(
      engine.registerLocalBusinessProject(
        sampleProjectInput({ performSpecialistWork: true }),
      ).validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateWorkers({ replaceQ7Workers: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.coordinateOngoingOperations({
        fabricateOperationalStatus: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ implementQ702OrLater: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ missionId: "Q7-02", validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ overrideGrandKing: true, validated: true }).validation
        .decision,
      "fail",
    );
  });

  test("12 cockpit / executive dashboard snapshot", async () => {
    const engine = await build();
    engine.registerLocalBusinessProject(sampleProjectInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-01");
    assert.equal(cockpit.neverPerformSpecialistWorkerFunctions, true);
    assert.equal(cockpit.neverReplaceQ7Workers, true);
    assert.equal(cockpit.neverBypassGrandKingApproval, true);
    assert.equal(cockpit.neverFabricateOperationalStatus, true);
    assert.equal(cockpit.neverImplementQ702OrLater, true);
    assert.ok(cockpit.latestProjectId);
    assert.ok(cockpit.totalProjects >= 1);
    assert.equal(cockpit.workerId, "wkr-local-business-factory-core-01");

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.projects.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(
      diagnostics.validation.decision === "pass" ||
        diagnostics.validation.decision === "partial",
    );
  });
});
