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
  buildAudienceIntelligenceConfiguration,
  AUDIENCE_INTELLIGENCE_SYSTEM_PATH,
  AUD_CAPABILITIES,
  AUDIENCE_INTELLIGENCE_ID,
} from "../../audience-intelligence/index.js";
import { appendAudLog, getAudLogs } from "../../audience-intelligence/aud-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildAudienceIntelligenceConfiguration>[1],
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

  const engine = createAudienceIntelligenceEngine(
    bootstrap,
    {
      marketingFramework: mfw,
      customerSegmentation: null,
      customerJourney: null,
      metaAds: meta,
      googleAds: google,
      tiktokAds: tiktok,
      youtubeAds: youtube,
      campaignManager,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-08 Audience Intelligence", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetCampaignManagerForTesting();
    resetAudienceIntelligenceForTesting();
  });

  test("buildAudienceIntelligenceConfiguration loads defaults", () => {
    const config = buildAudienceIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.redactPiiInRecords, true);
    assert.ok(AUD_CAPABILITIES.includes("audience_building"));
  });

  test("audience intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AUD-001");
    assert.equal(state.missionId, "R5-08");
    assert.ok(AUDIENCE_INTELLIGENCE_SYSTEM_PATH.includes("AUDIENCE_INTELLIGENCE"));
  });

  test("connectAudienceIntelligence registers with Marketing Framework via R5-08", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectAudienceIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === AUDIENCE_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.campaignManager, true);
    assert.equal(report.engineRecord.dependencyPresence.metaAds, true);
  });

  test("buildAudience produces machine-readable aud-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectAudienceIntelligence();
    const report = engine.buildAudience({
      audienceName: "High Intent Shoppers",
      audienceSource: "composite",
      estimatedSize: 2500,
      demographicHints: ["25-44", "urban"],
      interestHints: ["productivity", "ai tools"],
      behaviourHints: ["repeat visitors"],
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.audienceRunReportId.startsWith("aud-run-"));
    const audience = report.audienceRecords[0]!;
    assert.ok(audience.audienceRecordId.startsWith("aud-rec-"));
    assert.equal(audience.metadataVersion, "AUD-001-v1");
    assert.equal(audience.piiRedacted, true);
    assert.equal(audience.audienceSize, 2500);
  });

  test("behaviour quality and recommendation lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectAudienceIntelligence();
    const built = engine.buildAudience({
      audienceName: "Retarget Cohort A",
      estimatedSize: 800,
      demographicHints: ["professionals"],
      interestHints: ["saas"],
      behaviourHints: ["cart viewers"],
    });
    const id = built.audienceRecords[0]!.audienceRecordId;

    assert.notEqual(engine.analyzeDemographics({ audienceRecordId: id }).validation.decision, "fail");
    assert.notEqual(engine.analyzeInterests({ audienceRecordId: id }).validation.decision, "fail");
    assert.notEqual(engine.analyzeBehaviour({ audienceRecordId: id }).validation.decision, "fail");
    assert.notEqual(engine.analyzeIntent({ audienceRecordId: id }).validation.decision, "fail");

    const engagement = engine.measureEngagement({ audienceRecordId: id });
    assert.ok(engagement.audienceRecords[0]!.engagementScore > 0);

    const quality = engine.measureQuality({ audienceRecordId: id });
    assert.ok(quality.audienceRecords[0]!.audienceQualityScore > 0);

    const recs = engine.generateRecommendations({ audienceRecordId: id });
    assert.ok(recs.recommendations.length >= 1);
  });

  test("overlap detection across audiences", async () => {
    const { engine } = await buildEngine();
    engine.connectAudienceIntelligence();
    engine.buildAudience({ audienceName: "Lookalike Buyers", estimatedSize: 1000 });
    engine.buildAudience({ audienceName: "Lookalike Buyers Plus", estimatedSize: 1200 });
    const overlap = engine.detectOverlap();
    assert.equal(overlap.action, "detect_overlap");
    assert.ok(overlap.overlaps.length >= 1);
  });

  test("rejects audience build without name", async () => {
    const { engine } = await buildEngine();
    engine.connectAudienceIntelligence();
    const report = engine.buildAudience({ audienceName: "   " });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAudLog({
      event: "audience_analysis",
      level: "info",
      details: "api_key=secret-key bearer abc123 email@example.com",
    });
    await engine.connectAudienceIntelligence();
    const logs = getAudLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables PII redaction", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flag
      redactPiiInRecords: false,
    });
    assert.equal(engine.getState().configuration.redactPiiInRecords, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAudienceIntelligence();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.dependenciesConnected >= 1);
  });
});
