import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSkillToolRouterConfiguration,
  type SkillToolRouterConfiguration,
} from "./configuration.js";
import { SkillToolRouterController } from "./skill-tool-router-controller.js";
import { SkillToolRouterCore } from "./skill-tool-router-core.js";
import { resetStrLogsForTesting } from "./str-logging.js";
import { resetRoutingSequenceForTesting } from "./suitability-evaluator.js";
import { SKILL_TOOL_ROUTER_SYSTEM_PATH } from "./paths.js";
import type {
  SkillToolRouterCockpitSnapshot,
  SkillToolRouterInput,
  SkillToolRouterState,
} from "./types.js";

export interface SkillToolRouterOptions {
  configuration?: Partial<SkillToolRouterConfiguration>;
}

/** Authoritative Q0-12 Skill & Tool Router — intelligent routing only. */
export class SkillToolRouter {
  private initializedAt: string | null = null;
  private readonly controller: SkillToolRouterController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SkillToolRouterOptions = {},
  ) {
    this.controller = new SkillToolRouterController(
      new SkillToolRouterCore(),
      buildSkillToolRouterConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SKILL_TOOL_ROUTER_SYSTEM_PATH,
    );
    if (!doc?.includes("Skill & Tool Router")) {
      throw new Error(`${SKILL_TOOL_ROUTER_SYSTEM_PATH} missing — Q0-12 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): SkillToolRouterState {
    if (!this.initializedAt) {
      throw new Error("Skill & Tool Router not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-STR-001",
      missionId: "Q0-12",
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
        totalRoutingRecords: this.getRecords().length,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Routing only: does not execute work, perform orchestration, replace workers, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectSkillToolRouter(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  routeRequest(input: SkillToolRouterInput) {
    return this.controller.route(input);
  }

  analyseCapabilities(input: SkillToolRouterInput) {
    return this.controller.analyseCapabilities(input);
  }

  queryRegistry(input: SkillToolRouterInput) {
    return this.controller.queryRegistry(input);
  }

  matchWorkers(input: SkillToolRouterInput) {
    return this.controller.matchWorkers(input);
  }

  matchTools(input: SkillToolRouterInput) {
    return this.controller.matchTools(input);
  }

  recommendRoute(input: SkillToolRouterInput) {
    return this.controller.recommend(input);
  }

  listRoutes() {
    return this.controller.listRoutes();
  }

  validateRouting(input: SkillToolRouterInput = { executiveRequest: "" }) {
    return this.controller.validateRouting(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
  }

  getWorkers() {
    return this.controller.getManager().getWorkers();
  }

  getTools() {
    return this.controller.getManager().getTools();
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
      notes: [
        `Engine status: ${state.status}`,
        `Routing records: ${state.health.totalRoutingRecords}`,
        `Last confidence: ${state.health.lastConfidenceScore ?? "n/a"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SkillToolRouterCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-12",
      status: state.status,
      healthStatus: state.health.status,
      totalRoutingRecords: state.health.totalRoutingRecords,
      latestRoutingId: this.getLatestRecord()?.routingId ?? null,
      lastConfidenceScore: state.health.lastConfidenceScore,
      neverExecuteWork: true,
      neverPerformOrchestration: true,
      neverReplaceWorkers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createSkillToolRouter(
  bootstrap: EmpireBootstrapContext,
  options?: SkillToolRouterOptions,
) {
  return new SkillToolRouter(bootstrap, options);
}

export function resetSkillToolRouterForTesting() {
  resetStrLogsForTesting();
  resetRoutingSequenceForTesting();
}
