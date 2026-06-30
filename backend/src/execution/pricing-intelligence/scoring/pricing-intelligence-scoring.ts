import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { BundlePricing } from "../models/bundle-pricing.js";
import type { DiscountStrategy } from "../models/discount-strategy.js";
import type { OptimalPrice } from "../models/optimal-price.js";
import type { PricingFactorAnalysis } from "../models/pricing-factor-analysis.js";
import {
  PRICING_FACTOR_LABELS,
  PRICING_FACTOR_TYPES,
  type PricingFactorType,
} from "../models/pricing-factor-types.js";
import type { PricingIntelligenceBlueprintCreateInput } from "../models/pricing-intelligence-blueprint.js";
import type { PricingSignal, PricingSignalType } from "../models/pricing-signal.js";
import type { PsychologicalPricing } from "../models/psychological-pricing.js";

export const PRICING_SIGNAL_WEIGHTS: Record<PricingSignalType, number> = {
  cost_competitiveness: 0.14,
  competitive_position: 0.14,
  margin_health: 0.14,
  demand_alignment: 0.12,
  elasticity_balance: 0.12,
  psychological_fit: 0.1,
  bundle_opportunity: 0.1,
  discount_safety: 0.12,
  pricing_composite: 0.02,
};

export type PricingIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type PricingIntelligenceOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  averageOrderValue?: number;
};

export type PricingIntelligenceInput = {
  brand: PricingIntelligenceBrandInput;
  offer: PricingIntelligenceOfferInput;
  storeId: string;
  supplierCost?: number;
  competitorPrice?: number;
  demandIndex?: number;
};

export type PricingIntelligenceBreakdown = PricingIntelligenceBlueprintCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function toCharmPrice(value: number): number {
  const base = Math.floor(value);
  const endings = [0.99, 0.95, 0.97];
  const ending = endings[base % 3]!;
  return roundPrice(base + ending);
}

function buildSignal(signalType: PricingSignalType, score: number, detail: string): PricingSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: PRICING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function resolveEconomics(input: PricingIntelligenceInput) {
  const aov = input.offer.averageOrderValue ?? 49.99;
  const supplierCost = input.supplierCost ?? roundPrice(aov * 0.38);
  const competitorPrice = input.competitorPrice ?? roundPrice(aov * 1.08);
  const demandIndex = input.demandIndex ?? clampScore(input.brand.confidence * 0.85 + 10);
  const targetMarginPercent = clampScore(55 + input.brand.confidence * 0.05);
  const costBasedPrice = roundPrice(supplierCost / (1 - targetMarginPercent / 100));
  const competitivePrice = roundPrice(competitorPrice * 0.97);
  const demandAdjusted = roundPrice(
    costBasedPrice * (0.95 + (demandIndex / 100) * 0.1),
  );
  const recommended = toCharmPrice(
    roundPrice(average([costBasedPrice, competitivePrice, demandAdjusted])),
  );
  const compareAt = roundPrice(recommended * 1.25);
  const priceFloor = roundPrice(supplierCost * 1.35);
  const priceCeiling = roundPrice(competitorPrice * 1.15);
  const marginDollars = roundPrice(recommended - supplierCost);
  const marginPercent = roundPrice((marginDollars / recommended) * 100);
  const elasticityEstimate = roundPrice(1.2 - demandIndex / 200);

  return {
    aov,
    supplierCost,
    competitorPrice,
    demandIndex,
    targetMarginPercent,
    recommended,
    compareAt,
    priceFloor,
    priceCeiling,
    marginDollars,
    marginPercent,
    elasticityEstimate,
    costBasedPrice,
    competitivePrice,
  };
}

