import { z } from "zod";

export const LIFECYCLE_PHASES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ACTIVE",
  "BLOCKED",
  "COMPLETE",
] as const;

export type LifecyclePhase = (typeof LIFECYCLE_PHASES)[number];

export type RevenueLifecycleSnapshot = {
  phase: LifecyclePhase;
  storeCount: number;
  deployedStoreCount: number;
  publishedCatalogCount: number;
  publishedProductCount: number;
  paymentCount: number;
  succeededPaymentCount: number;
  totalRevenueCents: number;
  ledgerRevenueCents: number;
  currency: string;
  blockers: string[];
  healthScore: number;
};

export type AdvertisingLifecycleSnapshot = {
  phase: LifecyclePhase;
  metaOAuthConnected: boolean;
  campaignCount: number;
  pendingApprovalCount: number;
  activeCampaignCount: number;
  adSpendCents: number;
  roas: number;
  conversionCount: number;
  currency: string;
  blockers: string[];
  healthScore: number;
};

export type OrderLifecycleSnapshot = {
  phase: LifecyclePhase;
  pipelineCount: number;
  awaitingApprovalCount: number;
  inFulfillmentCount: number;
  inTransitCount: number;
  deliveredCount: number;
  fulfillmentJobCount: number;
  pendingFulfillmentApprovalCount: number;
  blockers: string[];
  healthScore: number;
};

export type CapitalLifecycleSnapshot = {
  phase: LifecyclePhase;
  availableCashCents: number;
  reservedCashCents: number;
  withdrawableCashCents: number;
  advertisingWalletCents: number;
  advertisingWalletLow: boolean;
  netProfitCents: number;
  pendingAdvertisingCents: number;
  currency: string;
  blockers: string[];
  healthScore: number;
};

export type KpiLifecycleSnapshot = {
  totalRevenueCents: number;
  adSpendCents: number;
  roas: number;
  averageOrderValueCents: number;
  orderCompletionRate: number;
  storeActivationRate: number;
  overallHealthScore: number;
  currency: string;
  computedAt: string;
};

/** Full operational cycle for Grand King's Account. */
export type GrandKingsRevenueCycleRecord = {
  cycleId: string;
  workspaceId: string;
  companyId: string;
  correlationId: string;
  revenue: RevenueLifecycleSnapshot;
  advertising: AdvertisingLifecycleSnapshot;
  order: OrderLifecycleSnapshot;
  capital: CapitalLifecycleSnapshot;
  kpi: KpiLifecycleSnapshot;
  overallHealthScore: number;
  mock: boolean;
  createdAt: string;
};

export const revenueLifecycleSnapshotSchema = z.object({
  phase: z.enum(LIFECYCLE_PHASES),
  storeCount: z.number().int().min(0),
  deployedStoreCount: z.number().int().min(0),
  publishedCatalogCount: z.number().int().min(0),
  publishedProductCount: z.number().int().min(0),
  paymentCount: z.number().int().min(0),
  succeededPaymentCount: z.number().int().min(0),
  totalRevenueCents: z.number().int().min(0),
  ledgerRevenueCents: z.number().int().min(0),
  currency: z.string().length(3),
  blockers: z.array(z.string()),
  healthScore: z.number().min(0).max(100),
});

export const grandKingsRevenueCycleRecordSchema = z.object({
  cycleId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  correlationId: z.string().min(1),
  revenue: revenueLifecycleSnapshotSchema,
  advertising: z.object({
    phase: z.enum(LIFECYCLE_PHASES),
    metaOAuthConnected: z.boolean(),
    campaignCount: z.number().int().min(0),
    pendingApprovalCount: z.number().int().min(0),
    activeCampaignCount: z.number().int().min(0),
    adSpendCents: z.number().int().min(0),
    roas: z.number().min(0),
    conversionCount: z.number().int().min(0),
    currency: z.string().length(3),
    blockers: z.array(z.string()),
    healthScore: z.number().min(0).max(100),
  }),
  order: z.object({
    phase: z.enum(LIFECYCLE_PHASES),
    pipelineCount: z.number().int().min(0),
    awaitingApprovalCount: z.number().int().min(0),
    inFulfillmentCount: z.number().int().min(0),
    inTransitCount: z.number().int().min(0),
    deliveredCount: z.number().int().min(0),
    fulfillmentJobCount: z.number().int().min(0),
    pendingFulfillmentApprovalCount: z.number().int().min(0),
    blockers: z.array(z.string()),
    healthScore: z.number().min(0).max(100),
  }),
  capital: z.object({
    phase: z.enum(LIFECYCLE_PHASES),
    availableCashCents: z.number().int(),
    reservedCashCents: z.number().int().min(0),
    withdrawableCashCents: z.number().int().min(0),
    advertisingWalletCents: z.number().int().min(0),
    advertisingWalletLow: z.boolean(),
    netProfitCents: z.number().int(),
    pendingAdvertisingCents: z.number().int().min(0),
    currency: z.string().length(3),
    blockers: z.array(z.string()),
    healthScore: z.number().min(0).max(100),
  }),
  kpi: z.object({
    totalRevenueCents: z.number().int().min(0),
    adSpendCents: z.number().int().min(0),
    roas: z.number().min(0),
    averageOrderValueCents: z.number().int().min(0),
    orderCompletionRate: z.number().min(0).max(1),
    storeActivationRate: z.number().min(0).max(1),
    overallHealthScore: z.number().min(0).max(100),
    currency: z.string().length(3),
    computedAt: z.string().datetime({ offset: true }),
  }),
  overallHealthScore: z.number().min(0).max(100),
  mock: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

export function validateGrandKingsRevenueCycleRecord(
  value: unknown,
): GrandKingsRevenueCycleRecord {
  return grandKingsRevenueCycleRecordSchema.parse(value);
}
