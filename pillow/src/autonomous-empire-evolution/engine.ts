import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAutonomousEmpireEvolutionConfiguration,
  type AutonomousEmpireEvolutionConfiguration,
} from "./configuration.js";
import { AutonomousEmpireEvolutionController } from "./autonomous-empire-evolution-controller.js";
import {
  AutonomousEmpireEvolutionManager,
  type AutonomousEmpireEvolutionDependencies,
} from "./autonomous-empire-evolution-manager.js";
import { AUTONOMOUS_EMPIRE_EVOLUTION_SYSTEM_PATH } from "./paths.js";
import type {
  AutonomousEmpireEvolutionCockpitSnapshot,
  AutonomousEmpireEvolutionInput,
  AutonomousEmpireEvolutionState,
} from "./types.js";

export type { AutonomousEmpireEvolutionDependencies };
export interface AutonomousEmpireEvolutionOptions {
  configuration?: Partial<AutonomousEmpireEvolutionConfiguration>;
}

export class AutonomousEmpireEvolution {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousEmpireEvolutionController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: AutonomousEmpireEvolutionDependencies = {},
    options: AutonomousEmpireEvolutionOptions = {},
  ) {
    this.controller = new AutonomousEmpireEvolutionController(
      new AutonomousEmpireEvolutionManager(dependencies),
      buildAutonomousEmpireEvolutionConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(AUTONOMOUS_EMPIRE_EVOLUTION_SYSTEM_PATH);
    if (!doc?.includes("Autonomous Empire Evolution")) {
      throw new Error(`${AUTONOMOUS_EMPIRE_EVOLUTION_SYSTEM_PATH} missing — X5-17 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): AutonomousEmpireEvolutionState {
    if (!this.initializedAt) throw new Error("Autonomous Empire Evolution not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getEvolutionRecords().length;
    return {
      engineVersion: "PILLOW-AEE-001",
      missionId: "X5-17",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalEvolutionRecords: count,
        notes: [
          "Structural evolution signals only; governance-approved enterprise architecture is never modified automatically and constitutional governance is never bypassed.",
        ],
      },
    };
  }

  connectAutonomousEmpireEvolution(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  evaluateEnterpriseStructures(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("evaluate_enterprise_structures", input);
  }

  evaluateEnterpriseWorkflows(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("evaluate_enterprise_workflows", input);
  }

  evaluateBusinessModels(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("evaluate_business_models", input);
  }

  detectStructuralImprovementOpportunities(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("detect_structural_improvement_opportunities", input);
  }

  detectWorkflowImprovementOpportunities(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("detect_workflow_improvement_opportunities", input);
  }

  detectBusinessModelEvolutionOpportunities(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("detect_business_model_evolution_opportunities", input);
  }

  simulateProposedEvolutions(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("simulate_proposed_evolutions", input);
  }

  rankEvolutionPriorities(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("rank_evolution_priorities", input);
  }

  generateEvolutionRecommendations(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("generate_evolution_recommendations", input);
  }

  trackEvolutionOutcomes(input: AutonomousEmpireEvolutionInput = {}) {
    return this.controller.run("track_evolution_outcomes", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getEvolutionRecords() {
    return this.controller.getManager().getEvolutionRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [`Engine status: ${state.status}`, `Evolution records: ${state.health.totalEvolutionRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): AutonomousEmpireEvolutionCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalEvolutionRecords: state.health.totalEvolutionRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.empireSelfImprovementEngine)) +
        Number(Boolean(record?.dependencyPresence.civilizationKnowledgeEngine)),
      recentLogs: [],
    };
  }
}

export function createAutonomousEmpireEvolution(
  bootstrap: EmpireBootstrapContext,
  dependencies: AutonomousEmpireEvolutionDependencies = {},
  options?: AutonomousEmpireEvolutionOptions,
) {
  return new AutonomousEmpireEvolution(bootstrap, dependencies, options);
}

export function resetAutonomousEmpireEvolutionForTesting() {}