function buildFactorAnalyses(
  input: PricingIntelligenceInput,
  economics: ReturnType<typeof resolveEconomics>,
): PricingFactorAnalysis[] {
  const base = clampScore(input.brand.confidence * 0.55 + 25);

  const definitions: Array<{
    factorType: PricingFactorType;
    current: number;
    recommended: number;
    unit: string;
    findings: string[];
    recommendation: string;
    modifier: number;
    benchmark: number;
  }> = [
    {
      factorType: "SUPPLIER_COST",
      current: economics.supplierCost,
      recommended: economics.supplierCost,
      unit: "USD",
      findings: [
        `Supplier cost $${economics.supplierCost.toFixed(2)} represents ${roundPrice((economics.supplierCost / economics.recommended) * 100)}% of recommended retail.`,
        `Cost floor with 35% markup: $${economics.priceFloor.toFixed(2)}.`,
      ],
      recommendation: "Maintain supplier cost monitoring; renegotiate if cost exceeds 42% of retail.",
      modifier: economics.supplierCost / economics.recommended < 0.42 ? 5 : -3,
      benchmark: 58,
    },
    {
      factorType: "COMPETITION",
      current: economics.competitorPrice,
      recommended: economics.competitivePrice,
      unit: "USD",
      findings: [
        `Competitor benchmark $${economics.competitorPrice.toFixed(2)} — recommended price ${economics.recommended < economics.competitorPrice ? "undercuts" : "matches"} market.`,
        `Price gap: ${roundPrice(((economics.recommended - economics.competitorPrice) / economics.competitorPrice) * 100)}% vs competition.`,
      ],
      recommendation: `Price at $${economics.recommended.toFixed(2)} for competitive advantage without race-to-bottom.`,
      modifier: economics.recommended <= economics.competitorPrice ? 4 : -2,
      benchmark: 62,
    },
    {
      factorType: "MARGIN",
      current: economics.marginPercent,
      recommended: economics.targetMarginPercent,
      unit: "percent",
      findings: [
        `Current margin at recommended price: ${economics.marginPercent.toFixed(1)}% ($${economics.marginDollars.toFixed(2)} per unit).`,
        `Target margin band: ${economics.targetMarginPercent - 5}–${economics.targetMarginPercent + 5}%.`,
      ],
      recommendation: `Maintain minimum ${(economics.targetMarginPercent - 10).toFixed(0)}% gross margin after discounts.`,
      modifier: economics.marginPercent >= 50 ? 6 : 0,
      benchmark: 60,
    },
    {
      factorType: "DEMAND",
      current: economics.demandIndex,
      recommended: clampScore(economics.demandIndex + 5),
      unit: "index",
      findings: [
        `Demand index ${economics.demandIndex}/100 for ${input.brand.niche.toLowerCase()}.`,
        `${input.brand.targetAudience.slice(0, 60)}… shows ${economics.demandIndex >= 70 ? "strong" : "moderate"} purchase intent.`,
      ],
      recommendation: economics.demandIndex >= 70
        ? "Demand supports premium positioning — avoid deep discounting."
        : "Moderate demand — test price sensitivity with limited promotions.",
      modifier: economics.demandIndex >= 70 ? 4 : 0,
      benchmark: 55,
    },
    {
      factorType: "ELASTICITY",
      current: economics.elasticityEstimate,
      recommended: 1.0,
      unit: "coefficient",
      findings: [
        `Estimated price elasticity: ${economics.elasticityEstimate.toFixed(2)} (${economics.elasticityEstimate < 1 ? "inelastic" : "elastic"} demand).`,
        `10% price increase estimated to reduce volume by ${roundPrice(economics.elasticityEstimate * 10)}%.`,
      ],
      recommendation:
        economics.elasticityEstimate < 1
          ? "Inelastic demand — room for modest price increases."
          : "Elastic demand — prioritize value messaging over price increases.",
      modifier: economics.elasticityEstimate < 1.1 ? 3 : -2,
      benchmark: 58,
    },
    {
      factorType: "PSYCHOLOGICAL_PRICING",
      current: economics.aov,
      recommended: economics.recommended,
      unit: "USD",
      findings: [
        `Charm price $${economics.recommended.toFixed(2)} vs round number $${Math.ceil(economics.recommended)}.00.`,
        `Anchor price $${economics.compareAt.toFixed(2)} creates ${roundPrice(((economics.compareAt - economics.recommended) / economics.compareAt) * 100)}% perceived savings.`,
      ],
      recommendation: `Use $${economics.recommended.toFixed(2)} with $${economics.compareAt.toFixed(2)} compare-at anchor.`,
      modifier: 4,
      benchmark: 65,
    },
    {
      factorType: "BUNDLES",
      current: economics.recommended,
      recommended: roundPrice(economics.recommended * 1.75),
      unit: "USD",
      findings: [
        `Single-unit price $${economics.recommended.toFixed(2)} — 2-pack bundle opportunity at 12–15% savings.`,
        `${input.offer.keyBenefits.length} benefits support bundle value messaging.`,
      ],
      recommendation: "Offer 2-pack and 3-pack bundles at 12% and 18% savings respectively.",
      modifier: input.offer.keyBenefits.length >= 3 ? 4 : 0,
      benchmark: 52,
    },
    {
      factorType: "DISCOUNT_STRATEGY",
      current: 15,
      recommended: 12,
      unit: "percent",
      findings: [
        "Max safe discount before margin breach: ~18% at recommended price.",
        "Welcome and cart recovery discounts should cap at 10–15%.",
      ],
      recommendation: "Tier discounts: 10% welcome, 10% cart recovery, 15% seasonal max.",
      modifier: economics.marginPercent >= 55 ? 3 : -3,
      benchmark: 56,
    },
  ];

  return definitions.map((definition) => ({
    analysisId: randomUUID(),
    factorType: definition.factorType,
    displayName: PRICING_FACTOR_LABELS[definition.factorType],
    score: clampScore(base + definition.modifier),
    benchmarkScore: definition.benchmark,
    currentValue: definition.current,
    recommendedValue: definition.recommended,
    unit: definition.unit,
    findings: definition.findings,
    recommendation: definition.recommendation,
  }));
}

