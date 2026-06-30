import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { loadRevenueLoopEnv } from "../config/revenue-loop-env.js";
import type { LiveStoreAnalytics, LiveStoreConfig } from "../models/live-store-config.js";
import {
  createLiveStoreRecord,
  getRevenueLoopRepository,
} from "../repositories/sqlite-revenue-loop-repository.js";
import type { LiveStoreRecord } from "../repositories/revenue-loop-repository.js";
import { buildStorefrontHtml } from "./analytics-injection.js";

export type DeployLiveStoreInput = {
  workspaceId: string;
  companyId: string;
  brandId: string;
  slug: string;
  productName: string;
  productDescription: string;
  priceCents: number;
  currency?: string;
  cjSupplierSku: string;
  cjSupplierProductId: string;
  unitCostCents: number;
  domain?: string | null;
  analytics?: Partial<LiveStoreAnalytics>;
};

export type DeployLiveStoreResult = {
  store: LiveStoreRecord;
  deployPath: string;
  publicUrl: string;
  checkoutPath: string;
};

function resolveAnalytics(override?: Partial<LiveStoreAnalytics>): LiveStoreAnalytics {
  const slug = override?.ga4MeasurementId ? "" : randomUUID().slice(0, 8).toUpperCase();
  return {
    ga4MeasurementId: override?.ga4MeasurementId ?? process.env.REVENUE_LOOP_GA4_ID ?? `G-EMPIRE-${slug}`,
    metaPixelId: override?.metaPixelId ?? process.env.REVENUE_LOOP_META_PIXEL_ID ?? `META-EMPIRE-${slug}`,
    tiktokPixelId: override?.tiktokPixelId ?? process.env.REVENUE_LOOP_TIKTOK_PIXEL_ID,
  };
}

/** Writes a production storefront to disk and persists store record. */
export function deployLiveStore(input: DeployLiveStoreInput): DeployLiveStoreResult {
  const config = loadRevenueLoopEnv();
  const storeId = randomUUID();
  const deployRoot = path.resolve(config.REVENUE_LOOP_DEPLOY_ROOT);
  const deployPath = path.join(deployRoot, input.slug);
  fs.mkdirSync(deployPath, { recursive: true });

  const analytics = resolveAnalytics(input.analytics);
  const checkoutPath = `/store/${input.slug}/checkout`;
  const publicUrl = `${config.REVENUE_LOOP_STORE_BASE_URL}/store/${input.slug}`;

  const storeConfig: LiveStoreConfig = {
    storeId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    brandId: input.brandId,
    slug: input.slug,
    productName: input.productName,
    productDescription: input.productDescription,
    priceCents: input.priceCents,
    currency: input.currency ?? "USD",
    cjSupplierSku: input.cjSupplierSku,
    cjSupplierProductId: input.cjSupplierProductId,
    unitCostCents: input.unitCostCents,
    domain: input.domain ?? null,
    deployPath,
    status: "DEPLOYED",
    analytics,
  };

  const html = buildStorefrontHtml({
    storeSlug: input.slug,
    productName: input.productName,
    productDescription: input.productDescription,
    priceCents: input.priceCents,
    currency: storeConfig.currency,
    checkoutUrl: checkoutPath,
    analytics,
    storeBaseUrl: config.REVENUE_LOOP_STORE_BASE_URL,
  });

  fs.writeFileSync(path.join(deployPath, "index.html"), html, "utf8");

  const store = createLiveStoreRecord(storeConfig);
  store.status = "CHECKOUT_ENABLED";
  getRevenueLoopRepository().saveStore(store);

  return {
    store,
    deployPath,
    publicUrl,
    checkoutPath,
  };
}

/** Serves deployed storefront index.html if present. */
export function readDeployedStorefront(slug: string): string | null {
  const store = getRevenueLoopRepository().getStoreBySlug(slug);
  if (!store) return null;
  const indexPath = path.join(store.deployPath, "index.html");
  if (!fs.existsSync(indexPath)) return null;
  return fs.readFileSync(indexPath, "utf8");
}
