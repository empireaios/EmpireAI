import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  BRW_CAPABILITIES,
  BRW_INTEGRATION_TARGETS,
  BRW_METADATA_VERSION,
  BUSINESS_RISK_REPORT_VERSION,
  RISK_CATEGORIES,
  buildBusinessRiskWorkerConfiguration,
  createBusinessRiskWorker,
  resetBusinessRiskWorkerForTesting,
} from "../../business-risk-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createBusinessRiskWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBusinessRiskWorker(bootstrap, config);
  await engine.initialize();
  engine.connectBusinessRiskWorker();
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
  requiredWorkers: [
    {
      workerRole: "role-operations-specialist",
      purpose: "Run operations",
      skills: ["skill-ops-process"],
      priority: "critical",
    },
  ],
  requiredIntegrations: ["shopify", "payments", "fulfillment"],
  requiredAssets: ["offer_catalog", "integration_configuration_sheet"],
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
  },
  preservedDecisions: ["opportunity_recommendation=Proceed", "overall_opportunity_score=76.2"],
  traceabilityRefs: [
    "q2-03:business_model:emg-model-sample-01",
    "q2-04:market_research:mrw-report-sample-01",
    "q2-05:opportunity_evaluation:oew-eval-sample-01",
  ],
  approvedOpportunityRecommendation: "Proceed",
  overallOpportunityScore: 76.2,
};

const sampleLaunchPlan = {
  launchPlanId: "lpw-plan-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessBlueprintId: "bbw-blueprint-sample-01",
  businessType: "commerce",
  launchObjective: "Stage commerce from blueprint to launch readiness",
  launchStages: [
    { stageKey: "preparation", name: "Preparation" },
    { stageKey: "integration", name: "Integration" },
    { stageKey: "soft_launch", name: "Soft Launch" },
    { stageKey: "production_launch", name: "Production Launch" },
  ],
  milestones: [
    { milestoneId: "ms-01", name: "integrations_ready" },
    { milestoneId: "ms-02", name: "soft_launch_ready" },
  ],
  tasks: [
    { taskId: "t-01", name: "configure_shopify" },
    { taskId: "t-02", name: "validate_payments" },
    { taskId: "t-03", name: "run_soft_launch" },
    { taskId: "t-04", name: "open_production" },
  ],
  requiredWorkforce: [{ workerRole: "role-operations-specialist", priority: "critical" }],
  requiredTools: ["shopify", "payments", "launch_plan_composer"],
  approvalCheckpoints: [{ checkpointId: "apr-01", name: "Pillow launch readiness" }],
  validationCheckpoints: [{ checkpointId: "val-01", name: "Integration validation" }],
  launchPrerequisites: ["blueprint_approved", "integrations_configured"],
  blockers: [
    { description: "Payment provider KYC incomplete", severity: "high" },
    { description: "Fulfillment SLA unsigned", severity: "moderate" },
  ],
  rollbackConditions: [
    { description: "Checkout failure rate > 5%", action: "pause", trigger: "soft_launch_metrics" },
  ],
  missingPrerequisites: ["supplier_backup_identified"],
  preservedDecisions: ["opportunity_recommendation=Proceed"],
  traceabilityRefs: ["q2-06:business_blueprint:bbw-blueprint-sample-01"],
};

const sampleInput = {
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessBlueprint: sampleBlueprint,
  launchPlan: sampleLaunchPlan,
  validated: true,
};

