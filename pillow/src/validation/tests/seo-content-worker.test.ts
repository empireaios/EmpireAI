import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  SEOW_METADATA_VERSION,
  SEO_CONTENT_REPORT_VERSION,
  buildSeoContentWorkerConfiguration,
  createSeoContentWorker,
  resetSeoContentWorkerForTesting,
  type SeowInput,
} from "../../seo-content-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleOpportunity() {
  return {
    reportId: "aow-rpt-0001",
    affiliateProjectId: "afc-prj-travel-gear-01",
    affiliateBusinessId: "afc-biz-travel-gear-01",
    programmeName: "TravelGear Partners",
    productCategory: "travel_gear",
    targetNiche: "travel_gear",
    opportunityScore: 78,
    products: [
      {
        productId: "prod-backpack-01",
        name: "TrailBackpack Pro",
        category: "travel_gear",
        programmeId: "prog-travel-gear-01",
      },
    ],
  };
}

function sampleReview() {
  return {
    reportId: "rcw-rpt-0001",
    affiliateProjectId: "afc-prj-travel-gear-01",
    affiliateBusinessId: "afc-biz-travel-gear-01",
    productId: "prod-backpack-01",
    productOrServiceReviewed: "TrailBackpack Pro",
    reviewSummary: "Evidence-based review of TrailBackpack Pro.",
    pros: ["Durable shell", "Comfortable harness"],
    cons: ["Premium price"],
    reviewArticle: {
      title: "TrailBackpack Pro review",
      summary: "Evidence-based review",
      keyFeatures: ["waterproof", "laptop_sleeve"],
      faqs: [
        {
          question: "Who is TrailBackpack Pro best for?",
          answer: "Ideal for weekend hikers",
        },
      ],
      sections: [{ heading: "Overview", body: "Review overview" }],
    },
    buyingRecommendation: {
      verdict: "buy_with_conditions",
      summary: "Buy with conditions for weekend hikers",
    },
  };
}

