import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCrossEmpireGovernanceEngineConfiguration,
  type CrossEmpireGovernanceEngineConfiguration,
} from "./configuration.js";
import { CrossEmpireGovernanceController } from "./cross-empire-governance-controller.js";
import {
  CrossEmpireGovernanceManager,
  type CrossEmpireGovernanceDependencies,
} from "./cross-empire-governance-manager.js";
import { CROSS_EMPIRE_GOVERNANCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CrossEmpireGovernanceCockpitSnapshot,
  CrossEmpireGovernanceInput,
  CrossEmpireGovernanceState,
} from "./types.js";

export type { CrossEmpireGovernanceDependencies };
export interface CrossEmpireGovernanceEngineOptions {
  configuration?: Partial<CrossEmpireGovernanceEngineConfiguration>;
}

export class CrossEmpireGovernanceEngine {
  private initializedAt: string | null = null;
  private readonly controller: CrossEmpireGovernanceController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: CrossEmpireGovernanceDependencies = {},
    options: CrossEmpireGovernanceEngineOptions = {},
  ) {
    this.controller = new CrossEmpireGovernanceController(
      new CrossEmpireGovernanceManager(dependencies),
      buildCrossEmpireGovernanceEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(CROSS_EMPIRE_GOVERNANCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Cross-Empire Governance Engine")) {
      throw new Error(`${CROSS_EMPIRE_GOVERNANCE_ENGINE_SYSTEM_PATH} missing — X5-11 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CrossEmpireGovernanceState {
    if (!this.initializedAt) throw new Error("Cross-Empire Governance Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getGovernanceRecords().length;
    return {
      engineVersion: "PILLOW-CEG-001",
      missionId: "X5-11",
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
        totalGovernanceRecords: count,
        notes: [
          "Structural governance signals only; constitutional governance is never bypassed and non-compliant operations are never approved automatically.",
        ],
      },
    };
  }

  connectCrossEmpireGovernanceEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  manageEnterpriseGovernancePolicies(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("manage_enterprise_governance_policies", input);
  }

  manageConstitutionalRules(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("manage_constitutional_rules", input);
  }

  validateGovernanceCompliance(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("validate_governance_compliance", input);
  }

  monitorGovernanceConsistency(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("monitor_governance_consistency", input);
  }

  detectGovernanceViolations(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("detect_governance_violations", input);
  }

  detectPolicyConflicts(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("detect_policy_conflicts", input);
  }

  evaluateGovernanceRisks(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("evaluate_governance_risks", input);
  }

  generateGovernanceRecommendations(input: CrossEmpireGovernanceInput = {}) {
    return this.controller.run("generate_governance_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getGovernanceRecords() {
    return this.controller.getManager().getGovernanceRecords();
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
      notes: [`Engine status: ${state.status}`, `Governance records: ${state.health.totalGovernanceRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): CrossEmpireGovernanceCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalGovernanceRecords: state.health.totalGovernanceRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.executiveEmpireDashboard)) +
        Number(Boolean(record?.dependencyPresence.empireSelfImprovementEngine)),
      recentLogs: [],
    };
  }
}

export function createCrossEmpireGovernanceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CrossEmpireGovernanceDependencies = {},
  options?: CrossEmpireGovernanceEngineOptions,
) {
  return new CrossEmpireGovernanceEngine(bootstrap, dependencies, options);
}

export function resetCrossEmpireGovernanceEngineForTesting() {}
