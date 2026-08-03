import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  APPROVAL_RECOMMENDATIONS,
  BAP_CAPABILITIES,
  BAP_INTEGRATION_TARGETS,
  BAP_METADATA_VERSION,
  BUSINESS_APPROVAL_PACK_VERSION,
  buildBusinessApprovalPackWorkerConfiguration,
  createBusinessApprovalPackWorker,
  resetBusinessApprovalPackWorkerForTesting,
} from "../../business-approval-pack-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createBusinessApprovalPackWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createBusinessApprovalPackWorker(bootstrap, config);
  await engine.initialize();
  engine.connectBusinessApprovalPackWorker();
  return engine;
}

const sampleModel = {
  businessModelId: "emg-model-sample-01",
  businessType: "commerce",
  businessModelType: "direct_to_consumer_catalog",
  valueProposition: "Commerce catalog for local retailers",
  productsServices: ["product catalog", "checkout"],
  customerSegments: ["local retailers"],
  revenueModel: "product_sales_and_margin_revenue",
  costModel: "lean_inventory_fulfillment_and_platform_fees",
  operatingModel: "catalog_fulfillment_and_customer_support",
  requiredCapabilities: ["catalog_ops", "fulfillment"],
  requiredIntegrations: ["shopify", "payments"],
  businessAssumptions: ["retailers adopt online catalog within 90 days"],
  sourceIntentId: "bii-intent-sample-01",
};

const sampleMarket = {
  reportId: "mrw-report-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  targetMarket: "local retailers",
  customerProblems: ["fragmented product discovery"],
  customerSegments: ["local retailers"],
  marketDemand: { demandLevel: "high", summary: "Strong local demand signals" },
  marketSize: { estimate: "regional_smb", confidence: "moderate" },
  competitorAnalysis: [{ name: "Incumbent Marketplace", strengths: ["brand"] }],
  industryTrends: ["omnichannel retail"],
  opportunitySize: { level: "attractive", summary: "Attractive regional opportunity" },
  barriersToEntry: ["platform fees"],
  risks: [{ description: "Price competition", severity: "moderate" }],
  confidenceScore: 72,
  recommendations: ["Validate supplier backup before soft launch"],
  missingInformation: ["seasonal demand curve"],
  facts: ["demand_level=high"],
  assumptions: ["local adoption continues"],
  sourceBusinessModelId: "emg-model-sample-01",
};

const sampleOpportunity = {
  evaluationId: "oew-eval-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  demandScore: 78,
  feasibilityScore: 74,
  profitPotentialScore: 71,
  riskScore: 45,
  strategicFitScore: 80,
  overallOpportunityScore: 76.2,
  recommendation: "Proceed",
  confidenceScore: 75,
  facts: ["overall_opportunity_score=76.2"],
  assumptions: ["fulfillment SLA achievable"],
  missingInformation: [],
  sourceBusinessModelId: "emg-model-sample-01",
  sourceMarketResearchReportId: "mrw-report-sample-01",
};

const sampleBlueprint = {
  blueprintId: "bbw-blueprint-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessObjective: "Build an executable commerce business for local retailers",
  productsServices: ["product catalog", "checkout offers"],
  customerSegments: ["local retailers"],
  valueProposition: "Deliver commerce value to local retailers via Shopify",
  requiredWorkers: [{ workerRole: "role-operations-specialist", priority: "critical" }],
  requiredIntegrations: ["shopify", "payments", "fulfillment"],
  requiredAssets: ["offer_catalog"],
  dependencies: [{ description: "Integrations before delivery ops" }],
  businessArchitecture: {
    revenueModel: "product_sales_and_margin_revenue",
    costModel: "lean_inventory_fulfillment_and_platform_fees",
    operatingModel: "catalog_fulfillment_and_customer_support_via_shopify",
    targetMarket: "local retailers",
    deliveryChannels: ["online_storefront"],
  },
  preservedDecisions: ["opportunity_recommendation=Proceed"],
  traceabilityRefs: ["q2-05:opportunity_evaluation:oew-eval-sample-01"],
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
    { stageKey: "soft_launch", name: "Soft Launch" },
  ],
  milestones: [{ milestoneId: "ms-01", name: "integrations_ready" }],
  tasks: [{ taskId: "t-01", name: "configure_shopify" }],
  approvalCheckpoints: [{ checkpointId: "apr-01", name: "Pillow launch readiness" }],
  validationCheckpoints: [{ checkpointId: "val-01", name: "Integration validation" }],
  blockers: [{ description: "Payment provider KYC incomplete", severity: "high" }],
  missingPrerequisites: ["supplier_backup_identified"],
  rollbackConditions: [{ description: "Checkout failure rate > 5%", action: "pause" }],
  preservedDecisions: ["opportunity_recommendation=Proceed"],
  traceabilityRefs: ["q2-06:business_blueprint:bbw-blueprint-sample-01"],
};

