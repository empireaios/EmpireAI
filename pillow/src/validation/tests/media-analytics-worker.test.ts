import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ANALYTICS_PLATFORMS,
  MAW_CAPABILITIES,
  MAW_INTEGRATION_TARGETS,
  MAW_METADATA_VERSION,
  MAW_REPORT_VERSION,
  METRIC_SOURCES,
  PATTERN_CLASSIFICATIONS,
  buildMediaAnalyticsWorkerConfiguration,
  createMediaAnalyticsWorker,
  resetMediaAnalyticsWorkerForTesting,
} from "../../media-analytics-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createMediaAnalyticsWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMediaAnalyticsWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const baseInput = {
  analyticsReportId: "maw-asset-001",
  mediaBusinessId: "mbiz-youtube-insights-01",
  channelId: "chn-youtube-insights-01",
  mediaId: "vid-vaw-001",
  platform: "youtube" as const,
  publishingReportId: "pbw-rpt-001",
  views: 12500,
  impressions: 180000,
  clickThroughRate: 6.9,
  watchTimeHours: 840,
  averageViewPercentage: 54,
  likes: 920,
  comments: 145,
  shares: 88,
  subscribersGained: 210,
  subscribersLost: 18,
  estimatedRevenueUsd: 312.5,
  revenueAvailable: true,
  contentFormat: "long_form",
  topicId: "topic-orchestration-gap",
  hookReportId: "hkw-rpt-001",
  topicTitle: "AI Productivity Without Orchestration",
  priorViews: 8200,
  priorCtr: 4.1,
  priorRetention: 38,
  comparisonTargets: [
    {
      id: "vid-prior-001",
      dimension: "video",
      views: 6400,
      ctr: 3.2,
      retention: 31,
    },
    {
      id: "topic-alt-hooks",
      dimension: "hook",
      views: 9100,
      ctr: 5.1,
      retention: 44,
    },
  ],
  validated: true,
};

function receiveMetrics(engine: Awaited<ReturnType<typeof build>>) {
  engine.receivePlatformMetrics(baseInput);
}

