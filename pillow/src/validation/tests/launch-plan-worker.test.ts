import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  LAUNCH_STAGE_CATALOG,
  LPW_CAPABILITIES,
  LPW_INTEGRATION_TARGETS,
  LPW_METADATA_VERSION,
  LAUNCH_PLAN_VERSION,
  buildLaunchPlanWorkerConfiguration,
  createLaunchPlanWorker,
  resetLaunchPlanWorkerForTesting,
} from "../../launch-plan-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createLaunchPlanWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createLaunchPlanWorker(bootstrap, config);
  await engine.initialize();
  engine.connectLaunchPlanWorker();
  return engine;
}

const sampleBlueprint = {
  blueprintId: "bbw-blueprint-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessObjective: "Build an executable commerce business for local retailers",
  productsServices: ["product catalog", "checkout offers"],
  customerSegments: ["local retailers"],
  valueProposition: "Deliver commerce value to local retailers via Shopify",
  operationalWorkflow: [
    {
      stepId: "wf-01",
      name: "offer_definition",
      description: "Finalize offer",
      ownerWorkerRole: "role-offer-designer",
      dependsOn: [],
    },
    {
      stepId: "wf-04",
      name: "delivery_ops",
      description: "Delivery operations",
      ownerWorkerRole: "role-operations-specialist",
      dependsOn: ["wf-01"],
    },
  ],
  requiredWorkers: [
    {
      workerRole: "role-operations-specialist",
      purpose: "Run operations",
      skills: ["skill-ops-process"],
      priority: "critical",
    },
    {
      workerRole: "role-integration-specialist",
      purpose: "Configure integrations",
      skills: ["skill-integration-setup"],
      priority: "critical",
    },
  ],
  requiredIntegrations: ["shopify", "payments", "fulfillment"],
  requiredAssets: ["offer_catalog", "integration_configuration_sheet"],
  milestones: [
    {
      milestoneId: "ms-01",
      name: "blueprint_ready",
      description: "Blueprint accepted",
      sequence: 1,
      dependsOn: [],
      successCriteria: ["blueprint_machine_readable"],
    },
  ],
  dependencies: [
    {
      dependencyId: "dep-integrations",
      description: "Integrations before delivery ops",
      source: "blueprint",
      blocks: ["wf-04"],
    },
  ],
  businessArchitecture: {
    architectureSummary: "Commerce architecture",
    deliveryChannels: ["online_storefront"],
    revenueModel: "product_sales_and_margin_revenue",
    costModel: "lean_inventory_fulfillment_and_platform_fees",
    operatingModel: "catalog_fulfillment_and_customer_support_via_shopify",
    targetMarket: "local retailers",
    customerProblemsAddressed: ["fragmented product discovery"],
  },
  preservedDecisions: ["opportunity_recommendation=Proceed", "overall_opportunity_score=76.2"],
  traceabilityRefs: [
    "q2-03:business_model:emg-model-sample-01",
    "q2-04:market_research:mrw-report-sample-01",
    "q2-05:opportunity_evaluation:oew-eval-sample-01",
  ],
  approvedOpportunityRecommendation: "Proceed",
  overallOpportunityScore: 76.2,
  sourceBusinessModelId: "emg-model-sample-01",
  sourceMarketResearchReportId: "mrw-report-sample-01",
  sourceOpportunityEvaluationId: "oew-eval-sample-01",
  sourceIntentId: "bii-intent-sample-01",
};

const sampleInput = {
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessBlueprint: sampleBlueprint,
  blueprintApproved: true,
  validated: true,
};

