import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { KeywordCluster } from "../models/keyword-cluster.js";
import type { SearchIntentMapping } from "../models/search-intent.js";
import type {
  CanonicalUrl,
  OpenGraphMeta,
  SeoTitleTag,
  SeoMetaDescription,
  TwitterCardMeta,
} from "../models/seo-meta.js";
import type { SeoProfileCreateInput } from "../models/seo-profile.js";
import type { SeoRecommendation } from "../models/seo-recommendation.js";
import type { SeoSignal, SeoSignalType } from "../models/seo-signal.js";
import type {
  InternalLinkRecommendation,
  RobotsModel,
  SitemapModel,
} from "../models/seo-site-models.js";
import type { SeoContentRecommendation, TopicalAuthorityMap } from "../models/seo-content.js";
import type { StructuredDataBlock } from "../models/structured-data.js";

export const SEO_SIGNAL_WEIGHTS: Record<SeoSignalType, number> = {
  keyword_coverage: 0.2,
  intent_alignment: 0.16,
  metadata_quality: 0.18,
  structured_data: 0.14,
  internal_linking: 0.12,
  topical_authority: 0.12,
  profile_composite: 0.08,
};

export type SeoIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type SeoIntelligenceOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
};

export type SeoStorePageInput = {
  path: string;
  title: string;
  pageType: string;
};

export type SeoIntelligenceInput = {
  brand: SeoIntelligenceBrandInput;
  offer: SeoIntelligenceOfferInput;
  storeId: string;
  storeName?: string;
  baseUrl?: string;
  pages?: SeoStorePageInput[];
};

export type SeoIntelligenceBreakdown = SeoProfileCreateInput;

