import { nextAssetId } from "./review-store.js";
import type {
  AlternativeRecommendation,
  BuyingRecommendation,
  ComparisonFixture,
  IdealCustomerProfile,
  LimitationsSection,
  OpportunityFixture,
  ProsConsSection,
  RcwInput,
  ReviewArticle,
  ReviewedSubject,
  ReviewProductFixture,
} from "./types.js";

export function resolveOpportunity(input: RcwInput): OpportunityFixture | null {
  return input.opportunityReport ?? input.fixtureOpportunity ?? null;
}

export function resolveComparison(input: RcwInput): ComparisonFixture | null {
  return input.comparisonReport ?? input.fixtureComparison ?? null;
}

export function resolveSubject(input: RcwInput): ReviewedSubject | null {
  if (input.fixtureProduct?.productId && input.fixtureProduct.name) {
    const p = input.fixtureProduct;
    return {
      productId: p.productId.trim(),
      name: p.name.trim(),
      category: p.category?.trim() || "unknown",
      programmeId: p.programmeId,
      price: typeof p.price === "number" ? p.price : null,
      currency: p.currency ?? null,
      features: Array.isArray(p.features) ? p.features.map(String) : [],
      specs: { ...(p.specs ?? {}) },
      pros: Array.isArray(p.pros) ? p.pros.map(String) : [],
      cons: Array.isArray(p.cons) ? p.cons.map(String) : [],
      bestFor: p.bestFor ?? null,
      limitations: Array.isArray(p.limitations) ? p.limitations.map(String) : [],
      notes: p.notes,
      reviewType: p.reviewType ?? "product",
      source: "fixture",
      fabricated: false,
      evidencePresent: true,
    };
  }

  const comparison = resolveComparison(input);
  const productId = input.productId?.trim();
  const fromCmp = comparison?.productsCompared?.find(
    (p) => !productId || p.productId === productId,
  );
  if (fromCmp?.productId && fromCmp.name) {
    return {
      productId: fromCmp.productId,
      name: fromCmp.name,
      category: fromCmp.category || comparison?.comparisonTopic || "unknown",
      programmeId: fromCmp.programmeId,
      price: typeof fromCmp.price === "number" ? fromCmp.price : null,
      currency: fromCmp.currency ?? null,
      features: Array.isArray(fromCmp.features) ? fromCmp.features.map(String) : [],
      specs: {},
      pros: Array.isArray(fromCmp.pros) ? fromCmp.pros.map(String) : [],
      cons: Array.isArray(fromCmp.cons) ? fromCmp.cons.map(String) : [],
      bestFor: fromCmp.bestFor ?? null,
      limitations: [],
      reviewType: "product",
      source: "comparison_site_report",
      fabricated: false,
      evidencePresent: true,
    };
  }

  const opportunity = resolveOpportunity(input);
  const fromOpp = opportunity?.products?.find((p) => !productId || p.productId === productId);
  if (fromOpp?.productId && fromOpp.name) {
    return {
      productId: fromOpp.productId,
      name: fromOpp.name,
      category: fromOpp.category || opportunity?.productCategory || "unknown",
      programmeId: fromOpp.programmeId,
      price: null,
      currency: null,
      features: [],
      specs: {},
      pros: [],
      cons: [],
      bestFor: null,
      limitations: [],
      reviewType: "product",
      source: "opportunity_report",
      fabricated: false,
      evidencePresent: true,
    };
  }

  return null;
}

export function buildProsCons(subject: ReviewedSubject): ProsConsSection {
  return {
    sectionId: nextAssetId("proscons"),
    productId: subject.productId,
    productName: subject.name,
    pros: subject.pros.length ? [...subject.pros] : ["No pros evidenced"],
    cons: subject.cons.length ? [...subject.cons] : ["No cons evidenced"],
    fabricated: false,
    derivedFromEvidence: true,
  };
}

