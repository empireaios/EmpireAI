import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createMarketingFrameworkEngine,
  resetMarketingFrameworkForTesting,
} from "../../marketing-framework/index.js";
import {
  createMetaAdsIntegration,
  resetMetaAdsIntegrationForTesting,
} from "../../meta-ads-integration/index.js";
import {
  createGoogleAdsIntegration,
  resetGoogleAdsIntegrationForTesting,
} from "../../google-ads-integration/index.js";
import {
  createTikTokAdsIntegration,
  resetTikTokAdsIntegrationForTesting,
} from "../../tiktok-ads-integration/index.js";
import {
  createYouTubeAdsIntegration,
  resetYouTubeAdsIntegrationForTesting,
} from "../../youtube-ads-integration/index.js";
import {
  createSeoIntelligenceEngine,
  resetSeoIntelligenceEngineForTesting,
} from "../../seo-intelligence-engine/index.js";
import {
  createCampaignManagerEngine,
  resetCampaignManagerForTesting,
} from "../../campaign-manager/index.js";
import {
  createAudienceIntelligenceEngine,
  resetAudienceIntelligenceForTesting,
} from "../../audience-intelligence/index.js";
import {
  createMarketingAnalyticsDashboard,
  resetMarketingAnalyticsDashboardForTesting,
} from "../../marketing-analytics-dashboard/index.js";
import {
  createCompetitorMarketingMonitor,
  resetCompetitorMarketingMonitorForTesting,
} from "../../competitor-marketing-monitor/index.js";
import {
  createViralTrendIntelligence,
  resetViralTrendIntelligenceForTesting,
  buildViralTrendIntelligenceConfiguration,
  VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH,
  VTI_CAPABILITIES,
  VIRAL_TREND_INTELLIGENCE_ID,
} from "../../viral-trend-intelligence/index.js";
import { appendVtiLog, getVtiLogs } from "../../viral-trend-intelligence/vti-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildViralTrendIntelligenceConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();

  const meta = createMetaAdsIntegration(bootstrap, mfw);
  await meta.initialize();
  meta.connectMetaAds();

  const google = createGoogleAdsIntegration(bootstrap, mfw);
  await google.initialize();
  google.connectGoogleAds();

  const tiktok = createTikTokAdsIntegration(bootstrap, mfw);
  await tiktok.initialize();
  tiktok.connectTikTokAds();

  const youtube = createYouTubeAdsIntegration(bootstrap, mfw, google);
  await youtube.initialize();
  youtube.connectYouTubeAds();

  const seo = createSeoIntelligenceEngine(bootstrap, mfw, null);
  await seo.initialize();
  seo.connectSeoEngine();

  const campaignManager = createCampaignManagerEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
  });
  await campaignManager.initialize();
  campaignManager.connectCampaignManager();

  const audience = createAudienceIntelligenceEngine(bootstrap, {
    marketingFramework: mfw,
    customerSegmentation: null,
    customerJourney: null,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    campaignManager,
  });
  await audience.initialize();
  audience.connectAudienceIntelligence();
  audience.buildAudience({ audienceName: "Trend Cohort", estimatedSize: 1500 });

  const dashboard = createMarketingAnalyticsDashboard(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: null,
  });
  await dashboard.initialize();
  dashboard.connectDashboard();
  dashboard.refreshDashboard();

  const competitor = createCompetitorMarketingMonitor(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    marketingAnalyticsDashboard: dashboard,
    conversionIntelligence: null,
  });
  await competitor.initialize();
  competitor.connectCompetitorMarketingMonitor();
  competitor.discoverCompetitors({ seedIdentifier: "trend-rival", marketingChannel: "tiktok_ads" });

  const engine = createViralTrendIntelligence(
    bootstrap,
    {
      marketingFramework: mfw,
      metaAds: meta,
      googleAds: google,
      tiktokAds: tiktok,
      youtubeAds: youtube,
      seoIntelligence: seo,
      audienceIntelligence: audience,
      marketingAnalyticsDashboard: dashboard,
      competitorMarketingMonitor: competitor,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-16 Viral Trend Intelligence", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetSeoIntelligenceEngineForTesting();
    resetCampaignManagerForTesting();
    resetAudienceIntelligenceForTesting();
    resetMarketingAnalyticsDashboardForTesting();
    resetCompetitorMarketingMonitorForTesting();
    resetViralTrendIntelligenceForTesting();
  });

  test("buildViralTrendIntelligenceConfiguration loads defaults", () => {
    const config = buildViralTrendIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverCollectRestrictedOrUnauthorizedInfo, true);
    assert.equal(config.authorizedPublicSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(VTI_CAPABILITIES.includes("emerging_trend_discovery"));
  });

  test("viral trend intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-VTI-001");
    assert.equal(state.missionId, "R5-16");
    assert.ok(VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH.includes("VIRAL_TREND"));
  });

  test("connectViralTrendIntelligence registers with Marketing Framework via R5-16", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectViralTrendIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === VIRAL_TREND_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.seoIntelligence, true);
    assert.equal(report.engineRecord.dependencyPresence.competitorMarketingMonitor, true);
  });

  test("discoverTrends produces machine-readable vti-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectViralTrendIntelligence();
    const report = engine.discoverTrends({
      seedKeyword: "ai-shorts",
      trendCategory: "keyword",
      trendSource: "tiktok_ads",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.trendRunReportId.startsWith("vti-run-"));
    const record = report.trendRecords[0]!;
    assert.ok(record.trendRecordId.startsWith("vti-rec-"));
    assert.equal(record.metadataVersion, "VTI-001-v1");
    assert.equal(record.authorizedPublicSignalsOnly, true);
    assert.equal(record.keywordReference, "ai-shorts");
  });

  test("monitor predict and recommend trend lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectViralTrendIntelligence();
    engine.discoverTrends({ seedKeyword: "viral-drop", trendSource: "youtube_ads" });

    const keywords = engine.monitorKeywords();
    assert.ok(keywords.trendRecords.every((r) => r.keywordReference));

    const hashtags = engine.monitorHashtags();
    assert.ok(hashtags.trendRecords.every((r) => r.hashtagReference));

    const predicted = engine.predictTrends();
    assert.notEqual(predicted.validation.decision, "fail");
    assert.ok(predicted.trendRecords.every((r) => r.predictedScore >= 0));

    const recommended = engine.recommendTrends();
    assert.ok(recommended.trendRecords[0]!.recommendationSummary.length > 0);
    assert.ok(recommended.trendRecords.every((r) => r.authorizedPublicSignalsOnly === true));
  });

  test("detect acceleration and decline", async () => {
    const { engine } = await buildEngine();
    engine.connectViralTrendIntelligence();
    engine.discoverTrends({ seedKeyword: "fast-rise" });
    const acceleration = engine.detectAcceleration();
    assert.equal(acceleration.action, "detect_acceleration");
    const decline = engine.detectDecline();
    assert.equal(decline.action, "detect_decline");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendVtiLog({
      event: "trend_discovery",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectViralTrendIntelligence();
    const logs = getVtiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables restricted-collection or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverCollectRestrictedOrUnauthorizedInfo: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      authorizedPublicSignalsOnly: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(engine.getState().configuration.neverCollectRestrictedOrUnauthorizedInfo, true);
    assert.equal(engine.getState().configuration.authorizedPublicSignalsOnly, true);
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectViralTrendIntelligence();
    engine.discoverTrends({ seedKeyword: "readiness-signal", trendSource: "meta_ads" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalTrendRecords >= 1);
  });
});
