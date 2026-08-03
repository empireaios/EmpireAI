import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AFC_AFFILIATE_NICHES,
  AFC_LIFECYCLE_STATUSES,
  AFFILIATE_BUSINESS_PROJECT_VERSION,
  AFFILIATE_FACTORY_REPORT_VERSION,
  buildAffiliateFactoryCoreConfiguration,
  createAffiliateFactoryCore,
  resetAffiliateFactoryCoreForTesting,
  type AfcInput,
} from "../../affiliate-factory-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleProjectInput(overrides: Partial<AfcInput> = {}): AfcInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    businessName: "Travel Gear Affiliates",
    businessCategory: "travel_gear",
    region: "SG",
    businessObjective: "Coordinate travel gear affiliate business from registration to operations.",
    executiveSummary: "Affiliate business orchestration mission.",
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createAffiliateFactoryCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAffiliateFactoryCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-01 Affiliate Factory Core", () => {
  beforeEach(resetAffiliateFactoryCoreForTesting);

  test("1 locks mandatory affiliate-factory-core boundaries", () => {
    const c = buildAffiliateFactoryCoreConfiguration(REPO_ROOT, {
      neverDiscoverAffiliateProgrammes: false as never,
      neverGenerateAffiliateContent: false as never,
      neverLaunchBusinessesAutomatically: false as never,
      neverFabricateWorkerStatus: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ802OrLater: false as never,
    });
    assert.equal(c.neverDiscoverAffiliateProgrammes, true);
    assert.equal(c.neverGenerateAffiliateContent, true);
    assert.equal(c.neverLaunchBusinessesAutomatically, true);
    assert.equal(c.neverFabricateWorkerStatus, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ802OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveFactoryAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-AFC-001 for Q8-01 with niches and lifecycle statuses", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-01");
    assert.equal(state.engineVersion, "PILLOW-AFC-001");
    for (const niche of AFC_AFFILIATE_NICHES) {
      assert.ok(state.configuration.affiliateNiches.includes(niche));
    }
    for (const stage of AFC_LIFECYCLE_STATUSES) {
      assert.ok(state.configuration.lifecycleStatuses.includes(stage));
    }
  });

  test("3 creates affiliate business project", async () => {
    const report = (await build()).registerAffiliateBusinessProject(sampleProjectInput());
    assert.equal(report.action, "register_affiliate_business_project");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestProject!.factoryProjectId.startsWith("afc-prj-"));
    assert.equal(report.latestProject!.affiliateBusinessId, "afc-biz-travel-gear-01");
    assert.equal(report.latestProject!.businessCategory, "travel_gear");
    assert.equal(report.latestProject!.lifecycleStatus, "project_registered");
    assert.equal(report.latestProject!.currentStatus, "active");
    assert.equal(report.latestProject!.metadataVersion, "AFC-001-v1");
    assert.equal(report.latestProject!.projectVersion, AFFILIATE_BUSINESS_PROJECT_VERSION);
  });

  test("4 factory lifecycle operational — advances stages, blocks skip to operating", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());

    const blocked = engine.coordinateLifecycle({ lifecycleTarget: "operating", validated: true });
    assert.equal(blocked.validation.decision, "fail");

    const coordinated = engine.coordinateWorkers({
      workerRoles: ["opportunity_discovery_worker"],
      assignedWorkers: ["wkr-afc-opp-01"],
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
  });

  test("5 worker orchestration / assign workers registers structural role slots", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    const coordinated = engine.coordinateWorkers({
      workerRoles: ["opportunity_discovery_worker", "content_creation_worker"],
      assignedWorkers: ["wkr-afc-opp-01"],
      validated: true,
    });
    assert.equal(coordinated.action, "coordinate_workers");
    assert.equal(coordinated.validation.decision, "pass");
    const matrix = coordinated.latestProject!.workerStatusMatrix;
    assert.ok(
      matrix.find((e) => e.workerRole === "opportunity_discovery_worker" && e.status === "assigned"),
    );
    assert.ok(
      matrix.find((e) => e.workerRole === "content_creation_worker" && e.status === "unassigned"),
    );

    const assigned = engine.assignWorkers({
      workerStatusUpdates: [
        { workerRole: "content_creation_worker", workerId: "wkr-afc-content-01", status: "ready" },
      ],
      validated: true,
    });
    assert.equal(assigned.action, "assign_workers");
    assert.ok(
      assigned.latestProject!.workerStatusMatrix.find(
        (e) => e.workerRole === "content_creation_worker" && e.status === "ready",
      ),
    );
  });

  test("6 tracks project status and manages worker dependencies", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    engine.coordinateWorkers({
      workerRoles: ["opportunity_discovery_worker", "content_creation_worker"],
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
          fromRole: "opportunity_discovery_worker",
          toRole: "content_creation_worker",
          dependencyType: "sequential",
        },
      ],
      validated: true,
    });
    assert.equal(deps.action, "manage_worker_dependencies");
    assert.ok(
      deps.latestProject!.dependencyGraph.some(
        (e) => e.fromRole === "opportunity_discovery_worker" && e.toRole === "content_creation_worker",
      ),
    );
  });

  test("7 monitors factory readiness across concurrent projects", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    engine.registerAffiliateBusinessProject(
      sampleProjectInput({
        affiliateBusinessId: "afc-biz-pet-01",
        businessName: "Pet Gear Affiliates",
        businessCategory: "pet_products",
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

  test("8 produces executive summary and full Affiliate Factory Report consumable by Q8-02", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    engine.coordinateWorkers({
      workerRoles: ["opportunity_discovery_worker"],
      assignedWorkers: ["wkr-afc-opp-01"],
      validated: true,
    });

    const summary = engine.produceExecutiveSummary({ validated: true });
    assert.equal(summary.action, "produce_executive_summary");
    assert.ok(summary.latestProject!.executiveSummary.includes("Travel Gear Affiliates"));

    const report = engine.produceAffiliateFactoryReport({ validated: true });
    assert.equal(report.action, "produce_affiliate_factory_report");
    assert.equal(report.validation.decision, "pass");
    const afr = report.latestReport!;
    assert.equal(afr.factoryId, "affiliate-factory-core");
    assert.ok(afr.timestamp);
    assert.equal(afr.affiliateBusinessId, "afc-biz-travel-gear-01");
    assert.equal(afr.businessName, "Travel Gear Affiliates");
    assert.ok(afr.lifecycleStatus);
    assert.ok(Array.isArray(afr.workerStatusMatrix));
    assert.ok(afr.readinessStatus);
    assert.ok(Array.isArray(afr.outstandingTasks));
    assert.ok(Array.isArray(afr.risks));
    assert.ok(afr.executiveSummary);
    assert.ok(afr.auditStatus);
    assert.ok(typeof afr.confidenceScore === "number");
    assert.ok(afr.confidenceScore >= 0 && afr.confidenceScore <= 100);
    assert.equal(afr.metadataVersion, "AFC-001-v1");
    assert.equal(afr.reportVersion, AFFILIATE_FACTORY_REPORT_VERSION);
    assert.equal(afr.consumableByQ802, true);
    assert.equal(afr.neverDiscoverAffiliateProgrammes, true);
    assert.equal(afr.neverGenerateAffiliateContent, true);
    assert.equal(afr.neverLaunchBusinessesAutomatically, true);
    assert.equal(afr.neverFabricateWorkerStatus, true);
    assert.equal(afr.neverBypassGrandKingApproval, true);
  });

  test("9 supports multi-business concurrent projects", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    engine.registerAffiliateBusinessProject(
      sampleProjectInput({
        affiliateBusinessId: "afc-biz-finance-01",
        businessName: "Budget Finance Affiliates",
        businessCategory: "personal_finance",
        region: "US",
      }),
    );

    const projects = engine.getProjects();
    assert.ok(projects.length >= 2);
    assert.ok(projects.some((p) => p.affiliateBusinessId === "afc-biz-travel-gear-01"));
    assert.ok(projects.some((p) => p.affiliateBusinessId === "afc-biz-finance-01"));

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.projects.length >= 2);
  });

  test("10 submit report through ERR when injected", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-afc-test-${Date.now()}` }],
          }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    engine.coordinateWorkers({
      workerRoles: ["opportunity_discovery_worker"],
      assignedWorkers: ["wkr-afc-opp-01"],
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

  test("11 rejects Q8-02 and forbidden AFC boundary attempts", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());
    assert.equal(
      engine.registerAffiliateBusinessProject(
        sampleProjectInput({ discoverAffiliateProgrammes: true }),
      ).validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateWorkers({ generateAffiliateContent: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.coordinateLifecycle({ launchBusinessesAutomatically: true, validated: true })
        .validation.decision,
      "fail",
    );
    assert.equal(
      engine.coordinateWorkers({ fabricateWorkerStatus: true, validated: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ implementQ802OrLater: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ missionId: "Q8-02", validated: true }).validation.decision,
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

  test("12 Q8-02 consumable contract + cockpit / executive dashboard snapshot", async () => {
    const engine = await build();
    engine.registerAffiliateBusinessProject(sampleProjectInput());

    const contract = engine.getQ802ConsumableContract();
    assert.equal(contract.missionId, "Q8-01");
    assert.equal(contract.consumerMissionId, "Q8-02");
    assert.equal(contract.neverImplementQ802OrLater, true);
    assert.ok(contract.exposedFields.includes("affiliateBusinessId"));
    assert.ok(contract.workerRoleCatalog.length > 0);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-01");
    assert.equal(cockpit.neverDiscoverAffiliateProgrammes, true);
    assert.equal(cockpit.neverGenerateAffiliateContent, true);
    assert.equal(cockpit.neverLaunchBusinessesAutomatically, true);
    assert.equal(cockpit.neverFabricateWorkerStatus, true);
    assert.equal(cockpit.neverImplementQ802OrLater, true);
    assert.ok(cockpit.latestAffiliateBusinessId);
    assert.ok(cockpit.totalProjects >= 1);
    assert.equal(cockpit.workerId, "wkr-affiliate-factory-core-01");

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
