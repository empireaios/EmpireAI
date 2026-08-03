import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOpportunityEvaluationWorkerConfiguration,
  type OpportunityEvaluationWorkerConfiguration,
} from "./configuration.js";
import { resetEvaluationSequenceForTesting } from "./evaluation-builder.js";
import { EvaluationManager } from "./evaluation-manager.js";
import type { OpportunityEvaluationWorkerDependencies } from "./integrations.js";
import { resetOewLogsForTesting } from "./oew-logging.js";
import { OpportunityEvaluationWorkerController } from "./opportunity-evaluation-worker-controller.js";
import { OPPORTUNITY_EVALUATION_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  OpportunityEvaluationWorkerCockpitSnapshot,
  OpportunityEvaluationWorkerInput,
  OpportunityEvaluationWorkerState,
} from "./types.js";

export interface OpportunityEvaluationWorkerOptions {
  configuration?: Partial<OpportunityEvaluationWorkerConfiguration>;
  dependencies?: OpportunityEvaluationWorkerDependencies;
}

/** Authoritative Q2-05 Opportunity Evaluation Worker — evaluation only. */
export class OpportunityEvaluationWorker {
  private initializedAt: string | null = null;
  private readonly controller: OpportunityEvaluationWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: OpportunityEvaluationWorkerOptions = {},
  ) {
    const manager = new EvaluationManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new OpportunityEvaluationWorkerController(
      manager,
      buildOpportunityEvaluationWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      OPPORTUNITY_EVALUATION_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Opportunity Evaluation Worker")) {
      throw new Error(
        `${OPPORTUNITY_EVALUATION_WORKER_SYSTEM_PATH} missing — Q2-05 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: OpportunityEvaluationWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): OpportunityEvaluationWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Opportunity Evaluation Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-OEW-001",
      missionId: "Q2-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalEvaluations: engineRecord?.totalEvaluations ?? 0,
        lastEvaluationId: engineRecord?.lastEvaluationId ?? null,
        lastOverallScore: engineRecord?.lastOverallScore ?? null,
        lastRecommendation: engineRecord?.lastRecommendation ?? null,
        notes: [
          "Evaluation-only: does not approve businesses, modify business models, launch businesses, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectOpportunityEvaluationWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessModel(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.receiveBusinessModel(input);
  }

  receiveMarketResearch(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.receiveMarketResearch(input);
  }

  evaluateMarketDemand(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.evaluateDemand(input);
  }

  evaluateFeasibility(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.evaluateFeasibility(input);
  }

  evaluateProfitPotential(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.evaluateProfit(input);
  }

  evaluateExecutionRisk(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.evaluateRisk(input);
  }

  evaluateStrategicFit(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.evaluateStrategicFit(input);
  }

  produceOpportunityEvaluation(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.produceEvaluation(input);
  }

  submitEvaluationReport(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  listOpportunityEvaluations() {
    return this.controller.list();
  }

  validateOpportunityEvaluationWorker(input: OpportunityEvaluationWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getEvaluations() {
    return this.controller.getManager().getEvaluations();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestEvaluationId() {
    return this.controller.getManager().getLatestEvaluationId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
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
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Evaluations: ${state.health.totalEvaluations}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OpportunityEvaluationWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-05",
      status: state.status,
      healthStatus: state.health.status,
      totalEvaluations: state.health.totalEvaluations,
      latestEvaluationId: this.getLatestEvaluationId(),
      lastOverallScore: state.health.lastOverallScore,
      lastRecommendation: state.health.lastRecommendation,
      workerId: state.configuration.workerId,
      neverApproveBusiness: true,
      neverModifyBusinessModel: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createOpportunityEvaluationWorker(
  bootstrap: EmpireBootstrapContext,
  options?: OpportunityEvaluationWorkerOptions,
) {
  return new OpportunityEvaluationWorker(bootstrap, options);
}

export function resetOpportunityEvaluationWorkerForTesting() {
  resetOewLogsForTesting();
  resetEvaluationSequenceForTesting();
}
