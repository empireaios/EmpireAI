import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AdsOptimization } from "../models/ads-optimization.js";
import type { ContinuousOptimizationReportCreateInput } from "../models/continuous-optimization-report.js";
import type {
  ContinuousOptimizationSignal,
  ContinuousOptimizationSignalType,
} from "../models/continuous-optimization-signal.js";
import type { MarketingOptimization } from "../models/marketing-optimization.js";
import type { OfferOptimization } from "../models/offer-optimization.js";
import type {
  OptimizationDomain,
  OptimizationTask,
} from "../models/optimization-task.js";
import type { PricingOptimization } from "../models/pricing-optimization.js";
import type { SeoOptimization } from "../models/seo-optimization.js";
import type { StoreOptimization } from "../models/store-optimization.js";

export const CONTINUOUS_OPTIMIZATION_SIGNAL_WEIGHTS: Record<
  ContinuousOptimizationSignalType,
  number
> = {
  store_optimization: 0.16,
  ads_optimization: 0.16,
  pricing_optimization: 0.14,
  offer_optimization: 0.14,
  seo_optimization: 0.12,
  marketing_optimization: 0.14,
  task_coverage: 0.12,
  optimization_composite: 0.02,
};

export type ContinuousOptimizationBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type ContinuousOptimizationMetricsInput = {
  currentPrice?: number;
  currency?: string;
  monthlyAdSpend?: number;
  conversionRatePercent?: number;
  organicTraffic?: number;
};

export type ContinuousOptimizationInput = {
  brand: ContinuousOptimizationBrandInput;
  metrics: ContinuousOptimizationMetricsInput;
  storeId: string;
  optimizationIndex?: number;
};

export type ContinuousOptimizationBreakdown = ContinuousOptimizationReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: ContinuousOptimizationSignalType,
  score: number,
  detail: string,
): ContinuousOptimizationSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CONTINUOUS_OPTIMIZATION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: ContinuousOptimizationInput): number {
  const optimizationBoost = input.optimizationIndex
    ? Math.min(10, input.optimizationIndex / 10)
    : 5;
  return clampScore(input.brand.confidence * 0.45 + optimizationBoost + 22);
}

function createTask(
  domain: OptimizationDomain,
  priority: OptimizationTask["priority"],
  title: string,
  description: string,
  action: string,
  expectedImpactPercent: number,
  score: number,
): OptimizationTask {
  return {
    taskId: randomUUID(),
    domain,
    priority,
    title,
    description,
    action,
    expectedImpactPercent,
    status: "PLANNED",
    score: clampScore(score),
  };
}

function buildStoreOptimization(input: ContinuousOptimizationInput): StoreOptimization {
  const score = baseScore(input);
  const tasks: OptimizationTask[] = [
    createTask(
      "STORE",
      "HIGH",
      "Improve mobile checkout flow",
      "Mobile bounce rate elevated on checkout — simplify form fields and enable express pay.",
      "Reduce checkout steps from 4 to 2 and add Shop Pay / Apple Pay",
      18,
      score + 5,
    ),
    createTask(
      "STORE",
      "MEDIUM",
      "Add trust badges above fold",
      "Social proof placement below fold reduces early-stage conversion.",
      "Move review stars, guarantee badge, and shipping promise above hero CTA",
      12,
      score + 2,
    ),
  ];

  return {
    bundleId: randomUUID(),
    tasks,
    focusArea: "Conversion rate optimization",
    score: clampScore(average(tasks.map((task) => task.score))),
    summary: `${tasks.length} store optimization tasks planned for ${input.brand.brandName}.`,
  };
}

