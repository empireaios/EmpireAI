import type { SupplierDashboard } from "../models/supplier-dashboard.js";

export type ExecutiveSupplierBriefing = {
  supplyChainChief: {
    executiveId: "csco";
    title: "Chief Supply Chain Officer";
    summary: string;
    risks: string[];
    recommendations: string[];
  };
  merchantChief: {
    executiveId: "cmo-merchant";
    title: "Chief Merchant Officer";
    summary: string;
    opportunities: string[];
    recommendations: string[];
  };
};

/** SUP-012 — Executive Council supplier intelligence briefing. */
export function buildExecutiveSupplierBriefing(dashboard: SupplierDashboard): ExecutiveSupplierBriefing {
  const topOpp = dashboard.bestOpportunities[0];
  const criticalRisks = dashboard.supplierRisks.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");

  return {
    supplyChainChief: {
      executiveId: "csco",
      title: "Chief Supply Chain Officer",
      summary: `${dashboard.productsFound} supplier products tracked · ${dashboard.adapterSummary.connected}/${dashboard.adapterSummary.total} adapters connected · CJ readiness ${dashboard.cjReadiness.overallPercent}%`,
      risks: criticalRisks.slice(0, 4).map((r) => r.message),
      recommendations: [
        dashboard.highestPriorityAction?.action ?? "Maintain supplier adapter registry",
        dashboard.shippingRiskCount > 0 ? `Review ${dashboard.shippingRiskCount} shipping risk signals` : "No critical shipping risks",
        "Supplier product data is input — verify before fulfillment",
      ],
    },
    merchantChief: {
      executiveId: "cmo-merchant",
      title: "Chief Merchant Officer",
      summary: `${dashboard.productsUnderReview} products under review · ${dashboard.bestOpportunities.length} launch opportunities ranked by EmpireAI Intelligence`,
      opportunities: dashboard.bestOpportunities.slice(0, 3).map(
        (o) => `${o.title} (${o.providerId}, score ${o.score.overallScore})`,
      ),
      recommendations: [
        topOpp ? `Prioritize ${topOpp.title} from ${topOpp.providerId}` : "Await supplier catalog ingestion",
        "Compare suppliers before single-source commitment",
        "Route high-score products to CIS commercial review",
      ],
    },
  };
}