export function buildAlternatives(
  subject: ReviewedSubject,
  input: RcwInput,
): AlternativeRecommendation[] {
  const fixtures = input.fixtureAlternatives ?? [];
  const comparison = resolveComparison(input);
  const fromComparison = (comparison?.productsCompared ?? [])
    .filter((p) => p.productId !== subject.productId && p.productId && p.name)
    .map(
      (p): ReviewProductFixture => ({
        productId: p.productId,
        name: p.name,
        category: p.category || subject.category,
        programmeId: p.programmeId,
        price: p.price,
        currency: p.currency,
        features: p.features,
        pros: p.pros,
        cons: p.cons,
        bestFor: p.bestFor,
      }),
    );

  const pool = fixtures.length ? fixtures : fromComparison;
  return pool
    .filter((p) => p.productId && p.name && p.productId !== subject.productId)
    .map((p) => {
      const ranking = comparison?.rankingResults?.find((r) => r.productId === p.productId);
      const reasonParts = [
        p.bestFor ? `best for ${p.bestFor}` : null,
        typeof p.price === "number" ? `observed price ${p.price}` : null,
        ranking?.score != null ? `comparison score ${ranking.score}` : null,
      ].filter(Boolean);
      return {
        alternativeId: nextAssetId("alt"),
        productId: p.productId.trim(),
        productName: p.name.trim(),
        relativeToProductId: subject.productId,
        reason: reasonParts.length
          ? `Evidence-backed alternative: ${reasonParts.join("; ")}`
          : "Listed as alternate product in comparison/fixture evidence",
        tradeOff:
          p.cons?.[0] ??
          (typeof p.price === "number" && subject.price != null
            ? p.price < subject.price
              ? "Lower observed price may trade features"
              : "Higher observed price may add capability"
            : "Trade-offs not fully evidenced"),
        fabricated: false as const,
        evidencePresent: Boolean(p.productId && p.name),
      };
    });
}

export function buildBuyingRecommendation(
  subject: ReviewedSubject,
  prosCons: ProsConsSection,
  opportunity: OpportunityFixture | null,
  comparison: ComparisonFixture | null,
): BuyingRecommendation {
  const ranking =
    comparison?.rankingResults?.find((r) => r.productId === subject.productId) ?? null;
  const hasPros = prosCons.pros[0] !== "No pros evidenced";
  const hasCons = prosCons.cons[0] !== "No cons evidenced";
  const hasScore = ranking?.score != null || opportunity?.opportunityScore != null;
  const conditions: string[] = [];
  if (!hasPros) conditions.push("Pros not evidenced — recommendation limited");
  if (hasCons) conditions.push(`Review cons: ${prosCons.cons.join("; ")}`);
  if (subject.bestFor) conditions.push(`Best suited for ${subject.bestFor}`);
  if (!hasScore) conditions.push("No opportunity/comparison score evidenced");

  let verdict: BuyingRecommendation["verdict"] = "insufficient_evidence";
  if (hasPros && hasScore) {
    verdict = hasCons ? "buy_with_conditions" : "buy";
  } else if (hasPros) {
    verdict = "buy_with_conditions";
  } else if (hasCons || subject.features.length) {
    verdict = "consider_alternatives";
  }

  return {
    recommendationId: nextAssetId("buy"),
    productId: subject.productId,
    productName: subject.name,
    verdict,
    summary:
      verdict === "insufficient_evidence"
        ? `Insufficient evidence to recommend ${subject.name}`
        : `${subject.name}: ${verdict.replaceAll("_", " ")} based on observed pros/cons and ranking signals`,
    conditions,
    fabricated: false,
    evidencePresent: hasPros || hasScore || subject.features.length > 0,
  };
}

export function buildIdealCustomerProfile(subject: ReviewedSubject): IdealCustomerProfile {
  const traits = [
    subject.bestFor ? `Seeking fit for ${subject.bestFor}` : null,
    subject.features.length ? `Values: ${subject.features.slice(0, 3).join(", ")}` : null,
    subject.price != null ? `Budget around observed ${subject.currency ?? ""} ${subject.price}`.trim() : null,
  ].filter(Boolean) as string[];
  if (!traits.length) traits.push("Ideal customer traits not evidenced");
  return {
    profileId: nextAssetId("icp"),
    productId: subject.productId,
    productName: subject.name,
    summary: subject.bestFor
      ? `Ideal for ${subject.bestFor}`
      : `Ideal customer profile for ${subject.name} limited to available evidence`,
    traits,
    fabricated: false,
    derivedFromEvidence: true,
  };
}

