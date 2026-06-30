import { getGovernanceEngine, initializeGovernancePolicies } from "../../../foundation/empire-governance/services/governance-engine.js";
import { listPolicies, initializePolicies } from "../../../foundation/policy-engine/services/policy-engine-service.js";
import { getInfrastructureConnectionStatus } from "../../marketplace-infrastructure-engine/index.js";
import { getAccountReadiness, listHumanActionQueue } from "../../account-infrastructure-engine/index.js";
import { getMarketplacePublishingReadiness } from "../../marketplace-connection-engine/index.js";
import { getEcommerceOsWorkflowRepository } from "../../ecommerce-os-orchestrator/repositories/sqlite-ecommerce-os-workflow-repository.js";
import type { LaunchWorkflowRecord } from "../../ecommerce-os-orchestrator/models/ecommerce-os-workflow.js";
import { treasuryEngine } from "../../../treasury/treasury-engine.js";
import type {
  CommerceReadinessEvaluation,
  IndividualReadiness,
  LaunchDecision,
  ReadinessBlocker,
} from "../models/commerce-readiness.js";
import { createReadinessBlocker } from "../models/commerce-readiness.js";

export type EvaluateCommerceReadinessInput = {
  workspaceId: string;
  companyId: string;
  accountType?: "grand_king" | "founder";
};

function scoreInfrastructureStatus(status: string): number {
  switch (status) {
    case "CONNECTED":
      return 100;
    case "CONNECTING":
      return 45;
    case "ERROR":
    case "EXPIRED":
      return 10;
    default:
      return 0;
  }
}

function averageScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function deriveLaunchDecision(blockers: ReadinessBlocker[]): LaunchDecision {
  if (blockers.some((blocker) => blocker.severity === "BLOCKING")) {
    return "NOT_READY";
  }
  if (blockers.some((blocker) => blocker.severity === "WARNING")) {
    return "READY_WITH_WARNINGS";
  }
  return "READY_TO_LAUNCH";
}

function deriveRecommendedNextAction(blockers: ReadinessBlocker[]): string {
  const blocking = blockers.find((blocker) => blocker.severity === "BLOCKING");
  if (blocking?.recommendedAction) return blocking.recommendedAction;
  if (blocking) return blocking.title;

  const warning = blockers.find((blocker) => blocker.severity === "WARNING");
  if (warning?.recommendedAction) return warning.recommendedAction;
  if (warning) return warning.title;

  return "All readiness checks passed — Commerce Execution Layer may proceed when approved.";
}

function evaluateAccounts(workspaceId: string, accountType: "grand_king" | "founder", blockers: ReadinessBlocker[]): number {
  const summary = getAccountReadiness(workspaceId, accountType);

  for (const line of summary.lines) {
    if (line.label === "ERROR") {
      blockers.push(createReadinessBlocker({
        id: `account:${line.providerId}:error`,
        severity: "BLOCKING",
        category: "accounts",
        title: `${line.displayName} account error`,
        description: `${line.displayName} is in an error state and must be resolved.`,
        recommendedAction: `Resolve ${line.displayName} connection in Account Infrastructure.`,
      }));
    } else if (line.label === "ACTION_REQUIRED" && line.providerId === "stripe") {
      blockers.push(createReadinessBlocker({
        id: "account:stripe:action",
        severity: "BLOCKING",
        category: "accounts",
        title: "Stripe setup incomplete",
        description: "Payment account requires human action before launch.",
        recommendedAction: "Complete Stripe OAuth and business verification.",
      }));
    }
  }

  const humanActions = listHumanActionQueue(workspaceId);
  for (const action of humanActions) {
    if (action.actionType === "tax_verification" && action.status === "PENDING") {
      blockers.push(createReadinessBlocker({
        id: `human:${action.actionId}`,
        severity: "WARNING",
        category: "accounts",
        title: "Missing tax verification",
        description: action.description,
        recommendedAction: "Complete tax verification in the external provider dashboard.",
      }));
    }
  }

  return summary.overallReadinessPercent;
}

