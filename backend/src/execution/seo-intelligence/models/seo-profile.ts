import { z } from "zod";

import { keywordClusterSchema, type KeywordCluster } from "./keyword-cluster.js";
import { searchIntentMappingSchema, type SearchIntentMapping } from "./search-intent.js";
import {
  canonicalUrlSchema,
  openGraphMetaSchema,
  seoTitleTagSchema,
  seoMetaDescriptionSchema,
  twitterCardMetaSchema,
  type CanonicalUrl,
  type OpenGraphMeta,
  type SeoTitleTag,
  type SeoMetaDescription,
  type TwitterCardMeta,
} from "./seo-meta.js";
import { structuredDataBlockSchema, type StructuredDataBlock } from "./structured-data.js";
import {
  internalLinkRecommendationSchema,
  robotsModelSchema,
  sitemapModelSchema,
  type InternalLinkRecommendation,
  type RobotsModel,
  type SitemapModel,
} from "./seo-site-models.js";
import {
  seoContentRecommendationSchema,
  topicalAuthorityMapSchema,
  type SeoContentRecommendation,
  type TopicalAuthorityMap,
} from "./seo-content.js";
import { seoRecommendationSchema, type SeoRecommendation } from "./seo-recommendation.js";
import { seoSignalSchema, type SeoSignal } from "./seo-signal.js";

export type SeoProfileId = string;

/** Complete SEO strategy profile for a manufactured store. */
export type SeoProfile = {
  profileId: SeoProfileId;
  storeId: string;
  brandId: string;
  profileName: string;
  baseUrl: string;
  keywordClusters: KeywordCluster[];
  searchIntentMappings: SearchIntentMapping[];
  titleTags: SeoTitleTag[];
  metaDescriptions: SeoMetaDescription[];
  canonicalUrls: CanonicalUrl[];
  openGraph: OpenGraphMeta[];
  twitterCards: TwitterCardMeta[];
  structuredData: StructuredDataBlock[];
  internalLinking: InternalLinkRecommendation[];
  sitemap: SitemapModel;
  robots: RobotsModel;
  contentRecommendations: SeoContentRecommendation[];
  topicalAuthorityMap: TopicalAuthorityMap;
  seoConfidence: number;
  seoRecommendations: SeoRecommendation[];
  signals: SeoSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
};

export type SeoProfileCreateInput = Omit<SeoProfile, "profileId">;

export const seoProfileSchema = z.object({
  profileId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  profileName: z.string().min(1),
  baseUrl: z.string().url(),
  keywordClusters: z.array(keywordClusterSchema).min(1),
  searchIntentMappings: z.array(searchIntentMappingSchema).min(1),
  titleTags: z.array(seoTitleTagSchema).min(1),
  metaDescriptions: z.array(seoMetaDescriptionSchema).min(1),
  canonicalUrls: z.array(canonicalUrlSchema).min(1),
  openGraph: z.array(openGraphMetaSchema).min(1),
  twitterCards: z.array(twitterCardMetaSchema).min(1),
  structuredData: z.array(structuredDataBlockSchema).min(1),
  internalLinking: z.array(internalLinkRecommendationSchema).min(1),
  sitemap: sitemapModelSchema,
  robots: robotsModelSchema,
  contentRecommendations: z.array(seoContentRecommendationSchema).min(1),
  topicalAuthorityMap: topicalAuthorityMapSchema,
  seoConfidence: z.number().min(0).max(100),
  seoRecommendations: z.array(seoRecommendationSchema).min(1),
  signals: z.array(seoSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
});

/** Validates a SeoProfile record shape. */
export function validateSeoProfile(value: unknown): SeoProfile {
  return seoProfileSchema.parse(value);
}
