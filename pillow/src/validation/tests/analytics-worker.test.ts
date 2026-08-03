import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ANW_METADATA_VERSION,
  ANALYTICS_REPORT_VERSION,
  buildAnalyticsWorkerConfiguration,
  createAnalyticsWorker,
  resetAnalyticsWorkerForTesting,
  type AnwInput,
} from "../../analytics-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleMetrics() {
  return {
    clicks: 1200,
    uniqueClicks: 980,
    impressions: 40000,
    conversions: 36,
    commissionAmount: 288,
    revenueAmount: 3600,
    currency: "USD",
    organicSessions: 5400,
    averageRank: 18.5,
    rankingKeywords: 42,
    funnelStarts: 800,
    funnelCompletions: 96,
    emailOpens: 420,
    emailClicks: 88,
    periodLabel: "2026-Q2",
    priorPeriod: {
      clicks: 900,
      conversions: 40,
      commissionAmount: 320,
      organicSessions: 5000,
    },
  };
}

function sampleInput(overrides: Partial<AnwInput> = {}): AnwInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    periodLabel: "2026-Q2",
    fixtureMetrics: sampleMetrics(),
    fixtureOpportunity: {
      reportId: "aow-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      affiliateBusinessId: "afc-biz-travel-gear-01",
      opportunityScore: 78,
      productCategory: "travel_gear",
    },
    fixtureSeo: {
      reportId: "seow-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      topic: "travel_gear",
      contentQualitySummary: { completenessScore: 0.85 },
      targetKeywords: [{ keyword: "best travel backpack" }],
    },
    fixtureFunnel: {
      reportId: "efw-rpt-0001",
      affiliateProjectId: "afc-prj-travel-gear-01",
      funnelName: "travel_gear email funnel",
      funnelStages: [
        { stageType: "capture", name: "Capture" },
        { stageType: "welcome", name: "Welcome" },
        { stageType: "nurture", name: "Nurture" },
      ],
      conversionObjectives: ["Capture subscriber", "Guide toward consideration"],
    },
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createAnalyticsWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAnalyticsWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-07 Analytics Worker", () => {
  beforeEach(resetAnalyticsWorkerForTesting);

  test("1 locks mandatory analytics-worker boundaries", () => {
    const c = buildAnalyticsWorkerConfiguration(REPO_ROOT, {
      neverFabricateAnalyticsOrPerformanceResults: false as never,
      neverModifyCampaignsAutomatically: false as never,
      neverManipulateAnalytics: false as never,
      neverReplaceAffiliateComplianceWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ808OrLater: false as never,
    });
    assert.equal(c.neverFabricateAnalyticsOrPerformanceResults, true);
    assert.equal(c.neverModifyCampaignsAutomatically, true);
    assert.equal(c.neverManipulateAnalytics, true);
    assert.equal(c.neverReplaceAffiliateComplianceWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ808OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAnalyticsHistory, true);
  });

  test("2 initializes PILLOW-ANW-001 for Q8-07", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-07");
    assert.equal(state.engineVersion, "PILLOW-ANW-001");
    assert.equal(state.configuration.workerId, "wkr-analytics-01");
  });

  test("3 tracks clicks", async () => {
    const result = (await build()).trackClicks(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.clickMetrics!.clicks, 1200);
    assert.ok(result.clickMetrics!.ctr != null);
    assert.equal(result.clickMetrics!.fabricated, false);
  });

  test("4 tracks conversions", async () => {
    const result = (await build()).trackConversions(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.conversionMetrics!.conversions, 36);
    assert.ok(result.conversionMetrics!.conversionRate != null);
    assert.equal(result.conversionMetrics!.fabricated, false);
  });

  test("5 tracks commissions and revenue", async () => {
    const result = (await build()).trackCommissions(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.commissionSummary!.commissionAmount, 288);
    assert.ok(result.commissionSummary!.epc != null);
    assert.equal(result.revenueSummary!.revenueAmount, 3600);
    assert.equal(result.commissionSummary!.fabricated, false);
  });

  test("6 measures SEO performance", async () => {
    const result = (await build()).measureSeoPerformance(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.seoPerformance!.organicSessions, 5400);
    assert.equal(result.seoPerformance!.averageRank, 18.5);
    assert.equal(result.seoPerformance!.fabricated, false);
  });

  test("7 analyses funnel + recommends optimisations", async () => {
    const engine = await build();
    const funnel = engine.analyseFunnelPerformance(sampleInput());
    const opts = engine.recommendOptimisations(sampleInput());
    assert.equal(funnel.validation.decision, "pass");
    assert.ok(funnel.funnelPerformance!.completionRate != null);
    assert.equal(opts.validation.decision, "pass");
    assert.ok(opts.optimisationOpportunities!.length >= 1);
    assert.equal(opts.optimisationOpportunities![0].fabricated, false);
  });

  test("8 preserves historical metrics", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.produceAnalyticsReport(input);
    engine.produceAnalyticsReport({
      ...input,
      periodLabel: "2026-Q3",
      fixtureMetrics: { ...sampleMetrics(), clicks: 1300, periodLabel: "2026-Q3" },
    });
    const history = engine.getHistory();
    assert.ok(history.length >= 2);
    assert.ok(history.every((h) => h.reportId && h.timestamp));
  });

  test("9 full Analytics Report + consumableByQ808", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.collectPerformanceMetrics(input);
    engine.trackClicks(input);
    engine.trackConversions(input);
    engine.trackCommissions(input);
    engine.measureSeoPerformance(input);
    engine.analyseFunnelPerformance(input);
    engine.detectTrends(input);
    engine.recommendOptimisations(input);
    const produced = engine.produceAnalyticsReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.ok(report.clickMetrics);
    assert.ok(report.conversionMetrics);
    assert.ok(report.commissionSummary);
    assert.ok(report.revenueSummary);
    assert.ok(report.seoPerformance);
    assert.ok(report.funnelPerformance);
    assert.ok(report.optimisationOpportunities.length >= 1);
    assert.ok(report.trendAnalysis);
    assert.ok(report.kpiDashboard);
    assert.ok(report.history.length >= 1);
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, ANW_METADATA_VERSION);
    assert.equal(report.reportVersion, ANALYTICS_REPORT_VERSION);
    assert.equal(report.consumableByQ808, true);
    assert.equal(report.neverFabricateAnalyticsOrPerformanceResults, true);
    assert.equal(report.neverModifyCampaignsAutomatically, true);
    assert.equal(report.neverImplementQ808OrLater, true);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createAnalyticsWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-anw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.produceAnalyticsReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-anw-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-08 / fabricate / modify-campaigns / manipulate / replace-compliance / override", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ808OrLater: true }),
      sampleInput({ missionId: "Q8-08" }),
      sampleInput({ fabricateAnalyticsOrPerformanceResults: true }),
      sampleInput({ modifyCampaignsAutomatically: true }),
      sampleInput({ manipulateAnalytics: true }),
      sampleInput({ replaceAffiliateComplianceWorker: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.trackClicks(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-08 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ808ConsumableContract();
    assert.equal(contract.contractVersion, "ANW-Q808-v1");
    assert.equal(contract.consumableByQ808, true);
    assert.ok(contract.fields.includes("clickMetrics"));
    assert.ok(contract.fields.includes("optimisationOpportunities"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-07");
    assert.equal(cockpit.neverFabricateAnalyticsOrPerformanceResults, true);
    assert.equal(cockpit.neverImplementQ808OrLater, true);
    assert.equal(cockpit.consumableByQ808, true);
  });
});
