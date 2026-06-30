import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { StoreBlueprint } from "../../store-blueprint/models/store-blueprint.js";
import type { StoreNavigation } from "../../store-blueprint/models/store-navigation.js";
import type { RenderableStorePage } from "../../store-page-generation/models/renderable-store-page.js";
import type { StorePageMetadata } from "../../store-page-generation/models/renderable-store-page.js";
import type { StorefrontCreateInput } from "../models/storefront.js";
import type { StorefrontAsset } from "../models/storefront-asset.js";
import type { StorefrontRoute } from "../models/storefront-route.js";
import type { StorefrontSignal, StorefrontSignalType } from "../models/storefront-signal.js";

export const STOREFRONT_SIGNAL_WEIGHTS: Record<StorefrontSignalType, number> = {
  page_coverage: 0.18,
  route_completeness: 0.16,
  navigation_alignment: 0.14,
  asset_readiness: 0.14,
  seo_coverage: 0.14,
  brand_alignment: 0.12,
  blueprint_alignment: 0.08,
  storefront_composite: 0.04,
};

export type AssemblyBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "valueProposition"
  | "confidence"
>;

export type AssemblyBlueprintInput = Pick<
  StoreBlueprint,
  "storeId" | "brandId" | "navigation" | "confidence"
>;

export type AssemblyPageInput = Pick<
  RenderableStorePage,
  "pageId" | "route" | "pageType" | "title" | "metadata" | "confidence" | "renderPayload"
>;

export type StorefrontAssemblyInput = {
  pages: AssemblyPageInput[];
  blueprint: AssemblyBlueprintInput;
  brand: AssemblyBrandInput;
};

export type StorefrontAssemblyBreakdown = StorefrontCreateInput;

