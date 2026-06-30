import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { SupplierProductInput } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildListingIntelligence } from "../../listing-intelligence/services/listing-intelligence-service.js";
import { buildProductMediaIntelligence } from "../../product-media/services/product-media-service.js";
import { buildMarketplaceListingPackage, enqueueMarketplacePublish } from "../../marketplace-publishing/services/marketplace-publishing-service.js";
import {
  COMMERCE_EXECUTION_STAGES,
  type CommerceExecutionPipeline,
  type CommerceExecutionStage,
} from "../models/commerce-execution-pipeline.js";

function stageRecord(
  stage: CommerceExecutionStage,
  status: CommerceExecutionPipeline["stages"][0]["status"],
  confidence: number,
  blockers: string[] = [],
): CommerceExecutionPipeline["stages"][0] {
  const now = new Date().toISOString();
  return {
    stage,
    status,
    confidence,
    startedAt: status !== "PENDING" ? now : null,
    completedAt: status === "COMPLETE" ? now : null,
    blockers,
    auditRef: `real-006:${stage}`,
    rollbackAvailable: stage !== "SUPPLIER",
  };
}

/** REAL-006 — Permanent commerce execution pipeline (architecture + governance gates). */
export function buildCommerceExecutionPipeline(
  workspaceId: string,
  companyId: string,
  product: SupplierProductInput,
  productId: string,
  options: { executiveApproved?: boolean; kingApproved?: boolean; marketplaceId?: "amazon" | "shopify" } = {},
): CommerceExecutionPipeline {
  const listing = buildListingIntelligence(workspaceId, companyId, product);
  const media = buildProductMediaIntelligence(workspaceId, companyId, product);
  const marketplaceId = options.marketplaceId ?? "amazon";

  const mpPackage = buildMarketplaceListingPackage({
    workspaceId,
    companyId,
    productId,
    marketplaceId,
    title: listing.title,
    description: listing.description,
    bulletPoints: listing.bulletPoints,
    specifications: listing.specifications,
    price: listing.pricingRecommendation.retail,
    images: product.imageUrls,
    executiveCouncilApproved: options.executiveApproved ?? false,
    kingApproved: options.kingApproved ?? false,
  });
  enqueueMarketplacePublish(mpPackage);

  const stages = COMMERCE_EXECUTION_STAGES.map((stage) => {
    switch (stage) {
      case "SUPPLIER":
        return stageRecord(stage, "COMPLETE", 85);
      case "PRODUCT_INTELLIGENCE":
        return stageRecord(stage, "COMPLETE", listing.confidenceScore);
      case "LISTING_INTELLIGENCE":
        return stageRecord(stage, "COMPLETE", listing.listingQualityScore);
      case "MEDIA_INTELLIGENCE":
        return stageRecord(stage, media.mediaGaps.length > 0 ? "BLOCKED" : "COMPLETE", media.mediaQualityScore, media.mediaGaps);
      case "EXECUTIVE_COUNCIL":
        return stageRecord(stage, options.executiveApproved ? "COMPLETE" : "PENDING", options.executiveApproved ? 80 : 40, options.executiveApproved ? [] : ["Awaiting Executive Council debate"]);
      case "SOUL":
        return stageRecord(stage, "PENDING", 50, ["Soul synthesis required before King decision"]);
      case "GRAND_KING_APPROVAL":
        return stageRecord(stage, options.kingApproved ? "COMPLETE" : "BLOCKED", options.kingApproved ? 90 : 0, options.kingApproved ? [] : ["Grand King approval required — DOCTRINE-006"]);
      case "MARKETPLACE_PUBLISHING":
        return stageRecord(stage, mpPackage.status === "PUBLISH_BLOCKED" ? "BLOCKED" : "IN_PROGRESS", listing.marketplaceReadiness, mpPackage.blockers);
      case "MARKETPLACE_SYNCHRONIZATION":
        return stageRecord(stage, "BLOCKED", 0, ["Live sync blocked until publish gates pass"]);
      case "MONITORING":
      case "SCALING":
      case "ARCHIVE":
        return stageRecord(stage, "PENDING", 0);
      default:
        return stageRecord(stage, "PENDING", 0);
    }
  });

  const completed = stages.filter((s) => s.status === "COMPLETE").length;
  const blocked = stages.filter((s) => s.status === "BLOCKED").length;
  const currentStage = stages.find((s) => s.status === "BLOCKED" || s.status === "IN_PROGRESS")?.stage ?? "MONITORING";

  const pipeline: CommerceExecutionPipeline = {
    pipelineId: randomUUID(),
    workspaceId,
    companyId,
    productId,
    supplierProductId: product.supplierProductId,
    currentStage,
    stages,
    overallConfidence: Math.round(stages.reduce((s, st) => s + st.confidence, 0) / stages.length),
    revenueReadinessPercent: Math.round((completed / stages.length) * 100),
    architectureComplete: blocked <= 4,
    computedAt: new Date().toISOString(),
  };

  persistPipeline(pipeline);
  return pipeline;
}

function persistPipeline(pipeline: CommerceExecutionPipeline): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO commerce_execution_pipelines (pipeline_id, workspace_id, product_id, record_json, updated_at)
     VALUES (@id, @ws, @pid, @json, @at)
     ON CONFLICT(pipeline_id) DO UPDATE SET record_json = @json, updated_at = @at`,
  ).run({ id: pipeline.pipelineId, ws: pipeline.workspaceId, pid: pipeline.productId, json: JSON.stringify(pipeline), at: pipeline.computedAt });
}

export function resetCommerceExecutionPipelines(): void {
  getDatabase().prepare(`DELETE FROM commerce_execution_pipelines`).run();
}