const DEFAULT_PAGES: SeoStorePageInput[] = [
  { path: "/", title: "Home", pageType: "homepage" },
  { path: "/collections/all", title: "Shop All", pageType: "collection" },
  { path: "/products/hero-offer", title: "Hero Product", pageType: "product" },
  { path: "/about", title: "About", pageType: "about" },
  { path: "/faq", title: "FAQ", pageType: "faq" },
  { path: "/contact", title: "Contact", pageType: "contact" },
];

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function excerpt(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function buildSignal(signalType: SeoSignalType, score: number, detail: string): SeoSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: SEO_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveBaseUrl(input: SeoIntelligenceInput): string {
  if (input.baseUrl) return input.baseUrl.replace(/\/+$/, "");
  const slug = slugify(input.storeName ?? input.brand.brandName);
  return `https://${slug}.empireai.store`;
}

function resolvePages(input: SeoIntelligenceInput): SeoStorePageInput[] {
  return input.pages?.length ? input.pages : DEFAULT_PAGES;
}

function buildKeywordClusters(input: SeoIntelligenceInput): KeywordCluster[] {
  const { brand, offer } = input;
  const niche = brand.niche.toLowerCase();

  return [
    {
      clusterId: randomUUID(),
      name: "Brand + Product",
      primaryKeyword: `${brand.brandName} ${offer.offerTitle}`,
      keywords: [
        brand.brandName,
        offer.offerTitle,
        `${brand.brandName} ${niche}`,
        offer.headline.split(" ").slice(0, 4).join(" "),
      ],
      searchIntent: "TRANSACTIONAL",
      priority: 1,
      rationale: "Core branded product queries with purchase intent.",
    },
    {
      clusterId: randomUUID(),
      name: "Category Discovery",
      primaryKeyword: `best ${niche}`,
      keywords: [
        `best ${niche}`,
        `${niche} online`,
        `buy ${niche}`,
        `${brand.targetAudience} ${niche}`,
      ],
      searchIntent: "COMMERCIAL",
      priority: 2,
      rationale: "Category-level commercial investigation queries.",
    },
    {
      clusterId: randomUUID(),
      name: "Problem Solution",
      primaryKeyword: offer.keyBenefits[0]?.slice(0, 40) ?? offer.valueProposition.slice(0, 40),
      keywords: [
        ...offer.keyBenefits.slice(0, 3),
        offer.valueProposition,
        `${niche} benefits`,
      ],
      searchIntent: "INFORMATIONAL",
      priority: 3,
      rationale: "Educational queries aligned with offer benefits.",
    },
    {
      clusterId: randomUUID(),
      name: "Brand Navigational",
      primaryKeyword: brand.brandName,
      keywords: [brand.brandName, `${brand.brandName} store`, brand.slogan],
      searchIntent: "NAVIGATIONAL",
      priority: 4,
      rationale: "Brand-aware users seeking the official store.",
    },
  ];
}

function buildSearchIntentMappings(
  input: SeoIntelligenceInput,
  clusters: KeywordCluster[],
  pages: SeoStorePageInput[],
): SearchIntentMapping[] {
  const mappings: SearchIntentMapping[] = clusters.map((cluster) => ({
    target: cluster.primaryKeyword,
    intent: cluster.searchIntent,
    rationale: cluster.rationale,
  }));

  for (const page of pages) {
    const intent =
      page.pageType === "product"
        ? "TRANSACTIONAL"
        : page.pageType === "collection"
          ? "COMMERCIAL"
          : page.pageType === "faq" || page.pageType === "about"
            ? "INFORMATIONAL"
            : "NAVIGATIONAL";

    mappings.push({
      target: page.path,
      intent,
      rationale: `${page.pageType} page mapped to ${intent} intent.`,
    });
  }

  mappings.push({
    target: input.offer.callToAction,
    intent: "TRANSACTIONAL",
    rationale: "Primary CTA aligns with transactional conversion intent.",
  });

  return mappings;
}

function buildTitleTags(
  input: SeoIntelligenceInput,
  pages: SeoStorePageInput[],
): SeoTitleTag[] {
  const { brand, offer } = input;

  return pages.map((page) => {
    let titleTag = brand.brandName;
    if (page.pageType === "homepage") {
      titleTag = `${brand.brandName} | ${offer.offerTitle}`;
    } else if (page.pageType === "product") {
      titleTag = `${offer.offerTitle} | ${brand.brandName}`;
    } else if (page.pageType === "collection") {
      titleTag = `Shop ${brand.niche} | ${brand.brandName}`;
    } else {
      titleTag = `${page.title} | ${brand.brandName}`;
    }

    return {
      pagePath: page.path,
      pageType: page.pageType,
      titleTag: excerpt(titleTag, 60),
    };
  });
}

function buildMetaDescriptions(
  input: SeoIntelligenceInput,
  pages: SeoStorePageInput[],
): SeoMetaDescription[] {
  const { brand, offer } = input;

  return pages.map((page) => {
    let description = offer.valueProposition;
    if (page.pageType === "homepage") {
      description = `${offer.headline} ${brand.slogan}. ${offer.callToAction}.`;
    } else if (page.pageType === "product") {
      description = `${offer.offerTitle}: ${offer.keyBenefits.join(". ")}. ${offer.callToAction}.`;
    } else if (page.pageType === "faq") {
      description = `Answers about ${offer.offerTitle}, shipping, and ${brand.niche}.`;
    } else if (page.pageType === "about") {
      description = `${brand.brandName} — ${brand.positioning}. ${brand.slogan}.`;
    }

    return {
      pagePath: page.path,
      pageType: page.pageType,
      metaDescription: excerpt(description, 155),
    };
  });
}

function buildCanonicalUrls(baseUrl: string, pages: SeoStorePageInput[]): CanonicalUrl[] {
  return pages.map((page) => ({
    pagePath: page.path,
    canonicalUrl: `${baseUrl}${page.path === "/" ? "" : page.path}`,
  }));
}

function buildOpenGraph(
  input: SeoIntelligenceInput,
  baseUrl: string,
  pages: SeoStorePageInput[],
  titleTags: SeoTitleTag[],
  metaDescriptions: SeoMetaDescription[],
): OpenGraphMeta[] {
  const imageBase = `${baseUrl}/og`;

  return pages.map((page) => {
    const title = titleTags.find((entry) => entry.pagePath === page.path)?.titleTag ?? page.title;
    const description =
      metaDescriptions.find((entry) => entry.pagePath === page.path)?.metaDescription ??
      input.offer.valueProposition;

    return {
      pagePath: page.path,
      ogTitle: title,
      ogDescription: description,
      ogType: page.pageType === "product" ? "product" : "website",
      ogUrl: `${baseUrl}${page.path === "/" ? "" : page.path}`,
      ogImage: `${imageBase}${page.path.replace(/\//g, "-") || "-home"}.jpg`,
    };
  });
}

function buildTwitterCards(
  openGraph: OpenGraphMeta[],
): TwitterCardMeta[] {
  return openGraph.map((og) => ({
    pagePath: og.pagePath,
    cardType: og.pagePath === "/" || og.pagePath.includes("product") ? "summary_large_image" : "summary",
    title: og.ogTitle,
    description: og.ogDescription,
    image: og.ogImage,
  }));
}

function buildStructuredData(
  input: SeoIntelligenceInput,
  baseUrl: string,
  pages: SeoStorePageInput[],
): StructuredDataBlock[] {
  const { brand, offer } = input;
  const blocks: StructuredDataBlock[] = [];

  blocks.push({
    pagePath: "/",
    schemaType: "WebSite",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brand.brandName,
      url: baseUrl,
      description: brand.positioning,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });

  blocks.push({
    pagePath: "/",
    schemaType: "Organization",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brand.brandName,
      url: baseUrl,
      slogan: brand.slogan,
      description: brand.positioning,
    },
  });

  const productPage = pages.find((page) => page.pageType === "product");
  if (productPage) {
    blocks.push({
      pagePath: productPage.path,
      schemaType: "Product",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: offer.offerTitle,
        description: offer.valueProposition,
        brand: { "@type": "Brand", name: brand.brandName },
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          url: `${baseUrl}${productPage.path}`,
        },
      },
    });
  }

  blocks.push({
    pagePath: "/",
    schemaType: "BreadcrumbList",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: pages.slice(0, 4).map((page, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: page.title,
        item: `${baseUrl}${page.path === "/" ? "" : page.path}`,
      })),
    },
  });

  return blocks;
}

