import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInMemoryKnowledgeGraphRepository,
  createKnowledgeGraphModule,
} from "../../intelligence/product-knowledge-graph/index.js";
import {
  buildStubCatalogForPlatform,
  createInMemorySupplierProductSyncRepository,
  createSupplierProductSyncModule,
  syncSupplierCatalog,
} from "../../suppliers/supplier-product-synchronization/index.js";

const WORKSPACE_ID = "ws-m067";

describe("Mission 067 Supplier Product Synchronization", () => {
  it("syncs supplier products with required output fields", async () => {
    const module = createSupplierProductSyncModule();
    const records = await module.persistSupplierProductSync(WORKSPACE_ID, {
      connectorId: "cj-dropshipping",
      platform: "CJ_DROPSHIPPING",
      catalogItems: buildStubCatalogForPlatform("CJ_DROPSHIPPING"),
    });

    assert.equal(records.length, 2);
    const record = records[0]!;

    assert.ok(record.supplierProduct.supplierProductId);
    assert.equal(record.supplierProduct.connectorId, "cj-dropshipping");
    assert.ok(record.supplierInventory.quantity >= 0);
    assert.ok(record.supplierPricing.unitPrice > 0);
    assert.ok(record.supplierShippingData.methods.length >= 1);
    assert.ok(record.confidence >= 70);
  });

  it("links synced supplier products into the Product Knowledge Graph", async () => {
    const graphRepository = createInMemoryKnowledgeGraphRepository();
    const knowledgeGraph = createKnowledgeGraphModule(graphRepository);
    const module = createSupplierProductSyncModule(
      createInMemorySupplierProductSyncRepository(),
      knowledgeGraph,
    );

    const records = await module.persistSupplierProductSync(WORKSPACE_ID, {
      connectorId: "aliexpress",
      platform: "ALIEXPRESS",
      catalogItems: [
        {
          supplierSku: "AE-BLENDER-9001",
          title: "Portable USB Blender",
          description: "Compact portable blender for travel",
          category: "kitchen-appliances",
          tags: ["kitchen", "portable", "blender"],
          inventoryQuantity: 500,
          unitPrice: 18.99,
          currency: "USD",
        },
      ],
    });

    const record = records[0]!;
    assert.ok(record.supplierProduct.productEntityId);
    assert.ok(record.supplierProduct.canonicalSlug.length > 0);

    const entity = await graphRepository.entities.getById(
      WORKSPACE_ID,
      record.supplierProduct.productEntityId!,
    );
    assert.ok(entity);
    assert.equal(entity!.displayName, "Portable USB Blender");
    assert.equal(entity!.supplierRefs[0]?.supplierId, "aliexpress");
    assert.equal(entity!.supplierRefs[0]?.supplierSku, "AE-BLENDER-9001");
  });

  it("maps inventory, pricing, and shipping data from catalog inputs", () => {
    const [record] = syncSupplierCatalog({
      connectorId: "zendrop",
      platform: "ZENDROP",
      catalogItems: [
        {
          supplierSku: "ZD-GRINDER-22",
          title: "Premium Coffee Grinder",
          inventoryQuantity: 88,
          warehouseRegion: "US",
          unitPrice: 31.5,
          currency: "USD",
          compareAtPrice: 49.99,
          shippingMethods: [
            {
              method: "economy",
              cost: 3.5,
              minDays: 8,
              maxDays: 14,
              regions: ["US"],
            },
          ],
        },
      ],
    });

    assert.equal(record!.supplierInventory.supplierSku, "ZD-GRINDER-22");
    assert.equal(record!.supplierInventory.inStock, true);
    assert.equal(record!.supplierPricing.unitPrice, 31.5);
    assert.equal(record!.supplierPricing.compareAtPrice, 49.99);
    assert.equal(record!.supplierShippingData.defaultMethod, "economy");
    assert.equal(record!.supplierShippingData.methods[0]!.cost, 3.5);
  });

  it("builds stub catalogs for all supported supplier platforms", () => {
    const platforms = ["CJ_DROPSHIPPING", "ALIEXPRESS", "ZENDROP", "AUTODS"] as const;

    for (const platform of platforms) {
      const catalog = buildStubCatalogForPlatform(platform);
      assert.ok(catalog.length >= 2);
      assert.ok(catalog.every((item) => item.supplierSku.length > 0));
      assert.ok(catalog.every((item) => item.unitPrice > 0));
    }
  });

  it("updates knowledge graph entities when the same supplier sku is synced again", async () => {
    const graphRepository = createInMemoryKnowledgeGraphRepository();
    const knowledgeGraph = createKnowledgeGraphModule(graphRepository);
    const syncRepository = createInMemorySupplierProductSyncRepository();
    const module = createSupplierProductSyncModule(syncRepository, knowledgeGraph);

    const input = {
      connectorId: "autods",
      platform: "AUTODS" as const,
      catalogItems: [
        {
          supplierSku: "ADS-EARBUD-55",
          title: "Wireless Earbuds Pro",
          inventoryQuantity: 300,
          unitPrice: 15.99,
        },
      ],
    };

    const first = await module.persistSupplierProductSync(WORKSPACE_ID, input);
    const second = await module.persistSupplierProductSync(WORKSPACE_ID, {
      ...input,
      catalogItems: [
        {
          ...input.catalogItems[0]!,
          inventoryQuantity: 420,
          unitPrice: 14.99,
        },
      ],
    });

    assert.equal(first[0]!.supplierProduct.productEntityId, second[0]!.supplierProduct.productEntityId);
    assert.equal(second[0]!.supplierInventory.quantity, 420);
    assert.equal(second[0]!.supplierPricing.unitPrice, 14.99);

    const entities = await graphRepository.entities.list({ workspaceId: WORKSPACE_ID });
    assert.equal(entities.length, 1);
  });

  it("persists supplier product sync records in the repository", async () => {
    const repository = createInMemorySupplierProductSyncRepository();
    const module = createSupplierProductSyncModule(repository);

    const records = await module.persistSupplierProductSync(WORKSPACE_ID, {
      connectorId: "cj-dropshipping",
      platform: "CJ_DROPSHIPPING",
      catalogItems: buildStubCatalogForPlatform("CJ_DROPSHIPPING").slice(0, 1),
    });

    const saved = records[0]!;
    const loadedBySku = await module.getSupplierProductSyncBySku(
      WORKSPACE_ID,
      "cj-dropshipping",
      saved.supplierProduct.supplierSku,
    );

    assert.ok(loadedBySku);
    assert.equal(loadedBySku!.recordId, saved.recordId);
    assert.equal(loadedBySku!.supplierProduct.title, saved.supplierProduct.title);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      platform: "CJ_DROPSHIPPING",
    });
    assert.equal(listed.length, 1);
  });
});
