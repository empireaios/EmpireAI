import { z } from "zod";

export const CONTENT_LIBRARY_SIGNAL_TYPES = [
  "strategy_strength",
  "cluster_coverage",
  "pillar_depth",
  "format_diversity",
  "schedule_readiness",
  "seo_coverage",
  "library_composite",
] as const;

export type ContentLibrarySignalType = (typeof CONTENT_LIBRARY_SIGNAL_TYPES)[number];

/** Scoring signal for content library confidence. */
export type ContentLibrarySignal = {
  signalType: ContentLibrarySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const contentLibrarySignalSchema = z.object({
  signalType: z.enum(CONTENT_LIBRARY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ContentLibrarySignal record shape. */
export function validateContentLibrarySignal(value: unknown): ContentLibrarySignal {
  return contentLibrarySignalSchema.parse(value);
}

/** SEO coverage breakdown for the content library. */
export type SeoCoverageReport = {
  overallCoverage: number;
  clustersCovered: number;
  totalClusters: number;
  pillarPagesMapped: number;
  supportingArticlesMapped: number;
  faqKeywordsCovered: number;
  commercialIntentCoverage: number;
  informationalIntentCoverage: number;
  summary: string;
};

export const seoCoverageReportSchema = z.object({
  overallCoverage: z.number().min(0).max(100),
  clustersCovered: z.number().int().min(0),
  totalClusters: z.number().int().min(1),
  pillarPagesMapped: z.number().int().min(0),
  supportingArticlesMapped: z.number().int().min(0),
  faqKeywordsCovered: z.number().int().min(0),
  commercialIntentCoverage: z.number().min(0).max(100),
  informationalIntentCoverage: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a SeoCoverageReport record shape. */
export function validateSeoCoverageReport(value: unknown): SeoCoverageReport {
  return seoCoverageReportSchema.parse(value);
}
