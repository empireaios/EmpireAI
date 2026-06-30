import { z } from "zod";

import { adsOptimizationSchema, type AdsOptimization } from "./ads-optimization.js";
import {
  continuousOptimizationSignalSchema,
  type ContinuousOptimizationSignal,
} from "./continuous-optimization-signal.js";
import {
  marketingOptimizationSchema,
  type MarketingOptimization,
} from "./marketing-optimization.js";
import { offerOptimizationSchema, type OfferOptimization } from "./offer-optimization.js";
import { optimizationTaskSchema, type OptimizationTask } from "./optimization-task.js";
import { pricingOptimizationSchema, type PricingOptimization } from "./pricing-optimization.js";
import { seoOptimizationSchema, type SeoOptimization } from "./seo-optimization.js";
import { storeOptimizationSchema, type StoreOptimization } from "./store-optimization.js";

export type ContinuousOptimizationReportId = string;

/** Complete continuous optimization report — intelligence only, no auto-apply. */
export type ContinuousOptimizationReport = {
  reportId: ContinuousOptimizationReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  stores: StoreOptimization;
  ads: AdsOptimization;
  pricing: PricingOptimization;
  offers: OfferOptimization;
  seo: SeoOptimization;
  marketing: MarketingOptimization;
  allTasks: OptimizationTask[];
  totalTasks: number;
  overallScore: number;
  confidence: number;
  signals: ContinuousOptimizationSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoApplyEnabled: false;
};

export type ContinuousOptimizationReportCreateInput = Omit<
  ContinuousOptimizationReport,
  "reportId"
>;

export const continuousOptimizationReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  stores: storeOptimizationSchema,
  ads: adsOptimizationSchema,
  pricing: pricingOptimizationSchema,
  offers: offerOptimizationSchema,
  seo: seoOptimizationSchema,
  marketing: marketingOptimizationSchema,
  allTasks: z.array(optimizationTaskSchema).min(6),
  totalTasks: z.number().int().min(6),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(continuousOptimizationSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoApplyEnabled: z.literal(false),
});

/** Validates a ContinuousOptimizationReport record shape. */
export function validateContinuousOptimizationReport(
  value: unknown,
): ContinuousOptimizationReport {
  return continuousOptimizationReportSchema.parse(value);
}
