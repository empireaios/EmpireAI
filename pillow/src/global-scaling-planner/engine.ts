/** X3-14 — Global Scaling Planner Engine. */



import type { EmpireBootstrapContext } from "../bootstrap/types.js";

import { RepositoryReader } from "../bootstrap/repository-reader.js";

import {

  buildGlobalScalingPlannerConfiguration,

  type GlobalScalingPlannerConfiguration,

} from "./configuration.js";

import { appendGspLog, getGspLogs, resetGspLogsForTesting } from "./gsp-logging.js";

import { GLOBAL_SCALING_PLANNER_SYSTEM_PATH } from "./paths.js";

import type {

  GlobalScalingInput,

  GlobalScalingPlannerState,

  GspCockpitSnapshot,

  GspRunReport,

  ConnectGlobalScalingPlannerInput,

  RunGspDiagnosticsInput,

} from "./types.js";

import { GlobalScalingPlannerController } from "./global-scaling-planner-controller.js";

import {

  GlobalScalingPlannerManager,

  type GlobalScalingPlannerDependencies,

} from "./global-scaling-planner-manager.js";

import { HealthMonitor } from "./health-monitor.js";

import { RecoveryManager } from "./recovery-manager.js";



export interface GlobalScalingPlannerOptions {

  configuration?: Partial<GlobalScalingPlannerConfiguration>;

}



export type { GlobalScalingPlannerDependencies };



/**

 * Global Scaling Planner (PILLOW-GSP-001 / X3-14).

 * Intelligent international scaling planning — structural signals only; never recommend without validated readiness.

 */

export class GlobalScalingPlannerEngine {

  private initializedAt: string | null = null;

  private readonly controller: GlobalScalingPlannerController;

  private readonly reader: RepositoryReader;



  constructor(

    private bootstrap: EmpireBootstrapContext,

    dependencies: GlobalScalingPlannerDependencies,

    options: GlobalScalingPlannerOptions = {},

  ) {

    const config = buildGlobalScalingPlannerConfiguration(

      bootstrap.repositoryRoot,

      options.configuration,

    );

    const manager = new GlobalScalingPlannerManager(dependencies);

    this.controller = new GlobalScalingPlannerController(manager, config);

    this.reader = new RepositoryReader(bootstrap.repositoryRoot);

  }



  async initialize(): Promise<GlobalScalingPlannerState> {

    const doc = await this.reader.readText(GLOBAL_SCALING_PLANNER_SYSTEM_PATH);

    if (!doc?.includes("Global Scaling Planner")) {

      throw new Error(

        `${GLOBAL_SCALING_PLANNER_SYSTEM_PATH} missing — Global Scaling Planner requires X3-14 system doc.`,

      );

    }

    this.controller.initialize();

    this.initializedAt = new Date().toISOString();

    appendGspLog({

      event: "GLOBAL_SCALING_PLANNER_ready",

      level: "info",

      details:

        "X3-14 Global Scaling Planner initialized — never recommend international expansion without validated readiness",

    });

    return this.getState();

  }