const PAGE_TYPE_PRIORITY: Record<AssemblyPageInput["pageType"], number> = {
  HOME: 1,
  COLLECTION: 2,
  PRODUCT: 3,
  ABOUT: 4,
  FAQ: 5,
  CONTACT: 6,
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSignal(
  signalType: StorefrontSignalType,
  score: number,
  detail: string,
): StorefrontSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: STOREFRONT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function isDynamicRoute(pageType: AssemblyPageInput["pageType"]): boolean {
  return pageType === "PRODUCT" || pageType === "COLLECTION";
}

function buildRoutes(pages: AssemblyPageInput[]): StorefrontRoute[] {
  return pages
    .map((page) => ({
      routeId: `route-${page.pageId}`,
      path: page.route,
      pageId: page.pageId,
      pageType: page.pageType,
      title: page.title,
      priority: PAGE_TYPE_PRIORITY[page.pageType],
      isDynamic: isDynamicRoute(page.pageType),
    }))
    .sort((left, right) => left.priority - right.priority || left.path.localeCompare(right.path));
}

function buildNavigation(
  blueprint: AssemblyBlueprintInput,
  brand: AssemblyBrandInput,
): StoreNavigation {
  return {
    storeName: blueprint.navigation.storeName || brand.brandName,
    primaryLinks: blueprint.navigation.primaryLinks.map((link) => ({ ...link })),
    footerLinks: blueprint.navigation.footerLinks.map((link) => ({ ...link })),
  };
}

function buildAssets(brand: AssemblyBrandInput, storeId: string): StorefrontAsset[] {
  const brandSlug = slugify(brand.brandName);
  const assetBase = `/assets/stores/${storeId}/${brandSlug}`;

  return [
    {
      assetId: `asset-logo-${brand.brandId}`,
      assetType: "LOGO",
      name: `${brand.brandName} Logo`,
      path: `${assetBase}/logo.svg`,
      mimeType: "image/svg+xml",
    },
    {
      assetId: `asset-favicon-${brand.brandId}`,
      assetType: "FAVICON",
      name: `${brand.brandName} Favicon`,
      path: `${assetBase}/favicon.ico`,
      mimeType: "image/x-icon",
    },
    {
      assetId: `asset-theme-${brand.brandId}`,
      assetType: "THEME",
      name: `${brand.brandName} Theme`,
      path: `${assetBase}/theme.json`,
      mimeType: "application/json",
    },
    {
      assetId: `asset-style-${brand.brandId}`,
      assetType: "STYLE",
      name: `${brand.brandName} Storefront Styles`,
      path: `${assetBase}/storefront.css`,
      mimeType: "text/css",
    },
    {
      assetId: `asset-script-${brand.brandId}`,
      assetType: "SCRIPT",
      name: `${brand.brandName} Storefront Bootstrap`,
      path: `${assetBase}/storefront.js`,
      mimeType: "application/javascript",
    },
    {
      assetId: `asset-hero-${brand.brandId}`,
      assetType: "IMAGE",
      name: `${brand.brandName} Hero Image`,
      path: `${assetBase}/hero.jpg`,
      mimeType: "image/jpeg",
    },
  ];
}

function buildPageMap(pages: AssemblyPageInput[]): Record<string, string> {
  const pageMap: Record<string, string> = {};
  for (const page of pages) {
    pageMap[page.route] = page.pageId;
  }
  return pageMap;
}

function buildSeoMap(pages: AssemblyPageInput[]): Record<string, StorePageMetadata> {
  const seoMap: Record<string, StorePageMetadata> = {};
  for (const page of pages) {
    seoMap[page.route] = {
      description: page.metadata.description,
      keywords: [...page.metadata.keywords],
      ogTitle: page.metadata.ogTitle,
      ogDescription: page.metadata.ogDescription,
    };
  }
  return seoMap;
}

function computeConfidence(
  pages: AssemblyPageInput[],
  blueprint: AssemblyBlueprintInput,
  brand: AssemblyBrandInput,
  routes: StorefrontRoute[],
  assets: StorefrontAsset[],
  seoMap: Record<string, StorePageMetadata>,
): number {
  const pageConfidence = average(pages.map((page) => page.confidence));
  const routeScore = routes.length >= 6 ? 88 : 62;
  const assetScore = assets.length >= 5 ? 86 : 60;
  const seoScore =
    Object.keys(seoMap).length === pages.length &&
    Object.values(seoMap).every((entry) => entry.description.length >= 20)
      ? 88
      : 64;

  return clampScore(
    pageConfidence * 0.35 +
      blueprint.confidence * 0.25 +
      brand.confidence * 0.2 +
      routeScore * 0.1 +
      assetScore * 0.05 +
      seoScore * 0.05,
  );
}

function buildSignals(
  pages: AssemblyPageInput[],
  blueprint: AssemblyBlueprintInput,
  brand: AssemblyBrandInput,
  routes: StorefrontRoute[],
  assets: StorefrontAsset[],
  navigation: StoreNavigation,
  seoMap: Record<string, StorePageMetadata>,
  confidence: number,
): StorefrontSignal[] {
  const requiredPageTypes = ["HOME", "PRODUCT", "COLLECTION", "ABOUT", "FAQ", "CONTACT"] as const;
  const coveredTypes = new Set(pages.map((page) => page.pageType));

  return [
    buildSignal(
      "page_coverage",
      (requiredPageTypes.filter((type) => coveredTypes.has(type)).length /
        requiredPageTypes.length) *
        100,
      `${coveredTypes.size} page types covered`,
    ),
    buildSignal(
      "route_completeness",
      routes.length >= pages.length ? 88 : 60,
      `${routes.length} deployable routes`,
    ),
    buildSignal(
      "navigation_alignment",
      navigation.primaryLinks.length >= 5 ? 86 : 62,
      `${navigation.primaryLinks.length} primary navigation links`,
    ),
    buildSignal(
      "asset_readiness",
      assets.length >= 5 ? 85 : 58,
      `${assets.length} storefront assets prepared`,
    ),
    buildSignal(
      "seo_coverage",
      Object.keys(seoMap).length === pages.length ? 88 : 60,
      `SEO mapped for ${Object.keys(seoMap).length} routes`,
    ),
    buildSignal("brand_alignment", brand.confidence, `Brand ${brand.brandName}`),
    buildSignal("blueprint_alignment", blueprint.confidence, `Blueprint store ${blueprint.storeId}`),
    buildSignal("storefront_composite", confidence, `Storefront confidence ${confidence}`),
  ];
}

/** Assembles a deployable storefront from renderable pages, blueprint, and brand inputs. */
export function scoreStorefrontAssembly(
  input: StorefrontAssemblyInput,
): StorefrontAssemblyBreakdown {
  const { pages, blueprint, brand } = input;

  const routes = buildRoutes(pages);
  const navigation = buildNavigation(blueprint, brand);
  const assets = buildAssets(brand, blueprint.storeId);
  const pageMap = buildPageMap(pages);
  const seoMap = buildSeoMap(pages);
  const confidence = computeConfidence(pages, blueprint, brand, routes, assets, seoMap);
  const signals = buildSignals(
    pages,
    blueprint,
    brand,
    routes,
    assets,
    navigation,
    seoMap,
    confidence,
  );

  return {
    storeId: blueprint.storeId,
    brandId: brand.brandId,
    routes,
    navigation,
    assets,
    pageMap,
    seoMap,
    confidence,
    signals,
  };
}

export const storefrontAssemblyScoring = {
  scoreStorefrontAssembly,
  weights: STOREFRONT_SIGNAL_WEIGHTS,
};
