import { z } from "zod";

export const BUSINESS_PREVIEW_STATUSES = [
  "DRAFT",
  "GENERATED",
  "REGENERATED",
  "APPROVED_FOR_BUILD",
] as const;

export type BusinessPreviewStatus = (typeof BUSINESS_PREVIEW_STATUSES)[number];

export const brandPreviewSchema = z.object({
  brand: z.string().min(1),
  logo: z.string().min(1),
  colourPalette: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
    accent: z.string().min(1),
    background: z.string().min(1),
    text: z.string().min(1),
  }),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
    accentFont: z.string().min(1),
  }),
  brandStory: z.string().min(1),
});

export const productPreviewSchema = z.object({
  productTitle: z.string().min(1),
  productDescription: z.string().min(1),
  seoTitle: z.string().min(1),
  seoKeywords: z.array(z.string()),
  heroBanner: z.string().min(1),
  productImages: z.array(z.string()),
  productGallery: z.array(z.string()),
  productVideoStoryboard: z.array(z.string()),
  packagingConcept: z.string().min(1),
});

export const marketplacePreviewSchema = z.object({
  homepagePreview: z.string().min(1),
  amazonListingPreview: z.string().min(1),
  tiktokShopPreview: z.string().min(1),
  ebayPreview: z.string().min(1),
  shopifyProductPagePreview: z.string().min(1),
  googleMerchantPreview: z.string().min(1),
});

export const previewQualitySchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  brandScore: z.number().int().min(0).max(100),
  productScore: z.number().int().min(0).max(100),
  marketplaceScore: z.number().int().min(0).max(100),
  recommendedImprovements: z.array(z.string()),
});

export const businessPreviewRecordSchema = z.object({
  previewId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  status: z.enum(BUSINESS_PREVIEW_STATUSES),
  generationVersion: z.number().int().min(1),
  brandPreview: brandPreviewSchema,
  productPreview: productPreviewSchema,
  marketplacePreview: marketplacePreviewSchema,
  quality: previewQualitySchema,
  assetsGenerated: z.number().int().min(0),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  approvedForBuildAt: z.string().datetime({ offset: true }).optional(),
  approvedForBuildBy: z.string().optional(),
});

export type BusinessPreviewRecord = z.infer<typeof businessPreviewRecordSchema>;
export type BrandPreview = z.infer<typeof brandPreviewSchema>;
export type ProductPreview = z.infer<typeof productPreviewSchema>;
export type MarketplacePreview = z.infer<typeof marketplacePreviewSchema>;
export type PreviewQuality = z.infer<typeof previewQualitySchema>;

export const businessPreviewDashboardSchema = z.object({
  businessPreviewReady: z.boolean(),
  assetsGenerated: z.number().int().min(0),
  previewQuality: z.number().int().min(0).max(100),
  recommendedImprovements: z.array(z.string()),
  approveForBuild: z.object({
    available: z.boolean(),
    previewId: z.string().optional(),
    businessOpportunityId: z.string().optional(),
    businessName: z.string().optional(),
  }),
  latestPreviewId: z.string().optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type BusinessPreviewDashboard = z.infer<typeof businessPreviewDashboardSchema>;
