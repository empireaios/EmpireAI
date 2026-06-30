import { buildCustomerIntelligence } from "../../customer-intelligence/services/customer-intelligence-service.js";
import { buildCustomerPsychologyEngine } from "../../customer-psychology-engine/services/customer-psychology-engine-service.js";
import type { AiChiefOfCustomerDashboard } from "../models/ai-chief-of-customer.js";

/** REAL-033 — AI Chief of Customer (recommend only). */
export function buildAiChiefOfCustomer(
  workspaceId: string,
  companyId: string,
): AiChiefOfCustomerDashboard {
  const customers = buildCustomerIntelligence(workspaceId, companyId);
  const psychology = buildCustomerPsychologyEngine(workspaceId, companyId);

  const highRefund = customers.profiles.filter((p) => p.refundRatePercent > 5);
  const trustScore = customers.avgSatisfactionScore;
  const retentionScore = customers.repeatPurchaseRatePercent;

  return {
    moduleId: "ai-chief-of-customer",
    missionId: "REAL-033",
    workspaceId,
    companyId,
    trustScore,
    reviewHealth: customers.avgSatisfactionScore >= 70 ? "HEALTHY" : "NEEDS_IMPROVEMENT",
    refundRisk: highRefund.length > 0 ? `${highRefund.length} segments above 5% refund` : "LOW",
    retentionScore,
    experienceScore: Math.round((trustScore + psychology.avgPurchaseScore) / 2),
    purchaseConfidenceAvg: psychology.evaluations.length
      ? Math.round(psychology.evaluations.reduce((s, e) => s + e.purchaseConfidence, 0) / psychology.evaluations.length)
      : 0,
    customerRecommendations: [
      { title: customers.executiveRecommendation, evidence: customers.recommendationEvidence },
      { title: psychology.executiveRecommendation, evidence: psychology.recommendationEvidence },
      {
        title: "Improve listing trust before ad scale",
        evidence: `Avg purchase confidence ${psychology.avgPurchaseScore} · CONSTITUTION-027`,
      },
    ],
    recommendOnly: true,
    reusedModules: ["customer-intelligence", "customer-psychology-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
