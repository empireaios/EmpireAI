import { z } from "zod";

/** B-002 — Marketplace plugin capability model (declaration only). */
export const MarketplacePluginCapabilitySchema = z.enum([
  "publish_product",
  "update_product",
  "delete_product",
  "inventory",
  "orders",
  "customers",
  "collections",
  "returns",
  "messaging",
  "analytics",
  "webhooks",
  "pricing",
  "images",
  "categories",
  "attributes",
  "bulk_operations",
]);

export type MarketplacePluginCapability = z.infer<typeof MarketplacePluginCapabilitySchema>;

export const MARKETPLACE_CAPABILITY_LABELS: Record<MarketplacePluginCapability, string> = {
  publish_product: "Publish Product",
  update_product: "Update Product",
  delete_product: "Delete Product",
  inventory: "Inventory",
  orders: "Orders",
  customers: "Customers",
  collections: "Collections",
  returns: "Returns",
  messaging: "Messaging",
  analytics: "Analytics",
  webhooks: "Webhooks",
  pricing: "Pricing",
  images: "Images",
  categories: "Categories",
  attributes: "Attributes",
  bulk_operations: "Bulk Operations",
};

/** Maps CRT runtime operations to marketplace plugin capabilities. */
export const CRT_OPERATION_TO_MARKETPLACE_CAPABILITY: Record<string, MarketplacePluginCapability> = {
  publish_product: "publish_product",
  sync_inventory: "inventory",
};

export const MARKETPLACE_LOOKUP_CAPABILITIES: MarketplacePluginCapability[] = [
  "publish_product",
  "inventory",
  "orders",
  "customers",
  "returns",
  "analytics",
];
