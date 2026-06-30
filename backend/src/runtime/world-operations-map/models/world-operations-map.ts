import { z } from "zod";

export const worldOperationsProductSchema = z.object({
  productId: z.string(),
  title: z.string(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  executiveStatus: z.string(),
  lifecycle: z.string(),
});

export const worldOperationsMarketplaceSchema = z.object({
  marketplaceId: z.string(),
  marketplaceName: z.string(),
  countryCode: z.string(),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  executiveStatus: z.string(),
  products: z.array(worldOperationsProductSchema),
});

export const worldOperationsCountrySchema = z.object({
  countryCode: z.string(),
  countryName: z.string(),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  executiveStatus: z.string(),
  marketplaces: z.array(worldOperationsMarketplaceSchema),
});

export const worldOperationsMapSchema = z.object({
  moduleId: z.literal("world-operations-map"),
  missionId: z.literal("REAL-052"),
  workspaceId: z.string(),
  companyId: z.string(),
  world: z.object({
    totalRevenueUsd: z.number(),
    totalProfitUsd: z.number(),
    countries: z.array(worldOperationsCountrySchema),
  }),
  reusedModules: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type WorldOperationsMap = z.infer<typeof worldOperationsMapSchema>;
