import { nextAssetId } from "./funnel-store.js";
import type {
  CallToActionStrategy,
  EfwInput,
  EmailCaptureStrategy,
  EmailSequence,
  FunnelStage,
  LeadMagnet,
  OpportunityFixture,
  ReviewFixture,
  SeoFixture,
} from "./types.js";

export function resolveOpportunity(input: EfwInput): OpportunityFixture | null {
  return input.opportunityReport ?? input.fixtureOpportunity ?? null;
}

export function resolveSeo(input: EfwInput): SeoFixture | null {
  return input.seoReport ?? input.fixtureSeo ?? null;
}

export function resolveReview(input: EfwInput): ReviewFixture | null {
  return input.reviewReport ?? input.fixtureReview ?? null;
}

export function resolveTopic(input: EfwInput): string {
  const opportunity = resolveOpportunity(input);
  const seo = resolveSeo(input);
  const review = resolveReview(input);
  return (
    input.topic?.trim() ||
    seo?.topic?.trim() ||
    review?.productOrServiceReviewed?.trim() ||
    opportunity?.productCategory?.trim() ||
    opportunity?.targetNiche?.trim() ||
    input.productCategory?.trim() ||
    input.niche?.trim() ||
    "affiliate_funnel_topic"
  );
}

export function resolveFunnelName(input: EfwInput, topic: string): string {
  return input.funnelName?.trim() || `${topic} email funnel`;
}

export function buildLeadMagnet(
  topic: string,
  input: EfwInput,
  seo: SeoFixture | null,
  review: ReviewFixture | null,
): LeadMagnet {
  const product =
    review?.productOrServiceReviewed ||
    seo?.articleBrief?.title?.replace(/ SEO article brief$/i, "") ||
    topic;
  const name =
    input.fixtureLeadMagnetName?.trim() ||
    `${product} buyer checklist`;
  const keyword = seo?.articleBrief?.primaryKeyword || seo?.targetKeywords?.[0]?.keyword;
  return {
    magnetId: nextAssetId("magnet"),
    name,
    format: "checklist",
    topic,
    offerSummary: `Free ${name} helping subscribers evaluate ${topic} options using verified review/SEO evidence.`,
    deliveryPromise:
      "Delivered as a structural lead-magnet package only — Email Funnel Worker never sends live emails.",
    evidenceBasis: [
      ...(seo?.reportId ? [`seo_report:${seo.reportId}`] : []),
      ...(review?.reportId ? [`review_report:${review.reportId}`] : []),
      ...(keyword ? [`primary_keyword:${keyword}`] : []),
      ...(review?.pros?.length ? ["review_pros"] : []),
    ],
    fabricated: false,
  };
}

export function buildCaptureStrategy(
  topic: string,
  magnet: LeadMagnet,
  seo: SeoFixture | null,
): EmailCaptureStrategy {
  const keyword = seo?.articleBrief?.primaryKeyword || topic;
  return {
    strategyId: nextAssetId("capture"),
    optInPageConcept: `${topic} opt-in page offering ${magnet.name}`,
    headline: `Get the free ${magnet.name}`,
    formFields: ["email", "first_name_optional"],
    incentive: magnet.name,
    placementNotes: [
      seo?.contentPlan?.pillarPage
        ? `Place capture CTA near pillar: ${seo.contentPlan.pillarPage}`
        : "Place capture CTA on pillar/supporting content when available",
      `Align with keyword intent around ${keyword}`,
      "Structural strategy only — never publishes opt-in pages live",
    ],
    fabricated: false,
  };
}

export function buildFunnelStages(topic: string): FunnelStage[] {
  const defs: Array<{
    stageType: FunnelStage["stageType"];
    name: string;
    objective: string;
    entry: string;
    exit: string;
  }> = [
    {
      stageType: "awareness",
      name: "Awareness",
      objective: `Attract readers researching ${topic}`,
      entry: "Visitor lands on SEO/content asset",
      exit: "Visitor sees lead magnet offer",
    },
    {
      stageType: "capture",
      name: "Capture",
      objective: "Convert visitors into subscribers via lead magnet",
      entry: "Visitor engages opt-in concept",
      exit: "Subscriber recorded structurally (not live-sent)",
    },
    {
      stageType: "welcome",
      name: "Welcome",
      objective: "Deliver magnet and set expectations",
      entry: "Subscriber enters welcome sequence",
      exit: "Welcome sequence complete",
    },
    {
      stageType: "nurture",
      name: "Nurture",
      objective: "Educate with evidenced tips and comparisons",
      entry: "Subscriber completes welcome",
      exit: "Ready for product recommendations",
    },
    {
      stageType: "recommend",
      name: "Recommend",
      objective: "Present evidenced product/service recommendations",
      entry: "Nurture milestones met",
      exit: "Subscriber engages recommendation CTA",
    },
    {
      stageType: "convert",
      name: "Convert",
      objective: "Guide toward affiliate conversion decision",
      entry: "Recommendation interest shown",
      exit: "Conversion objective reached or declined",
    },
    {
      stageType: "reengage",
      name: "Re-engage",
      objective: "Win back inactive subscribers structurally",
      entry: "Inactivity signal (extension point)",
      exit: "Re-engaged or archived (extension point)",
    },
  ];
  return defs.map((d, i) => ({
    stageId: nextAssetId("stage"),
    stageType: d.stageType,
    name: d.name,
    objective: d.objective,
    entryCriteria: d.entry,
    exitCriteria: d.exit,
    order: i + 1,
  }));
}

