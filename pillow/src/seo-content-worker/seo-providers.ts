import { nextAssetId } from "./seo-store.js";
import type {
  ArticleBrief,
  ContentQualitySummary,
  InternalLinkRecommendation,
  KeywordMappingEntry,
  OpportunityFixture,
  ReviewFixture,
  SearchIntent,
  SeoArticle,
  SeoContentPlan,
  SeowInput,
} from "./types.js";
import { SEARCH_INTENTS } from "./paths.js";

export function resolveOpportunity(input: SeowInput): OpportunityFixture | null {
  return input.opportunityReport ?? input.fixtureOpportunity ?? null;
}

export function resolveReview(input: SeowInput): ReviewFixture | null {
  return input.reviewReport ?? input.fixtureReview ?? null;
}

function normalizeIntent(value?: string | null): SearchIntent {
  const v = (value ?? "").trim().toLowerCase();
  if ((SEARCH_INTENTS as readonly string[]).includes(v)) return v as SearchIntent;
  if (v.includes("buy") || v.includes("deal") || v.includes("best")) return "commercial";
  if (v.includes("how") || v.includes("what") || v.includes("guide")) return "informational";
  return "unknown";
}

export function resolveTopic(input: SeowInput): string {
  const opportunity = resolveOpportunity(input);
  const review = resolveReview(input);
  return (
    input.topic?.trim() ||
    review?.productOrServiceReviewed?.trim() ||
    opportunity?.productCategory?.trim() ||
    opportunity?.targetNiche?.trim() ||
    input.productCategory?.trim() ||
    input.niche?.trim() ||
    "affiliate_seo_topic"
  );
}

export function buildKeywordMapping(input: SeowInput, topic: string): KeywordMappingEntry[] {
  const seeds = input.fixtureKeywords ?? [];
  if (seeds.length) {
    return seeds
      .filter((s) => s.keyword?.trim())
      .map((s, i) => ({
        keyword: s.keyword.trim(),
        intent: normalizeIntent(s.intent),
        cluster: s.cluster?.trim() || topic,
        role: (s.primary || i === 0 ? "primary" : i < 3 ? "secondary" : "supporting") as
          | "primary"
          | "secondary"
          | "supporting",
        fabricated: false as const,
        evidencePresent: true,
      }));
  }

  const opportunity = resolveOpportunity(input);
  const review = resolveReview(input);
  const product =
    review?.productOrServiceReviewed ||
    opportunity?.products?.[0]?.name ||
    topic;
  const niche = opportunity?.targetNiche || opportunity?.productCategory || topic;
  const derived = [
    { keyword: `best ${niche}`, intent: "commercial" as SearchIntent, primary: true },
    { keyword: `${product} review`, intent: "commercial" as SearchIntent, primary: false },
    { keyword: `${niche} buying guide`, intent: "informational" as SearchIntent, primary: false },
    { keyword: `how to choose ${niche}`, intent: "informational" as SearchIntent, primary: false },
  ];
  return derived.map((d, i) => ({
    keyword: d.keyword,
    intent: d.intent,
    cluster: niche,
    role: (d.primary || i === 0 ? "primary" : "secondary") as "primary" | "secondary",
    fabricated: false as const,
    evidencePresent: Boolean(product || niche),
  }));
}

export function buildContentPlan(
  topic: string,
  keywords: KeywordMappingEntry[],
  input: SeowInput,
): SeoContentPlan {
  const supporting = input.fixtureClusterTopics?.length
    ? input.fixtureClusterTopics.map(String)
    : [
        `${topic} comparison`,
        `${topic} review`,
        `${topic} buying guide`,
      ];
  const primaryIntent = keywords[0]?.intent ?? "unknown";
  return {
    planId: nextAssetId("plan"),
    title: `${topic} SEO content plan`,
    topic,
    pillarPage: `${topic} ultimate guide`,
    clusters: [
      {
        clusterId: nextAssetId("cluster"),
        name: `${topic} cluster`,
        pillarTopic: `${topic} ultimate guide`,
        supportingTopics: supporting,
      },
    ],
    supportingArticles: supporting,
    targetKeywords: keywords.map((k) => k.keyword),
    searchIntent: primaryIntent,
    notes: [
      "Plan derived from opportunity/review/keyword evidence only",
      "No SEO performance claims fabricated",
      "Articles are structural packages — never published by this worker",
    ],
    fabricated: false,
  };
}

