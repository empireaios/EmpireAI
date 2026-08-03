import type { ProductEvaluationWorkerConfiguration } from "./configuration.js";
import {
  PEW_METADATA_VERSION,
  PRODUCT_EVALUATION_REPORT_VERSION,
  PRODUCT_EVALUATION_WORKER_IDENTITY,
} from "./paths.js";
import type {
  DiscoveredProductInput,
  EvidenceItem,
  EvaluationRecommendation,
  IntegrationHandshake,
  ProductEvaluationReport,
  ProductEvaluationWorkerCatalog,
  ProductEvaluationWorkerInput,
  ScoreDimension,
} from "./types.js";

/** Pure Product Evaluation Worker helpers for Q3-03 — evaluation only. */
export class EvaluationBuilder {
  buildCatalog(
    config: ProductEvaluationWorkerConfiguration,
    evaluations: ProductEvaluationReport[],
    integrations: IntegrationHandshake[],
  ): ProductEvaluationWorkerCatalog {
    return {
      reportVersion: PRODUCT_EVALUATION_REPORT_VERSION,
      workerId: config.workerId,
      evaluations: evaluations.map(cloneEvaluation),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: PEW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverDiscoverProducts: true,
      neverSelectSuppliers: true,
      neverCreateListings: true,
      neverPurchaseInventory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  resolveProducts(
    input: ProductEvaluationWorkerInput,
    fromDiscovery: DiscoveredProductInput[] = [],
  ): DiscoveredProductInput[] {
    const products: DiscoveredProductInput[] = [];
    if (input.discoveredProduct) products.push(input.discoveredProduct);
    for (const p of input.discoveredProducts ?? []) products.push(p);
    if (input.productId || input.productName) {
      products.push({
        discoveryId: input.discoveryId,
        productId: input.productId,
        productName: input.productName,
        category: input.category,
      });
    }
    if (!products.length && fromDiscovery.length) {
      if (input.discoveryId) {
        const match = fromDiscovery.find((d) => d.discoveryId === input.discoveryId);
        if (match) return [match];
      }
      return fromDiscovery.slice(-5);
    }
    return products.filter((p) => p.productName?.trim() || p.productId?.trim());
  }

  evaluate(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
    products: DiscoveredProductInput[],
  ): ProductEvaluationReport[] {
    return products.map((product) => this.evaluateOne(product, input, config));
  }

  evaluateOne(
    product: DiscoveredProductInput,
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ): ProductEvaluationReport {
    evaluationSequence += 1;
    const now = new Date().toISOString();
    const productName =
      product.productName?.trim() ||
      input.productName?.trim() ||
      `unnamed-product-${evaluationSequence}`;
    const productId =
      product.productId?.trim() ||
      input.productId?.trim() ||
      `prod-${slug(productName)}-${evaluationSequence}`;
    const category = product.category?.trim() || input.category?.trim() || "unknown";

    const scores = this.computeScores(product, input);
    const overallScore = this.overallScore(scores);
    const recommendation = this.recommend(overallScore, scores, config);
    const evidence = this.compileEvidence(product, input, scores, now);
    const facts = unique(evidence.filter((e) => e.kind === "fact").map((e) => e.claim));
    const assumptions = unique(
      evidence.filter((e) => e.kind === "assumption").map((e) => e.claim),
    );
    const confidenceScore = this.scoreConfidence(product, evidence, input);

    return {
      evaluationId:
        input.evaluationId?.trim() && evaluationSequence === 1
          ? input.evaluationId.trim()
          : `pew-eval-${Date.now()}-${evaluationSequence}`,
      timestamp: now,
      productId,
      productName,
      category,
      discoveryId: product.discoveryId?.trim() || input.discoveryId?.trim() || null,
      businessMissionId: product.businessMissionId?.trim() || null,
      marginScore: scores.margin,
      demandScore: scores.demand,
      competitionScore: scores.competition,
      shippingScore: scores.shipping,
      riskScore: scores.risk,
      reviewScore: scores.review,
      creativePotentialScore: scores.creative_potential,
      overallScore,
      recommendation,
      supportingEvidence: evidence,
      confidenceScore,
      facts,
      assumptions,
      scoreNotes: {
        margin: scores.notes.margin,
        demand: scores.notes.demand,
        competition: scores.notes.competition,
        shipping: scores.notes.shipping,
        risk: scores.notes.risk,
        review: scores.notes.review,
        creative_potential: scores.notes.creative_potential,
        overall: `Weighted overall ${overallScore}/100 → ${recommendation}`,
      },
      metadataVersion: PEW_METADATA_VERSION,
      reportVersion: PRODUCT_EVALUATION_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || PRODUCT_EVALUATION_WORKER_IDENTITY.workerId,
      neverDiscoverProducts: true,
      neverSelectSuppliers: true,
      neverCreateListings: true,
      neverPurchaseInventory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ304OrLater: true,
      preserveDiscoveryTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  computeScores(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput) {
    const margin = clamp(
      input.marginHint ?? this.scoreMargin(product, input),
    );
    const demand = clamp(
      input.demandHint ?? this.scoreDemand(product, input),
    );
    const competition = clamp(
      input.competitionHint ?? this.scoreCompetition(product, input),
    );
    const shipping = clamp(
      input.shippingHint ?? this.scoreShipping(product, input),
    );
    const risk = clamp(input.riskHint ?? this.scoreRisk(product, input));
    const review = clamp(
      input.reviewHint ?? this.scoreReviews(product, input),
    );
    const creative_potential = clamp(
      input.creativePotentialHint ?? this.scoreCreative(product, input),
    );

    return {
      margin,
      demand,
      competition,
      shipping,
      risk,
      review,
      creative_potential,
      notes: {
        margin: `Margin score ${margin}/100 from cost/price and discovery economics signals`,
        demand: `Demand score ${demand}/100 from trend/demand signals`,
        competition: `Competition score ${competition}/100 (higher = more favorable / less crowded)`,
        shipping: `Shipping practicality ${shipping}/100 from weight/fulfillment signals`,
        risk: `Operational risk score ${risk}/100 (higher = lower risk)`,
        review: `Review quality ${review}/100 from rating/volume signals`,
        creative_potential: `Creative potential ${creative_potential}/100 from assets/category fit`,
      } as Record<Exclude<ScoreDimension, "overall">, string>,
    };
  }

  overallScore(scores: {
    margin: number;
    demand: number;
    competition: number;
    shipping: number;
    risk: number;
    review: number;
    creative_potential: number;
  }): number {
    const weighted =
      scores.margin * 0.2 +
      scores.demand * 0.2 +
      scores.competition * 0.15 +
      scores.shipping * 0.1 +
      scores.risk * 0.15 +
      scores.review * 0.1 +
      scores.creative_potential * 0.1;
    return Number(weighted.toFixed(1));
  }

  recommend(
    overall: number,
    scores: { risk: number; demand: number; margin: number },
    config: ProductEvaluationWorkerConfiguration,
  ): EvaluationRecommendation {
    if (overall >= config.proceedThreshold && scores.risk >= 40 && scores.demand >= 40) {
      return "Proceed";
    }
    if (overall >= config.reviewThreshold) return "Review";
    return "Reject";
  }

  scoreMargin(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    const cost = input.estimatedCost;
    const price = input.estimatedPrice;
    if (cost != null && price != null && price > 0) {
      const marginPct = ((price - cost) / price) * 100;
      return clamp(30 + marginPct);
    }
    let score = 55;
    if (product.supplier) score += 5;
    if (/premium|luxury/i.test(product.productName ?? "")) score += 5;
    if (/commodity|generic/i.test(product.productName ?? "")) score -= 10;
    return score;
  }

  scoreDemand(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    const signals = [
      ...(product.searchTrendSignals ?? []),
      ...(product.customerDemandSignals ?? []),
    ];
    let score = 45 + Math.min(30, signals.length * 8);
    if (/rising|high|growing|spike|viral|request/i.test(signals.join(" "))) score += 15;
    if (product.trendDirection === "emerging") score += 10;
    if (product.trendDirection === "declining") score -= 25;
    if ((product.confidenceScore ?? 0) > 0.7) score += 5;
    if (input.demandHint != null) return clamp(input.demandHint);
    return score;
  }

  scoreCompetition(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    const count = input.competitorCount;
    if (count != null) {
      if (count <= 3) return 85;
      if (count <= 10) return 65;
      if (count <= 30) return 45;
      return 25;
    }
    let score = 60;
    if (product.marketplace === "amazon") score -= 10;
    if (/niche|specialty|custom/i.test(product.discoveryReason ?? "")) score += 15;
    return score;
  }

  scoreShipping(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    const weight = input.shippingWeightKg;
    if (weight != null) {
      if (weight <= 0.5) return 90;
      if (weight <= 2) return 75;
      if (weight <= 10) return 50;
      return 25;
    }
    let score = 65;
    if (/furniture|battery|liquid|fragile/i.test(product.productName ?? "")) score -= 20;
    if (/digital|ebook|software/i.test(product.productName ?? "")) score = 95;
    if (/organizer|charger|mat|candle|lamp/i.test(product.productName ?? "")) score += 10;
    return score;
  }

  scoreRisk(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    let score = 70;
    if (product.trendDirection === "declining") score -= 20;
    if (/medical|supplement|weapon|hazard/i.test(product.productName ?? "")) score -= 25;
    if (product.discoverySource === "marketplace" || product.discoverySource === "supplier") {
      score += 5;
    }
    if ((product.confidenceScore ?? 0) < 0.4) score -= 10;
    if (input.riskHint != null) return clamp(input.riskHint);
    return score;
  }

  scoreReviews(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    const rating = input.averageReviewRating;
    const count = input.reviewCount;
    if (rating != null) {
      let score = rating * 18;
      if (count != null) {
        if (count >= 100) score += 10;
        else if (count >= 20) score += 5;
        else if (count < 5) score -= 10;
      }
      return clamp(score);
    }
    return 55;
  }

  scoreCreative(product: DiscoveredProductInput, input: ProductEvaluationWorkerInput): number {
    let score = 50;
    if (input.creativeAssetsAvailable === true) score += 25;
    if (/lifestyle|gift|decor|beauty|apparel/i.test(product.category ?? "")) score += 15;
    if (/commodity|bulk|raw/i.test(product.productName ?? "")) score -= 15;
    if ((product.customerDemandSignals?.length ?? 0) > 0) score += 5;
    return score;
  }

  compileEvidence(
    product: DiscoveredProductInput,
    input: ProductEvaluationWorkerInput,
    scores: ReturnType<EvaluationBuilder["computeScores"]>,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "provided_source",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }
    for (const raw of product.supportingEvidence ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "product_discovery",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "discovery",
      );
    }
    if (product.discoveryId) {
      add(
        "product_discovery_worker",
        `Traceable to discovery ${product.discoveryId}`,
        "fact",
        "traceability",
      );
    }
    add(
      "evaluation_scoring",
      `Scores margin=${scores.margin} demand=${scores.demand} competition=${scores.competition} shipping=${scores.shipping} risk=${scores.risk} review=${scores.review} creative=${scores.creative_potential}`,
      "assumption",
      "overall",
    );
    add(
      "boundary",
      "Evaluation-only: does not discover products, select suppliers, create listings, or purchase inventory",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    product: DiscoveredProductInput,
    evidence: EvidenceItem[],
    input: ProductEvaluationWorkerInput,
  ): number {
    const facts = evidence.filter((e) => e.kind === "fact").length;
    const assumptions = evidence.filter((e) => e.kind === "assumption").length;
    let score = 0.4;
    score += Math.min(0.3, facts * 0.05);
    score -= Math.min(0.15, assumptions * 0.02);
    if (product.discoveryId) score += 0.1;
    if (
      input.estimatedCost != null ||
      input.averageReviewRating != null ||
      input.competitorCount != null
    ) {
      score += 0.1;
    }
    if ((product.confidenceScore ?? 0) > 0.6) score += 0.05;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let evaluationSequence = 0;

export function resetEvaluationSequenceForTesting() {
  evaluationSequence = 0;
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(100, value)).toFixed(1));
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneEvaluation(evaluation: ProductEvaluationReport): ProductEvaluationReport {
  return {
    ...evaluation,
    facts: [...evaluation.facts],
    assumptions: [...evaluation.assumptions],
    supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
    scoreNotes: { ...evaluation.scoreNotes },
  };
}
