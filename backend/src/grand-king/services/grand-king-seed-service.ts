import { randomUUID } from "node:crypto";

import { logger } from "../../config/logger.js";
import { GRAND_KING_ACCOUNT_NAME, GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../constants.js";
import { getGrandKingRepository } from "../repositories/sqlite-grand-king-repository.js";

/** Seed Grand King account data — idempotent, single account only. */
export function seedGrandKingAccount(workspaceId: string = GRAND_KING_WORKSPACE_ID): void {
  const repo = getGrandKingRepository();
  if (repo.isSeeded(workspaceId)) {
    logger.info({ workspaceId }, "Grand King account already seeded");
    return;
  }

  const now = new Date().toISOString();

  for (const product of [
    { name: "Wireless Kitchen Timer Pro", category: "kitchen", status: "LISTED" as const, marginPercent: 68, listingScore: 82, supplierName: "CJ Dropshipping" },
    { name: "Silicone Utensil Set", category: "kitchen", status: "REVIEW" as const, marginPercent: 72, listingScore: 76, supplierName: "CJ Dropshipping" },
    { name: "Magnetic Spice Rack", category: "kitchen", status: "DRAFT" as const, marginPercent: 65, listingScore: 71 },
  ]) {
    repo.saveProduct({
      productId: randomUUID(),
      workspaceId,
      ...product,
      updatedAt: now,
    });
  }

  for (const supplier of [
    { name: "CJ Dropshipping", platform: "cj-dropshipping", status: "PENDING" as const, reliability: 88, avgShipDays: 14 },
    { name: "Empire Direct Source", platform: "manual", status: "CONNECTED" as const, reliability: 95, avgShipDays: 5 },
  ]) {
    repo.saveSupplier({
      supplierId: randomUUID(),
      workspaceId,
      ...supplier,
      updatedAt: now,
    });
  }

  for (const order of [
    { productName: "Wireless Kitchen Timer Pro", totalCents: 2999, profitCents: 1840, status: "PROCESSING" as const },
    { productName: "Silicone Utensil Set", totalCents: 3499, profitCents: 2100, status: "PENDING" as const },
  ]) {
    repo.saveOrder({
      orderId: randomUUID(),
      workspaceId,
      ...order,
      createdAt: now,
    });
  }

  for (const decision of [
    { title: "Approve first Amazon US listing for Kitchen Timer Pro", module: "executive-council", confidence: 78, rationale: "CIS commercial confidence supports launch" },
    { title: "Connect CJ Dropshipping supplier account", module: "reality-integration", confidence: 85, rationale: "Required for first real fulfillment" },
    { title: "Run Executive Council debate on premium brand positioning", module: "executive-surveillance", confidence: 72 },
  ]) {
    repo.saveAiDecision({
      decisionId: randomUUID(),
      workspaceId,
      status: "PENDING",
      createdAt: now,
      ...decision,
    });
  }

  for (const task of [
    { title: "Review CIS winning listing for Kitchen Timer Pro", status: "PENDING" as const, priority: "HIGH" as const, source: "commerce-intelligence-studio" },
    { title: "Approve pending AI decisions", status: "PENDING" as const, priority: "CRITICAL" as const, source: "grand-king-dashboard" },
    { title: "Connect Shopify marketplace", status: "BLOCKED" as const, priority: "HIGH" as const, source: "reality-integration" },
    { title: "Complete Operation First Dollar — first sale", status: "IN_PROGRESS" as const, priority: "CRITICAL" as const, source: "operation-first-dollar" },
  ]) {
    repo.createTask({ workspaceId, ...task, dueAt: undefined });
  }

  logger.info({ workspaceId, companyId: GRAND_KING_COMPANY_ID, account: GRAND_KING_ACCOUNT_NAME }, "Grand King account seeded");
}
