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
  createCreativeAssetManager,
  resetCreativeAssetManagerForTesting,
} from "../../creative-asset-manager/index.js";
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
} from "../../cross-channel-orchestrator/index.js";
import {
  createAutonomousMarketingEngine,
  resetAutonomousMarketingEngineForTesting,
  buildAutonomousMarketingEngineConfiguration,
  AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH,
  AME_CAPABILITIES,
  AUTONOMOUS_MARKETING_ENGINE_ID,
} from "../../autonomous-marketing-engine/index.js";
import { appendAmeLog, getAmeLogs } from "../../autonomous-marketing-engine/ame-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAutonomousMarketingEngineConfiguration>[1],
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
  audience.buildAudience({ audienceName: "Autonomy Cohort", estimatedSize: 2100 });

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
    customerRef: "cust-ref-ame1",
    marketingChannel: "meta_ads",
  });
  attribution.attribute({
    customerRef: "cust-ref-ame1",
    conversionValue: 240,
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

  const creatives = createCreativeAssetManager(bootstrap, {
    marketingFramework: mfw,
    campaignManager,
    marketingAnalyticsDashboard: dashboard,
  });
  await creatives.initialize();
  creatives.connectCreativeAssetManager();
  creatives.createAsset({ assetName: "Autonomy Creative", assetType: "image", tags: ["auto"] });

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
    creativeAssetManager: creatives,
  });
  await aiCampaigns.initialize();
  aiCampaigns.connectAiCampaignGenerator();
  aiCampaigns.generateCampaign({ objective: "conversions", budgetUsd: 1800 });

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
  experiments.createExperiment({ experimentName: "Autonomy Experiment" });

  const orchestrator = createCrossChannelOrchestrator(bootstrap, {
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
  });
  await orchestrator.initialize();
  orchestrator.connectCrossChannelOrchestrator();
  orchestrator.coordinateCampaigns({
    marketingChannels: ["meta_ads", "google_ads"],
    validated: true,
  });

  const engine = createAutonomousMarketingEngine(
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
      creativeAssetManager: creatives,
      aiCampaignGenerator: aiCampaigns,
      budgetOptimizationEngine: budget,
      conversionIntelligence: conversion,
      competitorMarketingMonitor: null,
      viralTrendIntelligence: viral,
      marketingExperimentEngine: experiments,
      crossChannelOrchestrator: orchestrator,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-19 Autonomous Marketing Engine", () => {
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
    resetCreativeAssetManagerForTesting();
    resetAiCampaignGeneratorForTesting();
    resetBudgetOptimizationEngineForTesting();
    resetConversionIntelligenceForTesting();
    resetViralTrendIntelligenceForTesting();
    resetMarketingExperimentEngineForTesting();
    resetCrossChannelOrchestratorForTesting();
    resetAutonomousMarketingEngineForTesting();
  });

  test("buildAutonomousMarketingEngineConfiguration loads defaults", () => {
    const config = buildAutonomousMarketingEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverExecuteHighImpactActionsWithoutApproval, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(AME_CAPABILITIES.includes("campaign_performance_monitoring"));
  });

  test("autonomous marketing engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AME-001");
    assert.equal(state.missionId, "R5-19");
    assert.ok(AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH.includes("AUTONOMOUS_MARKETING"));
  });

  test("connectAutonomousMarketingEngine registers with Marketing Framework via R5-19", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectAutonomousMarketingEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === AUTONOMOUS_MARKETING_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.crossChannelOrchestrator, true);
    assert.equal(report.engineRecord.dependencyPresence.creativeAssetManager, true);
  });

  test("monitor and optimize produce machine-readable ame-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousMarketingEngine();
    const monitor = engine.monitorPerformance({ validated: true });
    assert.notEqual(monitor.validation.decision, "fail", monitor.validation.errors.join("; "));
    assert.ok(monitor.autonomousMarketingRunReportId.startsWith("ame-run-"));
    const record = monitor.autonomousMarketingRecords[0]!;
    assert.ok(record.autonomousMarketingId.startsWith("ame-opt-"));
    assert.equal(record.metadataVersion, "AME-001-v1");
    assert.equal(record.highImpactExecuted, false);

    const recommend = engine.generateRecommendations();
    assert.equal(recommend.action, "generate_recommendations");

    const budgets = engine.optimizeBudgets();
    assert.equal(budgets.autonomousMarketingRecords[0]!.optimizationCategory, "budget");
    engine.optimizeAudience();
    engine.optimizeScheduling();
    engine.optimizeCreative();
    const channels = engine.optimizeChannelAllocation();
    assert.equal(channels.autonomousMarketingRecords[0]!.optimizationCategory, "channel_allocation");
  });

  test("respond and execute approved structural optimizations", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousMarketingEngine();
    engine.monitorPerformance({ validated: true });
    engine.generateRecommendations();

    const response = engine.respondToPerformanceChanges();
    assert.equal(response.action, "respond_to_performance_changes");

    const blocked = engine.executeApprovedOptimizations({ approved: false });
    assert.equal(blocked.validation.decision, "fail");

    const executed = engine.executeApprovedOptimizations({ approved: true, validated: true });
    assert.notEqual(executed.validation.decision, "fail", executed.validation.errors.join("; "));
    const record = executed.autonomousMarketingRecords[0]!;
    assert.equal(record.executionStatus, "executed_structural");
    assert.equal(record.highImpactExecuted, false);
    assert.ok(record.executedAction);
  });

  test("rejects unvalidated monitoring", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousMarketingEngine();
    const report = engine.monitorPerformance({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAmeLog({
      event: "optimization_decisions",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectAutonomousMarketingEngine();
    const logs = getAmeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables approval or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverExecuteHighImpactActionsWithoutApproval: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(
      engine.getState().configuration.neverExecuteHighImpactActionsWithoutApproval,
      true,
    );
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousMarketingEngine();
    engine.monitorPerformance({ validated: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalAutonomousRecords >= 1);
  });
});