export function buildArticleBrief(
  topic: string,
  keywords: KeywordMappingEntry[],
  plan: SeoContentPlan,
  review: ReviewFixture | null,
): ArticleBrief {
  const primary = keywords.find((k) => k.role === "primary") ?? keywords[0];
  const secondary = keywords.filter((k) => k !== primary).map((k) => k.keyword);
  const product = review?.productOrServiceReviewed || topic;
  const outline = [
    `Introduction to ${product}`,
    "Key features and evidence",
    "Pros and cons",
    "Who it is for",
    "Buying considerations",
    "FAQ",
    "Conclusion",
  ];
  const metaTitle = primary
    ? `${primary.keyword}`.slice(0, 60)
    : `${product} guide`.slice(0, 60);
  const metaDescription = (
    review?.reviewSummary ||
    `Evidence-based ${topic} guide covering features, comparisons, and buying considerations.`
  ).slice(0, 160);
  return {
    briefId: nextAssetId("brief"),
    title: `${product} SEO article brief`,
    primaryKeyword: primary?.keyword ?? topic,
    secondaryKeywords: secondary,
    searchIntent: primary?.intent ?? plan.searchIntent,
    audience: review?.buyingRecommendation?.summary
      ? "buyers evaluating evidenced recommendations"
      : `readers researching ${topic}`,
    outline,
    metaTitle,
    metaDescription,
    faqPrompts: [
      `What is the best ${topic}?`,
      `Who should buy ${product}?`,
      `What are the main drawbacks of ${product}?`,
    ],
    evidenceNotes: [
      review?.reportId ? `review_report:${review.reportId}` : "no_review_report",
      primary ? `primary_keyword:${primary.keyword}` : "no_primary_keyword",
      "No ranking/traffic performance claims included",
    ],
    fabricated: false,
  };
}

export function buildSeoArticle(
  topic: string,
  brief: ArticleBrief,
  review: ReviewFixture | null,
  version: number,
): SeoArticle {
  const product = review?.productOrServiceReviewed || topic;
  const features = review?.reviewArticle?.keyFeatures ?? [];
  const pros = review?.pros ?? [];
  const cons = review?.cons ?? [];
  const reviewFaqs = review?.reviewArticle?.faqs ?? [];
  const bodySections = [
    {
      heading: `H1: ${brief.metaTitle}`,
      body: `This structural SEO article covers ${product} using verified opportunity and review evidence only.`,
    },
    {
      heading: "H2: Key features",
      body: features.length
        ? `Observed features: ${features.join(", ")}.`
        : "Key features not evidenced in source packages.",
    },
    {
      heading: "H2: Pros and cons",
      body: `Pros: ${pros.length ? pros.join("; ") : "not evidenced"}. Cons: ${cons.length ? cons.join("; ") : "not evidenced"}.`,
    },
    {
      heading: "H2: Buying considerations",
      body:
        review?.buyingRecommendation?.summary ||
        "Buying recommendation not evidenced — no fabricated advice.",
    },
    {
      heading: "H2: Conclusion",
      body: `Use the ${brief.primaryKeyword} research path as a planning asset only. This worker never publishes articles or manipulates rankings.`,
    },
  ];
  const faqs =
    reviewFaqs.length > 0
      ? reviewFaqs.map((f) => ({ ...f }))
      : brief.faqPrompts.map((q) => ({
          question: q,
          answer: "Answer limited to available evidence; no fabricated SEO claims.",
        }));
  const text = bodySections.map((s) => s.body).join(" ");
  return {
    articleId: nextAssetId("article"),
    title: brief.title.replace(" brief", ""),
    metaTitle: brief.metaTitle,
    metaDescription: brief.metaDescription,
    primaryKeyword: brief.primaryKeyword,
    headingStructure: bodySections.map((s) => s.heading),
    bodySections,
    faqs,
    wordCountEstimate: text.split(/\s+/).filter(Boolean).length,
    version,
    fabricated: false,
  };
}

