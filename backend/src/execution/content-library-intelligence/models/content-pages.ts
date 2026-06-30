import { z } from "zod";

/** Pillar page blueprint for topical authority. */
export type PillarPage = {
  pageId: string;
  title: string;
  slug: string;
  clusterId: string;
  targetKeyword: string;
  outline: string[];
  wordCountTarget: number;
  internalLinks: string[];
};

export const pillarPageSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  clusterId: z.string().min(1),
  targetKeyword: z.string().min(1),
  outline: z.array(z.string().min(1)).min(1),
  wordCountTarget: z.number().int().min(500),
  internalLinks: z.array(z.string().min(1)),
});

/** Validates a PillarPage record shape. */
export function validatePillarPage(value: unknown): PillarPage {
  return pillarPageSchema.parse(value);
}

/** Supporting article linked to a pillar page. */
export type SupportingArticle = {
  articleId: string;
  title: string;
  slug: string;
  pillarPageId: string;
  targetKeyword: string;
  angle: string;
  wordCountTarget: number;
};

export const supportingArticleSchema = z.object({
  articleId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  pillarPageId: z.string().min(1),
  targetKeyword: z.string().min(1),
  angle: z.string().min(1),
  wordCountTarget: z.number().int().min(300),
});

/** Validates a SupportingArticle record shape. */
export function validateSupportingArticle(value: unknown): SupportingArticle {
  return supportingArticleSchema.parse(value);
}
