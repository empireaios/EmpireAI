import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import { getBusinessOpportunityRepository } from "../../business-opportunity-workspace/index.js";
import { getBusinessBuildRepository } from "../../business-build-engine/index.js";
import { getMarketStrategyRepository } from "../../market-domination-strategy-engine/index.js";
import type {
  BusinessSimulationComparison,
  BusinessSimulationDashboard,
  BusinessSimulationRecord,
  BusinessSimulationSummary,
  FinancialForecast,
  SimulationRecommendation,
} from "../models/business-simulation.js";
import {
  getBusinessSimulationRepository,
  resetBusinessSimulationRepository,
} from "../repositories/sqlite-business-simulation-repository.js";
import { RECOMMENDATION_RANK, runBusinessSimulation } from "./business-simulation-engine.js";

export { getBusinessSimulationRepository, resetBusinessSimulationRepository };

export class BusinessSimulationNotFoundError extends Error {
  constructor(simulationId: string) {
    super(`Business simulation not found: ${simulationId}`);
    this.name = "BusinessSimulationNotFoundError";
  }
}

export class BusinessSimulationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessSimulationBlockedError";
  }
}

function captureSimulationSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

function resolveSimulationInputs(buildId: string) {
  const build = getBusinessBuildRepository().getBuild(buildId);
  if (!build) {
    throw new BusinessSimulationBlockedError(`Business build not found: ${buildId}`);
  }
  if (!["READY_FOR_PUBLICATION", "BUILDING"].includes(build.status)) {
    throw new BusinessSimulationBlockedError(
      `Simulation requires completed build package — status: ${build.status}`,
    );
  }
  if (!build.validation.valid && build.status !== "READY_FOR_PUBLICATION") {
    throw new BusinessSimulationBlockedError("Build package validation incomplete");
  }

  const opportunity = getBusinessOpportunityRepository().getOpportunity(build.businessOpportunityId);
  if (!opportunity) {
    throw new BusinessSimulationBlockedError("Source business opportunity not found");
  }

  const strategy = getMarketStrategyRepository().getLatestByOpportunity(build.businessOpportunityId);
  if (!strategy) {
    throw new BusinessSimulationBlockedError("Market domination strategy required for simulation");
  }

  return { build, opportunity, strategy };
}

/** Runs business simulation for a build package — no publication or ad execution. */
export function runBusinessSimulationForBuild(
  buildId: string,
  actor?: string,
  options?: { configuredCapitalConstraint?: number },
): BusinessSimulationRecord {
  const { build, opportunity, strategy } = resolveSimulationInputs(buildId);
  const simulation = runBusinessSimulation({
    build,
    opportunity,
    strategy,
    configuredCapitalConstraint: options?.configuredCapitalConstraint,
  });
  const saved = getBusinessSimulationRepository().saveSimulation(simulation);

  captureSimulationSoulRuntime(
    build.workspaceId,
    "Business simulation completed",
    `${build.businessName} — ${saved.finalRecommendation.recommendation}`,
    actor ?? "business-simulation-engine",
    { simulationId: saved.simulationId, buildId },
  );

  return saved;
}

export function getBusinessSimulation(simulationId: string): BusinessSimulationRecord | null {
  return getBusinessSimulationRepository().getSimulation(simulationId);
}

export function getBusinessSimulationForecast(simulationId: string): FinancialForecast | null {
  const simulation = getBusinessSimulationRepository().getSimulation(simulationId);
  return simulation?.financialForecast ?? null;
}

export function getBusinessSimulationRecommendation(simulationId: string): SimulationRecommendation | null {
  const simulation = getBusinessSimulationRepository().getSimulation(simulationId);
  return simulation?.finalRecommendation ?? null;
}

function compareWinner(a: number, b: number): "A" | "B" | "TIE" {
  if (Math.abs(a - b) < 0.5) return "TIE";
  return a > b ? "A" : "B";
}