export function buildInternalLinks(
  plan: SeoContentPlan,
  brief: ArticleBrief,
  keywords: KeywordMappingEntry[],
): InternalLinkRecommendation[] {
  const links: InternalLinkRecommendation[] = [];
  links.push({
    linkId: nextAssetId("link"),
    fromPage: brief.title.replace(" brief", ""),
    toPage: plan.pillarPage,
    anchorText: plan.pillarPage,
    reason: "Link supporting article to pillar page in the evidenced cluster",
    fabricated: false,
    evidencePresent: true,
  });
  for (const supporting of plan.supportingArticles.slice(0, 3)) {
    links.push({
      linkId: nextAssetId("link"),
      fromPage: plan.pillarPage,
      toPage: supporting,
      anchorText: supporting,
      reason: "Cluster internal link from pillar to supporting topic",
      fabricated: false,
      evidencePresent: true,
    });
  }
  const secondary = keywords.find((k) => k.role === "secondary");
  if (secondary) {
    links.push({
      linkId: nextAssetId("link"),
      fromPage: brief.title.replace(" brief", ""),
      toPage: `${secondary.keyword} guide`,
      anchorText: secondary.keyword,
      reason: "Secondary keyword contextual link within cluster",
      fabricated: false,
      evidencePresent: secondary.evidencePresent,
    });
  }
  return links;
}

export function evaluateCompleteness(parts: {
  plan: SeoContentPlan | null;
  brief: ArticleBrief | null;
  article: SeoArticle | null;
  keywords: KeywordMappingEntry[];
  links: InternalLinkRecommendation[];
}): ContentQualitySummary {
  const hasPlan = Boolean(parts.plan);
  const hasBrief = Boolean(parts.brief);
  const hasArticle = Boolean(parts.article);
  const hasKeywordMapping = parts.keywords.length > 0;
  const hasInternalLinks = parts.links.length > 0;
  const hasMeta = Boolean(parts.article?.metaTitle && parts.article?.metaDescription);
  const checks = [hasPlan, hasBrief, hasArticle, hasKeywordMapping, hasInternalLinks, hasMeta];
  const completenessScore = Number(
    (checks.filter(Boolean).length / checks.length).toFixed(2),
  );
  const issues: string[] = [];
  if (!hasPlan) issues.push("Content plan missing");
  if (!hasBrief) issues.push("Article brief missing");
  if (!hasArticle) issues.push("SEO article missing");
  if (!hasKeywordMapping) issues.push("Keyword mapping empty");
  if (!hasInternalLinks) issues.push("Internal linking plan empty");
  if (!hasMeta) issues.push("Meta title/description incomplete");
  return {
    summaryId: nextAssetId("quality"),
    completenessScore,
    hasPlan,
    hasBrief,
    hasArticle,
    hasKeywordMapping,
    hasInternalLinks,
    hasMeta,
    issues,
    notes: [
      "Completeness reflects structural asset presence only",
      "No traffic, ranking, or CTR performance claims are made",
    ],
  };
}

export function computeConfidence(parts: {
  hasPlan: boolean;
  hasBrief: boolean;
  hasArticle: boolean;
  hasKeywords: boolean;
  hasLinks: boolean;
  hasSourceLink: boolean;
  completeness: number;
}): number {
  const checks = [
    parts.hasPlan,
    parts.hasBrief,
    parts.hasArticle,
    parts.hasKeywords,
    parts.hasLinks,
    parts.hasSourceLink,
    parts.completeness >= 0.8,
  ];
  return Number((checks.filter(Boolean).length / checks.length).toFixed(2));
}
