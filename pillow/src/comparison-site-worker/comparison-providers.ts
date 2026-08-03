import { nextPageId } from "./comparison-store.js";
import type {
  BuyerGuide,
  ComparedProduct,
  ComparisonPage,
  ComparisonTable,
  CswInput,
  MethodologySummary,
  OpportunityFixture,
  RankingPage,
  RankingResult,
} from "./types.js";

export function resolveOpportunity(input: CswInput): OpportunityFixture | null {
  return input.opportunityReport ?? input.fixtureOpportunity ?? null;
}

export function collectProducts(input: CswInput): ComparedProduct[] {
  const fromFixtures = (input.fixtureProducts ?? []).map((p) => ({
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
    notes: p.notes,
    source: "fixture" as const,
    fabricated: false as const,
    evidencePresent: Boolean(p.productId && p.name),
  }));

  if (fromFixtures.length) return fromFixtures.filter((p) => p.evidencePresent);

  const opportunity = resolveOpportunity(input);
  const fromOpp = (opportunity?.products ?? []).map((p) => ({
    productId: p.productId,
    name: p.name,
    category: p.category || opportunity?.productCategory || "unknown",
    programmeId: p.programmeId,
    price: null,
    currency: null,
    features: [],
    specs: {},
    pros: [],
    cons: [],
    bestFor: null,
    notes: undefined,
    source: "opportunity_report" as const,
    fabricated: false as const,
    evidencePresent: Boolean(p.productId && p.name),
  }));
  return fromOpp.filter((p) => p.evidencePresent);
}

export function buildFeatureTable(products: ComparedProduct[]): ComparisonTable {
  const featureKeys = new Set<string>();
  for (const p of products) {
    for (const f of p.features) featureKeys.add(f);
    for (const k of Object.keys(p.specs)) featureKeys.add(k);
  }
  const columns = ["feature", ...products.map((p) => p.name)];
  const rows: Array<Record<string, string>> = [];
  if (featureKeys.size === 0) {
    rows.push({
      feature: "evidence",
      ...Object.fromEntries(products.map((p) => [p.name, "no feature evidence provided"])),
    });
  } else {
    for (const feature of featureKeys) {
      const row: Record<string, string> = { feature };
      for (const p of products) {
        if (p.features.includes(feature)) row[p.name] = "yes";
        else if (p.specs[feature]) row[p.name] = p.specs[feature];
        else row[p.name] = "not evidenced";
      }
      rows.push(row);
    }
  }
  return {
    tableId: nextPageId("table-feat"),
    title: "Feature comparison",
    columns,
    rows,
    fabricated: false,
    derivedFromEvidence: true,
  };
}

export function buildPricingTable(products: ComparedProduct[]): ComparisonTable {
  return {
    tableId: nextPageId("table-price"),
    title: "Pricing comparison",
    columns: ["product", "price", "currency", "value_notes"],
    rows: products.map((p) => ({
      product: p.name,
      price: p.price == null ? "unknown" : String(p.price),
      currency: p.currency ?? "unknown",
      value_notes:
        p.price == null
          ? "No price evidence — not fabricated"
          : p.bestFor
            ? `Observed price; best for ${p.bestFor}`
            : "Observed price from fixture",
    })),
    fabricated: false,
    derivedFromEvidence: true,
  };
}

export function buildRankings(
  products: ComparedProduct[],
  opportunity: OpportunityFixture | null,
  topN: number,
): RankingResult[] {
  if (!products.length) return [];

  const oppScores = new Map<string, { score: number | null; basis: string[] }>();
  for (const r of opportunity?.opportunityRanking ?? []) {
    oppScores.set(r.programmeId, { score: r.opportunityScore, basis: r.scoreBasis ?? [] });
  }

  const scored = products.map((p, index) => {
    const linked = p.programmeId ? oppScores.get(p.programmeId) : undefined;
    const featureCount = p.features.length + Object.keys(p.specs).length;
    let score: number | null = null;
    const rationale: string[] = [];
    if (linked?.score != null) {
      score = linked.score;
      rationale.push(`opportunity_score=${linked.score}`);
      rationale.push(...linked.basis);
    }
    if (p.price != null) {
      rationale.push(`observed_price=${p.price}`);
    }
    if (featureCount > 0) {
      rationale.push(`feature_evidence_count=${featureCount}`);
      if (score == null) score = Math.min(100, 40 + featureCount * 5);
    }
    if (score == null && rationale.length === 0) {
      rationale.push("Insufficient evidence — rank position structural only; score unknown");
    }
    return {
      rank: 0,
      productId: p.productId,
      productName: p.name,
      score,
      bestFor: p.bestFor,
      rationale,
      fabricated: false as const,
      evidencePresent: score != null || featureCount > 0 || p.price != null,
      _index: index,
    };
  });

  scored.sort((a, b) => {
    if (a.score == null && b.score == null) return a._index - b._index;
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    return b.score - a.score;
  });

  return scored.slice(0, Math.max(1, topN)).map((r, i) => {
    const { _index: _, ...rest } = r;
    return { ...rest, rank: i + 1 };
  });
}

