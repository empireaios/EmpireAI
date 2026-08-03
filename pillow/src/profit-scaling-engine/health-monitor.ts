/** X3-17 — Profit Scaling Engine health monitoring. */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type {

  HealthStatus,

  ProfitScalingEngineRecord,

  ProfitValidationReport,

  PseHealthReport,

} from "./types.js";



export class HealthMonitor {

  private lastOperationAt: string | null = null;

  private lastDecision: ProfitValidationReport["decision"] | null = null;



  recordOperation(decision: ProfitValidationReport["decision"]): void {

    this.lastOperationAt = new Date().toISOString();

    this.lastDecision = decision;

  }



  buildReport(input: {

    config: ProfitScalingEngineConfiguration;

    record: ProfitScalingEngineRecord | null;

    totalProfitScalingRecords: number;

    highOptimizationCount: number;

    averageOptimizationScore: number;

    consecutiveFailures: number;

    recoveryAttempts: number;

  }): PseHealthReport {

    let healthScore = 100;

    if (input.consecutiveFailures > 0) {

      healthScore -= Math.min(40, input.consecutiveFailures * 15);

    }

    if (!input.config.enabled) healthScore = 50;

    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);



    const status: HealthStatus = !input.config.enabled

      ? "standby"

      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3

        ? "failed"

        : input.consecutiveFailures > 1

          ? "degraded"

          : "healthy";



    const notes: string[] = [];

    if (!input.config.enabled) notes.push("Profit Scaling Engine disabled");

    if (input.consecutiveFailures > 0) {

      notes.push(`${input.consecutiveFailures} consecutive operation failures`);

    }

    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    notes.push(

      `Profit scaling records: ${input.totalProfitScalingRecords} · high optimization: ${input.highOptimizationCount} · avg optimization: ${input.averageOptimizationScore}%`,

    );

    notes.push(

      "Never prioritize growth over validated profitability — structural signals only",

    );



    return {

      status,

      healthScore: Math.max(0, Math.min(100, healthScore)),

      engineEnabled: input.config.enabled,

      lastOperationAt: this.lastOperationAt,

      lastValidationDecision: this.lastDecision,

      consecutiveFailures: input.consecutiveFailures,

      recoveryAttempts: input.recoveryAttempts,

      totalProfitScalingRecords: input.totalProfitScalingRecords,

      highOptimizationCount: input.highOptimizationCount,

      averageOptimizationScore: input.averageOptimizationScore,

      notes,

    };

  }



  resetForTesting(): void {

    this.lastOperationAt = null;

    this.lastDecision = null;

  }

}

