import { randomUUID } from "node:crypto";

import { getGovernanceEngine } from "../../../foundation/empire-governance/services/governance-engine.js";
import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import { discoverProductOpportunities } from "../../product-discovery-opportunity-engine/index.js";
import type { ProductOpportunity } from "../../product-discovery-opportunity-engine/models/product-opportunity.js";
import {
  createLaunchWorkflowRecord,
  getEcommerceOsWorkflowRepository,
} from "../repositories/sqlite-ecommerce-os-workflow-repository.js";
import type {
  ApproveLaunchProductsInput,
  LaunchWorkflowRecord,
  ProductRecommendation,
  StartLaunchWorkflowInput,
} from "../models/ecommerce-os-workflow.js";
import { buildGrandKingsDashboard } from "./dashboard-status-service.js";
import { getMarketplacePublishingReadiness } from "../../marketplace-connection-engine/index.js";
import {
  rankRecommendations,
} from "./product-recommendation-service.js";
import { assessLaunchReadiness, prepareLaunchAssets } from "./workflow-preparation-service.js";

export class EcommerceOsWorkflowNotFoundError extends Error {
  constructor(workflowId: string) {
    super(`Launch workflow not found: ${workflowId}`);
    this.name = "EcommerceOsWorkflowNotFoundError";
  }
}

export class EcommerceOsWorkflowBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EcommerceOsWorkflowBlockedError";
  }
}

function saveWorkflow(workflow: LaunchWorkflowRecord): LaunchWorkflowRecord {
  return getEcommerceOsWorkflowRepository().saveWorkflow(workflow);
}

function captureWorkflowSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // Soul runtime capture is best-effort.
  }
}

/** Step 1–2: Grand King chooses brand and category — starts launch workflow. */
export function startGrandKingsLaunchWorkflow(input: StartLaunchWorkflowInput): LaunchWorkflowRecord {
  const workflow = createLaunchWorkflowRecord({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    accountType: input.accountType ?? "grand_king",
    stage: "CATEGORY_CHOSEN",
    brandChoice: input.brandChoice,
    category: input.category,
    recommendations: [],
    approvedProductIds: [],
    assets: {
      offersPrepared: 0,
      listingsPrepared: 0,
      videosPrepared: 0,
      imagesPrepared: 0,
      seoPrepared: false,
      supplierConnectionPrepared: false,
    },
    launchStatus: "NOT_READY",
    readinessBlockers: [],
    actor: input.actor,
    correlationId: input.correlationId ?? `live001-${randomUUID()}`,
    metadata: { mission: "LIVE-001" },
  });

  const saved = saveWorkflow(workflow);
  captureWorkflowSoulRuntime(
    input.workspaceId,
    `Launch workflow started: ${input.brandChoice}`,
    `Category ${input.category} selected for Grand King's Account`,
    input.actor ?? "ecommerce-os-orchestrator",
    { workflowId: saved.workflowId, category: input.category },
  );
  return saved;
}

function opportunityToRecommendation(opportunity: ProductOpportunity): ProductRecommendation {
  return {
    productId: opportunity.product.productId,
    productName: opportunity.product.productName,
    category: opportunity.product.category,
    dominationScore: opportunity.dominationScore,
    expectedRoi: opportunity.expectedRoi,
    margin: opportunity.estimatedMargin,
    supplierConfidence: opportunity.supplierAvailability.confidence,
    shippingConfidence: opportunity.shippingConfidence,
    repeatPurchasePotential: opportunity.repeatPurchasePotential,
    brandingPotential: opportunity.brandingPotential,
    compositeRank: opportunity.rank === 1 ? opportunity.dominationScore : opportunity.dominationScore - opportunity.rank,
    recommendation: opportunity.scoutRecommendation,
    rationale: opportunity.rationale,
    supplierId: opportunity.recommendedSupplier,
  };
}

/** Step 3–4: EA researches opportunities via Product Discovery Engine. */
export function researchLaunchOpportunities(workflowId: string): LaunchWorkflowRecord {
  const repository = getEcommerceOsWorkflowRepository();
  const existing = repository.getWorkflowById(workflowId);
  if (!existing) {
    throw new EcommerceOsWorkflowNotFoundError(workflowId);
  }

  const opportunities = discoverProductOpportunities({
    workspaceId: existing.workspaceId,
    companyId: existing.companyId,
    brand: existing.brandChoice,
    category: existing.category,
    targetMarket: "US",
    existingSupplierNetwork: ["cj-dropshipping"],
    accountType: existing.accountType,
    actor: existing.actor,
    correlationId: existing.correlationId,
  });

  const recommendations = rankRecommendations(
    opportunities.map((opportunity) => opportunityToRecommendation(opportunity)),
  );

  const updated = saveWorkflow({
    ...existing,
    stage: "RECOMMENDATIONS_READY",
    recommendations,
    metadata: {
      ...existing.metadata,
      researchedAt: new Date().toISOString(),
      recommendationCount: String(recommendations.length),
      discoveryEngine: "LIVE-005",
    },
  });

  captureWorkflowSoulRuntime(
    existing.workspaceId,
    "Product opportunities researched",
    `EA ranked ${recommendations.length} products for ${existing.brandChoice}`,
    existing.actor ?? "ecommerce-os-orchestrator",
    { workflowId, topProduct: recommendations[0]?.productId },
  );

  return updated;
}

