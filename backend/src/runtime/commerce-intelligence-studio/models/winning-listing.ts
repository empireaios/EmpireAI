import { z } from "zod";

/** CIS-002 — Platform-neutral winning listing (NOT Amazon-specific). */
export const WinningListingPackageSchema = z.object({
  listingId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierProductId: z.string(),
  title: z.string(),
  description: z.string(),
  benefits: z.array(z.string()),
  features: z.array(z.string()),
  emotionalSelling: z.array(z.string()),
  trustSignals: z.array(z.string()),
  objectionHandlers: z.array(z.string()),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
  guarantees: z.array(z.string()),
  shippingMessaging: z.string(),
  callToAction: z.string(),
  seoKeywords: z.array(z.string()),
  seoQualityScore: z.number().min(0).max(100),
  conversionQualityScore: z.number().min(0).max(100),
  brandConsistencyScore: z.number().min(0).max(100),
  listingStrengthScore: z.number().min(0).max(100),
  generatedAt: z.string().datetime({ offset: true }),
});

export type WinningListingPackage = z.infer<typeof WinningListingPackageSchema>;

export const WinningListingInputSchema = z.object({
  supplierProductId: z.string().min(1),
  brandName: z.string().min(1),
  targetAudience: z.string().optional(),
  tone: z.enum(["professional", "friendly", "premium", "urgent"]).default("professional"),
});

export type WinningListingInput = z.infer<typeof WinningListingInputSchema>;
