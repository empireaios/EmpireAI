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
  createAmazonMarketplaceIntegrationEngine,
  resetAmazonMarketplaceIntegrationForTesting,
} from "../../amazon-marketplace-integration/index.js";
import {
  createAmazonProductIntelligenceEngine,
  resetAmazonProductIntelligenceForTesting,
} from "../../amazon-product-intelligence/index.js";
import {
  createAmazonOrderManagementEngine,
  resetAmazonOrderManagementForTesting,
} from "../../amazon-order-management/index.js";
import {
  createAmazonInventorySyncEngine,
  resetAmazonInventorySyncForTesting,
} from "../../amazon-inventory-sync/index.js";
import {
  createWalmartMarketplaceIntegrationEngine,
  resetWalmartMarketplaceIntegrationForTesting,
} from "../../walmart-marketplace-integration/index.js";
import {
  createEtsyMarketplaceIntegrationEngine,
  resetEtsyMarketplaceIntegrationForTesting,
} from "../../etsy-marketplace-integration/index.js";
import {
  createEbayMarketplaceIntegrationEngine,
  resetEbayMarketplaceIntegrationForTesting,
} from "../../ebay-marketplace-integration/index.js";
import {
  createTikTokShopMarketplaceIntegrationEngine,
  resetTikTokShopMarketplaceIntegrationForTesting,
} from "../../tiktok-shop-marketplace-integration/index.js";
import {
  createShopifyStoreMarketplaceIntegrationEngine,
  resetShopifyStoreMarketplaceIntegrationForTesting,
} from "../../shopify-store-marketplace-integration/index.js";
import {
  createWooCommerceMarketplaceIntegrationEngine,
  resetWooCommerceMarketplaceIntegrationForTesting,
} from "../../woocommerce-marketplace-integration/index.js";
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
} from "../../marketplace-health-monitor/index.js";
import {
  createMarketplaceCertificationEngine,
  resetMarketplaceCertificationForTesting,
  buildMarketplaceCertificationConfiguration,
  MARKETPLACE_CERTIFICATION_SYSTEM_PATH,
  CERTIFICATION_SCHEMA_VERSION,
  CERTIFIED_MISSIONS,
  MCT_METADATA_VERSION,
} from "../../marketplace-certification/index.js";
import {
  appendCertificationLog,
  getCertificationLogs,
} from "../../marketplace-certification/mct-logging.js";

async function buildFullMarketplaceStack(
  configOverrides?: Parameters<typeof buildMarketplaceCertificationConfiguration>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();

  const amazonIntegration = createAmazonMarketplaceIntegrationEngine(bootstrap, mcf);
  await amazonIntegration.initialize();
  const amazonProductIntelligence = createAmazonProductIntelligenceEngine(
    bootstrap,
    amazonIntegration,
  );
  await amazonProductIntelligence.initialize();
  const amazonOrderManagement = createAmazonOrderManagementEngine(
    bootstrap,
    amazonIntegration,
    amazonProductIntelligence,
  );
  await amazonOrderManagement.initialize();
  const amazonInventorySync = createAmazonInventorySyncEngine(
    bootstrap,
    amazonIntegration,
    amazonProductIntelligence,
    amazonOrderManagement,
  );
  await amazonInventorySync.initialize();

  const walmartIntegration = createWalmartMarketplaceIntegrationEngine(bootstrap, mcf);
  await walmartIntegration.initialize();
  const etsyIntegration = createEtsyMarketplaceIntegrationEngine(bootstrap, mcf);
  await etsyIntegration.initialize();
  const ebayIntegration = createEbayMarketplaceIntegrationEngine(bootstrap, mcf);
  await ebayIntegration.initialize();
  const tiktokShopIntegration = createTikTokShopMarketplaceIntegrationEngine(bootstrap, mcf);
  await tiktokShopIntegration.initialize();
  const shopifyStoreIntegration = createShopifyStoreMarketplaceIntegrationEngine(bootstrap, mcf);
  await shopifyStoreIntegration.initialize();
  const woocommerceIntegration = createWooCommerceMarketplaceIntegrationEngine(bootstrap, mcf);
  await woocommerceIntegration.initialize();

  const productNormalization = createMarketplaceProductNormalizationEngine(bootstrap, mcf);
  await productNormalization.initialize();
  const orderNormalization = createMarketplaceOrderNormalizationEngine(bootstrap, mcf);
  await orderNormalization.initialize();
  const healthMonitor = createMarketplaceHealthMonitorEngine(
    bootstrap,
    mcf,
    productNormalization,
    orderNormalization,
  );
  await healthMonitor.initialize();

  const certification = createMarketplaceCertificationEngine(
    bootstrap,
    {
      mcf,
      amazonIntegration,
      amazonProductIntelligence,
      amazonOrderManagement,
      amazonInventorySync,
      walmartIntegration,
      etsyIntegration,
      ebayIntegration,
      tiktokShopIntegration,
      shopifyStoreIntegration,
      woocommerceIntegration,
      productNormalization,
      orderNormalization,
      healthMonitor,
    },
    { configuration: configOverrides },
  );
  await certification.initialize();

  return { certification, mcf, healthMonitor, productNormalization, orderNormalization };
}

