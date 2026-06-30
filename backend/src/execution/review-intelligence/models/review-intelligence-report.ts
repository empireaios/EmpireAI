import { z } from "zod";

import { competitorWeaknessSchema, type CompetitorWeakness } from "./competitor-weakness.js";
import { featureRequestSchema, type FeatureRequest } from "./feature-request.js";
import { painPointSchema, type PainPoint } from "./pain-point.js";
import { positiveThemeSchema, type PositiveTheme } from "./positive-theme.js";
import { productImprovementSchema, type ProductImprovement } from "./product-improvement.js";
import {
  reviewIntelligenceSignalSchema,
  type ReviewIntelligenceSignal,
} from "./review-intelligence-signal.js";
import { sentimentAnalysisSchema, type SentimentAnalysis } from "./sentiment-analysis.js";

export type ReviewIntelligenceReportId = string;

/** Complete review analysis report — intelligence only, no deployment. */
export type ReviewIntelligenceReport = {
  reportId: ReviewIntelligenceReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  sentiment: SentimentAnalysis;
  painPoints: PainPoint[];
  positiveThemes: PositiveTheme[];
  featureRequests: FeatureRequest[];
  competitorWeaknesses: CompetitorWeakness[];
  productImprovements: ProductImprovement[];
  overallScore: number;
  confidence: number;
  signals: ReviewIntelligenceSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoApplyEnabled: false;
};

export type ReviewIntelligenceReportCreateInput = Omit<ReviewIntelligenceReport, "reportId">;

export const reviewIntelligenceReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  sentiment: sentimentAnalysisSchema,
  painPoints: z.array(painPointSchema).min(1),
  positiveThemes: z.array(positiveThemeSchema).min(1),
  featureRequests: z.array(featureRequestSchema).min(1),
  competitorWeaknesses: z.array(competitorWeaknessSchema).min(1),
  productImprovements: z.array(productImprovementSchema).min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(reviewIntelligenceSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoApplyEnabled: z.literal(false),
});

/** Validates a ReviewIntelligenceReport record shape. */
export function validateReviewIntelligenceReport(value: unknown): ReviewIntelligenceReport {
  return reviewIntelligenceReportSchema.parse(value);
}
