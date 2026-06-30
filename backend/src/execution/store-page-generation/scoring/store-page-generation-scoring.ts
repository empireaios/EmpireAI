import type { LandingPageContent } from "../../landing-page-content-generation/models/landing-page-content.js";
import type { StoreBlueprint } from "../../store-blueprint/models/store-blueprint.js";
import type { StorePage } from "../../store-blueprint/models/store-page.js";
import type { RenderableStorePageCreateInput } from "../models/renderable-store-page.js";
import type { StorePageContent } from "../models/store-page-content.js";
import type { StorePageSignal, StorePageSignalType } from "../models/store-page-signal.js";
import type { StorePageMetadata } from "../models/renderable-store-page.js";

export const STORE_PAGE_SIGNAL_WEIGHTS: Record<StorePageSignalType, number> = {
  blueprint_alignment: 0.2,
  content_alignment: 0.18,
  section_completeness: 0.16,
  metadata_quality: 0.14,
  route_clarity: 0.12,
  render_payload_structure: 0.1,
  page_type_coverage: 0.06,
  page_composite: 0.04,
};

export type StoreBlueprintInput = Pick<
  StoreBlueprint,
  | "storeId"
  | "brandId"
  | "homepage"
  | "collectionPages"
  | "productPages"
  | "aboutPage"
  | "faqPage"
  | "contactPage"
  | "navigation"
  | "confidence"
>;

export type StoreLandingContentInput = Pick<
  LandingPageContent,
  | "pageId"
  | "brandId"
  | "productId"
  | "heroCopy"
  | "problemCopy"
  | "solutionCopy"
  | "benefitsCopy"
  | "offerCopy"
  | "socialProofCopy"
  | "faqCopy"
  | "ctaCopy"
  | "confidence"
>;

export type StorePageGenerationInput = {
  blueprint: StoreBlueprintInput;
  content: StoreLandingContentInput;
};

export type StorePageGenerationBreakdown = {
  storeId: string;
  brandId: string;
  pages: RenderableStorePageCreateInput[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: StorePageSignalType,
  score: number,
  detail: string,
): StorePageSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: STORE_PAGE_SIGNAL_WEIGHTS[signalType],
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

function resolveRoute(page: StorePage): string {
  switch (page.pageType) {
    case "HOME":
      return "/";
    case "PRODUCT":
      return `/products/${page.slug}`;
    case "COLLECTION":
      return `/collections/${page.slug}`;
    case "ABOUT":
      return "/about";
    case "FAQ":
      return "/faq";
    case "CONTACT":
      return "/contact";
    default:
      return `/${page.slug || page.pageId}`;
  }
}

function layoutForPageType(pageType: StorePage["pageType"]): string {
  const layouts: Record<StorePage["pageType"], string> = {
    HOME: "home",
    PRODUCT: "product",
    COLLECTION: "collection",
    ABOUT: "content",
    FAQ: "content",
    CONTACT: "content",
  };
  return layouts[pageType];
}

function buildMetadata(
  page: StorePage,
  storeName: string,
): StorePageMetadata {
  return {
    description: excerpt(page.summary, 160),
    keywords: [storeName, page.pageType, ...page.bullets.slice(0, 3)],
    ogTitle: page.title,
    ogDescription: excerpt(page.summary, 200),
  };
}

function buildHomeSections(
  page: StorePage,
  content: StoreLandingContentInput,
): StorePageContent[] {
  return [
    {
      sectionId: `${page.pageId}-hero`,
      sectionType: "HERO",
      headline: page.headline,
      body: excerpt(content.heroCopy, 320),
      bullets: page.bullets,
      callToAction: null,
      order: 1,
    },
    {
      sectionId: `${page.pageId}-benefits`,
      sectionType: "BULLETS",
      headline: "Featured benefits",
      body: excerpt(content.benefitsCopy, 220),
      bullets: page.bullets,
      callToAction: null,
      order: 2,
    },
    {
      sectionId: `${page.pageId}-cta`,
      sectionType: "CTA",
      headline: "Ready to shop",
      body: excerpt(content.ctaCopy, 180),
      bullets: [],
      callToAction: content.ctaCopy.match(/\[([^\]]+)\]/)?.[1] ?? "Shop now",
      order: 3,
    },
  ];
}

