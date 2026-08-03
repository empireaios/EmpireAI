import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCivilizationKnowledgeEngineConfiguration,
  type CivilizationKnowledgeEngineConfiguration,
} from "./configuration.js";
import { CivilizationKnowledgeController } from "./civilization-knowledge-controller.js";
import {
  CivilizationKnowledgeManager,
  type CivilizationKnowledgeDependencies,
} from "./civilization-knowledge-manager.js";
import { CIVILIZATION_KNOWLEDGE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CivilizationKnowledgeCockpitSnapshot,
  CivilizationKnowledgeInput,
  CivilizationKnowledgeState,
} from "./types.js";

export type { CivilizationKnowledgeDependencies };
export interface CivilizationKnowledgeEngineOptions {
  configuration?: Partial<CivilizationKnowledgeEngineConfiguration>;
}

export class CivilizationKnowledgeEngine {
  private initializedAt: string | null = null;
  private readonly controller: CivilizationKnowledgeController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: CivilizationKnowledgeDependencies = {},
    options: CivilizationKnowledgeEngineOptions = {},
  ) {
    this.controller = new CivilizationKnowledgeController(
      new CivilizationKnowledgeManager(dependencies),
      buildCivilizationKnowledgeEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(CIVILIZATION_KNOWLEDGE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Civilization Knowledge Engine")) {
      throw new Error(`${CIVILIZATION_KNOWLEDGE_ENGINE_SYSTEM_PATH} missing — X5-16 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CivilizationKnowledgeState {
    if (!this.initializedAt) throw new Error("Civilization Knowledge Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getKnowledgeRecords().length;
    return {
      engineVersion: "PILLOW-CKE-001",
      missionId: "X5-16",
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
        totalKnowledgeRecords: count,
        notes: [
          "Structural civilization knowledge signals only; unvalidated external knowledge never integrates into enterprise decision-making automatically.",
        ],
      },
    };
  }

  connectCivilizationKnowledgeEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  monitorIndustries(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("monitor_industries", input);
  }

  monitorTechnologies(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("monitor_technologies", input);
  }

  monitorScientificDevelopments(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("monitor_scientific_developments", input);
  }

  monitorEconomicDevelopments(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("monitor_economic_developments", input);
  }

  monitorRegulatoryDevelopments(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("monitor_regulatory_developments", input);
  }

  monitorBusinessInnovations(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("monitor_business_innovations", input);
  }

  identifyEmergingStrategicKnowledge(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("identify_emerging_strategic_knowledge", { ...input, emergingHint: input.emergingHint ?? true });
  }

  rankStrategicRelevance(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("rank_strategic_relevance", input);
  }

  generateStrategicKnowledgeRecommendations(input: CivilizationKnowledgeInput = {}) {
    return this.controller.run("generate_strategic_knowledge_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getKnowledgeRecords() {
    return this.controller.getManager().getKnowledgeRecords();
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
      notes: [`Engine status: ${state.status}`, `Knowledge records: ${state.health.totalKnowledgeRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): CivilizationKnowledgeCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalKnowledgeRecords: state.health.totalKnowledgeRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.empireKnowledgeEngine)) +
        Number(Boolean(record?.dependencyPresence.grandKingAdvisoryEngine)),
      recentLogs: [],
    };
  }
}

export function createCivilizationKnowledgeEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CivilizationKnowledgeDependencies = {},
  options?: CivilizationKnowledgeEngineOptions,
) {
  return new CivilizationKnowledgeEngine(bootstrap, dependencies, options);
}

export function resetCivilizationKnowledgeEngineForTesting() {}
