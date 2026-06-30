import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { BlogStrategy } from "../models/blog-strategy.js";
import type { ContentLibraryCreateInput } from "../models/content-library.js";
import type {
  ContentLibrarySignal,
  ContentLibrarySignalType,
  SeoCoverageReport,
} from "../models/content-library-metrics.js";
import type {
  BuyingGuide,
  ComparisonPage,
  EvergreenContent,
  FaqExpansion,
} from "../models/content-formats.js";
import type { PillarPage, SupportingArticle } from "../models/content-pages.js";
import type { PublishingSchedule, PublishingScheduleEntry } from "../models/publishing-schedule.js";
import type { TopicalCluster } from "../models/topical-cluster.js";

export const CONTENT_LIBRARY_SIGNAL_WEIGHTS: Record<ContentLibrarySignalType, number> = {
  strategy_strength: 0.2,
  cluster_coverage: 0.18,
  pillar_depth: 0.16,
  format_diversity: 0.14,
  schedule_readiness: 0.12,
  seo_coverage: 0.12,
  library_composite: 0.08,
};

export type ContentLibraryBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type ContentLibraryOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
};

export type ContentLibraryInput = {
  brand: ContentLibraryBrandInput;
  offer: ContentLibraryOfferInput;
  storeId: string;
  scheduleWeeks?: number;
};

export type ContentLibraryBreakdown = ContentLibraryCreateInput;

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

function buildSignal(
  signalType: ContentLibrarySignalType,
  score: number,
  detail: string,
): ContentLibrarySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CONTENT_LIBRARY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildBlogStrategy(input: ContentLibraryInput): BlogStrategy {
  const { brand, offer } = input;

  return {
    strategyId: randomUUID(),
    objective: `Build topical authority in ${brand.niche} and drive ${offer.callToAction.toLowerCase()} conversions.`,
    targetAudience: brand.targetAudience,
    contentPillars: [
      brand.niche,
      offer.offerTitle,
      "Buyer's guides",
      "Product comparisons",
      "FAQ & support",
    ],
    publishingCadence: "2 pillar/supporting pieces per week + 1 evergreen refresh monthly",
    toneOfVoice: `${brand.positioning} — helpful, trustworthy, conversion-aware`,
    primaryGoals: [
      "Capture informational search traffic",
      "Support commercial investigation queries",
      "Strengthen internal linking to product pages",
      "Expand FAQ coverage for long-tail keywords",
    ],
  };
}

function buildTopicalClusters(input: ContentLibraryInput): TopicalCluster[] {
  const { brand, offer } = input;
  const niche = brand.niche.toLowerCase();

  return [
    {
      clusterId: randomUUID(),
      name: "Product Authority",
      primaryKeyword: `${brand.brandName} ${offer.offerTitle}`,
      relatedKeywords: [brand.brandName, offer.offerTitle, `${niche} reviews`],
      searchIntent: "COMMERCIAL",
      priority: 1,
    },
    {
      clusterId: randomUUID(),
      name: "Category Education",
      primaryKeyword: `how to choose ${niche}`,
      relatedKeywords: [`best ${niche}`, `${niche} guide`, `${niche} tips`],
      searchIntent: "INFORMATIONAL",
      priority: 2,
    },
    {
      clusterId: randomUUID(),
      name: "Problem Solution",
      primaryKeyword: offer.keyBenefits[0]?.slice(0, 48) ?? offer.valueProposition.slice(0, 48),
      relatedKeywords: offer.keyBenefits.slice(0, 3),
      searchIntent: "INFORMATIONAL",
      priority: 3,
    },
    {
      clusterId: randomUUID(),
      name: "Purchase Decision",
      primaryKeyword: `${brand.brandName} vs alternatives`,
      relatedKeywords: [`${niche} comparison`, "best value", offer.callToAction],
      searchIntent: "TRANSACTIONAL",
      priority: 4,
    },
  ];
}

function buildPillarPages(
  input: ContentLibraryInput,
  clusters: TopicalCluster[],
): PillarPage[] {
  const { brand, offer } = input;

  return clusters.map((cluster) => ({
    pageId: randomUUID(),
    title:
      cluster.searchIntent === "COMMERCIAL"
        ? `Complete Guide to ${offer.offerTitle}`
        : cluster.searchIntent === "TRANSACTIONAL"
          ? `${brand.brandName} vs Alternatives: Which Is Best?`
          : `The Ultimate ${brand.niche} Guide`,
    slug: `/blog/pillar/${slugify(cluster.name)}`,
    clusterId: cluster.clusterId,
    targetKeyword: cluster.primaryKeyword,
    outline: [
      "Introduction and audience pain points",
      `Why ${brand.brandName} matters in ${brand.niche}`,
      "Key benefits and proof points",
      "How to evaluate options",
      `Recommended next step: ${offer.callToAction}`,
    ],
    wordCountTarget: 2200,
    internalLinks: ["/", "/products/hero-offer", "/faq"],
  }));
}

