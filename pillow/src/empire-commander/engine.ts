import { synthesizeCrossDomain } from "./cross-domain-reasoner.js";
import { evaluateExecutiveDecision } from "./decision-engine.js";
import { coordinateEngines } from "./engine-coordinator.js";
import { buildStrategicPlan } from "./strategic-planner.js";
import { buildBusinessOptimization } from "./business-optimizer.js";
import { buildEmpireCommanderReport } from "./executive-reporter.js";
import type {
  EmpireCommanderDeps,
  EmpireCommanderReport,
  EmpireCommanderState,
} from "./types.js";

export const EMPIRE_COMMANDER_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

/**
 * Empire Commander (PILLOW-EC-001 / Phase 8).
 * Unified executive intelligence coordinating engineering, infrastructure, commerce, UX, and operations.
 */
export class EmpireCommanderEngine {
  private initializedAt: string | null = null;
  private totalCommands = 0;
  private lastReport: EmpireCommanderReport | null = null;

  constructor(private readonly deps: EmpireCommanderDeps) {}

  async initialize(): Promise<EmpireCommanderState> {
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpireCommanderState {
    if (!this.initializedAt) {
      throw new Error("Empire Commander not initialized. Call initialize() first.");
    }
    return {
      commanderVersion: "PILLOW-EC-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalCommands: this.totalCommands,
      domainsMonitored: [
        "engineering",
        "infrastructure",
        "commerce",
        "ux",
        "business",
        "operations",
        "financial",
        "customer",
      ],
      enginesCoordinated: 10,
    };
  }

  /** Full executive command cycle — cross-domain reasoning, decision, coordination, planning. */
  async commandEmpire(query?: string): Promise<EmpireCommanderReport> {
    const crossDomain = synthesizeCrossDomain(this.deps);
    const decisionEvaluation = query?.trim()
      ? evaluateExecutiveDecision(query)
      : null;
    const coordination = coordinateEngines(this.deps);
    const strategicPlan = buildStrategicPlan(this.deps, crossDomain);
    const optimization = buildBusinessOptimization(crossDomain);

    const commerceReport = this.deps.commerceIntelligence.analyzeCommerce(query);
    const engSignal = crossDomain.domainSignals.find((s) => s.domain === "engineering")!;
    const infraSignal = crossDomain.domainSignals.find((s) => s.domain === "infrastructure")!;

    const report = buildEmpireCommanderReport({
      crossDomain,
      decisionEvaluation,
      coordination,
      strategicPlan,
      optimization,
      engineeringSummary: engSignal.summary,
      infrastructureSummary: infraSignal.summary,
      commerceSummary: commerceReport.recommendedProducts.length
        ? `${commerceReport.recommendedProducts.length} winning products · top: ${commerceReport.recommendedProducts[0]!.product.name}`
        : "No products above quality threshold",
      businessSummary: crossDomain.domainSignals.find((s) => s.domain === "business")!.summary,
    });

    this.totalCommands += 1;
    this.lastReport = report;
    return report;
  }

  getLastReport(): EmpireCommanderReport | null {
    return this.lastReport;
  }

  getCoordinatedDomains(): string[] {
    return [
      "Technical Chief (Phase 3)",
      "AI UX Designer (Phase 4)",
      "Autonomous Cursor Bridge (Phase 5)",
      "Infrastructure Commander (Phase 6)",
      "Commerce Intelligence (Phase 7)",
      "Repository Intelligence (Phase 2)",
      "Mission Planner · Due Diligence · Improvement",
      "EmpireAI Orchestrator (PILLOW-013)",
      "Objective Engine (PILLOW-019)",
    ];
  }
}

export function createEmpireCommanderEngine(
  deps: EmpireCommanderDeps,
): EmpireCommanderEngine {
  return new EmpireCommanderEngine(deps);
}
