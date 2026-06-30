import { randomUUID } from "node:crypto";

import { getDatabase } from "../../brain/database.js";
import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierOpportunity } from "../models/supplier-opportunity.js";
import { scoreSupplierProduct } from "./supplier-scoring-service.js";
import { detectSupplierRisks } from "./supplier-risk-service.js";

const ARCHITECTURE_SAMPLE_PRODUCTS: Omit<SupplierProduct, "ingestedAt">[] = [
  {
    supplierProductId: "sup:cj:wireless-timer",
    providerId: "cj-dropshipping",
    supplierName: "CJdropshipping",
    title: "Wireless Kitchen Timer Pro",
    category: "kitchen",
    price: 8.5,
    costPrice: 8.5,
    suggestedRetailPrice: 24.99,
    inventory: 320,
    shippingCountries: ["US", "UK", "CA", "AU"],
    shippingDaysMin: 8,
    shippingDaysMax: 14,
    processingDays: 2,
    supplierRating: 4.2,
    images: [],
    videos: [],
    specs: {},
    variants: [],
    tags: ["kitchen", "timer"],
    dataAuthority: "supplier_input",
  },
  {
    supplierProductId: "sup:spocket:silicone-set",
    providerId: "spocket",
    supplierName: "Spocket",
    title: "Silicone Utensil Set",
    category: "kitchen",
    price: 11.0,
    costPrice: 11.0,
    suggestedRetailPrice: 29.99,
    inventory: 85,
    shippingCountries: ["US"],
    shippingDaysMin: 5,
    shippingDaysMax: 10,
    processingDays: 1,
    supplierRating: 4.5,
    images: [],
    videos: [],
    specs: {},
    variants: [],
    tags: ["kitchen"],
    dataAuthority: "supplier_input",
  },
  {
    supplierProductId: "sup:aliexpress:magnetic-rack",
    providerId: "aliexpress",
    supplierName: "AliExpress",
    title: "Magnetic Spice Rack",
    category: "kitchen",
    price: 6.2,
    costPrice: 6.2,
    suggestedRetailPrice: 19.99,
    inventory: 1200,
    shippingCountries: ["US", "EU", "UK"],
    shippingDaysMin: 12,
    shippingDaysMax: 22,
    processingDays: 3,
    supplierRating: 3.8,
    images: [],
    videos: [],
    specs: {},
    variants: [],
    tags: ["kitchen", "storage"],
    dataAuthority: "supplier_input",
  },
];

function persistProduct(workspaceId: string, product: SupplierProduct): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO supplier_intelligence_products (record_id, workspace_id, provider_id, record_json, updated_at)
     VALUES (@recordId, @workspaceId, @providerId, @recordJson, @updatedAt)
     ON CONFLICT(record_id) DO UPDATE SET record_json = @recordJson, updated_at = @updatedAt`,
  ).run({
    recordId: `${workspaceId}:${product.supplierProductId}`,
    workspaceId,
    providerId: product.providerId,
    recordJson: JSON.stringify(product),
    updatedAt: product.ingestedAt,
  });
}

export function ingestSupplierProduct(workspaceId: string, product: SupplierProduct): SupplierProduct {
  persistProduct(workspaceId, product);
  return product;
}

export function listSupplierProducts(workspaceId: string): SupplierProduct[] {
  const db = getDatabase();
  const rows = db.prepare(
    `SELECT record_json FROM supplier_intelligence_products WHERE workspace_id = @workspaceId`,
  ).all({ workspaceId }) as { record_json: string }[];
  if (rows.length === 0) {
    return seedArchitectureProducts(workspaceId);
  }
  return rows.map((r) => JSON.parse(r.record_json) as SupplierProduct);
}

function seedArchitectureProducts(workspaceId: string): SupplierProduct[] {
  const now = new Date().toISOString();
  return ARCHITECTURE_SAMPLE_PRODUCTS.map((p) => {
    const product: SupplierProduct = { ...p, ingestedAt: now };
    persistProduct(workspaceId, product);
    return product;
  });
}

/** SUP-008 — Find supplier products suitable for launch pipeline. */
export function findSupplierOpportunities(workspaceId: string): SupplierOpportunity[] {
  const products = listSupplierProducts(workspaceId);
  const opportunities: SupplierOpportunity[] = [];

  for (const product of products) {
    const score = scoreSupplierProduct(product);
    const risks = detectSupplierRisks(product);
    if (score.recommendation === "REJECT" && risks.some((r) => r.severity === "CRITICAL")) continue;

    let pipelineStatus: SupplierOpportunity["pipelineStatus"] = "FOUND";
    if (score.recommendation === "LAUNCH") pipelineStatus = "UNDER_REVIEW";
    if (score.overallScore >= 70) pipelineStatus = "CIS_QUEUED";

    const margin = product.suggestedRetailPrice
      ? ((product.suggestedRetailPrice - product.costPrice) / product.suggestedRetailPrice) * 100
      : undefined;

    opportunities.push({
      opportunityId: randomUUID(),
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      title: product.title,
      category: product.category,
      score,
      pipelineStatus,
      targetCountries: product.shippingCountries,
      marginPercent: margin,
      discoveredAt: new Date().toISOString(),
    });
  }

  return opportunities.sort((a, b) => b.score.overallScore - a.score.overallScore);
}

export function resetSupplierIntelligenceProducts(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM supplier_intelligence_products`).run();
}
