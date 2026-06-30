import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryProductImportRepository,
  createProductImportModule,
  importSupplierProducts,
} from "../../execution/product-import/index.js";
import {
  buildStubCatalogForPlatform,
  createSupplierProductSyncModule,
  syncSupplierCatalog,
} from "../../suppliers/supplier-product-synchronization/index.js";

const WORKSPACE_ID = "ws-m068";

function buildSupplierItemsFromStub(platform: "CJ_DROPSHIPPING" = "CJ_DROPSHIPPING") {
  return syncSupplierCatalog({
    connectorId: "cj-dropshipping",
    platform,
    catalogItems: buildStubCatalogForPlatform(platform),
  }).map((item) => ({
    supplierProduct: item.supplierProduct,
    supplierInventory: item.supplierInventory,
    supplierPricing: item.supplierPricing,
  }));
}

function buildImportInput(storeId = randomUUID(), brandId = randomUUID()) {
  return {
    store: {
      storeId,
      brandId,
      generatedStorefrontId: randomUUID(),
      defaultCollectionHandle: "kitchen-essentials",
    },
    supplierItems: buildSupplierItemsFromStub(),
  };
}

describe("Mission 068 Product Import Engine", () => {
  it("imports supplier products with required output fields", async () => {
    const module = createProductImportModule();
    const input = buildImportInput();
    const record = await module.persistProductImport(WORKSPACE_ID, input);

    assert.ok(record.recordId);
    assert.equal(record.storeId, input.store.storeId);
    assert.ok(record.importedProducts.length >= 2);
    assert.ok(record.mappedProducts.length >= 2);
    assert.ok(["CATALOG_MAPPED", "CATALOG_PARTIAL", "CATALOG_IMPORTED"].includes(record.catalogStatus));
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "catalog_composite"));
  });

  it("maps imported products to generated store catalog routes", () => {
    const result = importSupplierProducts(buildImportInput());

    for (const mapped of result.mappedProducts) {
      assert.equal(mapped.status, "MAPPED");
      assert.match(mapped.pageRoute, /^\/products\//);
      assert.equal(mapped.collectionHandle, "kitchen-essentials");
      assert.ok(mapped.storeProductHandle.length > 0);
    }

    assert.equal(result.importedProducts.length, result.mappedProducts.length);
    assert.equal(result.catalogStatus, "CATALOG_MAPPED");
  });

  it("applies retail markup to supplier pricing during import", () => {
    const [item] = buildSupplierItemsFromStub();
    const result = importSupplierProducts({
      store: {
        storeId: randomUUID(),
        brandId: randomUUID(),
      },
      supplierItems: [item!],
      retailMarkupMultiplier: 2.5,
    });

    const imported = result.importedProducts[0]!;
    const expectedRetail = Math.round(item!.supplierPricing.unitPrice * 2.5 * 100) / 100;

    assert.equal(imported.retailPrice, expectedRetail);
    assert.ok(imported.retailPrice > item!.supplierPricing.unitPrice);
    assert.equal(imported.currency, item!.supplierPricing.currency);
  });

  it("imports products from synced supplier catalog into a generated store", async () => {
    const syncModule = createSupplierProductSyncModule();
    const syncRecords = await syncModule.persistSupplierProductSync(WORKSPACE_ID, {
      connectorId: "cj-dropshipping",
      platform: "CJ_DROPSHIPPING",
      catalogItems: buildStubCatalogForPlatform("CJ_DROPSHIPPING"),
    });

    const storeId = randomUUID();
    const brandId = randomUUID();
    const importModule = createProductImportModule();
    const record = await importModule.persistProductImport(WORKSPACE_ID, {
      store: {
        storeId,
        brandId,
        generatedStorefrontId: randomUUID(),
      },
      supplierItems: syncRecords.map((syncRecord) => ({
        supplierProduct: {
          ...syncRecord.supplierProduct,
          productEntityId: syncRecord.supplierProduct.productEntityId ?? randomUUID(),
        },
        supplierInventory: syncRecord.supplierInventory,
        supplierPricing: syncRecord.supplierPricing,
      })),
    });

    assert.equal(record.importedProducts.length, syncRecords.length);
    assert.equal(record.catalogStatus, "CATALOG_MAPPED");
    assert.ok(record.importedProducts.every((product) => product.status === "IMPORTED"));
  });

  it("does not publish storefronts and keeps catalog in import-only status", () => {
    const result = importSupplierProducts(buildImportInput());

    assert.notEqual(result.catalogStatus, "PUBLISHED" as string);
    assert.ok(
      result.signals.every((signal) => !signal.detail.toLowerCase().includes("publish")),
    );
    assert.ok(result.mappedProducts.every((mapped) => mapped.pageRoute.startsWith("/products/")));
  });

  it("marks catalog import as failed when no supplier items are provided", () => {
    const result = importSupplierProducts({
      store: {
        storeId: randomUUID(),
        brandId: randomUUID(),
      },
      supplierItems: [],
    });

    assert.equal(result.catalogStatus, "CATALOG_FAILED");
    assert.equal(result.importedProducts.length, 0);
    assert.equal(result.mappedProducts.length, 0);
  });

  it("persists product import records in the repository", async () => {
    const repository = createInMemoryProductImportRepository();
    const module = createProductImportModule(repository);
    const input = buildImportInput();

    const saved = await module.persistProductImport(WORKSPACE_ID, input);
    const loadedByStore = await module.getProductImportByStore(WORKSPACE_ID, input.store.storeId);
    const loadedById = await module.getProductImportRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.catalogStatus, saved.catalogStatus);
    assert.equal(loadedById!.importedProducts.length, saved.importedProducts.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.store.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