function buildOptimalPrice(
  input: PricingIntelligenceInput,
  economics: ReturnType<typeof resolveEconomics>,
  confidence: number,
): OptimalPrice {
  return {
    priceId: randomUUID(),
    recommendedPrice: economics.recommended,
    compareAtPrice: economics.compareAt,
    priceFloor: economics.priceFloor,
    priceCeiling: economics.priceCeiling,
    currency: "USD",
    marginPercent: economics.marginPercent,
    marginDollars: economics.marginDollars,
    supplierCost: economics.supplierCost,
    confidence: clampScore(confidence),
    rationale: `Optimal price $${economics.recommended.toFixed(2)} balances supplier cost ($${economics.supplierCost.toFixed(2)}), competition ($${economics.competitorPrice.toFixed(2)}), and demand index (${economics.demandIndex}) for ${input.offer.offerTitle}.`,
  };
}

function buildPsychologicalPricing(economics: ReturnType<typeof resolveEconomics>): PsychologicalPricing {
  const installmentMonths = 4;

  return {
    tacticId: randomUUID(),
    charmPrice: economics.recommended,
    anchorPrice: economics.compareAt,
    installmentPrice: roundPrice(economics.recommended / installmentMonths),
    installmentMonths,
    tactics: [
      "Charm pricing (.99/.95 endings)",
      "Compare-at anchor pricing",
      "Installment framing (4 payments)",
      "Per-day cost breakdown",
      "Free shipping threshold just above AOV",
    ],
    score: clampScore(72 + (economics.marginPercent > 50 ? 5 : 0)),
  };
}

function buildBundles(
  input: PricingIntelligenceInput,
  economics: ReturnType<typeof resolveEconomics>,
): BundlePricing[] {
  const unit = economics.recommended;

  return [
    {
      bundleId: randomUUID(),
      bundleName: `${input.offer.offerTitle} — 2-Pack`,
      itemCount: 2,
      individualTotal: roundPrice(unit * 2),
      bundlePrice: roundPrice(unit * 2 * 0.88),
      savingsPercent: 12,
      savingsDollars: roundPrice(unit * 2 * 0.12),
      score: clampScore(70 + input.brand.confidence * 0.05),
    },
    {
      bundleId: randomUUID(),
      bundleName: `${input.offer.offerTitle} — 3-Pack`,
      itemCount: 3,
      individualTotal: roundPrice(unit * 3),
      bundlePrice: roundPrice(unit * 3 * 0.82),
      savingsPercent: 18,
      savingsDollars: roundPrice(unit * 3 * 0.18),
      score: clampScore(68 + input.brand.confidence * 0.04),
    },
    {
      bundleId: randomUUID(),
      bundleName: `${input.brand.brandName} Starter Kit`,
      itemCount: 2,
      individualTotal: roundPrice(unit * 1.5),
      bundlePrice: roundPrice(unit * 1.25),
      savingsPercent: 17,
      savingsDollars: roundPrice(unit * 1.5 - unit * 1.25),
      score: clampScore(65 + input.offer.keyBenefits.length * 2),
    },
  ];
}

