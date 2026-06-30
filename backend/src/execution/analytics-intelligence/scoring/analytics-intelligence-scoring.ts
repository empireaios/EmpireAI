import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AnalyticsBlueprintCreateInput } from "../models/analytics-blueprint.js";
import type { ConversionEvent, ServerSideEvent } from "../models/analytics-events.js";
import type { AnalyticsFunnel, RevenueAttributionModel } from "../models/analytics-funnel.js";
import type { AnalyticsSignal, AnalyticsSignalType } from "../models/analytics-signal.js";
import type { DashboardMetric } from "../models/dashboard-metric.js";
import type { GoogleAnalyticsModel } from "../models/google-analytics-model.js";
import type { MetaPixelModel } from "../models/meta-pixel-model.js";
import type { TikTokPixelModel } from "../models/tiktok-pixel-model.js";

export const ANALYTICS_SIGNAL_WEIGHTS: Record<AnalyticsSignalType, number> = {
  tracking_coverage: 0.2,
  event_completeness: 0.18,
  funnel_definition: 0.16,
  attribution_model: 0.14,
  dashboard_readiness: 0.14,
  server_side_coverage: 0.1,
  blueprint_composite: 0.08,
};

export type AnalyticsIntelligenceBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type AnalyticsIntelligenceOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
  averageOrderValue?: number;
};

export type AnalyticsIntelligenceInput = {
  brand: AnalyticsIntelligenceBrandInput;
  offer: AnalyticsIntelligenceOfferInput;
  storeId: string;
  storeSlug?: string;
};

export type AnalyticsIntelligenceBreakdown = AnalyticsBlueprintCreateInput;

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
  signalType: AnalyticsSignalType,
  score: number,
  detail: string,
): AnalyticsSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: ANALYTICS_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function resolveStoreSlug(input: AnalyticsIntelligenceInput): string {
  return slugify(input.storeSlug ?? input.brand.brandName);
}

function buildGoogleAnalyticsModel(input: AnalyticsIntelligenceInput): GoogleAnalyticsModel {
  const slug = resolveStoreSlug(input);

  return {
    modelId: randomUUID(),
    measurementId: `G-BLUEPRINT-${slug.slice(0, 8).toUpperCase()}`,
    streamName: `${input.brand.brandName} Web Stream`,
    enabledEvents: [
      "page_view",
      "view_item",
      "add_to_cart",
      "begin_checkout",
      "purchase",
      "generate_lead",
    ],
    customDimensions: ["brand_id", "store_id", "campaign_source", "content_cluster"],
    customMetrics: ["cart_value", "item_quantity", "margin_estimate"],
    enhancedMeasurement: [
      "scrolls",
      "outbound_clicks",
      "site_search",
      "video_engagement",
      "file_downloads",
    ],
    dataRetentionMonths: 14,
    consentMode: "required",
  };
}

function buildMetaPixelModel(input: AnalyticsIntelligenceInput): MetaPixelModel {
  const slug = resolveStoreSlug(input);

  return {
    modelId: randomUUID(),
    pixelId: `META-BLUEPRINT-${slug.slice(0, 10).toUpperCase()}`,
    pixelName: `${input.brand.brandName} Meta Pixel`,
    enabledEvents: [
      "PageView",
      "ViewContent",
      "AddToCart",
      "InitiateCheckout",
      "Purchase",
      "Lead",
    ],
    advancedMatchingFields: ["em", "ph", "fn", "ln", "ct", "st", "zp", "country"],
    automaticMatching: true,
    conversionApiEnabled: true,
    consentRequired: true,
  };
}

function buildTikTokPixelModel(input: AnalyticsIntelligenceInput): TikTokPixelModel {
  const slug = resolveStoreSlug(input);

  return {
    modelId: randomUUID(),
    pixelId: `TT-BLUEPRINT-${slug.slice(0, 10).toUpperCase()}`,
    pixelName: `${input.brand.brandName} TikTok Pixel`,
    enabledEvents: [
      "PageView",
      "ViewContent",
      "AddToCart",
      "InitiateCheckout",
      "CompletePayment",
      "SubmitForm",
    ],
    advancedMatchingFields: ["email", "phone", "external_id"],
    eventsApiEnabled: true,
    consentRequired: true,
  };
}

