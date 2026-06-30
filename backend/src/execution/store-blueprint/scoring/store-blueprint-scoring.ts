import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { BrandProductPortfolio } from "../../brand-product-portfolio/models/brand-product-portfolio.js";
import type { BrandProduct } from "../../brand-product-portfolio/models/brand-product.js";
import type { LandingPageContent } from "../../landing-page-content-generation/models/landing-page-content.js";
import type { ProductOffer } from "../../product-offer-generation/models/product-offer.js";
import type { StoreBlueprintCreateInput } from "../models/store-blueprint.js";
import type { StoreNavigation, StoreNavLink } from "../models/store-navigation.js";
import type { StorePage } from "../models/store-page.js";
import type { StoreBlueprintSignal, StoreBlueprintSignalType } from "../models/store-blueprint-signal.js";

export const STORE_BLUEPRINT_SIGNAL_WEIGHTS: Record<StoreBlueprintSignalType, number> = {
  brand_alignment: 0.18,
  portfolio_coverage: 0.16,
  offer_alignment: 0.16,
  content_alignment: 0.14,
  navigation_completeness: 0.12,
  page_structure: 0.1,
  collection_depth: 0.1,
  store_composite: 0.04,
};

export type StoreBrandInput = Pick<
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

export type StorePortfolioInput = Pick<
  BrandProductPortfolio,
  | "brandId"
  | "recommendedProducts"
  | "heroProducts"
  | "supportingProducts"
  | "bundleProducts"
  | "portfolioScore"
  | "confidence"
>;

export type StoreOfferInput = Pick<
  ProductOffer,
  | "offerId"
  | "brandId"
  | "productId"
  | "offerStyle"
  | "offerTitle"
  | "headline"
  | "valueProposition"
  | "keyBenefits"
  | "callToAction"
  | "confidence"
>;

export type StoreContentInput = Pick<
  LandingPageContent,
  | "pageId"
  | "offerId"
  | "brandId"
  | "productId"
  | "heroCopy"
  | "benefitsCopy"
  | "faqCopy"
  | "ctaCopy"
  | "confidence"
>;

export type StoreBlueprintInput = {
  brand: StoreBrandInput;
  portfolio: StorePortfolioInput;
  offer: StoreOfferInput;
  content: StoreContentInput;
};