function buildSupportingArticles(
  input: ContentLibraryInput,
  pillars: PillarPage[],
): SupportingArticle[] {
  const { brand, offer } = input;
  const articles: SupportingArticle[] = [];

  for (const pillar of pillars) {
    articles.push(
      {
        articleId: randomUUID(),
        title: `5 Reasons ${offer.offerTitle} Stands Out in ${brand.niche}`,
        slug: `/blog/${slugify(pillar.slug)}/reasons`,
        pillarPageId: pillar.pageId,
        targetKeyword: `${offer.offerTitle} benefits`,
        angle: "Benefit-led supporting content",
        wordCountTarget: 900,
      },
      {
        articleId: randomUUID(),
        title: `What ${brand.targetAudience} Should Know Before Buying`,
        slug: `/blog/${slugify(pillar.slug)}/buying-tips`,
        pillarPageId: pillar.pageId,
        targetKeyword: `buying ${brand.niche.toLowerCase()}`,
        angle: "Pre-purchase education",
        wordCountTarget: 800,
      },
    );
  }

  return articles;
}

function buildFaqExpansions(input: ContentLibraryInput): FaqExpansion[] {
  const { brand, offer } = input;

  return [
    {
      faqId: randomUUID(),
      question: `What makes ${brand.brandName} different?`,
      answerOutline: [brand.positioning, offer.valueProposition, brand.slogan],
      targetKeyword: `${brand.brandName} difference`,
      category: "Brand",
    },
    {
      faqId: randomUUID(),
      question: `Is ${offer.offerTitle} worth it?`,
      answerOutline: offer.keyBenefits,
      targetKeyword: `${offer.offerTitle} worth it`,
      category: "Product",
    },
    {
      faqId: randomUUID(),
      question: `How fast does ${brand.brandName} ship?`,
      answerOutline: ["Shipping timelines", "Tracking", "Support contact"],
      targetKeyword: `${brand.brandName} shipping`,
      category: "Logistics",
    },
    {
      faqId: randomUUID(),
      question: `Who is ${offer.offerTitle} best for?`,
      answerOutline: [brand.targetAudience, offer.keyBenefits[0] ?? offer.valueProposition],
      targetKeyword: `${offer.offerTitle} for ${brand.targetAudience.toLowerCase()}`,
      category: "Audience",
    },
  ];
}

function buildBuyingGuides(input: ContentLibraryInput): BuyingGuide[] {
  const { brand, offer } = input;

  return [
    {
      guideId: randomUUID(),
      title: `${brand.niche} Buyer's Guide ${new Date().getFullYear()}`,
      slug: `/blog/buying-guide/${slugify(brand.niche)}`,
      targetKeyword: `best ${brand.niche.toLowerCase()} buying guide`,
      sections: [
        "What to look for",
        "Common mistakes",
        "Budget tiers",
        "Top picks",
        "Final checklist",
      ],
      recommendedProducts: [offer.offerTitle],
      callToAction: offer.callToAction,
    },
    {
      guideId: randomUUID(),
      title: `How to Choose the Right ${offer.offerTitle}`,
      slug: `/blog/buying-guide/${slugify(offer.offerTitle)}`,
      targetKeyword: `how to choose ${offer.offerTitle.toLowerCase()}`,
      sections: ["Use cases", "Feature checklist", "Brand trust signals", "Where to buy"],
      recommendedProducts: [offer.offerTitle],
      callToAction: offer.callToAction,
    },
  ];
}

function buildComparisonPages(input: ContentLibraryInput): ComparisonPage[] {
  const { brand, offer } = input;

  return [
    {
      comparisonId: randomUUID(),
      title: `${brand.brandName} vs Generic ${brand.niche} Alternatives`,
      slug: `/blog/compare/${slugify(brand.brandName)}-vs-alternatives`,
      targetKeyword: `${brand.brandName} vs alternatives`,
      comparedItems: [brand.brandName, `Generic ${brand.niche}`, "Budget alternatives"],
      criteria: ["Quality", "Price", "Trust", "Support", "Shipping"],
      verdict: `${brand.brandName} wins on ${offer.keyBenefits[0]?.toLowerCase() ?? "quality"} and brand trust.`,
    },
    {
      comparisonId: randomUUID(),
      title: `Top ${brand.niche} Options Compared`,
      slug: `/blog/compare/top-${slugify(brand.niche)}`,
      targetKeyword: `best ${brand.niche.toLowerCase()} compared`,
      comparedItems: [offer.offerTitle, "Competitor A", "Competitor B"],
      criteria: offer.keyBenefits.slice(0, 3),
      verdict: `${offer.offerTitle} offers the strongest balance of value and ${brand.positioning.toLowerCase()}.`,
    },
  ];
}

