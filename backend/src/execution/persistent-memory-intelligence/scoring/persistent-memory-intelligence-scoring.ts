import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { BrandMemory } from "../models/brand-memory.js";
import type { CampaignMemory } from "../models/campaign-memory.js";
import type { DecisionImprovement } from "../models/decision-improvement.js";
import type { FailureMemory } from "../models/failure-memory.js";
import type { PersistentMemoryReportCreateInput } from "../models/persistent-memory-report.js";
import type {
  PersistentMemorySignal,
  PersistentMemorySignalType,
} from "../models/persistent-memory-signal.js";
import type { ProductMemory } from "../models/product-memory.js";
import type { StoreHistory } from "../models/store-history.js";
import type { SuccessMemory } from "../models/success-memory.js";
import type { SupplierMemory } from "../models/supplier-memory.js";

export const PERSISTENT_MEMORY_SIGNAL_WEIGHTS: Record<PersistentMemorySignalType, number> = {
  product_learning: 0.14,
  campaign_learning: 0.12,
  supplier_learning: 0.12,
  brand_learning: 0.1,
  failure_retention: 0.14,
  success_retention: 0.14,
  history_depth: 0.12,
  decision_improvement: 0.1,
  memory_composite: 0.02,
};

export type PersistentMemoryBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type PersistentMemoryContextInput = {
  storeName?: string;
  primaryProduct?: string;
  primarySku?: string;
  supplierName?: string;
  currency?: string;
};

export type PersistentMemoryInput = {
  brand: PersistentMemoryBrandInput;
  context: PersistentMemoryContextInput;
  storeId: string;
  memoryIndex?: number;
};

