import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContinuousDueDiligenceEngine } from "../due-diligence/engine.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type {
  GenerateImprovementsRequest,
  ImprovementApproval,
  ImprovementBatch,
  ImprovementEngineOptions,
  ImprovementEngineState,
  ImprovementExecutionResult,
  ImprovementProposal,
} from "./types.js";
import {
  approvalRecommendation,
  canProceedToMissionGeneration,
  createApproval,
  validateApproval,
} from "./approval-gate.js";
import { generateProposalFromObservation } from "./proposal-generator.js";

export const IMPROVEMENT_DOCTRINE_PATH =
  "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md";

/**
 * Autonomous Improvement Engine (PILLOW-012).
 * Converts Due Diligence observations into executable improvement proposals — read-only until Grand King approval.
 */
export class AutonomousImprovementEngine {
  private initializedAt: string | null = null;
  private history: ImprovementBatch[] = [];
  private proposals = new Map<string, ImprovementProposal>();
  private approvals = new Map<string, ImprovementApproval>();
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
    private memory: RepositoryMemoryEngine,
    private dueDiligence: ContinuousDueDiligenceEngine,
    private deps: { planner?: MissionPlannerEngine } = {},
    private options: ImprovementEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  setDependencies(deps: { planner?: MissionPlannerEngine }): void {
    this.deps = { ...this.deps, ...deps };
  }

  async initialize(): Promise<ImprovementEngineState> {
    const text = await this.reader.readText(IMPROVEMENT_DOCTRINE_PATH);
    if (!text?.includes("Continuous Due Diligence")) {
      throw new Error(
        `${IMPROVEMENT_DOCTRINE_PATH} missing — Improvement Engine requires BL-C constitution.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ImprovementEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Autonomous Improvement Engine not initialized. Call initialize() first.",
      );
    }
    return {
      engineVersion: "PILLOW-012",
      status: "ready",
      initializedAt: this.initializedAt,
      doctrinePath: IMPROVEMENT_DOCTRINE_PATH,
      totalBatches: this.history.length,
      totalProposals: this.proposals.size,
      lastBatch: this.history.at(-1) ?? null,
    };
  }

  /** Full improvement lifecycle: observations → evidence → proposals (read-only). */
  async generateImprovements(
    request: GenerateImprovementsRequest = {},
  ): Promise<ImprovementExecutionResult> {
    const started = performance.now();
    const startedAt = new Date().toISOString();

    let observations = request.observations ?? [];
    if (request.runDueDiligence || observations.length === 0) {
      const report = await this.dueDiligence.runAnalysisCycle();
      observations = report.recommendations;
    }

    this.memory.ensureFresh();
    const mem = this.memory.getMemory();
    const max = this.options.maxProposals ?? 20;

    const proposals: ImprovementProposal[] = [];
    for (const obs of observations.slice(0, max)) {
      const proposal = generateProposalFromObservation(obs, {
        bootstrap: this.bootstrap,
        intelligence: this.intelligence,
        memory: mem,
        planner: this.deps.planner,
      });
      proposals.push(proposal);
      this.proposals.set(proposal.proposalId, proposal);
    }

    const batch: ImprovementBatch = {
      batchId: randomUUID(),
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      proposals,
      observationCount: observations.length,
    };

    this.history.push(batch);

    return {
      batch,
      recommendation:
        proposals.length > 0
          ? `${proposals.length} improvement proposal(s) generated — Grand King approval required before execution`
          : "No observations available — run Due Diligence cycle first",
    };
  }

  getProposal(proposalId: string): ImprovementProposal | undefined {
    return this.proposals.get(proposalId);
  }

  getProposals(): ImprovementProposal[] {
    return [...this.proposals.values()];
  }

  submitApproval(
    proposalId: string,
    outcome: ImprovementApproval["outcome"],
    notes?: string,
  ): { approval: ImprovementApproval; recommendation: string } {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const approval = createApproval(proposalId, outcome, notes);
    const validation = validateApproval(proposal, approval);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    this.approvals.set(proposalId, approval);
    return {
      approval,
      recommendation: approvalRecommendation(outcome, proposal),
    };
  }

  isReadyForMissionGeneration(proposalId: string): boolean {
    const proposal = this.proposals.get(proposalId);
    const approval = this.approvals.get(proposalId);
    if (!proposal || !approval) return false;
    return canProceedToMissionGeneration(approval, proposal);
  }

  getHistory(): ImprovementBatch[] {
    return [...this.history];
  }

  getLastBatch(): ImprovementBatch | null {
    return this.history.at(-1) ?? null;
  }
}

export function createAutonomousImprovementEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  memory: RepositoryMemoryEngine,
  dueDiligence: ContinuousDueDiligenceEngine,
  deps?: { planner?: MissionPlannerEngine },
  options?: ImprovementEngineOptions,
): AutonomousImprovementEngine {
  return new AutonomousImprovementEngine(
    bootstrap,
    intelligence,
    memory,
    dueDiligence,
    deps,
    options,
  );
}