function buildServerSideEvents(input: AnalyticsIntelligenceInput): ServerSideEvent[] {
  const { brand } = input;

  return [
    {
      eventId: randomUUID(),
      eventName: "purchase",
      source: "SERVER",
      platforms: ["GA4", "META", "TIKTOK"],
      trigger: "Order fulfillment webhook (sandbox) — no live submission",
      payloadSchema: {
        transaction_id: "string",
        value: "number",
        currency: "string",
        items: "array",
        brand_name: brand.brandName,
      },
      deduplicationKey: "transaction_id",
    },
    {
      eventId: randomUUID(),
      eventName: "add_to_cart",
      source: "SERVER",
      platforms: ["GA4", "META", "TIKTOK"],
      trigger: "Cart mutation API handler",
      payloadSchema: {
        item_id: "string",
        item_name: "string",
        value: "number",
        currency: "string",
      },
      deduplicationKey: "event_id",
    },
    {
      eventId: randomUUID(),
      eventName: "generate_lead",
      source: "SERVER",
      platforms: ["GA4", "META"],
      trigger: "Newsletter or lead capture form submission",
      payloadSchema: {
        lead_source: "string",
        email_hash: "string",
        brand_id: "string",
      },
      deduplicationKey: "email_hash",
    },
    {
      eventId: randomUUID(),
      eventName: "refund",
      source: "SERVER",
      platforms: ["GA4"],
      trigger: "Refund processing event",
      payloadSchema: {
        transaction_id: "string",
        value: "number",
        currency: "string",
      },
      deduplicationKey: "transaction_id",
    },
  ];
}

function buildConversionEvents(input: AnalyticsIntelligenceInput): ConversionEvent[] {
  const aov = input.offer.averageOrderValue ?? 49.99;

  return [
    {
      conversionId: randomUUID(),
      name: "Purchase",
      eventName: "purchase",
      value: aov,
      currency: "USD",
      category: "PURCHASE",
      platforms: ["GA4", "META", "TIKTOK"],
      attributionWindowDays: 28,
    },
    {
      conversionId: randomUUID(),
      name: "Add to Cart",
      eventName: "add_to_cart",
      value: aov * 0.6,
      currency: "USD",
      category: "ADD_TO_CART",
      platforms: ["GA4", "META", "TIKTOK"],
      attributionWindowDays: 7,
    },
    {
      conversionId: randomUUID(),
      name: "Begin Checkout",
      eventName: "begin_checkout",
      value: aov * 0.85,
      currency: "USD",
      category: "CHECKOUT",
      platforms: ["GA4", "META", "TIKTOK"],
      attributionWindowDays: 14,
    },
    {
      conversionId: randomUUID(),
      name: "Lead Capture",
      eventName: "generate_lead",
      value: 5,
      currency: "USD",
      category: "LEAD",
      platforms: ["GA4", "META"],
      attributionWindowDays: 30,
    },
  ];
}

