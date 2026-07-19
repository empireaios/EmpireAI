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
  buildConversionIntelligenceConfiguration,
  CONVERSION_INTELLIGENCE_SYSTEM_PATH,
  CVI_CAPABILITIES,
  CONVERSION_INTELLIGENCE_ID,
} from "../../conversion-intelligence/index.js";
import { appendCviLog, getCviLogs } from "../../conversion-intelligence/cvi-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildConversionIntelligenceConfiguration>[1],
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
  audience.buildAudience({ audienceName: "Conversion Cohort", estimatedSize: 1200 });

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
    customerRef: "cust-ref-cvi1",
    marketingChannel: "meta_ads",
  });
  attribution.attribute({
    customerRef: "cust-ref-cvi1",
    conversionValue: 250,
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
  budget.allocateBudget({ marketingChannel: "meta_ads", allocatedBudget: 900 });

  const engine = createConversionIntelligence(
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
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-14 Conversion Intelligence", () => {
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
  });

  test("buildConversionIntelligenceConfiguration loads defaults", () => {
    const config = buildConversionIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverModifyProductionCampaignsWithoutValidation, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(CVI_CAPABILITIES.includes("funnel_optimization"));
  });

  test("conversion intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CVI-001");
    assert.equal(state.missionId, "R5-14");
    assert.ok(CONVERSION_INTELLIGENCE_SYSTEM_PATH.includes("CONVERSION_INTELLIGENCE"));
  });

  test("connectConversionIntelligence registers with Marketing Framework via R5-14", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectConversionIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === CONVERSION_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.attributionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.budgetOptimizationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.seoIntelligence, true);
  });

  test("trackFunnel produces machine-readable cvi-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectConversionIntelligence();
    const report = engine.trackFunnel({
      marketingChannel: "meta_ads",
      funnelStage: "landing",
      conversionRate: 12,
      dropOffRate: 40,
      landingPageScore: 70,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.conversionRunReportId.startsWith("cvi-run-"));
    const record = report.conversionRecords[0]!;
    assert.ok(record.conversionRecordId.startsWith("cvi-rec-"));
    assert.equal(record.metadataVersion, "CVI-001-v1");
    assert.equal(record.appliedToProductionCampaign, false);
    assert.equal(record.conversionRate, 12);
    assert.equal(record.dropOffRate, 40);
  });

  test("detect recommend and optimize funnel lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectConversionIntelligence();
    engine.trackFunnel({
      marketingChannel: "google_ads",
      funnelStage: "engagement",
      conversionRate: 4,
      dropOffRate: 70,
      landingPageScore: 35,
    });

    const bottlenecks = engine.detectBottlenecks();
    assert.equal(bottlenecks.action, "detect_bottlenecks");
    assert.ok(bottlenecks.conversionRecords.length >= 1);

    const abandonment = engine.detectAbandonment();
    assert.equal(abandonment.action, "detect_abandonment");

    const recommendations = engine.recommendImprovements();
    assert.ok(recommendations.conversionRecords.length >= 1);
    assert.ok(recommendations.conversionRecords[0]!.recommendedOptimization.length > 0);

    const optimized = engine.optimizeFunnel({ validated: true });
    assert.notEqual(optimized.validation.decision, "fail");
    assert.ok(optimized.conversionRecords.every((r) => r.appliedToProductionCampaign === false));
  });

  test("rejects unvalidated production campaign modification", async () => {
    const { engine } = await buildEngine();
    engine.connectConversionIntelligence();
    const report = engine.optimizeFunnel({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCviLog({
      event: "funnel_tracking",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectConversionIntelligence();
    const logs = getCviLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables production or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyProductionCampaignsWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(
      engine.getState().configuration.neverModifyProductionCampaignsWithoutValidation,
      true,
    );
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectConversionIntelligence();
    engine.trackFunnel({ marketingChannel: "tiktok_ads", conversionRate: 9, dropOffRate: 30 });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalConversionRecords >= 1);
  });
});
