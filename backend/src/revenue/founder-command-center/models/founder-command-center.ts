import { z } from "zod";

import {
  dashboardBrandSectionSchema,
  type DashboardBrandSection,
} from "./dashboard-brand.js";
import {
  dashboardCampaignSectionSchema,
  type DashboardCampaignSection,
} from "./dashboard-campaign.js";
import {
  dashboardCapitalSectionSchema,
  type DashboardCapitalSection,
} from "./dashboard-capital.js";
import {
  dashboardDeploymentSectionSchema,
  type DashboardDeploymentSection,
} from "./dashboard-deployment.js";
import {
  dashboardOpportunitySectionSchema,
  type DashboardOpportunitySection,
} from "./dashboard-opportunity.js";
import {
  dashboardRevenueSectionSchema,
  type DashboardRevenueSection,
} from "./dashboard-revenue.js";
import {
  dashboardStoreSectionSchema,
  type DashboardStoreSection,
} from "./dashboard-store.js";
import {
  dashboardSupplierSectionSchema,
  type DashboardSupplierSection,
} from "./dashboard-supplier.js";
import {
  founderCommandSignalSchema,
  type FounderCommandSignal,
} from "./founder-command-signal.js";

export type FounderCommandCenterId = string;

/** Grand King's master dashboard synthesizing all company operations. */
export type FounderCommandCenter = {
  dashboardId: FounderCommandCenterId;
  opportunities: DashboardOpportunitySection;
  brands: DashboardBrandSection;
  stores: DashboardStoreSection;
  suppliers: DashboardSupplierSection;
  campaigns: DashboardCampaignSection;
  capitalAllocation: DashboardCapitalSection;
  revenueTracking: DashboardRevenueSection;
  deploymentStatus: DashboardDeploymentSection;
  confidence: number;
  signals: FounderCommandSignal[];
};

export type FounderCommandCenterCreateInput = Omit<FounderCommandCenter, "dashboardId">;

export const founderCommandCenterSchema = z.object({
  dashboardId: z.string().min(1),
  opportunities: dashboardOpportunitySectionSchema,
  brands: dashboardBrandSectionSchema,
  stores: dashboardStoreSectionSchema,
  suppliers: dashboardSupplierSectionSchema,
  campaigns: dashboardCampaignSectionSchema,
  capitalAllocation: dashboardCapitalSectionSchema,
  revenueTracking: dashboardRevenueSectionSchema,
  deploymentStatus: dashboardDeploymentSectionSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(founderCommandSignalSchema),
});

/** Validates a FounderCommandCenter record shape. */
export function validateFounderCommandCenter(value: unknown): FounderCommandCenter {
  return founderCommandCenterSchema.parse(value);
}