export function buildLimitations(subject: ReviewedSubject, prosCons: ProsConsSection): LimitationsSection {
  const limitations = subject.limitations.length
    ? [...subject.limitations]
    : prosCons.cons[0] !== "No cons evidenced"
      ? [...prosCons.cons]
      : ["Limitations not evidenced"];
  const tradeOffs: string[] = [];
  if (subject.price != null) tradeOffs.push(`Observed price ${subject.price} vs feature set`);
  if (prosCons.pros[0] !== "No pros evidenced" && prosCons.cons[0] !== "No cons evidenced") {
    tradeOffs.push("Strengths must be weighed against evidenced cons");
  }
  if (!tradeOffs.length) tradeOffs.push("Trade-offs not fully evidenced");
  return {
    sectionId: nextAssetId("limit"),
    productId: subject.productId,
    productName: subject.name,
    limitations,
    tradeOffs,
    fabricated: false,
    derivedFromEvidence: true,
  };
}

export function buildReviewArticle(
  subject: ReviewedSubject,
  prosCons: ProsConsSection,
  buying: BuyingRecommendation,
  icp: IdealCustomerProfile,
  limitations: LimitationsSection,
  version: number,
): ReviewArticle {
  const keyFeatures =
    subject.features.length > 0
      ? [...subject.features]
      : Object.entries(subject.specs).map(([k, v]) => `${k}=${v}`);
  return {
    articleId: nextAssetId("article"),
    reviewType: subject.reviewType ?? "product",
    title: `${subject.name} review`,
    productOrServiceReviewed: subject.name,
    productId: subject.productId,
    summary:
      keyFeatures.length || prosCons.pros[0] !== "No pros evidenced"
        ? `Evidence-based review of ${subject.name} covering features, pros/cons, and buying guidance.`
        : `Structural review shell for ${subject.name} — limited evidence available.`,
    keyFeatures: keyFeatures.length ? keyFeatures : ["No key features evidenced"],
    performanceSummary:
      subject.specs && Object.keys(subject.specs).length
        ? `Observed specs: ${Object.entries(subject.specs)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}`
        : "Performance signals not evidenced",
    verdictSection: `${buying.verdict.replaceAll("_", " ")} — ${buying.summary}`,
    faqs: [
      {
        question: `Who is ${subject.name} best for?`,
        answer: icp.summary,
      },
      {
        question: "What are the main drawbacks?",
        answer: limitations.limitations.join("; "),
      },
      {
        question: "Is this review published live?",
        answer:
          "No. Review Content Worker produces structural review packages only and never publishes websites.",
      },
    ],
    sections: [
      {
        heading: "Overview",
        body: `Review of ${subject.name} (${subject.category}) derived from verified fixtures/opportunity/comparison evidence.`,
      },
      {
        heading: "Pros and cons",
        body: `Pros: ${prosCons.pros.join("; ")}. Cons: ${prosCons.cons.join("; ")}.`,
      },
      {
        heading: "Limitations and trade-offs",
        body: `${limitations.limitations.join("; ")}. Trade-offs: ${limitations.tradeOffs.join("; ")}.`,
      },
      {
        heading: "Buying recommendation",
        body: buying.summary,
      },
    ],
    version,
    fabricated: false,
  };
}

export function computeConfidence(parts: {
  hasSubject: boolean;
  hasProsConsEvidence: boolean;
  hasAlternatives: boolean;
  hasBuying: boolean;
  hasIcp: boolean;
  hasLimitations: boolean;
  hasSourceLink: boolean;
}): number {
  const checks = [
    parts.hasSubject,
    parts.hasProsConsEvidence,
    parts.hasAlternatives,
    parts.hasBuying,
    parts.hasIcp,
    parts.hasLimitations,
    parts.hasSourceLink,
  ];
  return Number((checks.filter(Boolean).length / checks.length).toFixed(2));
}
