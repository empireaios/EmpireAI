import type { RegisteredTool } from "../../../brain/types.js";
import type { ImportedProduct } from "../../product-import/models/imported-product.js";
import type { MappedProduct } from "../../product-import/models/mapped-product.js";
import {
  applyProductUpdates,
  getCatalogPublishById,
  getPublishedProductById,
  listCatalogPublishes,
  listPublishedProducts,
  prepareCatalogPublish,
  ProductPublishingBlockedError,
  publishCatalogToStorefront,
  syncPublishedAvailability,
  syncPublishedInventory,
  syncPublishedPrices,
} from "../services/product-publishing-service.js";

export const productPublishingTools: RegisteredTool[] = [
  {
    name: "product_publishing.prepare_catalog",
    description: "Prepare imported supplier products for storefront catalog publish",
    module: "product-publishing",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        storeId: { type: "string" },
        importedProducts: { type: "array" },
        mappedProducts: { type: "array" },
      },
      required: ["workspaceId", "companyId", "storeId", "importedProducts", "mappedProducts"],
    },
    handler: async (args) =>
      prepareCatalogPublish({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        storeId: String(args.storeId),
        importedProducts: args.importedProducts as ImportedProduct[],
        mappedProducts: args.mappedProducts as MappedProduct[],
      }),
  },
  {
    name: "product_publishing.publish_catalog",
    description: "Publish prepared catalog to deployed storefront (catalog.json + index.html)",
    module: "product-publishing",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { publishId: { type: "string" } },
      required: ["publishId"],
    },
    handler: async (args) => publishCatalogToStorefront(String(args.publishId)),
  },
  {
    name: "product_publishing.sync_inventory",
    description: "Sync published product inventory from supplier snapshots",
    module: "product-publishing",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { publishId: { type: "string" } },
      required: ["publishId"],
    },
    handler: async (args) => syncPublishedInventory(String(args.publishId)),
  },
  {
    name: "product_publishing.sync_prices",
    description: "Recalculate published retail prices from supplier cost snapshots",
    module: "product-publishing",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { publishId: { type: "string" } },
      required: ["publishId"],
    },
    handler: async (args) => syncPublishedPrices(String(args.publishId)),
  },
  {
    name: "product_publishing.sync_availability",
    description: "Recompute availability flags from current inventory levels",
    module: "product-publishing",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { publishId: { type: "string" } },
      required: ["publishId"],
    },
    handler: async (args) => syncPublishedAvailability(String(args.publishId)),
  },
  {
    name: "product_publishing.apply_updates",
    description: "Apply explicit product updates and republish storefront artifacts",
    module: "product-publishing",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        publishId: { type: "string" },
        updates: { type: "array" },
      },
      required: ["publishId", "updates"],
    },
    handler: async (args) =>
      applyProductUpdates(
        String(args.publishId),
        args.updates as Array<{
          publishedProductId: string;
          title?: string;
          description?: string;
          priceCents?: number;
          compareAtPriceCents?: number | null;
          inventoryQuantity?: number;
        }>,
      ),
  },
  {
    name: "product_publishing.list_catalogs",
    description: "List catalog publish jobs for a workspace",
    module: "product-publishing",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      listCatalogPublishes(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
  {
    name: "product_publishing.get_catalog",
    description: "Get catalog publish job with published products",
    module: "product-publishing",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { publishId: { type: "string" } },
      required: ["publishId"],
    },
    handler: async (args) => {
      const publish = getCatalogPublishById(String(args.publishId));
      if (!publish) return null;
      return {
        publish,
        products: listPublishedProducts(publish.storeId),
      };
    },
  },
  {
    name: "product_publishing.get_product",
    description: "Get a published storefront product by ID",
    module: "product-publishing",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { publishedProductId: { type: "string" } },
      required: ["publishedProductId"],
    },
    handler: async (args) => getPublishedProductById(String(args.publishedProductId)),
  },
];

export { ProductPublishingBlockedError };
