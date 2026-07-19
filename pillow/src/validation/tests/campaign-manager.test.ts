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
  buildCampaignManagerConfiguration,
  CAMPAIGN_MANAGER_SYSTEM_PATH,
  CAM_CAPABILITIES,
  CAMPAIGN_MANAGER_ID,
} from "../../campaign-manager/index.js";
import { appendCamLog, getCamLogs } from "../../campaign-manager/cam-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildCampaignManagerConfiguration>[1],
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

  const engine = createCampaignManagerEngine(
    bootstrap,
    {
      marketingFramework: mfw,
      metaAds: meta,
      googleAds: google,
      tiktokAds: tiktok,
      youtubeAds: youtube,
      seoIntelligence: seo,
    },
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-07 Campaign Manager", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
    resetGoogleAdsIntegrationForTesting();
    resetTikTokAdsIntegrationForTesting();
    resetYouTubeAdsIntegrationForTesting();
    resetSeoIntelligenceEngineForTesting();
    resetCampaignManagerForTesting();
  });

  test("buildCampaignManagerConfiguration loads defaults", () => {
    const config = buildCampaignManagerConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.requireApprovalBeforeLaunch, true);
    assert.ok(CAM_CAPABILITIES.includes("cross_channel_coordination"));
  });

  test("campaign manager initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CAM-001");
    assert.equal(state.missionId, "R5-07");
    assert.ok(CAMPAIGN_MANAGER_SYSTEM_PATH.includes("CAMPAIGN_MANAGER"));
  });

  test("connectCampaignManager registers with Marketing Framework via R5-07", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectCampaignManager();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === CAMPAIGN_MANAGER_ID));
    assert.equal(report.engineRecord.channelDependencies.meta, true);
    assert.equal(report.engineRecord.channelDependencies.seo, true);
  });

  test("createCampaign produces machine-readable cam-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    const report = engine.createCampaign({
      campaignName: "Q3 Omnichannel Push",
      campaignObjective: "conversions",
      marketingChannels: ["meta", "google", "seo"],
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.campaignRunReportId.startsWith("cam-run-"));
    assert.equal(report.campaignRecords.length, 1);
    const campaign = report.campaignRecords[0]!;
    assert.ok(campaign.campaignId.startsWith("cam-camp-"));
    assert.equal(campaign.metadataVersion, "CAM-001-v1");
    assert.equal(campaign.campaignStatus, "pending_approval");
    assert.equal(campaign.approvalRequired, true);
  });

  test("lifecycle approval scheduling and cross-channel coordination", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    const created = engine.createCampaign({
      campaignName: "Cross Platform Launch",
      campaignObjective: "awareness",
      marketingChannels: ["meta", "tiktok", "youtube", "seo"],
    });
    const campaignId = created.campaignRecords[0]!.campaignId;

    const approved = engine.approveCampaign({ campaignId });
    assert.notEqual(approved.validation.decision, "fail");
    assert.equal(approved.campaignRecords[0]?.campaignStatus, "approved");
    assert.ok(approved.campaignRecords[0]?.approvedAt);

    const startAt = new Date(Date.now() + 60_000).toISOString();
    const scheduled = engine.scheduleCampaign({
      campaignId,
      startAt,
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "UTC",
    });
    assert.notEqual(scheduled.validation.decision, "fail");
    assert.equal(scheduled.campaignRecords[0]?.campaignStatus, "scheduled");

    const coordinated = engine.coordinateChannels({ campaignId });
    assert.notEqual(coordinated.validation.decision, "fail");
    assert.equal(coordinated.campaignRecords[0]?.campaignStatus, "running");
    assert.ok(
      ["executing", "partial", "succeeded"].includes(
        coordinated.campaignRecords[0]!.executionStatus,
      ),
    );
  });

  test("rejects launch without approval", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    const created = engine.createCampaign({
      campaignName: "Unapproved Launch",
      campaignObjective: "traffic",
      marketingChannels: ["google"],
    });
    const campaignId = created.campaignRecords[0]!.campaignId;
    const launch = engine.coordinateChannels({ campaignId });
    assert.equal(launch.validation.decision, "fail");
  });

  test("rejects duplicate campaign names", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    engine.createCampaign({
      campaignName: "Duplicate Name",
      campaignObjective: "leads",
      marketingChannels: ["meta"],
    });
    const dup = engine.createCampaign({
      campaignName: "Duplicate Name",
      campaignObjective: "leads",
      marketingChannels: ["google"],
    });
    assert.equal(dup.validation.decision, "fail");
  });

  test("execution tracking and failure detection", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    const created = engine.createCampaign({
      campaignName: "Exec Track",
      campaignObjective: "engagement",
      marketingChannels: ["meta", "google"],
    });
    const campaignId = created.campaignRecords[0]!.campaignId;
    engine.approveCampaign({ campaignId });
    engine.coordinateChannels({ campaignId });

    const tracked = engine.trackExecution({ campaignId });
    assert.notEqual(tracked.validation.decision, "fail");
    assert.equal(tracked.action, "track_execution");

    const failures = engine.detectFailures({ campaignId });
    assert.equal(failures.action, "detect_failures");
  });

  test("objective and status updates", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    const created = engine.createCampaign({
      campaignName: "Objective Swap",
      campaignObjective: "awareness",
      marketingChannels: ["seo"],
    });
    const campaignId = created.campaignRecords[0]!.campaignId;
    const objective = engine.setObjective({
      campaignId,
      campaignObjective: "conversions",
    });
    assert.equal(objective.campaignRecords[0]?.campaignObjective, "conversions");

    const status = engine.updateStatus({
      campaignId,
      campaignStatus: "paused",
    });
    assert.equal(status.campaignRecords[0]?.campaignStatus, "paused");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCamLog({
      event: "campaign_creation",
      level: "info",
      details: "api_key=secret-key bearer abc123 access_token=xyz",
    });
    await engine.connectCampaignManager();
    const logs = getCamLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("never disables approval before launch", async () => {
    const { engine } = await buildEngine({
      // @ts-expect-error intentional attempt to override forbidden flag
      requireApprovalBeforeLaunch: false,
    });
    assert.equal(engine.getState().configuration.requireApprovalBeforeLaunch, true);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCampaignManager();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.channelsConnected >= 1);
  });
});
