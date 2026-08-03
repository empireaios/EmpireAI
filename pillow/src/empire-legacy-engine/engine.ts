import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEmpireLegacyEngineConfiguration,
  type EmpireLegacyEngineConfiguration,
} from "./configuration.js";
import { EmpireLegacyController } from "./empire-legacy-controller.js";
import {
  EmpireLegacyManager,
  type EmpireLegacyDependencies,
} from "./empire-legacy-manager.js";
import { EMPIRE_LEGACY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  EmpireLegacyCockpitSnapshot,
  EmpireLegacyInput,
  EmpireLegacyState,
} from "./types.js";

export type { EmpireLegacyDependencies };
export interface EmpireLegacyEngineOptions {
  configuration?: Partial<EmpireLegacyEngineConfiguration>;
}

export class EmpireLegacyEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmpireLegacyController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: EmpireLegacyDependencies = {},
    options: EmpireLegacyEngineOptions = {},
  ) {
    this.controller = new EmpireLegacyController(
      new EmpireLegacyManager(dependencies),
      buildEmpireLegacyEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_LEGACY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Empire Legacy Engine")) {
      throw new Error(`${EMPIRE_LEGACY_ENGINE_SYSTEM_PATH} missing — X5-14 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpireLegacyState {
    if (!this.initializedAt) throw new Error("Empire Legacy Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getLegacyRecords().length;
    return {
      engineVersion: "PILLOW-ELE-001",
      missionId: "X5-14",
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
        totalLegacyRecords: count,
        notes: [
          "Structural legacy signals only; validated historical records are never modified without authorization.",
        ],
      },
    };
  }

  connectEmpireLegacyEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  preserveStrategicDecisions(input: EmpireLegacyInput = {}) {
    return this.controller.run("preserve_strategic_decisions", input);
  }

  preserveOperationalDecisions(input: EmpireLegacyInput = {}) {
    return this.controller.run("preserve_operational_decisions", input);
  }

  preserveGovernanceHistory(input: EmpireLegacyInput = {}) {
    return this.controller.run("preserve_governance_history", input);
  }

  preserveEnterpriseMilestones(input: EmpireLegacyInput = {}) {
    return this.controller.run("preserve_enterprise_milestones", input);
  }

  preserveAchievements(input: EmpireLegacyInput = {}) {
    return this.controller.run("preserve_achievements", input);
  }

  preserveLessonsLearned(input: EmpireLegacyInput = {}) {
    return this.controller.run("preserve_lessons_learned", input);
  }

  maintainChronologicalEnterpriseHistory(input: EmpireLegacyInput = {}) {
    return this.controller.run("maintain_chronological_enterprise_history", input);
  }

  detectMissingHistoricalRecords(input: EmpireLegacyInput = {}) {
    return this.controller.run("detect_missing_historical_records", input);
  }

  generateHistoricalIntelligenceRecommendations(input: EmpireLegacyInput = {}) {
    return this.controller.run("generate_historical_intelligence_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getLegacyRecords() {
    return this.controller.getManager().getLegacyRecords();
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
      notes: [`Engine status: ${state.status}`, `Legacy records: ${state.health.totalLegacyRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): EmpireLegacyCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalLegacyRecords: state.health.totalLegacyRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.empireMemoryEngine)) +
        Number(Boolean(record?.dependencyPresence.enterpriseSuccessionEngine)),
      recentLogs: [],
    };
  }
}

export function createEmpireLegacyEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: EmpireLegacyDependencies = {},
  options?: EmpireLegacyEngineOptions,
) {
  return new EmpireLegacyEngine(bootstrap, dependencies, options);
}

export function resetEmpireLegacyEngineForTesting() {}
