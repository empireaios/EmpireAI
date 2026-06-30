import {
  computeRoasSnapshot,
  listConversions,
} from "../../../execution/analytics-conversion-engine/services/analytics-conversion-service.js";
import { getAnalyticsConversionRepository } from "../../../execution/analytics-conversion-engine/repositories/sqlite-analytics-conversion-repository.js";
import { listLiveCjFulfillments } from "../../../execution/live-cj-fulfillment/services/live-cj-fulfillment-service.js";
import {
  getMetaAdsOAuthStatus,
  listMetaCampaigns,
} from "../../../execution/meta-ads-connector/services/meta-ads-campaign-service.js";
import { listCatalogPublishes, listPublishedProducts } from "../../../execution/product-publishing-engine/services/product-publishing-service.js";
import { paymentFramework } from "../../../payments/payment-framework.js";
import { listPipelines } from "../../customer-order-pipeline/services/customer-order-pipeline-service.js";
import {
  getRevenueSummary,
  listLivePayments,
} from "../../live-payment-engine/services/live-payment-engine-service.js";
import { getRevenueLoopRepository } from "../../minimum-live-revenue-loop/repositories/sqlite-revenue-loop-repository.js";
import { treasuryEngine } from "../../../treasury/treasury-engine.js";
import type {
  AdvertisingLifecycleSnapshot,
  CapitalLifecycleSnapshot,
  KpiLifecycleSnapshot,
  LifecyclePhase,
  OrderLifecycleSnapshot,
  RevenueLifecycleSnapshot,
} from "../models/grand-kings-revenue-cycle-record.js";