export function buildWelcomeSequence(
  topic: string,
  magnet: LeadMagnet,
  review: ReviewFixture | null,
): EmailSequence {
  const product = review?.productOrServiceReviewed || topic;
  const emails = [
    {
      emailId: nextAssetId("email"),
      sequenceType: "welcome" as const,
      dayOffset: 0,
      subject: `Your ${magnet.name} is ready`,
      previewText: `Start with the ${topic} checklist`,
      bodyOutline: [
        "Thank subscriber",
        `Deliver ${magnet.name} (structural delivery note)`,
        "Set expectations for upcoming tips",
      ],
      cta: `Download ${magnet.name}`,
      fabricated: false as const,
    },
    {
      emailId: nextAssetId("email"),
      sequenceType: "welcome" as const,
      dayOffset: 1,
      subject: `How to use your ${topic} checklist`,
      previewText: "Quick start guide",
      bodyOutline: [
        "Walk through checklist sections",
        review?.pros?.length
          ? `Highlight evidenced strengths: ${review.pros.slice(0, 2).join(", ")}`
          : "Highlight evidenced evaluation criteria",
        "Invite reply / preference capture (extension point)",
      ],
      cta: `Open ${product} research notes`,
      fabricated: false as const,
    },
  ];
  return {
    sequenceId: nextAssetId("seq"),
    name: `${topic} welcome sequence`,
    sequenceType: "welcome",
    emails,
    fabricated: false,
  };
}

export function buildNurtureSequence(
  topic: string,
  seo: SeoFixture | null,
  review: ReviewFixture | null,
): EmailSequence {
  const keyword = seo?.articleBrief?.primaryKeyword || `best ${topic}`;
  const product = review?.productOrServiceReviewed || topic;
  const emails = [
    {
      emailId: nextAssetId("email"),
      sequenceType: "nurture" as const,
      dayOffset: 3,
      subject: `${topic} mistakes to avoid`,
      previewText: "Evidence-based buying pitfalls",
      bodyOutline: [
        review?.cons?.length
          ? `Discuss evidenced cons/trade-offs: ${review.cons.join("; ")}`
          : "Discuss common evaluation pitfalls from available evidence",
        "Link structurally to SEO supporting content when available",
      ],
      cta: `Read ${keyword} guide`,
      fabricated: false as const,
    },
    {
      emailId: nextAssetId("email"),
      sequenceType: "nurture" as const,
      dayOffset: 5,
      subject: `How we evaluate ${product}`,
      previewText: "Transparent criteria",
      bodyOutline: [
        "Share evaluation framework from review/SEO packages",
        review?.buyingRecommendation?.summary
          ? `Reference buying note: ${review.buyingRecommendation.summary}`
          : "Reference buying notes when evidenced",
      ],
      cta: `See ${product} recommendation criteria`,
      fabricated: false as const,
    },
    {
      emailId: nextAssetId("email"),
      sequenceType: "recommend" as const,
      dayOffset: 7,
      subject: `${product}: who it is for`,
      previewText: "Fit and next steps",
      bodyOutline: [
        "Summarize ideal fit from evidence",
        "Present conversion-focused but non-live CTA",
        "No fabricated open/click/conversion rates",
      ],
      cta: `Consider ${product}`,
      fabricated: false as const,
    },
  ];
  return {
    sequenceId: nextAssetId("seq"),
    name: `${topic} nurture sequence`,
    sequenceType: "nurture",
    emails,
    fabricated: false,
  };
}

export function buildCtaStrategy(
  topic: string,
  magnet: LeadMagnet,
  review: ReviewFixture | null,
): CallToActionStrategy {
  const product = review?.productOrServiceReviewed || topic;
  const conversionObjectives = [
    "Capture subscriber via lead magnet (structural)",
    "Educate subscriber through welcome + nurture sequences",
    `Guide toward evidenced consideration of ${product}`,
  ];
  return {
    strategyId: nextAssetId("cta"),
    primaryCta: `Get the free ${magnet.name}`,
    secondaryCtas: [
      `Read ${topic} buying guide`,
      `Consider ${product}`,
      "Reply with your use case (extension point)",
    ],
    placementByStage: [
      { stageType: "capture", cta: `Get the free ${magnet.name}` },
      { stageType: "welcome", cta: `Open ${magnet.name}` },
      { stageType: "nurture", cta: `Read ${topic} guide` },
      { stageType: "recommend", cta: `Consider ${product}` },
      { stageType: "convert", cta: `Review ${product} offer details` },
    ],
    conversionObjectives,
    fabricated: false,
    neverFabricatePerformanceClaims: true,
  };
}

export function computeConfidence(parts: {
  hasMagnet: boolean;
  hasCapture: boolean;
  hasStages: boolean;
  hasWelcome: boolean;
  hasNurture: boolean;
  hasCta: boolean;
  hasSourceLink: boolean;
}): number {
  const checks = [
    parts.hasMagnet,
    parts.hasCapture,
    parts.hasStages,
    parts.hasWelcome,
    parts.hasNurture,
    parts.hasCta,
    parts.hasSourceLink,
  ];
  return Number((checks.filter(Boolean).length / checks.length).toFixed(2));
}
