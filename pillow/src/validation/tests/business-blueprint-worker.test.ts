import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  BBW_CAPABILITIES,
  BBW_INTEGRATION_TARGETS,
  BBW_METADATA_VERSION,
  BUSINESS_BLUEPRINT_VERSION,
  buildBusinessBlueprintWorkerConfiguration,
  createBusinessBlueprintWorker,
  resetBusinessBlueprintWorkerForTesting,
} from "../../business-blueprint-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createBusinessBlueprintWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBusinessBlueprintWorker(bootstrap, config);
  await engine.initialize();
  engine.connectBusinessBlueprintWorker();
  return engine;
}

const sampleBusinessModel = {
  businessModelId: "emg-model-sample-01",
  businessType: "commerce",
  businessModelType: "commerce_retail",
  valueProposition: "Deliver commerce value to local retailers via Shopify",
  productsServices: ["product catalog", "checkout offers"],
  customerSegments: ["local retailers", "nearby small shops"],
  revenueModel: "product_sales_and_margin_revenue",
  costModel: "lean_inventory_fulfillment_and_platform_fees",
  operatingModel: "catalog_fulfillment_and_customer_support_via_shopify",
  requiredCapabilities: ["catalog_management", "order_fulfillment"],
  requiredIntegrations: ["shopify", "payments"],
  businessAssumptions: ["demand_validated_via_q2_04"],
  sourceIntentId: "bii-intent-sample-01",
  originalCommand: "Build a commerce business for local retailers via Shopify under $5000",
};

const sampleMarketResearch = {
  reportId: "mrw-report-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  targetMarket: "local retailers",
  customerProblems: ["fragmented product discovery", "unreliable fulfillment"],
  customerSegments: ["local retailers", "nearby small shops"],
  marketDemand: { demandLevel: "high", summary: "Strong demand" },
  opportunitySize: { opportunityLevel: "high", summary: "High opportunity" },
  industryTrends: ["direct_to_consumer_growth"],
  barriersToEntry: ["inventory_capital"],
  risks: [{ description: "Incumbent response", severity: "moderate" }],
  confidenceScore: 0.72,
};

const sampleEvaluation = {
  evaluationId: "oew-eval-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  demandScore: 78,
  feasibilityScore: 71,
  profitPotentialScore: 74,
  riskScore: 42,
  strategicFitScore: 87,
  overallOpportunityScore: 76.2,
  recommendation: "Proceed",
  confidenceScore: 0.68,
  sourceBusinessModelId: "emg-model-sample-01",
  sourceMarketResearchReportId: "mrw-report-sample-01",
};

const sampleInput = {
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessModel: sampleBusinessModel,
  marketResearch: sampleMarketResearch,
  opportunityEvaluation: sampleEvaluation,
  validated: true,
};

