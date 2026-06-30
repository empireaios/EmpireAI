import { randomUUID } from "node:crypto";

import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import type { PipelineProduct, ProductCandidateInput, RevenueTimelineEvent } from "../models/revenue-pipeline-core.js";
import type { RevenuePipelineState } from "../models/revenue-state-machine.js";
import { canTransition, REVENUE_PIPELINE_LIFECYCLE } from "../models/revenue-state-machine.js";
import { getGkrRepository } from "../repositories/sqlite-gkr-repository.js";
import { computeProductHealth } from "./revenue-health-service.js";
import { appendTimelineEvent } from "./revenue-timeline-service.js";
import { enrichProductFromIntegrations } from "./revenue-integration-service.js";

function setProductStateDirect(product: PipelineProduct, toState: RevenuePipelineState): PipelineProduct {
  return {
    ...product,
    state: toState,
    lifecycleStage: lifecycleLabelForState(toState),
    kingApproved: ["READY_TO_PUBLISH", "LIVE", "MONITORING", "SCALING"].includes(toState),
    updatedAt: new Date().toISOString(),
  };
}

const SEED_STATE_PATH: Partial<Record<RevenuePipelineState, RevenuePipelineState[]>> = {
  UNDER_REVIEW: ["UNDER_REVIEW"],
  EXECUTIVE_REVIEW: ["UNDER_REVIEW", "EXECUTIVE_REVIEW"],
  KING_APPROVAL: ["UNDER_REVIEW", "EXECUTIVE_REVIEW", "KING_APPROVAL"],
  READY_TO_PUBLISH: ["UNDER_REVIEW", "EXECUTIVE_REVIEW", "KING_APPROVAL", "READY_TO_PUBLISH"],
  LIVE: ["UNDER_REVIEW", "EXECUTIVE_REVIEW", "KING_APPROVAL", "READY_TO_PUBLISH", "LIVE"],
  MONITORING: ["UNDER_REVIEW", "EXECUTIVE_REVIEW", "KING_APPROVAL", "READY_TO_PUBLISH", "LIVE", "MONITORING"],
  SCALING: ["UNDER_REVIEW", "EXECUTIVE_REVIEW", "KING_APPROVAL", "READY_TO_PUBLISH", "LIVE", "MONITORING", "SCALING"],
  ARCHIVED: ["ARCHIVED"],
  FAILED: ["FAILED"],
  PAUSED: ["UNDER_REVIEW", "PAUSED"],
};

function applySeedState(product: PipelineProduct, targetState: RevenuePipelineState): PipelineProduct {
  if (product.state === targetState) return product;
  const path = SEED_STATE_PATH[targetState];
  if (!path) return product;
  let current = product;
  for (const state of path) {
    if (current.state === state) continue;
    try {
      current = transitionProductState(current.workspaceId, current.companyId, current.productId, state, "Pipeline seed");
    } catch {
      current = setProductStateDirect(current, state);
      const enriched = enrichProductFromIntegrations(current);
      enriched.health = computeProductHealth(enriched, current.workspaceId, current.companyId);
      getGkrRepository().saveProduct(enriched);
      current = enriched;
    }
  }
  return getGkrRepository().getProduct(current.productId)!;
}

function lifecycleLabelForState(state: RevenuePipelineState): string {
  const match = REVENUE_PIPELINE_LIFECYCLE.find((s) => s.state === state);
  return match?.label ?? state;
}

/** GKR-001/002 — Revenue pipeline runtime and state machine. */
export function seedRevenuePipeline(workspaceId: string, companyId: string): PipelineProduct[] {
  const repo = getGkrRepository();
  if (repo.isSeeded(workspaceId, companyId)) return repo.listProducts(workspaceId, companyId);

  const seeds: Array<{ title: string; category: string; state: RevenuePipelineState; supplierPlatform?: string }> = [
    { title: "Wireless Kitchen Timer Pro", category: "kitchen", state: "KING_APPROVAL", supplierPlatform: "cj-dropshipping" },
    { title: "Silicone Utensil Set", category: "kitchen", state: "UNDER_REVIEW", supplierPlatform: "cj-dropshipping" },
    { title: "Magnetic Spice Rack", category: "kitchen", state: "DISCOVERED" },
    { title: "Premium Chef Knife Set", category: "kitchen", state: "READY_TO_PUBLISH", supplierPlatform: "cj-dropshipping" },
    { title: "Smart Measuring Cups", category: "kitchen", state: "LIVE", supplierPlatform: "cj-dropshipping" },
    { title: "Foldable Cutting Board", category: "kitchen", state: "SCALING", supplierPlatform: "spocket" },
    { title: "Old Seasonal Mug Warmer", category: "kitchen", state: "ARCHIVED" },
  ];

  const products: PipelineProduct[] = [];
  for (const seed of seeds) {
    const product = registerProductCandidate(workspaceId, companyId, {
      title: seed.title,
      category: seed.category,
      supplierPlatform: seed.supplierPlatform,
    });
    if (product.state !== seed.state) {
      applySeedState(product, seed.state);
    }
    products.push(getGkrRepository().getProduct(product.productId)!);
  }
  return products;
}

