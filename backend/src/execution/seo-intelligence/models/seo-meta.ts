import { z } from "zod";

/** Page-level title tag. */
export type SeoTitleTag = {
  pagePath: string;
  pageType: string;
  titleTag: string;
};

export const seoTitleTagSchema = z.object({
  pagePath: z.string().min(1),
  pageType: z.string().min(1),
  titleTag: z.string().min(1).max(70),
});

/** Page-level meta description. */
export type SeoMetaDescription = {
  pagePath: string;
  pageType: string;
  metaDescription: string;
};

export const seoMetaDescriptionSchema = z.object({
  pagePath: z.string().min(1),
  pageType: z.string().min(1),
  metaDescription: z.string().min(1).max(170),
});

/** Validates SeoTitleTag record shape. */
export function validateSeoTitleTag(value: unknown): SeoTitleTag {
  return seoTitleTagSchema.parse(value);
}

/** Validates SeoMetaDescription record shape. */
export function validateSeoMetaDescription(value: unknown): SeoMetaDescription {
  return seoMetaDescriptionSchema.parse(value);
}

/** Canonical URL mapping for a store page. */
export type CanonicalUrl = {
  pagePath: string;
  canonicalUrl: string;
};

export const canonicalUrlSchema = z.object({
  pagePath: z.string().min(1),
  canonicalUrl: z.string().url(),
});

/** Validates a CanonicalUrl record shape. */
export function validateCanonicalUrl(value: unknown): CanonicalUrl {
  return canonicalUrlSchema.parse(value);
}

/** Open Graph metadata for social sharing. */
export type OpenGraphMeta = {
  pagePath: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogUrl: string;
  ogImage: string;
};

export const openGraphMetaSchema = z.object({
  pagePath: z.string().min(1),
  ogTitle: z.string().min(1),
  ogDescription: z.string().min(1),
  ogType: z.string().min(1),
  ogUrl: z.string().url(),
  ogImage: z.string().url(),
});

/** Validates OpenGraphMeta record shape. */
export function validateOpenGraphMeta(value: unknown): OpenGraphMeta {
  return openGraphMetaSchema.parse(value);
}

/** Twitter Card metadata. */
export type TwitterCardMeta = {
  pagePath: string;
  cardType: "summary" | "summary_large_image";
  title: string;
  description: string;
  image: string;
};

export const twitterCardMetaSchema = z.object({
  pagePath: z.string().min(1),
  cardType: z.enum(["summary", "summary_large_image"]),
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().url(),
});

/** Validates TwitterCardMeta record shape. */
export function validateTwitterCardMeta(value: unknown): TwitterCardMeta {
  return twitterCardMetaSchema.parse(value);
}