function evaluateMarketplaces(
  workspaceId: string,
  blockers: ReadinessBlocker[],
): { score: number; readyMarketplaces: string[] } {
  const readiness = getMarketplacePublishingReadiness(
    workspaceId,
    "GRAND_KING",
  );

  for (const blocked of readiness.blockedMarketplaces) {
    blockers.push(createReadinessBlocker({
      id: `marketplace:${blocked.marketplaceId}:blocked`,
      severity: "WARNING",
      category: "marketplaces",
      title: `${blocked.displayName} blocked`,
      description: blocked.reason,
      recommendedAction: `Resolve ${blocked.displayName} connection status.`,
    }));
  }

  for (const actionRequired of readiness.actionRequiredMarketplaces) {
    if (actionRequired.pendingHumanActions > 0) {
      blockers.push(createReadinessBlocker({
        id: `marketplace:${actionRequired.marketplaceId}:human`,
        severity: "WARNING",
        category: "marketplaces",
        title: `${actionRequired.displayName} requires human setup`,
        description: `${actionRequired.pendingHumanActions} human action(s) pending.`,
        recommendedAction: `Complete human setup steps for ${actionRequired.displayName}.`,
      }));
    }
  }

  if (readiness.readyMarketplaces.length === 0) {
    blockers.push(createReadinessBlocker({
      id: "marketplace:none-ready",
      severity: "BLOCKING",
      category: "marketplaces",
      title: "No marketplaces ready for publishing",
      description: "At least one marketplace must be connected and verified before launch.",
      recommendedAction: "Connect and verify a primary marketplace such as Amazon or Shopify.",
    }));
  } else if (!readiness.readyMarketplaces.includes("amazon")) {
    blockers.push(createReadinessBlocker({
      id: "marketplace:amazon-not-connected",
      severity: "WARNING",
      category: "marketplaces",
      title: "Amazon not connected",
      description: "Amazon Seller is not ready — Grand King may prefer Amazon as primary channel.",
      recommendedAction: "Complete Amazon Seller connection and SP-API authorization.",
    }));
  }

  return {
    score: readiness.overallMarketplaceReadiness,
    readyMarketplaces: readiness.readyMarketplaces,
  };
}

function evaluateSuppliers(workspaceId: string, workflow: LaunchWorkflowRecord | null, blockers: ReadinessBlocker[]): number {
  const cjStatus = getInfrastructureConnectionStatus(workspaceId, "cj-dropshipping");
  let score = scoreInfrastructureStatus(cjStatus);

  if (workflow?.assets.supplierConnectionPrepared) {
    score = Math.max(score, 100);
  }

  if (cjStatus !== "CONNECTED") {
    blockers.push(createReadinessBlocker({
      id: "supplier:cj-not-connected",
      severity: "BLOCKING",
      category: "suppliers",
      title: "Supplier unavailable",
      description: "CJ Dropshipping is not connected — supplier catalog cannot be fulfilled.",
      recommendedAction: "Connect CJ Dropshipping via Account Infrastructure.",
    }));
  } else if (!workflow?.assets.supplierConnectionPrepared) {
    blockers.push(createReadinessBlocker({
      id: "supplier:not-prepared",
      severity: "WARNING",
      category: "suppliers",
      title: "Supplier connection not prepared",
      description: "CJ is connected but launch workflow has not prepared supplier sync.",
      recommendedAction: "Run launch preparation to sync supplier catalog.",
    }));
  }

  return score;
}

function evaluatePayment(workspaceId: string, blockers: ReadinessBlocker[]): number {
  const stripeStatus = getInfrastructureConnectionStatus(workspaceId, "stripe");
  const score = scoreInfrastructureStatus(stripeStatus);

  if (stripeStatus !== "CONNECTED") {
    blockers.push(createReadinessBlocker({
      id: "payment:stripe-missing",
      severity: "BLOCKING",
      category: "payment",
      title: "Stripe missing",
      description: "Live payment processing is not connected.",
      recommendedAction: "Complete Stripe OAuth and enable live payments.",
    }));
  }

  return score;
}

