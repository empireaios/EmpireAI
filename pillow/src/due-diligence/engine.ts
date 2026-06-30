import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import { runContinuousAnalysis } from "./analysis-runner.js";
import { sortRecommendationsByPriority } from "./priority-engine.js";
import { findingsToRecommendations } from "./recommendation-engine.js";
import type {
  DueDiligenceEngineOptions,
  DueDiligenceEngineState,
  DueDiligenceReport,
  GrandKingInterrupt,
} from "./types.js";

export const DUE_DILIGENCE_DOCTRINE_PATH =
  "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md";

/**
 * Continuous Due Diligence Engine (PILLOW-011).
 * Permanent self-initiated analysis — read-only; recommendations require Grand King approval.
 */
export class ContinuousDueDiligenceEngine {
  private initializedAt: string | null = null;
  private history: DueDiligenceReport[] = [];
  private interrupted = false;
  private lastInterrupt: GrandKingInterrupt | null = null;
  private analysing = false;
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
    private memory: RepositoryMemoryEngine,
    private deps: {
      planner?: MissionPlannerEngine;
      supervisor?: CursorSupervisorEngine;
    } = {},
    private options: DueDiligenceEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  setDependencies(deps: {
    planner?: MissionPlannerEngine;
    supervisor?: CursorSupervisorEngine;
  }): void {
    this.deps = { ...this.deps, ...deps };
  }

  async initialize(): Promise<DueDiligenceEngineState> {
    const text = await this.reader.readText(DUE_DILIGENCE_DOCTRINE_PATH);
    if (!text?.includes("Continuous Due Diligence")) {
      throw new Error(
        `${DUE_DILIGENCE_DOCTRINE_PATH} missing — Due Diligence Engine requires BL-C constitution.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): DueDiligenceEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Continuous Due Diligence Engine not initialized. Call initialize() first.",
      );
    }
    return {
      engineVersion: "PILLOW-011",
      status: this.interrupted ? "interrupted" : this.analysing ? "analysing" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: DUE_DILIGENCE_DOCTRINE_PATH,
      totalCycles: this.history.length,
      lastReport: this.history.at(-1) ?? null,
      interrupted: this.interrupted,
      lastInterruptAt: this.lastInterrupt?.at ?? null,
    };
  }

  /** Grand King command — immediately interrupts idle/continuous analysis. */
  interrupt(command: string): GrandKingInterrupt {
    this.interrupted = true;
    this.analysing = false;
    this.lastInterrupt = { command, at: new Date().toISOString() };
    return this.lastInterrupt;
  }

  resumeAfterInterrupt(): void {
    this.interrupted = false;
  }

  /** Run one full analysis cycle (read-only). */
  async runAnalysisCycle(): Promise<DueDiligenceReport> {
    if (this.interrupted) {
      return this.buildInterruptedReport();
    }

    const started = performance.now();
    const startedAt = new Date().toISOString();
    this.analysing = true;

    this.memory.ensureFresh();
    const mem = this.memory.getMemory();

    if (this.interrupted) {
      this.analysing = false;
      return this.buildInterruptedReport();
    }

    const { findings, domainsAnalysed, categoriesReviewed } = runContinuousAnalysis({
      bootstrap: this.bootstrap,
      intelligence: this.intelligence,
      memory: mem,
      planner: this.deps.planner,
      supervisor: this.deps.supervisor,
    });

    const intel = mem.domains.repositoryHealth.value;
    const recommendations = sortRecommendationsByPriority(
      findingsToRecommendations(
        findings,
        {
          healthScore: intel.score,
          syncRequired: !mem.consistency.synchronized,
        },
        this.options.maxRecommendations ?? 25,
      ),
    );

    this.analysing = false;

    const report: DueDiligenceReport = {
      reportId: randomUUID(),
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      interrupted: false,
      findings,
      recommendations,
      domainsAnalysed,
      categoriesReviewed,
    };

    this.history.push(report);
    return report;
  }

  /** Idle tick — run analysis when not interrupted (Pillow never passive). */
  async tick(): Promise<DueDiligenceReport | null> {
    if (this.interrupted) return null;
    return this.runAnalysisCycle();
  }

  getRecommendations(limit = 25): DueDiligenceReport["recommendations"] {
    const last = this.history.at(-1);
    if (!last) return [];
    return last.recommendations.slice(0, limit);
  }

  getHistory(): DueDiligenceReport[] {
    return [...this.history];
  }

  getLastReport(): DueDiligenceReport | null {
    return this.history.at(-1) ?? null;
  }

  private buildInterruptedReport(): DueDiligenceReport {
    const at = new Date().toISOString();
    return {
      reportId: randomUUID(),
      startedAt: at,
      completedAt: at,
      durationMs: 0,
      interrupted: true,
      findings: [],
      recommendations: [],
      domainsAnalysed: [],
      categoriesReviewed: [],
    };
  }
}

export function createContinuousDueDiligenceEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryEngine,
  deps?: {
    planner?: MissionPlannerEngine;
    supervisor?: CursorSupervisorEngine;
  },
  options?: DueDiligenceEngineOptions,
): ContinuousDueDiligenceEngine {
  return new ContinuousDueDiligenceEngine(
    bootstrap,
    intelligence,
    memory,
    deps,
    options,
  );
}
