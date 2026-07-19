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
  createConversionIntelligence,
  resetConversionIntelligenceForTesting,
} from "../../conversion-intelligence/index.js";
import {
  createCompetitorMarketingMonitor,
  resetCompetitorMarketingMonitorForTesting,
  buildCompetitorMarketingMonitorConfiguration,
  COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH,
  CMM_CAPABILITIES,
  COMPETITOR_MARKETING_MONITOR_ID,
} from "../../competitor-marketing-monitor/index.js";
import { appendCmmLog, getCmmLogs } from "../../competitor-marketing-monitor/cmm-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCompetitorMarketingMonitorConfiguration>[1],
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
  audience.buildAudience({ audienceName: "Competitor Watch", estimatedSize: 800 });

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

  const conversion = createConversionIntelligence(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: null,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: null,
    budgetOptimizationEngine: null,
  });
  await conversion.initialize();
  conversion.connectConversionIntelligence();
  conversion.trackFunnel({
    marketingChannel: "meta_ads",
    conversionRate: 10,
    dropOffRate: 35,
  });

  const engine = createCompetitorMarketingMonitor(
    bootstrap,
    {
      marketingFramework: mfw,
      metaAds: meta,
      googleAds: google,
      tiktokAds: tiktok,
      youtubeAds: youtube,
      seoIntelligence: seo,
      campaignManager,
      audienceIntelligence: audience,
      marketingAnalyticsDashboard: dashboard,
      conversionIntelligence: conversion,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-15 Competitor Marketing Monitor", () => {
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
    resetConversionIntelligenceForTesting();
    resetCompetitorMarketingMonitorForTesting();
  });

  test("buildCompetitorMarketingMonitorConfiguration loads defaults", () => {
    const config = buildCompetitorMarketingMonitorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverCollectRestrictedOrUnauthorizedInfo, true);
    assert.equal(config.authorizedPublicSignalsOnly, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(CMM_CAPABILITIES.includes("competitive_intelligence_generation"));
  });

  test("competitor marketing monitor initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CMM-001");
    assert.equal(state.missionId, "R5-15");
    assert.ok(COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH.includes("COMPETITOR_MARKETING"));
  });

  test("connectCompetitorMarketingMonitor registers with Marketing Framework via R5-15", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectCompetitorMarketingMonitor();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.marketingModuleIdentifier === COMPETITOR_MARKETING_MONITOR_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.seoIntelligence, true);
    assert.equal(report.engineRecord.dependencyPresence.conversionIntelligence, true);
  });

  test("discoverCompetitors produces machine-readable cmm-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCompetitorMarketingMonitor();
    const report = engine.discoverCompetitors({
      seedIdentifier: "rival-brand",
      marketingChannel: "meta_ads",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.competitorRunReportId.startsWith("cmm-run-"));
    const record = report.competitorRecords[0]!;
    assert.ok(record.competitorRecordId.startsWith("cmm-rec-"));
    assert.equal(record.metadataVersion, "CMM-001-v1");
    assert.equal(record.authorizedPublicSignalsOnly, true);
    assert.equal(record.competitorIdentifier, "rival-brand");
  });

  test("monitor keywords seo and generate intelligence lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectCompetitorMarketingMonitor();
    engine.discoverCompetitors({ seedIdentifier: "market-rival", marketingChannel: "google_ads" });

    const campaigns = engine.monitorCampaigns();
    assert.ok(campaigns.competitorRecords.length >= 1);

    const keywords = engine.monitorKeywords();
    assert.ok(keywords.competitorRecords.every((r) => r.keywordReference));

    const seo = engine.monitorSeoRankings();
    assert.equal(seo.action, "monitor_seo_rankings");

    const intelligence = engine.generateCompetitiveIntelligence();
    assert.notEqual(intelligence.validation.decision, "fail");
    assert.ok(intelligence.competitorRecords[0]!.recommendationSummary.length > 0);
    assert.ok(
      intelligence.competitorRecords.every((r) => r.authorizedPublicSignalsOnly === true),
    );
  });

  test("detect strategy changes and emerging competitors", async () => {
    const { engine } = await buildEngine();
    engine.connectCompetitorMarketingMonitor();
    engine.discoverCompetitors({ seedIdentifier: "rising-rival" });
    const emerging = engine.detectEmergingCompetitors();
    assert.equal(emerging.action, "detect_emerging_competitors");
    const changes = engine.detectStrategyChanges();
    assert.equal(changes.action, "detect_strategy_changes");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCmmLog({
      event: "competitor_discovery",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectCompetitorMarketingMonitor();
    const logs = getCmmLogs(50);
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
    engine.connectCompetitorMarketingMonitor();
    engine.discoverCompetitors({ seedIdentifier: "watchlist-1", marketingChannel: "tiktok_ads" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalCompetitorRecords >= 1);
  });
});
