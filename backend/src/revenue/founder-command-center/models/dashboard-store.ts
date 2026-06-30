import { z } from "zod";

/** Store row displayed on the founder command center dashboard. */
export type DashboardStoreItem = {
  storeId: string;
  brandId: string;
  pageCount: number;
  confidence: number;
  status: "BLUEPRINT" | "ASSEMBLED" | "DEPLOYED";
};

/** Aggregated stores section for the founder dashboard. */
export type DashboardStoreSection = {
  totalCount: number;
  deployedCount: number;
  healthScore: number;
  summary: string;
  items: DashboardStoreItem[];
};

export const dashboardStoreItemSchema = z.object({
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  pageCount: z.number().int().min(0),
  confidence: z.number().min(0).max(100),
  status: z.enum(["BLUEPRINT", "ASSEMBLED", "DEPLOYED"]),
});

export const dashboardStoreSectionSchema = z.object({
  totalCount: z.number().int().min(0),
  deployedCount: z.number().int().min(0),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardStoreItemSchema),
});

/** Validates a DashboardStoreSection record shape. */
export function validateDashboardStoreSection(value: unknown): DashboardStoreSection {
  return dashboardStoreSectionSchema.parse(value);
}
