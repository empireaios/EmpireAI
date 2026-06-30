import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { CompetitorWeakness } from "../models/competitor-weakness.js";
import type { FeatureRequest } from "../models/feature-request.js";
import type { PainPoint } from "../models/pain-point.js";
import type { PositiveTheme } from "../models/positive-theme.js";
import type { ProductImprovement } from "../models/product-improvement.js";
import type { ReviewIntelligenceReportCreateInput } from "../models/review-intelligence-report.js";
import type {
  ReviewIntelligenceSignal,
  ReviewIntelligenceSignalType,
} from "../models/review-intelligence-signal.js";
import type { SentimentAnalysis } from "../models/sentiment-analysis.js";

export const REVIEW_INTELLIGENCE_SIGNAL_WEIGHTS: Record<ReviewIntelligenceSignalType, number> = {
  sentiment_quality: 0.18,
  pain_point_coverage: 0.16,
  positive_theme_strength: 0.14,
  feature_demand: 0.14,
  competitor_gap_exploit: 0.14,
  improvement_actionability: 0.22,
  review_composite: 0.02,
};

export type ReviewIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type ReviewIntelligenceOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
};

export type ReviewIntelligenceInput = {
  brand: ReviewIntelligenceBrandInput;
  offer: ReviewIntelligenceOfferInput;
  storeId: string;
  reviewCount?: number;
  averageRating?: number;
  competitors?: string[];
};

export type ReviewIntelligenceBreakdown = ReviewIntelligenceReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: ReviewIntelligenceSignalType,
  score: number,
  detail: string,
): ReviewIntelligenceSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: REVIEW_INTELLIGENCE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: ReviewIntelligenceInput): number {
  return clampScore(input.brand.confidence * 0.52 + 22);
}

function buildSentiment(input: ReviewIntelligenceInput): SentimentAnalysis {
  const reviewCount = input.reviewCount ?? 248;
  const averageRating = input.averageRating ?? 4.3;
  const positivePercent = clampScore(averageRating * 20 + input.brand.confidence * 0.05);
  const negativePercent = clampScore(100 - positivePercent - 12);
  const neutralPercent = clampScore(100 - positivePercent - negativePercent);

  let dominantSentiment: SentimentAnalysis["dominantSentiment"] = "MIXED";
  if (positivePercent >= 65) dominantSentiment = "POSITIVE";
  else if (negativePercent >= 40) dominantSentiment = "NEGATIVE";
  else if (neutralPercent >= 50) dominantSentiment = "NEUTRAL";

  return {
    analysisId: randomUUID(),
    overallScore: clampScore(positivePercent - negativePercent * 0.5 + 30),
    positivePercent,
    negativePercent,
    neutralPercent,
    dominantSentiment,
    reviewCount,
    averageRating,
  };
}

function buildPainPoints(input: ReviewIntelligenceInput): PainPoint[] {
  const base = baseScore(input);
  const product = input.offer.offerTitle;

  return [
    {
      painPointId: randomUUID(),
      theme: "Shipping delays",
      description: `Customers report 5–7 day shipping delays on ${product} — exceeds category expectation of 3–5 days.`,
      mentionCount: 34,
      severity: "HIGH",
      score: clampScore(base - 5),
    },
    {
      painPointId: randomUUID(),
      theme: "Instruction clarity",
      description: "Setup instructions described as unclear — especially for first-time buyers.",
      mentionCount: 22,
      severity: "MEDIUM",
      score: clampScore(base - 8),
    },
    {
      painPointId: randomUUID(),
      theme: "Packaging damage",
      description: "Occasional packaging damage during transit reported in 3-star reviews.",
      mentionCount: 18,
      severity: "MEDIUM",
      score: clampScore(base - 10),
    },
    {
      painPointId: randomUUID(),
      theme: "Size expectations",
      description: "Product size smaller than expected based on listing photos.",
      mentionCount: 15,
      severity: "LOW",
      score: clampScore(base - 12),
    },
  ];
}

function buildPositiveThemes(input: ReviewIntelligenceInput): PositiveTheme[] {
  const base = baseScore(input);

  return [
    {
      themeId: randomUUID(),
      theme: "Build quality",
      description: `${input.offer.keyBenefits[0] ?? "Premium quality"} — consistently praised in 4–5 star reviews.`,
      mentionCount: 89,
      score: clampScore(base + 5),
    },
    {
      themeId: randomUUID(),
      theme: "Value for money",
      description: `Customers cite strong value relative to ${input.brand.niche.toLowerCase()} alternatives.`,
      mentionCount: 67,
      score: clampScore(base + 3),
    },
    {
      themeId: randomUUID(),
      theme: "Fast setup",
      description: "Easy unboxing and quick setup mentioned by repeat buyers.",
      mentionCount: 45,
      score: clampScore(base),
    },
    {
      themeId: randomUUID(),
      theme: "Brand trust",
      description: `${input.brand.brandName} positioning resonates — "${input.brand.slogan}" cited in reviews.`,
      mentionCount: 38,
      score: clampScore(base + 2),
    },
  ];
}

