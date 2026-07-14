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
  buildAmazonInventorySyncConfiguration,
  AMAZON_INVENTORY_SYNC_SYSTEM_PATH,
  AMAZON_INVENTORY_MARKETPLACE_ID,
} from "../../amazon-inventory-sync/index.js";
import { appendInventoryLog, getInventoryLogs } from "../../amazon-inventory-sync/amzinv-logging.js";

async function buildEngines() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const mcf = createMarketplaceConnectorFrameworkEngine(bootstrap);
  await mcf.initialize();
  const amazon = createAmazonMarketplaceIntegrationEngine(bootstrap, mcf);
  await amazon.initialize();
  amazon.connectAmazon();
  const products = createAmazonProductIntelligenceEngine(bootstrap, amazon);
  await products.initialize();
  await products.syncAmazonProducts();
  const orders = createAmazonOrderManagementEngine(bootstrap, amazon, products);
  await orders.initialize();
  await orders.syncAmazonOrders();
  const engine = createAmazonInventorySyncEngine(bootstrap, amazon, products, orders);
  await engine.initialize();
  return { engine, amazon, products, orders, mcf };
}

describe("R1-05 Amazon Inventory Sync", () => {
  beforeEach(() => {
    resetMarketplaceConnectorFrameworkForTesting();
    resetAmazonMarketplaceIntegrationForTesting();
    resetAmazonProductIntelligenceForTesting();
    resetAmazonOrderManagementForTesting();
    resetAmazonInventorySyncForTesting();
  });

  test("buildAmazonInventorySyncConfiguration loads defaults", () => {
    const config = buildAmazonInventorySyncConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.allowStockPush, false);
    assert.equal(config.lowStockThreshold, 10);
  });

  test("amazon inventory sync initializes with doctrine doc", async () => {
    const { engine } = await buildEngines();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AMZINV-001");
    assert.equal(state.missionId, "R1-05");
    assert.ok(AMAZON_INVENTORY_SYNC_SYSTEM_PATH.includes("AMAZON_INVENTORY"));
  });

  test("syncAmazonInventory fetches and synchronizes Amazon stock levels", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonInventory();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    assert.ok(report.syncReportId.startsWith("amzinv-sync-"));
    assert.equal(report.inventory.length, 3);
    assert.equal(engine.getInventory().length, 3);
  });

  test("syncAmazonInventory produces machine-readable amzinv-* inventory records", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonInventory({ forceFullSync: true });
    const item = report.inventory[0]!;
    assert.ok(item.inventoryId.startsWith("amzinv-"));
    assert.ok(item.amazonSku);
    assert.equal(item.marketplaceId, AMAZON_INVENTORY_MARKETPLACE_ID);
    assert.equal(item.metadataVersion, "AMZINV-001-v1");
    assert.ok(item.sourceApiReference);
  });

  test("fetchAmazonInventory retrieves a single SKU stock level", async () => {
    const { engine } = await buildEngines();
    const report = await engine.fetchAmazonInventory({ amazonSku: "AMZ-SKU-001" });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.action, "fetch");
    assert.equal(report.inventory[0]?.amazonSku, "AMZ-SKU-001");
  });

  test("detects stock changes on subsequent sync", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonInventory();
    engine.configureInventoryFixture({ quantityOverride: { "AMZ-SKU-001": 100 } });
    const report = await engine.syncAmazonInventory();
    assert.equal(report.changes.stockChanges.length, 1);
    assert.equal(report.changes.stockChanges[0]?.amazonSku, "AMZ-SKU-001");
  });

  test("detects low-stock products", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonInventory();
    const lowStock = report.inventory.filter((i) => i.lowStockStatus);
    assert.ok(lowStock.length >= 1);
    assert.equal(lowStock[0]?.amazonSku, "AMZ-SKU-002");
    assert.equal(lowStock[0]?.stockStatus, "low_stock");
  });

  test("detects out-of-stock products", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonInventory();
    const outOfStock = report.inventory.filter((i) => i.outOfStockStatus);
    assert.equal(outOfStock.length, 1);
    assert.equal(outOfStock[0]?.amazonSku, "AMZ-SKU-003");
    assert.equal(outOfStock[0]?.stockStatus, "out_of_stock");
  });

  test("detects inventory discrepancies between Amazon and internal stock", async () => {
    const { engine } = await buildEngines();
    engine.setInternalQuantityForTesting("AMZ-SKU-002", 50);
    const report = await engine.syncAmazonInventory();
    assert.ok(report.changes.discrepancies.length >= 1);
    const disc = report.changes.discrepancies.find((d) => d.amazonSku === "AMZ-SKU-002");
    assert.ok(disc);
    assert.notEqual(disc!.delta, 0);
  });

  test("synchronizes internal inventory status after sync", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonInventory();
    const internal = engine.getState();
    assert.equal(internal.inventory.length, 3);
    const sku001 = internal.inventory.find((i) => i.amazonSku === "AMZ-SKU-001");
    assert.equal(sku001?.availableQuantity, 150);
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngines();
    appendInventoryLog({
      event: "inventory_fetch",
      level: "info",
      details: "token=secret-lwa-token bearer abc123",
    });
    await engine.syncAmazonInventory();
    const logs = getInventoryLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-lwa-token")));
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngines();
    await engine.syncAmazonInventory();
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.inventoryCount, 3);
    assert.ok(cockpit.engineStatus);
  });

  test("getLatestReport returns most recent inventory sync operation", async () => {
    const { engine } = await buildEngines();
    const report = await engine.syncAmazonInventory();
    const latest = engine.getLatestReport();
    assert.equal(latest?.syncReportId, report.syncReportId);
  });
});