const sampleRisk = {
  riskReportId: "brw-report-sample-01",
  businessBuildMissionId: "bbm-commerce-01",
  businessBlueprintId: "bbw-blueprint-sample-01",
  launchPlanId: "lpw-plan-sample-01",
  businessType: "commerce",
  overallPortfolioRiskRating: "high",
  highOrCriticalCount: 2,
  risks: [
    {
      riskId: "risk-01",
      riskCategory: "marketplace_platform",
      riskDescription: "Platform dependency risk",
      overallRiskRating: "high",
      recommendedMitigation: "Diversify channels",
      confirmed: true,
    },
    {
      riskId: "risk-02",
      riskCategory: "execution",
      riskDescription: "Open launch blockers",
      overallRiskRating: "high",
      recommendedMitigation: "Close KYC and supplier gaps",
      confirmed: true,
    },
  ],
  missingInformation: ["explicit_launch_blocker_register"],
  assumptions: ["supplier_backup available within 30 days"],
  facts: ["portfolio_rating=high"],
  prioritizedRiskIds: ["risk-01", "risk-02"],
  preservedDecisions: ["opportunity_recommendation=Proceed"],
  traceabilityRefs: [
    "q2-06:business_blueprint:bbw-blueprint-sample-01",
    "q2-07:launch_plan:lpw-plan-sample-01",
  ],
};

const sampleInput = {
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessModel: sampleModel,
  marketResearch: sampleMarket,
  opportunityEvaluation: sampleOpportunity,
  businessBlueprint: sampleBlueprint,
  launchPlan: sampleLaunchPlan,
  businessRiskReport: sampleRisk,
  validated: true,
};

