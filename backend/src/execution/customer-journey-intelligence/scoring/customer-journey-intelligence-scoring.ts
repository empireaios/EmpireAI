import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { CustomerJourneyCreateInput } from "../models/customer-journey.js";
import type { CustomerJourneySignal, CustomerJourneySignalType } from "../models/customer-journey-signal.js";
import type { JourneyStage, JourneyStageMetric, JourneyStageStatus } from "../models/journey-stage.js";
import {
  JOURNEY_STAGE_LABELS,
  JOURNEY_STAGE_TYPES,
  type JourneyStageType,
} from "../models/journey-stage-types.js";
import type { OptimizationRecommendation } from "../models/optimization-recommendation.js";

export const CUSTOMER_JOURNEY_SIGNAL_WEIGHTS: Record<CustomerJourneySignalType, number> = {
  discovery_strength: 0.18,
  conversion_path: 0.2,
  checkout_readiness: 0.16,
  retention_potential: 0.14,
  recovery_coverage: 0.12,
  loyalty_depth: 0.12,
  journey_composite: 0.08,
};

export type CustomerJourneyBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type CustomerJourneyOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  averageOrderValue?: number;
};

export type CustomerJourneyInput = {
  brand: CustomerJourneyBrandInput;
  offer: CustomerJourneyOfferInput;
  storeId: string;
  storeSlug?: string;
};

export type CustomerJourneyBreakdown = CustomerJourneyCreateInput;

type StageDefinition = {
  stageType: JourneyStageType;
  order: number;
  description: string;
  touchpoints: string[];
  frictionPoints: string[];
  metrics: (input: CustomerJourneyInput) => JourneyStageMetric[];
  scoreModifier: (input: CustomerJourneyInput) => number;
  benchmarkScore: number;
};

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
  signalType: CustomerJourneySignalType,
  score: number,
  detail: string,
): CustomerJourneySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CUSTOMER_JOURNEY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function resolveStatus(score: number): JourneyStageStatus {
  if (score >= 75) return "STRONG";
  if (score >= 55) return "ADEQUATE";
  return "NEEDS_IMPROVEMENT";
}

function baseScore(input: CustomerJourneyInput): number {
  const benefitBoost = Math.min(12, input.offer.keyBenefits.length * 2);
  return clampScore(input.brand.confidence * 0.55 + benefitBoost + 18);
}

function metric(
  name: string,
  value: number,
  unit: string,
  benchmark: number,
): JourneyStageMetric {
  return {
    metricId: randomUUID(),
    name,
    value,
    unit,
    benchmark,
  };
}

