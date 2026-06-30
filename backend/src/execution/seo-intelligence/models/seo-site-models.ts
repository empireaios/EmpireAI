import { z } from "zod";

/** Internal link recommendation between store pages. */
export type InternalLinkRecommendation = {
  fromPath: string;
  toPath: string;
  anchorText: string;
  rationale: string;
};

export const internalLinkRecommendationSchema = z.object({
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  anchorText: z.string().min(1),
  rationale: z.string().min(1),
});

/** Validates an InternalLinkRecommendation record shape. */
export function validateInternalLinkRecommendation(
  value: unknown,
): InternalLinkRecommendation {
  return internalLinkRecommendationSchema.parse(value);
}

/** Sitemap entry for a store URL. */
export type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

export const sitemapEntrySchema = z.object({
  loc: z.string().url(),
  lastmod: z.string().min(1),
  changefreq: z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]),
  priority: z.number().min(0).max(1),
});

/** Sitemap model for manufactured store SEO. */
export type SitemapModel = {
  indexUrl: string;
  entries: SitemapEntry[];
};

export const sitemapModelSchema = z.object({
  indexUrl: z.string().url(),
  entries: z.array(sitemapEntrySchema).min(1),
});

/** Validates a SitemapModel record shape. */
export function validateSitemapModel(value: unknown): SitemapModel {
  return sitemapModelSchema.parse(value);
}

/** Robots.txt rule. */
export type RobotsRule = {
  userAgent: string;
  allow: string[];
  disallow: string[];
};

export const robotsRuleSchema = z.object({
  userAgent: z.string().min(1),
  allow: z.array(z.string()),
  disallow: z.array(z.string()),
});

/** Robots model for manufactured store SEO. */
export type RobotsModel = {
  sitemapUrl: string;
  rules: RobotsRule[];
};

export const robotsModelSchema = z.object({
  sitemapUrl: z.string().url(),
  rules: z.array(robotsRuleSchema).min(1),
});

/** Validates a RobotsModel record shape. */
export function validateRobotsModel(value: unknown): RobotsModel {
  return robotsModelSchema.parse(value);
}
