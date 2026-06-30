import { randomUUID } from "node:crypto";

import {
  getCjSandboxProducts,
  mapCjProductsToCatalogItems,
} from "../../cj-dropshipping/index.js";
import type { RegisterProductAliasesInput } from "../../../intelligence/product-knowledge-graph/mappers/knowledge-graph-mapper.js";
import type { SupplierPlatform } from "../../supplier-connector-framework/models/supplier-platform.js";
import { resolveSupplierAdapterTemplate } from "../../supplier-connector-framework/adapters/supplier-adapter-registry.js";
import type { SupplierCatalogItemInput } from "../models/supplier-catalog-item.js";
import type { SupplierInventory } from "../models/supplier-inventory.js";
import type { SupplierPricing } from "../models/supplier-pricing.js";
import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierProductSyncRecordCreateInput } from "../models/supplier-product-sync-record.js";
import type { SupplierShippingData, SupplierShippingMethod } from "../models/supplier-shipping-data.js";
import type { SupplierSyncSignal, SupplierSyncSignalType } from "../models/supplier-sync-signal.js";
import {
  defaultSupplierProductKnowledgeGraphMapper,
  SupplierProductKnowledgeGraphMapper,
} from "../mappers/supplier-product-knowledge-graph-mapper.js";

export const SUPPLIER_SYNC_SIGNAL_WEIGHTS: Record<SupplierSyncSignalType, number> = {
  catalog_alignment: 0.22,
  inventory_freshness: 0.18,
  pricing_validity: 0.18,
  shipping_coverage: 0.16,
  knowledge_graph_mapping: 0.18,
  sync_composite: 0.08,
};

export type SupplierProductSyncInput = {
  connectorId: string;
  platform: SupplierPlatform;
  catalogItems?: SupplierCatalogItemInput[];
  integrationMode?: "STUB" | "SANDBOX" | "LIVE";
  catalogSyncOptions?: {
    keyword?: string;
    pageSize?: number;
    destinationCountryCode?: string;
  };
};

export type SupplierProductSyncBreakdown = SupplierProductSyncRecordCreateInput & {
  knowledgeGraphInput: RegisterProductAliasesInput;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: SupplierSyncSignalType,
  score: number,
  detail: string,
): SupplierSyncSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: SUPPLIER_SYNC_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function defaultShippingMethods(platform: SupplierPlatform): SupplierShippingMethod[] {
  const regionMap: Record<SupplierPlatform, string[]> = {
    CJ_DROPSHIPPING: ["US", "EU", "UK"],
    ALIEXPRESS: ["US", "EU", "CN"],
    ZENDROP: ["US", "CA"],
    AUTODS: ["US", "EU", "AU"],
  };

  return [
    {
      method: "standard",
      cost: 4.99,
      minDays: 7,
      maxDays: 15,
      regions: regionMap[platform],
    },
    {
      method: "express",
      cost: 12.99,
      minDays: 3,
      maxDays: 7,
      regions: regionMap[platform],
    },
  ];
}

function buildSupplierProduct(
  connectorId: string,
  platform: SupplierPlatform,
  item: SupplierCatalogItemInput,
  canonicalSlug: string,
): SupplierProduct {
  return {
    supplierProductId: randomUUID(),
    connectorId,
    platform,
    supplierSku: item.supplierSku,
    title: item.title,
    description: item.description ?? `${item.title} supplied via ${platform}`,
    category: item.category ?? "general",
    tags: item.tags ?? [],
    productEntityId: null,
    canonicalSlug,
  };
}

