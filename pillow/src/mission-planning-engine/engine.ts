import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMissionPlanningEngineConfiguration,
  type MissionPlanningEngineConfiguration,
} from "./configuration.js";
import type { MissionPlanningEngineDependencies } from "./integrations.js";
import {
  MissionPlanningEngineManager,
  resetMissionPlanningEngineManagerSequencesForTesting,
} from "./mission-planning-engine-manager.js";
import { MissionPlanningEngineController } from "./mission-planning-engine-controller.js";
import { resetMpengLogsForTesting } from "./mpeng-logging.js";
import { MISSION_PLANNING_ENGINE_SYSTEM_PATH } from "./paths.js";
import { resetMpengSequenceForTesting } from "./audit-store.js";
import type {
  MissionPlanningEngineCockpitSnapshot,
  MissionPlanningEngineState,
  MpengInput,
} from "./types.js";

export interface MissionPlanningEngineOptions {
  configuration?: Partial<MissionPlanningEngineConfiguration>;
  dependencies?: MissionPlanningEngineDependencies;
}

/**
 * Authoritative Q13-03 Mission Planning Engine — planning only; never executes implementation.
 * Consumes getQ1303ConsumableContract from repositoryIntelligenceEngine (RIENG, Q13-02).
 * Optionally observes ISENG specifications via implementationSpecificationEngine.
 * Exposes Q1304ConsumableContract for Q13-04 without implementing Q13-04 or later.
 */
export class MissionPlanningEngine {
  private initializedAt: string | null = null;
  private readonly manager: MissionPlanningEngineManager;
  private readonly controller: MissionPlanningEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MissionPlanningEngineOptions = {},
  ) {
    this.manager = new MissionPlanningEngineManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new MissionPlanningEngineController(
      this.manager,
      buildMissionPlanningEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MISSION_PLANNING_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Mission Planning Engine")) {
      throw new Error(`${MISSION_PLANNING_ENGINE_SYSTEM_PATH} missing — Q13-03 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MissionPlanningEngineDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): MissionPlanningEngineState {
    if (!this.initializedAt) {
      throw new Error("Mission Planning Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const latestPlan = this.controller.getLatestPlan();
    return {
      engineVersion: "PILLOW-MPENG-001",
      missionId: "Q13-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      latestPlan,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: Math.round((latestReport?.confidenceScore ?? 0) * 100) || 0,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        totalPlans: engineRecord?.totalPlans ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastPlanId: engineRecord?.lastPlanId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Mission Planning Engine: planning only; never modifies repository; never executes implementation.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  analyseApprovedMission(input: MpengInput = {}) {
    return this.controller.analyseApprovedMission(input);
  }

  consumeRepositoryIntelligence() {
    return this.controller.consumeRepositoryIntelligence();
  }

  identifyImplementationDependencies(input: MpengInput = {}) {
    return this.controller.identifyImplementationDependencies(input);
  }

  determineExecutionSequence() {
    return this.controller.determineExecutionSequence();
  }

  identifyIntegrationPoints() {
    return this.controller.identifyIntegrationPoints();
  }

  produceValidationStrategy(input: MpengInput = {}) {
    return this.controller.produceValidationStrategy(input);
  }

  produceAcceptanceCriteria(input: MpengInput = {}) {
    return this.controller.produceAcceptanceCriteria(input);
  }

  estimateImplementationRisks() {
    return this.controller.estimateImplementationRisks();
  }

  generateMissionPlan(input: MpengInput = {}) {
    return this.controller.generateMissionPlan(input);
  }

  produceMissionPlanningReport(input: MpengInput = {}) {
    return this.controller.produceMissionPlanningReport(input);
  }

  async produceReport(input: MpengInput = {}) {
    return this.produceMissionPlanningReport(input);
  }

  submitReport(input: MpengInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getPlans() {
    return this.manager.getPlans();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getPlanningHistory(limit = 100) {
    return this.manager.getPlanningHistory(limit);
  }

  getQ1304ConsumableContract() {
    return this.controller.getQ1304ConsumableContract();
  }

  validate(input: MpengInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getCockpitSnapshot(): MissionPlanningEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q13-03",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalPlans: state.health.totalPlans,
      latestReportId: state.health.lastReportId,
      latestPlanId: state.health.lastPlanId,
      workerId: state.configuration.workerId,
      neverModifyRepository: true,
      neverExecuteImplementation: true,
      neverImplementQ1304OrLater: true,
      neverBypassGovernance: true,
    };
  }

  validateForSupervisorSync() {
    const diagnostics = this.runDiagnostics();
    return {
      missionId: "Q13-03" as const,
      readinessScore: diagnostics.readinessScore,
      q1303PrerequisitePresent: diagnostics.q1303PrerequisitePresent,
      reports: diagnostics.reports,
      plans: diagnostics.plans,
    };
  }
}

export function createMissionPlanningEngine(
  bootstrap: EmpireBootstrapContext,
  options?: MissionPlanningEngineOptions,
) {
  return new MissionPlanningEngine(bootstrap, options);
}

export function resetMissionPlanningEngineForTesting() {
  resetMpengSequenceForTesting();
  resetMpengLogsForTesting();
  resetMissionPlanningEngineManagerSequencesForTesting();
}
