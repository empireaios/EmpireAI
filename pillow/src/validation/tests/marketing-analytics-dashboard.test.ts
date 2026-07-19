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
  buildMarketingAnalyticsDashboardConfiguration,
  MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH,
  MAD_CAPABILITIES,
  MARKETING_ANALYTICS_DASHBOARD_ID,
} from "../../marketing-analytics-dashboard/index.js";
import { appendMadLog, getMadLogs } from "../../marketing-analytics-dashboard/mad-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMarketingAnalyticsDashboardConfiguration>[1],
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
  audience.buildAudience({
    audienceName: "Dashboard Cohort",
    estimatedSize: 1000,
    demographicHints: ["professionals"],
    interestHints: ["saas"],
    behaviourHints: ["engaged"],
  });

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
    customerRef: "cust-ref-dash1",
    marketingChannel: "meta_ads",
  });
  attribution.attribute({
    customerRef: "cust-ref-dash1",
    conversionValue: 180,
    attributionModel: "linear",
  });

  const engine = createMarketingAnalyticsDashboard(
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
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-10 Marketing Analytics Dashboard", () => {
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
  });

  test("buildMarketingAnalyticsDashboardConfiguration loads defaults", () => {
    const config = buildMarketingAnalyticsDashboardConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.requireAuthorizedAccess, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(MAD_CAPABILITIES.includes("campaign_performance_display"));
  });

  test("dashboard initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MAD-001");
    assert.equal(state.missionId, "R5-10");
    assert.ok(MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH.includes("MARKETING_ANALYTICS_DASHBOARD"));
  });

  test("connectDashboard registers with Marketing Framework via R5-10", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectDashboard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === MARKETING_ANALYTICS_DASHBOARD_ID));
    assert.equal(report.engineRecord.dependencyPresence.attributionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.seoIntelligence, true);
  });

  test("refreshDashboard produces machine-readable cockpit snapshot", async () => {
    const { engine } = await buildEngine();
    engine.connectDashboard();
    const report = engine.refreshDashboard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.dashboardRunReportId.startsWith("mad-run-"));
    const snapshot = report.snapshot!;
    assert.ok(snapshot.dashboardId.startsWith("mad-dash-"));
    assert.equal(snapshot.metadataVersion, "MAD-001-v1");
    assert.ok(snapshot.advertisingSpendSummary.totalSpend >= 0);
    assert.ok(snapshot.trafficSummary.impressions >= 0);
    assert.ok(snapshot.conversionSummary.conversions >= 0);
    assert.ok(typeof snapshot.roiSummary.roas === "number");
    assert.ok(snapshot.audienceSummary.totalAudiences >= 1);
    assert.ok(snapshot.widgets.some((w) => w.widgetType === "campaign_performance"));
    assert.ok(snapshot.widgets.some((w) => w.widgetType === "seo_performance"));
    assert.ok(snapshot.executiveSummary.length > 0);
  });

  test("aggregateKpis and executive summary lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectDashboard();
    const kpis = engine.aggregateKpis();
    assert.ok(kpis.snapshot!.kpiSummary.overallScore >= 0);
    const summary = engine.generateExecutiveSummary();
    assert.equal(summary.action, "generate_executive_summary");
    assert.ok(summary.snapshot!.executiveSummary.includes("Executive marketing cockpit"));
  });

  test("rejects unauthorized dashboard access", async () => {
    const { engine } = await buildEngine();
    engine.connectDashboard();
    const report = engine.refreshDashboard({ authorized: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMadLog({
      event: "dashboard_refresh",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    await engine.connectDashboard();
    const logs = getMadLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables authorization or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      requireAuthorizedAccess: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(engine.getState().configuration.requireAuthorizedAccess, true);
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectDashboard();
    engine.refreshDashboard();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.dashboardRefreshes >= 1);
  });
});