function buildAdsOptimization(input: ContinuousOptimizationInput): AdsOptimization {
  const score = baseScore(input);
  const tasks: OptimizationTask[] = [
    createTask(
      "ADS",
      "HIGH",
      "Pause underperforming ad sets",
      "3 ad sets below break-even ROAS consuming 22% of monthly budget.",
      "Pause ad sets with ROAS < 1.5x over 7-day window; reallocate to top performers",
      24,
      score + 6,
    ),
    createTask(
      "ADS",
      "MEDIUM",
      "Refresh creative fatigue assets",
      "Top Meta creatives showing frequency > 3.5 with declining CTR.",
      "Launch 3 new UGC-style variants targeting lookalike purchasers",
      16,
      score + 3,
    ),
  ];

  return {
    bundleId: randomUUID(),
    tasks,
    focusArea: "ROAS efficiency",
    score: clampScore(average(tasks.map((task) => task.score))),
    summary: `${tasks.length} ads optimization tasks planned — focus on ROAS recovery.`,
  };
}

function buildPricingOptimization(input: ContinuousOptimizationInput): PricingOptimization {
  const score = baseScore(input);
  const price = input.metrics.currentPrice ?? 89.99;

  const tasks: OptimizationTask[] = [
    createTask(
      "PRICING",
      "MEDIUM",
      "Test charm pricing variant",
      `Current price $${price} may benefit from psychological pricing in ${input.brand.niche}.`,
      `A/B test $${price} vs $${(Math.floor(price) - 0.01).toFixed(2)} for 14 days`,
      8,
      score + 2,
    ),
    createTask(
      "PRICING",
      "LOW",
      "Introduce tiered bundle discount",
      "Competitor bundles driving higher AOV in category.",
      "Add 2-pack at 10% off and 3-pack at 15% off with margin guardrails",
      14,
      score + 1,
    ),
  ];

  return {
    bundleId: randomUUID(),
    tasks,
    focusArea: "Revenue per order",
    score: clampScore(average(tasks.map((task) => task.score))),
    summary: `${tasks.length} pricing optimization tasks planned.`,
  };
}

function buildOfferOptimization(input: ContinuousOptimizationInput): OfferOptimization {
  const score = baseScore(input);

  const tasks: OptimizationTask[] = [
    createTask(
      "OFFER",
      "HIGH",
      "Strengthen value stack on hero offer",
      "Current offer lacks urgency and bonus value compared to category leaders.",
      "Add limited-time bonus accessory and 30-day guarantee badge to hero offer",
      20,
      score + 5,
    ),
    createTask(
      "OFFER",
      "MEDIUM",
      "Launch cart recovery incentive",
      "Abandoned cart rate above category benchmark.",
      "Deploy 10% recovery offer on day-2 cart abandonment email",
      15,
      score + 3,
    ),
  ];

  return {
    bundleId: randomUUID(),
    tasks,
    focusArea: "Offer conversion",
    score: clampScore(average(tasks.map((task) => task.score))),
    summary: `${tasks.length} offer optimization tasks planned.`,
  };
}

function buildSeoOptimization(input: ContinuousOptimizationInput): SeoOptimization {
  const score = baseScore(input);
  const organicTraffic = input.metrics.organicTraffic ?? 2400;

  const tasks: OptimizationTask[] = [
    createTask(
      "SEO",
      "HIGH",
      "Optimize product page meta and schema",
      "Product pages missing rich snippets — limiting organic CTR.",
      "Add Product schema, rewrite meta titles with primary keywords, optimize H1 structure",
      22,
      score + 4,
    ),
    createTask(
      "SEO",
      "MEDIUM",
      "Publish comparison content cluster",
      `Organic traffic at ${organicTraffic}/mo — content gap vs competitors in ${input.brand.niche}.`,
      "Create 3 comparison guides targeting high-intent buyer keywords",
      18,
      score + 2,
    ),
  ];

  return {
    bundleId: randomUUID(),
    tasks,
    focusArea: "Organic acquisition",
    score: clampScore(average(tasks.map((task) => task.score))),
    summary: `${tasks.length} SEO optimization tasks planned.`,
  };
}