function buildDiscountStrategy(economics: ReturnType<typeof resolveEconomics>): DiscountStrategy {
  return {
    strategyId: randomUUID(),
    maxDiscountPercent: 15,
    minMarginFloorPercent: clampScore(economics.marginPercent - 18),
    tiers: [
      {
        discountType: "WELCOME",
        discountPercent: 10,
        trigger: "First purchase — newsletter signup",
        minOrderValue: 0,
      },
      {
        discountType: "CART_RECOVERY",
        discountPercent: 10,
        trigger: "Abandoned cart — 72h sequence final touch",
        minOrderValue: 0,
      },
      {
        discountType: "VOLUME",
        discountPercent: 12,
        trigger: "2+ item bundle purchase",
        minOrderValue: roundPrice(economics.recommended * 1.5),
      },
      {
        discountType: "SEASONAL",
        discountPercent: 15,
        trigger: "Seasonal promotion — max 2x per year",
        minOrderValue: 0,
      },
      {
        discountType: "LOYALTY",
        discountPercent: 8,
        trigger: "VIP repeat customer — 2+ orders",
        minOrderValue: 0,
      },
    ],
    score: clampScore(70 + (economics.marginPercent > 55 ? 5 : 0)),
  };
}

function buildSignals(
  factorAnalyses: PricingFactorAnalysis[],
  bundles: BundlePricing[],
  discountStrategy: DiscountStrategy,
  psychological: PsychologicalPricing,
  confidence: number,
): PricingSignal[] {
  const byType = new Map(factorAnalyses.map((analysis) => [analysis.factorType, analysis]));

  return [
    buildSignal(
      "cost_competitiveness",
      byType.get("SUPPLIER_COST")!.score,
      `Supplier cost analysis ${byType.get("SUPPLIER_COST")!.score}/100`,
    ),
    buildSignal(
      "competitive_position",
      byType.get("COMPETITION")!.score,
      `Competition analysis ${byType.get("COMPETITION")!.score}/100`,
    ),
    buildSignal(
      "margin_health",
      byType.get("MARGIN")!.score,
      `Margin analysis ${byType.get("MARGIN")!.score}/100`,
    ),
    buildSignal(
      "demand_alignment",
      byType.get("DEMAND")!.score,
      `Demand analysis ${byType.get("DEMAND")!.score}/100`,
    ),
    buildSignal(
      "elasticity_balance",
      byType.get("ELASTICITY")!.score,
      `Elasticity analysis ${byType.get("ELASTICITY")!.score}/100`,
    ),
    buildSignal(
      "psychological_fit",
      psychological.score,
      `Psychological pricing ${psychological.score}/100`,
    ),
    buildSignal(
      "bundle_opportunity",
      average(bundles.map((bundle) => bundle.score)),
      `Bundle pricing average ${average(bundles.map((bundle) => bundle.score)).toFixed(0)}/100`,
    ),
    buildSignal(
      "discount_safety",
      discountStrategy.score,
      `Discount strategy ${discountStrategy.score}/100`,
    ),
    buildSignal("pricing_composite", confidence, `Pricing intelligence confidence ${confidence}`),
  ];
}

function computeConfidence(signals: PricingSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "pricing_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "pricing_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(factorAnalyses: PricingFactorAnalysis[]): number {
  return clampScore(average(factorAnalyses.map((analysis) => analysis.score)));
}

/** Generates optimal pricing blueprint — intelligence only, no auto-apply. */
export function generatePricingBlueprint(
  input: PricingIntelligenceInput,
): PricingIntelligenceBreakdown {
  const economics = resolveEconomics(input);
  const factorAnalyses = buildFactorAnalyses(input, economics);

  for (const factorType of PRICING_FACTOR_TYPES) {
    if (!factorAnalyses.find((analysis) => analysis.factorType === factorType)) {
      throw new Error(`Missing required pricing factor: ${factorType}`);
    }
  }

  const psychologicalPricing = buildPsychologicalPricing(economics);
  const bundles = buildBundles(input, economics);
  const discountStrategy = buildDiscountStrategy(economics);

  const provisionalSignals = buildSignals(
    factorAnalyses,
    bundles,
    discountStrategy,
    psychologicalPricing,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    factorAnalyses,
    bundles,
    discountStrategy,
    psychologicalPricing,
    confidence,
  );
  const optimalPrice = buildOptimalPrice(input, economics, confidence);
  const overallScore = computeOverallScore(factorAnalyses);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    blueprintName: `${input.brand.brandName} Pricing Intelligence`,
    optimalPrice,
    factorAnalyses,
    psychologicalPricing,
    bundles,
    discountStrategy,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoApplyEnabled: false,
  };
}

export const pricingIntelligenceScoring = {
  generatePricingBlueprint,
  computeConfidence,
  computeOverallScore,
  PRICING_SIGNAL_WEIGHTS,
};
