import type { CompanyOperationSnapshot, EmpireCompany } from "./types.js";
import { EMPIRE_PORTFOLIO } from "./company-catalog.js";

export function operateCompanies(companies: EmpireCompany[] = EMPIRE_PORTFOLIO): CompanyOperationSnapshot[] {
  return companies.map((company) => buildOperationSnapshot(company));
}

function buildOperationSnapshot(company: EmpireCompany): CompanyOperationSnapshot {
  const topProduct = company.productCatalog[0];
  const margin = topProduct?.marginPercent ?? 50;
  const demand = topProduct?.demandScore ?? 70;

  const revenueMultiplier =
    company.status === "operating" ? 1.0 :
    company.status === "scaling" ? 1.4 :
    company.status === "launching" ? 0.3 : 0.1;

  const monthlyRevenueEstimateUsd = Math.round(
    (topProduct?.priceUsd ?? 25) * demand * revenueMultiplier * 0.15,
  );
  const monthlyCostEstimateUsd = Math.round(
    monthlyRevenueEstimateUsd * (1 - margin / 100),
  );

  const activeCampaigns =
    company.status === "operating" || company.status === "scaling"
      ? ["Meta prospecting", "TikTok UGC", "Email retargeting"]
      : company.status === "launching"
        ? ["Test ad spend ($50/day cap)"]
        : [];

  const growthTrend: CompanyOperationSnapshot["growthTrend"] =
    demand >= 85 ? "rising" : demand >= 70 ? "stable" : "declining";

  return {
    companyId: company.id,
    companyName: company.name,
    status: company.status,
    productCount: company.productCatalog.length,
    activeCampaigns,
    monthlyRevenueEstimateUsd,
    monthlyCostEstimateUsd,
    customerSatisfactionScore: Math.min(95, 70 + margin / 5),
    operationalEfficiencyScore: Math.min(95, 100 - company.operations.shippingDaysAvg),
    growthTrend,
    managementNotes: buildManagementNotes(company, monthlyRevenueEstimateUsd, monthlyCostEstimateUsd),
  };
}

function buildManagementNotes(
  company: EmpireCompany,
  revenue: number,
  cost: number,
): string[] {
  const notes: string[] = [];
  const profit = revenue - cost;

  if (profit > 0) {
    notes.push(`Estimated monthly profit $${profit} — maintain ad spend efficiency`);
  } else {
    notes.push("Negative unit economics — review pricing and supplier costs");
  }

  if (company.status === "launching") {
    notes.push("Complete CRIR certification before scaling ad spend");
  }

  if (company.operations.shippingDaysAvg > 14) {
    notes.push("Shipping SLA above target — evaluate alternate supplier tier");
  }

  notes.push(`Customer service via ${company.operations.customerServiceChannel}`);
  return notes;
}