describe("Q2-06 Business Blueprint Worker", () => {
  beforeEach(resetBusinessBlueprintWorkerForTesting);

  test("1 locks mandatory business-blueprint-worker boundaries", () => {
    const c = buildBusinessBlueprintWorkerConfiguration(REPO_ROOT, {
      neverExecuteBusiness: false as never,
      neverLaunchProducts: false as never,
      neverCreateBranding: false as never,
      neverBuildWebsites: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ207OrLater: false as never,
    });
    assert.equal(c.neverExecuteBusiness, true);
    assert.equal(c.neverLaunchProducts, true);
    assert.equal(c.neverCreateBranding, true);
    assert.equal(c.neverBuildWebsites, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ207OrLater, true);
  });

  test("2 initializes PILLOW-BBW-001 for Q2-06 with workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-06");
    assert.equal(state.engineVersion, "PILLOW-BBW-001");
    assert.equal(state.configuration.workerId, "wkr-business-blueprint-01");
    for (const target of BBW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(BBW_CAPABILITIES.includes("produce_machine_readable_business_blueprint"));
  });

  test("3 receives Business Model, Market Research, and Opportunity Evaluation", async () => {
    const engine = await build();
    assert.equal(
      engine.receiveBusinessModel({ businessModel: sampleBusinessModel, validated: true })
        .validation.decision,
      "partial",
    );
    assert.equal(
      engine.receiveMarketResearch({ marketResearch: sampleMarketResearch, validated: true })
        .validation.decision,
      "partial",
    );
    const full = engine.receiveOpportunityEvaluation({
      opportunityEvaluation: sampleEvaluation,
      validated: true,
    });
    assert.equal(full.validation.decision, "pass");
    assert.ok(full.latestBlueprint);
  });

  test("4 generates Business Blueprint with architecture, workflow, workers, integrations", async () => {
    const latest = (await build()).produceBusinessBlueprint(sampleInput).latestBlueprint!;
    assert.ok(latest.blueprintId.startsWith("bbw-blueprint-"));
    assert.ok(latest.businessArchitecture.architectureSummary.length > 0);
    assert.ok(latest.operationalWorkflow.length >= 4);
    assert.ok(latest.requiredWorkers.some((w) => w.priority === "critical"));
    assert.ok(latest.requiredIntegrations.includes("shopify"));
    assert.ok(latest.requiredAssets.length >= 3);
  });

  test("5 defines business milestones and implementation dependencies", async () => {
    const latest = (await build()).defineBusinessMilestones(sampleInput).latestBlueprint!;
    assert.ok(latest.milestones.length >= 3);
    assert.ok(latest.milestones.some((m) => m.milestoneId === "ms-01"));
    assert.ok(latest.dependencies.length >= 3);
    assert.ok(latest.dependencies.some((d) => d.source === "opportunity_evaluation"));
  });

  test("6 produces machine-readable Business Blueprint with required fields and traceability", async () => {
    const latest = (await build()).produceBusinessBlueprint(sampleInput).latestBlueprint!;
    assert.equal(latest.businessBuildMissionId, "bbm-commerce-01");
    assert.equal(latest.businessType, "commerce");
    assert.ok(latest.businessObjective.length > 0);
    assert.ok(latest.productsServices.includes("product catalog"));
    assert.ok(latest.customerSegments.includes("local retailers"));
    assert.ok(latest.valueProposition.length > 0);
    assert.equal(latest.metadataVersion, BBW_METADATA_VERSION);
    assert.equal(latest.blueprintVersion, BUSINESS_BLUEPRINT_VERSION);
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-03")));
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-04")));
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-05")));
    assert.ok(latest.preservedDecisions.some((d) => d.includes("Proceed")));
    assert.equal(latest.canonicalBlueprint, true);
  });

  test("7 rejects execute / launch / branding / websites / override / Q2-07 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { executeBusiness: true },
      { launchProducts: true },
      { createBranding: true },
      { buildWebsites: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ207OrLater: true },
    ] as const) {
      const report = engine.produceBusinessBlueprint({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestBlueprint, null);
    }
  });

  test("8 requires approved Proceed opportunity before blueprint production", async () => {
    const report = (await build()).produceBusinessBlueprint({
      ...sampleInput,
      opportunityEvaluation: { ...sampleEvaluation, recommendation: "Reject" },
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => /approved opportunity/i.test(e)));
  });

  test("9 submits blueprint through Executive Reporting Runtime", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createBusinessBlueprintWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-bbw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectBusinessBlueprintWorker();
    const produced = engine.produceBusinessBlueprint(sampleInput);
    const submitted = engine.submitBusinessBlueprint({
      blueprintId: produced.latestBlueprint!.blueprintId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_blueprint");
    assert.deepEqual(submittedIds, ["Q2-06"]);
    assert.equal(submitted.latestBlueprint!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestBlueprint!.executiveReportId, "ert-worker-bbw-001");
  });

  test("10 preserves audit history, canonical single blueprint, and cockpit boundaries", async () => {
    const engine = await build();
    engine.produceBusinessBlueprint(sampleInput);
    engine.produceBusinessBlueprint({
      ...sampleInput,
      businessObjective: "Updated objective for same mission",
    });
    const blueprints = engine.getBlueprints().filter(
      (b) => b.businessBuildMissionId === "bbm-commerce-01",
    );
    assert.equal(blueprints.length, 1);
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-06");
    assert.equal(cockpit.neverExecuteBusiness, true);
    assert.equal(cockpit.neverLaunchProducts, true);
    assert.ok(cockpit.totalBlueprints >= 1);
  });
});
