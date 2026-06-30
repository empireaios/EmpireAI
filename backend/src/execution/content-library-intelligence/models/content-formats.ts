import { z } from "zod";

/** FAQ expansion entry for SEO and conversion support. */
export type FaqExpansion = {
  faqId: string;
  question: string;
  answerOutline: string[];
  targetKeyword: string;
  category: string;
};

export const faqExpansionSchema = z.object({
  faqId: z.string().min(1),
  question: z.string().min(1),
  answerOutline: z.array(z.string().min(1)).min(1),
  targetKeyword: z.string().min(1),
  category: z.string().min(1),
});

/** Validates a FaqExpansion record shape. */
export function validateFaqExpansion(value: unknown): FaqExpansion {
  return faqExpansionSchema.parse(value);
}

/** Buying guide content blueprint. */
export type BuyingGuide = {
  guideId: string;
  title: string;
  slug: string;
  targetKeyword: string;
  sections: string[];
  recommendedProducts: string[];
  callToAction: string;
};

export const buyingGuideSchema = z.object({
  guideId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  targetKeyword: z.string().min(1),
  sections: z.array(z.string().min(1)).min(1),
  recommendedProducts: z.array(z.string().min(1)).min(1),
  callToAction: z.string().min(1),
});

/** Validates a BuyingGuide record shape. */
export function validateBuyingGuide(value: unknown): BuyingGuide {
  return buyingGuideSchema.parse(value);
}

/** Comparison page blueprint. */
export type ComparisonPage = {
  comparisonId: string;
  title: string;
  slug: string;
  targetKeyword: string;
  comparedItems: string[];
  criteria: string[];
  verdict: string;
};

export const comparisonPageSchema = z.object({
  comparisonId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  targetKeyword: z.string().min(1),
  comparedItems: z.array(z.string().min(1)).min(2),
  criteria: z.array(z.string().min(1)).min(1),
  verdict: z.string().min(1),
});

/** Validates a ComparisonPage record shape. */
export function validateComparisonPage(value: unknown): ComparisonPage {
  return comparisonPageSchema.parse(value);
}

/** Evergreen content piece with long-term SEO value. */
export type EvergreenContent = {
  contentId: string;
  title: string;
  slug: string;
  contentType: string;
  refreshCadenceMonths: number;
  targetKeyword: string;
  summary: string;
};

export const evergreenContentSchema = z.object({
  contentId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  contentType: z.string().min(1),
  refreshCadenceMonths: z.number().int().min(1),
  targetKeyword: z.string().min(1),
  summary: z.string().min(1),
});

/** Validates an EvergreenContent record shape. */
export function validateEvergreenContent(value: unknown): EvergreenContent {
  return evergreenContentSchema.parse(value);
}
