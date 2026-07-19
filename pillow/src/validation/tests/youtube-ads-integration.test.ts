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
  createGoogleAdsIntegration,
  resetGoogleAdsIntegrationForTesting,
} from "../../google-ads-integration/index.js";
import {
  createYouTubeAdsIntegration,
  resetYouTubeAdsIntegrationForTesting,
  buildYouTubeAdsIntegrationConfiguration,
  YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH,
  YAI_CAPABILITIES,
  YOUTUBE_ADS_INTEGRATION_ID,
} from "../../youtube-ads-integration/index.js";
import { appendYaiLog, getYaiLogs } from "../../youtube-ads-integration/yai-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildYouTubeAdsIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();
  const googleAds = createGoogleAdsIntegration(bootstrap, mfw);
  await googleAds.initialize();
  googleAds.connectGoogleAds();
  const engine = createYouTubeAdsIntegration(bootstrap, mfw, googleAds, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mfw, googleAds };
}

describe("R5-05 YouTube Ads Integration", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
  });

  test("buildYouTubeAdsIntegrationConfiguration loads defaults", () => {
    const config = buildYouTubeAdsIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://youtube-ads-api");
    assert.equal(config.videoAssetRulesEnabled, true);
    assert.ok(YAI_CAPABILITIES.includes("video_asset_management"));
  });

  test("youtube ads integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-YAI-001");
    assert.equal(state.missionId, "R5-05");
    assert.ok(YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH.includes("YOUTUBE_ADS"));
  });

  test("connectYouTubeAds registers with Marketing Framework via R5-05", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectYouTubeAds();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === YOUTUBE_ADS_INTEGRATION_ID));
  });

  test("connectYouTubeAds consumes Google Ads Integration dependency", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectYouTubeAds();
    assert.equal(report.engineRecord.googleAdsDependencyPresent, true);
    assert.ok(report.youtubeAdsRunReportId.startsWith("yai-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("yai-"));
    assert.equal(report.engineRecord.metadataVersion, "YAI-001-v1");
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectYouTubeAds({
      credentialRef: "vault://youtube-ads-api",
    });
    assert.equal(report.engineRecord.authenticationStatus, "authenticated");
    assert.equal(report.engineRecord.credentialRefPresent, true);
    const logs = getYaiLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("advertiser account management works", async () => {
    const { engine } = await buildEngine();
    engine.connectYouTubeAds();
    const advertiser = engine.manageAdvertiserAccount({
      advertiserAccountId: "adv-yt-1001",
      advertiserName: "EmpireAI YouTube Growth",
    });
    assert.notEqual(advertiser.validation.decision, "fail");
    assert.equal(advertiser.engineRecord.advertiserAccountId, "adv-yt-1001");
  });

  test("createCampaign produces machine-readable youtube ads records", async () => {
    const { engine } = await buildEngine();
    engine.connectYouTubeAds();
    const report = engine.createCampaign({
      campaignName: "TrueView Brand",
      objective: "video_views",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_campaign");
    assert.equal(report.youtubeAdsRecords.length, 1);
    const record = report.youtubeAdsRecords[0]!;
    assert.ok(record.youtubeAdsRecordId.startsWith("yai-rec-"));
    assert.ok(record.campaignReference.startsWith("yai-camp-"));
    assert.equal(record.campaignStatus, "draft");
    assert.equal(record.metadataVersion, "YAI-001-v1");
    assert.equal(record.videoAssetReference, null);
  });

  test("video asset, ad group, and video advertisement lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectYouTubeAds();
    const created = engine.createCampaign({ campaignName: "In-Stream Push" });
    const campaignReference = created.youtubeAdsRecords[0]!.campaignReference;

    const asset = engine.manageVideoAsset({
      videoAssetName: "Hero Spot 15s",
      durationSeconds: 15,
      campaignReference,
    });
    assert.notEqual(asset.validation.decision, "fail");
    assert.ok(asset.youtubeAdsRecords[0]?.videoAssetReference?.startsWith("yai-vid-"));
    const videoAssetReference = asset.youtubeAdsRecords[0]!.videoAssetReference!;

    const adGroup = engine.createAdGroup({
      campaignReference,
      adGroupName: "Skippable In-Stream",
      dailyBudget: 100,
    });
    assert.notEqual(adGroup.validation.decision, "fail");
    assert.ok(adGroup.youtubeAdsRecords[0]?.adGroupReference?.startsWith("yai-adgroup-"));

    const ad = engine.createVideoAdvertisement({
      campaignReference,
      adGroupReference: adGroup.youtubeAdsRecords[0]!.adGroupReference!,
      videoAssetReference,
      advertisementName: "TrueView Primary",
    });
    assert.notEqual(ad.validation.decision, "fail");
    assert.ok(ad.youtubeAdsRecords[0]?.advertisementReference?.startsWith("yai-ad-"));
    assert.equal(ad.youtubeAdsRecords[0]?.videoAssetReference, videoAssetReference);
    assert.equal(ad.youtubeAdsRecords[0]?.campaignStatus, "pending_review");
  });

  test("performance retrieval and campaign status sync", async () => {
    const { engine } = await buildEngine();
    engine.connectYouTubeAds();
    const created = engine.createCampaign({ campaignName: "Perf Test" });
    const campaignReference = created.youtubeAdsRecords[0]!.campaignReference;

    const performance = engine.retrievePerformance({ campaignReference });
    assert.notEqual(performance.validation.decision, "fail");
    assert.equal(performance.action, "retrieve_performance");
    assert.ok(performance.youtubeAdsRecords[0]!.views > 0);

    const synced = engine.syncCampaignStatus({ campaignReference });
    assert.notEqual(synced.validation.decision, "fail");
    assert.equal(synced.action, "sync_campaign_status");
    assert.equal(synced.youtubeAdsRecords[0]?.synchronizationStatus, "synced");
  });

  test("rejects campaign creation without name", async () => {
    const { engine } = await buildEngine();
    engine.connectYouTubeAds();
    const report = engine.createCampaign({ campaignName: "   " });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendYaiLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 access_token=xyz",
    });
    await engine.connectYouTubeAds();
    const logs = getYaiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectYouTubeAds();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.googleAdsDependencyPresent, true);
  });
});
