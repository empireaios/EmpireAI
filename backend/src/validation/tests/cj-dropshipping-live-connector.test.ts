import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { runAutonomousCompanyManufacturingLoop } from "../../execution/autonomous-company-manufacturing-loop/index.js";
import {
  CJ_API_ENDPOINTS,
  CJ_SANDBOX_PRODUCTS,
  checkCjHealth,
  clearCjAuthCache,
  createCjApiClient,
  loadCjConfig,
  mapCjProductToCatalogItem,
  mapCjProductToInventory,
  mapCjProductToPricing,
  mapCjFreightToShippingData,
  resetCjHealthTelemetry,
  syncCjCatalog,
  syncCjCatalogItems,
  syncCjInventory,
  syncCjPricing,
  syncCjShippingQuotes,
  syncCjSupplierCatalogBundle,
} from "../../suppliers/cj-dropshipping/index.js";
import {
  createInMemorySupplierConnectorFrameworkRepository,
  createSupplierConnectorFrameworkModule,
} from "../../suppliers/supplier-connector-framework/index.js";
import {
  buildStubCatalogForPlatform,
  createInMemorySupplierProductSyncRepository,
  createSupplierProductSyncModule,
} from "../../suppliers/supplier-product-synchronization/index.js";

const WORKSPACE_ID = "ws-m074";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  clearCjAuthCache();
  resetCjHealthTelemetry();
});

