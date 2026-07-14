import { assembleBusinessFactoryArchitecture } from "../business-factory/assembler.js";
import type { BusinessFactoryArchitecture } from "../business-factory/types.js";
import {
  COMMERCE_PIPELINE,
  COMMERCE_PRINCIPLES,
  COMMERCE_CAPABILITIES,
  REVENUE_STREAMS,
  REVENUE_GOVERNANCE,
  COMMERCE_BUSINESS_LIFECYCLE,
} from "./paths.js";
import type {
  CommerceOperatingModel,
  CommerceBusinessLifecycleStage,
  CommercePipelinePhase,
  CommerceBusinessRecord,
  CommerceBrandRecord,
  CommerceStoreRecord,
  CommerceProductRecord,
  CommerceOrderRecord,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function lifecycleFromFactoryStage(stage: string): CommerceBusinessLifecycleStage {
  const map: Record<string, CommerceBusinessLifecycleStage> = {
    business_idea: "business_created",
    business_approved: "business_configured",
    business_constructing: "business_configured",
    business_preparing: "business_launch_ready",
    business_launch_ready: "business_launch_ready",
    business_live: "business_live",
    business_growing: "business_growing",
    business_optimising: "business_optimising",
    business_mature: "business_mature",
    business_historical: "business_historical",
  };
  return map[stage] ?? "business_created";
}

function commercePhaseFromLifecycle(lifecycle: CommerceBusinessLifecycleStage): CommercePipelinePhase {
  const map: Record<CommerceBusinessLifecycleStage, CommercePipelinePhase> = {
    business_created: "business_approved",
    business_configured: "store_configured",
    business_launch_ready: "advertising_prepared",
    business_live: "business_launched",
    business_growing: "business_growth",
    business_optimising: "continuous_optimisation",
    business_mature: "continuous_optimisation",
    business_historical: "continuous_optimisation",
  };
  return map[lifecycle];
}

function buildPipeline(activePhase: CommercePipelinePhase) {
  const activeIdx = COMMERCE_PIPELINE.indexOf(activePhase);
  return COMMERCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function entitiesFromFactory(
  factory: BusinessFactoryArchitecture,
  commerceReport?: {
    launchPlans?: Array<{
      productId: string;
      storeConcept: string;
      brandPositioning: string;
      preferredSupplierId?: string;
      catalogueItems?: string[];
      launchReadiness?: string;
      pricingStrategy?: string;
      marketingRecommendations?: string[];
    }>;
    recommendedProducts?: Array<{
      product?: { id?: string; name?: string; category?: string };
      evaluation?: { profitMarginPercent?: number };
    }>;
    supplierRankings?: Array<{ supplier?: { id?: string; name?: string } }>;
  } | null,
): {
  businesses: CommerceBusinessRecord[];
  brands: CommerceBrandRecord[];
  stores: CommerceStoreRecord[];
  products: CommerceProductRecord[];
  orders: CommerceOrderRecord[];
} {
  const businesses: CommerceBusinessRecord[] = factory.businesses.map((b) => {
    const lifecycle = lifecycleFromFactoryStage(b.stage);
    return {
      id: b.id,
      name: b.name,
      lifecycleStage: lifecycle,
      pipelinePhase: commercePhaseFromLifecycle(lifecycle),
      progressPercent: b.progressPercent,
      commerceHealth: b.health,
      revenue: b.revenue,
      profit: b.revenue === "Pre-launch" || b.revenue === "Pre-revenue" ? "Pre-profit" : "Tracking",
      growthTrend: b.growth,
    };
  });

  const brands: CommerceBrandRecord[] = (commerceReport?.launchPlans ?? factory.businesses).map(
    (item, i) => {
      const plan = "storeConcept" in item ? item : null;
      const biz = factory.businesses[i] ?? factory.businesses[0];
      return {
        id: `brand-${plan?.productId ?? biz?.id ?? i}`,
        name: plan?.brandPositioning ?? biz?.brand ?? biz?.name ?? "Brand",
        businessId: plan?.productId ?? biz?.id ?? `biz-${i}`,
        positioning: plan?.brandPositioning ?? String(biz?.brand ?? "Constitutional brand"),
      };
    },
  );

  const stores: CommerceStoreRecord[] = (commerceReport?.launchPlans ?? []).map((plan) => ({
    id: `store-${plan.productId}`,
    name: plan.storeConcept,
    businessId: plan.productId,
    status: plan.launchReadiness?.replace(/_/g, " ") ?? "configuring",
    url: plan.launchReadiness === "ready" ? null : null,
  }));

  if (stores.length === 0 && factory.businesses[0]) {
    stores.push({
      id: "store-portfolio",
      name: factory.businesses[0].store ?? factory.businesses[0].name,
      businessId: factory.businesses[0].id,
      status: factory.launchStatus,
      url: null,
    });
  }

  const products: CommerceProductRecord[] = (commerceReport?.recommendedProducts ?? []).slice(0, 8).map(
    (p, i) => ({
      id: p.product?.id ?? `prod-${i}`,
      name: p.product?.name ?? "Product",
      businessId: stores[0]?.businessId ?? "portfolio-primary",
      category: p.product?.category ?? "General",
      marginPercent: p.evaluation?.profitMarginPercent ?? 0,
      supplierId: commerceReport?.supplierRankings?.[0]?.supplier?.id ?? null,
    }),
  );

  if (products.length === 0 && commerceReport?.launchPlans?.[0]) {
    const plan = commerceReport.launchPlans[0];
    products.push({
      id: plan.productId,
      name: plan.catalogueItems?.[0] ?? plan.storeConcept,
      businessId: plan.productId,
      category: "Catalogue",
      marginPercent: 0,
      supplierId: plan.preferredSupplierId ?? null,
    });
  }

  const orders: CommerceOrderRecord[] =
    factory.liveBusinessCount > 0
      ? [
          {
            id: "ord-sample",
            businessId: factory.businesses[0]?.id ?? "portfolio",
            status: "fulfilled",
            revenue: factory.revenueSummary,
            fulfilment: "CJ Dropshipping",
          },
        ]
      : [];

  return { businesses, brands, stores, products, orders };
}

export function assembleCommerceOperatingModel(input: {
  factory?: BusinessFactoryArchitecture;
  commerceReport?: Parameters<typeof entitiesFromFactory>[1];
  founderShell?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): CommerceOperatingModel {
  const factory =
    input.factory ??
    assembleBusinessFactoryArchitecture({
      commerceReport: input.commerceReport as Parameters<
        typeof assembleBusinessFactoryArchitecture
      >[0]["commerceReport"],
      founderShell: input.founderShell,
      guardian: input.guardian,
      supervisor: input.supervisor,
    });

  const { businesses, brands, stores, products, orders } = entitiesFromFactory(
    factory,
    input.commerceReport,
  );

  const primary = businesses[0];
  const pipelinePhase = primary?.pipelinePhase ?? "commerce_configured";
  const executiveHome = (input.founderShell?.executiveHome ?? {}) as Record<string, unknown>;

  const revenueModel = {
    streams: REVENUE_STREAMS.map((id) => ({
      id,
      label: label(id),
      status: id === "commerce_revenue" ? "active" : id === "advertising_revenue" ? "preparing" : "planned",
      summary:
        id === "commerce_revenue"
          ? "Product sales and order margin — primary V1 revenue"
          : id === "subscription_revenue"
            ? "Platform subscriptions — future stream"
            : id === "advertising_revenue"
              ? "Meta ads ROAS-driven revenue"
              : "Documented in Commerce Operating Model",
    })),
    allocation: "Grand King sovereign allocation · reinvestment · growth reserves",
    reporting: REVENUE_GOVERNANCE[1] ? "Cockpit · Executive Home · Pillow analytics" : "Cockpit reporting",
    totalRevenue: String(executiveHome.revenue ?? factory.revenueSummary),
    totalProfit: factory.liveBusinessCount > 0 ? "Margin tracking active" : "Pre-profit pipeline",
  };

  const pillow: CommerceOperatingModel["pillow"] = {
    opportunities: factory.currentOpportunities,
    risks: factory.currentRisks,
    performance: factory.pillow.performance,
    revenueTrends: [factory.revenueSummary, ...factory.pillow.growth],
    profitTrends: ["Profit-first doctrine · margin before scale", revenueModel.totalProfit],
    marketingPerformance: (input.commerceReport?.launchPlans ?? [])
      .flatMap((p) => p.marketingRecommendations ?? [])
      .slice(0, 4),
    growthOpportunities: factory.pillow.growth,
  };

  if (pillow.marketingPerformance.length === 0) {
    pillow.marketingPerformance.push("Marketing preparation follows commerce configuration gate");
  }

  const guardian = input.guardian ?? {};
  const commerceHealth =
    guardian.overallHealth === "healthy" && factory.businessHealth === "healthy"
      ? "healthy"
      : factory.businessHealth === "attention" || guardian.overallHealth === "degraded"
        ? "attention"
        : "building";

  return {
    architectureVersion: "P8-02",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      factory.grandKingSummary ??
      "Commerce Operating Model — one constitutional framework for every manufactured business",
    commerceHealth,
    activeBusinessCount: factory.activeBusinessCount,
    liveBusinessCount: factory.liveBusinessCount,
    businesses,
    brands,
    stores,
    products,
    orders,
    revenueSummary: revenueModel.totalRevenue,
    profitSummary: revenueModel.totalProfit,
    marketingSummary:
      pillow.marketingPerformance[0] ?? "Advertising prepared post commerce configuration",
    growthTrends: factory.pillow.growth,
    currentOpportunities: factory.currentOpportunities,
    currentRisks: factory.currentRisks,
    pipeline: buildPipeline(pipelinePhase),
    principles: [...COMMERCE_PRINCIPLES],
    capabilities: [...COMMERCE_CAPABILITIES],
    lifecycle: [...COMMERCE_BUSINESS_LIFECYCLE],
    revenueModel,
    pillow,
    factoryIntegration: {
      factoryStage: factory.currentFactoryStage,
      factoryProgressPercent: factory.pipelineProgressPercent,
      factoryBusinessCount: factory.activeBusinessCount,
    },
  };
}

export function buildFallbackCommerceOperatingModel(): CommerceOperatingModel {
  return assembleCommerceOperatingModel({
    founderShell: {
      grandKingSummary: "Start Pillow session for live Commerce Operating Model across portfolio",
      executiveHome: { revenue: "Pre-revenue", businessStatus: "building" },
    },
  });
}