function buildEvergreenContent(input: ContentLibraryInput): EvergreenContent[] {
  const { brand, offer } = input;

  return [
    {
      contentId: randomUUID(),
      title: `What Is ${brand.niche}? A Complete Overview`,
      slug: `/blog/evergreen/what-is-${slugify(brand.niche)}`,
      contentType: "explainer",
      refreshCadenceMonths: 6,
      targetKeyword: `what is ${brand.niche.toLowerCase()}`,
      summary: `Evergreen explainer anchoring ${brand.niche} topical cluster.`,
    },
    {
      contentId: randomUUID(),
      title: `${offer.offerTitle}: Everything You Need to Know`,
      slug: `/blog/evergreen/${slugify(offer.offerTitle)}-guide`,
      contentType: "product-guide",
      refreshCadenceMonths: 4,
      targetKeyword: `${offer.offerTitle} guide`,
      summary: "Long-lived product guide with quarterly refresh cadence.",
    },
    {
      contentId: randomUUID(),
      title: `${brand.brandName} Glossary of Terms`,
      slug: `/blog/evergreen/${slugify(brand.brandName)}-glossary`,
      contentType: "glossary",
      refreshCadenceMonths: 12,
      targetKeyword: `${brand.niche} glossary`,
      summary: "Reference content supporting informational queries year-round.",
    },
  ];
}

function buildPublishingSchedule(
  input: ContentLibraryInput,
  pillars: PillarPage[],
  supportingArticles: SupportingArticle[],
  buyingGuides: BuyingGuide[],
  comparisonPages: ComparisonPage[],
  evergreenContent: EvergreenContent[],
): PublishingSchedule {
  const totalWeeks = input.scheduleWeeks ?? 8;
  const entries: PublishingScheduleEntry[] = [];

  const queue: Array<{ title: string; type: string; priority: PublishingScheduleEntry["priority"] }> = [
    ...pillars.map((page) => ({
      title: page.title,
      type: "pillar-page",
      priority: "HIGH" as const,
    })),
    ...supportingArticles.map((article) => ({
      title: article.title,
      type: "supporting-article",
      priority: "MEDIUM" as const,
    })),
    ...buyingGuides.map((guide) => ({
      title: guide.title,
      type: "buying-guide",
      priority: "HIGH" as const,
    })),
    ...comparisonPages.map((page) => ({
      title: page.title,
      type: "comparison-page",
      priority: "MEDIUM" as const,
    })),
    ...evergreenContent.map((content) => ({
      title: content.title,
      type: "evergreen",
      priority: "LOW" as const,
    })),
  ];

  let week = 1;
  for (const item of queue) {
    entries.push({
      entryId: randomUUID(),
      contentTitle: item.title,
      contentType: item.type,
      scheduledWeek: week,
      priority: item.priority,
      status: "PLANNED",
    });
    week = week >= totalWeeks ? 1 : week + 1;
  }

  return {
    scheduleId: randomUUID(),
    totalWeeks,
    entriesPerWeek: Math.max(1, Math.ceil(entries.length / totalWeeks)),
    entries,
  };
}

function buildSeoCoverage(
  clusters: TopicalCluster[],
  pillars: PillarPage[],
  supportingArticles: SupportingArticle[],
  faqExpansions: FaqExpansion[],
  buyingGuides: BuyingGuide[],
  comparisonPages: ComparisonPage[],
): SeoCoverageReport {
  const commercialClusters = clusters.filter(
    (cluster) => cluster.searchIntent === "COMMERCIAL" || cluster.searchIntent === "TRANSACTIONAL",
  );
  const informationalClusters = clusters.filter(
    (cluster) => cluster.searchIntent === "INFORMATIONAL",
  );

  const clustersCovered = pillars.length;
  const overallCoverage = clampScore(
    clustersCovered / clusters.length * 40 +
      supportingArticles.length * 3 +
      faqExpansions.length * 4 +
      buyingGuides.length * 6 +
      comparisonPages.length * 6,
  );

  return {
    overallCoverage,
    clustersCovered,
    totalClusters: clusters.length,
    pillarPagesMapped: pillars.length,
    supportingArticlesMapped: supportingArticles.length,
    faqKeywordsCovered: faqExpansions.length,
    commercialIntentCoverage: clampScore(
      commercialClusters.length === 0
        ? 0
        : (buyingGuides.length + comparisonPages.length) / commercialClusters.length * 50,
    ),
    informationalIntentCoverage: clampScore(
      informationalClusters.length === 0
        ? 0
        : (supportingArticles.length / (informationalClusters.length * 2)) * 100,
    ),
    summary: `${overallCoverage}% SEO content coverage across ${clusters.length} topical clusters with ${pillars.length} pillar pages.`,
  };
}

