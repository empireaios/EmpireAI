import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DEFAULT_SCORE_WEIGHTS,
  OEW_CAPABILITIES,
  OEW_INTEGRATION_TARGETS,
  OEW_METADATA_VERSION,
  OPPORTUNITY_EVALUATION_REPORT_VERSION,
  OEW_RECOMMENDATIONS,
  buildOpportunityEvaluationWorkerConfiguration,
  createOpportunityEvaluationWorker,
  resetOpportunityEvaluationWorkerForTesting,
} from "../../opportunity-evaluation-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createOpportunityEvaluationWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createOpportunityEvaluationWorker(bootstrap, config);
  await engine.initialize();
  engine.connectOpportunityEvaluationWorker();
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
  requiredCapabilities: ["catalog_management", "order_fulfillment", "customer_acquisition"],
  requiredIntegrations: ["shopify", "payments", "fulfillment"],
  businessAssumptions: ["demand_not_validated_in_q2_03"],
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
  marketDemand: {
    demandLevel: "high",
    summary: "Strong local ecommerce demand signals",
    demandSignals: ["growing local ecommerce adoption", "underserved niche fulfillment"],
    facts: ["Local retailers report growing online order demand"],
    assumptions: ["demand_level_inferred_from_signal_balance=high"],
  },
  marketSize: {
    tamSummary: "TAM large relative opportunity units",
    samSummary: "SAM medium-large for local retailers",
    somSummary: "SOM focused near-term capture",
    sizingBasis: "evidence_backed_relative_sizing",
    facts: [],
    assumptions: ["relative_size_band=broad"],
  },
  competitorAnalysis: [
    {
      name: "MegaMart Online",
      strengths: ["brand_reach"],
      weaknesses: ["weak_local_specialization"],
    },
  ],
  industryTrends: ["direct_to_consumer_growth", "checkout_conversion_optimization"],
  opportunitySize: {
    opportunityLevel: "high",
    summary: "High relative opportunity",
    estimatedRelativeOpportunity: "high_relative_opportunity",
    facts: [],
    assumptions: ["opportunity_inferred_from_demand=high"],
  },
  barriersToEntry: ["inventory_capital", "paid_acquisition_costs"],
  risks: [
    {
      category: "competition",
      description: "Incumbent response risk",
      severity: "moderate",
    },
  ],
  confidenceScore: 0.72,
  supportingEvidence: [
    {
      source: "category_brief",
      claim: "Local retailers report growing online order demand",
      kind: "fact",
      relatedTopic: "market_demand",
    },
  ],
  missingInformation: ["primary_market_size_data"],
  facts: ["Local retailers report growing online order demand"],
  assumptions: ["relative_size_band=broad"],
};

const sampleInput = {
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  businessModel: sampleBusinessModel,
  marketResearch: sampleMarketResearch,
  validated: true,
};

