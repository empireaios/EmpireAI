import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CRW_CAPABILITIES,
  CRW_INTEGRATION_TARGETS,
  CRW_METADATA_VERSION,
  CRW_REPORT_VERSION,
  RECOMMENDATION_DECISIONS,
  RISK_LEVELS,
  buildChannelRecommendationWorkerConfiguration,
  createChannelRecommendationWorker,
  resetChannelRecommendationWorkerForTesting,
} from "../../channel-recommendation-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createChannelRecommendationWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createChannelRecommendationWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  recommendationId: "crw-asset-001",
  proposedChannelName: "EmpireAI Ops Shorts",
  platform: "youtube",
  niche: "AI operations playbooks",
  contentFormat: "short_form",
  targetAudience: "Operators scaling AI media factories",
  audienceSegments: ["founders", "ops leads", "media producers"],
  geographyHints: ["global-english"],
  channelIdHint: "chn-proposed-ops-shorts",
  mediaBusinessId: "mbiz-youtube-insights-01",
  trendReportIds: ["trw-rpt-001"],
  analyticsReportIds: ["maw-rpt-001"],
  learningReportIds: ["mlw-rpt-001"],
  trendSignals: [
    {
      trendId: "trend-ai-ops",
      topic: "AI operations",
      demandScore: 88,
      competitionLevel: "medium",
      summary: "Rising demand for AI ops shorts",
    },
  ],
  analyticsSignals: [
    {
      analyticsReportId: "maw-rpt-001",
      channelId: "chn-youtube-insights-01",
      views: 12500,
      ctr: 6.9,
      retention: 54,
      revenueUsd: 312.5,
      confidenceScore: 90,
    },
  ],
  learningSignals: [
    {
      learningReportId: "mlw-rpt-001",
      channelId: "chn-youtube-insights-01",
      successfulPatternCount: 4,
      failedPatternCount: 1,
      confidenceScore: 85,
      topInsight: "Curiosity hooks with ops CTAs retain well",
    },
  ],
  productionCapacityScore: 82,
  strategicPriorityScore: 86,
  existingChannelCount: 2,
  publishingTimingNotes: "Mid-week mornings outperform",
  validated: true,
};

function receiveAll(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveTrendResearch(baseInput);
  engine.receiveMediaAnalytics(baseInput);
  engine.receiveMediaLearningOutputs(baseInput);
}

