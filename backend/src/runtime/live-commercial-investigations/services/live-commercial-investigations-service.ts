import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import type { LiveCommercialInvestigations } from "../models/live-commercial-investigations.js";

/** REAL-063 — Live commercial investigations with executive recommendations. */
export function buildLiveCommercialInvestigations(
  workspaceId: string,
  companyId: string,
): LiveCommercialInvestigations {
  let netProfit = 0;
  let mrr = 0;
  let refundCosts = 0;
  try {
    const econ = buildEmpireEconomics(workspaceId, companyId);
    netProfit = econ.netProfitUsd;
    mrr = econ.monthlyRecurringRevenueUsd;
    refundCosts = econ.revenueBreakdown.refundCostsUsd;
  } catch { /* optional */ }

  let oarConnected = 0;
  let revenueGaps = 0;
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    revenueGaps = oar.summary.revenueBlockingGaps;
  } catch { /* optional */ }

  const refundRate = mrr > 0 ? refundCosts / mrr : 0.05;
  const now = new Date().toISOString();

  const openInvestigations: LiveCommercialInvestigations["openInvestigations"] = [];

  if (mrr === 0 || netProfit <= 0) {
    openInvestigations.push({
      investigationId: "inv-sales-decline-001",
      type: "sales_decline",
      title: "Sales decline / zero revenue trajectory",
      status: "OPEN",
      severity: netProfit < 0 ? "CRITICAL" : "HIGH",
      executiveRecommendation: "Complete PROOF-001 and REAL-002B marketplace credentials before scaling spend",
      evidence: [`MRR $${mrr}`, `Net profit $${netProfit}`, "No verified revenue feed"],
      openedAt: now,
    });
  }

  if (refundRate >= 0.05) {
    openInvestigations.push({
      investigationId: "inv-refund-spike-001",
      type: "refund_spike",
      title: "Refund rate above baseline",
      status: "OPEN",
      severity: refundRate >= 0.1 ? "HIGH" : "MEDIUM",
      executiveRecommendation: "Audit product quality and listing accuracy — pause ads on affected SKUs",
      evidence: [`Refund costs $${refundCosts}`, `Effective rate ${Math.round(refundRate * 100)}%`],
      openedAt: now,
    });
  }

  openInvestigations.push({
    investigationId: "inv-supplier-001",
    type: "supplier_issue",
    title: "Supplier live catalog not attached",
    status: "OPEN",
    severity: "MEDIUM",
    executiveRecommendation: "Complete SUP-LIVE-001 CJ catalog sync and fulfillment attach",
    evidence: ["CJ architecture ready", "Live catalog pending verification"],
    openedAt: now,
  });

  if (oarConnected === 0 || revenueGaps > 0) {
    openInvestigations.push({
      investigationId: "inv-marketplace-001",
      type: "marketplace_warning",
      title: "Marketplace access gaps detected",
      status: "OPEN",
      severity: revenueGaps > 0 ? "HIGH" : "MEDIUM",
      executiveRecommendation: "REAL-002B — resolve OAR revenue-blocking gaps and verify SP-API credentials",
      evidence: [
        oarConnected === 0 ? "No live platform connections" : `${oarConnected} platforms connected`,
        revenueGaps > 0 ? `${revenueGaps} revenue-blocking gaps` : "Partial access",
      ],
      openedAt: now,
    });
  }

  openInvestigations.push({
    investigationId: "inv-country-001",
    type: "country_slowdown",
    title: "Multi-country expansion not yet live",
    status: "MONITORING",
    severity: "LOW",
    executiveRecommendation: "US-first launch validated before EU/UK expansion — Country Launch playbook",
    evidence: ["Architecture supports multi-country", "Live country distribution pending"],
    openedAt: now,
  });

  return {
    moduleId: "live-commercial-investigations",
    missionId: "REAL-063",
    workspaceId,
    companyId,
    openInvestigations,
    openCount: openInvestigations.filter((i) => i.status === "OPEN").length,
    architectureComplete: true,
    computedAt: now,
  };
}