const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    stageType: "DISCOVERY",
    order: 1,
    description: "How prospects first encounter the brand across paid, organic, and referral channels.",
    touchpoints: ["Paid social ads", "Search results", "Influencer content", "Email referral"],
    frictionPoints: ["Unclear value proposition in ad creative", "Low brand recall across channels"],
    benchmarkScore: 62,
    scoreModifier: (input) => (input.brand.positioning.length > 20 ? 6 : 0),
    metrics: (input) => [
      metric("Channel reach index", baseScore(input) * 0.9, "index", 58),
      metric("Click-through rate", 2.4 + input.brand.confidence * 0.01, "percent", 2.1),
      metric("Cost per visit estimate", 1.85, "USD", 2.4),
    ],
  },
  {
    stageType: "LANDING",
    order: 2,
    description: "First on-site experience after click — hero, offer clarity, and trust signals.",
    touchpoints: ["Hero section", "Primary CTA", "Social proof strip", "Offer headline"],
    frictionPoints: ["Message mismatch from ad to page", "Slow above-the-fold load"],
    benchmarkScore: 65,
    scoreModifier: (input) => (input.offer.headline.length > 15 ? 5 : -3),
    metrics: (input) => [
      metric("Bounce rate", 42 - input.brand.confidence * 0.08, "percent", 48),
      metric("Hero engagement rate", 68 + input.offer.keyBenefits.length, "percent", 62),
      metric("CTA visibility score", baseScore(input), "score", 60),
    ],
  },
  {
    stageType: "BROWSE",
    order: 3,
    description: "Product exploration, category navigation, and comparison behavior.",
    touchpoints: ["Category pages", "Product detail pages", "Filters and sort", "Related products"],
    frictionPoints: ["Sparse product descriptions", "Weak cross-sell paths"],
    benchmarkScore: 60,
    scoreModifier: (input) => Math.min(8, input.offer.keyBenefits.length),
    metrics: () => [
      metric("Pages per session", 3.8, "pages", 3.2),
      metric("Product view rate", 54, "percent", 48),
      metric("Filter usage rate", 22, "percent", 18),
    ],
  },
  {
    stageType: "CART",
    order: 4,
    description: "Add-to-cart behavior, cart persistence, and pre-checkout hesitation.",
    touchpoints: ["Add to cart button", "Mini cart drawer", "Cart page", "Quantity controls"],
    frictionPoints: ["Unexpected shipping preview delay", "No guest checkout hint"],
    benchmarkScore: 58,
    scoreModifier: (input) => (input.offer.averageOrderValue && input.offer.averageOrderValue > 40 ? 4 : 0),
    metrics: (input) => [
      metric("Add-to-cart rate", 8.5 + input.brand.confidence * 0.03, "percent", 7.2),
      metric("Cart abandonment rate", 68 - input.brand.confidence * 0.05, "percent", 72),
      metric("Average cart value", input.offer.averageOrderValue ?? 49.99, "USD", 45),
    ],
  },
  {
    stageType: "CHECKOUT",
    order: 5,
    description: "Payment flow, form friction, shipping selection, and order confirmation.",
    touchpoints: ["Checkout form", "Shipping options", "Payment methods", "Order review"],
    frictionPoints: ["Multi-step form fatigue", "Limited payment options"],
    benchmarkScore: 55,
    scoreModifier: (input) => (input.offer.callToAction.length > 10 ? 3 : -2),
    metrics: () => [
      metric("Checkout completion rate", 62, "percent", 55),
      metric("Form field count", 8, "fields", 12),
      metric("Payment success rate", 97.5, "percent", 96),
    ],
  },
  {
    stageType: "POST_PURCHASE",
    order: 6,
    description: "Order confirmation, tracking communication, and delivery experience.",
    touchpoints: ["Order confirmation email", "Tracking updates", "Delivery notification", "Review request"],
    frictionPoints: ["Delayed tracking email", "Generic confirmation copy"],
    benchmarkScore: 63,
    scoreModifier: (input) => (input.brand.slogan.length > 5 ? 4 : 0),
    metrics: () => [
      metric("Confirmation open rate", 78, "percent", 72),
      metric("Tracking click rate", 45, "percent", 38),
      metric("Delivery satisfaction index", 82, "score", 75),
    ],
  },
  {
    stageType: "UPSELL",
    order: 7,
    description: "Cross-sell and upsell offers immediately after purchase or at key moments.",
    touchpoints: ["Post-purchase upsell page", "Order bump offers", "Bundle recommendations"],
    frictionPoints: ["Upsell feels disconnected from original purchase", "Too many offer variants"],
    benchmarkScore: 52,
    scoreModifier: (input) => Math.min(6, input.offer.keyBenefits.length - 2),
    metrics: (input) => [
      metric("Upsell take rate", 12 + input.brand.confidence * 0.04, "percent", 10),
      metric("Average upsell value", (input.offer.averageOrderValue ?? 49.99) * 0.35, "USD", 15),
      metric("Offer relevance score", baseScore(input) * 0.85, "score", 55),
    ],
  },
  {
    stageType: "REPEAT_PURCHASE",
    order: 8,
    description: "Second-order conversion through replenishment, loyalty, and win-back timing.",
    touchpoints: ["Replenishment reminder", "Loyalty program", "Win-back email", "Subscription offer"],
    frictionPoints: ["No replenishment cadence defined", "Weak repeat incentive"],
    benchmarkScore: 48,
    scoreModifier: (input) => (input.brand.confidence > 75 ? 5 : 0),
    metrics: () => [
      metric("Repeat purchase rate", 28, "percent", 22),
      metric("Days to second order", 45, "days", 60),
      metric("Customer lifetime value index", 72, "index", 65),
    ],
  },
  {
    stageType: "ABANDONMENT",
    order: 9,
    description: "Cart and browse abandonment recovery through email, SMS, and retargeting.",
    touchpoints: ["Abandoned cart email", "Browse abandonment SMS", "Retargeting ads", "Exit intent offer"],
    frictionPoints: ["Single recovery touch only", "No incentive escalation sequence"],
    benchmarkScore: 50,
    scoreModifier: () => 0,
    metrics: () => [
      metric("Recovery email open rate", 38, "percent", 32),
      metric("Cart recovery rate", 11, "percent", 8),
      metric("Browse recovery rate", 4.5, "percent", 3),
    ],
  },
  {
    stageType: "RETURN_CUSTOMER",
    order: 10,
    description: "Loyal return buyers — VIP treatment, referral loops, and community engagement.",
    touchpoints: ["VIP tier email", "Referral program", "Early access drops", "Review community"],
    frictionPoints: ["No differentiated VIP experience", "Referral reward unclear"],
    benchmarkScore: 45,
    scoreModifier: (input) => (input.brand.targetAudience.length > 30 ? 4 : 0),
    metrics: () => [
      metric("Return customer share", 22, "percent", 18),
      metric("Referral conversion rate", 6.5, "percent", 5),
      metric("NPS proxy score", 52, "score", 45),
    ],
  },
];

