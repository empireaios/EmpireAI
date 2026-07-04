import type { BusinessManagementEvaluation, CompanyOperationSnapshot } from "./types.js";

export function evaluateBusinessManagement(
  snapshots: CompanyOperationSnapshot[],
): BusinessManagementEvaluation[] {
  return snapshots.map((snap) => evaluateCompany(snap));
}

function evaluateCompany(snap: CompanyOperationSnapshot): BusinessManagementEvaluation {
  const profit = snap.monthlyRevenueEstimateUsd - snap.monthlyCostEstimateUsd;
  const profitabilityScore = Math.min(100, Math.max(0, 50 + profit / 10));
  const cashFlowScore = profit > 0 ? Math.min(100, 60 + profit / 8) : Math.max(0, 40 + profit / 5);
  const advertisingScore =
    snap.activeCampaigns.length >= 2 ? 85 : snap.activeCampaigns.length === 1 ? 70 : 45;
  const conversionScore = Math.min(100, snap.customerSatisfactionScore * 0.9);
  const operationalEfficiencyScore = snap.operationalEfficiencyScore;

  const overallHealthScore = Math.round(
    profitabilityScore * 0.25 +
    cashFlowScore * 0.2 +
    advertisingScore * 0.15 +
    conversionScore * 0.15 +
    snap.customerSatisfactionScore * 0.15 +
    operationalEfficiencyScore * 0.1,
  );

  const autoRecommendations: string[] = [];

  if (profitabilityScore < 70) {
    autoRecommendations.push("Increase margin via bundle pricing or supplier renegotiation");
  }
  if (cashFlowScore < 65) {
    autoRecommendations.push("Reduce ad spend until positive cash flow stabilises");
  }
  if (advertisingScore < 70) {
    autoRecommendations.push("Launch multi-channel campaigns (Meta + TikTok)");
  }
  if (conversionScore < 75) {
    autoRecommendations.push("Improve product page UX and add social proof reviews");
  }
  if (operationalEfficiencyScore < 80) {
    autoRecommendations.push("Optimise supplier shipping zones for target markets");
  }
  if (snap.growthTrend === "declining") {
    autoRecommendations.push("Refresh ad creative and test new audience segments");
  }

  if (autoRecommendations.length === 0) {
    autoRecommendations.push("Performance healthy — consider scaling ad budget 20%");
  }

  return {
    companyId: snap.companyId,
    profitabilityScore: Math.round(profitabilityScore),
    cashFlowScore: Math.round(cashFlowScore),
    advertisingScore: Math.round(advertisingScore),
    conversionScore: Math.round(conversionScore),
    customerSatisfactionScore: snap.customerSatisfactionScore,
    operationalEfficiencyScore,
    overallHealthScore,
    autoRecommendations,
  };
}
