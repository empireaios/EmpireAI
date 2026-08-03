/** X3-17 — Profit Scaling Engine. */



import type { EmpireBootstrapContext } from "../bootstrap/types.js";

import { RepositoryReader } from "../bootstrap/repository-reader.js";

import {

  buildProfitScalingEngineConfiguration,

  type ProfitScalingEngineConfiguration,

} from "./configuration.js";

import { appendPseLog, getPseLogs, resetPseLogsForTesting } from "./pse-logging.js";

import { PROFIT_SCALING_ENGINE_SYSTEM_PATH } from "./paths.js";

import type {

  ProfitScalingInput,

  ProfitScalingEngineState,

  PseCockpitSnapshot,

  PseRunReport,

  ConnectProfitScalingEngineInput,

  RunPseDiagnosticsInput,

} from "./types.js";

import { ProfitScalingController } from "./profit-scaling-controller.js";

import {

  ProfitScalingManager,

  type ProfitScalingEngineDependencies,

} from "./profit-scaling-manager.js";

import { HealthMonitor } from "./health-monitor.js";

import { RecoveryManager } from "./recovery-manager.js";



export interface ProfitScalingEngineOptions {

  configuration?: Partial<ProfitScalingEngineConfiguration>;

}



export type { ProfitScalingEngineDependencies };



/**

 * Profit Scaling Engine (PILLOW-PSE-001 / X3-17).

 * Profit-first enterprise scaling — structural signals only; never prioritize growth over validated profitability.

 */

export class ProfitScalingEngine {

  private initializedAt: string | null = null;

  private readonly controller: ProfitScalingController;

  private readonly reader: RepositoryReader;



  constructor(

    private bootstrap: EmpireBootstrapContext,

    dependencies: ProfitScalingEngineDependencies,

    options: ProfitScalingEngineOptions = {},

  ) {

    const config = buildProfitScalingEngineConfiguration(

      bootstrap.repositoryRoot,

      options.configuration,

    );

    const manager = new ProfitScalingManager(dependencies);

    this.controller = new ProfitScalingController(manager, config);

    this.reader = new RepositoryReader(bootstrap.repositoryRoot);

  }



  async initialize(): Promise<ProfitScalingEngineState> {

    const doc = await this.reader.readText(PROFIT_SCALING_ENGINE_SYSTEM_PATH);

    if (!doc?.includes("Profit Scaling Engine")) {

      throw new Error(

        `${PROFIT_SCALING_ENGINE_SYSTEM_PATH} missing — Profit Scaling Engine requires X3-17 system doc.`,

      );

    }

    this.controller.initialize();

    this.initializedAt = new Date().toISOString();

    appendPseLog({

      event: "PROFIT_SCALING_ENGINE_ready",

      level: "info",

      details:

        "X3-17 Profit Scaling Engine initialized — never prioritize growth over validated profitability",

    });

    return this.getState();

  }



  getState(): ProfitScalingEngineState {

    if (!this.initializedAt) {

      throw new Error("Profit Scaling Engine not initialized. Call initialize() first.");

    }

    const config = this.controller.getConfiguration();

    const performance = this.controller.getPerformance();

    const record = this.controller.getManager().getEngineRecord();

    const records = this.controller.getManager().getProfitScalingRecords();



    const health = this.controller.getHealthMonitor().buildReport({

      config,

      record,

      totalProfitScalingRecords: records.length,

      highOptimizationCount: this.controller.getManager().highOptimizationCount(config),

      averageOptimizationScore: this.controller.getManager().averageOptimizationScore(),

      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),

      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),

    });



    return {

      engineVersion: "PILLOW-PSE-001",

      missionId: "X3-17",

      status: this.controller.getStatus(),

      initializedAt: this.initializedAt,

      configuration: config,

      latestReport: this.controller.getLatestReport(),

      engineRecord: record,

      health,

      performance,

    };

  }



  connectProfitScalingEngine(

    input: ConnectProfitScalingEngineInput = {},

  ): PseRunReport {

    return this.controller.connectProfitScalingEngine(input);

  }



  monitorProfitGrowth(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.monitorProfitGrowth(input);

  }



  monitorGrossMargin(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.monitorGrossMargin(input);

  }



  monitorNetMargin(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.monitorNetMargin(input);

  }



  monitorOperatingMargin(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.monitorOperatingMargin(input);

  }



  monitorScalingCosts(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.monitorScalingCosts(input);

  }



  monitorReturnOnInvestment(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.monitorReturnOnInvestment(input);

  }



  detectProfitErosion(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.detectProfitErosion(input);

  }



  detectUnprofitableGrowth(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.detectUnprofitableGrowth(input);

  }



  optimizeProfitDuringScaling(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.optimizeProfitDuringScaling(input);

  }



  recommendProfitScaling(input: ProfitScalingInput = {}): PseRunReport {

    return this.controller.recommendProfitScaling(input);

  }



  runDiagnostics(input: RunPseDiagnosticsInput = {}): PseRunReport {

    return this.controller.runDiagnostics(input);

  }



  getLatestReport(): PseRunReport | null {

    return this.controller.getLatestReport();

  }



  getEngineRecord() {

    return this.controller.getManager().getEngineRecord();

  }



  getProfitScalingRecords() {

    return this.controller.getManager().getProfitScalingRecords();

  }



  getRecommendations() {

    return this.controller.getManager().getRecommendations();

  }



  updateConfiguration(

    overrides: Partial<ProfitScalingEngineConfiguration>,

  ): ProfitScalingEngineState {

    const next = buildProfitScalingEngineConfiguration(this.bootstrap.repositoryRoot, {

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

        `Profit scaling records: ${state.health.totalProfitScalingRecords}`,

        `High optimization: ${state.health.highOptimizationCount} · Avg optimization: ${state.health.averageOptimizationScore}%`,

        report

          ? `Last operation: ${report.action} · ${report.validation.decision}`

          : "No profit scaling engine operations yet",

        ...state.health.notes,

      ],

    };

  }



  getCockpitSnapshot(): PseCockpitSnapshot {

    const state = this.getState();

    const report = state.latestReport;

    const record = state.engineRecord;



    return {

      engineStatus: state.status,

      healthStatus: state.health.status,

      operationalState: record?.currentOperationalState ?? null,

      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,

      totalProfitScalingRecords: state.health.totalProfitScalingRecords,

      highOptimizationCount: state.health.highOptimizationCount,

      averageOptimizationScore: state.health.averageOptimizationScore,

      frameworkRegistered: Boolean(record?.frameworkModuleId),

      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)

        .length,

      recentLogs: getPseLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),

    };

  }

}



export function createProfitScalingEngine(

  bootstrap: EmpireBootstrapContext,

  dependencies: ProfitScalingEngineDependencies,

  options?: ProfitScalingEngineOptions,

): ProfitScalingEngine {

  return new ProfitScalingEngine(bootstrap, dependencies, options);

}



export function resetProfitScalingEngineForTesting(): void {

  resetPseLogsForTesting();

  new ProfitScalingManager().resetForTesting();

  new HealthMonitor().resetForTesting();

  new RecoveryManager().reset();

}

