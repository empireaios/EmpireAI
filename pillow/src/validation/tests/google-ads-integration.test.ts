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
  buildGoogleAdsIntegrationConfiguration,
  GOOGLE_ADS_INTEGRATION_SYSTEM_PATH,
  GAI_CAPABILITIES,
  GOOGLE_ADS_INTEGRATION_ID,
} from "../../google-ads-integration/index.js";
import { appendGaiLog, getGaiLogs } from "../../google-ads-integration/gai-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildGoogleAdsIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mfw = createMarketingFrameworkEngine(bootstrap);
  await mfw.initialize();
  const engine = createGoogleAdsIntegration(bootstrap, mfw, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mfw };
}

describe("R5-03 Google Ads Integration", () => {
  beforeEach(() => {
    resetMarketingFrameworkForTesting();
    resetGoogleAdsIntegrationForTesting();
  });

  test("buildGoogleAdsIntegrationConfiguration loads defaults", () => {
    const config = buildGoogleAdsIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://google-ads-api");
    assert.ok(GAI_CAPABILITIES.includes("campaign_creation"));
  });

  test("google ads integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-GAI-001");
    assert.equal(state.missionId, "R5-03");
    assert.ok(GOOGLE_ADS_INTEGRATION_SYSTEM_PATH.includes("GOOGLE_ADS"));
  });

  test("connectGoogleAds registers with Marketing Framework via R5-03", async () => {
    const { engine, mfw } = await buildEngine();
    const report = engine.connectGoogleAds();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = mfw.getRegisteredModules();
    assert.ok(modules.some((m) => m.marketingModuleIdentifier === GOOGLE_ADS_INTEGRATION_ID));
  });

  test("connectGoogleAds produces machine-readable gai-* records", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectGoogleAds();
    assert.ok(report.googleAdsRunReportId.startsWith("gai-run-"));
    assert.ok(report.engineRecord.engineRecordId.startsWith("gai-"));
    assert.equal(report.engineRecord.integrationId, GOOGLE_ADS_INTEGRATION_ID);
    assert.equal(report.engineRecord.metadataVersion, "GAI-001-v1");
    assert.ok(report.engineRecord.supportedCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectGoogleAds({
      credentialRef: "vault://google-ads-api",
    });
    assert.equal(report.engineRecord.authenticationStatus, "authenticated");
    assert.equal(report.engineRecord.credentialRefPresent, true);
    const logs = getGaiLogs(50);
    assert.ok(!logs.some((l) => /bearer|api_key=|token=/i.test(l.details)));
  });

  test("customer and advertising account management works", async () => {
    const { engine } = await buildEngine();
    engine.connectGoogleAds();
    const customer = engine.manageCustomerAccount({
      customerAccountId: "cust-1001",
      customerName: "EmpireAI Growth",
    });
    assert.notEqual(customer.validation.decision, "fail");
    assert.equal(customer.engineRecord.customerAccountId, "cust-1001");

    const advertising = engine.manageAdvertisingAccount({
      advertisingAccountId: "act-2001",
      customerAccountId: "cust-1001",
    });
    assert.notEqual(advertising.validation.decision, "fail");
    assert.equal(advertising.engineRecord.advertisingAccountId, "act-2001");
  });

  test("createCampaign produces machine-readable google ads records", async () => {
    const { engine } = await buildEngine();
    engine.connectGoogleAds();
    const report = engine.createCampaign({
      campaignName: "Search Brand",
      objective: "conversions",
    });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.action, "create_campaign");
    assert.equal(report.googleAdsRecords.length, 1);
    const record = report.googleAdsRecords[0]!;
    assert.ok(record.googleAdsRecordId.startsWith("gai-rec-"));
    assert.ok(record.campaignReference.startsWith("gai-camp-"));
    assert.equal(record.campaignStatus, "draft");
    assert.equal(record.metadataVersion, "GAI-001-v1");
  });

  test("campaign ad group and advertisement lifecycle", async () => {
    const { engine } = await buildEngine();
    engine.connectGoogleAds();
    const created = engine.createCampaign({ campaignName: "Performance Max Push" });
    const campaignReference = created.googleAdsRecords[0]!.campaignReference;

    const adGroup = engine.createAdGroup({
      campaignReference,
      adGroupName: "Brand Exact",
      dailyBudget: 75,
    });
    assert.notEqual(adGroup.validation.decision, "fail");
    assert.ok(adGroup.googleAdsRecords[0]?.adGroupReference?.startsWith("gai-adgroup-"));

    const ad = engine.createAdvertisement({
      campaignReference,
      adGroupReference: adGroup.googleAdsRecords[0]!.adGroupReference!,
      advertisementName: "RSA Primary",
    });
    assert.notEqual(ad.validation.decision, "fail");
    assert.ok(ad.googleAdsRecords[0]?.advertisementReference?.startsWith("gai-ad-"));
    assert.equal(ad.googleAdsRecords[0]?.campaignStatus, "pending_review");
  });

  test("performance retrieval and campaign status sync", async () => {
    const { engine } = await buildEngine();
    engine.connectGoogleAds();
    const created = engine.createCampaign({ campaignName: "Perf Test" });
    const campaignReference = created.googleAdsRecords[0]!.campaignReference;

    const performance = engine.retrievePerformance({ campaignReference });
    assert.notEqual(performance.validation.decision, "fail");
    assert.equal(performance.action, "retrieve_performance");
    assert.ok(performance.googleAdsRecords[0]!.impressions > 0);

    const synced = engine.syncCampaignStatus({ campaignReference });
    assert.notEqual(synced.validation.decision, "fail");
    assert.equal(synced.action, "sync_campaign_status");
    assert.equal(synced.googleAdsRecords[0]?.synchronizationStatus, "synced");
  });

  test("rejects campaign creation without name", async () => {
    const { engine } = await buildEngine();
    engine.connectGoogleAds();
    const report = engine.createCampaign({ campaignName: "   " });
    assert.equal(report.validation.decision, "fail");
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendGaiLog({
      event: "authentication_event",
      level: "info",
      details: "api_key=secret-key bearer abc123 access_token=xyz",
    });
    await engine.connectGoogleAds();
    const logs = getGaiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectGoogleAds();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
  });
});
