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
  buildAiCampaignGeneratorConfiguration,
  AI_CAMPAIGN_GENERATOR_SYSTEM_PATH,
  ACG_CAPABILITIES,
  AI_CAMPAIGN_GENERATOR_ID,
} from "../../ai-campaign-generator/index.js";
import { appendAcgLog, getAcgLogs } from "../../ai-campaign-generator/acg-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAiCampaignGeneratorConfiguration>[1],
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
  audience.buildAudience({ audienceName: "AI Gen Cohort", estimatedSize: 1200 });

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

  const creatives = createCreativeAssetManager(bootstrap, {
    marketingFramework: mfw,
    campaignManager,
    marketingAnalyticsDashboard: dashboard,
  });
  await creatives.initialize();
  creatives.connectCreativeAssetManager();
  creatives.createAsset({ assetName: "Hero Creative", assetType: "image", tags: ["hero"] });

  const engine = createAiCampaignGenerator(
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
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-12 AI Campaign Generator", () => {
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
  });

  test("buildAiCampaignGeneratorConfiguration loads defaults", () => {
    const config = buildAiCampaignGeneratorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverPublishWithoutValidation, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(ACG_CAPABILITIES.includes("campaign_strategy_generation"));
  });

  test("ai campaign generator initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ACG-001");
    assert.equal(state.missionId, "R5-12");
    assert.ok(AI_CAMPAIGN_GENERATOR_SYSTEM_PATH.includes("AI_CAMPAIGN_GENERATOR"));
  });

  test("connectAiCampaignGenerator registers with Marketing Framework via R5-12", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectAiCampaignGenerator();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === AI_CAMPAIGN_GENERATOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.creativeAssetManager, true);
  });

  test("generateCampaign produces machine-readable acg-* plan records", async () => {
    const { engine } = await buildEngine();
    engine.connectAiCampaignGenerator();
    const report = engine.generateCampaign({
      objective: "conversions",
      productFocus: "EmpireAI automation",
      budgetUsd: 3000,
      durationDays: 21,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.aiCampaignRunReportId.startsWith("acg-run-"));
    const campaign = report.campaignRecords[0]!;
    assert.ok(campaign.aiCampaignId.startsWith("acg-camp-"));
    assert.equal(campaign.metadataVersion, "ACG-001-v1");
    assert.equal(campaign.publishReady, false);
    assert.ok(campaign.recommendedChannels.length >= 1);
    assert.ok(campaign.recommendedBudget > 0);
    assert.ok(campaign.recommendedKeywords.length >= 1);
    assert.ok(campaign.recommendedCreativeAssets.length >= 1);
    assert.ok(campaign.strategySummary.length > 0);
  });

  test("strategy audience budget creatives and summary lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectAiCampaignGenerator();
    const strategy = engine.generateStrategy({ productFocus: "brand launch" });
    assert.equal(strategy.action, "generate_strategy");
    assert.equal(strategy.campaignRecords[0]!.campaignObjective, "awareness");

    const audience = engine.recommendAudience({ productFocus: "brand launch" });
    assert.ok(audience.campaignRecords[0]!.recommendedAudience.length > 0);

    const budget = engine.recommendBudget({ budgetUsd: 1000, durationDays: 7 });
    assert.ok(budget.campaignRecords[0]!.recommendedBudget > 0);

    const creatives = engine.recommendCreatives({});
    assert.ok(creatives.campaignRecords[0]!.recommendedCreativeAssets.length >= 1);

    const summary = engine.generateSummary({
      aiCampaignId: strategy.campaignRecords[0]!.aiCampaignId,
    });
    assert.equal(summary.action, "generate_summary");
    assert.ok(summary.campaignRecords[0]!.campaignSummary.includes("not published"));
  });

  test("rejects invalid budget generation", async () => {
    const { engine } = await buildEngine();
    engine.connectAiCampaignGenerator();
    const report = engine.generateCampaign({ budgetUsd: -10 });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAcgLog({
      event: "campaign_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectAiCampaignGenerator();
    const logs = getAcgLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables publish-protection or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverPublishWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(engine.getState().configuration.neverPublishWithoutValidation, true);
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAiCampaignGenerator();
    engine.generateCampaign({ objective: "leads" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.campaignsGenerated >= 1);
  });
});
