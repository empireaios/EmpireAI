import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { importSupplierProducts } from "../../execution/product-import/index.js";
import { productPublishingTools } from "../../execution/product-publishing-engine/tools/product-publishing-tools.js";
import {
  applyProductUpdates,
  listPublishedProducts,
  prepareCatalogPublish,
  publishCatalogToStorefront,
  syncPublishedAvailability,
  syncPublishedInventory,
  syncPublishedPrices,
} from "../../execution/product-publishing-engine/index.js";
import { deployLiveStore } from "../../revenue/minimum-live-revenue-loop/index.js";
import {
  buildStubCatalogForPlatform,
  syncSupplierCatalog,
} from "../../suppliers/supplier-product-synchronization/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m108";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "product-publishing",
    correlationId: "corr-m108",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = productPublishingTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

function buildSupplierItems() {
  return syncSupplierCatalog({
    connectorId: "cj-dropshipping",
    platform: "CJ_DROPSHIPPING",
    catalogItems: buildStubCatalogForPlatform("CJ_DROPSHIPPING"),
  }).map((item) => ({
    supplierProduct: item.supplierProduct,
    supplierInventory: item.supplierInventory,
    supplierPricing: item.supplierPricing,
  }));
}

function buildDeployedStore() {
  const slug = uniqueSlug("publish");
  const deployed = deployLiveStore({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brandId: "brand-gk",
    slug,
    productName: "Publishing Engine Seed Product",
    productDescription: "Mission 108 storefront seed",
    priceCents: 4999,
    cjSupplierSku: "CJ-BLENDER-001-BLK",
    cjSupplierProductId: "cj-sandbox-blender-001",
    unitCostCents: 2499,
  });

  const imported = importSupplierProducts({
    store: {
      storeId: deployed.store.storeId,
      brandId: deployed.store.brandId,
      generatedStorefrontId: randomUUID(),
      defaultCollectionHandle: "featured",
    },
    supplierItems: buildSupplierItems(),
  });

  return { deployed, imported };
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m108-"));
  process.env.REVENUE_LOOP_DEPLOY_ROOT = tempDeployRoot;
  process.env.PRODUCT_PUBLISHING_ENABLED = "true";
  process.env.PRODUCT_PUBLISHING_MOCK = "true";
  process.env.PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC = "false";
  delete process.env.CJ_API_KEY;
  delete process.env.CJ_API_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 108 Product Publishing Engine", () => {
  it("registers nine product publishing Brain tools", () => {
    assert.equal(productPublishingTools.length, 9);
    assert.ok(
      productPublishingTools.some((tool) => tool.name === "product_publishing.publish_catalog"),
    );
  });

  it("prepares catalog publish from imported supplier products", () => {
    const { deployed, imported } = buildDeployedStore();

    const publish = prepareCatalogPublish({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    });

    assert.equal(publish.status, "READY");
    assert.ok(publish.productCount >= 1);
    assert.equal(publish.storeSlug, deployed.store.slug);
    assert.equal(publish.mock, true);
  });

  it("publishes catalog.json and multi-product index.html to deployed storefront", () => {
    const { deployed, imported } = buildDeployedStore();
    const prepared = prepareCatalogPublish({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    });

    const published = publishCatalogToStorefront(prepared.publishId);

    assert.equal(published.status, "PUBLISHED");
    assert.equal(published.publishedProductCount, published.productCount);

    const catalogPath = path.join(deployed.deployPath, "catalog.json");
    const indexPath = path.join(deployed.deployPath, "index.html");
    assert.ok(fs.existsSync(catalogPath));
    assert.ok(fs.existsSync(indexPath));

    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
      products: Array<{ title: string }>;
    };
    assert.ok(catalog.products.length >= 1);

    const html = fs.readFileSync(indexPath, "utf8");
    assert.match(html, /Published Catalog/);
    assert.match(html, /Shop the Collection/);
  });

  it("syncs inventory from CJ sandbox supplier snapshots", async () => {
    const { deployed, imported } = buildDeployedStore();
    const prepared = prepareCatalogPublish({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    });
    publishCatalogToStorefront(prepared.publishId);

    const synced = await syncPublishedInventory(prepared.publishId);
    const products = listPublishedProducts(deployed.store.storeId);

    assert.equal(synced.status, "SYNCED");
    assert.ok(products.some((product) => product.inventoryQuantity > 0));
    assert.ok(products.some((product) => product.availability === "IN_STOCK"));
  });

  it("syncs retail prices from supplier cost with markup", async () => {
    const { deployed, imported } = buildDeployedStore();
    const prepared = prepareCatalogPublish({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    });
    publishCatalogToStorefront(prepared.publishId);

    await syncPublishedPrices(prepared.publishId);
    const products = listPublishedProducts(deployed.store.storeId);

    assert.ok(products.every((product) => product.priceCents > 0));
  });

  it("recomputes availability from inventory levels", () => {
    const { deployed, imported } = buildDeployedStore();
    const prepared = prepareCatalogPublish({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    });
    publishCatalogToStorefront(prepared.publishId);

    const product = listPublishedProducts(deployed.store.storeId)[0]!;
    applyProductUpdates(prepared.publishId, [
      {
        publishedProductId: product.publishedProductId,
        inventoryQuantity: 0,
      },
    ]);

    syncPublishedAvailability(prepared.publishId);
    const updated = listPublishedProducts(deployed.store.storeId).find(
      (entry) => entry.publishedProductId === product.publishedProductId,
    );

    assert.equal(updated?.availability, "OUT_OF_STOCK");
  });

  it("applies explicit product updates and republishes storefront", () => {
    const { deployed, imported } = buildDeployedStore();
    const prepared = prepareCatalogPublish({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    });
    publishCatalogToStorefront(prepared.publishId);

    const product = listPublishedProducts(deployed.store.storeId)[0]!;
    applyProductUpdates(prepared.publishId, [
      {
        publishedProductId: product.publishedProductId,
        title: "Updated Grand King Product",
        priceCents: 8900,
      },
    ]);

    const updated = listPublishedProducts(deployed.store.storeId).find(
      (entry) => entry.publishedProductId === product.publishedProductId,
    );
    assert.equal(updated?.title, "Updated Grand King Product");
    assert.equal(updated?.priceCents, 8900);

    const html = fs.readFileSync(path.join(deployed.deployPath, "index.html"), "utf8");
    assert.match(html, /Updated Grand King Product/);
  });

  it("prepares catalog via Brain tool", async () => {
    const { deployed, imported } = buildDeployedStore();

    const publish = (await invokeTool("product_publishing.prepare_catalog", {
      companyId: COMPANY_ID,
      storeId: deployed.store.storeId,
      importedProducts: imported.importedProducts,
      mappedProducts: imported.mappedProducts,
    })) as { status: string };

    assert.equal(publish.status, "READY");
  });
});