describe("Mission 074 CJ Dropshipping Live Connector", () => {
  it("074A — exposes CJ API client with auth, rate limiting, and health check", async () => {
    const config = loadCjConfig();
    assert.equal(config.integrationMode, "SANDBOX");
    assert.equal(config.apiKey, null);

    const health = await checkCjHealth(config);
    assert.equal(health.credentialsConfigured, false);
    assert.equal(health.healthState, "READY");
    assert.equal(health.apiReachable, true);

    const client = createCjApiClient(config);
    const ping = await client.healthCheck();
    assert.equal(ping.reachable, true);
  });

  it("074B — syncs CJ catalog into M067 SupplierCatalogItemInput shape", async () => {
    const items = await syncCjCatalogItems({ keyword: "blender" });

    assert.ok(items.length >= 1);
    const item = items[0]!;
    assert.ok(item.supplierSku);
    assert.match(item.title, /Blender/i);
    assert.ok(item.description);
    assert.ok(item.category);
    assert.ok(item.tags?.length);
    assert.ok(item.unitPrice > 0);
    assert.ok(item.inventoryQuantity >= 0);
  });

  it("074C — syncs CJ inventory with warehouse availability", async () => {
    const catalog = await syncCjCatalog();
    const inventory = await syncCjInventory(catalog.products);

    assert.equal(inventory.length, catalog.products.length);
    assert.ok(inventory[0]!.quantity >= 0);
    assert.equal(inventory[0]!.syncMode, "SANDBOX");
    assert.equal(typeof inventory[0]!.inStock, "boolean");
    assert.ok(inventory[0]!.warehouseRegion.length > 0);
  });

  it("074D — syncs CJ pricing with cost and compare-at values", async () => {
    const catalog = await syncCjCatalog();
    const pricing = syncCjPricing(catalog.products);

    assert.equal(pricing.length, catalog.products.length);
    assert.ok(pricing[0]!.unitPrice > 0);
    assert.equal(pricing[0]!.currency, "USD");
    assert.ok(pricing[0]!.compareAtPrice === null || pricing[0]!.compareAtPrice! > 0);
  });

  it("074E — syncs CJ shipping quotes with methods and delivery windows", async () => {
    const catalog = await syncCjCatalog();
    const shipping = await syncCjShippingQuotes(catalog.products, "US");

    assert.equal(shipping.length, catalog.products.length);
    assert.ok(shipping[0]!.methods.length >= 1);
    assert.ok(shipping[0]!.methods[0]!.cost >= 0);
    assert.ok(shipping[0]!.methods[0]!.minDays >= 0);
    assert.ok(shipping[0]!.methods[0]!.regions.includes("US"));
  });

  it("074F/074G — prepares CJ connector with SANDBOX mode and health telemetry", async () => {
    const module = createSupplierConnectorFrameworkModule(
      createInMemorySupplierConnectorFrameworkRepository(),
    );

    const record = await module.persistConnector(WORKSPACE_ID, {
      platform: "CJ_DROPSHIPPING",
      credentialsConfigured: true,
    });

    assert.equal(record.supplierConnector.integrationMode, "SANDBOX");
    assert.equal(record.supplierHealth.credentialsConfigured, true);
    assert.equal(record.supplierHealth.apiReachable, true);
    assert.equal(record.syncMetadata.syncMode, "SANDBOX");
    assert.equal(record.syncMetadata.orderingEnabled, false);

    const orderPlacement = record.supplierCapabilities.find(
      (capability) => capability.kind === "ORDER_PLACEMENT",
    );
    assert.ok(orderPlacement);
    assert.equal(orderPlacement!.enabled, false);
    assert.equal(orderPlacement!.liveModeSupported, false);
  });

  it("074H — validates M072 manufacturing loop with CJ live catalog path", async () => {
    const syncModule = createSupplierProductSyncModule(createInMemorySupplierProductSyncRepository());

    const cjCatalog = buildStubCatalogForPlatform("CJ_DROPSHIPPING");
    assert.match(cjCatalog[0]!.title, /CJ Sandbox Kitchen Blender/);

    const synced = await syncModule.persistSupplierProductSync(WORKSPACE_ID, {
      connectorId: "cj-dropshipping",
      platform: "CJ_DROPSHIPPING",
    });

    assert.ok(synced.length >= 2);
    assert.equal(synced[0]!.supplierInventory.syncMode, "SANDBOX");
    assert.ok(synced[0]!.supplierPricing.unitPrice > 0);
    assert.ok(synced[0]!.supplierShippingData.methods.length >= 1);

    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      supplierPlatform: "CJ_DROPSHIPPING",
    });

    assert.equal(run.runStatus, "COMPLETE");
    assert.ok(run.stages.some((stage) => stage.stage === "SUPPLIER"));
    assert.match(run.stages.find((stage) => stage.stage === "SUPPLIER")!.detail, /CJ_DROPSHIPPING/);
  });

  it("maps a CJ sandbox product into full M067 structures", () => {
    const product = CJ_SANDBOX_PRODUCTS[0]!;
    const catalogItem = mapCjProductToCatalogItem(product);
    const inventory = mapCjProductToInventory(product, "SANDBOX");
    const pricing = mapCjProductToPricing(product);
    const shipping = mapCjFreightToShippingData(product, [], "US");

    assert.equal(catalogItem.supplierSku, "CJ-BLENDER-001-BLK");
    assert.equal(inventory.quantity, 240);
    assert.equal(pricing.unitPrice, 24.99);
    assert.equal(pricing.compareAtPrice, 39.99);
    assert.ok(shipping.methods.length >= 1);
  });

  it("documents integrated CJ API endpoints", () => {
    assert.equal(CJ_API_ENDPOINTS.AUTH_TOKEN, "/authentication/getAccessToken");
    assert.equal(CJ_API_ENDPOINTS.PRODUCT_LIST, "/product/list");
    assert.equal(CJ_API_ENDPOINTS.PRODUCT_QUERY, "/product/query");
    assert.equal(CJ_API_ENDPOINTS.STOCK_BY_PID, "/product/stock/queryByPid");
    assert.equal(CJ_API_ENDPOINTS.FREIGHT_CALCULATE, "/logistic/freightCalculate");
  });

  it("074 bundle sync returns catalog, inventory, pricing, and shipping together", async () => {
    const bundle = await syncCjSupplierCatalogBundle({ pageSize: 2 });

    assert.equal(bundle.source, "sandbox-fixture");
    assert.equal(bundle.integrationMode, "SANDBOX");
    assert.equal(bundle.catalogItems.length, bundle.products.length);
    assert.equal(bundle.inventory.length, bundle.products.length);
    assert.equal(bundle.pricing.length, bundle.products.length);
    assert.equal(bundle.shipping.length, bundle.products.length);
  });
});