function evaluateBrands(
  workflow: LaunchWorkflowRecord | null,
  blockers: ReadinessBlocker[],
): { score: number; readyBrands: string[] } {
  if (workflow?.assets.brandId && workflow.assets.brandName) {
    return { score: 100, readyBrands: [workflow.assets.brandName] };
  }

  if (workflow?.brandChoice) {
    blockers.push(createReadinessBlocker({
      id: "brand:incomplete",
      severity: "WARNING",
      category: "brands",
      title: "Brand incomplete",
      description: `Brand "${workflow.brandChoice}" selected but assets not prepared.`,
      recommendedAction: "Run launch preparation to generate brand assets.",
    }));
    return { score: 40, readyBrands: [] };
  }

  blockers.push(createReadinessBlocker({
    id: "brand:not-started",
    severity: "WARNING",
    category: "brands",
    title: "No brand selected",
    description: "Launch workflow has not chosen a brand yet.",
    recommendedAction: "Start a launch workflow and choose a brand.",
  }));
  return { score: 0, readyBrands: [] };
}

function evaluateProducts(
  workflow: LaunchWorkflowRecord | null,
  blockers: ReadinessBlocker[],
): { score: number; readyProducts: string[] } {
  if (!workflow) {
    blockers.push(createReadinessBlocker({
      id: "products:no-workflow",
      severity: "WARNING",
      category: "products",
      title: "No launch workflow",
      description: "Product readiness cannot be assessed without an active launch workflow.",
      recommendedAction: "Start Grand King launch workflow and approve products.",
    }));
    return { score: 0, readyProducts: [] };
  }

  const approved = workflow.recommendations.filter((rec) =>
    workflow.approvedProductIds.includes(rec.productId),
  );
  const readyProducts = approved
    .filter(() => (workflow.assets.listingsPrepared ?? 0) > 0)
    .map((rec) => rec.productName);

  if (readyProducts.length > 0) {
    return { score: 100, readyProducts };
  }

  if (approved.length > 0) {
    blockers.push(createReadinessBlocker({
      id: "products:not-prepared",
      severity: "WARNING",
      category: "products",
      title: "Products approved but not prepared",
      description: "Grand King approved products but listings are not prepared.",
      recommendedAction: "Run launch preparation to prepare product listings.",
    }));
    return { score: 55, readyProducts: approved.map((rec) => rec.productName) };
  }

  if (workflow.recommendations.length > 0) {
    blockers.push(createReadinessBlocker({
      id: "products:missing-approval",
      severity: "BLOCKING",
      category: "products",
      title: "Missing approval",
      description: "Product recommendations exist but Grand King has not approved any.",
      recommendedAction: "Review and approve ranked product recommendations.",
    }));
    return { score: 25, readyProducts: [] };
  }

  blockers.push(createReadinessBlocker({
    id: "products:no-recommendations",
    severity: "WARNING",
    category: "products",
    title: "No product recommendations",
    description: "Launch workflow has not completed product research.",
    recommendedAction: "Run research phase to generate product recommendations.",
  }));
  return { score: 0, readyProducts: [] };
}

function evaluateFulfillment(workspaceId: string, workflow: LaunchWorkflowRecord | null, blockers: ReadinessBlocker[]): number {
  const cjStatus = getInfrastructureConnectionStatus(workspaceId, "cj-dropshipping");
  const connected = cjStatus === "CONNECTED";
  const prepared = Boolean(workflow?.assets.supplierConnectionPrepared);

  if (connected && prepared) return 100;
  if (connected) return 60;

  blockers.push(createReadinessBlocker({
    id: "fulfillment:not-ready",
    severity: "BLOCKING",
    category: "fulfillment",
    title: "Fulfillment not ready",
    description: "CJ Dropshipping fulfillment path is not connected.",
    recommendedAction: "Connect CJ Dropshipping and prepare supplier fulfillment.",
  }));
  return 0;
}

