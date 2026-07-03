import type { BusinessLaunchPlan, WinningProductScore } from "./types.js";

export function buildLaunchPlan(winner: WinningProductScore): BusinessLaunchPlan {
  const product = winner.product;
  const supplier = winner.supplierRanking?.supplier;

  const storeConcept =
    product.category === "Pet Supplies"
      ? "PetJoy — curated pet wellness essentials"
      : product.category === "Fitness"
        ? "FitForge — home fitness accessories"
        : `${product.category} Essentials — premium direct-to-consumer`;

  const brandPositioning =
    winner.compositeScore >= 85
      ? "Premium value — quality above generic dropship, price below big brands"
      : "Smart value — reliable quality with competitive pricing";

  const marketingRecommendations = [
    product.advertisingPotential >= 80
      ? "Launch Meta + TikTok prospecting campaigns"
      : "Start with organic content + retargeting",
    "Use UGC-style product demos for conversion",
    `Target ${product.marketIds[0]?.replace("MKT-", "") ?? "US"} market first`,
    product.competitionLevel !== "low"
      ? "Emphasize differentiation in ad creative"
      : "Capture early mover advantage with broad targeting",
  ];

  const launchChecklist = [
    "Verify CJ supplier inventory and shipping zones",
    "Create Shopify/WooCommerce storefront listing",
    "Set pricing with 50%+ gross margin floor",
    "Configure Stripe live payments",
    "Run Commerce Readiness Engine (CRIR) check",
    "Deploy store via EmpireAI Storefront Engine",
    "Launch test ad spend ($50/day cap)",
    "Monitor return rate and supplier SLA for 14 days",
  ];

  const launchReadiness: BusinessLaunchPlan["launchReadiness"] =
    winner.compositeScore >= 80 && supplier && supplier.reliabilityScore >= 85
      ? "ready"
      : winner.compositeScore >= 72
        ? "conditional"
        : "not_ready";

  return {
    productId: product.id,
    storeConcept,
    brandPositioning,
    catalogueItems: [product.name],
    preferredSupplierId: supplier?.id ?? product.supplierId,
    pricingStrategy: `Cost $${product.costUsd} → Retail $${product.suggestedPriceUsd} (${product.profitMarginPercent}% margin)`,
    marketingRecommendations,
    launchChecklist,
    launchReadiness,
  };
}