  getState(): GlobalScalingPlannerState {

    if (!this.initializedAt) {

      throw new Error("Global Scaling Planner not initialized. Call initialize() first.");

    }

    const config = this.controller.getConfiguration();

    const performance = this.controller.getPerformance();

    const record = this.controller.getManager().getEngineRecord();

    const records = this.controller.getManager().getGlobalScalingRecords();



    const health = this.controller.getHealthMonitor().buildReport({

      config,

      record,

      totalGlobalScalingRecords: records.length,

      highPriorityCount: this.controller.getManager().highPriorityCount(),

      averageReadinessScore: this.controller.getManager().averageReadinessScore(),

      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),

      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),

    });



    return {

      engineVersion: "PILLOW-GSP-001",

      missionId: "X3-14",

      status: this.controller.getStatus(),

      initializedAt: this.initializedAt,

      configuration: config,

      latestReport: this.controller.getLatestReport(),

      engineRecord: record,

      health,

      performance,

    };

  }



  connectGlobalScalingPlanner(input: ConnectGlobalScalingPlannerInput = {}): GspRunReport {

    return this.controller.connectGlobalScalingPlanner(input);

  }



  evaluateInternationalExpansionReadiness(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.evaluateInternationalExpansionReadiness(input);

  }



  identifyTargetRegions(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.identifyTargetRegions(input);

  }



  identifyTargetCountries(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.identifyTargetCountries(input);

  }



  evaluateRegionalDemand(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.evaluateRegionalDemand(input);

  }



  evaluateRegionalOperationalReadiness(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.evaluateRegionalOperationalReadiness(input);

  }



  evaluateSupplierReadinessByRegion(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.evaluateSupplierReadinessByRegion(input);

  }



  evaluateFinancialReadinessForExpansion(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.evaluateFinancialReadinessForExpansion(input);

  }



  rankInternationalScalingOpportunities(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.rankInternationalScalingOpportunities(input);

  }



  recommendGlobalExpansion(input: GlobalScalingInput = {}): GspRunReport {

    return this.controller.recommendGlobalExpansion(input);

  }



  runDiagnostics(input: RunGspDiagnosticsInput = {}): GspRunReport {

    return this.controller.runDiagnostics(input);

  }



  getLatestReport(): GspRunReport | null {

    return this.controller.getLatestReport();

  }



  getEngineRecord() {

    return this.controller.getManager().getEngineRecord();

  }



  getGlobalScalingRecords() {

    return this.controller.getManager().getGlobalScalingRecords();

  }



  getRecommendations() {

    return this.controller.getManager().getRecommendations();

  }



  updateConfiguration(

    overrides: Partial<GlobalScalingPlannerConfiguration>,

  ): GlobalScalingPlannerState {

    const next = buildGlobalScalingPlannerConfiguration(this.bootstrap.repositoryRoot, {

      ...this.controller.getConfiguration(),

      ...overrides,

    });

    this.controller.updateConfiguration(next);

    return this.getState();

  }



  validateForSupervisorSync(): {

    valid: boolean;

    health: "healthy" | "degraded" | "blocked";

    readinessScore: number;

    notes: string[];

  } {

    const state = this.getState();

    const report = state.latestReport;

    const score = report

      ? report.validation.decision === "pass"

        ? 100

        : report.validation.decision === "partial"

          ? 70

          : 40

      : state.health.healthScore;



    return {

      valid: state.health.status !== "failed",

      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",

      readinessScore: score,

      notes: [

        `Engine status: ${state.status}`,

        `Global scaling records: ${state.health.totalGlobalScalingRecords}`,

        `High priority: ${state.health.highPriorityCount} · Avg readiness: ${state.health.averageReadinessScore}%`,

        report

          ? `Last operation: ${report.action} · ${report.validation.decision}`

          : "No global scaling planner operations yet",

        ...state.health.notes,

      ],

    };

  }



  getCockpitSnapshot(): GspCockpitSnapshot {

    const state = this.getState();

    const report = state.latestReport;

    const record = state.engineRecord;



    return {

      engineStatus: state.status,

      healthStatus: state.health.status,

      operationalState: record?.currentOperationalState ?? null,

      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,

      totalGlobalScalingRecords: state.health.totalGlobalScalingRecords,

      highPriorityCount: state.health.highPriorityCount,

      averageReadinessScore: state.health.averageReadinessScore,

      frameworkRegistered: Boolean(record?.frameworkModuleId),

      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)

        .length,

      recentLogs: getGspLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),

    };

  }

}



export function createGlobalScalingPlannerEngine(

  bootstrap: EmpireBootstrapContext,

  dependencies: GlobalScalingPlannerDependencies,

  options?: GlobalScalingPlannerOptions,

): GlobalScalingPlannerEngine {

  return new GlobalScalingPlannerEngine(bootstrap, dependencies, options);

}



export function resetGlobalScalingPlannerForTesting(): void {

  resetGspLogsForTesting();

  new GlobalScalingPlannerManager().resetForTesting();

  new HealthMonitor().resetForTesting();

  new RecoveryManager().reset();

}


