import { rankWinningProducts } from "../commerce-intelligence/winning-product-engine.js";
import { discoverProducts, getQualityThreshold } from "../commerce-intelligence/product-scorer.js";
import { rankSuppliers } from "../commerce-intelligence/supplier-scorer.js";
import { analyzeMarkets } from "../commerce-intelligence/market-analyzer.js";
import { PRODUCT_CATALOG } from "../commerce-intelligence/product-catalog.js";
import { SUPPLIER_CATALOG } from "../commerce-intelligence/supplier-catalog.js";
import { MARKET_CATALOG } from "../commerce-intelligence/market-catalog.js";
import { buildLaunchPlan } from "../commerce-intelligence/launch-planner.js";
import type { CompanyCreationPackage, EmpireCompany } from "./types.js";
import { EMPIRE_PORTFOLIO } from "./company-catalog.js";

export function createCompanyFromIntent(intent: string): CompanyCreationPackage | null {
  const evaluations = discoverProducts(PRODUCT_CATALOG);
  const supplierRankings = rankSuppliers(SUPPLIER_CATALOG);
  const marketAnalyses = analyzeMarkets(MARKET_CATALOG);
  const winners = rankWinningProducts({
    evaluations,
    supplierRankings,
    marketAnalyses,
  });

  if (winners.length === 0) return null;

  const q = intent.toLowerCase();
  let winner = winners[0]!;

  if (q.includes("pet")) {
    winner = winners.find((w) => /pet/i.test(w.product.name)) ?? winner;
  } else if (q.includes("fitness") || q.includes("band")) {
    winner = winners.find((w) => /fitness|band/i.test(w.product.name)) ?? winner;
  } else if (q.includes("wellness") || q.includes("massager")) {
    winner = winners.find((w) => /massager|wellness/i.test(w.product.category + w.product.name)) ?? winner;
  }

  const launch = buildLaunchPlan(winner);
  const product = winner.product;
  const supplier = winner.supplierRanking?.supplier;
  const slug = launch.storeConcept.split("—")[0]?.trim().replace(/\s+/g, "") ?? "EmpireCo";
  const companyId = `CO-${slug.toUpperCase()}-${Date.now().toString(36).slice(-4)}`;

  const existing = EMPIRE_PORTFOLIO.find(
    (c) => c.productCatalog.some((p) => p.id === product.id),
  );
  if (existing) {
    return packageFromExisting(existing, launch);
  }

  const company: EmpireCompany = {
    id: companyId,
    name: slug,
    brand: launch.storeConcept,
    status: launch.launchReadiness === "ready" ? "launching" : "draft",
    businessModel: `DTC dropshipping — ${product.category} via ${supplier?.name ?? "CJ supplier"}`,
    productCatalog: [
      {
        id: product.id,
        name: product.name,
        priceUsd: product.suggestedPriceUsd,
        costUsd: product.costUsd,
        marginPercent: product.profitMarginPercent,
        demandScore: product.demandScore,
      },
    ],
    pricingStrategy: launch.pricingStrategy,
    storeUrl: null,
    operations: {
      supplierId: supplier?.id ?? product.supplierId,
      supplierName: supplier?.name ?? "CJ Dropshipping",
      shippingDaysAvg: supplier?.shippingDaysAvg ?? 14,
      customerServiceChannel: "email + automated FAQ",
      fulfillmentModel: "dropship",
    },
    launchPlanId: `LAUNCH-${companyId}`,
    createdAt: new Date().toISOString(),
    marketIds: product.marketIds,
  };

  return {
    company,
    businessModel: company.businessModel,
    brand: launch.storeConcept,
    productCatalog: company.productCatalog,
    pricing: launch.pricingStrategy,
    storeConcept: launch.storeConcept,
    operationsPlan: [
      `Supplier: ${company.operations.supplierName}`,
      `Fulfillment: ${company.operations.fulfillmentModel}`,
      `Markets: ${product.marketIds.join(", ")}`,
    ],
    launchPlan: launch.launchChecklist,
    launchReadiness: launch.launchReadiness,
  };
}

function packageFromExisting(
  company: EmpireCompany,
  launch: ReturnType<typeof buildLaunchPlan>,
): CompanyCreationPackage {
  return {
    company,
    businessModel: company.businessModel,
    brand: company.brand,
    productCatalog: company.productCatalog,
    pricing: company.pricingStrategy,
    storeConcept: launch.storeConcept,
    operationsPlan: [
      `Supplier: ${company.operations.supplierName}`,
      `Status: ${company.status}`,
    ],
    launchPlan: launch.launchChecklist,
    launchReadiness: launch.launchReadiness,
  };
}

export function listCreationCandidates(): number {
  const threshold = getQualityThreshold();
  return discoverProducts(PRODUCT_CATALOG).filter((e) => e.overallScore >= threshold).length;
}
