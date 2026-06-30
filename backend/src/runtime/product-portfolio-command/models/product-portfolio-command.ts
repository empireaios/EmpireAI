import { z } from "zod";

export const portfolioProductSchema = z.object({
  productId: z.string(),
  title: z.string(),
  lifecycle: z.string(),
  profitUsd: z.number(),
  executiveRecommendation: z.string(),
});

export const portfolioGroupSchema = z.object({
  groupKey: z.string(),
  country: z.string().optional(),
  marketplace: z.string().optional(),
  supplier: z.string().optional(),
  category: z.string().optional(),
  productCount: z.number(),
  totalProfitUsd: z.number(),
  products: z.array(portfolioProductSchema),
});

export const productPortfolioCommandSchema = z.object({
  moduleId: z.literal("product-portfolio-command"),
  missionId: z.literal("REAL-054"),
  workspaceId: z.string(),
  companyId: z.string(),
  groups: z.array(portfolioGroupSchema),
  summary: z.object({
    totalProducts: z.number(),
    liveProducts: z.number(),
    totalProfitUsd: z.number(),
  }),
  reusedModules: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type ProductPortfolioCommand = z.infer<typeof productPortfolioCommandSchema>;
export type PortfolioGroup = z.infer<typeof portfolioGroupSchema>;