/** Step 5: Grand King approves products — governance gate applied. */
export function approveLaunchProducts(input: ApproveLaunchProductsInput): LaunchWorkflowRecord {
  const repository = getEcommerceOsWorkflowRepository();
  const existing = repository.getWorkflowById(input.workflowId);
  if (!existing) {
    throw new EcommerceOsWorkflowNotFoundError(input.workflowId);
  }

  const governance = getGovernanceEngine();
  const verdict = governance.evaluateDecision({
    workspaceId: existing.workspaceId,
    domain: "grandKings",
    module: "ecommerce-os-orchestrator",
    action: "approve_products",
    actor: input.actor ?? "founder",
    correlationId: existing.correlationId ?? input.workflowId,
    payload: { productIds: input.productIds },
  });

  if (!verdict.allowed) {
    throw new EcommerceOsWorkflowBlockedError(
      verdict.reason ?? "Governance blocked product approval",
    );
  }

  const validIds = input.productIds.filter((id) =>
    existing.recommendations.some((rec) => rec.productId === id),
  );
  if (validIds.length === 0) {
    throw new EcommerceOsWorkflowBlockedError("No valid product IDs to approve");
  }

  const updated = saveWorkflow({
    ...existing,
    stage: "APPROVED",
    approvedProductIds: validIds,
    metadata: {
      ...existing.metadata,
      approvedAt: new Date().toISOString(),
      approvedBy: input.actor ?? "founder",
    },
  });

  captureWorkflowSoulRuntime(
    existing.workspaceId,
    "Grand King approved products",
    `Approved ${validIds.length} product(s) for launch preparation`,
    input.actor ?? "founder",
    { workflowId: input.workflowId, productIds: validIds },
  );

  return updated;
}

/** Step 6: EA prepares brand assets, listings, creative, SEO, supplier connection. */
export async function prepareGrandKingsLaunch(workflowId: string): Promise<LaunchWorkflowRecord> {
  const repository = getEcommerceOsWorkflowRepository();
  const existing = repository.getWorkflowById(workflowId);
  if (!existing) {
    throw new EcommerceOsWorkflowNotFoundError(workflowId);
  }
  if (existing.approvedProductIds.length === 0) {
    throw new EcommerceOsWorkflowBlockedError("Products must be approved before preparation");
  }

  const preparing = saveWorkflow({ ...existing, stage: "PREPARING_ASSETS" });
  const prepared = await prepareLaunchAssets(preparing);
  const blockers = assessLaunchReadiness(prepared);

  return saveWorkflow({
    ...prepared,
    readinessBlockers: blockers,
    launchStatus: blockers.length === 0 ? "READY_TO_LAUNCH" : "NOT_READY",
  });
}

/** Full Grand King launch workflow: research → await approval path helper. */
export function runGrandKingsResearchPhase(workflowId: string): LaunchWorkflowRecord {
  const repository = getEcommerceOsWorkflowRepository();
  let workflow = repository.getWorkflowById(workflowId);
  if (!workflow) {
    throw new EcommerceOsWorkflowNotFoundError(workflowId);
  }

  if (workflow.stage === "CATEGORY_CHOSEN" || workflow.recommendations.length === 0) {
    workflow = saveWorkflow({ ...workflow, stage: "RESEARCHING" });
    workflow = researchLaunchOpportunities(workflowId);
  }

  return saveWorkflow({ ...workflow, stage: "AWAITING_APPROVAL" });
}

export function getLaunchWorkflow(workflowId: string): LaunchWorkflowRecord | null {
  return getEcommerceOsWorkflowRepository().getWorkflowById(workflowId);
}

export function listLaunchWorkflows(workspaceId: string, companyId?: string): LaunchWorkflowRecord[] {
  return getEcommerceOsWorkflowRepository().listWorkflows(workspaceId, companyId);
}

export function getGrandKingsLaunchDashboard(workspaceId: string, companyId: string) {
  return buildGrandKingsDashboard(workspaceId, companyId);
}

/** Which marketplaces are ready for product publishing? */
export function getMarketplacePublishingReadinessForLaunch(
  workspaceId: string,
  accountType: "GRAND_KING" | "FOUNDER" = "GRAND_KING",
) {
  return getMarketplacePublishingReadiness(workspaceId, accountType);
}

/** Returns READY TO LAUNCH status with blockers if any. */
export function getLaunchReadiness(workflowId: string) {
  const workflow = getLaunchWorkflow(workflowId);
  if (!workflow) {
    throw new EcommerceOsWorkflowNotFoundError(workflowId);
  }
  const blockers = assessLaunchReadiness(workflow);
  return {
    workflowId,
    launchStatus: blockers.length === 0 ? "READY_TO_LAUNCH" : "NOT_READY",
    blockers,
    assets: workflow.assets,
    stage: workflow.stage,
  };
}