function evaluateGovernance(workspaceId: string, companyId: string, blockers: ReadinessBlocker[]): number {
  initializeGovernancePolicies(workspaceId);
  initializePolicies(workspaceId);

  const verdict = getGovernanceEngine().evaluateDecision(
    {
      workspaceId,
      domain: "grandKings",
      module: "ecommerce-os-orchestrator",
      action: "launch",
      companyId,
      actorRole: "founder",
      payload: { evaluationOnly: true },
    },
    { record: false, actor: "commerce-readiness-engine" },
  );

  if (!verdict.allowed) {
    blockers.push(createReadinessBlocker({
      id: "governance:denied",
      severity: "BLOCKING",
      category: "governance",
      title: "Governance blocked launch",
      description: verdict.reason,
      recommendedAction: "Resolve governance policy requirements before launch.",
      metadata: { code: verdict.code, policyId: verdict.policyId ?? "" },
    }));
    return 0;
  }

  if (verdict.requiresApproval) {
    blockers.push(createReadinessBlocker({
      id: "governance:approval-required",
      severity: "WARNING",
      category: "governance",
      title: "Missing approval",
      description: verdict.reason,
      recommendedAction: "Obtain required founder or Grand King approval.",
      metadata: { approvalType: verdict.approvalType ?? "" },
    }));
    return 70;
  }

  const policies = listPolicies(workspaceId, "ACTIVE");
  if (policies.length === 0) {
    blockers.push(createReadinessBlocker({
      id: "policy:not-initialized",
      severity: "WARNING",
      category: "governance",
      title: "Policy compliance incomplete",
      description: "Business policies are not initialized for this workspace.",
      recommendedAction: "Initialize business policies via Policy Engine.",
    }));
    return 75;
  }

  return 100;
}

function evaluateTreasury(workspaceId: string, blockers: ReadinessBlocker[]): number {
  const snapshot = treasuryEngine.compute(workspaceId);
  const available = snapshot.buckets.available_cash;

  if (available < 0) {
    blockers.push(createReadinessBlocker({
      id: "treasury:negative-cash",
      severity: "WARNING",
      category: "treasury",
      title: "Treasury cash negative",
      description: "Available cash is negative — review ledger before launch spend.",
      recommendedAction: "Review financial ledger and treasury buckets with AI CFO.",
    }));
    return 30;
  }

  if (available === 0 && snapshot.buckets.withdrawable_cash === 0) {
    blockers.push(createReadinessBlocker({
      id: "treasury:zero-balance",
      severity: "INFO",
      category: "treasury",
      title: "Treasury at zero balance",
      description: "No cash on hand yet — acceptable for pre-launch evaluation.",
      recommendedAction: "Monitor treasury as revenue begins.",
    }));
    return 50;
  }

  return Math.min(100, 60 + Math.round(Math.min(available, 100_000) / 100_000 * 40));
}

/** Commerce Readiness Engine — evaluation only, no publishing. */
export function evaluateCommerceReadiness(input: EvaluateCommerceReadinessInput): CommerceReadinessEvaluation {
  const accountType = input.accountType ?? "grand_king";
  const blockers: ReadinessBlocker[] = [];
  const workflow =
    getEcommerceOsWorkflowRepository().listWorkflows(input.workspaceId, input.companyId)[0] ?? null;

  const accounts = evaluateAccounts(input.workspaceId, accountType, blockers);
  const marketplaceResult = evaluateMarketplaces(input.workspaceId, blockers);
  const suppliers = evaluateSuppliers(input.workspaceId, workflow, blockers);
  const payment = evaluatePayment(input.workspaceId, blockers);
  const brandResult = evaluateBrands(workflow, blockers);
  const productResult = evaluateProducts(workflow, blockers);
  const fulfillment = evaluateFulfillment(input.workspaceId, workflow, blockers);
  const governance = evaluateGovernance(input.workspaceId, input.companyId, blockers);
  const treasury = evaluateTreasury(input.workspaceId, blockers);

  const individualReadiness: IndividualReadiness = {
    accounts,
    marketplaces: marketplaceResult.score,
    suppliers,
    products: productResult.score,
    brands: brandResult.score,
    fulfillment,
    payment,
    governance,
    treasury,
  };

  const overallReadinessScore = averageScores(Object.values(individualReadiness));
  const launchDecision = deriveLaunchDecision(blockers);
  const recommendedNextAction = deriveRecommendedNextAction(blockers);

  return {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    accountType,
    overallReadinessScore,
    individualReadiness,
    blockers,
    launchDecision,
    recommendedNextAction,
    readyMarketplaces: marketplaceResult.readyMarketplaces,
    readyProducts: productResult.readyProducts,
    readyBrands: brandResult.readyBrands,
    computedAt: new Date().toISOString(),
  };
}