function buildProductSections(
  page: StorePage,
  content: StoreLandingContentInput,
  isHeroProduct: boolean,
): StorePageContent[] {
  const sections: StorePageContent[] = [
    {
      sectionId: `${page.pageId}-hero`,
      sectionType: "HERO",
      headline: page.headline,
      body: isHeroProduct ? excerpt(content.benefitsCopy, 280) : page.body,
      bullets: page.bullets,
      callToAction: null,
      order: 1,
    },
    {
      sectionId: `${page.pageId}-body`,
      sectionType: "BODY",
      headline: page.title.split("|")[0]!.trim(),
      body: page.body,
      bullets: [],
      callToAction: null,
      order: 2,
    },
  ];

  if (isHeroProduct) {
    sections.push({
      sectionId: `${page.pageId}-offer`,
      sectionType: "CTA",
      headline: "Complete your purchase",
      body: excerpt(content.offerCopy, 200),
      bullets: [],
      callToAction: content.ctaCopy.match(/\[([^\]]+)\]/)?.[1] ?? "Buy now",
      order: 3,
    });
  }

  return sections;
}

function buildCollectionSections(page: StorePage): StorePageContent[] {
  return [
    {
      sectionId: `${page.pageId}-hero`,
      sectionType: "HERO",
      headline: page.headline,
      body: page.body,
      bullets: [],
      callToAction: null,
      order: 1,
    },
    {
      sectionId: `${page.pageId}-grid`,
      sectionType: "PRODUCT_GRID",
      headline: "Products in this collection",
      body: page.summary,
      bullets: page.bullets,
      callToAction: null,
      order: 2,
    },
  ];
}

function buildContentSections(
  page: StorePage,
  content: StoreLandingContentInput | null,
): StorePageContent[] {
  if (page.pageType === "FAQ" && content) {
    return [
      {
        sectionId: `${page.pageId}-hero`,
        sectionType: "HERO",
        headline: page.headline,
        body: page.summary,
        bullets: [],
        callToAction: null,
        order: 1,
      },
      {
        sectionId: `${page.pageId}-faq`,
        sectionType: "FAQ",
        headline: "Questions and answers",
        body: excerpt(content.faqCopy, 260),
        bullets: page.bullets.length > 0 ? page.bullets : content.faqCopy.split("\n").slice(0, 5),
        callToAction: null,
        order: 2,
      },
    ];
  }

  if (page.pageType === "CONTACT") {
    return [
      {
        sectionId: `${page.pageId}-hero`,
        sectionType: "HERO",
        headline: page.headline,
        body: page.summary,
        bullets: [],
        callToAction: null,
        order: 1,
      },
      {
        sectionId: `${page.pageId}-contact`,
        sectionType: "CONTACT",
        headline: "Get in touch",
        body: page.body,
        bullets: page.bullets,
        callToAction: null,
        order: 2,
      },
    ];
  }

  return [
    {
      sectionId: `${page.pageId}-hero`,
      sectionType: "HERO",
      headline: page.headline,
      body: page.body,
      bullets: page.bullets,
      callToAction: null,
      order: 1,
    },
    {
      sectionId: `${page.pageId}-body`,
      sectionType: "BODY",
      headline: page.title.split("|")[0]!.trim(),
      body: page.summary,
      bullets: page.bullets,
      callToAction: null,
      order: 2,
    },
  ];
}

function buildSections(
  page: StorePage,
  content: StoreLandingContentInput,
): StorePageContent[] {
  switch (page.pageType) {
    case "HOME":
      return buildHomeSections(page, content);
    case "PRODUCT":
      return buildProductSections(
        page,
        content,
        page.productIds.includes(content.productId),
      );
    case "COLLECTION":
      return buildCollectionSections(page);
    case "FAQ":
    case "CONTACT":
    case "ABOUT":
      return buildContentSections(page, page.pageType === "FAQ" ? content : null);
    default:
      return buildContentSections(page, null);
  }
}

function buildRenderPayload(
  blueprint: StoreBlueprintInput,
  page: StorePage,
  sections: StorePageContent[],
  route: string,
): Record<string, unknown> {
  return {
    version: "1.0",
    layout: layoutForPageType(page.pageType),
    storeId: blueprint.storeId,
    brandId: blueprint.brandId,
    route,
    navigation: {
      storeName: blueprint.navigation.storeName,
      primaryLinks: blueprint.navigation.primaryLinks,
    },
    page: {
      pageId: page.pageId,
      slug: page.slug,
      headline: page.headline,
      productIds: page.productIds,
      order: page.order,
    },
    sections: sections.map((section) => ({
      sectionId: section.sectionId,
      type: section.sectionType,
      headline: section.headline,
      body: section.body,
      bullets: section.bullets,
      callToAction: section.callToAction,
      order: section.order,
    })),
  };
}