function buildInternalLinking(pages: SeoStorePageInput[], input: SeoIntelligenceInput): InternalLinkRecommendation[] {
  const homepage = pages.find((page) => page.pageType === "homepage")?.path ?? "/";
  const product = pages.find((page) => page.pageType === "product")?.path ?? "/products/hero-offer";
  const collection = pages.find((page) => page.pageType === "collection")?.path ?? "/collections/all";
  const faq = pages.find((page) => page.pageType === "faq")?.path ?? "/faq";
  const about = pages.find((page) => page.pageType === "about")?.path ?? "/about";

  return [
    {
      fromPath: homepage,
      toPath: product,
      anchorText: input.offer.offerTitle,
      rationale: "Homepage should link to hero product with primary keyword anchor.",
    },
    {
      fromPath: homepage,
      toPath: collection,
      anchorText: `Shop ${input.brand.niche}`,
      rationale: "Homepage collection link supports category discovery.",
    },
    {
      fromPath: product,
      toPath: faq,
      anchorText: "Product FAQ",
      rationale: "Product page FAQ link reduces bounce and supports informational intent.",
    },
    {
      fromPath: about,
      toPath: product,
      anchorText: input.offer.callToAction,
      rationale: "About page CTA link converts brand trust into product interest.",
    },
    {
      fromPath: collection,
      toPath: product,
      anchorText: input.offer.headline.slice(0, 40),
      rationale: "Collection pages should funnel to hero product.",
    },
  ];
}

function buildSitemapModel(baseUrl: string, pages: SeoStorePageInput[]): SitemapModel {
  const now = new Date().toISOString().split("T")[0]!;

  return {
    indexUrl: `${baseUrl}/sitemap.xml`,
    entries: pages.map((page) => ({
      loc: `${baseUrl}${page.path === "/" ? "" : page.path}`,
      lastmod: now,
      changefreq:
        page.pageType === "homepage"
          ? "daily"
          : page.pageType === "product" || page.pageType === "collection"
            ? "weekly"
            : "monthly",
      priority: page.pageType === "homepage" ? 1 : page.pageType === "product" ? 0.9 : 0.7,
    })),
  };
}

function buildRobotsModel(baseUrl: string, sitemap: SitemapModel): RobotsModel {
  return {
    sitemapUrl: sitemap.indexUrl,
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/cart", "/checkout", "/account", "/admin"],
      },
    ],
  };
}

