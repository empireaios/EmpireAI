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
  createAttributionEngine,
  resetAttributionEngineForTesting,
} from "../../attribution-engine/index.js";
import {
  createMarketingAnalyticsDashboard,
  resetMarketingAnalyticsDashboardForTesting,
} from "../../marketing-analytics-dashboard/index.js";
import {
  createAiCampaignGenerator,
  resetAiCampaignGeneratorForTesting,
} from "../../ai-campaign-generator/index.js";
import {
  createBudgetOptimizationEngine,
  resetBudgetOptimizationEngineForTesting,
} from "../../budget-optimization-engine/index.js";
import {
  createConversionIntelligence,
  resetConversionIntelligenceForTesting,
} from "../../conversion-intelligence/index.js";
import {
  createViralTrendIntelligence,
  resetViralTrendIntelligenceForTesting,
} from "../../viral-trend-intelligence/index.js";
import {
  createMarketingExperimentEngine,
  resetMarketingExperimentEngineForTesting,
} from "../../marketing-experiment-engine/index.js";
import {
  createCrossChannelOrchestrator,
  resetCrossChannelOrchestratorForTesting,
  buildCrossChannelOrchestratorConfiguration,
  CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH,
  CCO_CAPABILITIES,
  CROSS_CHANNEL_ORCHESTRATOR_ID,
} from "../../cross-channel-orchestrator/index.js";
import { appendCcoLog, getCcoLogs } from "../../cross-channel-orchestrator/cco-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCrossChannelOrchestratorConfiguration>[1],
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
  audience.buildAudience({ audienceName: "Orchestration Cohort", estimatedSize: 1800 });

  const attribution = createAttributionEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    campaignManager,
    audienceIntelligence: audience,
  });
  await attribution.initialize();
  attribution.connectAttributionEngine();
  attribution.trackTouchpoint({
    customerRef: "cust-ref-cco1",
    marketingChannel: "meta_ads",
  });
  attribution.attribute({
    customerRef: "cust-ref-cco1",
    conversionValue: 220,
  });

  const dashboard = createMarketingAnalyticsDashboard(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
  });
  await dashboard.initialize();
  dashboard.connectDashboard();
  dashboard.refreshDashboard();

  const aiCampaigns = createAiCampaignGenerator(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    creativeAssetManager: null,
  });
  await aiCampaigns.initialize();
  aiCampaigns.connectAiCampaignGenerator();
  aiCampaigns.generateCampaign({ objective: "conversions", budgetUsd: 1600 });

  const budget = createBudgetOptimizationEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
  });
  await budget.initialize();
  budget.connectBudgetOptimization();

  const conversion = createConversionIntelligence(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
    budgetOptimizationEngine: budget,
  });
  await conversion.initialize();
  conversion.connectConversionIntelligence();

  const viral = createViralTrendIntelligence(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: seo,
    audienceIntelligence: audience,
    marketingAnalyticsDashboard: dashboard,
    competitorMarketingMonitor: null,
  });
  await viral.initialize();
  viral.connectViralTrendIntelligence();

  const experiments = createMarketingExperimentEngine(bootstrap, {
    marketingFramework: mfw,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    aiCampaignGenerator: aiCampaigns,
    budgetOptimizationEngine: budget,
    conversionIntelligence: conversion,
    viralTrendIntelligence: viral,
  });
  await experiments.initialize();
  experiments.connectMarketingExperimentEngine();
  experiments.createExperiment({ experimentName: "Orchestration Experiment" });

  const engine = createCrossChannelOrchestrator(
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
      attributionEngine: attribution,
      marketingAnalyticsDashboard: dashboard,
      aiCampaignGenerator: aiCampaigns,
      budgetOptimizationEngine: budget,
      conversionIntelligence: conversion,
      competitorMarketingMonitor: null,
      viralTrendIntelligence: viral,
      marketingExperimentEngine: experiments,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-18 Cross-Channel Orchestrator", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetSeoIntelligenceEngineForTesting();
    resetCampaignManagerForTesting();
    resetAudienceIntelligenceForTesting();
    resetAttributionEngineForTesting();
    resetMarketingAnalyticsDashboardForTesting();
    resetAiCampaignGeneratorForTesting();
    resetBudgetOptimizationEngineForTesting();
    resetConversionIntelligenceForTesting();
    resetViralTrendIntelligenceForTesting();
    resetMarketingExperimentEngineForTesting();
    resetCrossChannelOrchestratorForTesting();
  });

  test("buildCrossChannelOrchestratorConfiguration loads defaults", () => {
    const config = buildCrossChannelOrchestratorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverLaunchCoordinatedCampaignsWithoutValidation, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(CCO_CAPABILITIES.includes("campaign_coordination"));
  });

  test("cross-channel orchestrator initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CCO-001");
    assert.equal(state.missionId, "R5-18");
    assert.ok(CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH.includes("CROSS_CHANNEL"));
  });

  test("connectCrossChannelOrchestrator registers with Marketing Framework via R5-18", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectCrossChannelOrchestrator();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === CROSS_CHANNEL_ORCHESTRATOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingExperimentEngine, true);
  });

  test("coordinateCampaigns produces machine-readable cco-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossChannelOrchestrator();
    const report = engine.coordinateCampaigns({
      marketingChannels: ["meta_ads", "google_ads", "seo"],
      schedule: "2026-Q3-wave-1",
      validated: true,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.orchestrationRunReportId.startsWith("cco-run-"));
    const record = report.orchestrationRecords[0]!;
    assert.ok(record.orchestrationId.startsWith("cco-orc-"));
    assert.equal(record.metadataVersion, "CCO-001-v1");
    assert.equal(record.launchedToProduction, false);
    assert.equal(record.campaignSchedule, "2026-Q3-wave-1");
    assert.ok(record.marketingChannels.length >= 2);
  });

  test("synchronize journey and conflict lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossChannelOrchestrator();
    engine.coordinateCampaigns({
      marketingChannels: ["meta_ads", "google_ads", "tiktok_ads"],
      validated: true,
    });

    const execution = engine.synchronizeExecution();
    assert.equal(execution.action, "synchronize_execution");

    const schedules = engine.synchronizeSchedules({ schedule: "daily-09:00" });
    assert.equal(schedules.orchestrationRecords[0]!.campaignSchedule, "daily-09:00");

    const journeys = engine.coordinateJourneys();
    assert.equal(journeys.orchestrationRecords[0]!.journeyCoordinationStatus, "synchronized");

    engine.coordinateChannels();
    engine.coordinateBudgets();
    engine.coordinateAssets();
    engine.coordinateExperiments();

    const conflicts = engine.detectConflicts();
    assert.equal(conflicts.action, "detect_conflicts");
    assert.ok(conflicts.orchestrationRecords.every((r) => r.launchedToProduction === false));
  });

  test("rejects unvalidated coordinated launch", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossChannelOrchestrator();
    const report = engine.coordinateCampaigns({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCcoLog({
      event: "campaign_coordination",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectCrossChannelOrchestrator();
    const logs = getCcoLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables launch or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverLaunchCoordinatedCampaignsWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(
      engine.getState().configuration.neverLaunchCoordinatedCampaignsWithoutValidation,
      true,
    );
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCrossChannelOrchestrator();
    engine.coordinateCampaigns({
      marketingChannels: ["youtube_ads", "seo"],
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalOrchestrationRecords >= 1);
  });
});