describe("R1-15 Marketplace Certification", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetAmazonMarketplaceIntegrationForTesting();
    resetAmazonProductIntelligenceForTesting();
    resetAmazonOrderManagementForTesting();
    resetAmazonInventorySyncForTesting();
    resetWalmartMarketplaceIntegrationForTesting();
    resetEtsyMarketplaceIntegrationForTesting();
    resetEbayMarketplaceIntegrationForTesting();
    resetTikTokShopMarketplaceIntegrationForTesting();
    resetShopifyStoreMarketplaceIntegrationForTesting();
    resetWooCommerceMarketplaceIntegrationForTesting();
    resetMarketplaceProductNormalizationForTesting();
    resetMarketplaceOrderNormalizationForTesting();
    resetMarketplaceHealthMonitorForTesting();
    resetMarketplaceCertificationForTesting();
  });

  test("buildMarketplaceCertificationConfiguration loads defaults", () => {
    const config = buildMarketplaceCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.certificationScope, "full");
    assert.equal(config.passThresholdPercent, 85);
    assert.equal(config.includeSmokeTests, true);
  });

  test("marketplace certification initializes with doctrine doc", async () => {
    const { certification } = await buildFullMarketplaceStack();
    const state = certification.getState();
    assert.equal(state.engineVersion, "PILLOW-MCT-001");
    assert.equal(state.missionId, "R1-15");
    assert.ok(MARKETPLACE_CERTIFICATION_SYSTEM_PATH.includes("MARKETPLACE_CERTIFICATION"));
  });

  test("runCertification validates all R1-01 through R1-14 missions", async () => {
    const { certification } = await buildFullMarketplaceStack();
    const report = await certification.runCertification({ includeSmokeTests: true });
    assert.equal(report.missionResults.length, CERTIFIED_MISSIONS.length);
    assert.equal(report.certifiedMissionList.length, CERTIFIED_MISSIONS.length);
    assert.ok(
      ["certified", "partial"].includes(report.overallCertificationStatus),
      report.detectedFailures.join("; "),
    );
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
  });

  test("runCertification produces machine-readable mct-run-* certification reports", async () => {
    const { certification } = await buildFullMarketplaceStack();
    const report = await certification.runCertification();
    assert.ok(report.certificationId.startsWith("mct-run-"));
    assert.equal(report.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    assert.equal(report.metadataVersion, MCT_METADATA_VERSION);
    assert.equal(report.certifiedPhase, "Marketplace Integration");
  });

  test("connector framework and marketplace connectors are certified", async () => {
    const { certification } = await buildFullMarketplaceStack();
    const report = await certification.runCertification({ includeSmokeTests: true });
    const connectorMissions = report.missionResults.filter((r) =>
      ["R1-01", "R1-06", "R1-07", "R1-08", "R1-09", "R1-10", "R1-11"].includes(r.missionId),
    );
    assert.equal(connectorMissions.length, 7);
    assert.ok(
      ["certified", "partial"].includes(report.connectorValidationStatus),
      report.detectedFailures.join("; "),
    );
  });

  test("Amazon programme missions R1-02 through R1-05 are certified", async () => {
    const { certification } = await buildFullMarketplaceStack();
    const report = await certification.runCertification({ includeSmokeTests: true });
    const amazonMissions = report.missionResults.filter((r) =>
      ["R1-02", "R1-03", "R1-04", "R1-05"].includes(r.missionId),
    );
    assert.equal(amazonMissions.length, 4);
    assert.ok(amazonMissions.every((m) => m.status !== "fail"), report.detectedFailures.join("; "));
  });

  test("product and order normalization certification statuses are reported", async () => {
    const { certification, productNormalization, orderNormalization } =
      await buildFullMarketplaceStack();
    await productNormalization.normalizeProducts({ includeFixtureCatalog: true });
    await orderNormalization.normalizeOrders({ includeFixtureCatalog: true });
    const report = await certification.runCertification({ includeSmokeTests: true });
    assert.equal(report.productNormalizationValidationStatus, "certified");
    assert.equal(report.orderNormalizationValidationStatus, "certified");
    const r12 = report.missionResults.find((r) => r.missionId === "R1-12");
    const r13 = report.missionResults.find((r) => r.missionId === "R1-13");
    assert.equal(r12?.status, "pass");
    assert.equal(r13?.status, "pass");
  });

  test("health monitor certification status is reported", async () => {
    const { certification, healthMonitor } = await buildFullMarketplaceStack();
    await healthMonitor.runHealthCheck({ marketplaceIdentifier: "amazon" });
    const report = await certification.runCertification({ includeSmokeTests: true });
    assert.equal(report.healthMonitoringValidationStatus, "certified");
    assert.equal(
      report.missionResults.find((r) => r.missionId === "R1-14")?.status,
      "pass",
    );
  });

  test("governance safety redacts sensitive values in certification logs", async () => {
    const { certification } = await buildFullMarketplaceStack();
    appendCertificationLog({
      event: "certification_event",
      level: "info",
      details: "consumer_key=secret-key bearer abc123 token=xyz",
    });
    await certification.runCertification();
    const logs = getCertificationLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("validateLatestReport and cockpit snapshot report readiness", async () => {
    const { certification } = await buildFullMarketplaceStack();
    await certification.runCertification();
    const validation = certification.validateLatestReport();
    assert.notEqual(validation.decision, "fail", validation.errors.join("; "));
    const sync = certification.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 40);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = certification.getCockpitSnapshot();
    assert.equal(cockpit.schemaVersion, CERTIFICATION_SCHEMA_VERSION);
    const latest = certification.getLatestReport();
    assert.ok((latest?.missionResults.filter((r) => r.status === "pass").length ?? 0) >= 13);
  });

  test("getLatestReport returns most recent certification operation", async () => {
    const { certification } = await buildFullMarketplaceStack();
    const report = await certification.runCertification();
    const latest = certification.getLatestReport();
    assert.equal(latest?.certificationId, report.certificationId);
  });

  test("certification scope filters missions when configured", async () => {
    const { certification } = await buildFullMarketplaceStack({
      certificationScope: "normalization",
    });
    const report = await certification.runCertification();
    assert.equal(report.missionResults.length, 2);
    assert.ok(report.missionResults.every((r) => ["R1-12", "R1-13"].includes(r.missionId)));
  });
});