describe("Q4-15 Media Analytics Worker", () => {
  beforeEach(resetMediaAnalyticsWorkerForTesting);

  test("1 locks mandatory media-analytics-worker boundaries", () => {
    const c = buildMediaAnalyticsWorkerConfiguration(REPO_ROOT, {
      neverRewriteContent: false as never,
      neverChangePublishingSchedules: false as never,
      neverModifyChannelStrategy: false as never,
      neverExecuteOptimizations: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ416OrLater: false as never,
      neverAlterSourceAnalyticsData: false as never,
      preserveCompleteMetricTraceability: false as never,
      preserveHistoricalPerformanceRecords: false as never,
      distinguishPlatformReportedFromEstimates: false as never,
      detectMeaningfulPerformanceChanges: false as never,
    });
    assert.equal(c.neverRewriteContent, true);
    assert.equal(c.neverChangePublishingSchedules, true);
    assert.equal(c.neverModifyChannelStrategy, true);
    assert.equal(c.neverExecuteOptimizations, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ416OrLater, true);
    assert.equal(c.neverAlterSourceAnalyticsData, true);
    assert.equal(c.preserveCompleteMetricTraceability, true);
    assert.equal(c.preserveHistoricalPerformanceRecords, true);
    assert.equal(c.distinguishPlatformReportedFromEstimates, true);
    assert.equal(c.detectMeaningfulPerformanceChanges, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
    assert.equal(c.neverLogSensitiveEnterpriseInformation, true);
  });

  test("2 initializes PILLOW-MAW-001 for Q4-15 with media + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q4-15");
    assert.equal(state.engineVersion, "PILLOW-MAW-001");
    assert.equal(state.configuration.workerId, "wkr-media-analytics-01");
    assert.equal(state.configuration.role, "role-analyst-media-analytics");
    for (const target of MAW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const platform of ANALYTICS_PLATFORMS) {
      assert.ok(typeof platform === "string");
    }
    for (const source of METRIC_SOURCES) {
      assert.ok(typeof source === "string");
    }
    for (const classification of PATTERN_CLASSIFICATIONS) {
      assert.ok(typeof classification === "string");
    }
    assert.ok(MAW_CAPABILITIES.includes("track_views"));
    assert.ok(MAW_CAPABILITIES.includes("detect_strong_and_weak_performance_patterns"));
    assert.ok(MAW_CAPABILITIES.includes("produce_machine_readable_media_analytics_reports"));
    assert.ok(MAW_CAPABILITIES.includes("integrate_publishing_worker"));
  });

  test("3 tracks views, impressions, and CTR", async () => {
    const engine = await build();
    receiveMetrics(engine);
    const views = engine.trackViews(baseInput);
    const impressions = engine.trackImpressions(baseInput);
    const ctr = engine.trackClickThroughRate(baseInput);
    assert.equal(views.action, "track_views");
    assert.equal(impressions.action, "track_impressions");
    assert.equal(ctr.action, "track_click_through_rate");
    assert.notEqual(ctr.validation.decision, "fail");
    const report = ctr.latestAnalyticsReport!;
    assert.equal(report.views.value, 12500);
    assert.equal(report.impressions.value, 180000);
    assert.ok(report.clickThroughRate.value >= 6);
    assert.ok(
      report.views.source === "platform_reported" ||
        report.impressions.source === "platform_reported",
    );
  });

  test("4 tracks retention and subscriber impact", async () => {
    const engine = await build();
    receiveMetrics(engine);
    const retention = engine.trackAudienceRetention(baseInput);
    const subscribers = engine.trackSubscriberGrowth(baseInput);
    assert.equal(retention.action, "track_audience_retention");
    assert.equal(subscribers.action, "track_subscriber_growth");
    assert.notEqual(subscribers.validation.decision, "fail");
    const report = subscribers.latestAnalyticsReport!;
    assert.equal(report.retentionMetrics.averageViewPercentage, 54);
    assert.ok(report.retentionMetrics.retainedAt25Pct >= report.retentionMetrics.retainedAt75Pct);
    assert.equal(report.subscriberImpact.subscribersGained, 210);
    assert.equal(report.subscriberImpact.subscribersLost, 18);
    assert.equal(report.subscriberImpact.netSubscribers, 192);
  });

  test("5 tracks engagement and revenue where available", async () => {
    const engine = await build();
    receiveMetrics(engine);
    const engagement = engine.trackEngagementMetrics(baseInput);
    const revenue = engine.trackRevenueWhereAvailable(baseInput);
    assert.equal(engagement.action, "track_engagement_metrics");
    assert.equal(revenue.action, "track_revenue_where_available");
    assert.notEqual(revenue.validation.decision, "fail");
    const report = revenue.latestAnalyticsReport!;
    assert.equal(report.engagementMetrics.likes, 920);
    assert.equal(report.engagementMetrics.comments, 145);
    assert.equal(report.engagementMetrics.shares, 88);
    assert.ok(report.engagementMetrics.engagementRate > 0);
    assert.equal(report.revenueMetrics.available, true);
    assert.equal(report.revenueMetrics.estimatedRevenueUsd, 312.5);
    assert.equal(report.revenueMetrics.currency, "USD");
  });

  test("6 detects performance patterns and comparisons", async () => {
    const engine = await build();
    receiveMetrics(engine);
    const patterns = engine.detectPerformancePatterns(baseInput);
    const comparisons = engine.compareVideosFormatsTopicsHooksChannels(baseInput);
    assert.equal(patterns.action, "detect_performance_patterns");
    assert.equal(comparisons.action, "compare_videos_formats_topics_hooks_channels");
    assert.notEqual(comparisons.validation.decision, "fail");
    const report = comparisons.latestAnalyticsReport!;
    assert.ok(report.performancePatterns.length >= 1);
    assert.ok(report.performancePatterns.some((p) => p.classification === "strong"));
    assert.ok(report.comparisons.length >= 1);
    assert.equal(report.meaningfulChangeDetected, true);
  });

  test("7 tracks watch time from platform metrics", async () => {
    const engine = await build();
    receiveMetrics(engine);
    const report = engine.trackWatchTime(baseInput);
    assert.equal(report.action, "track_watch_time");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestAnalyticsReport!.watchTime.value, 840);
    assert.equal(report.latestAnalyticsReport!.watchTime.unit, "hours");
  });

  test("8 produces Media Analytics Report with all required fields", async () => {
    const engine = await build();
    receiveMetrics(engine);
    const { analyticsReportId: _omit, ...reportInput } = baseInput;
    const report = engine.produceMediaAnalyticsReport(reportInput);
    const analytics = report.latestAnalyticsReport!;
    assert.ok(analytics.analyticsReportId.startsWith("maw-rpt-"));
    assert.ok(analytics.timestamp);
    assert.equal(analytics.mediaBusinessId, "mbiz-youtube-insights-01");
    assert.equal(analytics.channelId, "chn-youtube-insights-01");
    assert.equal(analytics.mediaId, "vid-vaw-001");
    assert.equal(analytics.platform, "youtube");
    assert.ok(analytics.views.value > 0);
    assert.ok(analytics.impressions.value > 0);
    assert.ok(analytics.clickThroughRate.value > 0);
    assert.ok(analytics.watchTime.value > 0);
    assert.ok(analytics.retentionMetrics);
    assert.ok(analytics.subscriberImpact);
    assert.ok(analytics.engagementMetrics);
    assert.ok(analytics.revenueMetrics);
    assert.ok(analytics.performancePatterns.length >= 1);
    assert.ok(analytics.confidenceScore >= 40);
    assert.equal(analytics.metadataVersion, MAW_METADATA_VERSION);
    assert.equal(analytics.reportVersion, MAW_REPORT_VERSION);
    assert.equal(analytics.neverRewriteContent, true);
    assert.equal(analytics.neverChangePublishingSchedules, true);
    assert.equal(analytics.neverModifyChannelStrategy, true);
    assert.equal(analytics.neverExecuteOptimizations, true);
    assert.equal(analytics.neverOverridePillow, true);
    assert.equal(analytics.neverOverrideGrandKing, true);
    assert.equal(analytics.neverImplementQ416OrLater, true);
    assert.equal(analytics.neverAlterSourceAnalyticsData, true);
    assert.equal(analytics.distinguishPlatformReportedFromEstimates, true);
    assert.equal(analytics.structuralSignalOnly, true);
    assert.ok(analytics.metricTraceabilityRefs.length >= 1);
  });

  test("9 rejects rewrite/schedule/strategy/optimize/override/alter/Q4-16", async () => {
    const engine = await build();
    receiveMetrics(engine);
    for (const forbidden of [
      { rewriteContent: true },
      { changePublishingSchedules: true },
      { modifyChannelStrategy: true },
      { executeOptimizations: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ416OrLater: true },
      { alterSourceAnalyticsData: true },
    ] as const) {
      const report = engine.produceMediaAnalyticsReport({
        ...baseInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestAnalyticsReport, null);
    }
  });

  test("10 lists + submits via ERR", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createMediaAnalyticsWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-maw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    receiveMetrics(engine);
    const produced = engine.produceMediaAnalyticsReport(baseInput);
    const listed = engine.list();
    assert.ok(listed.analyticsReports.length >= 1);
    const submitted = engine.submitReport({
      analyticsReportId: produced.latestAnalyticsReport!.analyticsReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q4-15"]);
    assert.equal(submitted.latestAnalyticsReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestAnalyticsReport!.executiveReportId, "ert-worker-maw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q4-15");
    assert.equal(cockpit.neverAlterSourceAnalyticsData, true);
    assert.equal(cockpit.neverImplementQ416OrLater, true);
  });
});
