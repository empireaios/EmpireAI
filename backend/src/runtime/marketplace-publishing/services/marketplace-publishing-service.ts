import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import { classifyAction } from "../../../operational-access/models/approval-boundary.js";
import type { MarketplaceListingPackage, MarketplacePublishId } from "../models/marketplace-adapter.js";
import { MARKETPLACE_ADAPTERS, resolveMarketplaceAdapter } from "../models/marketplace-adapter.js";
import { formatForMarketplace } from "./marketplace-formatter-service.js";
import { validateMarketplaceListing } from "./marketplace-validator-service.js";

export type PublishQueueItem = {
  queueId: string;
  packageId: string;
  marketplaceId: MarketplacePublishId;
  status: "PENDING" | "BLOCKED" | "APPROVED" | "EXECUTING" | "COMPLETE";
  blockers: string[];
  queuedAt: string;
};

function persistPackage(pkg: MarketplaceListingPackage): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO marketplace_publish_packages (package_id, workspace_id, marketplace_id, record_json, updated_at)
     VALUES (@packageId, @workspaceId, @marketplaceId, @json, @updatedAt)
     ON CONFLICT(package_id) DO UPDATE SET record_json = @json, updated_at = @updatedAt`,
  ).run({
    packageId: pkg.packageId,
    workspaceId: pkg.workspaceId,
    marketplaceId: pkg.marketplaceId,
    json: JSON.stringify(pkg),
    updatedAt: pkg.computedAt,
  });
}

/** REAL-003 — Transform approved product into marketplace listing package (no execution bypass). */
export function buildMarketplaceListingPackage(input: {
  workspaceId: string;
  companyId: string;
  productId: string;
  marketplaceId: MarketplacePublishId;
  title: string;
  description: string;
  bulletPoints: string[];
  specifications: Record<string, string>;
  price: number;
  images: string[];
  executiveCouncilApproved?: boolean;
  kingApproved?: boolean;
}): MarketplaceListingPackage {
  const adapter = resolveMarketplaceAdapter(input.marketplaceId);
  const blockers: string[] = [];
  const boundary = classifyAction("publish_listing", input.marketplaceId);

  if (boundary?.boundary === "forbidden") blockers.push("Publish forbidden by OAR-004 boundary");
  if (!input.kingApproved) blockers.push("Grand King approval required — DOCTRINE-006");
  if (!input.executiveCouncilApproved) blockers.push("Executive Council approval required");
  if (!adapter.supportsPublish) blockers.push("Live publish blocked — architecture-only adapter");

  const formatted = formatForMarketplace(input.marketplaceId, {
    title: input.title,
    description: input.description,
    bulletPoints: input.bulletPoints,
    specifications: input.specifications,
    price: input.price,
    images: input.images,
  });

  const validation = validateMarketplaceListing(input.marketplaceId, formatted);
  if (!validation.valid) blockers.push(...validation.errors);

  const pkg: MarketplaceListingPackage = {
    packageId: randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    productId: input.productId,
    marketplaceId: input.marketplaceId,
    title: input.title,
    description: input.description,
    bulletPoints: input.bulletPoints,
    specifications: input.specifications,
    price: input.price,
    currency: "USD",
    images: input.images,
    status: blockers.length > 0 ? "PUBLISH_BLOCKED" : "VALIDATED",
    governanceApproved: Boolean(input.executiveCouncilApproved && input.kingApproved),
    kingApproved: Boolean(input.kingApproved),
    blockers,
    formattedPayload: formatted,
    computedAt: new Date().toISOString(),
  };

  persistPackage(pkg);
  return pkg;
}

export function enqueueMarketplacePublish(pkg: MarketplaceListingPackage): PublishQueueItem {
  const db = getDatabase();
  const item: PublishQueueItem = {
    queueId: randomUUID(),
    packageId: pkg.packageId,
    marketplaceId: pkg.marketplaceId,
    status: pkg.blockers.length > 0 || !pkg.kingApproved ? "BLOCKED" : "PENDING",
    blockers: pkg.blockers,
    queuedAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO marketplace_publish_queue (queue_id, workspace_id, package_id, record_json, queued_at)
     VALUES (@queueId, @workspaceId, @packageId, @json, @queuedAt)`,
  ).run({
    queueId: item.queueId,
    workspaceId: pkg.workspaceId,
    packageId: pkg.packageId,
    json: JSON.stringify(item),
    queuedAt: item.queuedAt,
  });
  return item;
}

export function listMarketplaceAdapters(env: NodeJS.ProcessEnv = process.env) {
  return MARKETPLACE_ADAPTERS.map((adapter) => resolveMarketplaceAdapter(adapter.marketplaceId, env));
}

export function resetMarketplacePublishing(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM marketplace_publish_packages`).run();
  db.prepare(`DELETE FROM marketplace_publish_queue`).run();
}
