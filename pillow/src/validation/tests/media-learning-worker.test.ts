import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  LEARNING_OUTCOME_KINDS,
  MLW_CAPABILITIES,
  MLW_INTEGRATION_TARGETS,
  MLW_METADATA_VERSION,
  MLW_REPORT_VERSION,
  PATTERN_DIMENSIONS,
  PATTERN_OUTCOMES,
  buildMediaLearningWorkerConfiguration,
  createMediaLearningWorker,
  resetMediaLearningWorkerForTesting,
} from "../../media-learning-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMediaLearningWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMediaLearningWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const strongAnalytics = {
  analyticsReportId: "maw-rpt-strong-001",
  mediaId: "vid-vaw-001",
  channelId: "chn-youtube-insights-01",
  platform: "youtube",
  views: { value: 12500 },
  impressions: { value: 180000 },
  clickThroughRate: { value: 6.9 },
  watchTime: { value: 840 },
  retentionMetrics: { averageViewPercentage: 54 },
  engagementMetrics: { likes: 920, comments: 145, shares: 88, engagementRate: 9.2 },
  subscriberImpact: { netSubscribers: 192 },
  revenueMetrics: { available: true, estimatedRevenueUsd: 312.5 },
  performancePatterns: [
    { classification: "strong", dimension: "ctr", summary: "CTR above benchmark" },
  ],
  confidenceScore: 91,
  contentFormat: "long_form",
  topicId: "topic-orchestration-gap",
  hookReportId: "hkw-rpt-001",
  publishingReportId: "pbw-rpt-001",
};

const weakAnalytics = {
  analyticsReportId: "maw-rpt-weak-001",
  mediaId: "vid-vaw-002",
  channelId: "chn-youtube-insights-01",
  platform: "youtube",
  views: { value: 900 },
  impressions: { value: 90000 },
  clickThroughRate: { value: 1.0 },
  watchTime: { value: 40 },
  retentionMetrics: { averageViewPercentage: 18 },
  engagementMetrics: { likes: 12, comments: 2, shares: 1, engagementRate: 1.1 },
  subscriberImpact: { netSubscribers: -4 },
  revenueMetrics: { available: false, estimatedRevenueUsd: null },
  performancePatterns: [
    { classification: "weak", dimension: "retention", summary: "Early drop-off" },
  ],
  confidenceScore: 78,
  contentFormat: "short_form",
  topicId: "topic-generic-tips",
  hookReportId: "hkw-rpt-002",
  publishingReportId: "pbw-rpt-002",
};

const baseInput = {
  learningReportId: "mlw-asset-001",
  channelId: "chn-youtube-insights-01",
  mediaBusinessId: "mbiz-youtube-insights-01",
  mediaIds: ["vid-vaw-001", "vid-vaw-002"],
  analyticsReportIds: ["maw-rpt-strong-001", "maw-rpt-weak-001"],
  analyticsReports: [strongAnalytics, weakAnalytics],
  topicIds: ["topic-orchestration-gap", "topic-generic-tips"],
  hookReportIds: ["hkw-rpt-001", "hkw-rpt-002"],
  thumbnailIds: ["thw-thumb-primary-01", "thw-thumb-alt-02"],
  contentFormats: ["long_form", "short_form"],
  publishingTimingNotes: "Strong uploads performed better mid-week mornings",
  verifiedAnalytics: true,
  validated: true,
};

function receiveAnalytics(engine: Awaited<ReturnType<typeof build>>) {
  engine.receiveMediaAnalyticsReports(baseInput);
}