function buildStage(definition: StageDefinition, input: CustomerJourneyInput): JourneyStage {
  const score = clampScore(baseScore(input) + definition.scoreModifier(input));

  return {
    stageId: randomUUID(),
    stageType: definition.stageType,
    order: definition.order,
    displayName: JOURNEY_STAGE_LABELS[definition.stageType],
    description: definition.description,
    score,
    benchmarkScore: definition.benchmarkScore,
    status: resolveStatus(score),
    metrics: definition.metrics(input),
    touchpoints: definition.touchpoints,
    frictionPoints: definition.frictionPoints,
  };
}

function buildAllStages(input: CustomerJourneyInput): JourneyStage[] {
  return STAGE_DEFINITIONS.map((definition) => buildStage(definition, input));
}

function buildRecommendations(stages: JourneyStage[], input: CustomerJourneyInput): OptimizationRecommendation[] {
  const brandName = input.brand.brandName;
  const recommendations: OptimizationRecommendation[] = [];

  const add = (
    stageType: JourneyStageType,
    priority: OptimizationRecommendation["priority"],
    title: string,
    description: string,
    expectedImpact: string,
    effortLevel: OptimizationRecommendation["effortLevel"],
    metricTargets: string[],
  ) => {
    recommendations.push({
      recommendationId: randomUUID(),
      stageType,
      priority,
      title,
      description,
      expectedImpact,
      effortLevel,
      metricTargets,
    });
  };

  const stageByType = new Map(stages.map((stage) => [stage.stageType, stage]));

  for (const stage of stages) {
    if (stage.score >= 75) continue;

    switch (stage.stageType) {
      case "DISCOVERY":
        add(
          "DISCOVERY",
          "HIGH",
          `Align ${brandName} ad creative with landing message`,
          "Ensure paid and organic discovery assets echo the same value proposition and CTA as the landing hero.",
          "Reduce bounce from message mismatch by 8–12%",
          "MEDIUM",
          ["Click-through rate", "Channel reach index"],
        );
        break;
      case "LANDING":
        add(
          "LANDING",
          "HIGH",
          "Strengthen above-the-fold trust signals",
          "Add review count, guarantee badge, and benefit bullets directly under the hero headline.",
          "Improve hero engagement rate by 10–15%",
          "LOW",
          ["Hero engagement rate", "Bounce rate"],
        );
        break;
      case "BROWSE":
        add(
          "BROWSE",
          "MEDIUM",
          "Expand product comparison content",
          "Add comparison tables and buying guides linked from category pages to reduce decision friction.",
          "Increase pages per session by 0.5–1.0",
          "MEDIUM",
          ["Pages per session", "Product view rate"],
        );
        break;
      case "CART":
        add(
          "CART",
          "HIGH",
          "Surface shipping estimate before checkout",
          "Show estimated delivery and shipping cost in the mini cart to reduce surprise abandonment.",
          "Lower cart abandonment rate by 5–8%",
          "LOW",
          ["Cart abandonment rate", "Add-to-cart rate"],
        );
        break;
      case "CHECKOUT":
        add(
          "CHECKOUT",
          "HIGH",
          "Enable guest checkout and express pay",
          "Reduce form fields and add Shop Pay / Apple Pay to shorten the payment path.",
          "Boost checkout completion rate by 6–10%",
          "MEDIUM",
          ["Checkout completion rate", "Form field count"],
        );
        break;
      case "POST_PURCHASE":
        add(
          "POST_PURCHASE",
          "MEDIUM",
          "Personalize order confirmation sequence",
          "Send branded confirmation with tracking ETA and product care tips within 5 minutes of purchase.",
          "Raise confirmation open rate by 8%",
          "LOW",
          ["Confirmation open rate", "Tracking click rate"],
        );
        break;
      case "UPSELL":
        add(
          "UPSELL",
          "MEDIUM",
          "Bundle complementary offer post-purchase",
          `Present a single relevant upsell aligned with ${input.offer.offerTitle} on the thank-you page.`,
          "Increase upsell take rate by 3–5%",
          "LOW",
          ["Upsell take rate", "Average upsell value"],
        );
        break;
      case "REPEAT_PURCHASE":
        add(
          "REPEAT_PURCHASE",
          "HIGH",
          "Launch replenishment reminder cadence",
          "Schedule email reminders at 30/45/60 days based on typical repurchase window for the category.",
          "Improve repeat purchase rate by 4–6%",
          "MEDIUM",
          ["Repeat purchase rate", "Days to second order"],
        );
        break;
      case "ABANDONMENT":
        add(
          "ABANDONMENT",
          "HIGH",
          "Deploy 3-touch recovery sequence",
          "Send cart recovery emails at 1h, 24h, and 72h with escalating incentive and social proof.",
          "Recover 3–5% additional abandoned carts",
          "MEDIUM",
          ["Cart recovery rate", "Recovery email open rate"],
        );
        break;
      case "RETURN_CUSTOMER":
        add(
          "RETURN_CUSTOMER",
          "MEDIUM",
          "Activate referral loop for VIP buyers",
          "Offer double-sided referral rewards to customers with 2+ orders.",
          "Grow return customer share by 3–4%",
          "LOW",
          ["Return customer share", "Referral conversion rate"],
        );
        break;
    }
  }

  const lowestStage = [...stages].sort((left, right) => left.score - right.score)[0];
  if (lowestStage && lowestStage.score < 60) {
    add(
      lowestStage.stageType,
      "HIGH",
      `Priority focus: ${lowestStage.displayName} stage`,
      `${lowestStage.displayName} scores ${lowestStage.score}/100 — address ${lowestStage.frictionPoints[0] ?? "identified friction"} first.`,
      `Raise ${lowestStage.displayName} score by 8–12 points`,
      "HIGH",
      lowestStage.metrics.map((entry) => entry.name),
    );
  }

  const checkout = stageByType.get("CHECKOUT");
  const cart = stageByType.get("CART");
  if (checkout && cart && checkout.score < 65 && cart.score < 65) {
    add(
      "CHECKOUT",
      "HIGH",
      "Unify cart-to-checkout transition",
      "Use a persistent cart summary sidebar through checkout to maintain purchase momentum.",
      "Improve combined cart-to-order conversion by 7%",
      "MEDIUM",
      ["Checkout completion rate", "Cart abandonment rate"],
    );
  }

  return recommendations;
}