export function registerProductCandidate(
  workspaceId: string,
  companyId: string,
  input: ProductCandidateInput,
): PipelineProduct {
  const repo = getGkrRepository();
  const now = new Date().toISOString();
  const productId = randomUUID();

  const product: PipelineProduct = {
    productId,
    workspaceId,
    companyId,
    title: input.title,
    category: input.category,
    supplierPlatform: input.supplierPlatform,
    supplierProductId: input.supplierProductId,
    state: "DISCOVERED",
    lifecycleStage: lifecycleLabelForState("DISCOVERED"),
    commercialScore: undefined,
    kingApproved: false,
    timeline: [],
    createdAt: now,
    updatedAt: now,
  };

  appendTimelineEvent(product, {
    eventType: "PRODUCT_REGISTERED",
    title: "Product candidate registered",
    summary: `${input.title} entered revenue pipeline as DISCOVERED`,
    sourceModule: "grand-king-revenue-pipeline",
  });

  repo.saveProduct(product);
  repo.saveTimelineEvent(product.timeline[product.timeline.length - 1]!, workspaceId, companyId);
  return product;
}

export function transitionProductState(
  workspaceId: string,
  companyId: string,
  productId: string,
  toState: RevenuePipelineState,
  reason: string,
): PipelineProduct {
  const repo = getGkrRepository();
  const product = repo.getProduct(productId);
  if (!product) throw new Error(`Pipeline product not found: ${productId}`);
  if (product.workspaceId !== workspaceId || product.companyId !== companyId) {
    throw new Error("Product scope mismatch");
  }

  if (!canTransition(product.state, toState)) {
    throw new Error(`Invalid transition ${product.state} → ${toState}`);
  }

  const updated: PipelineProduct = {
    ...product,
    state: toState,
    lifecycleStage: lifecycleLabelForState(toState),
    kingApproved: toState === "READY_TO_PUBLISH" || toState === "LIVE" || toState === "MONITORING" || toState === "SCALING" ? true : product.kingApproved,
    updatedAt: new Date().toISOString(),
  };

  appendTimelineEvent(updated, {
    eventType: "STATE_TRANSITION",
    title: `State: ${product.state} → ${toState}`,
    summary: reason,
    sourceModule: "grand-king-revenue-pipeline",
  });

  const enriched = enrichProductFromIntegrations(updated);
  enriched.health = computeProductHealth(enriched, workspaceId, companyId);
  repo.saveProduct(enriched);
  for (const evt of enriched.timeline.slice(product.timeline.length)) {
    repo.saveTimelineEvent(evt, workspaceId, companyId);
  }
  return enriched;
}

export function getRevenuePipelineRuntime(workspaceId: string, companyId: string) {
  seedRevenuePipeline(workspaceId, companyId);
  const products = getGkrRepository().listProducts(workspaceId, companyId);
  const byState: Record<string, number> = {};
  for (const p of products) {
    byState[p.state] = (byState[p.state] ?? 0) + 1;
  }
  const scores = products.map((p) => p.health?.overallScore ?? p.commercialScore ?? 50);
  const empireRevenueScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    moduleId: "grand-king-revenue-pipeline" as const,
    missionId: "GKR-001-GKR-010" as const,
    totalProducts: products.length,
    byState,
    empireRevenueScore,
    lastTransitionAt: products[0]?.updatedAt ?? null,
  };
}

export function listPipelineProducts(workspaceId: string, companyId: string): PipelineProduct[] {
  seedRevenuePipeline(workspaceId, companyId);
  return getGkrRepository().listProducts(workspaceId, companyId);
}

export function getProductTimeline(workspaceId: string, companyId: string, productId: string): RevenueTimelineEvent[] {
  return getGkrRepository().listTimeline(workspaceId, companyId, productId);
}
