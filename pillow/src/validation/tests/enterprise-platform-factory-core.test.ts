import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EPFC_APPROVAL_STATUSES,
  EPFC_LIFECYCLE_STAGES,
  EPFC_PIPELINE_TYPES,
  EPFC_PLATFORM_TYPES,
  ENTERPRISE_PLATFORM_MISSION_VERSION,
  ENTERPRISE_PLATFORM_FACTORY_REPORT_VERSION,
  buildEnterprisePlatformFactoryCoreConfiguration,
  createEnterprisePlatformFactoryCore,
  resetEnterprisePlatformFactoryCoreForTesting,
  type EnterprisePlatformFactoryCoreInput,
} from "../../enterprise-platform-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleMissionInput(
  overrides: Partial<EnterprisePlatformFactoryCoreInput> = {},
): EnterprisePlatformFactoryCoreInput {
  return {
    platformId: "epfc-plt-saas-01",
    platformName: "EmpireAI SaaS Platform",
    businessId: "epfc-biz-saas-01",
    businessObjective: "Coordinate enterprise SaaS platform lifecycle from requirements to production.",
    platformType: "saas",
    pipelineType: "multi_stage",
    platformPortfolio: ["core-platform", "admin-console"],
    activePlatforms: ["core-platform"],
    activeDependencies: ["auth-service", "billing-service"],
    executiveSummary: "Enterprise platform orchestration mission.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createEnterprisePlatformFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEnterprisePlatformFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q6-01 Enterprise Platform Factory Core", () => {
  beforeEach(resetEnterprisePlatformFactoryCoreForTesting);

  test("1 locks mandatory enterprise-platform-factory-core boundaries", () => {
    const c = buildEnterprisePlatformFactoryCoreConfiguration(REPO_ROOT, {
      neverBuildFrontend: false as never,
      neverBuildBackend: false as never,
      neverDesignDatabases: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ602OrLater: false as never,
    });
    assert.equal(c.neverBuildFrontend, true);
    assert.equal(c.neverBuildBackend, true);
    assert.equal(c.neverDesignDatabases, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ602OrLater, true);
  });

  test("2 initializes PILLOW-EPFC-001 for Q6-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q6-01");
    assert.equal(state.engineVersion, "PILLOW-EPFC-001");
    for (const type of EPFC_PLATFORM_TYPES) {
      assert.ok(state.configuration.platformTypes.includes(type));
    }
    for (const type of EPFC_PIPELINE_TYPES) {
      assert.ok(state.configuration.pipelineTypes.includes(type));
    }
    for (const stage of EPFC_LIFECYCLE_STAGES) {
      assert.ok(state.configuration.lifecycleStages.includes(stage));
    }
    for (const status of EPFC_APPROVAL_STATUSES) {
      assert.ok(state.configuration.approvalStatuses.includes(status));
    }
  });

  test("3 creates an enterprise platform mission", async () => {
    const report = (await build()).createEnterprisePlatformMission(sampleMissionInput());
    assert.equal(report.action, "create_enterprise_platform_mission");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestMission!.factoryMissionId.startsWith("epfc-msn-"));
    assert.equal(report.latestMission!.platformId, "epfc-plt-saas-01");
    assert.equal(report.latestMission!.currentStatus, "active");
    assert.equal(report.latestMission!.metadataVersion, "EPFC-001-v1");
    assert.equal(report.latestMission!.missionVersion, ENTERPRISE_PLATFORM_MISSION_VERSION);
  });

  test("4 registers a software platform", async () => {
    const engine = await build();
    engine.createEnterprisePlatformMission(sampleMissionInput());
    const report = engine.registerSoftwarePlatform({
      platformId: "epfc-plt-saas-01",
      platformName: "EmpireAI SaaS Platform",
      platformPortfolio: ["core-platform", "admin-console"],
      activePlatforms: ["core-platform"],
      validated: true,
    });
    assert.equal(report.action, "register_software_platform");
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.latestMission!.platformId, "epfc-plt-saas-01");
    assert.equal(report.latestMission!.currentLifecycleStage, "platform_registered");
    assert.ok(report.latestMission!.platformPortfolio.includes("core-platform"));
  });

  test("5 coordinates SDLC, architecture, and implementation workers", async () => {
    const engine = await build();
    engine.createEnterprisePlatformMission(sampleMissionInput());
    engine.registerSoftwarePlatform({
      platformId: "epfc-plt-saas-01",
      platformPortfolio: ["core-platform"],
      validated: true,
    });
    const sdlc = engine.coordinateSoftwareDevelopmentLifecycle({
      pipelineId: "pl-sdlc-01",
      pipelineType: "software_development",
      validated: true,
    });
    assert.equal(sdlc.action, "coordinate_software_development_lifecycle");
    assert.equal(sdlc.validation.decision, "pass");
    assert.equal(sdlc.latestMission!.currentLifecycleStage, "software_development");

    const architecture = engine.coordinateArchitectureDecisions({ validated: true });
    assert.equal(architecture.action, "coordinate_architecture_decisions");
    assert.equal(architecture.latestMission!.currentLifecycleStage, "architecture");

    const implementation = engine.coordinateImplementationWorkers({
      assignedWorkers: ["wkr-backend-dev-01", "wkr-frontend-dev-01"],
      assignedWorkerRoles: ["backend_developer", "frontend_developer"],
      validated: true,
    });
    assert.equal(implementation.action, "coordinate_implementation_workers");
    assert.equal(implementation.latestMission!.currentLifecycleStage, "implementation");
    assert.ok(implementation.latestMission!.assignedWorkers.includes("wkr-backend-dev-01"));
    assert.equal(implementation.latestMission!.productionStatus, "coordinating");
  });

  test("6 coordinates testing, deployment, and production operations", async () => {
    const engine = await build();
    engine.createEnterprisePlatformMission(sampleMissionInput());
    engine.registerSoftwarePlatform({ platformId: "epfc-plt-saas-01", validated: true });
    engine.coordinateSoftwareDevelopmentLifecycle({ validated: true });
    engine.coordinateArchitectureDecisions({ validated: true });
    engine.coordinateImplementationWorkers({ validated: true });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });

    const testing = engine.coordinateTestingWorkflows({ validated: true });
    assert.equal(testing.action, "coordinate_testing_workflows");
    assert.equal(testing.validation.decision, "pass");
    assert.equal(testing.latestMission!.currentLifecycleStage, "testing");
    assert.ok(testing.latestMission!.testingStatus);

    const deployment = engine.coordinateDeploymentWorkflows({ validated: true });
    assert.equal(deployment.action, "coordinate_deployment_workflows");
    assert.equal(deployment.validation.decision, "pass");
    assert.equal(deployment.latestMission!.currentLifecycleStage, "deployment");
    assert.ok(deployment.latestMission!.deploymentStatus);

    const production = engine.coordinateProductionOperations({ validated: true });
    assert.equal(production.action, "coordinate_production_operations");
    assert.equal(production.validation.decision, "pass");
    assert.equal(production.latestMission!.currentLifecycleStage, "production_operations");
  });

  test("7 rejects approval bypass and requires Grand King approval", async () => {
    const engine = await build();
    engine.createEnterprisePlatformMission(sampleMissionInput());
    const bypass = engine.coordinateApproval({ bypassApproval: true, validated: true });
    assert.equal(bypass.validation.decision, "fail");
    assert.equal(bypass.latestMission!.approvalStatus, "blocked_bypass_attempt");

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
    assert.equal(approved.latestMission!.approvalStatus, "approved");
  });

  test("8 produces Enterprise Platform Factory Report with all required fields", async () => {
    const engine = await build();
    engine.createEnterprisePlatformMission(sampleMissionInput());
    engine.registerSoftwarePlatform({
      platformId: "epfc-plt-saas-01",
      platformName: "EmpireAI SaaS Platform",
      platformPortfolio: ["core-platform", "admin-console"],
      activePlatforms: ["core-platform"],
      validated: true,
    });
    engine.coordinateSoftwareDevelopmentLifecycle({ validated: true });
    engine.coordinateArchitectureDecisions({ validated: true });
    engine.coordinateImplementationWorkers({
      assignedWorkers: ["wkr-platform-dev-01"],
      assignedWorkerRoles: ["platform_developer"],
      validated: true,
    });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    engine.coordinateTestingWorkflows({ validated: true });
    engine.coordinateDeploymentWorkflows({ validated: true });
    engine.coordinateProductionOperations({ validated: true });

    const report = engine.produceReport({ validated: true });
    assert.equal(report.action, "produce_report");
    assert.equal(report.validation.decision, "pass");
    const epfr = report.latestReport!;
    assert.ok(epfr.factoryMissionId);
    assert.ok(epfr.timestamp);
    assert.equal(epfr.platformId, "epfc-plt-saas-01");
    assert.equal(epfr.platformName, "EmpireAI SaaS Platform");
    assert.ok(epfr.businessObjective);
    assert.ok(epfr.currentLifecycleStage);
    assert.ok(Array.isArray(epfr.assignedWorkers));
    assert.ok(Array.isArray(epfr.activeDependencies));
    assert.ok(epfr.testingStatus);
    assert.ok(epfr.deploymentStatus);
    assert.ok(epfr.executiveSummary);
    assert.equal(epfr.metadataVersion, "EPFC-001-v1");
    assert.equal(epfr.reportVersion, ENTERPRISE_PLATFORM_FACTORY_REPORT_VERSION);
    assert.equal(epfr.neverBuildFrontend, true);
    assert.equal(epfr.neverBuildBackend, true);
    assert.equal(epfr.neverDesignDatabases, true);
    assert.equal(epfr.neverBypassGrandKingApproval, true);
  });

  test("9 rejects buildFrontend/buildBackend/designDatabases and override boundaries", async () => {
    const engine = await build();
    engine.createEnterprisePlatformMission(sampleMissionInput());
    assert.equal(
      engine.createEnterprisePlatformMission(sampleMissionInput({ buildFrontend: true }))
        .validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerSoftwarePlatform({ buildBackend: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.coordinateArchitectureDecisions({ designDatabases: true, validated: true })
        .validation.decision,
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
      engine.produceReport({ implementQ602OrLater: true, validated: true }).validation.decision,
      "fail",
    );
  });

  test("10 lists missions, submits report via ERR, cockpit, and audit", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-epfc-test-${Date.now()}` }],
          }),
        },
      },
    });
    engine.createEnterprisePlatformMission(sampleMissionInput());
    engine.registerSoftwarePlatform({ platformId: "epfc-plt-saas-01", validated: true });
    engine.coordinateApproval({
      approvalStatus: "approved",
      grandKingApproved: true,
      validated: true,
    });
    engine.produceReport({ validated: true });

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.missions.length >= 1);

    const submit = engine.submitReport({ validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(
      submit.validation.decision === "pass" || submit.validation.decision === "partial",
    );
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q6-01");
    assert.equal(cockpit.neverBuildFrontend, true);
    assert.equal(cockpit.neverBypassGrandKingApproval, true);
    assert.ok(cockpit.latestMissionId);

    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
  });
});