export type PersistentMemoryBreakdown = PersistentMemoryReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: PersistentMemorySignalType,
  score: number,
  detail: string,
): PersistentMemorySignal {
  return {
    signalType,
    score: clampScore(score),
    weight: PERSISTENT_MEMORY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function baseScore(input: PersistentMemoryInput): number {
  const memoryBoost = input.memoryIndex ? Math.min(10, input.memoryIndex / 10) : 5;
  return clampScore(input.brand.confidence * 0.45 + memoryBoost + 22);
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function buildProductMemories(input: PersistentMemoryInput): ProductMemory[] {
  const score = baseScore(input);
  const productName = input.context.primaryProduct ?? "Premium Kitchen Blender";
  const sku = input.context.primarySku ?? "KBS-BLND-001";

  return [
    {
      memoryId: randomUUID(),
      productName,
      sku,
      category: "Kitchen appliances",
      outcome: "SUCCESS",
      revenueGenerated: 42800,
      unitsSold: 476,
      lessonsLearned: [
        "Bundle offers increased AOV by 18%",
        "Kitchen niche responds well to video creatives",
      ],
      score: clampScore(score + 6),
    },
    {
      memoryId: randomUUID(),
      productName: "Compact Food Processor",
      sku: "KBS-FP-002",
      category: "Kitchen appliances",
      outcome: "NEUTRAL",
      revenueGenerated: 12400,
      unitsSold: 155,
      lessonsLearned: ["Lower price point needed stronger social proof"],
      score: clampScore(score - 2),
    },
  ];
}

function buildCampaignMemories(input: PersistentMemoryInput): CampaignMemory[] {
  const score = baseScore(input);

  return [
    {
      memoryId: randomUUID(),
      campaignName: "Q2 Meta Prospecting",
      channel: "Meta Ads",
      outcome: "SUCCESS",
      roasAchieved: 3.2,
      spendTotal: 8500,
      conversions: 312,
      lessonsLearned: [
        "Lookalike audiences from purchasers outperformed interest targeting",
        "UGC-style creatives beat polished studio assets",
      ],
      score: clampScore(score + 5),
    },
    {
      memoryId: randomUUID(),
      campaignName: "Email Win-Back Flow",
      channel: "Email",
      outcome: "SUCCESS",
      roasAchieved: 8.5,
      spendTotal: 120,
      conversions: 89,
      lessonsLearned: ["15% discount threshold maximized recovery without margin erosion"],
      score: clampScore(score + 8),
    },
  ];
}

function buildSupplierMemories(input: PersistentMemoryInput): SupplierMemory[] {
  const score = baseScore(input);
  const supplierName = input.context.supplierName ?? "CJ Dropshipping";

  return [
    {
      memoryId: randomUUID(),
      supplierName,
      outcome: "TRUSTED",
      fulfillmentRatePercent: 96,
      averageLeadTimeDays: 12,
      qualityScore: clampScore(82 + input.brand.confidence * 0.05),
      lessonsLearned: [
        "Primary supplier reliable for kitchen SKUs",
        "Order 2 weeks ahead during peak season",
      ],
      score: clampScore(score + 4),
    },
  ];
}

function buildBrandMemories(input: PersistentMemoryInput): BrandMemory[] {
  const score = baseScore(input);

  return [
    {
      memoryId: randomUUID(),
      brandName: input.brand.brandName,
      niche: input.brand.niche,
      positioning: input.brand.positioning,
      customerSentimentScore: clampScore(78 + input.brand.confidence * 0.08),
      brandRecognitionScore: clampScore(65 + input.brand.confidence * 0.1),
      keyStrengths: [
        "Trusted positioning resonates with target audience",
        "Consistent product quality feedback",
      ],
      improvementAreas: ["Expand content library for SEO", "Increase review volume"],
      score: clampScore(score + 3),
    },
  ];
}

function buildFailureMemories(input: PersistentMemoryInput): FailureMemory[] {
  const score = baseScore(input);

  return [
    {
      memoryId: randomUUID(),
      failureTitle: "Stockout during Black Friday",
      severity: "HIGH",
      category: "INVENTORY",
      description: "Best-selling blender SKU ran out of stock during peak demand window.",
      rootCause: "Safety stock threshold set too low for seasonal spike.",
      preventionAction: "Increase safety stock 40% before Q4 peak months.",
      occurredAt: daysAgoIso(180),
      score: clampScore(score - 5),
    },
    {
      memoryId: randomUUID(),
      failureTitle: "TikTok campaign underperformed",
      severity: "MEDIUM",
      category: "MARKETING",
      description: "Initial TikTok ads achieved 0.8x ROAS vs 2.5x target.",
      rootCause: "Creative format mismatch with platform audience expectations.",
      preventionAction: "Test native UGC formats before scaling TikTok spend.",
      occurredAt: daysAgoIso(90),
      score: clampScore(score - 3),
    },
  ];
}

function buildSuccessMemories(input: PersistentMemoryInput): SuccessMemory[] {
  const score = baseScore(input);

  return [
    {
      memoryId: randomUUID(),
      successTitle: "Bundle launch exceeded forecast",
      category: "PRODUCT",
      description: "Blender + accessory bundle drove 34% higher AOV than standalone.",
      keyFactor: "Value perception through curated bundle pricing",
      replicablePattern: "Pair hero SKU with complementary accessory at 15% bundle discount",
      impactScore: 88,
      occurredAt: daysAgoIso(60),
      score: clampScore(score + 7),
    },
    {
      memoryId: randomUUID(),
      successTitle: "Retargeting flow recovery",
      category: "MARKETING",
      description: "Cart abandonment email sequence recovered 12% of abandoned carts.",
      keyFactor: "Three-touch sequence with escalating incentive",
      replicablePattern: "Day 1 reminder → Day 3 social proof → Day 7 limited discount",
      impactScore: 82,
      occurredAt: daysAgoIso(45),
      score: clampScore(score + 5),
    },
  ];
}

function buildStoreHistory(input: PersistentMemoryInput): StoreHistory {
  const score = baseScore(input);
  const storeName = input.context.storeName ?? `${input.brand.brandName} Store`;
  const currency = input.context.currency ?? "USD";

  return {
    historyId: randomUUID(),
    storeName,
    events: [
      {
        eventId: randomUUID(),
        eventType: "LAUNCH",
        title: "Store launched",
        description: `${storeName} went live with initial product catalog.`,
        occurredAt: daysAgoIso(365),
        impactScore: 90,
      },
      {
        eventId: randomUUID(),
        eventType: "MILESTONE",
        title: "First $10K month",
        description: "Monthly revenue crossed $10,000 for the first time.",
        occurredAt: daysAgoIso(240),
        impactScore: 85,
      },
      {
        eventId: randomUUID(),
        eventType: "OPTIMIZATION",
        title: "CRO landing page refresh",
        description: "Updated hero section and social proof increased conversion 22%.",
        occurredAt: daysAgoIso(120),
        impactScore: 78,
      },
      {
        eventId: randomUUID(),
        eventType: "EXPANSION",
        title: "Added email marketing channel",
        description: "Launched automated email flows for retention and recovery.",
        occurredAt: daysAgoIso(75),
        impactScore: 72,
      },
    ],
    totalRevenue: 186400,
    monthsActive: 12,
    currency,
    score: clampScore(score + 2),
    summary: `${storeName} — 12 months active, ${currency} 186,400 total revenue, 4 key milestones recorded.`,
  };
}

function buildDecisionImprovements(
  input: PersistentMemoryInput,
  products: ProductMemory[],
  campaigns: CampaignMemory[],
  failures: FailureMemory[],
  successes: SuccessMemory[],
): DecisionImprovement[] {
  const score = baseScore(input);
  const topProduct = products.find((item) => item.outcome === "SUCCESS");
  const topCampaign = campaigns.find((item) => item.outcome === "SUCCESS");
  const criticalFailure = failures.find((item) => item.severity === "HIGH");

  const improvements: DecisionImprovement[] = [
    {
      improvementId: randomUUID(),
      priority: "HIGH",
      decisionArea: "INVENTORY",
      recommendation: criticalFailure
        ? criticalFailure.preventionAction
        : "Maintain elevated safety stock before peak seasons",
      rationale: "Historical stockout caused measurable revenue loss during peak demand.",
      basedOnMemory: failures.map((item) => item.failureTitle),
      expectedImpactPercent: 15,
      score: clampScore(score + 4),
    },
    {
      improvementId: randomUUID(),
      priority: "HIGH",
      decisionArea: "MARKETING",
      recommendation: topCampaign
        ? `Replicate ${topCampaign.channel} winning patterns: ${topCampaign.lessonsLearned[0]}`
        : "Double down on highest-ROAS channel from campaign history",
      rationale: "Past campaign data shows clear channel and creative winners.",
      basedOnMemory: campaigns.map((item) => item.campaignName),
      expectedImpactPercent: 22,
      score: clampScore(score + 6),
    },
    {
      improvementId: randomUUID(),
      priority: "MEDIUM",
      decisionArea: "PRODUCT",
      recommendation: topProduct
        ? `Expand ${topProduct.productName} line using proven bundle strategy`
        : "Launch complementary products in proven category",
      rationale: "Product memory shows bundle and category patterns that drive AOV.",
      basedOnMemory: [
        ...products.map((item) => item.productName),
        ...successes.map((item) => item.successTitle),
      ],
      expectedImpactPercent: 18,
      score: clampScore(score + 3),
    },
  ];

  return improvements.sort((left, right) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[left.priority] - order[right.priority];
  });
}

function buildSignals(
  products: ProductMemory[],
  campaigns: CampaignMemory[],
  suppliers: SupplierMemory[],
  brands: BrandMemory[],
  failures: FailureMemory[],
  successes: SuccessMemory[],
  storeHistory: StoreHistory,
  improvements: DecisionImprovement[],
  confidence: number,
): PersistentMemorySignal[] {
  return [
    buildSignal(
      "product_learning",
      average(products.map((item) => item.score)),
      `${products.length} product memories — ${products.filter((item) => item.outcome === "SUCCESS").length} successes`,
    ),
    buildSignal(
      "campaign_learning",
      average(campaigns.map((item) => item.score)),
      `${campaigns.length} campaign memories recorded`,
    ),
    buildSignal(
      "supplier_learning",
      average(suppliers.map((item) => item.score)),
      `${suppliers.length} supplier relationships tracked`,
    ),
    buildSignal(
      "brand_learning",
      average(brands.map((item) => item.score)),
      `${brands.length} brand memory profiles`,
    ),
    buildSignal(
      "failure_retention",
      clampScore(100 - failures.filter((item) => item.severity === "HIGH").length * 15),
      `${failures.length} failures documented with prevention actions`,
    ),
    buildSignal(
      "success_retention",
      average(successes.map((item) => item.score)),
      `${successes.length} successes with replicable patterns`,
    ),
    buildSignal(
      "history_depth",
      storeHistory.score,
      `${storeHistory.events.length} store history events over ${storeHistory.monthsActive} months`,
    ),
    buildSignal(
      "decision_improvement",
      average(improvements.map((item) => item.score)),
      `${improvements.length} decision improvements recommended`,
    ),
    buildSignal("memory_composite", confidence, `Persistent memory confidence ${confidence}`),
  ];
}

function computeConfidence(signals: PersistentMemorySignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "memory_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "memory_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

function computeOverallScore(
  products: ProductMemory[],
  campaigns: CampaignMemory[],
  improvements: DecisionImprovement[],
): number {
  return clampScore(
    average([
      average(products.map((item) => item.score)),
      average(campaigns.map((item) => item.score)),
      average(improvements.map((item) => item.score)),
    ]),
  );
}

/** Generates persistent memory report — intelligence only, no auto-write. */
export function generatePersistentMemory(
  input: PersistentMemoryInput,
): PersistentMemoryBreakdown {
  const products = buildProductMemories(input);
  const campaigns = buildCampaignMemories(input);
  const suppliers = buildSupplierMemories(input);
  const brands = buildBrandMemories(input);
  const failures = buildFailureMemories(input);
  const successes = buildSuccessMemories(input);
  const storeHistory = buildStoreHistory(input);
  const decisionImprovements = buildDecisionImprovements(
    input,
    products,
    campaigns,
    failures,
    successes,
  );

  const provisionalSignals = buildSignals(
    products,
    campaigns,
    suppliers,
    brands,
    failures,
    successes,
    storeHistory,
    decisionImprovements,
    0,
  );
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(
    products,
    campaigns,
    suppliers,
    brands,
    failures,
    successes,
    storeHistory,
    decisionImprovements,
    confidence,
  );
  const overallScore = computeOverallScore(products, campaigns, decisionImprovements);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    memoryName: `${input.brand.brandName} Long-Term Memory`,
    products,
    campaigns,
    suppliers,
    brands,
    failures,
    successes,
    storeHistory,
    decisionImprovements,
    overallScore,
    confidence,
    signals,
    intelligenceOnly: true,
    deploymentEnabled: false,
    autoWriteEnabled: false,
  };
}

export const persistentMemoryIntelligenceScoring = {
  generatePersistentMemory,
  computeConfidence,
  computeOverallScore,
  PERSISTENT_MEMORY_SIGNAL_WEIGHTS,
};
