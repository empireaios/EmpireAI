/**
 * G7-02 — Cockpit Grand King commerce operations backend contracts.
 */

import type {
  CommerceOperation,
  CommerceOperationDependencySummary,
  CommerceOperationHealthSummary,
  CommerceOperationsOverview,
} from "./commerce-operations-types.js";
import type { ChannelStatusSummary } from "../services/controllers/channel-status-types.js";

export const COCKPIT_COMMERCE_OPERATIONS_VIEW_ID = "cockpit-grand-king-commerce-operations" as const;

export type CockpitCommerceOperationsView = {
  viewId: typeof COCKPIT_COMMERCE_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  commerceOperations: CommerceOperationsOverview;
  marketplaceStatus: ChannelStatusSummary;
  supplierStatus: ChannelStatusSummary;
  storefrontStatus: ChannelStatusSummary;
  paymentStatus: ChannelStatusSummary;
  logisticsStatus: ChannelStatusSummary;
  analyticsStatus: ChannelStatusSummary;
  dependencies: CommerceOperationDependencySummary;
  executiveSummary: string;
  discoverySource: "grand-king-commerce-operations:cockpit";
};

export function buildCockpitCommerceOperationsView(input: {
  overview: CommerceOperationsOverview;
  operations: CommerceOperation[];
  marketplaceStatus: ChannelStatusSummary;
  supplierStatus: ChannelStatusSummary;
  storefrontStatus: ChannelStatusSummary;
  paymentStatus: ChannelStatusSummary;
  logisticsStatus: ChannelStatusSummary;
  analyticsStatus: ChannelStatusSummary;
  dependencies: CommerceOperationDependencySummary;
  executiveSummary: string;
}): CockpitCommerceOperationsView {
  return {
    viewId: COCKPIT_COMMERCE_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    commerceOperations: input.overview,
    marketplaceStatus: input.marketplaceStatus,
    supplierStatus: input.supplierStatus,
    storefrontStatus: input.storefrontStatus,
    paymentStatus: input.paymentStatus,
    logisticsStatus: input.logisticsStatus,
    analyticsStatus: input.analyticsStatus,
    dependencies: input.dependencies,
    executiveSummary: input.executiveSummary,
    discoverySource: "grand-king-commerce-operations:cockpit",
  };
}