export type StoreBlueprintBreakdown = StoreBlueprintCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSignal(
  signalType: StoreBlueprintSignalType,
  score: number,
  detail: string,
): StoreBlueprintSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: STORE_BLUEPRINT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function excerpt(text: string, maxLength = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function buildHomepage(
  brand: StoreBrandInput,
  offer: StoreOfferInput,
  content: StoreContentInput,
): StorePage {
  return {
    pageId: `page-home-${brand.brandId}`,
    pageType: "HOME",
    slug: "",
    title: `${brand.brandName} | ${brand.slogan}`,
    headline: offer.headline,
    summary: brand.valueProposition,
    body: [
      content.heroCopy.split("\n\n")[0] ?? content.heroCopy,
      `${brand.brandName} serves ${brand.targetAudience.toLowerCase()} in ${brand.niche.toLowerCase()}.`,
      offer.valueProposition,
    ].join(" "),
    bullets: offer.keyBenefits.slice(0, 3),
    productIds: [offer.productId],
    order: 1,
  };
}

function buildCollectionPage(
  brand: StoreBrandInput,
  collectionType: "hero" | "bundle" | "all",
  products: BrandProduct[],
  order: number,
): StorePage {
  const labels = {
    hero: "Hero Products",
    bundle: "Bundles",
    all: "All Products",
  };
  const headlines = {
    hero: `Shop ${brand.brandName} hero products`,
    bundle: `Save with ${brand.brandName} bundles`,
    all: `Explore the full ${brand.brandName} catalog`,
  };

  return {
    pageId: `page-collection-${collectionType}-${brand.brandId}`,
    pageType: "COLLECTION",
    slug: collectionType === "all" ? "products" : `${collectionType}-products`,
    title: `${labels[collectionType]} | ${brand.brandName}`,
    headline: headlines[collectionType],
    summary: `${brand.brandName} curated ${labels[collectionType].toLowerCase()} for ${brand.targetAudience.toLowerCase()}.`,
    body: `${brand.positioning} Browse ${products.length} ${labels[collectionType].toLowerCase()} selected for ${brand.niche.toLowerCase()}.`,
    bullets: products.map((product) => product.displayName),
    productIds: products.map((product) => product.productId),
    order,
  };
}

function buildProductPage(
  brand: StoreBrandInput,
  product: BrandProduct,
  offer: StoreOfferInput | null,
  content: StoreContentInput | null,
  order: number,
): StorePage {
  const isHero = product.role === "HERO";
  const headline = isHero && offer ? offer.headline : `Shop ${product.displayName}`;
  const body = isHero && content
    ? excerpt(content.benefitsCopy, 280)
    : `${product.displayName} from ${brand.brandName} — ${brand.valueProposition}`;

  return {
    pageId: `page-product-${product.productId}`,
    pageType: "PRODUCT",
    slug: slugify(product.displayName),
    title: `${product.displayName} | ${brand.brandName}`,
    headline,
    summary: `${product.role} product with ${product.productScore}% fit score.`,
    body,
    bullets: isHero && offer ? offer.keyBenefits : [`${product.displayName} for ${brand.niche.toLowerCase()}`],
    productIds: [product.productId],
    order,
  };
}

function buildAboutPage(brand: StoreBrandInput): StorePage {
  return {
    pageId: `page-about-${brand.brandId}`,
    pageType: "ABOUT",
    slug: "about",
    title: `About ${brand.brandName}`,
    headline: `About ${brand.brandName}`,
    summary: brand.slogan,
    body: [
      brand.positioning,
      brand.valueProposition,
      `${brand.brandName} is built for ${brand.targetAudience.toLowerCase()} in ${brand.niche.toLowerCase()}.`,
    ].join(" "),
    bullets: [brand.niche, brand.targetAudience, brand.slogan],
    productIds: [],
    order: 90,
  };
}

function buildFaqPage(brand: StoreBrandInput, content: StoreContentInput): StorePage {
  const faqLines = content.faqCopy
    .split("\n")
    .filter((line) => line.trim().length > 0 && !/^Common questions/i.test(line));

  return {
    pageId: `page-faq-${brand.brandId}`,
    pageType: "FAQ",
    slug: "faq",
    title: `FAQ | ${brand.brandName}`,
    headline: "Frequently asked questions",
    summary: `Answers for ${brand.targetAudience.toLowerCase()} shopping with ${brand.brandName}.`,
    body: excerpt(content.faqCopy, 220),
    bullets: faqLines.slice(0, 5),
    productIds: [],
    order: 91,
  };
}

function buildContactPage(brand: StoreBrandInput, offer: StoreOfferInput): StorePage {
  return {
    pageId: `page-contact-${brand.brandId}`,
    pageType: "CONTACT",
    slug: "contact",
    title: `Contact ${brand.brandName}`,
    headline: `Contact ${brand.brandName}`,
    summary: `Reach ${brand.brandName} for support and order questions.`,
    body: `${brand.brandName} supports ${brand.targetAudience.toLowerCase()}. ${offer.callToAction} or contact us for help.`,
    bullets: [
      `Email: hello@${slugify(brand.brandName)}.com`,
      `Support hours: Mon–Fri 9am–5pm`,
      `Niche: ${brand.niche}`,
    ],
    productIds: [],
    order: 92,
  };
}

function buildNavigation(
  brand: StoreBrandInput,
  collectionPages: StorePage[],
  productPages: StorePage[],
): StoreNavigation {
  const primaryLinks: StoreNavLink[] = [
    { label: "Home", href: "/", order: 1 },
    ...collectionPages.map((page, index) => ({
      label: page.title.split("|")[0]!.trim(),
      href: `/collections/${page.slug}`,
      order: index + 2,
    })),
    { label: "About", href: "/about", order: 10 },
    { label: "FAQ", href: "/faq", order: 11 },
    { label: "Contact", href: "/contact", order: 12 },
  ];

  const footerLinks: StoreNavLink[] = [
    ...primaryLinks,
    ...productPages.slice(0, 3).map((page, index) => ({
      label: page.title.split("|")[0]!.trim(),
      href: `/products/${page.slug}`,
      order: 20 + index,
    })),
  ];

  return {
    storeName: brand.brandName,
    primaryLinks,
    footerLinks,
  };
}

function computeConfidence(
  brand: StoreBrandInput,
  portfolio: StorePortfolioInput,
  offer: StoreOfferInput,
  content: StoreContentInput,
  pages: StorePage[],
): number {
  const pageStructureScore = pages.length >= 5 ? 88 : 65;

  return clampScore(
    brand.confidence * 0.25 +
      portfolio.confidence * 0.25 +
      offer.confidence * 0.2 +
      content.confidence * 0.2 +
      pageStructureScore * 0.1,
  );
}

/** Generates a complete store blueprint from brand, portfolio, offer, and content inputs. */
export function scoreStoreBlueprint(input: StoreBlueprintInput): StoreBlueprintBreakdown {
  const { brand, portfolio, offer, content } = input;

  const homepage = buildHomepage(brand, offer, content);

  const collectionPages = [
    buildCollectionPage(brand, "hero", portfolio.heroProducts, 2),
    buildCollectionPage(brand, "bundle", portfolio.bundleProducts, 3),
    buildCollectionPage(brand, "all", portfolio.recommendedProducts, 4),
  ];

  const productPages = portfolio.recommendedProducts.map((product, index) =>
    buildProductPage(
      brand,
      product,
      product.productId === offer.productId ? offer : null,
      product.productId === offer.productId ? content : null,
      10 + index,
    ),
  );

  const aboutPage = buildAboutPage(brand);
  const faqPage = buildFaqPage(brand, content);
  const contactPage = buildContactPage(brand, offer);
  const navigation = buildNavigation(brand, collectionPages, productPages);

  const allPages = [homepage, ...collectionPages, ...productPages, aboutPage, faqPage, contactPage];
  const confidence = computeConfidence(brand, portfolio, offer, content, allPages);

  const signals: StoreBlueprintSignal[] = [
    buildSignal("brand_alignment", brand.confidence, `Brand ${brand.brandName}`),
    buildSignal(
      "portfolio_coverage",
      portfolio.confidence,
      `${portfolio.recommendedProducts.length} products in portfolio`,
    ),
    buildSignal(
      "offer_alignment",
      offer.confidence,
      `${offer.offerStyle} offer alignment`,
    ),
    buildSignal("content_alignment", content.confidence, "Landing page content alignment"),
    buildSignal(
      "navigation_completeness",
      navigation.primaryLinks.length >= 5 ? 86 : 62,
      `${navigation.primaryLinks.length} primary nav links`,
    ),
    buildSignal(
      "page_structure",
      allPages.length >= 6 ? 84 : 60,
      `${allPages.length} store pages planned`,
    ),
    buildSignal(
      "collection_depth",
      collectionPages.length >= 3 ? 82 : 58,
      `${collectionPages.length} collection pages`,
    ),
    buildSignal("store_composite", confidence, `Store confidence ${confidence}`),
  ];

  return {
    brandId: brand.brandId,
    homepage,
    collectionPages,
    productPages,
    aboutPage,
    faqPage,
    contactPage,
    navigation,
    confidence,
    signals,
  };
}

export const storeBlueprintScoring = {
  scoreStoreBlueprint,
  weights: STORE_BLUEPRINT_SIGNAL_WEIGHTS,
};
