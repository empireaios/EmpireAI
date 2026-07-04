import type { ContinuousOptimizationReport, EmpireCompany, OptimizationSignal } from "./types.js";

export function optimizeContinuously(companies: EmpireCompany[]): ContinuousOptimizationReport[] {
  return companies.map((company) => buildOptimizationReport(company));
}

function buildOptimizationReport(company: EmpireCompany): ContinuousOptimizationReport {
  const product = company.productCatalog[0];
  const signals: OptimizationSignal[] = [
    {
      area: "sales",
      currentMetric: `Demand score ${product?.demandScore ?? 70}/100`,
      targetImprovement: "A/B test checkout upsells for +15% AOV",
      priority: 80,
    },
    {
      area: "costs",
      currentMetric: `COGS ${100 - (product?.marginPercent ?? 50)}% of retail`,
      targetImprovement: "Negotiate volume discount with preferred supplier",
      priority: 70,
    },
    {
      area: "marketing",
      currentMetric: company.status === "operating" ? "3 active channels" : "1 test channel",
      targetImprovement: "Expand winning creative to lookalike audiences",
      priority: 85,
    },
    {
      area: "pricing",
      currentMetric: product?.priceUsd ? `$${product.priceUsd} retail` : "unset",
      targetImprovement: "Test +$5 premium tier with bundle offer",
      priority: 65,
    },
    {
      area: "inventory",
      currentMetric: `${company.operations.fulfillmentModel} via ${company.operations.supplierName}`,
      targetImprovement: "Monitor supplier stock alerts weekly",
      priority: 60,
    },
    {
      area: "operations",
      currentMetric: `${company.operations.shippingDaysAvg} day avg shipping`,
      targetImprovement: "Target <12 days via regional supplier routing",
      priority: 75,
    },
    {
      area: "engineering",
      currentMetric: company.storeUrl ? "Storefront live" : "Storefront pending deployment",
      targetImprovement: "Deploy via EmpireAI Storefront Engine + CRIR check",
      priority: company.storeUrl ? 40 : 90,
    },
    {
      area: "customer",
      currentMetric: `Service via ${company.operations.customerServiceChannel}`,
      targetImprovement: "Add automated order tracking notifications",
      priority: 70,
    },
  ];

  signals.sort((a, b) => b.priority - a.priority);

  const aggregateImprovementPotential = Math.round(
    signals.reduce((sum, s) => sum + s.priority, 0) / signals.length,
  );

  return {
    companyId: company.id,
    signals,
    aggregateImprovementPotential,
  };
}