describe("Q2-07 Launch Plan Worker", () => {
  beforeEach(resetLaunchPlanWorkerForTesting);

  test("1 locks mandatory launch-plan-worker boundaries", () => {
    const c = buildLaunchPlanWorkerConfiguration(REPO_ROOT, {
      neverExecuteLaunchTasks: false as never,
      neverAssignWorkersDirectly: false as never,
      neverCreateBusinessAssets: false as never,
      neverConnectExternalAccounts: false as never,
      neverLaunchBusiness: false as never,
      neverApproveLaunch: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ208OrLater: false as never,
    });
    assert.equal(c.neverExecuteLaunchTasks, true);
    assert.equal(c.neverAssignWorkersDirectly, true);
    assert.equal(c.neverCreateBusinessAssets, true);
    assert.equal(c.neverConnectExternalAccounts, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverApproveLaunch, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ208OrLater, true);
  });

  test("2 initializes PILLOW-LPW-001 for Q2-07 with extended integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-07");
    assert.equal(state.engineVersion, "PILLOW-LPW-001");
    assert.equal(state.configuration.workerId, "wkr-launch-plan-01");
    for (const target of [
      "business_blueprint_worker",
      "mission_coordination_engine",
      "approval_router",
      ...LPW_INTEGRATION_TARGETS.filter((t) =>
        ["worker_registry", "executive_reporting_runtime"].includes(t),
      ),
    ]) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const stage of LAUNCH_STAGE_CATALOG) {
      assert.ok(state.configuration.stageCatalog.includes(stage));
    }
    assert.ok(LPW_CAPABILITIES.includes("produce_machine_readable_launch_plan"));
  });

  test("3 receives approved Business Blueprint and derives business-type stages", async () => {
    const report = (await build()).receiveBusinessBlueprint(sampleInput);
    assert.equal(report.action, "receive_blueprint");
    assert.ok(report.latestLaunchPlan);
    const stages = report.latestLaunchPlan!.launchStages.map((s) => s.stageKey);
    assert.ok(stages.includes("preparation"));
    assert.ok(stages.includes("asset_creation"));
    assert.ok(stages.includes("integration"));
    assert.ok(stages.includes("soft_launch"));
    assert.ok(stages.includes("production_launch"));
    assert.equal(report.validation.decision, "pass");
  });

  test("4 generates milestones, tasks, and dependencies from stages", async () => {
    const latest = (await build()).produceLaunchPlan(sampleInput).latestLaunchPlan!;
    assert.ok(latest.milestones.length >= 3);
    assert.ok(latest.tasks.length >= 3);
    assert.ok(latest.dependencies.length >= 3);
    assert.ok(latest.milestones.every((m) => m.measurableCriteria.length > 0));
  });

  test("5 defines approval and validation checkpoints", async () => {
    const latest = (await build()).defineLaunchCheckpoints(sampleInput).latestLaunchPlan!;
    assert.ok(latest.approvalCheckpoints.length >= 1);
    assert.ok(latest.validationCheckpoints.length >= 1);
    assert.ok(latest.approvalCheckpoints.some((c) => c.authority === "pillow"));
    assert.ok(latest.validationCheckpoints.every((c) => c.requiredEvidence.length > 0));
  });

  test("6 identifies prerequisites, blockers, and rollback conditions", async () => {
    const latest = (await build()).defineLaunchBlockers(sampleInput).latestLaunchPlan!;
    assert.ok(latest.launchPrerequisites.length >= 1);
    assert.ok(latest.blockers.length >= 1);
    assert.ok(latest.rollbackConditions.length >= 1);
    assert.ok(latest.rollbackConditions.some((r) => r.action === "pause"));
    assert.ok(latest.completionCriteria.length >= 1);
  });

  test("7 produces machine-readable Launch Plan with required fields and blueprint traceability", async () => {
    const latest = (await build()).produceLaunchPlan(sampleInput).latestLaunchPlan!;
    assert.ok(latest.launchPlanId.startsWith("lpw-plan-"));
    assert.equal(latest.businessBuildMissionId, "bbm-commerce-01");
    assert.equal(latest.businessBlueprintId, "bbw-blueprint-sample-01");
    assert.equal(latest.businessType, "commerce");
    assert.ok(latest.launchObjective.length > 0);
    assert.ok(latest.requiredWorkforce.length >= 1);
    assert.ok(latest.requiredTools.includes("launch_plan_composer"));
    assert.equal(latest.metadataVersion, LPW_METADATA_VERSION);
    assert.equal(latest.planVersion, LAUNCH_PLAN_VERSION);
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-06")));
    assert.ok(latest.preservedDecisions.some((d) => d.includes("Proceed")));
  });

  test("8 rejects execute / assign / assets / connect / launch / approve / override / Q2-08 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { executeLaunchTasks: true },
      { assignWorkersDirectly: true },
      { createBusinessAssets: true },
      { connectExternalAccounts: true },
      { launchBusiness: true },
      { approveLaunch: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ208OrLater: true },
    ] as const) {
      const report = engine.produceLaunchPlan({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestLaunchPlan, null);
    }
  });

  test("9 submits launch plan through Executive Reporting Runtime with coordination refs", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createLaunchPlanWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-lpw-001" }] };
          },
        },
        missionCoordinationEngine: {
          receiveMissionPlan: () => ({
            records: [{ missionId: "mce-mission-lpw-001" }],
          }),
        },
        approvalRouter: {
          generateApprovalRequest: () => ({
            requests: [{ requestId: "apr-request-lpw-001" }],
          }),
        },
      },
    });
    await engine.initialize();
    engine.connectLaunchPlanWorker();
    const produced = engine.produceLaunchPlan(sampleInput);
    const submitted = engine.submitLaunchPlan({
      launchPlanId: produced.latestLaunchPlan!.launchPlanId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_launch_plan");
    assert.deepEqual(submittedIds, ["Q2-07"]);
    assert.equal(submitted.latestLaunchPlan!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestLaunchPlan!.executiveReportId, "ert-worker-lpw-001");
    assert.equal(submitted.latestLaunchPlan!.missionCoordinationRef, "mce-mission-lpw-001");
    assert.equal(submitted.latestLaunchPlan!.approvalRouterRef, "apr-request-lpw-001");
  });

  test("10 derives different stage sets by business type and preserves audit history", async () => {
    const engine = await build();
    const commerce = engine.produceLaunchPlan(sampleInput).latestLaunchPlan!;
    const agency = engine.produceLaunchPlan({
      businessBuildMissionId: "bbm-agency-01",
      businessType: "agency",
      businessBlueprint: {
        ...sampleBlueprint,
        blueprintId: "bbw-blueprint-agency-01",
        businessBuildMissionId: "bbm-agency-01",
        businessType: "agency",
        requiredAssets: [],
        requiredIntegrations: ["crm"],
      },
      blueprintApproved: true,
      validated: true,
    }).latestLaunchPlan!;

    assert.ok(commerce.launchStages.some((s) => s.stageKey === "soft_launch"));
    assert.ok(agency.launchStages.some((s) => s.name.includes("Pilot") || s.stageKey === "soft_launch"));
    assert.notEqual(commerce.businessBuildMissionId, agency.businessBuildMissionId);
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-07");
    assert.equal(cockpit.neverLaunchBusiness, true);
    assert.equal(cockpit.neverApproveLaunch, true);
  });
});