function buildFeatureRequests(input: ReviewIntelligenceInput): FeatureRequest[] {
  const base = baseScore(input);

  return [
    {
      requestId: randomUUID(),
      feature: "Extended warranty option",
      description: "Multiple reviewers request optional 2-year extended warranty at checkout.",
      demandScore: clampScore(base + 4),
      mentionCount: 28,
    },
    {
      requestId: randomUUID(),
      feature: "Accessory bundle",
      description: "Requests for complementary accessory bundle with main product.",
      demandScore: clampScore(base + 2),
      mentionCount: 24,
    },
    {
      requestId: randomUUID(),
      feature: "Subscription / replenishment",
      description: "Repeat buyers want auto-replenishment option for consumable parts.",
      demandScore: clampScore(base),
      mentionCount: 19,
    },
    {
      requestId: randomUUID(),
      feature: "Mobile app integration",
      description: "Tech-savvy segment requests app-based tracking or smart features.",
      demandScore: clampScore(base - 5),
      mentionCount: 12,
    },
  ];
}

function buildCompetitorWeaknesses(input: ReviewIntelligenceInput): CompetitorWeakness[] {
  const base = baseScore(input);
  const competitors = input.competitors ?? [
    "BlendMaster Direct",
    "KitchenPro Store",
    "ApplianceHub",
  ];

  const weaknessTemplates = [
    {
      weakness: "Poor customer support",
      description: "Reviews cite slow response times and unhelpful support tickets.",
      exploit: `Highlight ${input.brand.brandName} responsive support in product page and ads.`,
    },
    {
      weakness: "Inconsistent quality",
      description: "Quality variance between batches reported in 2–3 star reviews.",
      exploit: "Emphasize quality control and satisfaction guarantee.",
    },
    {
      weakness: "Hidden shipping costs",
      description: "Customers surprised by shipping fees added at checkout.",
      exploit: "Prominently display free-shipping threshold and transparent pricing.",
    },
  ];

  return competitors.slice(0, 3).map((competitorName, index) => {
    const template = weaknessTemplates[index] ?? weaknessTemplates[0]!;

    return {
      weaknessId: randomUUID(),
      competitorName,
      weakness: template.weakness,
      description: template.description,
      exploitOpportunity: template.exploit,
      score: clampScore(base + index * 2),
    };
  });
}

function buildProductImprovements(
  input: ReviewIntelligenceInput,
  painPoints: PainPoint[],
  featureRequests: FeatureRequest[],
  weaknesses: CompetitorWeakness[],
): ProductImprovement[] {
  const base = baseScore(input);
  const improvements: ProductImprovement[] = [];

  const add = (
    priority: ProductImprovement["priority"],
    title: string,
    description: string,
    rationale: string,
    targetArea: ProductImprovement["targetArea"],
    expectedImpact: string,
    modifier: number,
  ) => {
    improvements.push({
      improvementId: randomUUID(),
      priority,
      title,
      description,
      rationale,
      targetArea,
      expectedImpact,
      score: clampScore(base + modifier),
    });
  };

  const topPain = painPoints.find((point) => point.severity === "HIGH") ?? painPoints[0]!;
  add(
    "HIGH",
    `Address ${topPain.theme.toLowerCase()}`,
    topPain.description,
    `${topPain.mentionCount} review mentions — highest-severity pain point.`,
    topPain.theme.includes("Shipping") ? "SHIPPING" : "PRODUCT",
    "Reduce 1–2 star reviews by 15–20%",
    6,
  );

  add(
    "HIGH",
    "Add dimension diagram to product page",
    "Include size comparison photo and measurements to set accurate expectations.",
    "Size expectations pain point affects conversion and return rate.",
    "PRODUCT",
    "Lower return rate by 8–12%",
    4,
  );

  const topFeature = featureRequests[0]!;
  add(
    "MEDIUM",
    `Introduce ${topFeature.feature.toLowerCase()}`,
    topFeature.description,
    `${topFeature.mentionCount} customers requested this feature in reviews.`,
    "FEATURES",
    "Increase repeat purchase rate by 5%",
    3,
  );

  add(
    "MEDIUM",
    "Upgrade packaging for transit protection",
    "Reinforce packaging based on damage reports in 3-star reviews.",
    "Packaging damage mentioned in negative reviews.",
    "PACKAGING",
    "Reduce damage-related returns by 10%",
    2,
  );

  const topWeakness = weaknesses[0]!;
  add(
    "HIGH",
    `Exploit competitor gap: ${topWeakness.weakness.toLowerCase()}`,
    topWeakness.exploitOpportunity,
    `${topWeakness.competitorName} weakness identified in comparative review analysis.`,
    "SUPPORT",
    "Capture 3–5% competitor switchers",
    5,
  );

  add(
    "LOW",
    "Expand FAQ from review themes",
    "Add FAQ entries covering setup, sizing, and shipping based on common review questions.",
    "Reduces pre-purchase anxiety surfaced in neutral reviews.",
    "SUPPORT",
    "Improve conversion by 2–4%",
    0,
  );

  return improvements.sort((left, right) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[left.priority] - order[right.priority];
  });
}