function computePageConfidence(
  blueprint: StoreBlueprintInput,
  content: StoreLandingContentInput,
  page: StorePage,
  sections: StorePageContent[],
  metadata: StorePageMetadata,
): number {
  const usesContent =
    page.pageType === "HOME" ||
    page.pageType === "FAQ" ||
    (page.pageType === "PRODUCT" && page.productIds.includes(content.productId));

  const contentWeight = usesContent ? 0.35 : 0.1;
  const blueprintWeight = usesContent ? 0.35 : 0.55;
  const sectionScore = sections.length >= 2 ? 88 : 62;
  const metadataScore = metadata.keywords.length >= 2 && metadata.description.length >= 40 ? 86 : 64;

  return clampScore(
    blueprint.confidence * blueprintWeight +
      content.confidence * contentWeight +
      sectionScore * 0.2 +
      metadataScore * 0.1,
  );
}

function buildPageSignals(
  blueprint: StoreBlueprintInput,
  content: StoreLandingContentInput,
  page: StorePage,
  sections: StorePageContent[],
  metadata: StorePageMetadata,
  confidence: number,
): StorePageSignal[] {
  const usesContent =
    page.pageType === "HOME" ||
    page.pageType === "FAQ" ||
    (page.pageType === "PRODUCT" && page.productIds.includes(content.productId));

  return [
    buildSignal("blueprint_alignment", blueprint.confidence, `Blueprint ${page.pageType} page`),
    buildSignal(
      "content_alignment",
      usesContent ? content.confidence : clampScore(blueprint.confidence * 0.7),
      usesContent ? "Landing page content applied" : "Blueprint-only page content",
    ),
    buildSignal(
      "section_completeness",
      sections.length >= 2 ? 86 : 58,
      `${sections.length} render sections`,
    ),
    buildSignal(
      "metadata_quality",
      metadata.description.length >= 40 ? 84 : 60,
      "SEO metadata generated",
    ),
    buildSignal("route_clarity", page.slug || page.pageType === "HOME" ? 88 : 72, resolveRoute(page)),
    buildSignal(
      "render_payload_structure",
      sections.every((section) => section.headline.length > 0) ? 85 : 62,
      "Render payload blocks structured",
    ),
    buildSignal("page_type_coverage", 90, `Page type ${page.pageType}`),
    buildSignal("page_composite", confidence, `Page confidence ${confidence}`),
  ];
}

function renderBlueprintPage(
  blueprint: StoreBlueprintInput,
  content: StoreLandingContentInput,
  page: StorePage,
): RenderableStorePageCreateInput {
  const route = resolveRoute(page);
  const sections = buildSections(page, content);
  const metadata = buildMetadata(page, blueprint.navigation.storeName);
  const confidence = computePageConfidence(blueprint, content, page, sections, metadata);
  const signals = buildPageSignals(blueprint, content, page, sections, metadata, confidence);

  return {
    storeId: blueprint.storeId,
    brandId: blueprint.brandId,
    pageId: page.pageId,
    route,
    pageType: page.pageType,
    title: page.title,
    metadata,
    sections,
    renderPayload: buildRenderPayload(blueprint, page, sections, route),
    confidence,
    signals,
  };
}

function collectBlueprintPages(blueprint: StoreBlueprintInput): StorePage[] {
  return [
    blueprint.homepage,
    ...blueprint.collectionPages,
    ...blueprint.productPages,
    blueprint.aboutPage,
    blueprint.faqPage,
    blueprint.contactPage,
  ];
}

/** Generates renderable storefront pages from a store blueprint and landing page content. */
export function scoreStorePageGeneration(
  input: StorePageGenerationInput,
): StorePageGenerationBreakdown {
  const { blueprint, content } = input;
  const pages = collectBlueprintPages(blueprint).map((page) =>
    renderBlueprintPage(blueprint, content, page),
  );

  return {
    storeId: blueprint.storeId,
    brandId: blueprint.brandId,
    pages,
  };
}

export const storePageGenerationScoring = {
  scoreStorePageGeneration,
  weights: STORE_PAGE_SIGNAL_WEIGHTS,
};
