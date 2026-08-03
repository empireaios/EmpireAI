import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildInfiniteGrowthEngineConfiguration,
  type InfiniteGrowthEngineConfiguration,
} from "./configuration.js";
import { InfiniteGrowthController } from "./infinite-growth-controller.js";
import {
  InfiniteGrowthManager,
  type InfiniteGrowthDependencies,
} from "./infinite-growth-manager.js";
import { INFINITE_GROWTH_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  InfiniteGrowthCockpitSnapshot,
  InfiniteGrowthInput,
  InfiniteGrowthState,
} from "./types.js";

export type { InfiniteGrowthDependencies };
export interface InfiniteGrowthEngineOptions {
  configuration?: Partial<InfiniteGrowthEngineConfiguration>;
}

export class InfiniteGrowthEngine {
  private initializedAt: string | null = null;
  private readonly controller: InfiniteGrowthController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: InfiniteGrowthDependencies = {},
    options: InfiniteGrowthEngineOptions = {},
  ) {
    this.controller = new InfiniteGrowthController(
      new InfiniteGrowthManager(dependencies),
      buildInfiniteGrowthEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(INFINITE_GROWTH_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Infinite Growth Engine")) {
      throw new Error(`${INFINITE_GROWTH_ENGINE_SYSTEM_PATH} missing — X5-19 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): InfiniteGrowthState {
    if (!this.initializedAt) throw new Error("Infinite Growth Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getGrowthRecords().length;
    return {
      engineVersion: "PILLOW-IGE-001",
      missionId: "X5-19",
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
        totalGrowthRecords: count,
        notes: [
          "Structural growth signals only; constitutional governance and operational quality are never sacrificed for growth.",
        ],
      },
    };
  }

  connectInfiniteGrowthEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  monitorLongTermEnterpriseGrowth(input: InfiniteGrowthInput = {}) {
    return this.controller.run("monitor_long_term_enterprise_growth", input);
  }

  evaluateEnterpriseScalability(input: InfiniteGrowthInput = {}) {
    return this.controller.run("evaluate_enterprise_scalability", input);
  }

  evaluateGovernanceSustainability(input: InfiniteGrowthInput = {}) {
    return this.controller.run("evaluate_governance_sustainability", input);
  }

  evaluateOperationalSustainability(input: InfiniteGrowthInput = {}) {
    return this.controller.run("evaluate_operational_sustainability", input);
  }

  detectLongTermGrowthConstraints(input: InfiniteGrowthInput = {}) {
    return this.controller.run("detect_long_term_growth_constraints", { ...input, constraintHint: input.constraintHint ?? true });
  }

  detectLongTermGovernanceRisks(input: InfiniteGrowthInput = {}) {
    return this.controller.run("detect_long_term_governance_risks", { ...input, governanceRiskHint: input.governanceRiskHint ?? true });
  }

  detectLongTermOperationalRisks(input: InfiniteGrowthInput = {}) {
    return this.controller.run("detect_long_term_operational_risks", { ...input, operationalRiskHint: input.operationalRiskHint ?? true });
  }

  rankSustainableGrowthOpportunities(input: InfiniteGrowthInput = {}) {
    return this.controller.run("rank_sustainable_growth_opportunities", input);
  }

  generateLongTermGrowthRecommendations(input: InfiniteGrowthInput = {}) {
    return this.controller.run("generate_long_term_growth_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getGrowthRecords() {
    return this.controller.getManager().getGrowthRecords();
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
      notes: [`Engine status: ${state.status}`, `Growth records: ${state.health.totalGrowthRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): InfiniteGrowthCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalGrowthRecords: state.health.totalGrowthRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.empirePerformanceGuardian)) +
        Number(Boolean(record?.dependencyPresence.autonomousEmpireEvolution)),
      recentLogs: [],
    };
  }
}

export function createInfiniteGrowthEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: InfiniteGrowthDependencies = {},
  options?: InfiniteGrowthEngineOptions,
) {
  return new InfiniteGrowthEngine(bootstrap, dependencies, options);
}

export function resetInfiniteGrowthEngineForTesting() {}
