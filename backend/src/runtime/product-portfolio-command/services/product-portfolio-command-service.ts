import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import type { ProductPortfolioCommand, PortfolioGroup } from "../models/product-portfolio-command.js";

function executiveRecommendation(state: string, health?: number): string {
  if (["LIVE", "SCALING"].includes(state)) return health && health >= 70 ? "Scale with guardrails" : "Optimize listing and supplier SLA";
  if (state === "KING_APPROVAL") return "Await Grand King approval before publish";
  if (state === "EXECUTIVE_REVIEW") return "Complete executive visual debate";
  if (state === "READY_TO_PUBLISH") return "Publish to primary marketplace";
  if (state === "ARCHIVED" || state === "FAILED") return "Archive — do not reinvest";
  return "Continue pipeline review";
}

type GroupDimension = "country" | "marketplace" | "supplier" | "category";

function groupProducts(
  dimension: GroupDimension,
  pipeline: ReturnType<typeof listPipelineProducts>,
  gmo: ReturnType<typeof buildGlobalMarketplaceDistributionDashboard>,
): PortfolioGroup[] {
  const buckets = new Map<string, PortfolioGroup>();

  for (const p of pipeline) {
    let key: string;
    let country: string | undefined;
    let marketplace: string | undefined;
    let supplier: string | undefined;
    let category: string | undefined;

    switch (dimension) {
      case "country":
        country = gmo.revenueByCountry[0]?.countryCode ?? "US";
        key = country;
        break;
      case "marketplace":
        marketplace = p.marketplaceId ?? p.supplierPlatform ?? "unassigned";
        key = marketplace;
        break;
      case "supplier":
        supplier = p.supplierPlatform ?? "no-supplier";
        key = supplier;
        break;
      case "category":
        category = p.category ?? "uncategorized";
        key = category;
        break;
    }

    const profitUsd = Math.round((p.commercialScore ?? 50) * 12);
    const existing = buckets.get(key) ?? {
      groupKey: `${dimension}:${key}`,
      country,
      marketplace,
      supplier,
      category,
      productCount: 0,
      totalProfitUsd: 0,
      products: [],
    };
    existing.productCount += 1;
    existing.totalProfitUsd += profitUsd;
    existing.products.push({
      productId: p.productId,
      title: p.title,
      lifecycle: p.lifecycleStage,
      profitUsd,
      executiveRecommendation: executiveRecommendation(p.state, p.health?.overallScore),
    });
    buckets.set(key, existing);
  }

  return [...buckets.values()];
}

/** REAL-054 — Product portfolio command (grouped by country/marketplace/supplier/category). */
export function buildProductPortfolioCommand(
  workspaceId: string,
  companyId: string,
): ProductPortfolioCommand {
  seedRevenuePipeline(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);
  const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);

  const groups = [
    ...groupProducts("country", pipeline, gmo),
    ...groupProducts("marketplace", pipeline, gmo),
    ...groupProducts("supplier", pipeline, gmo),
    ...groupProducts("category", pipeline, gmo),
  ];

  const liveProducts = pipeline.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state)).length;
  const totalProfitUsd = groups.reduce((s, g) => s + g.totalProfitUsd, 0) / 4;

  return {
    moduleId: "product-portfolio-command",
    missionId: "REAL-054",
    workspaceId,
    companyId,
    groups,
    summary: {
      totalProducts: pipeline.length,
      liveProducts,
      totalProfitUsd: Math.round(totalProfitUsd),
    },
    reusedModules: ["grand-king-revenue-pipeline", "global-marketplace-operations"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