describe("Q2-08 Business Risk Worker", () => {
  beforeEach(resetBusinessRiskWorkerForTesting);

  test("1 locks mandatory business-risk-worker boundaries", () => {
    const c = buildBusinessRiskWorkerConfiguration(REPO_ROOT, {
      neverRemoveRisksAutomatically: false as never,
      neverApproveBusiness: false as never,
      neverRejectBusiness: false as never,
      neverLaunchBusiness: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ209OrLater: false as never,
    });
    assert.equal(c.neverRemoveRisksAutomatically, true);
    assert.equal(c.neverApproveBusiness, true);
    assert.equal(c.neverRejectBusiness, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ209OrLater, true);
  });

  test("2 initializes PILLOW-BRW-001 for Q2-08 with required integrations and categories", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-08");
    assert.equal(state.engineVersion, "PILLOW-BRW-001");
    assert.equal(state.configuration.workerId, "wkr-business-risk-01");
    for (const target of [
      "business_blueprint_worker",
      "launch_plan_worker",
      "executive_reporting_runtime",
      ...BRW_INTEGRATION_TARGETS.filter((t) =>
        ["worker_registry", "worker_recovery_system"].includes(t),
      ),
    ]) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const category of RISK_CATEGORIES) {
      assert.ok(state.configuration.riskCategories.includes(category));
    }
    assert.ok(BRW_CAPABILITIES.includes("produce_machine_readable_business_risk_reports"));
  });

  test("3 receives Business Blueprint and Launch Plan for assessment", async () => {
    const engine = await build();
    const partial = engine.receiveBusinessBlueprint({
      businessBlueprint: sampleBlueprint,
      validated: true,
    });
    assert.equal(partial.action, "receive_blueprint");
    assert.equal(partial.validation.decision, "partial");

    const report = engine.receiveLaunchPlan({
      launchPlan: sampleLaunchPlan,
      validated: true,
    });
    assert.equal(report.action, "receive_launch_plan");
    assert.ok(report.latestReport);
    assert.equal(report.latestReport!.businessBlueprintId, "bbw-blueprint-sample-01");
    assert.equal(report.latestReport!.launchPlanId, "lpw-plan-sample-01");
  });

  test("4 identifies risks across all mandatory categories", async () => {
    const latest = (await build()).identifyBusinessRisks(sampleInput).latestReport!;
    const categories = new Set(latest.risks.map((r) => r.riskCategory));
    for (const category of RISK_CATEGORIES) {
      assert.ok(categories.has(category), `missing category ${category}`);
    }
    assert.ok(latest.risks.length >= RISK_CATEGORIES.length);
  });

  test("5 assigns likelihood, impact, and overall risk scores", async () => {
    const latest = (await build()).scoreBusinessRisks(sampleInput).latestReport!;
    assert.ok(latest.risks.every((r) => r.likelihoodScore > 0 && r.impactScore > 0));
    assert.ok(latest.risks.every((r) => r.overallRiskScore > 0));
    assert.ok(
      latest.risks.every((r) =>
        ["low", "moderate", "high", "critical"].includes(r.overallRiskRating),
      ),
    );
    assert.ok(["low", "moderate", "high", "critical"].includes(latest.overallPortfolioRiskRating));
  });

  test("6 recommends mitigation actions for every risk", async () => {
    const latest = (await build()).recommendMitigations(sampleInput).latestReport!;
    assert.ok(latest.risks.every((r) => r.recommendedMitigation.trim().length > 0));
    assert.ok(latest.risks.every((r) => r.residualRisk.length > 0));
  });

  test("7 produces machine-readable Business Risk Report with required fields and traceability", async () => {
    const latest = (await build()).produceBusinessRiskReport(sampleInput).latestReport!;
    assert.ok(latest.riskReportId.startsWith("brw-report-"));
    assert.equal(latest.businessBuildMissionId, "bbm-commerce-01");
    assert.equal(latest.businessBlueprintId, "bbw-blueprint-sample-01");
    assert.equal(latest.launchPlanId, "lpw-plan-sample-01");
    assert.ok(latest.timestamp);
    assert.ok(latest.risks.length >= 10);
    assert.ok(latest.risks.every((r) => r.supportingEvidence.length > 0));
    assert.ok(latest.facts.length > 0);
    assert.ok(latest.assumptions.length > 0);
    assert.equal(latest.metadataVersion, BRW_METADATA_VERSION);
    assert.equal(latest.reportVersion, BUSINESS_RISK_REPORT_VERSION);
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-06")));
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-07")));
    assert.ok(latest.prioritizedRiskIds.length >= 1);
  });

  test("8 rejects remove / approve / reject / launch / override / Q2-09 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { removeRisksAutomatically: true },
      { approveBusiness: true },
      { rejectBusiness: true },
      { launchBusiness: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ209OrLater: true },
    ] as const) {
      const report = engine.produceBusinessRiskReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("9 submits risk report through Executive Reporting Runtime", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createBusinessRiskWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-brw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectBusinessRiskWorker();
    const produced = engine.produceBusinessRiskReport(sampleInput);
    const submitted = engine.submitBusinessRiskReport({
      riskReportId: produced.latestReport!.riskReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_risk_report");
    assert.deepEqual(submittedIds, ["Q2-08"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-brw-001");
  });

  test("10 prioritizes by severity, distinguishes confirmed vs assumptions, and preserves audit history", async () => {
    const engine = await build();
    const latest = engine.produceBusinessRiskReport(sampleInput).latestReport!;
    const ranks = latest.risks.map((r) => r.priorityRank);
    assert.deepEqual(
      ranks,
      [...ranks].sort((a, b) => a - b),
    );
    assert.ok(latest.risks.some((r) => r.confirmed === true));
    assert.ok(latest.risks.some((r) => r.confirmed === false) || latest.assumptions.length > 0);
    assert.ok(
      latest.risks.some((r) => r.supportingEvidence.some((e) => e.kind === "fact")),
    );
    assert.ok(
      latest.risks.some((r) => r.supportingEvidence.some((e) => e.kind === "assumption")) ||
        latest.assumptions.length > 0,
    );
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-08");
    assert.equal(cockpit.neverApproveBusiness, true);
    assert.equal(cockpit.neverLaunchBusiness, true);
  });
});