function buildContentRecommendations(
  input: SeoIntelligenceInput,
  clusters: KeywordCluster[],
): SeoContentRecommendation[] {
  const { brand, offer } = input;

  return [
    {
      recommendationId: randomUUID(),
      title: `${brand.niche} Buyer's Guide`,
      targetKeyword: clusters[1]!.primaryKeyword,
      contentType: "blog-guide",
      priority: 1,
      rationale: "Pillar content for commercial investigation cluster.",
    },
    {
      recommendationId: randomUUID(),
      title: `How ${offer.offerTitle} Solves Common ${brand.niche} Problems`,
      targetKeyword: clusters[2]!.primaryKeyword,
      contentType: "blog-article",
      priority: 2,
      rationale: "Informational content supporting problem-solution cluster.",
    },
    {
      recommendationId: randomUUID(),
      title: `${brand.brandName} vs Alternatives`,
      targetKeyword: `best ${brand.niche.toLowerCase()}`,
      contentType: "comparison-page",
      priority: 3,
      rationale: "Comparison content captures commercial intent traffic.",
    },
    {
      recommendationId: randomUUID(),
      title: "Customer Success Stories",
      targetKeyword: `${brand.brandName} reviews`,
      contentType: "social-proof-page",
      priority: 4,
      rationale: "Social proof supports transactional conversion keywords.",
    },
  ];
}

function buildTopicalAuthorityMap(
  input: SeoIntelligenceInput,
  clusters: KeywordCluster[],
  pages: SeoStorePageInput[],
): TopicalAuthorityMap {
  const productPath = pages.find((page) => page.pageType === "product")?.path ?? "/products/hero-offer";
  const collectionPath = pages.find((page) => page.pageType === "collection")?.path ?? "/collections/all";
  const aboutPath = pages.find((page) => page.pageType === "about")?.path ?? "/about";
  const faqPath = pages.find((page) => page.pageType === "faq")?.path ?? "/faq";

  return {
    primaryTopic: input.brand.niche,
    nodes: [
      {
        nodeId: randomUUID(),
        topic: clusters[0]!.name,
        pillarPage: productPath,
        supportingPages: ["/", collectionPath],
        authorityScore: 88,
      },
      {
        nodeId: randomUUID(),
        topic: clusters[1]!.name,
        pillarPage: collectionPath,
        supportingPages: [productPath, aboutPath],
        authorityScore: 82,
      },
      {
        nodeId: randomUUID(),
        topic: clusters[2]!.name,
        pillarPage: faqPath,
        supportingPages: [aboutPath, productPath],
        authorityScore: 76,
      },
    ],
  };
}

