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
  buildAttributionEngineConfiguration,
  ATTRIBUTION_ENGINE_SYSTEM_PATH,
  ATT_CAPABILITIES,
  ATTRIBUTION_ENGINE_ID,
} from "../../attribution-engine/index.js";
import { appendAttLog, getAttLogs } from "../../attribution-engine/att-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAttributionEngineConfiguration>[1],
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

  const engine = createAttributionEngine(
    bootstrap,
    {
      marketingFramework: mfw,
      metaAds: meta,
      googleAds: google,
      tiktokAds: tiktok,
      youtubeAds: youtube,
      campaignManager,
      audienceIntelligence: audience,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-09 Attribution Engine", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetCampaignManagerForTesting();
    resetAudienceIntelligenceForTesting();
    resetAttributionEngineForTesting();
  });

  test("buildAttributionEngineConfiguration loads defaults", () => {
    const config = buildAttributionEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.neverModifyCampaignData, true);
    assert.equal(config.redactCustomerIdentifiers, true);
    assert.ok(ATT_CAPABILITIES.includes("multi_model_attribution"));
  });

  test("attribution engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ATT-001");
    assert.equal(state.missionId, "R5-09");
    assert.ok(ATTRIBUTION_ENGINE_SYSTEM_PATH.includes("ATTRIBUTION_ENGINE"));
  });

  test("connectAttributionEngine registers with Marketing Framework via R5-09", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectAttributionEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === ATTRIBUTION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.audienceIntelligence, true);
  });

  test("tracks acquisition sources and touchpoints with redacted customer refs", async () => {
    const { engine } = await buildEngine();
    engine.connectAttributionEngine();
    const acquisition = engine.trackAcquisitionSource({
      customerRef: "user-alpha@example.com",
      marketingChannel: "meta_ads",
      sourceLabel: "cold_prospect",
    });
    assert.notEqual(acquisition.validation.decision, "fail");
    assert.ok(acquisition.touchpoints[0]!.customerRef.startsWith("cust-ref-"));
    assert.equal(acquisition.touchpoints[0]!.piiRedacted, true);

    const touch = engine.trackTouchpoint({
      customerRef: "user-alpha@example.com",
      marketingChannel: "google_ads",
      advertisementReference: "ad-123",
    });
    assert.equal(touch.action, "track_touchpoint");
    assert.equal(touch.touchpoints[0]!.sequenceIndex, 1);
  });

  test("multi-model attribution and ROI lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectAttributionEngine();
    engine.trackTouchpoint({
      customerRef: "cust-ref-buyer1",
      marketingChannel: "tiktok_ads",
      campaignReference: "camp-a",
    });
    engine.trackTouchpoint({
      customerRef: "cust-ref-buyer1",
      marketingChannel: "youtube_ads",
      campaignReference: "camp-a",
    });

    const attributed = engine.attribute({
      customerRef: "cust-ref-buyer1",
      conversionValue: 200,
      attributionModel: "linear",
    });
    assert.notEqual(attributed.validation.decision, "fail", attributed.validation.errors.join("; "));
    assert.ok(attributed.attributionRunReportId.startsWith("att-run-"));
    assert.ok(attributed.attributionRecords[0]!.attributionRecordId.startsWith("att-rec-"));
    assert.equal(attributed.attributionRecords[0]!.metadataVersion, "ATT-001-v1");
    assert.equal(attributed.attributionRecords.length, 2);
    const sum = attributed.attributionRecords.reduce((s, r) => s + r.attributionValue, 0);
    assert.ok(Math.abs(sum - 200) < 0.02);

    const channel = engine.measureChannelContribution({ customerRef: "cust-ref-buyer1" });
    assert.ok(channel.contributions.length >= 1);

    const roi = engine.calculateMarketingRoi({
      spend: 50,
      revenue: 200,
      customerRef: "cust-ref-buyer1",
    });
    assert.ok(roi.roi);
    assert.equal(roi.roi!.roas, 4);
    assert.equal(roi.roi!.marketingRoiPercent, 300);
  });

  test("rejects invalid conversion attribution", async () => {
    const { engine } = await buildEngine();
    engine.connectAttributionEngine();
    const report = engine.attribute({
      customerRef: "   ",
      conversionValue: -10,
    });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAttLog({
      event: "attribution_calculations",
      level: "info",
      details: "api_key=secret-key bearer abc123 email@example.com",
    });
    await engine.connectAttributionEngine();
    const logs = getAttLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables campaign-mutation or customer redaction guards", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flags
      neverModifyCampaignData: false,
      // @ts-expect-error intentional attempt to override forbidden flags
      redactCustomerIdentifiers: false,
    });
    assert.equal(engine.getState().configuration.neverModifyCampaignData, true);
    assert.equal(engine.getState().configuration.redactCustomerIdentifiers, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAttributionEngine();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