function buildSupplierInventory(
  item: SupplierCatalogItemInput,
  syncMode: SupplierInventory["syncMode"] = "STUB",
): SupplierInventory {
  const quantity = item.inventoryQuantity;
  return {
    supplierSku: item.supplierSku,
    quantity,
    warehouseRegion: item.warehouseRegion ?? "US",
    inStock: quantity > 0,
    syncMode,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function buildSupplierPricing(item: SupplierCatalogItemInput): SupplierPricing {
  const compareAtPrice = item.compareAtPrice ?? null;
  const marginHintPercent =
    compareAtPrice && compareAtPrice > item.unitPrice
      ? clampScore(((compareAtPrice - item.unitPrice) / compareAtPrice) * 100)
      : 35;

  return {
    supplierSku: item.supplierSku,
    unitPrice: item.unitPrice,
    currency: item.currency ?? "USD",
    compareAtPrice,
    marginHintPercent,
  };
}

function buildSupplierShippingData(
  item: SupplierCatalogItemInput,
  platform: SupplierPlatform,
): SupplierShippingData {
  const methods = item.shippingMethods?.length
    ? item.shippingMethods
    : defaultShippingMethods(platform);

  return {
    supplierSku: item.supplierSku,
    defaultMethod: methods[0]!.method,
    methods,
  };
}

function computeConfidence(
  item: SupplierCatalogItemInput,
  shipping: SupplierShippingData,
  signals: SupplierSyncSignal[],
): number {
  return clampScore(
    (item.inventoryQuantity > 0 ? 82 : 48) * 0.25 +
      (item.unitPrice > 0 ? 84 : 40) * 0.25 +
      (shipping.methods.length >= 2 ? 86 : 62) * 0.2 +
      (item.title.length >= 5 ? 80 : 55) * 0.15 +
      average(signals.map((signal) => signal.score)) * 0.15,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignals(
  item: SupplierCatalogItemInput,
  canonicalSlug: string,
  shipping: SupplierShippingData,
  confidence: number,
): SupplierSyncSignal[] {
  return [
    buildSignal(
      "catalog_alignment",
      item.title.length >= 5 ? 88 : 58,
      `Catalog item ${item.supplierSku} aligned to slug ${canonicalSlug}`,
    ),
    buildSignal(
      "inventory_freshness",
      item.inventoryQuantity > 0 ? 86 : 42,
      `Inventory quantity ${item.inventoryQuantity}`,
    ),
    buildSignal(
      "pricing_validity",
      item.unitPrice > 0 ? 84 : 40,
      `Unit price ${item.unitPrice} ${item.currency ?? "USD"}`,
    ),
    buildSignal(
      "shipping_coverage",
      shipping.methods.length >= 2 ? 88 : 60,
      `${shipping.methods.length} shipping methods available`,
    ),
    buildSignal(
      "knowledge_graph_mapping",
      canonicalSlug.length >= 3 ? 86 : 50,
      `Knowledge graph slug ${canonicalSlug}`,
    ),
    buildSignal("sync_composite", confidence, `Sync confidence ${confidence}`),
  ];
}

/** Syncs a single supplier catalog item into structured supplier product outputs. */
export function syncSupplierCatalogItem(
  connectorId: string,
  platform: SupplierPlatform,
  item: SupplierCatalogItemInput,
  mapper: SupplierProductKnowledgeGraphMapper = defaultSupplierProductKnowledgeGraphMapper,
  syncMode: SupplierInventory["syncMode"] = "STUB",
): SupplierProductSyncBreakdown {
  const knowledgeGraphInput = mapper.mapCatalogItemToKnowledgeGraphInput(
    connectorId,
    platform,
    item,
  );
  const canonicalSlug = mapper.resolveCanonicalSlug(item.title, item.supplierSku, platform);
  const supplierProduct = buildSupplierProduct(connectorId, platform, item, canonicalSlug);
  const supplierInventory = buildSupplierInventory(item, syncMode);
  const supplierPricing = buildSupplierPricing(item);
  const supplierShippingData = buildSupplierShippingData(item, platform);

  const provisionalSignals = buildSignals(item, canonicalSlug, supplierShippingData, 0);
  const confidence = computeConfidence(item, supplierShippingData, provisionalSignals);
  const signals = buildSignals(item, canonicalSlug, supplierShippingData, confidence);

  return {
    supplierProduct,
    supplierInventory,
    supplierPricing,
    supplierShippingData,
    confidence,
    signals,
    knowledgeGraphInput,
  };
}

/** Syncs supplier catalog items from a connector into supplier product outputs. */
export function syncSupplierCatalog(
  input: SupplierProductSyncInput,
  mapper: SupplierProductKnowledgeGraphMapper = defaultSupplierProductKnowledgeGraphMapper,
): SupplierProductSyncBreakdown[] {
  const catalogItems = input.catalogItems ?? [];
  const syncMode = input.integrationMode ?? "STUB";

  return catalogItems.map((item) =>
    syncSupplierCatalogItem(input.connectorId, input.platform, item, mapper, syncMode),
  );
}

/** Builds stub catalog items for a supplier platform when no live catalog is available. */
export function buildStubCatalogForPlatform(platform: SupplierPlatform): SupplierCatalogItemInput[] {
  if (platform === "CJ_DROPSHIPPING") {
    return mapCjProductsToCatalogItems(getCjSandboxProducts());
  }

  const template = resolveSupplierAdapterTemplate(platform);
  const connectorLabel = template?.displayName ?? platform;

  return [
    {
      supplierSku: `${platform.slice(0, 2)}-BLENDER-001`,
      title: `${connectorLabel} Kitchen Blender`,
      description: `High-performance kitchen blender sourced from ${connectorLabel}`,
      category: "kitchen-appliances",
      tags: ["kitchen", "blender", platform.toLowerCase()],
      inventoryQuantity: 240,
      warehouseRegion: "US",
      unitPrice: 24.99,
      currency: "USD",
      compareAtPrice: 39.99,
    },
    {
      supplierSku: `${platform.slice(0, 2)}-PITCHER-002`,
      title: `${connectorLabel} Replacement Pitcher`,
      description: `Replacement pitcher accessory from ${connectorLabel}`,
      category: "kitchen-accessories",
      tags: ["accessory", "pitcher", platform.toLowerCase()],
      inventoryQuantity: 120,
      warehouseRegion: "US",
      unitPrice: 12.5,
      currency: "USD",
      compareAtPrice: 19.99,
    },
  ];
}

export const supplierProductSyncScoring = {
  syncSupplierCatalogItem,
  syncSupplierCatalog,
  buildStubCatalogForPlatform,
  weights: SUPPLIER_SYNC_SIGNAL_WEIGHTS,
};
