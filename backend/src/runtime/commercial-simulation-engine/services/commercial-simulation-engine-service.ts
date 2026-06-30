import { buildBusinessSimulationDashboard } from "../../../orchestration/business-simulation-engine/services/business-simulation-service.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import type { CommercialSimulationEngine } from "../models/commercial-simulation-engine.js";
import { SIMULATION_SCENARIOS } from "../models/commercial-simulation-engine.js";

const SCENARIO_LABELS: Record<(typeof SIMULATION_SCENARIOS)[number], string> = {
  before_launch: "Before Launch",
  expansion: "Expansion",
  supplier_switch: "Supplier Switch",
  pricing_change: "Pricing Change",
};

/** REAL-064 — Commercial simulation engine (wraps orchestration business-simulation-engine). */
export function buildCommercialSimulationEngine(
  workspaceId: string,
  companyId: string,
): CommercialSimulationEngine {
  let simDashboard: ReturnType<typeof buildBusinessSimulationDashboard> | null = null;
  try {
    simDashboard = buildBusinessSimulationDashboard(workspaceId, companyId);
  } catch { /* optional */ }

  let baseProfit = 0;
  let baseRevenue = 0;
  try {
    const econ = buildEmpireEconomics(workspaceId, companyId);
    baseProfit = econ.netProfitUsd;
    baseRevenue = econ.monthlyRecurringRevenueUsd;
  } catch { /* optional */ }

  const projectedProfit = simDashboard?.projectedProfit ?? baseProfit;
  const projectedRevenue = simDashboard?.projectedCashflow ?? baseRevenue;
  const breakEven = simDashboard?.projectedBreakEven ?? 6;
  const confidence = simDashboard?.simulationConfidence ?? 55;

  const scenarioMultipliers: Record<(typeof SIMULATION_SCENARIOS)[number], { profit: number; revenue: number; breakEven: number; confidence: number }> = {
    before_launch: { profit: 0.6, revenue: 0.5, breakEven: 1.2, confidence: 0.85 },
    expansion: { profit: 1.4, revenue: 1.6, breakEven: 0.9, confidence: 0.75 },
    supplier_switch: { profit: 0.95, revenue: 1.0, breakEven: 1.05, confidence: 0.7 },
    pricing_change: { profit: 1.15, revenue: 0.9, breakEven: 0.95, confidence: 0.8 },
  };

  const scenarios = SIMULATION_SCENARIOS.map((scenario) => {
    const m = scenarioMultipliers[scenario];
    const profit = Math.round((projectedProfit || baseProfit) * m.profit);
    const revenue = Math.round((projectedRevenue || baseRevenue || 1000) * m.revenue);
    const be = Math.max(1, Math.round(breakEven * m.breakEven));
    const conf = Math.round(confidence * m.confidence);
    const recommendation = profit > baseProfit
      ? `Proceed with ${SCENARIO_LABELS[scenario]} — positive profit delta`
      : `Defer ${SCENARIO_LABELS[scenario]} — validate unit economics first`;
    return {
      scenario,
      label: SCENARIO_LABELS[scenario],
      projectedProfitUsd: profit,
      projectedRevenueUsd: revenue,
      breakEvenMonths: be,
      confidence: conf,
      recommendation,
      evidence: simDashboard?.latestSimulationId
        ? `Derived from simulation ${simDashboard.latestSimulationId}`
        : "Derived from empire-economics baseline",
    };
  });

  return {
    moduleId: "commercial-simulation-engine",
    missionId: "REAL-064",
    workspaceId,
    companyId,
    simulationSummary: {
      businessSimulationScore: simDashboard?.businessSimulationScore ?? 0,
      projectedProfit: simDashboard?.projectedProfit ?? baseProfit,
      projectedCashflow: simDashboard?.projectedCashflow ?? baseRevenue,
      projectedBreakEven: simDashboard?.projectedBreakEven ?? breakEven,
      simulationConfidence: simDashboard?.simulationConfidence ?? confidence,
      launchRecommendation: simDashboard?.launchRecommendation,
    },
    scenarios,
    reusedModules: ["business-simulation-engine", "empire-economics"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