function buildMarketingOptimization(input: ContinuousOptimizationInput): MarketingOptimization {
  const score = baseScore(input);

  const tasks: OptimizationTask[] = [
    createTask(
      "MARKETING",
      "HIGH",
      "Activate win-back email segment",
      "Inactive customer segment represents untapped LTV recovery.",
      "Launch 3-email win-back sequence for customers inactive 60+ days",
      19,
      score + 5,
    ),
    createTask(
      "MARKETING",
      "MEDIUM",
      "Expand SMS post-purchase flow",
      "Post-purchase engagement limited to email only.",
      "Add SMS review request and cross-sell touchpoints at day 7 and day 14",
      13,
      score + 2,
    ),
  ];

  return {
    bundleId: randomUUID(),
    tasks,
    focusArea: "Retention and LTV",
    score: clampScore(average(tasks.map((task) => task.score))),
    summary: `${tasks.length} marketing optimization tasks planned.`,
  };
}

function buildSignals(
  stores: StoreOptimization,
  ads: AdsOptimization,
  pricing: PricingOptimization,
  offers: OfferOptimization,
  seo: SeoOptimization,
  marketing: MarketingOptimization,
  allTasks: OptimizationTask[],
  confidence: number,
): ContinuousOptimizationSignal[] {
  const criticalCount = allTasks.filter((task) => task.priority === "CRITICAL").length;
  const highCount = allTasks.filter((task) => task.priority === "HIGH").length;

  return [
    buildSignal("store_optimization", stores.score, stores.summary),
    buildSignal("ads_optimization", ads.score, ads.summary),
    buildSignal("pricing_optimization", pricing.score, pricing.summary),
    buildSignal("offer_optimization", offers.score, offers.summary),
    buildSignal("seo_optimization", seo.score, seo.summary),
    buildSignal("marketing_optimization", marketing.score, marketing.summary),
    buildSignal(
      "task_coverage",
      clampScore(60 + allTasks.length * 4 + highCount * 3),
      `${allTasks.length} tasks planned — ${criticalCount} critical, ${highCount} high priority`,
    ),
    buildSignal("optimization_composite", confidence, `Continuous optimization confidence ${confidence}`),
  ];
}

function computeConfidence(signals: ContinuousOptimizationSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "optimization_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "optimization_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(bundles: { score: number }[]): number {
  return clampScore(average(bundles.map((bundle) => bundle.score)));
}

function sortTasks(tasks: OptimizationTask[]): OptimizationTask[] {
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...tasks].sort(
    (left, right) =>
      priorityOrder[left.priority] - priorityOrder[right.priority] ||
      right.expectedImpactPercent - left.expectedImpactPercent,
  );
}

/** Generates continuous optimization report — intelligence only, no auto-apply. */
export function generateContinuousOptimization(
  input: ContinuousOptimizationInput,
): ContinuousOptimizationBreakdown {
  const stores = buildStoreOptimization(input);
  const ads = buildAdsOptimization(input);
  const pricing = buildPricingOptimization(input);
  const offers = buildOfferOptimization(input);
  const seo = buildSeoOptimization(input);
  const marketing = buildMarketingOptimization(input);

  const allTasks = sortTasks([
    ...stores.tasks,
    ...ads.tasks,
    ...pricing.tasks,
    ...offers.tasks,
    ...seo.tasks,
    ...marketing.tasks,
  ]);

  const provisionalSignals = buildSignals(
    stores,
    ads,
    pricing,
    offers,
    seo,
    marketing,
    allTasks,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    stores,
    ads,
    pricing,
    offers,
    seo,
    marketing,
    allTasks,
    confidence,
  );
  const overallScore = computeOverallScore([stores, ads, pricing, offers, seo, marketing]);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Continuous Optimization`,
    stores,
    ads,
    pricing,
    offers,
    seo,
    marketing,
    allTasks,
    totalTasks: allTasks.length,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoApplyEnabled: false,
  };
}

export const continuousOptimizationIntelligenceScoring = {
  generateContinuousOptimization,
  computeConfidence,
  computeOverallScore,
  CONTINUOUS_OPTIMIZATION_SIGNAL_WEIGHTS,
};
