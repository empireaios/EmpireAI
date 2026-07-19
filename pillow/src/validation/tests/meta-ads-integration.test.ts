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
  buildMetaAdsIntegrationConfiguration,
  META_ADS_INTEGRATION_SYSTEM_PATH,
  MAI_CAPABILITIES,
  META_ADS_INTEGRATION_ID,
} from "../../meta-ads-integration/index.js";
import { appendMaiLog, getMaiLogs } from "../../meta-ads-integration/mai-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMetaAdsIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();
  const engine = createMetaAdsIntegration(bootstrap, mfw, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-02 Meta Ads Integration", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetMetaAdsIntegrationForTesting();
  });

  test("buildMetaAdsIntegrationConfiguration loads defaults", () => {
    const config = buildMetaAdsIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://meta-ads-api");
    assert.ok(MAI_CAPABILITIES.includes("campaign_creation"));
  });

  test("meta ads integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MAI-001");
    assert.equal(state.missionId, "R5-02");
    assert.ok(META_ADS_INTEGRATION_SYSTEM_PATH.includes("META_ADS"));
  });

  test("connectMetaAds registers with Marketing Framework via R5-02", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectMetaAds();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === META_ADS_INTEGRATION_ID));
  });

  test("connectMetaAds produces machine-readable mai-* records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectMetaAds();
    assert.ok(report.metaRunReportId.startsWith("mai-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("mai-"));
    assert.equal(report.engineRecord.integrationId, META_ADS_INTEGRATION_ID);
    assert.equal(report.engineRecord.metadataVersion, "MAI-001-v1");
    assert.ok(report.engineRecord.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectMetaAds({
      credentialRef: "vault://meta-ads-api",
    });
    assert.equal(report.engineRecord.authenticationStatus, "authenticated");
    assert.equal(report.engineRecord.credentialRefPresent, true);
    const logs = getMaiLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("business and ad account management works", async () => {
    const { engine } = await buildEngine();
    engine.connectMetaAds();
    const business = engine.manageBusinessAccount({
      businessAccountId: "biz-1001",
      businessName: "EmpireAI Marketing",
    });
    assert.notEqual(business.validation.decision, "fail");
    assert.equal(business.engineRecord.businessAccountId, "biz-1001");

    const adAccount = engine.manageAdAccount({
      adAccountId: "act-2001",
      businessAccountId: "biz-1001",
    });
    assert.notEqual(adAccount.validation.decision, "fail");
    assert.equal(adAccount.engineRecord.adAccountId, "act-2001");
  });

  test("createCampaign produces machine-readable meta ads records", async () => {
    const { engine } = await buildEngine();
    engine.connectMetaAds();
    const report = engine.createCampaign({
      campaignName: "Launch Awareness",
      objective: "awareness",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_campaign");
    assert.equal(report.metaRecords.length, 1);
    const record = report.metaRecords[0]!;
    assert.ok(record.metaRecordId.startsWith("mai-rec-"));
    assert.ok(record.campaignReference.startsWith("mai-camp-"));
    assert.equal(record.campaignStatus, "draft");
    assert.equal(record.metadataVersion, "MAI-001-v1");
  });

  test("campaign ad set and advertisement lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectMetaAds();
    const created = engine.createCampaign({ campaignName: "Conversion Push" });
    const campaignReference = created.metaRecords[0]!.campaignReference;

    const adSet = engine.createAdSet({
      campaignReference,
      adSetName: "Lookalike 1%",
      dailyBudget: 50,
    });
    assert.notEqual(adSet.validation.decision, "fail");
    assert.ok(adSet.metaRecords[0]?.adSetReference?.startsWith("mai-adset-"));

    const ad = engine.createAdvertisement({
      campaignReference,
      adSetReference: adSet.metaRecords[0]!.adSetReference!,
      advertisementName: "Creative A",
    });
    assert.notEqual(ad.validation.decision, "fail");
    assert.ok(ad.metaRecords[0]?.advertisementReference?.startsWith("mai-ad-"));
    assert.equal(ad.metaRecords[0]?.campaignStatus, "pending_review");
  });

  test("performance retrieval and campaign status sync", async () => {
    const { engine } = await buildEngine();
    engine.connectMetaAds();
    const created = engine.createCampaign({ campaignName: "Perf Test" });
    const campaignReference = created.metaRecords[0]!.campaignReference;

    const performance = engine.retrievePerformance({ campaignReference });
    assert.notEqual(performance.validation.decision, "fail");
    assert.equal(performance.action, "retrieve_performance");
    assert.ok(performance.metaRecords[0]!.impressions > 0);

    const synced = engine.syncCampaignStatus({ campaignReference });
    assert.notEqual(synced.validation.decision, "fail");
    assert.equal(synced.action, "sync_campaign_status");
    assert.equal(synced.metaRecords[0]?.synchronizationStatus, "synced");
  });

  test("rejects campaign creation without name", async () => {
    const { engine } = await buildEngine();
    engine.connectMetaAds();
    const report = engine.createCampaign({ campaignName: "   " });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMaiLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 access_token=xyz",
    });
    await engine.connectMetaAds();
    const logs = getMaiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectMetaAds();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