function buildFunnels(input: AnalyticsIntelligenceInput): AnalyticsFunnel[] {
  return [
    {
      funnelId: randomUUID(),
      name: "Ecommerce Purchase Funnel",
      primaryConversionEvent: "purchase",
      stages: [
        {
          stageId: randomUUID(),
          name: "Page View",
          eventName: "page_view",
          order: 1,
          benchmarkRate: 100,
        },
        {
          stageId: randomUUID(),
          name: "Product View",
          eventName: "view_item",
          order: 2,
          benchmarkRate: 45,
        },
        {
          stageId: randomUUID(),
          name: "Add to Cart",
          eventName: "add_to_cart",
          order: 3,
          benchmarkRate: 12,
        },
        {
          stageId: randomUUID(),
          name: "Begin Checkout",
          eventName: "begin_checkout",
          order: 4,
          benchmarkRate: 7,
        },
        {
          stageId: randomUUID(),
          name: "Purchase",
          eventName: "purchase",
          order: 5,
          benchmarkRate: 3,
        },
      ],
    },
    {
      funnelId: randomUUID(),
      name: "Lead Generation Funnel",
      primaryConversionEvent: "generate_lead",
      stages: [
        {
          stageId: randomUUID(),
          name: "Landing Page View",
          eventName: "page_view",
          order: 1,
          benchmarkRate: 100,
        },
        {
          stageId: randomUUID(),
          name: "Content Engagement",
          eventName: "view_item",
          order: 2,
          benchmarkRate: 35,
        },
        {
          stageId: randomUUID(),
          name: "Lead Submit",
          eventName: "generate_lead",
          order: 3,
          benchmarkRate: 8,
        },
      ],
    },
  ];
}

function buildRevenueAttribution(input: AnalyticsIntelligenceInput): RevenueAttributionModel {
  return {
    modelId: randomUUID(),
    name: `${input.brand.brandName} Revenue Attribution`,
    touchpointModels: ["FIRST_TOUCH", "LAST_TOUCH", "LINEAR", "DATA_DRIVEN"],
    defaultModel: "LAST_TOUCH",
    channels: [
      "Organic Search",
      "Paid Search",
      "Meta Ads",
      "TikTok Ads",
      "Email",
      "Direct",
      "Referral",
    ],
    revenueEvents: ["purchase"],
    lookbackWindowDays: 28,
  };
}

function buildDashboardMetrics(input: AnalyticsIntelligenceInput): DashboardMetric[] {
  const aov = input.offer.averageOrderValue ?? 49.99;

  return [
    {
      metricId: randomUUID(),
      name: "Sessions",
      category: "TRAFFIC",
      formula: "COUNT(sessions)",
      unit: "count",
      targetValue: 10000,
      dataSource: "GA4",
    },
    {
      metricId: randomUUID(),
      name: "Conversion Rate",
      category: "CONVERSION",
      formula: "purchases / sessions * 100",
      unit: "percent",
      targetValue: 3,
      dataSource: "COMPOSITE",
    },
    {
      metricId: randomUUID(),
      name: "Revenue",
      category: "REVENUE",
      formula: "SUM(purchase.value)",
      unit: "USD",
      targetValue: aov * 200,
      dataSource: "GA4",
    },
    {
      metricId: randomUUID(),
      name: "ROAS",
      category: "ACQUISITION",
      formula: "revenue / ad_spend",
      unit: "ratio",
      targetValue: 2.5,
      dataSource: "COMPOSITE",
    },
    {
      metricId: randomUUID(),
      name: "Meta Purchase Events",
      category: "CONVERSION",
      formula: "COUNT(meta.purchase)",
      unit: "count",
      targetValue: 150,
      dataSource: "META",
    },
    {
      metricId: randomUUID(),
      name: "TikTok Complete Payment",
      category: "CONVERSION",
      formula: "COUNT(tiktok.complete_payment)",
      unit: "count",
      targetValue: 80,
      dataSource: "TIKTOK",
    },
    {
      metricId: randomUUID(),
      name: "Repeat Purchase Rate",
      category: "RETENTION",
      formula: "repeat_purchasers / total_purchasers * 100",
      unit: "percent",
      targetValue: 18,
      dataSource: "GA4",
    },
    {
      metricId: randomUUID(),
      name: "Average Order Value",
      category: "REVENUE",
      formula: "SUM(purchase.value) / COUNT(purchase)",
      unit: "USD",
      targetValue: aov,
      dataSource: "GA4",
    },
  ];
}