function buildSignals(stages: JourneyStage[], confidence: number): CustomerJourneySignal[] {
  const byType = new Map(stages.map((stage) => [stage.stageType, stage]));

  const discovery = byType.get("DISCOVERY")!;
  const landing = byType.get("LANDING")!;
  const browse = byType.get("BROWSE")!;
  const cart = byType.get("CART")!;
  const checkout = byType.get("CHECKOUT")!;
  const postPurchase = byType.get("POST_PURCHASE")!;
  const upsell = byType.get("UPSELL")!;
  const repeat = byType.get("REPEAT_PURCHASE")!;
  const abandonment = byType.get("ABANDONMENT")!;
  const returnCustomer = byType.get("RETURN_CUSTOMER")!;

  return [
    buildSignal(
      "discovery_strength",
      average([discovery.score, landing.score]),
      `Discovery and landing average ${average([discovery.score, landing.score]).toFixed(0)}/100`,
    ),
    buildSignal(
      "conversion_path",
      average([browse.score, cart.score, checkout.score]),
      `Browse-to-checkout path ${average([browse.score, cart.score, checkout.score]).toFixed(0)}/100`,
    ),
    buildSignal("checkout_readiness", checkout.score, `Checkout readiness ${checkout.score}/100`),
    buildSignal(
      "retention_potential",
      average([postPurchase.score, upsell.score, repeat.score]),
      `Post-purchase retention ${average([postPurchase.score, upsell.score, repeat.score]).toFixed(0)}/100`,
    ),
    buildSignal("recovery_coverage", abandonment.score, `Abandonment recovery ${abandonment.score}/100`),
    buildSignal("loyalty_depth", returnCustomer.score, `Return customer loyalty ${returnCustomer.score}/100`),
    buildSignal("journey_composite", confidence, `Customer journey confidence ${confidence}`),
  ];
}

function computeConfidence(signals: CustomerJourneySignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "journey_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "journey_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(stages: JourneyStage[]): number {
  return clampScore(average(stages.map((stage) => stage.score)));
}

/** Generates a complete scored customer journey — intelligence only, no deployment. */
export function generateCustomerJourney(input: CustomerJourneyInput): CustomerJourneyBreakdown {
  const stages = buildAllStages(input);

  for (const stageType of JOURNEY_STAGE_TYPES) {
    const found = stages.find((stage) => stage.stageType === stageType);
    if (!found) {
      throw new Error(`Missing required journey stage: ${stageType}`);
    }
  }

  stages.sort((left, right) => left.order - right.order);

  const recommendations = buildRecommendations(stages, input);
  const provisionalSignals = buildSignals(stages, 0);
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(stages, confidence);
  const overallScore = computeOverallScore(stages);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    journeyName: `${input.brand.brandName} Customer Journey`,
    stages,
    recommendations,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoApplyEnabled: false,
  };
}

export const customerJourneyIntelligenceScoring = {
  generateCustomerJourney,
  computeConfidence,
  computeOverallScore,
  CUSTOMER_JOURNEY_SIGNAL_WEIGHTS,
};