function buildSignals(
  sentiment: SentimentAnalysis,
  painPoints: PainPoint[],
  positiveThemes: PositiveTheme[],
  featureRequests: FeatureRequest[],
  weaknesses: CompetitorWeakness[],
  improvements: ProductImprovement[],
  confidence: number,
): ReviewIntelligenceSignal[] {
  return [
    buildSignal(
      "sentiment_quality",
      sentiment.overallScore,
      `Sentiment ${sentiment.dominantSentiment} — ${sentiment.positivePercent}% positive`,
    ),
    buildSignal(
      "pain_point_coverage",
      average(painPoints.map((point) => point.score)),
      `${painPoints.length} pain points extracted`,
    ),
    buildSignal(
      "positive_theme_strength",
      average(positiveThemes.map((theme) => theme.score)),
      `${positiveThemes.length} positive themes identified`,
    ),
    buildSignal(
      "feature_demand",
      average(featureRequests.map((request) => request.demandScore)),
      `${featureRequests.length} feature requests ranked`,
    ),
    buildSignal(
      "competitor_gap_exploit",
      average(weaknesses.map((weakness) => weakness.score)),
      `${weaknesses.length} competitor weaknesses mapped`,
    ),
    buildSignal(
      "improvement_actionability",
      average(improvements.map((improvement) => improvement.score)),
      `${improvements.length} product improvements recommended`,
    ),
    buildSignal("review_composite", confidence, `Review intelligence confidence ${confidence}`),
  ];
}

function computeConfidence(signals: ReviewIntelligenceSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "review_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "review_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  sentiment: SentimentAnalysis,
  painPoints: PainPoint[],
  positiveThemes: PositiveTheme[],
  improvements: ProductImprovement[],
): number {
  return clampScore(
    average([
      sentiment.overallScore,
      average(positiveThemes.map((theme) => theme.score)),
      average(improvements.map((improvement) => improvement.score)),
      100 - average(painPoints.map((point) => point.severity === "HIGH" ? 20 : 10)),
    ]),
  );
}

/** Generates a complete review analysis report — intelligence only, no deployment. */
export function generateReviewIntelligenceReport(
  input: ReviewIntelligenceInput,
): ReviewIntelligenceBreakdown {
  const sentiment = buildSentiment(input);
  const painPoints = buildPainPoints(input);
  const positiveThemes = buildPositiveThemes(input);
  const featureRequests = buildFeatureRequests(input);
  const competitorWeaknesses = buildCompetitorWeaknesses(input);
  const productImprovements = buildProductImprovements(
    input,
    painPoints,
    featureRequests,
    competitorWeaknesses,
  );

  const provisionalSignals = buildSignals(
    sentiment,
    painPoints,
    positiveThemes,
    featureRequests,
    competitorWeaknesses,
    productImprovements,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    sentiment,
    painPoints,
    positiveThemes,
    featureRequests,
    competitorWeaknesses,
    productImprovements,
    confidence,
  );
  const overallScore = computeOverallScore(sentiment, painPoints, positiveThemes, productImprovements);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Review Intelligence`,
    sentiment,
    painPoints,
    positiveThemes,
    featureRequests,
    competitorWeaknesses,
    productImprovements,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoApplyEnabled: false,
  };
}

export const reviewIntelligenceScoring = {
  generateReviewIntelligenceReport,
  computeConfidence,
  computeOverallScore,
  REVIEW_INTELLIGENCE_SIGNAL_WEIGHTS,
};