describe("Q2-09 Business Approval Pack Worker", () => {
  beforeEach(resetBusinessApprovalPackWorkerForTesting);

  test("1 locks mandatory business-approval-pack-worker boundaries", () => {
    const c = buildBusinessApprovalPackWorkerConfiguration(REPO_ROOT, {
      neverApproveBusiness: false as never,
      neverLaunchBusiness: false as never,
      neverModifyPreviousReports: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ210OrLater: false as never,
    });
    assert.equal(c.neverApproveBusiness, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverModifyPreviousReports, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ210OrLater, true);
  });

  test("2 initializes PILLOW-BAP-001 for Q2-09 with required integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-09");
    assert.equal(state.engineVersion, "PILLOW-BAP-001");
    assert.equal(state.configuration.workerId, "wkr-business-approval-pack-01");
    for (const target of [
      "business_model_generator",
      "market_research_worker",
      "opportunity_evaluation_worker",
      "business_blueprint_worker",
      "launch_plan_worker",
      "business_risk_worker",
      "executive_reporting_runtime",
      ...BAP_INTEGRATION_TARGETS.filter((t) => t === "worker_registry"),
    ]) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(BAP_CAPABILITIES.includes("produce_machine_readable_business_approval_pack"));
    assert.deepEqual([...APPROVAL_RECOMMENDATIONS], ["Proceed", "Revise", "Reject"]);
  });

  test("3 receives upstream artifacts incrementally and consolidates when complete", async () => {
    const engine = await build();
    const partial = engine.receiveBusinessModel({
      businessModel: sampleModel,
      validated: true,
    });
    assert.equal(partial.action, "receive_business_model");
    assert.equal(partial.validation.decision, "partial");
    assert.equal(partial.latestPack, null);

    engine.receiveMarketResearch({ marketResearch: sampleMarket, validated: true });
    engine.receiveOpportunityEvaluation({
      opportunityEvaluation: sampleOpportunity,
      validated: true,
    });
    engine.receiveBusinessBlueprint({ businessBlueprint: sampleBlueprint, validated: true });
    engine.receiveLaunchPlan({ launchPlan: sampleLaunchPlan, validated: true });
    const complete = engine.receiveBusinessRiskReport({
      businessRiskReport: sampleRisk,
      validated: true,
    });
    assert.equal(complete.action, "receive_risk_report");
    assert.ok(complete.latestPack);
    assert.equal(complete.latestPack!.businessBuildMissionId, "bbm-commerce-01");
  });

  test("4 consolidates all Q2 planning outputs into summaries", async () => {
    const latest = (await build()).consolidateFindings(sampleInput).latestPack!;
    assert.ok(latest.businessOverview.length > 0);
    assert.ok(latest.opportunitySummary.includes("76.2"));
    assert.ok(latest.marketSummary.includes("local retailers"));
    assert.ok(latest.businessModelSummary.includes("direct_to_consumer_catalog"));
    assert.ok(latest.blueprintSummary.includes("bbw-blueprint-sample-01"));
    assert.ok(latest.launchSummary.includes("lpw-plan-sample-01"));
    assert.ok(latest.riskSummary.includes("brw-report-sample-01"));
  });

  test("5 produces executive summary and highlights opportunities and risks", async () => {
    const latest = (await build()).produceExecutiveSummary(sampleInput).latestPack!;
    assert.ok(latest.executiveSummary.includes("recommends"));
    assert.ok(latest.majorOpportunities.length >= 1);
    assert.ok(latest.majorRisks.length >= 1);
    assert.ok(latest.requiredApprovals.some((a) => a.includes("grand_king")));
  });

  test("6 identifies outstanding issues and unresolved risks", async () => {
    const latest = (await build()).produceBusinessApprovalPack(sampleInput).latestPack!;
    assert.ok(latest.outstandingIssues.some((i) => i.includes("supplier_backup")));
    assert.ok(latest.unresolvedRisks.length >= 1);
    assert.ok(latest.requiredGrandKingDecisions.length >= 1);
  });

  test("7 produces machine-readable Business Approval Pack with required fields", async () => {
    const latest = (await build()).produceBusinessApprovalPack(sampleInput).latestPack!;
    assert.ok(latest.approvalPackId.startsWith("bap-pack-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessBuildMissionId, "bbm-commerce-01");
    assert.ok(latest.executiveSummary.length > 0);
    assert.ok(["Proceed", "Revise", "Reject"].includes(latest.recommendation));
    assert.equal(latest.metadataVersion, BAP_METADATA_VERSION);
    assert.equal(latest.packVersion, BUSINESS_APPROVAL_PACK_VERSION);
    assert.equal(latest.sourceRefs.businessModelId, "emg-model-sample-01");
    assert.equal(latest.sourceRefs.marketResearchReportId, "mrw-report-sample-01");
    assert.equal(latest.sourceRefs.opportunityEvaluationId, "oew-eval-sample-01");
    assert.equal(latest.sourceRefs.businessBlueprintId, "bbw-blueprint-sample-01");
    assert.equal(latest.sourceRefs.launchPlanId, "lpw-plan-sample-01");
    assert.equal(latest.sourceRefs.businessRiskReportId, "brw-report-sample-01");
    assert.ok(latest.facts.length > 0);
    assert.ok(latest.recommendationsOnly.length > 0);
    assert.ok(latest.supportingEvidence.some((e) => e.kind === "fact"));
    assert.ok(latest.supportingEvidence.some((e) => e.kind === "recommendation"));
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-03")));
    assert.ok(latest.traceabilityRefs.some((r) => r.includes("q2-08")));
  });

  test("8 rejects approve / launch / modify / override / Q2-10 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { approveBusiness: true },
      { launchBusiness: true },
      { modifyPreviousReports: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ210OrLater: true },
    ] as const) {
      const report = engine.produceBusinessApprovalPack({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestPack, null);
    }
  });

  test("9 submits approval pack through Executive Reporting Runtime", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createBusinessApprovalPackWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-bap-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectBusinessApprovalPackWorker();
    const produced = engine.produceBusinessApprovalPack(sampleInput);
    const submitted = engine.submitBusinessApprovalPack({
      approvalPackId: produced.latestPack!.approvalPackId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_approval_pack");
    assert.deepEqual(submittedIds, ["Q2-09"]);
    assert.equal(submitted.latestPack!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestPack!.executiveReportId, "ert-worker-bap-001");
  });

  test("10 never mutates upstream inputs and preserves audit history", async () => {
    const engine = await build();
    const frozenModel = structuredClone(sampleModel);
    const frozenRisk = structuredClone(sampleRisk);
    const latest = engine.produceBusinessApprovalPack(sampleInput).latestPack!;
    assert.deepEqual(sampleModel, frozenModel);
    assert.deepEqual(sampleRisk, frozenRisk);
    assert.equal(latest.neverModifyPreviousReports, true);
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-09");
    assert.equal(cockpit.neverApproveBusiness, true);
    assert.equal(cockpit.neverLaunchBusiness, true);
    assert.equal(cockpit.neverModifyPreviousReports, true);
  });
});
