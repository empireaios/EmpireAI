import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEnterpriseSuccessionEngineConfiguration,
  type EnterpriseSuccessionEngineConfiguration,
} from "./configuration.js";
import { EnterpriseSuccessionController } from "./enterprise-succession-controller.js";
import {
  EnterpriseSuccessionManager,
  type EnterpriseSuccessionDependencies,
} from "./enterprise-succession-manager.js";
import { ENTERPRISE_SUCCESSION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  EnterpriseSuccessionCockpitSnapshot,
  EnterpriseSuccessionInput,
  EnterpriseSuccessionState,
} from "./types.js";

export type { EnterpriseSuccessionDependencies };
export interface EnterpriseSuccessionEngineOptions {
  configuration?: Partial<EnterpriseSuccessionEngineConfiguration>;
}

export class EnterpriseSuccessionEngine {
  private initializedAt: string | null = null;
  private readonly controller: EnterpriseSuccessionController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: EnterpriseSuccessionDependencies = {},
    options: EnterpriseSuccessionEngineOptions = {},
  ) {
    this.controller = new EnterpriseSuccessionController(
      new EnterpriseSuccessionManager(dependencies),
      buildEnterpriseSuccessionEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(ENTERPRISE_SUCCESSION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Enterprise Succession Engine")) {
      throw new Error(`${ENTERPRISE_SUCCESSION_ENGINE_SYSTEM_PATH} missing — X5-13 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EnterpriseSuccessionState {
    if (!this.initializedAt) throw new Error("Enterprise Succession Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getSuccessionRecords().length;
    return {
      engineVersion: "PILLOW-ESE-001",
      missionId: "X5-13",
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
        totalSuccessionRecords: count,
        notes: [
          "Structural succession signals only; governance-approved succession plans are never modified automatically.",
        ],
      },
    };
  }

  connectEnterpriseSuccessionEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  manageEnterpriseContinuityPlans(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("manage_enterprise_continuity_plans", input);
  }

  manageExecutiveSuccessionPlans(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("manage_executive_succession_plans", input);
  }

  preserveOrganizationalKnowledge(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("preserve_organizational_knowledge", input);
  }

  preserveGovernanceContinuity(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("preserve_governance_continuity", input);
  }

  preserveOperationalContinuity(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("preserve_operational_continuity", input);
  }

  detectSuccessionRisks(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("detect_succession_risks", input);
  }

  detectContinuityGaps(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("detect_continuity_gaps", input);
  }

  evaluateSuccessionReadiness(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("evaluate_succession_readiness", input);
  }

  generateContinuityRecommendations(input: EnterpriseSuccessionInput = {}) {
    return this.controller.run("generate_continuity_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getSuccessionRecords() {
    return this.controller.getManager().getSuccessionRecords();
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
      notes: [`Engine status: ${state.status}`, `Succession records: ${state.health.totalSuccessionRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): EnterpriseSuccessionCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalSuccessionRecords: state.health.totalSuccessionRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.empireResilienceEngine)) +
        Number(Boolean(record?.dependencyPresence.autonomousInvestmentEngine)),
      recentLogs: [],
    };
  }
}

export function createEnterpriseSuccessionEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: EnterpriseSuccessionDependencies = {},
  options?: EnterpriseSuccessionEngineOptions,
) {
  return new EnterpriseSuccessionEngine(bootstrap, dependencies, options);
}

export function resetEnterpriseSuccessionEngineForTesting() {}