describe("Q2-05 Opportunity Evaluation Worker", () => {
  beforeEach(resetOpportunityEvaluationWorkerForTesting);

  test("1 locks mandatory opportunity-evaluation-worker boundaries", () => {
    const c = buildOpportunityEvaluationWorkerConfiguration(REPO_ROOT, {
      neverApproveBusiness: false as never,
      neverModifyBusinessModel: false as never,
      neverLaunchBusiness: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ206OrLater: false as never,
    });
    assert.equal(c.neverApproveBusiness, true);
    assert.equal(c.neverModifyBusinessModel, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ206OrLater, true);
  });

  test("2 initializes PILLOW-OEW-001 for Q2-05 with integrations and weights", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-05");
    assert.equal(state.engineVersion, "PILLOW-OEW-001");
    assert.equal(state.configuration.workerId, "wkr-opportunity-evaluation-01");
    assert.equal(state.configuration.scoreWeights.demand, DEFAULT_SCORE_WEIGHTS.demand);
    for (const target of OEW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(OEW_CAPABILITIES.includes("generate_weighted_opportunity_scores"));
  });

  test("3 receives Business Model and Market Research Report", async () => {
    const engine = await build();
    const modelReport = engine.receiveBusinessModel({
      businessModel: sampleBusinessModel,
      validated: true,
    });
    assert.equal(modelReport.action, "receive_business_model");
    assert.equal(modelReport.validation.decision, "partial");

    const researchReport = engine.receiveMarketResearch({
      marketResearch: sampleMarketResearch,
      validated: true,
    });
    assert.equal(researchReport.action, "receive_market_research");
    assert.ok(researchReport.latestEvaluation);
    assert.equal(researchReport.validation.decision, "pass");
  });

  test("4 evaluates demand, feasibility, profit, risk, and strategic fit scores", async () => {
    const report = (await build()).produceOpportunityEvaluation(sampleInput);
    const latest = report.latestEvaluation!;
    assert.ok(latest.demandScore >= 0 && latest.demandScore <= 100);
    assert.ok(latest.feasibilityScore >= 0 && latest.feasibilityScore <= 100);
    assert.ok(latest.profitPotentialScore >= 0 && latest.profitPotentialScore <= 100);
    assert.ok(latest.riskScore >= 0 && latest.riskScore <= 100);
    assert.ok(latest.strategicFitScore >= 0 && latest.strategicFitScore <= 100);
    assert.ok(latest.scoreExplanations.demand.explanation.length > 0);
    assert.ok(latest.scoreExplanations.feasibility.explanation.length > 0);
    assert.ok(latest.scoreExplanations.revenuePotential.explanation.length > 0);
    assert.ok(latest.scoreExplanations.operationalComplexity.explanation.length > 0);
    assert.ok(latest.scoreExplanations.executionRisk.explanation.length > 0);
    assert.ok(latest.scoreExplanations.strategicFit.explanation.length > 0);
  });

  test("5 generates weighted overall score and Proceed/Improve/Reject recommendation", async () => {
    const latest = (await build()).produceOpportunityEvaluation(sampleInput).latestEvaluation!;
    assert.ok(latest.overallOpportunityScore >= 0 && latest.overallOpportunityScore <= 100);
    assert.ok(OEW_RECOMMENDATIONS.includes(latest.recommendation));
    assert.ok(latest.scoreExplanations.overall.explanation.includes("weights"));
  });

  test("6 produces machine-readable Opportunity Evaluation Report with required fields", async () => {
    const latest = (await build()).produceOpportunityEvaluation(sampleInput).latestEvaluation!;
    assert.ok(latest.evaluationId.startsWith("oew-eval-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessBuildMissionId, "bbm-commerce-01");
    assert.equal(latest.businessType, "commerce");
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, OEW_METADATA_VERSION);
    assert.equal(latest.reportVersion, OPPORTUNITY_EVALUATION_REPORT_VERSION);
    assert.equal(latest.sourceBusinessModelId, "emg-model-sample-01");
    assert.equal(latest.sourceMarketResearchReportId, "mrw-report-sample-01");
    assert.ok(latest.facts.length >= 1);
    assert.ok(latest.assumptions.length >= 1);
  });

  test("7 rejects approve / modify / launch / override / Q2-06 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { approveBusiness: true },
      { modifyBusinessModel: true },
      { launchBusiness: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ206OrLater: true },
    ] as const) {
      const report = engine.produceOpportunityEvaluation({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestEvaluation, null);
    }
  });

  test("8 requires both prior-worker payloads for full evaluation", async () => {
    const report = (await build()).produceOpportunityEvaluation({
      businessModel: sampleBusinessModel,
      validated: true,
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(
      report.validation.errors.some((e) =>
        /businessModel and marketResearch/i.test(e),
      ),
    );
  });

  test("9 submits evaluation through Executive Reporting Runtime", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createOpportunityEvaluationWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-oew-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectOpportunityEvaluationWorker();
    const produced = engine.produceOpportunityEvaluation(sampleInput);
    const submitted = engine.submitEvaluationReport({
      evaluationId: produced.latestEvaluation!.evaluationId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q2-05"]);
    assert.equal(submitted.latestEvaluation!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestEvaluation!.executiveReportId, "ert-worker-oew-001");
  });

  test("10 preserves audit history and cockpit boundaries", async () => {
    const engine = await build();
    engine.produceOpportunityEvaluation(sampleInput);
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-05");
    assert.equal(cockpit.neverApproveBusiness, true);
    assert.equal(cockpit.neverLaunchBusiness, true);
    assert.ok(cockpit.totalEvaluations >= 1);
    assert.ok(cockpit.lastOverallScore != null);
  });
});
