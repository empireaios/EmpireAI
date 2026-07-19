import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createMarketplaceConnectorFrameworkEngine,
  resetMarketplaceConnectorFrameworkForTesting,
} from "../../marketplace-connector-framework/index.js";
import {
  createTikTokShopMarketplaceIntegrationEngine,
  resetTikTokShopMarketplaceIntegrationForTesting,
  buildTikTokShopMarketplaceIntegrationConfiguration,
  TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  TIKTOK_SHOP_CAPABILITIES,
  TIKTOK_SHOP_MARKETPLACE_ID,
} from "../../tiktok-shop-marketplace-integration/index.js";
import {
  appendTikTokShopLog,
  getTikTokShopLogs,
} from "../../tiktok-shop-marketplace-integration/tiktok-shop-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildTikTokShopMarketplaceIntegrationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const engine = createTikTokShopMarketplaceIntegrationEngine(bootstrap, mcf, {
    configuration: configOverrides,
  });
  await engine.initialize();
  return { engine, mcf };
}

describe("R1-09 TikTok Shop Marketplace Integration", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetTikTokShopMarketplaceIntegrationForTesting();
  });

  test("buildTikTokShopMarketplaceIntegrationConfiguration loads defaults", () => {
    const config = buildTikTokShopMarketplaceIntegrationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.credentialRef, "vault://tiktok-shop-open-api");
    assert.ok(TIKTOK_SHOP_CAPABILITIES.includes("tiktok_shop_authentication"));
  });

  test("tiktok shop marketplace integration initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-TTS-001");
    assert.equal(state.missionId, "R1-09");
    assert.ok(TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH.includes("TIKTOK_SHOP"));
  });

  test("connectTikTokShop registers TikTok Shop with MCF via R1-09", async () => {
    const { engine, mcf } = await buildEngine();
    const report = engine.connectTikTokShop({ shopId: "shop-tts-001" });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const mcfConnectors = mcf.getRegisteredConnectors();
    assert.ok(mcfConnectors.some((c) => c.marketplaceIdentifier === TIKTOK_SHOP_MARKETPLACE_ID));
  });

  test("connectTikTokShop produces machine-readable tts-* connector records with shop ID", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectTikTokShop({ shopId: "shop-tts-001" });
    assert.ok(report.connectorRunReportId.startsWith("tts-run-"));
    assert.ok(report.record.connectorId.startsWith("tts-"));
    assert.equal(report.record.marketplaceIdentifier, "tiktok-shop");
    assert.equal(report.record.shopId, "shop-tts-001");
    assert.equal(report.record.metadataVersion, "TTS-001-v1");
    assert.ok(report.record.supportedTikTokShopCapabilities.length > 0);
  });

  test("authentication works without exposing tokens", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectTikTokShop({
      credentialRef: "vault://tiktok-shop-open-api",
      shopId: "shop-tts-002",
    });
    assert.equal(report.record.authenticationStatus, "authenticated");
    assert.equal(report.record.apiSessionStatus, "active");
    assert.equal(report.record.credentialRefPresent, true);
    const logs = getTikTokShopLogs(50);
    assert.ok(!logs.some((l) => /bearer|oauth_token|refresh_token/i.test(l.details)));
  });

  test("connection testing works", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokShop({ shopId: "shop-tts-003" });
    const report = engine.testConnection();
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "test_connection");
    assert.equal(report.record.connectionStatus, "connected");
  });

  test("API routing works through TikTok Shop connector", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokShop({ shopId: "shop-tts-004" });
    const report = await engine.routeTikTokShopApi({
      method: "GET",
      path: "/product/202309/products",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "route_api");
  });

  test("event handling works", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokShop({ shopId: "shop-tts-005" });
    const report = engine.handleTikTokShopEvent({
      topic: "ORDER_STATUS_CHANGE",
      payloadRef: "payload-ref-tts-001",
    });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "handle_event");
  });

  test("rate limiting blocks excessive API requests", async () => {
    const { engine } = await buildEngine({ requestsPerMinute: 2, rateLimitEnabled: true });
    engine.connectTikTokShop({ shopId: "shop-tts-006" });
    await engine.routeTikTokShopApi({ method: "GET", path: "/product/202309/products/1" });
    await engine.routeTikTokShopApi({ method: "GET", path: "/product/202309/products/2" });
    const limited = await engine.routeTikTokShopApi({
      method: "GET",
      path: "/product/202309/products/3",
    });
    assert.ok(limited.validation.warnings.some((w) => w.includes("rate limited")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendTikTokShopLog({
      event: "authentication_event",
      level: "info",
      details: "token=secret-oauth-token bearer abc123",
    });
    engine.connectTikTokShop({ shopId: "shop-tts-007" });
    const logs = getTikTokShopLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-oauth-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectTikTokShop({ shopId: "shop-tts-008" });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.equal(cockpit.authenticationStatus, "authenticated");
    assert.equal(cockpit.shopId, "shop-tts-008");
  });

  test("getLatestReport returns most recent TikTok Shop connector operation", async () => {
    const { engine } = await buildEngine();
    const report = engine.connectTikTokShop({ shopId: "shop-tts-009" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.connectorRunReportId, report.connectorRunReportId);
  });
});