function computeConfidence(
  input: AnalyticsIntelligenceInput,
  serverSideEvents: ServerSideEvent[],
  conversionEvents: ConversionEvent[],
  funnels: AnalyticsFunnel[],
  dashboardMetrics: DashboardMetric[],
  signals: AnalyticsSignal[],
): number {
  return clampScore(
    input.brand.confidence * 0.2 +
      serverSideEvents.length * 8 +
      conversionEvents.length * 6 +
      funnels.length * 10 +
      dashboardMetrics.length * 4 +
      average(signals.map((signal) => signal.score)) * 0.2,
  );
}

function buildSignals(
  ga: GoogleAnalyticsModel,
  meta: MetaPixelModel,
  tiktok: TikTokPixelModel,
  serverSideEvents: ServerSideEvent[],
  conversionEvents: ConversionEvent[],
  funnels: AnalyticsFunnel[],
  attribution: RevenueAttributionModel,
  dashboardMetrics: DashboardMetric[],
  confidence: number,
): AnalyticsSignal[] {
  return [
    buildSignal(
      "tracking_coverage",
      clampScore(ga.enabledEvents.length * 10 + meta.enabledEvents.length * 8 + tiktok.enabledEvents.length * 8),
      "GA4, Meta, and TikTok pixel models defined",
    ),
    buildSignal(
      "event_completeness",
      clampScore(conversionEvents.length * 18),
      `${conversionEvents.length} conversion events mapped`,
    ),
    buildSignal(
      "funnel_definition",
      clampScore(funnels.reduce((sum, funnel) => sum + funnel.stages.length, 0) * 5),
      `${funnels.length} funnels with ${funnels[0]?.stages.length ?? 0}+ stages`,
    ),
    buildSignal(
      "attribution_model",
      clampScore(attribution.touchpointModels.length * 20),
      `${attribution.touchpointModels.length} attribution models configured`,
    ),
    buildSignal(
      "dashboard_readiness",
      clampScore(dashboardMetrics.length * 10),
      `${dashboardMetrics.length} dashboard metrics defined`,
    ),
    buildSignal(
      "server_side_coverage",
      clampScore(serverSideEvents.length * 20),
      `${serverSideEvents.length} server-side events blueprinted`,
    ),
    buildSignal("blueprint_composite", confidence, `Analytics blueprint confidence ${confidence}`),
  ];
}

/** Generates a complete analytics blueprint — no live API integration. */
export function generateAnalyticsBlueprint(
  input: AnalyticsIntelligenceInput,
): AnalyticsIntelligenceBreakdown {
  const googleAnalytics = buildGoogleAnalyticsModel(input);
  const metaPixel = buildMetaPixelModel(input);
  const tikTokPixel = buildTikTokPixelModel(input);
  const serverSideEvents = buildServerSideEvents(input);
  const conversionEvents = buildConversionEvents(input);
  const funnels = buildFunnels(input);
  const revenueAttribution = buildRevenueAttribution(input);
  const dashboardMetrics = buildDashboardMetrics(input);

  const provisionalSignals = buildSignals(
    googleAnalytics,
    metaPixel,
    tikTokPixel,
    serverSideEvents,
    conversionEvents,
    funnels,
    revenueAttribution,
    dashboardMetrics,
    0,
  );
  const confidence = computeConfidence(
    input,
    serverSideEvents,
    conversionEvents,
    funnels,
    dashboardMetrics,
    provisionalSignals,
  );
  const signals = buildSignals(
    googleAnalytics,
    metaPixel,
    tikTokPixel,
    serverSideEvents,
    conversionEvents,
    funnels,
    revenueAttribution,
    dashboardMetrics,
    confidence,
  );

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    blueprintName: `${input.brand.brandName} Analytics Blueprint`,
    googleAnalytics,
    metaPixel,
    tikTokPixel,
    serverSideEvents,
    conversionEvents,
    funnels,
    revenueAttribution,
    dashboardMetrics,
    confidence,
    signals,
    blueprintOnly: true,
    liveApiEnabled: false,
    deploymentEnabled: false,
  };
}

export const analyticsIntelligenceScoring = {
  generateAnalyticsBlueprint,
  weights: ANALYTICS_SIGNAL_WEIGHTS,
};
