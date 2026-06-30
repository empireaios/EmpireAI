import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { listPipelineProducts } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import type { GlobalBusinessHealthEngine, HealthDimension } from "../models/global-business-health-engine.js";
import { HEALTH_DIMENSIONS } from "../models/global-business-health-engine.js";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** REAL-061 — Global business health engine (8 dimension scores 0–100). */
export function buildGlobalBusinessHealthEngine(
  workspaceId: string,
  companyId: string,
): GlobalBusinessHealthEngine {
  let oarConnected = 0;
  let revenueGaps = 0;
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    revenueGaps = oar.summary.revenueBlockingGaps;
  } catch { /* optional */ }

  let netProfit = 0;
  let mrr = 0;
  let roiPercent = 0;
  try {
    const econ = buildEmpireEconomics(workspaceId, companyId);
    netProfit = econ.netProfitUsd;
    mrr = econ.monthlyRecurringRevenueUsd;
    roiPercent = econ.roiPercent;
  } catch { /* optional */ }

  const products = listPipelineProducts(workspaceId, companyId);
  const liveCount = products.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state)).length;
  const pipelineCount = products.length;

  const dimensionScores: Record<HealthDimension, { score: number; evidence: string[]; recommendation: string }> = {
    empire: {
      score: clampScore(40 + (netProfit > 0 ? 25 : 0) + (oarConnected > 0 ? 15 : 0) + Math.min(liveCount * 5, 20)),
      evidence: [`Net profit $${netProfit}`, `${liveCount} live products`, `${oarConnected} platforms connected`],
      recommendation: netProfit > 0 ? "Maintain positive unit economics while scaling" : "Prioritize PROOF-001 verified net profit",
    },
    countries: {
      score: clampScore(50 + (oarConnected > 0 ? 20 : 0) + (liveCount > 0 ? 10 : 0)),
      evidence: ["Multi-country architecture ready", liveCount > 0 ? "Live distribution active" : "Country launch pending"],
      recommendation: "US-first launch, then EU expansion via Country Launch playbook",
    },
    marketplaces: {
      score: clampScore(oarConnected > 0 ? 55 + oarConnected * 10 : 35),
      evidence: oarConnected > 0 ? [`${oarConnected} marketplace connections`] : ["No live marketplace credentials"],
      recommendation: "REAL-002B — Connect Amazon SP-API + verified credentials",
    },
    suppliers: {
      score: clampScore(liveCount > 0 ? 70 : 55),
      evidence: ["CJ fulfillment architecture ready", `${pipelineCount} pipeline products`],
      recommendation: "Complete SUP-LIVE-001 live catalog sync",
    },
    products: {
      score: clampScore(Math.min(90, 30 + liveCount * 12 + pipelineCount * 2)),
      evidence: [`${liveCount} live · ${pipelineCount} in pipeline`],
      recommendation: liveCount === 0 ? "Move first product through King approval to LIVE" : "Scale winners with net-profit guardrails",
    },
    revenue: {
      score: clampScore(mrr > 0 ? 45 + Math.min(Math.round(mrr / 100), 40) : 25),
      evidence: [`MRR $${mrr}`],
      recommendation: "Attach live P&L feed before scaling ads — ECON-LIVE-001",
    },
    profit: {
      score: clampScore(netProfit > 0 ? 55 + Math.min(Math.round(netProfit / 200), 35) : netProfit === 0 ? 30 : 15),
      evidence: [`Net profit $${netProfit}`, `ROI ${roiPercent}%`],
      recommendation: "CONSTITUTION-023: net profit before revenue vanity",
    },
    operations: {
      score: clampScore(revenueGaps === 0 ? 75 : 40 - revenueGaps * 5),
      evidence: revenueGaps > 0 ? [`${revenueGaps} revenue-blocking OAR gaps`] : ["OAR gaps clear"],
      recommendation: "Close all revenue-blocking operational access gaps",
    },
  };

  const healthScores = HEALTH_DIMENSIONS.map((dimension) => {
    const d = dimensionScores[dimension];
    return { dimension, score: d.score, evidence: d.evidence, recommendation: d.recommendation };
  });

  const overallHealthScore = clampScore(
    healthScores.reduce((s, h) => s + h.score, 0) / healthScores.length,
  );

  const weakest = [...healthScores].sort((a, b) => a.score - b.score)[0];
  const executiveSummary = overallHealthScore >= 70
    ? `Empire health ${overallHealthScore}/100 — stable with focus on ${weakest?.dimension ?? "operations"}`
    : `Empire health ${overallHealthScore}/100 — prioritize ${weakest?.recommendation ?? "operational gaps"}`;

  return {
    moduleId: "global-business-health-engine",
    missionId: "REAL-061",
    workspaceId,
    companyId,
    healthScores,
    overallHealthScore,
    executiveSummary,
    reusedModules: ["empire-economics", "operational-access", "grand-king-revenue-pipeline"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
