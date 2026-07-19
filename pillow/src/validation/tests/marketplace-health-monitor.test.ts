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
  createMarketplaceProductNormalizationEngine,
  resetMarketplaceProductNormalizationForTesting,
} from "../../marketplace-product-normalization/index.js";
import {
  createMarketplaceOrderNormalizationEngine,
  resetMarketplaceOrderNormalizationForTesting,
} from "../../marketplace-order-normalization/index.js";
import {
  createMarketplaceHealthMonitorEngine,
  resetMarketplaceHealthMonitorForTesting,
  buildMarketplaceHealthMonitorConfiguration,
  MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH,
  HEALTH_RECORD_SCHEMA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
} from "../../marketplace-health-monitor/index.js";
import {
  appendHealthMonitorLog,
  getHealthMonitorLogs,
} from "../../marketplace-health-monitor/mhm-logging.js";

async function buildEngine(
  configOverrides?: Parameters<typeof buildMarketplaceHealthMonitorConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const productNorm = createMarketplaceProductNormalizationEngine(bootstrap, mcf);
  await productNorm.initialize();
  const orderNorm = createMarketplaceOrderNormalizationEngine(bootstrap, mcf);
  await orderNorm.initialize();
  const engine = createMarketplaceHealthMonitorEngine(
    bootstrap,
    mcf,
    productNorm,
    orderNorm,
    { configuration: configOverrides },
  );
  await engine.initialize();
  return { engine, mcf, productNorm, orderNorm };
}

describe("R1-14 Marketplace Health Monitor", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetMarketplaceProductNormalizationForTesting();
    resetMarketplaceOrderNormalizationForTesting();
    resetMarketplaceHealthMonitorForTesting();
  });

  test("buildMarketplaceHealthMonitorConfiguration loads defaults", () => {
    const config = buildMarketplaceHealthMonitorConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.failureDetectionRulesEnabled, true);
    assert.equal(config.preserveHealthHistory, true);
  });

  test("marketplace health monitor initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MHM-001");
    assert.equal(state.missionId, "R1-14");
    assert.ok(MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH.includes("MARKETPLACE_HEALTH"));
  });

  test("runHealthCheck monitors all supported marketplace connectors", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runHealthCheck({ includeAllMarketplaces: true });
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.equal(report.records.length, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
    assert.equal(engine.getHealthRecords().length, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
  });

  test("runHealthCheck produces machine-readable mhm-* health records", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "amazon" });
    const record = report.records[0]!;
    assert.ok(record.healthRecordId.startsWith("mhm-amazon-"));
    assert.ok(report.healthCheckReportId.startsWith("mhm-run-"));
    assert.equal(record.metadataVersion, "MHM-001-v1");
    assert.equal(report.schemaVersion, HEALTH_RECORD_SCHEMA_VERSION);
  });

  test("authentication health is monitored", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "shopify" });
    const record = report.records[0]!;
    assert.ok(["authenticated", "pending", "unauthenticated", "failed"].includes(record.authenticationStatus));
  });

  test("API health metrics are monitored", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "etsy" });
    const record = report.records[0]!;
    assert.ok(record.apiLatencyMs > 0);
    assert.ok(record.apiErrorRate >= 0);
    assert.ok(["available", "degraded", "unavailable"].includes(record.apiAvailability));
  });

  test("product and order synchronization health is monitored", async () => {
    const { engine, productNorm, orderNorm } = await buildEngine();
    await productNorm.normalizeProducts({ includeFixtureCatalog: true });
    await orderNorm.normalizeOrders({ includeFixtureCatalog: true });
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "amazon" });
    const record = report.records[0]!;
    assert.equal(record.productSynchronizationStatus, "synced");
    assert.equal(record.orderSynchronizationStatus, "synced");
  });

  test("integration failures and degraded performance are detected automatically", async () => {
    const { engine } = await buildEngine();
    engine.setUseDegradedFixtureForTesting(true);
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "amazon" });
    assert.ok(report.failures.length > 0);
    assert.equal(report.records[0]?.overallHealthStatus, "failed");
    assert.ok(report.alerts.length > 0);
  });

  test("rate-limit events are reflected in health records", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "tiktok-shop" });
    const record = report.records[0]!;
    assert.equal(record.rateLimitStatus, "throttled");
    assert.ok(record.activeAlerts.some((a) => a.includes("Rate limit")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendHealthMonitorLog({
      event: "health_check_event",
      level: "info",
      details: "consumer_key=secret-key bearer abc123 token=xyz",
    });
    await engine.runHealthCheck({ marketplaceIdentifier: "amazon" });
    const logs = getHealthMonitorLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    await engine.runHealthCheck({ includeAllMarketplaces: true });
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, HEALTH_RECORD_SCHEMA_VERSION);
    assert.equal(cockpit.monitoredMarketplaces, SUPPORTED_MARKETPLACE_IDENTIFIERS.length);
  });

  test("getLatestReport returns most recent health check operation", async () => {
    const { engine } = await buildEngine();
    const report = await engine.runHealthCheck({ marketplaceIdentifier: "ebay" });
    const latest = engine.getLatestReport();
    assert.equal(latest?.healthCheckReportId, report.healthCheckReportId);
  });
});
