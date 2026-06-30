import { z } from "zod";

export const BUSINESS_BUILD_STATUSES = [
  "PENDING_BUILD",
  "BUILDING",
  "READY_FOR_PUBLICATION",
  "FAILED",
] as const;

export type BusinessBuildStatus = (typeof BUSINESS_BUILD_STATUSES)[number];

export const BUILD_MARKETPLACES = [
  "amazon",
  "shopify",
  "tiktok-shop",
  "ebay",
  "google-merchant",
] as const;

export type BuildMarketplaceId = (typeof BUILD_MARKETPLACES)[number];

export const brandBuildAssetsSchema = z.object({
  finalBrandName: z.string().min(1),
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
  brandGuidelines: z.string().min(1),
  brandStory: z.string().min(1),
  brandVoice: z.string().min(1),
});

export const productBuildAssetsSchema = z.object({
  productTitle: z.string().min(1),
  productSubtitle: z.string().min(1),
  productDescription: z.string().min(1),
  productSpecifications: z.array(z.string()),
  productFeatures: z.array(z.string()),
  productBenefits: z.array(z.string()),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
});

export const visualBuildAssetsSchema = z.object({
  heroImage: z.string().min(1),
  productGallery: z.array(z.string()),
  lifestyleImages: z.array(z.string()),
  infographics: z.array(z.string()),
  packagingMockup: z.string().min(1),
  thumbnailImages: z.array(z.string()),
});

export const videoBuildAssetsSchema = z.object({
  shortFormVideo: z.string().min(1),
  productDemonstration: z.string().min(1),
  ugcStyleVideo: z.string().min(1),
  storyboard: z.array(z.string()),
  shotList: z.array(z.string()),
  captionSuggestions: z.array(z.string()),
});

export const seoBuildAssetsSchema = z.object({
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  seoKeywords: z.array(z.string()),
  structuredMetadata: z.record(z.string()),
  marketplaceSearchTerms: z.array(z.string()),
});

export const marketplacePublicationPackageSchema = z.object({
  marketplaceId: z.enum(BUILD_MARKETPLACES),
  title: z.string().min(1),
  description: z.string().min(1),
  bulletPoints: z.array(z.string()),
  searchTerms: z.array(z.string()),
  categoryPath: z.string().min(1),
  price: z.number().min(0),
  images: z.array(z.string()),
  ready: z.boolean(),
  publishBlocked: z.literal(true),
});

export const supplierBuildPackageSchema = z.object({
  supplierMapping: z.object({
    supplierId: z.string().min(1),
    supplierName: z.string().min(1),
    productId: z.string().min(1),
    confidence: z.number().int().min(0).max(100),
  }),
  skuMapping: z.object({
    internalSku: z.string().min(1),
    supplierSku: z.string().min(1),
    variantLabel: z.string().min(1),
  }),
  shippingRules: z.array(z.string()),
  fulfillmentNotes: z.array(z.string()),
  qualityRequirements: z.array(z.string()),
  ready: z.boolean(),
  executionBlocked: z.literal(true),
});

export const buildValidationResultSchema = z.object({
  valid: z.boolean(),
  assetsCompleted: z.number().int().min(0),
  assetsRequired: z.number().int().min(0),
  marketplacePackagesReady: z.number().int().min(0),
  supplierReady: z.boolean(),
  publicationReadiness: z.number().int().min(0).max(100),
  blockers: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const businessBuildPackageSchema = z.object({
  buildId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  previewId: z.string().min(1),
  strategyId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  status: z.enum(BUSINESS_BUILD_STATUSES),
  brandAssets: brandBuildAssetsSchema,
  productAssets: productBuildAssetsSchema,
  visualAssets: visualBuildAssetsSchema,
  videoAssets: videoBuildAssetsSchema,
  seoAssets: seoBuildAssetsSchema,
  marketplacePackages: z.array(marketplacePublicationPackageSchema).length(5),
  supplierPackage: supplierBuildPackageSchema,
  validation: buildValidationResultSchema,
  buildProgress: z.number().int().min(0).max(100),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
  failureReason: z.string().optional(),
});

export type BusinessBuildPackage = z.infer<typeof businessBuildPackageSchema>;
export type BrandBuildAssets = z.infer<typeof brandBuildAssetsSchema>;
export type ProductBuildAssets = z.infer<typeof productBuildAssetsSchema>;
export type VisualBuildAssets = z.infer<typeof visualBuildAssetsSchema>;
export type VideoBuildAssets = z.infer<typeof videoBuildAssetsSchema>;
export type SeoBuildAssets = z.infer<typeof seoBuildAssetsSchema>;
export type MarketplacePublicationPackage = z.infer<typeof marketplacePublicationPackageSchema>;
export type SupplierBuildPackage = z.infer<typeof supplierBuildPackageSchema>;
export type BuildValidationResult = z.infer<typeof buildValidationResultSchema>;

export const businessBuildDashboardSchema = z.object({
  businessBuildProgress: z.number().int().min(0).max(100),
  assetsCompleted: z.number().int().min(0),
  marketplacePackagesReady: z.number().int().min(0),
  supplierReady: z.boolean(),
  publicationReadiness: z.number().int().min(0).max(100),
  buildStatus: z.enum(BUSINESS_BUILD_STATUSES).optional(),
  latestBuildId: z.string().optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type BusinessBuildDashboard = z.infer<typeof businessBuildDashboardSchema>;

export const businessBuildSummarySchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  totalBuilds: z.number().int().min(0),
  readyForPublication: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  failed: z.number().int().min(0),
  averagePublicationReadiness: z.number().min(0).max(100),
  latestBuild: businessBuildPackageSchema.optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type BusinessBuildSummary = z.infer<typeof businessBuildSummarySchema>;
