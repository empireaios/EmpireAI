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
  buildMarketingExperimentEngineConfiguration,
  MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH,
  MEE_CAPABILITIES,
  MARKETING_EXPERIMENT_ENGINE_ID,
} from "../../marketing-experiment-engine/index.js";
import { appendMeeLog, getMeeLogs } from "../../marketing-experiment-engine/mee-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMarketingExperimentEngineConfiguration>[1],
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
  audience.buildAudience({ audienceName: "Experiment Cohort", estimatedSize: 2000 });

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
    customerRef: "cust-ref-mee1",
    marketingChannel: "meta_ads",
  });
  attribution.attribute({
    customerRef: "cust-ref-mee1",
    conversionValue: 180,
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
  aiCampaigns.generateCampaign({ objective: "conversions", budgetUsd: 1200 });

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
  conversion.trackFunnel({
    marketingChannel: "meta_ads",
    conversionRate: 11,
    dropOffRate: 32,
  });

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
  viral.discoverTrends({ seedKeyword: "experiment-signal" });

  const engine = createMarketingExperimentEngine(
    bootstrap,
    {
      marketingFramework: mfw,
      campaignManager,
      audienceIntelligence: audience,
      attributionEngine: attribution,
      marketingAnalyticsDashboard: dashboard,
      aiCampaignGenerator: aiCampaigns,
      budgetOptimizationEngine: budget,
      conversionIntelligence: conversion,
      viralTrendIntelligence: viral,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-17 Marketing Experiment Engine", () => {
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
  });

  test("buildMarketingExperimentEngineConfiguration loads defaults", () => {
    const config = buildMarketingExperimentEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverDeployWinningVariantsWithoutValidation, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(MEE_CAPABILITIES.includes("ab_test_management"));
  });

  test("marketing experiment engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MEE-001");
    assert.equal(state.missionId, "R5-17");
    assert.ok(MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH.includes("MARKETING_EXPERIMENT"));
  });

  test("connectMarketingExperimentEngine registers with Marketing Framework via R5-17", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectMarketingExperimentEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(
      modules.some((m) => m.marketingModuleIdentifier === MARKETING_EXPERIMENT_ENGINE_ID),
    );
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.attributionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.viralTrendIntelligence, true);
  });

  test("createExperiment produces machine-readable mee-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingExperimentEngine();
    const report = engine.createExperiment({
      experimentName: "CTA Color Test",
      experimentType: "ab_test",
      variants: ["control", "variant_a"],
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.experimentRunReportId.startsWith("mee-run-"));
    const record = report.experimentRecords[0]!;
    assert.ok(record.experimentId.startsWith("mee-exp-"));
    assert.equal(record.metadataVersion, "MEE-001-v1");
    assert.equal(record.deployedToProduction, false);
    assert.equal(record.experimentName, "CTA Color Test");
    assert.ok(record.variantReferences.length >= 2);
  });

  test("ab multivariate significance and winner lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingExperimentEngine();
    engine.createExperiment({
      experimentName: "Offer Matrix",
      experimentType: "multivariate",
    });

    const ab = engine.manageAbTest({
      variants: ["control", "variant_a"],
    });
    assert.equal(ab.action, "manage_ab_test");

    const multi = engine.manageMultivariateTest();
    assert.ok(multi.experimentRecords[0]!.variantReferences.length >= 3);

    engine.assignAudience({ splitPercent: 50 });
    engine.measurePerformance();
    const compared = engine.compareVariants();
    assert.ok(compared.experimentRecords[0]!.winningVariant);

    const significant = engine.detectSignificance();
    assert.equal(significant.action, "detect_significance");

    const winner = engine.recommendWinner();
    assert.ok(winner.experimentRecords[0]!.recommendationSummary.length > 0);
    assert.ok(winner.experimentRecords.every((r) => r.deployedToProduction === false));

    const archived = engine.archiveExperiment({ validated: true });
    assert.equal(archived.experimentRecords[0]!.experimentStatus, "archived");
  });

  test("rejects unvalidated archive deploy path", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingExperimentEngine();
    engine.createExperiment({ experimentName: "Guard Test" });
    const report = engine.archiveExperiment({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMeeLog({
      event: "experiment_creation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectMarketingExperimentEngine();
    const logs = getMeeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables deploy or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverDeployWinningVariantsWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(engine.getState().configuration.neverDeployWinningVariantsWithoutValidation, true);
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingExperimentEngine();
    engine.createExperiment({ experimentName: "Readiness Test" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalExperimentRecords >= 1);
  });
});
