import { randomUUID } from "node:crypto";

import type { BusinessOpportunityRecord } from "../../business-opportunity-workspace/models/business-opportunity.js";
import type {
  BrandPreview,
  BusinessPreviewRecord,
  MarketplacePreview,
  PreviewQuality,
  ProductPreview,
} from "../models/business-preview.js";

const CATEGORY_PALETTES: Record<string, BrandPreview["colourPalette"]> = {
  kitchen: { primary: "#2D3436", secondary: "#636E72", accent: "#E17055", background: "#FAFAFA", text: "#2D3436" },
  beauty: { primary: "#6C5B7B", secondary: "#C06C84", accent: "#F67280", background: "#FFF5F7", text: "#2D2D2D" },
  health: { primary: "#00B894", secondary: "#55EFC4", accent: "#0984E3", background: "#F0FFF4", text: "#1A1A1A" },
  default: { primary: "#2C3E50", secondary: "#3498DB", accent: "#E74C3C", background: "#FFFFFF", text: "#2C3E50" },
};

function resolvePalette(category: string): BrandPreview["colourPalette"] {
  const key = category.toLowerCase();
  return CATEGORY_PALETTES[key] ?? CATEGORY_PALETTES.default!;
}

function buildBrandPreview(opportunity: BusinessOpportunityRecord): BrandPreview {
  const palette = resolvePalette(opportunity.brand.category);
  return {
    brand: opportunity.brand.businessName,
    logo: opportunity.brand.logoPlaceholder.replace("placeholder://logo/", "preview://logo/"),
    colourPalette: palette,
    typography: {
      headingFont: "Inter Bold",
      bodyFont: "Inter Regular",
      accentFont: "Playfair Display",
    },
    brandStory: opportunity.assetsPreview.brandStory,
  };
}

function buildProductPreview(opportunity: BusinessOpportunityRecord): ProductPreview {
  const slug = opportunity.economics.productName.toLowerCase().replace(/\s+/g, "-");
  const images = opportunity.assetsPreview.productImagePlaceholders.map((url, index) =>
    url.replace("placeholder://", "preview://"),
  );

  return {
    productTitle: opportunity.assetsPreview.listingTitle,
    productDescription: opportunity.assetsPreview.listingDescription,
    seoTitle: `${opportunity.brand.businessName} | ${opportunity.economics.productName}`,
    seoKeywords: opportunity.assetsPreview.seoKeywords,
    heroBanner: opportunity.assetsPreview.heroImagePlaceholder.replace("placeholder://", "preview://"),
    productImages: images,
    productGallery: [
      ...images,
      `preview://gallery/${slug}/lifestyle`,
      `preview://gallery/${slug}/detail`,
    ],
    productVideoStoryboard: opportunity.assetsPreview.shortVideoStoryboard,
    packagingConcept: `preview://packaging/${slug} — ${opportunity.brand.businessName} branded box with ${paletteAccent(opportunity.brand.category)} accent`,
  };
}

function paletteAccent(category: string): string {
  return resolvePalette(category).accent;
}

function buildMarketplacePreview(opportunity: BusinessOpportunityRecord): MarketplacePreview {
  const name = opportunity.brand.businessName;
  const product = opportunity.economics.productName;

  return {
    homepagePreview: `preview://homepage/${encodeURIComponent(name)} — hero, featured ${product}, brand story section`,
    amazonListingPreview: `preview://amazon/${encodeURIComponent(product)} — A+ content layout, bullet points, primary image slot`,
    tiktokShopPreview: `preview://tiktok-shop/${encodeURIComponent(product)} — vertical video thumbnail, shop carousel`,
    ebayPreview: `preview://ebay/${encodeURIComponent(product)} — gallery grid, item specifics, shipping badge`,
    shopifyProductPagePreview: `preview://shopify/${encodeURIComponent(product)} — product page with variant selector, add-to-cart`,
    googleMerchantPreview: `preview://google-merchant/${encodeURIComponent(product)} — shopping feed title, price, primary image`,
  };
}

function computeQuality(
  opportunity: BusinessOpportunityRecord,
  brandPreview: BrandPreview,
  productPreview: ProductPreview,
  marketplacePreview: MarketplacePreview,
): PreviewQuality {
  const brandScore = Math.round(
    opportunity.brand.brandConfidence * 0.7 + (brandPreview.brandStory.length > 50 ? 30 : 15),
  );
  const productScore = Math.round(
    opportunity.economics.launchConfidence * 0.5 +
      (productPreview.seoKeywords.length >= 4 ? 25 : 10) +
      (productPreview.productGallery.length >= 4 ? 25 : 10),
  );
  const marketplaceScore = Math.round(
    opportunity.economics.dominationScore * 0.5 + opportunity.economics.estimatedMargin * 0.5,
  );
  const overallScore = Math.round((brandScore + productScore + marketplaceScore) / 3);

  const recommendedImprovements: string[] = [];
  if (brandScore < 70) {
    recommendedImprovements.push("Strengthen brand story and logo concept before build.");
  }
  if (productScore < 70) {
    recommendedImprovements.push("Expand product gallery and SEO keyword coverage.");
  }
  if (marketplaceScore < 70) {
    recommendedImprovements.push(`Optimize ${opportunity.economics.recommendedMarketplace} listing layout.`);
  }
  if (opportunity.economics.supplierConfidence < 65) {
    recommendedImprovements.push("Verify supplier reliability before approving for build.");
  }
  if (recommendedImprovements.length === 0) {
    recommendedImprovements.push("Preview quality is strong — ready for Grand King build approval.");
  }

  return {
    overallScore,
    brandScore,
    productScore,
    marketplaceScore,
    recommendedImprovements,
  };
}

function countAssets(
  brandPreview: BrandPreview,
  productPreview: ProductPreview,
  marketplacePreview: MarketplacePreview,
): number {
  return (
    1 + // logo
    5 + // colour palette
    3 + // typography
    1 + // brand story
    1 + // product title
    1 + // description
    1 + // seo title
    productPreview.seoKeywords.length +
    1 + // hero
    productPreview.productImages.length +
    productPreview.productGallery.length +
    productPreview.productVideoStoryboard.length +
    1 + // packaging
    6 // marketplace previews
  );
}

/** Generates a complete visual business preview from an approved opportunity — preview only. */
export function generateBusinessPreview(
  opportunity: BusinessOpportunityRecord,
  options?: { generationVersion?: number; status?: BusinessPreviewRecord["status"] },
): BusinessPreviewRecord {
  const brandPreview = buildBrandPreview(opportunity);
  const productPreview = buildProductPreview(opportunity);
  const marketplacePreview = buildMarketplacePreview(opportunity);
  const quality = computeQuality(opportunity, brandPreview, productPreview, marketplacePreview);
  const assetsGenerated = countAssets(brandPreview, productPreview, marketplacePreview);
  const timestamp = new Date().toISOString();
  const version = options?.generationVersion ?? 1;

  return {
    previewId: `preview:${randomUUID()}`,
    businessOpportunityId: opportunity.businessOpportunityId,
    workspaceId: opportunity.workspaceId,
    companyId: opportunity.companyId,
    businessName: opportunity.brand.businessName,
    status: options?.status ?? "GENERATED",
    generationVersion: version,
    brandPreview,
    productPreview,
    marketplacePreview,
    quality,
    assetsGenerated,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
