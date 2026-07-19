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
  createMarketingAnalyticsDashboard,
  resetMarketingAnalyticsDashboardForTesting,
} from "../../marketing-analytics-dashboard/index.js";
import {
  createCreativeAssetManager,
  resetCreativeAssetManagerForTesting,
  buildCreativeAssetManagerConfiguration,
  CREATIVE_ASSET_MANAGER_SYSTEM_PATH,
  CRA_CAPABILITIES,
  CREATIVE_ASSET_MANAGER_ID,
} from "../../creative-asset-manager/index.js";
import { appendCraLog, getCraLogs } from "../../creative-asset-manager/cra-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCreativeAssetManagerConfiguration>[1],
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

  const dashboard = createMarketingAnalyticsDashboard(bootstrap, {
    marketingFramework: mfw,
    metaAds: meta,
    googleAds: google,
    tiktokAds: tiktok,
    youtubeAds: youtube,
    seoIntelligence: null,
    campaignManager,
    audienceIntelligence: null,
    attributionEngine: null,
  });
  await dashboard.initialize();
  dashboard.connectDashboard();

  const engine = createCreativeAssetManager(
    bootstrap,
    {
      marketingFramework: mfw,
      campaignManager,
      marketingAnalyticsDashboard: dashboard,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-11 Creative Asset Manager", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetCampaignManagerForTesting();
    resetMarketingAnalyticsDashboardForTesting();
    resetCreativeAssetManagerForTesting();
  });

  test("buildCreativeAssetManagerConfiguration loads defaults", () => {
    const config = buildCreativeAssetManagerConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverOverwriteApprovedWithoutValidation, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(CRA_CAPABILITIES.includes("version_management"));
  });

  test("creative asset manager initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CRA-001");
    assert.equal(state.missionId, "R5-11");
    assert.ok(CREATIVE_ASSET_MANAGER_SYSTEM_PATH.includes("CREATIVE_ASSET_MANAGER"));
  });

  test("connectCreativeAssetManager registers with Marketing Framework via R5-11", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectCreativeAssetManager();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === CREATIVE_ASSET_MANAGER_ID));
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingAnalyticsDashboard, true);
  });

  test("createAsset produces machine-readable cra-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCreativeAssetManager();
    const report = engine.createAsset({
      assetName: "Hero Banner Q3",
      assetType: "image",
      tags: ["hero", "brand"],
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.creativeRunReportId.startsWith("cra-run-"));
    const asset = report.assetRecords[0]!;
    assert.ok(asset.assetId.startsWith("cra-asset-"));
    assert.equal(asset.metadataVersion, "CRA-001-v1");
    assert.equal(asset.version, 1);
    assert.equal(asset.approvalStatus, "draft");
    assert.ok(asset.storageRef.startsWith("vault://"));
  });

  test("version approval usage and search lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectCreativeAssetManager();
    const created = engine.createAsset({
      assetName: "Video Spot A",
      assetType: "video",
      tags: ["retargeting"],
    });
    const id = created.assetRecords[0]!.assetId;

    const versioned = engine.createVersion({ assetId: id, changeSummary: "Trim intro" });
    assert.equal(versioned.assetRecords[0]!.version, 2);
    assert.equal(versioned.versions[0]!.version, 2);

    const approved = engine.approveAsset({ assetId: id });
    assert.equal(approved.assetRecords[0]!.approvalStatus, "approved");

    const blocked = engine.updateAsset({ assetId: id, assetName: "Overwrite Attempt" });
    assert.equal(blocked.validation.decision, "fail");

    const usage = engine.trackUsage({ assetId: id, context: "meta_ads_placement" });
    assert.equal(usage.assetRecords[0]!.usageCount, 1);
    assert.equal(usage.assetRecords[0]!.usageStatus, "in_use");

    const search = engine.searchAssets({ query: "video", assetType: "video" });
    assert.ok(search.assetRecords.some((a) => a.assetId === id));
  });

  test("rejects asset create without name", async () => {
    const { engine } = await buildEngine();
    engine.connectCreativeAssetManager();
    const report = engine.createAsset({ assetName: "   ", assetType: "document" });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCraLog({
      event: "asset_creation",
      level: "info",
      details: "storage_key=secret-key bearer abc123",
    });
    await engine.connectCreativeAssetManager();
    const logs = getCraLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables approved-overwrite or masking guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverOverwriteApprovedWithoutValidation: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      maskSensitiveValues: false,
    });
    assert.equal(engine.getState().configuration.neverOverwriteApprovedWithoutValidation, true);
    assert.equal(engine.getState().configuration.maskSensitiveValues, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCreativeAssetManager();
    engine.createAsset({ assetName: "Doc Pack", assetType: "document" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
    assert.ok(cockpit.totalAssets >= 1);
  });
});
