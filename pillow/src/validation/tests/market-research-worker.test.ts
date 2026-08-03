import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  INTEGRATION_TARGETS,
  MARKET_RESEARCH_REPORT_VERSION,
  MRW_CAPABILITIES,
  MRW_METADATA_VERSION,
  buildMarketResearchWorkerConfiguration,
  createMarketResearchWorker,
  resetMarketResearchWorkerForTesting,
} from "../../market-research-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMarketResearchWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMarketResearchWorker(bootstrap, config);
  await engine.initialize();
  engine.connectMarketResearchWorker();
  return engine;
}

const sampleInput = {
  businessBuildMissionId: "bbm-commerce-01",
  businessType: "commerce",
  targetMarket: "local retailers",
  businessIdea: "Build a commerce business for local retailers via Shopify",
  originalCommand: "Build a commerce business for local retailers via Shopify under $5000",
  sourceBusinessModelId: "emg-model-sample-01",
  sourceIntentId: "bii-intent-sample-01",
  customerProblems: ["fragmented product discovery", "unreliable fulfillment"],
  customerSegments: ["local retailers", "nearby small shops"],
  knownCompetitors: [
    {
      name: "MegaMart Online",
      strengths: ["brand_reach", "logistics_network"],
      weaknesses: ["weak_local_specialization", "slow_niche_customization"],
      notes: "National ecommerce incumbent",
    },
  ],
  evidenceSources: [
    {
      source: "category_brief",
      claim: "Local retailers report growing online order demand",
      kind: "fact",
      relatedTopic: "market_demand",
    },
    {
      source: "operator_estimate",
      claim: "Addressable local commerce SAM is medium-large",
      kind: "assumption",
      relatedTopic: "market_size",
    },
  ],
  marketSignals: ["growing local ecommerce adoption", "underserved niche fulfillment"],
  validated: true,
};

describe("Q2-04 Market Research Worker", () => {
  beforeEach(resetMarketResearchWorkerForTesting);

  test("1 locks mandatory market-research-worker boundaries", () => {
    const c = buildMarketResearchWorkerConfiguration(REPO_ROOT, {
      neverDecideWhetherToBuild: false as never,
      neverGenerateBranding: false as never,
      neverBuildMarketingPlans: false as never,
      neverLaunchBusiness: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ205OrLater: false as never,
    });
    assert.equal(c.neverDecideWhetherToBuild, true);
    assert.equal(c.neverGenerateBranding, true);
    assert.equal(c.neverBuildMarketingPlans, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ205OrLater, true);
  });

  test("2 initializes PILLOW-MRW-001 for Q2-04 with workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-04");
    assert.equal(state.engineVersion, "PILLOW-MRW-001");
    assert.equal(state.configuration.workerId, "wkr-market-research-01");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(MRW_CAPABILITIES.includes("research_market_demand"));
  });

  test("3 researches market demand with evidence and confidence", async () => {
    const report = (await build()).researchMarketDemand(sampleInput);
    assert.equal(report.action, "research_demand");
    assert.ok(report.latestReport);
    assert.ok(["low", "moderate", "high", "unclear"].includes(report.latestReport!.marketDemand.demandLevel));
    assert.ok(report.latestReport!.marketDemand.demandSignals.length >= 1);
    assert.ok(report.latestReport!.confidenceScore > 0);
    assert.equal(report.validation.decision, "pass");
  });

  test("4 analyses competitors with strengths and weaknesses", async () => {
    const report = (await build()).analyseCompetitors(sampleInput);
    const competitors = report.latestReport!.competitorAnalysis;
    assert.ok(competitors.length >= 1);
    assert.equal(competitors[0]!.name, "MegaMart Online");
    assert.ok(competitors[0]!.strengths.includes("brand_reach"));
    assert.ok(competitors[0]!.weaknesses.includes("weak_local_specialization"));
  });

  test("5 analyses customer problems and segments", async () => {
    const report = (await build()).analyseCustomerProblems(sampleInput);
    const latest = report.latestReport!;
    assert.ok(latest.customerProblems.includes("fragmented product discovery"));
    assert.ok(latest.customerSegments.includes("local retailers"));
    assert.equal(latest.targetMarket, "local retailers");
  });

  test("6 estimates opportunity size and identifies market risks", async () => {
    const engine = await build();
    const opportunity = engine.estimateOpportunitySize(sampleInput);
    const risks = engine.identifyMarketRisks(sampleInput);
    assert.ok(
      ["low", "moderate", "high", "unclear"].includes(
        opportunity.latestReport!.opportunitySize.opportunityLevel,
      ),
    );
    assert.ok(risks.latestReport!.risks.length >= 1);
    assert.ok(risks.latestReport!.barriersToEntry.length >= 1);
  });

  test("7 produces machine-readable Market Research Report with required fields", async () => {
    const report = (await build()).produceMarketResearchReport(sampleInput);
    const latest = report.latestReport!;
    assert.ok(latest.reportId.startsWith("mrw-report-"));
    assert.equal(latest.businessBuildMissionId, "bbm-commerce-01");
    assert.equal(latest.businessType, "commerce");
    assert.ok(latest.timestamp);
    assert.ok(latest.marketSize.tamSummary.length > 0);
    assert.ok(latest.industryTrends.length >= 1);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.recommendations.length >= 1);
    assert.equal(latest.metadataVersion, MRW_METADATA_VERSION);
    assert.equal(latest.reportVersion, MARKET_RESEARCH_REPORT_VERSION);
    assert.ok(latest.facts.length >= 1);
    assert.ok(latest.assumptions.length >= 1);
    assert.ok(latest.missingInformation.length >= 0);
  });

  test("8 rejects build / branding / marketing / launch / override / Q2-05 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { decideWhetherToBuild: true },
      { generateBranding: true },
      { buildMarketingPlan: true },
      { launchBusiness: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ205OrLater: true },
    ] as const) {
      const report = engine.produceMarketResearchReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("9 submits findings through Executive Reporting Runtime integration surface", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createMarketResearchWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-mrw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectMarketResearchWorker();
    const produced = engine.produceMarketResearchReport(sampleInput);
    const submitted = engine.submitFindings({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q2-04"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-mrw-001");
  });

  test("10 preserves audit history and cockpit boundaries", async () => {
    const engine = await build();
    engine.produceMarketResearchReport(sampleInput);
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-04");
    assert.equal(cockpit.neverDecideWhetherToBuild, true);
    assert.equal(cockpit.neverLaunchBusiness, true);
    assert.ok(cockpit.totalReports >= 1);
  });
});
