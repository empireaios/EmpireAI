import { z } from "zod";

import { blogStrategySchema, type BlogStrategy } from "./blog-strategy.js";
import { topicalClusterSchema, type TopicalCluster } from "./topical-cluster.js";
import { pillarPageSchema, supportingArticleSchema, type PillarPage, type SupportingArticle } from "./content-pages.js";
import {
  buyingGuideSchema,
  comparisonPageSchema,
  evergreenContentSchema,
  faqExpansionSchema,
  type BuyingGuide,
  type ComparisonPage,
  type EvergreenContent,
  type FaqExpansion,
} from "./content-formats.js";
import { publishingScheduleSchema, type PublishingSchedule } from "./publishing-schedule.js";
import {
  contentLibrarySignalSchema,
  seoCoverageReportSchema,
  type ContentLibrarySignal,
  type SeoCoverageReport,
} from "./content-library-metrics.js";

export type ContentLibraryId = string;

/** Complete content library for a manufactured store — strategy and blueprints only. */
export type ContentLibrary = {
  libraryId: ContentLibraryId;
  storeId: string;
  brandId: string;
  libraryName: string;
  blogStrategy: BlogStrategy;
  topicalClusters: TopicalCluster[];
  pillarPages: PillarPage[];
  supportingArticles: SupportingArticle[];
  faqExpansions: FaqExpansion[];
  buyingGuides: BuyingGuide[];
  comparisonPages: ComparisonPage[];
  evergreenContent: EvergreenContent[];
  publishingSchedule: PublishingSchedule;
  confidence: number;
  seoCoverage: SeoCoverageReport;
  signals: ContentLibrarySignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoPublishEnabled: false;
};

export type ContentLibraryCreateInput = Omit<ContentLibrary, "libraryId">;

export const contentLibrarySchema = z.object({
  libraryId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  libraryName: z.string().min(1),
  blogStrategy: blogStrategySchema,
  topicalClusters: z.array(topicalClusterSchema).min(1),
  pillarPages: z.array(pillarPageSchema).min(1),
  supportingArticles: z.array(supportingArticleSchema).min(1),
  faqExpansions: z.array(faqExpansionSchema).min(1),
  buyingGuides: z.array(buyingGuideSchema).min(1),
  comparisonPages: z.array(comparisonPageSchema).min(1),
  evergreenContent: z.array(evergreenContentSchema).min(1),
  publishingSchedule: publishingScheduleSchema,
  confidence: z.number().min(0).max(100),
  seoCoverage: seoCoverageReportSchema,
  signals: z.array(contentLibrarySignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoPublishEnabled: z.literal(false),
});

/** Validates a ContentLibrary record shape. */
export function validateContentLibrary(value: unknown): ContentLibrary {
  return contentLibrarySchema.parse(value);
}