function sampleInput(overrides: Partial<SeowInput> = {}): SeowInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    topic: "travel_gear",
    fixtureOpportunity: sampleOpportunity(),
    fixtureReview: sampleReview(),
    fixtureKeywords: [
      { keyword: "best travel backpack", intent: "commercial", cluster: "travel_gear", primary: true },
      { keyword: "TrailBackpack Pro review", intent: "commercial", cluster: "travel_gear" },
      { keyword: "travel gear buying guide", intent: "informational", cluster: "travel_gear" },
    ],
    fixtureClusterTopics: [
      "travel_gear comparison",
      "travel_gear review",
      "travel_gear buying guide",
    ],
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createSeoContentWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSeoContentWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-05 SEO Content Worker", () => {
  beforeEach(resetSeoContentWorkerForTesting);

  test("1 locks mandatory seo-content-worker boundaries", () => {
    const c = buildSeoContentWorkerConfiguration(REPO_ROOT, {
      neverFabricateSeoPerformanceClaims: false as never,
      neverPublishArticles: false as never,
      neverManipulateSearchRankings: false as never,
      neverReplaceAnalyticsWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ806OrLater: false as never,
    });
    assert.equal(c.neverFabricateSeoPerformanceClaims, true);
    assert.equal(c.neverPublishArticles, true);
    assert.equal(c.neverManipulateSearchRankings, true);
    assert.equal(c.neverReplaceAnalyticsWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ806OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
  });

  test("2 initializes PILLOW-SEOW-001 for Q8-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-05");
    assert.equal(state.engineVersion, "PILLOW-SEOW-001");
    assert.equal(state.configuration.workerId, "wkr-seo-content-01");
  });

  test("3 consumes opportunity + review reports", async () => {
    const engine = await build();
    const opp = engine.consumeAffiliateOpportunityReport(sampleInput());
    const rev = engine.consumeReviewContentReport(sampleInput());
    assert.equal(opp.validation.decision, "pass");
    assert.equal(rev.validation.decision, "pass");
    assert.match(opp.notes.join(" "), /aow-rpt-0001|Consumed/);
    assert.match(rev.notes.join(" "), /rcw-rpt-0001|Consumed/);
  });

  test("4 generates SEO content plan", async () => {
    const result = (await build()).generateSeoContentPlan(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.contentPlan);
    assert.ok(result.contentPlan!.pillarPage);
    assert.ok(result.contentPlan!.clusters.length >= 1);
    assert.equal(result.contentPlan!.fabricated, false);
  });

  test("5 generates article brief", async () => {
    const result = (await build()).generateArticleBrief(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.articleBrief);
    assert.ok(result.articleBrief!.primaryKeyword);
    assert.ok(result.articleBrief!.outline.length >= 1);
    assert.ok(result.articleBrief!.metaTitle);
    assert.equal(result.articleBrief!.fabricated, false);
  });

  test("6 generates SEO article", async () => {
    const result = (await build()).generateSeoArticle(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.seoArticle);
    assert.ok(result.seoArticle!.headingStructure.length >= 1);
    assert.ok(result.seoArticle!.bodySections.length >= 1);
    assert.equal(result.seoArticle!.fabricated, false);
  });

  test("7 completes keyword mapping", async () => {
    const result = (await build()).generateKeywordMapping(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.targetKeywords!.length >= 2);
    assert.ok(result.targetKeywords!.some((k) => k.role === "primary"));
    assert.equal(result.targetKeywords![0].fabricated, false);
  });

  test("8 generates internal linking recommendations", async () => {
    const result = (await build()).generateInternalLinkingPlan(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.internalLinkingPlan!.length >= 1);
    assert.ok(result.internalLinkingPlan![0].fromPage);
    assert.ok(result.internalLinkingPlan![0].toPage);
    assert.equal(result.internalLinkingPlan![0].fabricated, false);
  });

  test("9 full SEO Content Report + consumableByQ806", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.consumeAffiliateOpportunityReport(input);
    engine.consumeReviewContentReport(input);
    engine.generateSeoContentPlan(input);
    engine.generateKeywordMapping(input);
    engine.generateArticleBrief(input);
    engine.generateSeoArticle(input);
    engine.generateInternalLinkingPlan(input);
    engine.evaluateContentCompleteness(input);
    const produced = engine.produceSeoContentReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.ok(report.contentPlan);
    assert.ok(report.targetKeywords.length >= 1);
    assert.ok(report.searchIntent);
    assert.ok(report.articleBrief);
    assert.ok(report.seoArticle);
    assert.ok(report.internalLinkingPlan.length >= 1);
    assert.ok(report.contentQualitySummary);
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, SEOW_METADATA_VERSION);
    assert.equal(report.reportVersion, SEO_CONTENT_REPORT_VERSION);
    assert.equal(report.consumableByQ806, true);
    assert.equal(report.neverFabricateSeoPerformanceClaims, true);
    assert.equal(report.neverPublishArticles, true);
    assert.equal(report.neverImplementQ806OrLater, true);
    assert.ok(report.versionHistory.length >= 1);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createSeoContentWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-seow-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.produceSeoContentReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-seow-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-06 / fabricate / publish / manipulate / replace-analytics / override", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ806OrLater: true }),
      sampleInput({ missionId: "Q8-06" }),
      sampleInput({ fabricateSeoPerformanceClaims: true }),
      sampleInput({ publishArticles: true }),
      sampleInput({ manipulateSearchRankings: true }),
      sampleInput({ replaceAnalyticsWorker: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.generateSeoContentPlan(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-06 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ806ConsumableContract();
    assert.equal(contract.contractVersion, "SEOW-Q806-v1");
    assert.equal(contract.consumableByQ806, true);
    assert.ok(contract.fields.includes("seoArticle"));
    assert.ok(contract.fields.includes("contentPlan"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-05");
    assert.equal(cockpit.neverFabricateSeoPerformanceClaims, true);
    assert.equal(cockpit.neverImplementQ806OrLater, true);
    assert.equal(cockpit.consumableByQ806, true);
  });
});