export type LifecycleCollectInput = {
  workspaceId: string;
  companyId: string;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function resolvePhaseFromCounts(input: {
  total: number;
  active: number;
  blocked: number;
  complete: number;
}): LifecyclePhase {
  if (input.total === 0) return "NOT_STARTED";
  if (input.blocked > 0 && input.active === 0) return "BLOCKED";
  if (input.complete === input.total && input.total > 0) return "COMPLETE";
  if (input.active > 0) return "ACTIVE";
  return "IN_PROGRESS";
}

/** Collects revenue lifecycle snapshot from live store and payment modules. */
export function collectRevenueLifecycle(input: LifecycleCollectInput): RevenueLifecycleSnapshot {
  const stores = getRevenueLoopRepository()
    .listStores(input.workspaceId)
    .filter((store) => store.companyId === input.companyId);
  const deployedStoreCount = stores.filter(
    (store) => store.status === "DEPLOYED" || store.status === "CHECKOUT_ENABLED",
  ).length;

  const catalogs = listCatalogPublishes(input.workspaceId, input.companyId);
  const publishedCatalogCount = catalogs.filter(
    (catalog) =>
      catalog.status === "PUBLISHED" || catalog.status === "SYNCED" || catalog.status === "PARTIAL",
  ).length;
  const publishedProductCount = stores.reduce(
    (sum, store) => sum + listPublishedProducts(store.storeId).length,
    0,
  );

  const payments = listLivePayments(input.workspaceId, input.companyId);
  const summary = getRevenueSummary(input.workspaceId, input.companyId);

  const blockers: string[] = [];
  if (stores.length === 0) blockers.push("No live stores deployed");
  if (deployedStoreCount === 0) blockers.push("No checkout-enabled storefronts");
  if (summary.succeededPayments === 0) blockers.push("No succeeded payments recorded");

  const phase = resolvePhaseFromCounts({
    total: Math.max(stores.length, 1),
    active: deployedStoreCount,
    blocked: blockers.length > 0 && summary.succeededPayments === 0 ? 1 : 0,
    complete: summary.succeededPayments > 0 ? 1 : 0,
  });

  const healthScore = clampScore(
    (deployedStoreCount > 0 ? 30 : 0) +
      (publishedCatalogCount > 0 ? 20 : 0) +
      (summary.succeededPayments > 0 ? 35 : 0) +
      (summary.ledgerRevenueCents > 0 ? 15 : 0),
  );

  return {
    phase,
    storeCount: stores.length,
    deployedStoreCount,
    publishedCatalogCount,
    publishedProductCount,
    paymentCount: payments.length,
    succeededPaymentCount: summary.succeededPayments,
    totalRevenueCents: summary.totalRevenueCents,
    ledgerRevenueCents: summary.ledgerRevenueCents,
    currency: summary.currency,
    blockers,
    healthScore,
  };
}

/** Collects advertising lifecycle snapshot from Meta Ads and analytics modules. */
export function collectAdvertisingLifecycle(
  input: LifecycleCollectInput,
): AdvertisingLifecycleSnapshot {
  const oauth = getMetaAdsOAuthStatus(input.workspaceId, input.companyId);
  const campaigns = listMetaCampaigns(input.workspaceId, input.companyId);
  const pendingApprovalCount = campaigns.filter(
    (campaign) => campaign.status === "PENDING_APPROVAL",
  ).length;
  const activeCampaignCount = campaigns.filter(
    (campaign) => campaign.status === "ACTIVE" || campaign.status === "PAUSED",
  ).length;

  const roasSnapshot = computeRoasSnapshot({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
  });
  const conversions = listConversions(input.workspaceId, input.companyId);
  const adSpendCents = getAnalyticsConversionRepository().sumAdSpend(
    input.workspaceId,
    input.companyId,
  );

  const blockers: string[] = [];
  if (!oauth) blockers.push("Meta Ads OAuth not connected");
  if (campaigns.length === 0) blockers.push("No Meta campaigns prepared");
  if (pendingApprovalCount > 0) {
    blockers.push(`${pendingApprovalCount} campaign(s) awaiting founder approval`);
  }

  const phase = resolvePhaseFromCounts({
    total: Math.max(campaigns.length, 1),
    active: activeCampaignCount,
    blocked: pendingApprovalCount,
    complete: activeCampaignCount > 0 && adSpendCents > 0 ? activeCampaignCount : 0,
  });

  const healthScore = clampScore(
    (oauth ? 25 : 0) + (campaigns.length > 0 ? 20 : 0) + (activeCampaignCount > 0 ? 30 : 0) +
      (roasSnapshot.roas > 0 ? 25 : 0),
  );

  return {
    phase,
    metaOAuthConnected: Boolean(oauth),
    campaignCount: campaigns.length,
    pendingApprovalCount,
    activeCampaignCount,
    adSpendCents,
    roas: roasSnapshot.roas,
    conversionCount: conversions.length,
    currency: roasSnapshot.currency,
    blockers,
    healthScore,
  };
}

/** Collects order lifecycle snapshot from customer order and CJ fulfillment modules. */
export function collectOrderLifecycle(input: LifecycleCollectInput): OrderLifecycleSnapshot {
  const pipelines = listPipelines(input.workspaceId, input.companyId);
  const fulfillments = listLiveCjFulfillments(input.workspaceId, input.companyId);

  const awaitingApprovalCount = pipelines.filter(
    (pipeline) => pipeline.status === "AWAITING_FULFILLMENT_APPROVAL",
  ).length;
  const inFulfillmentCount = pipelines.filter((pipeline) =>
    ["FULFILLMENT_REQUESTED", "FULFILLMENT_APPROVED", "INVENTORY_RESERVED"].includes(
      pipeline.status,
    ),
  ).length;
  const inTransitCount = pipelines.filter((pipeline) => pipeline.status === "IN_TRANSIT").length;
  const deliveredCount = pipelines.filter((pipeline) => pipeline.status === "DELIVERED").length;
  const pendingFulfillmentApprovalCount = fulfillments.filter(
    (job) => job.status === "PENDING_FOUNDER_APPROVAL",
  ).length;

  const blockers: string[] = [];
  if (pipelines.length === 0) blockers.push("No customer order pipelines");
  if (awaitingApprovalCount > 0) {
    blockers.push(`${awaitingApprovalCount} order(s) awaiting fulfillment approval`);
  }
  if (pendingFulfillmentApprovalCount > 0) {
    blockers.push(`${pendingFulfillmentApprovalCount} CJ fulfillment(s) awaiting founder approval`);
  }

  const phase = resolvePhaseFromCounts({
    total: Math.max(pipelines.length, 1),
    active: inFulfillmentCount + inTransitCount,
    blocked: awaitingApprovalCount + pendingFulfillmentApprovalCount,
    complete: deliveredCount,
  });

  const healthScore = clampScore(
    (pipelines.length > 0 ? 25 : 0) +
      (inFulfillmentCount + inTransitCount > 0 ? 30 : 0) +
      (deliveredCount > 0 ? 35 : 0) +
      (blockers.length === 0 && pipelines.length > 0 ? 10 : 0),
  );

  return {
    phase,
    pipelineCount: pipelines.length,
    awaitingApprovalCount,
    inFulfillmentCount,
    inTransitCount,
    deliveredCount,
    fulfillmentJobCount: fulfillments.length,
    pendingFulfillmentApprovalCount,
    blockers,
    healthScore,
  };
}

/** Collects capital lifecycle snapshot from treasury and payment wallets. */
export function collectCapitalLifecycle(input: LifecycleCollectInput): CapitalLifecycleSnapshot {
  const treasury = treasuryEngine.compute(input.workspaceId);
  const adWallet = paymentFramework.ensureWallet(input.workspaceId, "advertising");
  const advertisingWalletLow =
    adWallet.balanceCents <= adWallet.lowBalanceThresholdCents;

  const blockers: string[] = [];
  if (advertisingWalletLow) blockers.push("Advertising wallet below low-balance threshold");
  if (treasury.netProfitCents <= 0) blockers.push("Net profit not yet positive");
  if (treasury.buckets.withdrawable_cash <= 0) {
    blockers.push("No withdrawable cash available");
  }

  const phase: LifecyclePhase =
    treasury.netProfitCents > 0
      ? "ACTIVE"
      : treasury.buckets.available_cash > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED";

  const healthScore = clampScore(
    (treasury.buckets.available_cash > 0 ? 30 : 0) +
      (treasury.netProfitCents > 0 ? 35 : 0) +
      (!advertisingWalletLow ? 20 : 0) +
      (treasury.buckets.withdrawable_cash > 0 ? 15 : 0),
  );

  return {
    phase,
    availableCashCents: treasury.buckets.available_cash,
    reservedCashCents: treasury.buckets.reserved_cash,
    withdrawableCashCents: treasury.buckets.withdrawable_cash,
    advertisingWalletCents: adWallet.balanceCents,
    advertisingWalletLow,
    netProfitCents: treasury.netProfitCents,
    pendingAdvertisingCents: treasury.pendingAdvertisingCents,
    currency: treasury.currency,
    blockers,
    healthScore,
  };
}

/** Computes KPI snapshot from collected lifecycle states. */
export function computeKpiLifecycle(input: {
  revenue: RevenueLifecycleSnapshot;
  advertising: AdvertisingLifecycleSnapshot;
  order: OrderLifecycleSnapshot;
  capital: CapitalLifecycleSnapshot;
}): KpiLifecycleSnapshot {
  const averageOrderValueCents =
    input.revenue.succeededPaymentCount > 0
      ? Math.round(input.revenue.totalRevenueCents / input.revenue.succeededPaymentCount)
      : 0;

  const orderCompletionRate =
    input.order.pipelineCount > 0
      ? Number((input.order.deliveredCount / input.order.pipelineCount).toFixed(4))
      : 0;

  const storeActivationRate =
    input.revenue.storeCount > 0
      ? Number((input.revenue.deployedStoreCount / input.revenue.storeCount).toFixed(4))
      : 0;

  const overallHealthScore = clampScore(
    input.revenue.healthScore * 0.3 +
      input.advertising.healthScore * 0.2 +
      input.order.healthScore * 0.25 +
      input.capital.healthScore * 0.25,
  );

  return {
    totalRevenueCents: input.revenue.totalRevenueCents,
    adSpendCents: input.advertising.adSpendCents,
    roas: input.advertising.roas,
    averageOrderValueCents,
    orderCompletionRate,
    storeActivationRate,
    overallHealthScore,
    currency: input.revenue.currency,
    computedAt: new Date().toISOString(),
  };
}
