import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import type { AnalysisInsight, AutonomousAnalysisEngine } from "../models/autonomous-analysis-engine.js";

/** REAL-059 — Autonomous analysis engine (analysis only, no execution). */
export function buildAutonomousAnalysisEngine(
  workspaceId: string,
  companyId: string,
): AutonomousAnalysisEngine {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const liveCount = products.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state)).length;
  const pendingCount = products.filter((p) => ["KING_APPROVAL", "EXECUTIVE_REVIEW"].includes(p.state)).length;

  let netProfit = 0;
  let mrr = 0;
  let marginPercent = 0;
  try {
    const econ = buildEmpireEconomics(workspaceId, companyId);
    netProfit = econ.netProfitUsd;
    mrr = econ.monthlyRecurringRevenueUsd;
    marginPercent = econ.contributionMarginPercent;
  } catch { /* optional */ }

  let oarConnected = 0;
  let revenueGaps = 0;
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    revenueGaps = oar.summary.revenueBlockingGaps;
  } catch { /* optional */ }

  const suppliers = new Set(products.map((p) => p.supplierPlatform).filter(Boolean));
  const marketplaces = new Set(products.map((p) => p.marketplaceId ?? p.supplierPlatform).filter(Boolean));
  const countryCount = marketplaces.size > 0 ? 1 : 0;

  const insights: AnalysisInsight[] = [
    {
      domain: "products",
      title: "Pipeline composition",
      severity: liveCount === 0 ? "ALERT" : "WATCH",
      insight: `${products.length} products in pipeline · ${liveCount} live · ${pendingCount} awaiting executive review`,
      recommendation: liveCount === 0
        ? "Move highest commercial-score candidate through executive debate to King approval"
        : "Focus scale budget on live SKUs with positive unit economics",
      evidence: [`Pipeline ${products.length}`, `Live ${liveCount}`, `Pending approval ${pendingCount}`],
    },
    {
      domain: "suppliers",
      title: "Supplier coverage",
      severity: suppliers.size === 0 ? "ALERT" : "INFO",
      insight: `${suppliers.size} supplier platforms represented across pipeline`,
      recommendation: "Complete SUP-LIVE-001 CJ catalog sync before multi-supplier expansion",
      evidence: suppliers.size > 0 ? [...suppliers].map(String) : ["No supplier platform attached"],
    },
    {
      domain: "countries",
      title: "Country distribution",
      severity: countryCount <= 1 ? "WATCH" : "INFO",
      insight: `${countryCount || 1} countries in active pipeline planning`,
      recommendation: "US-first launch validated before EU/UK expansion",
      evidence: ["Default US-first architecture"],
    },
    {
      domain: "customers",
      title: "Customer signal readiness",
      severity: mrr === 0 ? "WATCH" : "INFO",
      insight: mrr === 0
        ? "No verified customer revenue feed — post-purchase intelligence limited"
        : "Customer intelligence modules available for LTV and refund analysis",
      recommendation: "Attach live order feed (REAL-002B) before scaling acquisition",
      evidence: [`MRR $${mrr}`],
    },
    {
      domain: "marketplaces",
      title: "Marketplace access",
      severity: revenueGaps > 0 ? "CRITICAL" : oarConnected === 0 ? "ALERT" : "INFO",
      insight: `${oarConnected} platforms connected · ${marketplaces.size} marketplaces in pipeline data`,
      recommendation: "Resolve OAR revenue-blocking gaps before listing publish",
      evidence: [
        `${oarConnected} OAR connections`,
        revenueGaps > 0 ? `${revenueGaps} revenue-blocking gaps` : "No revenue-blocking gaps",
      ],
    },
    {
      domain: "profitability",
      title: "Net profit trajectory",
      severity: netProfit <= 0 ? "CRITICAL" : marginPercent < 15 ? "WATCH" : "INFO",
      insight: `Net profit $${netProfit} · margin ${marginPercent}% · analysis-only (no auto-execution)`,
      recommendation: "CONSTITUTION-023: net profit before revenue vanity — Grand King approves spend",
      evidence: [`Net profit $${netProfit}`, `Margin ${marginPercent}%`, `MRR $${mrr}`],
    },
  ];

  const criticalCount = insights.filter((i) => i.severity === "CRITICAL" || i.severity === "ALERT").length;
  const executiveSummary = criticalCount > 0
    ? `${criticalCount} domains need executive attention — analysis only, approval required for action`
    : "Commercial domains stable — continue governed execution via Mission Command";

  return {
    moduleId: "autonomous-analysis-engine",
    missionId: "REAL-059",
    workspaceId,
    companyId,
    analysisOnly: true,
    insights,
    insightCount: insights.length,
    executiveSummary,
    reusedModules: ["empire-economics", "grand-king-revenue-pipeline", "operational-access"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
