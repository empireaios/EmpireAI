import { inspectDueDiligence } from "./due-diligence-inspector.js";
import { scanSelfImprovement } from "./self-improvement-scanner.js";
import { discoverOpportunities } from "./opportunity-discovery.js";
import { detectRisks } from "./risk-detector.js";
import { planAutonomousOptimisation } from "./autonomous-optimizer.js";
import { rankExecutiveRecommendations } from "./executive-recommender.js";
import { trackEmpireEvolution } from "./evolution-tracker.js";
import {
  buildContinuousEvolutionReport,
  certifyVersion1,
} from "./executive-reporter.js";
import type {
  ContinuousEvolutionDeps,
  ContinuousEvolutionReport,
  ContinuousEvolutionState,
} from "./types.js";

export const CONTINUOUS_EVOLUTION_CONTRACT_PATH =
  "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md";

/**
 * Continuous Empire Evolution Engine (PILLOW-CEV-001 / Phase 10).
 * Permanent analyse · evaluate · discover · recommend · improve lifecycle.
 */
export class ContinuousEvolutionEngine {
  private initializedAt: string | null = null;
  private totalEvolutionCycles = 0;
  private lastReport: ContinuousEvolutionReport | null = null;

  constructor(private readonly deps: ContinuousEvolutionDeps) {}

  async initialize(): Promise<ContinuousEvolutionState> {
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ContinuousEvolutionState {
    if (!this.initializedAt) {
      throw new Error("Continuous Evolution Engine not initialized. Call initialize() first.");
    }
    return {
      evolutionVersion: "PILLOW-CEV-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalEvolutionCycles: this.totalEvolutionCycles,
      domainsMonitored: [
        "architecture",
        "engineering",
        "commerce",
        "infrastructure",
        "security",
        "operations",
        "governance",
        "documentation",
      ],
      improvementBacklogSize: scanSelfImprovement(this.deps).totalItems,
    };
  }

  /** Full continuous evolution cycle. */
  async evolveEmpire(_query?: string): Promise<ContinuousEvolutionReport> {
    const dueDiligence = inspectDueDiligence(this.deps);
    const selfImprovement = scanSelfImprovement(this.deps);
    const opportunities = discoverOpportunities(this.deps);
    const risks = detectRisks(this.deps);
    const optimisation = planAutonomousOptimisation(this.deps);
    const recommendations = rankExecutiveRecommendations({
      dueDiligence,
      selfImprovement,
      opportunities,
      risks,
      deps: this.deps,
    });
    const evolution = trackEmpireEvolution({
      deps: this.deps,
      dueDiligence,
      opportunities,
      risks,
    });
    const version1Certification = certifyVersion1({
      evolution,
      dueDiligence,
      risks,
      opportunities,
    });

    const report = buildContinuousEvolutionReport({
      dueDiligence,
      selfImprovement,
      opportunities,
      risks,
      optimisation,
      recommendations,
      evolution,
      version1Certification,
    });

    this.totalEvolutionCycles += 1;
    this.lastReport = report;
    return report;
  }

  getLastReport(): ContinuousEvolutionReport | null {
    return this.lastReport;
  }

  getEvolutionCapabilities(): string[] {
    return [
      "Continuous Due Diligence (8 domains)",
      "Continuous Self-Improvement (PILLOW-011/012 integration)",
      "Opportunity Discovery (products, suppliers, markets, AI, revenue)",
      "Risk Detection (6 categories)",
      "Autonomous Optimisation (where approved)",
      "Executive Recommendations (ranked by Empire value)",
      "Empire Evolution tracking (anti-stagnation)",
      "EmpireAI Version 1 Final Certification",
    ];
  }
}

export function createContinuousEvolutionEngine(
  deps: ContinuousEvolutionDeps,
): ContinuousEvolutionEngine {
  return new ContinuousEvolutionEngine(deps);
}
