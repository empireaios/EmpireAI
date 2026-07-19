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
  buildBudgetOptimizationEngineConfiguration,
  BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH,
  BOE_CAPABILITIES,
  BUDGET_OPTIMIZATION_ENGINE_ID,
} from "../../budget-optimization-engine/index.js";
import { appendBoeLog, getBoeLogs } from "../../budget-optimization-engine/boe-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildBudgetOptimizationEngineConfiguration>[1],
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

  const campaignManager = createCampaignManagerEngine(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: null,
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
  audience.buildAudience({ audienceName: "Budget Cohort", estimatedSize: 900 });

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
    customerRef: "cust-ref-budget1",
    marketingChannel: "meta_ads",
  });
  attribution.attribute({
    customerRef: "cust-ref-budget1",
    conversionValue: 400,
  });

  const dashboard = createMarketingAnalyticsDashboard(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: null,
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
    seoIntelligence: null,
    campaignManager,
    audienceIntelligence: audience,
    attributionEngine: attribution,
    marketingAnalyticsDashboard: dashboard,
    creativeAssetManager: null,
  });
  await aiCampaigns.initialize();
  aiCampaigns.connectAiCampaignGenerator();
  aiCampaigns.generateCampaign({ objective: "conversions", budgetUsd: 2500 });

  const engine = createBudgetOptimizationEngine(
    bootstrap,
    {
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
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-13 Budget Optimization Engine", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetCampaignManagerForTesting();
    resetAudienceIntelligenceForTesting();
    resetAttributionEngineForTesting();
    resetMarketingAnalyticsDashboardForTesting();
    resetAiCampaignGeneratorForTesting();
    resetBudgetOptimizationEngineForTesting();
  });

  test("buildBudgetOptimizationEngineConfiguration loads defaults", () => {
    const config = buildBudgetOptimizationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverModifyActiveBudgetsWithoutValidation, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(BOE_CAPABILITIES.includes("dynamic_budget_reallocation"));
  });

  test("budget optimization engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BOE-001");
    assert.equal(state.missionId, "R5-13");
    assert.ok(BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH.includes("BUDGET_OPTIMIZATION"));
  });

  test("connectBudgetOptimization registers with Marketing Framework via R5-13", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectBudgetOptimization();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === BUDGET_OPTIMIZATION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.attributionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.aiCampaignGenerator, true);
  });

  test("allocateBudget produces machine-readable boe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectBudgetOptimization();
    const report = engine.allocateBudget({
      marketingChannel: "meta_ads",
      allocatedBudget: 1000,
      currentSpend: 250,
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.budgetRunReportId.startsWith("boe-run-"));
    const budget = report.budgetRecords[0]!;
    assert.ok(budget.budgetRecordId.startsWith("boe-bud-"));
    assert.equal(budget.metadataVersion, "BOE-001-v1");
    assert.equal(budget.appliedToActiveCampaign, false);
    assert.equal(budget.allocatedBudget, 1000);
    assert.equal(budget.remainingBudget, 750);
    assert.equal(budget.budgetUtilization, 25);
  });

  test("reallocate optimize recommend and overspend lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectBudgetOptimization();
    engine.allocateBudget({
      marketingChannel: "google_ads",
      allocatedBudget: 500,
      currentSpend: 600,
    });

    const reallocated = engine.reallocateBudget({ totalBudget: 4000 });
    assert.ok(reallocated.budgetRecords.length >= 2);

    const recommendations = engine.recommendAdjustments();
    assert.ok(recommendations.budgetRecords.length >= 1);
    assert.ok(recommendations.budgetRecords[0]!.optimizationRecommendation.length > 0);

    const overspend = engine.detectOverspend();
    assert.equal(overspend.action, "detect_overspend");

    const optimized = engine.optimizeBudgets({ validated: true });
    assert.notEqual(optimized.validation.decision, "fail");
    assert.ok(optimized.budgetRecords.every((b) => b.appliedToActiveCampaign === false));
  });

  test("rejects unvalidated active budget modification", async () => {
    const { engine } = await buildEngine();
    engine.connectBudgetOptimization();
    const report = engine.optimizeBudgets({ validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBoeLog({
      event: "budget_allocation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectBudgetOptimization();
    const logs = getBoeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables active-budget or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyActiveBudgetsWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(engine.getState().configuration.neverModifyActiveBudgetsWithoutValidation, true);
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectBudgetOptimization();
    engine.allocateBudget({ marketingChannel: "tiktok_ads", allocatedBudget: 800 });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalBudgetRecords >= 1);
  });
});