export function buildMethodology(hasScores: boolean): MethodologySummary {
  return {
    methodologyId: nextPageId("method"),
    summary:
      "Rankings and comparisons are derived only from Affiliate Opportunity Report fields and supplied product fixtures. Missing prices, features, or scores remain unknown — never fabricated.",
    factors: [
      "opportunity_score_from_q802_when_present",
      "observed_feature_and_spec_evidence",
      "observed_price_evidence",
      "best_for_labels_from_fixtures",
    ],
    evidenceRules: [
      "Empty evidence yields unknown cells / unknown scores",
      "Top-N order uses observed scores when present, otherwise fixture order",
      hasScores
        ? "At least one observed score or feature/price signal was available"
        : "No scorable evidence — ranking is structural listing only",
    ],
    neverFabricatedRankings: true,
  };
}

export function buildComparisonPage(
  topic: string,
  products: ComparedProduct[],
  tables: ComparisonTable[],
): ComparisonPage {
  return {
    pageId: nextPageId("cmp"),
    pageType: "comparison",
    title: `${topic} comparison`,
    topic,
    productsCompared: products.map((p) => p.name),
    summary:
      products.length === 0
        ? "No products available from evidence — comparison page shell only."
        : `Structural comparison of ${products.length} product(s) for ${topic} based on verified fixture/opportunity evidence.`,
    sections: [
      {
        heading: "Overview",
        body: products.length
          ? `Products compared: ${products.map((p) => p.name).join(", ")}.`
          : "No product evidence supplied.",
      },
      {
        heading: "Tables",
        body: tables.length
          ? `Includes ${tables.length} evidence-derived comparison table(s).`
          : "No tables generated — insufficient evidence.",
      },
      {
        heading: "Transparency",
        body: "Cells marked unknown or not evidenced were never invented.",
      },
    ],
    fabricated: false,
  };
}

export function buildRankingPage(
  topic: string,
  rankings: RankingResult[],
  methodology: MethodologySummary,
): RankingPage {
  return {
    pageId: nextPageId("rank"),
    pageType: "ranking",
    title: `Top ${rankings.length || 0} ${topic}`,
    topic,
    topN: rankings.length,
    rankings: rankings.map((r) => ({ ...r, rationale: [...r.rationale] })),
    methodologyRef: methodology.methodologyId,
    fabricated: false,
  };
}

export function buildBuyerGuide(
  topic: string,
  products: ComparedProduct[],
  rankings: RankingResult[],
): BuyerGuide {
  const buyingFactors = [
    "observed features and specifications",
    "observed pricing and value signals",
    "best-for fit from fixture labels",
    "opportunity ranking signals when available",
  ];
  const bestForRecommendations = products
    .filter((p) => p.bestFor)
    .map((p) => ({
      label: `Best for ${p.bestFor}`,
      productId: p.productId,
      productName: p.name,
      reason: `Fixture bestFor label: ${p.bestFor}`,
    }));
  if (!bestForRecommendations.length && rankings[0]) {
    bestForRecommendations.push({
      label: "Top evidenced pick",
      productId: rankings[0].productId,
      productName: rankings[0].productName,
      reason:
        rankings[0].score != null
          ? `Highest observed score ${rankings[0].score}`
          : "Listed first from available evidence order",
    });
  }
  return {
    guideId: nextPageId("guide"),
    title: `${topic} buyer guide`,
    topic,
    buyingFactors,
    bestForRecommendations,
    faqs: [
      {
        question: `How were ${topic} products ranked?`,
        answer:
          "Only from Affiliate Opportunity scores and product fixture evidence. Missing data stays unknown.",
      },
      {
        question: "Are prices guaranteed?",
        answer:
          "No. Prices shown only when present in fixtures; otherwise marked unknown.",
      },
      {
        question: "Is this published live?",
        answer:
          "No. Comparison Site Worker produces structural content packages only and never publishes websites.",
      },
    ],
    prosConsByProduct: products.map((p) => ({
      productId: p.productId,
      productName: p.name,
      pros: p.pros.length ? [...p.pros] : ["No pros evidenced"],
      cons: p.cons.length ? [...p.cons] : ["No cons evidenced"],
    })),
    fabricated: false,
  };
}

export function computeConfidence(parts: {
  products: number;
  hasTables: boolean;
  hasRankings: boolean;
  hasScoredRanking: boolean;
  hasBuyerGuide: boolean;
  hasMethodology: boolean;
  hasOpportunityLink: boolean;
}): number {
  const checks = [
    parts.products > 0,
    parts.hasTables,
    parts.hasRankings,
    parts.hasScoredRanking,
    parts.hasBuyerGuide,
    parts.hasMethodology,
    parts.hasOpportunityLink,
  ];
  return Number((checks.filter(Boolean).length / checks.length).toFixed(2));
}