export function compareBusinessSimulations(
  simulationIdA: string,
  simulationIdB: string,
): BusinessSimulationComparison {
  const simulationA = getBusinessSimulationRepository().getSimulation(simulationIdA);
  const simulationB = getBusinessSimulationRepository().getSimulation(simulationIdB);

  if (!simulationA) throw new BusinessSimulationNotFoundError(simulationIdA);
  if (!simulationB) throw new BusinessSimulationNotFoundError(simulationIdB);

  const capitalFitA = simulationA.capitalProtection.capitalBlocked ? 0 : 100;
  const capitalFitB = simulationB.capitalProtection.capitalBlocked ? 0 : 100;

  const highlights = {
    higherScore: compareWinner(simulationA.simulationScore, simulationB.simulationScore),
    higherProfit: compareWinner(
      simulationA.financialForecast.projectedNetProfit,
      simulationB.financialForecast.projectedNetProfit,
    ),
    lowerRisk: compareWinner(simulationB.riskAnalysis.overallRisk, simulationA.riskAnalysis.overallRisk),
    strongerRecommendation: compareWinner(
      RECOMMENDATION_RANK[simulationA.finalRecommendation.recommendation],
      RECOMMENDATION_RANK[simulationB.finalRecommendation.recommendation],
    ),
    betterCapitalFit: compareWinner(capitalFitA, capitalFitB),
  };

  const winsA = Object.values(highlights).filter((value) => value === "A").length;
  const winsB = Object.values(highlights).filter((value) => value === "B").length;
  const summary =
    winsA > winsB
      ? `${simulationA.businessName} leads ${winsA} of 5 simulation dimensions.`
      : winsB > winsA
        ? `${simulationB.businessName} leads ${winsB} of 5 simulation dimensions.`
        : "Both simulations are evenly matched.";

  return { simulationA, simulationB, highlights, summary };
}

export function buildBusinessSimulationSummary(
  workspaceId: string,
  companyId: string,
): BusinessSimulationSummary {
  const simulations = getBusinessSimulationRepository().listSimulations(workspaceId, companyId);
  const readyForLaunch = simulations.filter(
    (entry) => entry.finalRecommendation.recommendation === "READY_FOR_LAUNCH",
  ).length;
  const highPriorityLaunch = simulations.filter(
    (entry) => entry.finalRecommendation.recommendation === "HIGH_PRIORITY_LAUNCH",
  ).length;
  const doNotLaunch = simulations.filter(
    (entry) => entry.finalRecommendation.recommendation === "DO_NOT_LAUNCH",
  ).length;
  const averageSimulationScore =
    simulations.length === 0
      ? 0
      : Math.round(simulations.reduce((sum, entry) => sum + entry.simulationScore, 0) / simulations.length);

  const topSimulation = [...simulations].sort((a, b) => {
    const rankDiff =
      RECOMMENDATION_RANK[b.finalRecommendation.recommendation] -
      RECOMMENDATION_RANK[a.finalRecommendation.recommendation];
    if (rankDiff !== 0) return rankDiff;
    return b.simulationScore - a.simulationScore;
  })[0];

  return {
    workspaceId,
    companyId,
    totalSimulations: simulations.length,
    readyForLaunch,
    highPriorityLaunch,
    doNotLaunch,
    averageSimulationScore,
    topSimulation,
    computedAt: new Date().toISOString(),
  };
}

export function buildBusinessSimulationDashboard(
  workspaceId: string,
  companyId: string,
): BusinessSimulationDashboard {
  const summary = buildBusinessSimulationSummary(workspaceId, companyId);
  const latest = summary.topSimulation ?? getBusinessSimulationRepository().listSimulations(workspaceId, companyId)[0];

  if (!latest) {
    return {
      businessSimulationScore: 0,
      projectedProfit: 0,
      projectedCashflow: 0,
      projectedBreakEven: 0,
      simulationConfidence: 0,
      computedAt: new Date().toISOString(),
    };
  }

  const projectedCashflow = latest.financialForecast.cashflowProjection
    .slice(0, 3)
    .reduce((sum, entry) => sum + entry.netCashflow, 0);

  return {
    businessSimulationScore: latest.simulationScore,
    projectedProfit: latest.financialForecast.projectedNetProfit,
    projectedCashflow: Math.round(projectedCashflow * 100) / 100,
    projectedBreakEven: latest.financialForecast.breakEvenPointMonths,
    launchRecommendation: latest.finalRecommendation.recommendation,
    simulationConfidence: latest.simulationConfidence,
    latestSimulationId: latest.simulationId,
    computedAt: new Date().toISOString(),
  };
}