describe("Q4-17 Channel Recommendation Worker", () => {
  beforeEach(resetChannelRecommendationWorkerForTesting);

  test("1 locks mandatory channel-recommendation-worker boundaries", () => {
    const c = buildChannelRecommendationWorkerConfiguration(REPO_ROOT, {
      neverCreateChannels: false as never,
      neverConfigurePlatformAccounts: false as never,
      neverPublishContent: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ418OrLater: false as never,
      neverCreateChannelsAutomatically: false as never,
      baseRecommendationsOnEvidence: false as never,
      preserveCompleteSourceTraceability: false as never,
      distinguishFactsFromAssumptions: false as never,
      explainEveryRecommendation: false as never,
    });
    assert.equal(c.neverCreateChannels, true);
    assert.equal(c.neverConfigurePlatformAccounts, true);
    assert.equal(c.neverPublishContent, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ418OrLater, true);
    assert.equal(c.neverCreateChannelsAutomatically, true);
    assert.equal(c.baseRecommendationsOnEvidence, true);
    assert.equal(c.preserveCompleteSourceTraceability, true);
    assert.equal(c.distinguishFactsFromAssumptions, true);
    assert.equal(c.explainEveryRecommendation, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-CRW-001 for Q4-17 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-17");
    assert.equal(state.engineVersion, "PILLOW-CRW-001");
    assert.equal(state.configuration.workerId, "wkr-channel-recommendation-01");
    assert.equal(state.configuration.role, "role-analyst-channel-recommendation");
    for (const target of CRW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const decision of RECOMMENDATION_DECISIONS) {
      assert.ok(typeof decision === "string");
    }
    for (const risk of RISK_LEVELS) {
      assert.ok(typeof risk === "string");
    }
    assert.ok(CRW_CAPABILITIES.includes("receive_trend_research"));
    assert.ok(CRW_CAPABILITIES.includes("recommend_proceed_monitor_or_reject"));
    assert.ok(CRW_CAPABILITIES.includes("produce_machine_readable_channel_recommendation_reports"));
    assert.ok(CRW_CAPABILITIES.includes("integrate_trend_research_worker"));
    assert.ok(CRW_CAPABILITIES.includes("integrate_media_analytics_worker"));
    assert.ok(CRW_CAPABILITIES.includes("integrate_media_learning_worker"));
  });

  test("3 evaluates channel opportunity with scored dimensions", async () => {
    const engine = await build();
    receiveAll(engine);
    const audience = engine.analyseAudiencePotential(baseInput);
    const revenue = engine.analyseRevenuePotential(baseInput);
    const feasibility = engine.analyseProductionFeasibility(baseInput);
    assert.equal(audience.action, "analyse_audience_potential");
    assert.equal(revenue.action, "analyse_revenue_potential");
    assert.equal(feasibility.action, "analyse_production_feasibility");
    assert.notEqual(feasibility.validation.decision, "fail");
    const report = feasibility.latestRecommendationReport!;
    assert.ok(report.audiencePotential.score >= 0);
    assert.ok(report.revenuePotential.score >= 0);
    assert.ok(report.productionFeasibility.score >= 0);
  });

  test("4 assesses competition and strategic fit", async () => {
    const engine = await build();
    receiveAll(engine);
    const competition = engine.analyseCompetition(baseInput);
    const strategic = engine.analyseStrategicFit(baseInput);
    const sustainability = engine.analyseExpectedContentSustainability(baseInput);
    assert.equal(competition.action, "analyse_competition");
    assert.equal(strategic.action, "analyse_strategic_fit");
    assert.equal(sustainability.action, "analyse_expected_content_sustainability");
    assert.notEqual(sustainability.validation.decision, "fail");
    const report = sustainability.latestRecommendationReport!;
    assert.ok(report.competitionAssessment.score >= 0);
    assert.ok(report.strategicFit.score >= 0);
    assert.ok(report.contentSustainability.score >= 0);
  });

  test("5 ranks channel opportunities", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.rankChannelOpportunities(baseInput);
    assert.equal(report.action, "rank_channel_opportunities");
    assert.notEqual(report.validation.decision, "fail");
    const rec = report.latestRecommendationReport!;
    assert.ok(rec.overallScore >= 0);
    assert.ok(rec.rankingPosition === null || rec.rankingPosition >= 1);
  });

  test("6 generates Proceed/Monitor/Reject recommendation with rationale", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.recommendProceedMonitorOrReject(baseInput);
    assert.equal(report.action, "recommend_proceed_monitor_or_reject");
    assert.notEqual(report.validation.decision, "fail");
    const rec = report.latestRecommendationReport!;
    assert.ok(RECOMMENDATION_DECISIONS.includes(rec.recommendation));
    assert.ok(rec.recommendationRationale.length > 0);
    assert.ok(rec.supportingEvidence.length >= 1);
    assert.ok(rec.supportingEvidence.some((e) => e.kind === "fact" || e.kind === "assumption"));
  });

  test("7 scores audience, revenue, feasibility for strong evidence path", async () => {
    const engine = await build();
    receiveAll(engine);
    const report = engine.produceChannelRecommendationReport(baseInput);
    assert.notEqual(report.validation.decision, "fail");
    const rec = report.latestRecommendationReport!;
    assert.ok(rec.audiencePotential.score >= 60);
    assert.ok(rec.revenuePotential.score >= 50);
    assert.ok(rec.productionFeasibility.score >= 50);
    assert.ok(rec.overallScore >= 50);
    assert.ok(["Proceed", "Monitor"].includes(rec.recommendation));
  });

  test("8 produces Channel Recommendation Report with all required fields", async () => {
    const engine = await build();
    receiveAll(engine);
    const { recommendationId: _omit, ...reportInput } = baseInput;
    const report = engine.produceChannelRecommendationReport(reportInput);
    const rec = report.latestRecommendationReport!;
    assert.ok(rec.recommendationId.startsWith("crw-rpt-"));
    assert.ok(rec.timestamp);
    assert.equal(rec.proposedChannel.channelName, "EmpireAI Ops Shorts");
    assert.ok(rec.targetAudience.primaryAudience);
    assert.ok(rec.audiencePotential);
    assert.ok(rec.revenuePotential);
    assert.ok(rec.productionFeasibility);
    assert.ok(rec.competitionAssessment);
    assert.ok(rec.strategicFit);
    assert.ok(rec.contentSustainability);
    assert.ok(rec.riskAssessment);
    assert.ok(typeof rec.overallScore === "number");
    assert.ok(RECOMMENDATION_DECISIONS.includes(rec.recommendation));
    assert.ok(rec.supportingEvidence.length >= 1);
    assert.ok(rec.confidenceScore >= 40);
    assert.equal(rec.metadataVersion, CRW_METADATA_VERSION);
    assert.equal(rec.reportVersion, CRW_REPORT_VERSION);
    assert.equal(rec.neverCreateChannels, true);
    assert.equal(rec.neverConfigurePlatformAccounts, true);
    assert.equal(rec.neverPublishContent, true);
    assert.equal(rec.neverOverridePillow, true);
    assert.equal(rec.neverOverrideGrandKing, true);
    assert.equal(rec.neverImplementQ418OrLater, true);
    assert.equal(rec.neverCreateChannelsAutomatically, true);
    assert.equal(rec.baseRecommendationsOnEvidence, true);
    assert.equal(rec.distinguishFactsFromAssumptions, true);
    assert.equal(rec.explainEveryRecommendation, true);
    assert.equal(rec.structuralSignalOnly, true);
    assert.ok(rec.sourceTraceabilityRefs.length >= 1);
  });

  test("9 rejects create/configure/publish/override/Q4-18", async () => {
    const engine = await build();
    receiveAll(engine);
    for (const forbidden of [
      { createChannels: true },
      { configurePlatformAccounts: true },
      { publishContent: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ418OrLater: true },
      { createChannelsAutomatically: true },
    ] as const) {
      const report = engine.produceChannelRecommendationReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestRecommendationReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createChannelRecommendationWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-crw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveAll(engine);
    const produced = engine.produceChannelRecommendationReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.recommendationReports.length >= 1);
    const submitted = engine.submitReport({
      recommendationId: produced.latestRecommendationReport!.recommendationId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-17"]);
    assert.equal(submitted.latestRecommendationReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestRecommendationReport!.executiveReportId, "ert-worker-crw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-17");
    assert.equal(cockpit.neverCreateChannelsAutomatically, true);
    assert.equal(cockpit.neverImplementQ418OrLater, true);
  });
});