function computeConfidence(
  input: ContentLibraryInput,
  strategy: BlogStrategy,
  clusters: TopicalCluster[],
  pillars: PillarPage[],
  supportingArticles: SupportingArticle[],
  schedule: PublishingSchedule,
  seoCoverage: SeoCoverageReport,
  signals: ContentLibrarySignal[],
): number {
  return clampScore(
    input.brand.confidence * 0.2 +
      strategy.contentPillars.length * 8 +
      clusters.length * 6 +
      pillars.length * 5 +
      supportingArticles.length * 2 +
      schedule.entries.length * 1.5 +
      seoCoverage.overallCoverage * 0.25 +
      average(signals.map((signal) => signal.score)) * 0.1,
  );
}

function buildSignals(
  strategy: BlogStrategy,
  clusters: TopicalCluster[],
  pillars: PillarPage[],
  supportingArticles: SupportingArticle[],
  buyingGuides: BuyingGuide[],
  comparisonPages: ComparisonPage[],
  evergreenContent: EvergreenContent[],
  schedule: PublishingSchedule,
  seoCoverage: SeoCoverageReport,
  confidence: number,
): ContentLibrarySignal[] {
  return [
    buildSignal("strategy_strength", clampScore(strategy.primaryGoals.length * 20), `${strategy.contentPillars.length} content pillars`),
    buildSignal("cluster_coverage", clampScore(clusters.length * 22), `${clusters.length} topical clusters`),
    buildSignal("pillar_depth", clampScore(pillars.length * 20), `${pillars.length} pillar pages`),
    buildSignal(
      "format_diversity",
      clampScore(buyingGuides.length * 15 + comparisonPages.length * 15 + evergreenContent.length * 10),
      "Multi-format content library",
    ),
    buildSignal(
      "schedule_readiness",
      clampScore(schedule.entries.length * 4),
      `${schedule.entries.length} planned entries over ${schedule.totalWeeks} weeks`,
    ),
    buildSignal("seo_coverage", seoCoverage.overallCoverage, seoCoverage.summary),
    buildSignal("library_composite", confidence, `Content library confidence ${confidence}`),
  ];
}

/** Generates a complete content library for a manufactured store. */
export function generateContentLibrary(input: ContentLibraryInput): ContentLibraryBreakdown {
  const blogStrategy = buildBlogStrategy(input);
  const topicalClusters = buildTopicalClusters(input);
  const pillarPages = buildPillarPages(input, topicalClusters);
  const supportingArticles = buildSupportingArticles(input, pillarPages);
  const faqExpansions = buildFaqExpansions(input);
  const buyingGuides = buildBuyingGuides(input);
  const comparisonPages = buildComparisonPages(input);
  const evergreenContent = buildEvergreenContent(input);
  const publishingSchedule = buildPublishingSchedule(
    input,
    pillarPages,
    supportingArticles,
    buyingGuides,
    comparisonPages,
    evergreenContent,
  );
  const seoCoverage = buildSeoCoverage(
    topicalClusters,
    pillarPages,
    supportingArticles,
    faqExpansions,
    buyingGuides,
    comparisonPages,
  );

  const provisionalSignals = buildSignals(
    blogStrategy,
    topicalClusters,
    pillarPages,
    supportingArticles,
    buyingGuides,
    comparisonPages,
    evergreenContent,
    publishingSchedule,
    seoCoverage,
    0,
  );
  const confidence = computeConfidence(
    input,
    blogStrategy,
    topicalClusters,
    pillarPages,
    supportingArticles,
    publishingSchedule,
    seoCoverage,
    provisionalSignals,
  );
  const signals = buildSignals(
    blogStrategy,
    topicalClusters,
    pillarPages,
    supportingArticles,
    buyingGuides,
    comparisonPages,
    evergreenContent,
    publishingSchedule,
    seoCoverage,
    confidence,
  );

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    libraryName: `${input.brand.brandName} Content Library`,
    blogStrategy,
    topicalClusters,
    pillarPages,
    supportingArticles,
    faqExpansions,
    buyingGuides,
    comparisonPages,
    evergreenContent,
    publishingSchedule,
    confidence,
    seoCoverage,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoPublishEnabled: false,
  };
}

export const contentLibraryIntelligenceScoring = {
  generateContentLibrary,
  weights: CONTENT_LIBRARY_SIGNAL_WEIGHTS,
};
