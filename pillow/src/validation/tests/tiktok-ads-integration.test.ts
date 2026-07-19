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
  createTikTokAdsIntegration,
  resetTikTokAdsIntegrationForTesting,
  buildTikTokAdsIntegrationConfiguration,
  TIKTOK_ADS_INTEGRATION_SYSTEM_PATH,
  TAI_CAPABILITIES,
  TIKTOK_ADS_INTEGRATION_ID,
} from "../../tiktok-ads-integration/index.js";
import { appendTaiLog, getTaiLogs } from "../../tiktok-ads-integration/tai-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildTikTokAdsIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();
  const engine = createTikTokAdsIntegration(bootstrap, mfw, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-04 TikTok Ads Integration", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetTikTokAdsIntegrationForTesting();
  });

  test("buildTikTokAdsIntegrationConfiguration loads defaults", () => {
    const config = buildTikTokAdsIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://tiktok-ads-api");
    assert.equal(config.audienceSynchronizationRulesEnabled, true);
    assert.ok(TAI_CAPABILITIES.includes("audience_synchronization"));
  });

  test("tiktok ads integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-TAI-001");
    assert.equal(state.missionId, "R5-04");
    assert.ok(TIKTOK_ADS_INTEGRATION_SYSTEM_PATH.includes("TIKTOK_ADS"));
  });

  test("connectTikTokAds registers with Marketing Framework via R5-04", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectTikTokAds();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === TIKTOK_ADS_INTEGRATION_ID));
  });

  test("connectTikTokAds produces machine-readable tai-* records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectTikTokAds();
    assert.ok(report.tiktokAdsRunReportId.startsWith("tai-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("tai-"));
    assert.equal(report.engineRecord.integrationId, TIKTOK_ADS_INTEGRATION_ID);
    assert.equal(report.engineRecord.metadataVersion, "TAI-001-v1");
    assert.ok(report.engineRecord.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectTikTokAds({
      credentialRef: "vault://tiktok-ads-api",
    });
    assert.equal(report.engineRecord.authenticationStatus, "authenticated");
    assert.equal(report.engineRecord.credentialRefPresent, true);
    const logs = getTaiLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("advertiser account management works", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokAds();
    const advertiser = engine.manageAdvertiserAccount({
      advertiserAccountId: "adv-1001",
      advertiserName: "EmpireAI TikTok Growth",
    });
    assert.notEqual(advertiser.validation.decision, "fail");
    assert.equal(advertiser.engineRecord.advertiserAccountId, "adv-1001");
  });

  test("createCampaign produces machine-readable tiktok ads records", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokAds();
    const report = engine.createCampaign({
      campaignName: "Spark Ads Brand",
      objective: "conversions",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_campaign");
    assert.equal(report.tiktokAdsRecords.length, 1);
    const record = report.tiktokAdsRecords[0]!;
    assert.ok(record.tiktokAdsRecordId.startsWith("tai-rec-"));
    assert.ok(record.campaignReference.startsWith("tai-camp-"));
    assert.equal(record.campaignStatus, "draft");
    assert.equal(record.metadataVersion, "TAI-001-v1");
    assert.equal(record.audienceReference, null);
  });

  test("campaign ad group and advertisement lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokAds();
    const created = engine.createCampaign({ campaignName: "In-Feed Push" });
    const campaignReference = created.tiktokAdsRecords[0]!.campaignReference;

    const adGroup = engine.createAdGroup({
      campaignReference,
      adGroupName: "Interest Lookalike",
      dailyBudget: 75,
    });
    assert.notEqual(adGroup.validation.decision, "fail");
    assert.ok(adGroup.tiktokAdsRecords[0]?.adGroupReference?.startsWith("tai-adgroup-"));

    const ad = engine.createAdvertisement({
      campaignReference,
      adGroupReference: adGroup.tiktokAdsRecords[0]!.adGroupReference!,
      advertisementName: "Spark Primary",
    });
    assert.notEqual(ad.validation.decision, "fail");
    assert.ok(ad.tiktokAdsRecords[0]?.advertisementReference?.startsWith("tai-ad-"));
    assert.equal(ad.tiktokAdsRecords[0]?.campaignStatus, "pending_review");
  });

  test("performance retrieval, campaign status sync, and audience sync", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokAds();
    const created = engine.createCampaign({ campaignName: "Perf Test" });
    const campaignReference = created.tiktokAdsRecords[0]!.campaignReference;

    const performance = engine.retrievePerformance({ campaignReference });
    assert.notEqual(performance.validation.decision, "fail");
    assert.equal(performance.action, "retrieve_performance");
    assert.ok(performance.tiktokAdsRecords[0]!.impressions > 0);

    const synced = engine.syncCampaignStatus({ campaignReference });
    assert.notEqual(synced.validation.decision, "fail");
    assert.equal(synced.action, "sync_campaign_status");
    assert.equal(synced.tiktokAdsRecords[0]?.synchronizationStatus, "synced");

    const audience = engine.syncAudience({
      campaignReference,
      audienceName: "Lookalike Shoppers",
    });
    assert.notEqual(audience.validation.decision, "fail");
    assert.equal(audience.action, "sync_audience");
    assert.ok(audience.tiktokAdsRecords[0]?.audienceReference?.startsWith("tai-aud-"));
  });

  test("rejects campaign creation without name", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokAds();
    const report = engine.createCampaign({ campaignName: "   " });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendTaiLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 access_token=xyz",
    });
    await engine.connectTikTokAds();
    const logs = getTaiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokAds();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