function computeSeoConfidence(
  input: SeoIntelligenceInput,
  clusters: KeywordCluster[],
  titleTags: SeoTitleTag[],
  metaDescriptions: SeoMetaDescription[],
  structuredData: StructuredDataBlock[],
  internalLinking: InternalLinkRecommendation[],
  topicalAuthority: TopicalAuthorityMap,
  signals: SeoSignal[],
): number {
  return clampScore(
    input.brand.confidence * 0.25 +
      clusters.length * 8 +
      (titleTags.every((entry) => entry.titleTag.length <= 60) ? 85 : 70) * 0.15 +
      (metaDescriptions.every((entry) => entry.metaDescription.length <= 155) ? 88 : 72) * 0.15 +
      structuredData.length * 5 +
      internalLinking.length * 4 +
      average(topicalAuthority.nodes.map((node) => node.authorityScore)) * 0.15 +
      average(signals.map((signal) => signal.score)) * 0.1,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSeoRecommendations(
  input: SeoIntelligenceInput,
  confidence: number,
): SeoRecommendation[] {
  const recommendations: SeoRecommendation[] = [
    {
      recommendationId: randomUUID(),
      priority: "HIGH",
      category: "metadata",
      title: "Deploy title tags and meta descriptions",
      action: "Apply generated title tags and meta descriptions to all store pages before launch.",
      expectedImpact: "Improves SERP click-through and index clarity.",
    },
    {
      recommendationId: randomUUID(),
      priority: "HIGH",
      category: "structured-data",
      title: "Embed JSON-LD structured data",
      action: "Add Product, Organization, WebSite, and BreadcrumbList JSON-LD blocks to templates.",
      expectedImpact: "Enables rich results and clearer entity understanding.",
    },
    {
      recommendationId: randomUUID(),
      priority: "MEDIUM",
      category: "internal-linking",
      title: "Implement internal linking plan",
      action: "Wire homepage → product → FAQ links with recommended anchor text.",
      expectedImpact: "Distributes PageRank and supports crawl paths.",
    },
    {
      recommendationId: randomUUID(),
      priority: "MEDIUM",
      category: "content",
      title: "Publish pillar content recommendations",
      action: "Create buyer's guide and comparison pages from content recommendations.",
      expectedImpact: "Builds topical authority for commercial keywords.",
    },
    {
      recommendationId: randomUUID(),
      priority: confidence >= 80 ? "LOW" : "HIGH",
      category: "technical",
      title: "Validate sitemap and robots.txt",
      action: "Ensure sitemap.xml and robots.txt match generated models before indexing.",
      expectedImpact: "Prevents crawl waste and indexing errors.",
    },
  ];

  return recommendations;
}

function buildSignals(
  input: SeoIntelligenceInput,
  clusters: KeywordCluster[],
  intentMappings: SearchIntentMapping[],
  titleTags: SeoTitleTag[],
  metaDescriptions: SeoMetaDescription[],
  structuredData: StructuredDataBlock[],
  internalLinking: InternalLinkRecommendation[],
  topicalAuthority: TopicalAuthorityMap,
  confidence: number,
): SeoSignal[] {
  return [
    buildSignal("keyword_coverage", clampScore(clusters.length * 22), `${clusters.length} keyword clusters`),
    buildSignal(
      "intent_alignment",
      clampScore(intentMappings.length * 8),
      `${intentMappings.length} intent mappings`,
    ),
    buildSignal(
      "metadata_quality",
      clampScore(average(titleTags.map((entry) => (entry.titleTag.length > 0 ? 85 : 0)))),
      `${titleTags.length} title tags generated`,
    ),
    buildSignal(
      "structured_data",
      clampScore(structuredData.length * 20),
      `${structuredData.length} JSON-LD blocks`,
    ),
    buildSignal(
      "internal_linking",
      clampScore(internalLinking.length * 18),
      `${internalLinking.length} internal links recommended`,
    ),
    buildSignal(
      "topical_authority",
      clampScore(average(topicalAuthority.nodes.map((node) => node.authorityScore))),
      `Primary topic: ${topicalAuthority.primaryTopic}`,
    ),
    buildSignal("profile_composite", confidence, `SEO confidence ${confidence}`),
  ];
}

function buildProfileName(brand: SeoIntelligenceBrandInput, storeId: string): string {
  return `${brand.brandName} SEO Profile (${storeId.slice(0, 8)})`;
}

/** Generates a complete SEO strategy profile for a manufactured store. */
export function generateSeoIntelligence(input: SeoIntelligenceInput): SeoIntelligenceBreakdown {
  const baseUrl = resolveBaseUrl(input);
  const pages = resolvePages(input);
  const keywordClusters = buildKeywordClusters(input);
  const searchIntentMappings = buildSearchIntentMappings(input, keywordClusters, pages);
  const titleTags = buildTitleTags(input, pages);
  const metaDescriptions = buildMetaDescriptions(input, pages);
  const canonicalUrls = buildCanonicalUrls(baseUrl, pages);
  const openGraph = buildOpenGraph(input, baseUrl, pages, titleTags, metaDescriptions);
  const twitterCards = buildTwitterCards(openGraph);
  const structuredData = buildStructuredData(input, baseUrl, pages);
  const internalLinking = buildInternalLinking(pages, input);
  const sitemap = buildSitemapModel(baseUrl, pages);
  const robots = buildRobotsModel(baseUrl, sitemap);
  const contentRecommendations = buildContentRecommendations(input, keywordClusters);
  const topicalAuthorityMap = buildTopicalAuthorityMap(input, keywordClusters, pages);

  const provisionalSignals = buildSignals(
    input,
    keywordClusters,
    searchIntentMappings,
    titleTags,
    metaDescriptions,
    structuredData,
    internalLinking,
    topicalAuthorityMap,
    0,
  );
  const seoConfidence = computeSeoConfidence(
    input,
    keywordClusters,
    titleTags,
    metaDescriptions,
    structuredData,
    internalLinking,
    topicalAuthorityMap,
    provisionalSignals,
  );
  const signals = buildSignals(
    input,
    keywordClusters,
    searchIntentMappings,
    titleTags,
    metaDescriptions,
    structuredData,
    internalLinking,
    topicalAuthorityMap,
    seoConfidence,
  );
  const seoRecommendations = buildSeoRecommendations(input, seoConfidence);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    profileName: buildProfileName(input.brand, input.storeId),
    baseUrl,
    keywordClusters,
    searchIntentMappings,
    titleTags,
    metaDescriptions,
    canonicalUrls,
    openGraph,
    twitterCards,
    structuredData,
    internalLinking,
    sitemap,
    robots,
    contentRecommendations,
    topicalAuthorityMap,
    seoConfidence,
    seoRecommendations,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
  };
}

export const seoIntelligenceScoring = {
  generateSeoIntelligence,
  weights: SEO_SIGNAL_WEIGHTS,
};