describe("Q4-16 Media Learning Worker", () => {
  beforeEach(resetMediaLearningWorkerForTesting);

  test("1 locks mandatory media-learning-worker boundaries", () => {
    const c = buildMediaLearningWorkerConfiguration(REPO_ROOT, {
      neverRewriteExistingContent: false as never,
      neverModifyPublishedVideos: false as never,
      neverChangeEditorialPolicyDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ417OrLater: false as never,
      neverOverwriteHistoricalLearning: false as never,
      learnOnlyFromVerifiedAnalytics: false as never,
      preserveCompleteTraceability: false as never,
      preserveHistoricalLearningRecords: false as never,
      distinguishMeasuredOutcomesFromAssumptions: false as never,
    });
    assert.equal(c.neverRewriteExistingContent, true);
    assert.equal(c.neverModifyPublishedVideos, true);
    assert.equal(c.neverChangeEditorialPolicyDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ417OrLater, true);
    assert.equal(c.neverOverwriteHistoricalLearning, true);
    assert.equal(c.learnOnlyFromVerifiedAnalytics, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveHistoricalLearningRecords, true);
    assert.equal(c.distinguishMeasuredOutcomesFromAssumptions, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-MLW-001 for Q4-16 with media + learning integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-16");
    assert.equal(state.engineVersion, "PILLOW-MLW-001");
    assert.equal(state.configuration.workerId, "wkr-media-learning-01");
    assert.equal(state.configuration.role, "role-analyst-media-learning");
    for (const target of MLW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const kind of LEARNING_OUTCOME_KINDS) {
      assert.ok(typeof kind === "string");
    }
    for (const outcome of PATTERN_OUTCOMES) {
      assert.ok(typeof outcome === "string");
    }
    for (const dimension of PATTERN_DIMENSIONS) {
      assert.ok(typeof dimension === "string");
    }
    assert.ok(MLW_CAPABILITIES.includes("receive_media_analytics_reports"));
    assert.ok(MLW_CAPABILITIES.includes("update_media_playbook_recommendations"));
    assert.ok(MLW_CAPABILITIES.includes("produce_machine_readable_media_learning_reports"));
    assert.ok(MLW_CAPABILITIES.includes("integrate_media_analytics_worker"));
    assert.ok(MLW_CAPABILITIES.includes("integrate_experience_replay_engine"));
    assert.ok(MLW_CAPABILITIES.includes("integrate_operational_playbook_engine"));
  });

  test("3 receives analytics and identifies successful patterns", async () => {
    const engine = await build();
    const received = engine.receiveMediaAnalyticsReports(baseInput);
    assert.equal(received.action, "receive_media_analytics_reports");
    const report = engine.identifySuccessfulContentPatterns(baseInput);
    assert.equal(report.action, "identify_successful_content_patterns");
    assert.notEqual(report.validation.decision, "fail");
    const learning = report.latestLearningReport!;
    assert.ok(learning.successfulPatterns.length >= 1);
    assert.ok(learning.successfulPatterns.some((p) => p.outcome === "successful"));
  });

  test("4 identifies unsuccessful patterns", async () => {
    const engine = await build();
    receiveAnalytics(engine);
    const report = engine.identifyUnsuccessfulContentPatterns(baseInput);
    assert.equal(report.action, "identify_unsuccessful_content_patterns");
    assert.notEqual(report.validation.decision, "fail");
    const learning = report.latestLearningReport!;
    assert.ok(learning.failedPatterns.length >= 1);
    assert.ok(learning.failedPatterns.some((p) => p.outcome === "unsuccessful"));
  });

  test("5 analyses topic, hook, thumbnail, pacing, and publishing", async () => {
    const engine = await build();
    receiveAnalytics(engine);
    const topic = engine.analyseTopicPerformance(baseInput);
    const hook = engine.analyseHookPerformance(baseInput);
    const thumb = engine.analyseThumbnailPerformance(baseInput);
    const pacing = engine.analysePacingAndRetention(baseInput);
    const publishing = engine.analysePublishingTiming(baseInput);
    assert.equal(topic.action, "analyse_topic_performance");
    assert.equal(hook.action, "analyse_hook_performance");
    assert.equal(thumb.action, "analyse_thumbnail_performance");
    assert.equal(pacing.action, "analyse_pacing_and_retention");
    assert.equal(publishing.action, "analyse_publishing_timing");
    assert.notEqual(publishing.validation.decision, "fail");
    const learning = publishing.latestLearningReport!;
    assert.ok(learning.topicInsights.length >= 1);
    assert.ok(learning.hookInsights.length >= 1);
    assert.ok(learning.thumbnailInsights.length >= 1);
    assert.ok(learning.retentionInsights.length >= 1);
    assert.ok(learning.publishingInsights.length >= 1);
  });

  test("6 generates reusable insights and playbook recommendations", async () => {
    const engine = await build();
    receiveAnalytics(engine);
    const insights = engine.generateReusableLearningInsights(baseInput);
    const playbook = engine.updateMediaPlaybookRecommendations(baseInput);
    assert.equal(insights.action, "generate_reusable_learning_insights");
    assert.equal(playbook.action, "update_media_playbook_recommendations");
    assert.notEqual(playbook.validation.decision, "fail");
    const learning = playbook.latestLearningReport!;
    assert.ok(learning.recommendedImprovements.length >= 1);
    assert.ok(learning.playbookRecommendationUpdates.length >= 1);
    assert.ok(
      learning.playbookRecommendationUpdates.every(
        (u) => u.neverOverwroteHistoricalLearning === true,
      ),
    );
  });

  test("7 rejects unverified analytics", async () => {
    const engine = await build();
    const report = engine.produceMediaLearningReport({
      ...baseInput,
      verifiedAnalytics: false,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.latestLearningReport, null);
  });

  test("8 produces Media Learning Report with all required fields", async () => {
    const engine = await build();
    receiveAnalytics(engine);
    const { learningReportId: _omit, ...reportInput } = baseInput;
    const report = engine.produceMediaLearningReport(reportInput);
    const learning = report.latestLearningReport!;
    assert.ok(learning.learningReportId.startsWith("mlw-rpt-"));
    assert.ok(learning.timestamp);
    assert.equal(learning.channelId, "chn-youtube-insights-01");
    assert.ok(learning.mediaIdsAnalysed.length >= 1);
    assert.ok(learning.successfulPatterns.length >= 1);
    assert.ok(learning.failedPatterns.length >= 1);
    assert.ok(learning.topicInsights.length >= 1);
    assert.ok(learning.hookInsights.length >= 1);
    assert.ok(learning.thumbnailInsights.length >= 1);
    assert.ok(learning.retentionInsights.length >= 1);
    assert.ok(learning.publishingInsights.length >= 1);
    assert.ok(learning.recommendedImprovements.length >= 1);
    assert.ok(learning.confidenceScore >= 40);
    assert.equal(learning.metadataVersion, MLW_METADATA_VERSION);
    assert.equal(learning.reportVersion, MLW_REPORT_VERSION);
    assert.equal(learning.verifiedAnalyticsOnly, true);
    assert.equal(learning.neverRewriteExistingContent, true);
    assert.equal(learning.neverModifyPublishedVideos, true);
    assert.equal(learning.neverChangeEditorialPolicyDirectly, true);
    assert.equal(learning.neverOverridePillow, true);
    assert.equal(learning.neverOverrideGrandKing, true);
    assert.equal(learning.neverImplementQ417OrLater, true);
    assert.equal(learning.neverOverwriteHistoricalLearning, true);
    assert.equal(learning.distinguishMeasuredOutcomesFromAssumptions, true);
    assert.equal(learning.structuralSignalOnly, true);
    assert.ok(learning.learningTraceabilityRefs.length >= 1);
  });

  test("9 rejects rewrite/modify/policy/override/overwrite/Q4-17", async () => {
    const engine = await build();
    receiveAnalytics(engine);
    for (const forbidden of [
      { rewriteExistingContent: true },
      { modifyPublishedVideos: true },
      { changeEditorialPolicyDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ417OrLater: true },
      { overwriteHistoricalLearning: true },
    ] as const) {
      const report = engine.produceMediaLearningReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestLearningReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createMediaLearningWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-mlw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveAnalytics(engine);
    const produced = engine.produceMediaLearningReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.learningReports.length >= 1);
    const submitted = engine.submitReport({
      learningReportId: produced.latestLearningReport!.learningReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-16"]);
    assert.equal(submitted.latestLearningReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestLearningReport!.executiveReportId, "ert-worker-mlw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-16");
    assert.equal(cockpit.neverOverwriteHistoricalLearning, true);
    assert.equal(cockpit.neverImplementQ417OrLater, true);
  });
});
