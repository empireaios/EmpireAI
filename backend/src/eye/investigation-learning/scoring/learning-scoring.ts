import { randomUUID } from "node:crypto";

import type { ExecutionResult } from "../../autonomous-investigation-execution/models/execution-result.js";
import type { InvestigationExecution } from "../../autonomous-investigation-execution/models/investigation-execution.js";
import type { InvestigationExecutionTask } from "../../autonomous-investigation-execution/models/investigation-execution-task.js";
import type { InvestigationTaskType } from "../../autonomous-investigation-planner/models/investigation-task.js";
import type { ProductTrendForecast } from "../../product-trend-forecasting/models/product-trend-forecast.js";
import type { ProductOpportunity } from "../../../intelligence/product-opportunity/models/product-opportunity.js";
import type {
  ConfidenceAdjustment,
  InvestigationLearningRecord,
  InvestigationLearningRecordCreateInput,
  InvestigationRecommendation,
  LearnedPattern,
  RepeatedPattern,
} from "../models/investigation-learning-record.js";
import type { LearningSignal, LearningSignalType } from "../models/learning-signal.js";

export const LEARNING_SIGNAL_WEIGHTS: Record<LearningSignalType, number> = {
  execution_outcome: 0.2,
  task_success: 0.15,
  task_failure: 0.15,
  repeated_success: 0.12,
  repeated_failure: 0.12,
  opportunity_alignment: 0.1,
  forecast_alignment: 0.08,
  confidence_adjustment: 0.05,
  recommendation: 0.03,
};

export type InvestigationLearningOpportunityInput = Pick<
  ProductOpportunity,
  "productId" | "opportunityScore" | "opportunityTier" | "confidence" | "weaknesses" | "strengths"
>;

export type InvestigationLearningForecastInput = Pick<
  ProductTrendForecast,
  | "productId"
  | "forecastDirection"
  | "forecastConfidence"
  | "momentumProjection"
  | "riskProjection"
  | "opportunityProjection"
  | "recommendedAction"
>;

export type InvestigationLearningAnalysisInput = {
  execution: InvestigationExecution;
  tasks: InvestigationExecutionTask[];
  results: ExecutionResult[];
  opportunity?: InvestigationLearningOpportunityInput | null;
  forecast?: InvestigationLearningForecastInput | null;
  historicalRecords?: InvestigationLearningRecord[];
};

const REPEATED_PATTERN_THRESHOLD = 2;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function patternKey(taskType: InvestigationTaskType, connectorId: string | null): string {
  return `${taskType}:${connectorId ?? "any"}`;
}

function buildSignal(
  signalType: LearningSignalType,
  score: number,
  detail: string,
): LearningSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: LEARNING_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveBaseConfidence(
  opportunity: InvestigationLearningOpportunityInput | null | undefined,
  forecast: InvestigationLearningForecastInput | null | undefined,
): number {
  if (opportunity && forecast) {
    return clampScore(opportunity.confidence * 0.55 + forecast.forecastConfidence * 0.45);
  }
  if (opportunity) {
    return clampScore(opportunity.confidence);
  }
  if (forecast) {
    return clampScore(forecast.forecastConfidence);
  }
  return 50;
}

function computeExecutionOutcomeScore(execution: InvestigationExecution): number {
  if (execution.status === "COMPLETED") {
    return clampScore(70 + execution.progressPercent * 0.3);
  }
  if (execution.status === "FAILED") {
    return clampScore(Math.max(10, execution.progressPercent * 0.4));
  }
  return 40;
}

function buildCurrentPatterns(
  tasks: InvestigationExecutionTask[],
  results: ExecutionResult[],
): { successes: Map<string, RepeatedPattern>; failures: Map<string, RepeatedPattern> } {
  const successes = new Map<string, RepeatedPattern>();
  const failures = new Map<string, RepeatedPattern>();
  const resultByTaskId = new Map(results.map((result) => [result.taskId, result]));
  const timestamp = new Date().toISOString();

  for (const task of tasks) {
    const result = resultByTaskId.get(task.taskId);
    const key = patternKey(task.taskType, task.assignedConnectorId);
    const entry: RepeatedPattern = {
      patternKey: key,
      taskType: task.taskType,
      connectorId: task.assignedConnectorId,
      occurrenceCount: 1,
      lastSeenAt: result?.executedAt ?? timestamp,
      description:
        result?.status === "FAILED"
          ? `Task ${task.taskType} failed via ${task.assignedConnectorId ?? "unknown connector"}`
          : `Task ${task.taskType} succeeded via ${task.assignedConnectorId ?? "unknown connector"}`,
    };

    if (result?.status === "FAILED" || task.status === "FAILED") {
      failures.set(key, entry);
    } else if (result?.status === "SUCCESS" || task.status === "COMPLETED") {
      successes.set(key, entry);
    }
  }

  return { successes, failures };
}

function aggregateHistoricalPatterns(
  historicalRecords: InvestigationLearningRecord[],
  currentSuccesses: Map<string, RepeatedPattern>,
  currentFailures: Map<string, RepeatedPattern>,
): { repeatedSuccesses: RepeatedPattern[]; repeatedFailures: RepeatedPattern[] } {
  const successCounts = new Map<string, RepeatedPattern>();
  const failureCounts = new Map<string, RepeatedPattern>();

  for (const record of historicalRecords) {
    for (const pattern of record.repeatedSuccesses) {
      const existing = successCounts.get(pattern.patternKey);
      if (existing) {
        existing.occurrenceCount += pattern.occurrenceCount;
        existing.lastSeenAt = pattern.lastSeenAt;
      } else {
        successCounts.set(pattern.patternKey, { ...pattern });
      }
    }
    for (const pattern of record.repeatedFailures) {
      const existing = failureCounts.get(pattern.patternKey);
      if (existing) {
        existing.occurrenceCount += pattern.occurrenceCount;
        existing.lastSeenAt = pattern.lastSeenAt;
      } else {
        failureCounts.set(pattern.patternKey, { ...pattern });
      }
    }
    for (const pattern of record.learnedPatterns) {
      if (pattern.patternType === "TASK_SUCCESS" && pattern.taskType) {
        const key = patternKey(pattern.taskType, pattern.connectorId);
        const existing = successCounts.get(key);
        if (existing) {
          existing.occurrenceCount += 1;
        } else {
          successCounts.set(key, {
            patternKey: key,
            taskType: pattern.taskType,
            connectorId: pattern.connectorId,
            occurrenceCount: 1,
            lastSeenAt: record.updatedAt,
            description: pattern.description,
          });
        }
      }
      if (pattern.patternType === "TASK_FAILURE" && pattern.taskType) {
        const key = patternKey(pattern.taskType, pattern.connectorId);
        const existing = failureCounts.get(key);
        if (existing) {
          existing.occurrenceCount += 1;
        } else {
          failureCounts.set(key, {
            patternKey: key,
            taskType: pattern.taskType,
            connectorId: pattern.connectorId,
            occurrenceCount: 1,
            lastSeenAt: record.updatedAt,
            description: pattern.description,
          });
        }
      }
    }
  }

  for (const [key, pattern] of currentSuccesses) {
    const existing = successCounts.get(key);
    if (existing) {
      existing.occurrenceCount += 1;
      existing.lastSeenAt = pattern.lastSeenAt;
    } else {
      successCounts.set(key, { ...pattern });
    }
  }

  for (const [key, pattern] of currentFailures) {
    const existing = failureCounts.get(key);
    if (existing) {
      existing.occurrenceCount += 1;
      existing.lastSeenAt = pattern.lastSeenAt;
    } else {
      failureCounts.set(key, { ...pattern });
    }
  }

  const repeatedSuccesses = [...successCounts.values()].filter(
    (pattern) => pattern.occurrenceCount >= REPEATED_PATTERN_THRESHOLD,
  );
  const repeatedFailures = [...failureCounts.values()].filter(
    (pattern) => pattern.occurrenceCount >= REPEATED_PATTERN_THRESHOLD,
  );

  return { repeatedSuccesses, repeatedFailures };
}

function buildLearnedPatterns(
  tasks: InvestigationExecutionTask[],
  results: ExecutionResult[],
  execution: InvestigationExecution,
  opportunity: InvestigationLearningOpportunityInput | null | undefined,
  forecast: InvestigationLearningForecastInput | null | undefined,
): LearnedPattern[] {
  const patterns: LearnedPattern[] = [];
  const resultByTaskId = new Map(results.map((result) => [result.taskId, result]));

  for (const task of tasks) {
    const result = resultByTaskId.get(task.taskId);
    const failed = result?.status === "FAILED" || task.status === "FAILED";
    patterns.push({
      patternId: randomUUID(),
      patternType: failed ? "TASK_FAILURE" : "TASK_SUCCESS",
      key: patternKey(task.taskType, task.assignedConnectorId),
      taskType: task.taskType,
      connectorId: task.assignedConnectorId,
      occurrenceCount: 1,
      description: failed
        ? `${task.taskType} failed during execution ${execution.executionId}`
        : `${task.taskType} completed successfully during execution ${execution.executionId}`,
      confidence: failed ? 35 : clampScore(60 + (result?.stepsCompleted ?? 0) * 8),
    });
  }

  if (opportunity) {
    const aligned =
      execution.status === "COMPLETED"
        ? opportunity.opportunityScore >= 50
        : opportunity.opportunityScore < 50;
    patterns.push({
      patternId: randomUUID(),
      patternType: "OPPORTUNITY_VALIDATION",
      key: `opportunity:${opportunity.productId}`,
      taskType: null,
      connectorId: null,
      occurrenceCount: 1,
      description: aligned
        ? `Opportunity score ${opportunity.opportunityScore} aligned with execution outcome`
        : `Opportunity score ${opportunity.opportunityScore} misaligned with execution outcome`,
      confidence: aligned ? 72 : 38,
    });
  }

  if (forecast) {
    const rising =
      forecast.forecastDirection === "RISING" ||
      forecast.forecastDirection === "STRONGLY_RISING";
    const aligned =
      execution.status === "COMPLETED" ? rising || forecast.recommendedAction === "WATCH" : !rising;
    patterns.push({
      patternId: randomUUID(),
      patternType: "FORECAST_VALIDATION",
      key: `forecast:${forecast.productId}`,
      taskType: null,
      connectorId: null,
      occurrenceCount: 1,
      description: `Forecast ${forecast.forecastDirection} vs execution ${execution.status}`,
      confidence: aligned ? 68 : 42,
    });
  }

  const connectorIds = new Set(
    tasks.map((task) => task.assignedConnectorId).filter((id): id is string => id !== null),
  );
  for (const connectorId of connectorIds) {
    const connectorTasks = tasks.filter((task) => task.assignedConnectorId === connectorId);
    const connectorResults = connectorTasks.map((task) => resultByTaskId.get(task.taskId));
    const successCount = connectorResults.filter((result) => result?.status === "SUCCESS").length;
    const reliability = connectorTasks.length
      ? clampScore((successCount / connectorTasks.length) * 100)
      : 50;
    patterns.push({
      patternId: randomUUID(),
      patternType: "CONNECTOR_RELIABILITY",
      key: `connector:${connectorId}`,
      taskType: null,
      connectorId,
      occurrenceCount: connectorTasks.length,
      description: `Connector ${connectorId} reliability ${reliability}% across ${connectorTasks.length} tasks`,
      confidence: reliability,
    });
  }

  return patterns;
}

function computeConfidenceAdjustment(
  execution: InvestigationExecution,
  baseConfidence: number,
  repeatedSuccesses: RepeatedPattern[],
  repeatedFailures: RepeatedPattern[],
): ConfidenceAdjustment {
  let delta = 0;

  if (execution.status === "COMPLETED") {
    delta += clampScore(execution.progressPercent * 0.15);
  } else if (execution.status === "FAILED") {
    delta -= 12;
  }

  delta += repeatedSuccesses.length * 4;
  delta -= repeatedFailures.length * 6;

  const adjustedConfidence = clampScore(baseConfidence + delta);
  const reason =
    repeatedFailures.length > 0
      ? `Adjusted from ${baseConfidence} after ${repeatedFailures.length} repeated failure pattern(s)`
      : repeatedSuccesses.length > 0
        ? `Adjusted from ${baseConfidence} after ${repeatedSuccesses.length} repeated success pattern(s)`
        : `Adjusted from ${baseConfidence} based on execution ${execution.status}`;

  return {
    baseConfidence,
    adjustedConfidence,
    delta: adjustedConfidence - baseConfidence,
    reason,
  };
}

function generateRecommendations(
  execution: InvestigationExecution,
  learnedPatterns: LearnedPattern[],
  repeatedSuccesses: RepeatedPattern[],
  repeatedFailures: RepeatedPattern[],
  opportunity: InvestigationLearningOpportunityInput | null | undefined,
  forecast: InvestigationLearningForecastInput | null | undefined,
): InvestigationRecommendation[] {
  const recommendations: InvestigationRecommendation[] = [];

  for (const pattern of repeatedFailures) {
    recommendations.push({
      recommendationId: randomUUID(),
      priority: "HIGH",
      action: `Avoid relying on ${pattern.connectorId ?? "default connector"} for ${pattern.taskType}`,
      rationale: `${pattern.taskType} failed ${pattern.occurrenceCount} times`,
      taskType: pattern.taskType,
      connectorId: pattern.connectorId,
    });
  }

  for (const pattern of repeatedSuccesses) {
    recommendations.push({
      recommendationId: randomUUID(),
      priority: "MEDIUM",
      action: `Prioritize ${pattern.taskType} in future investigations`,
      rationale: `${pattern.taskType} succeeded ${pattern.occurrenceCount} times`,
      taskType: pattern.taskType,
      connectorId: pattern.connectorId,
    });
  }

  for (const pattern of learnedPatterns) {
    if (pattern.patternType !== "TASK_FAILURE" || !pattern.taskType) {
      continue;
    }
    if (repeatedFailures.some((entry) => entry.patternKey === pattern.key)) {
      continue;
    }
    recommendations.push({
      recommendationId: randomUUID(),
      priority: "MEDIUM",
      action: `Retry ${pattern.taskType} with alternate connector`,
      rationale: `${pattern.taskType} failed in the latest investigation`,
      taskType: pattern.taskType,
      connectorId: pattern.connectorId,
    });
  }

  if (execution.status === "FAILED" && opportunity && opportunity.opportunityScore >= 70) {
    recommendations.push({
      recommendationId: randomUUID(),
      priority: "HIGH",
      action: "Deepen investigation despite execution failure",
      rationale: `High opportunity score ${opportunity.opportunityScore} warrants follow-up`,
      taskType: null,
      connectorId: null,
    });
  }

  if (execution.status === "COMPLETED" && forecast && forecast.forecastConfidence < 55) {
    recommendations.push({
      recommendationId: randomUUID(),
      priority: "LOW",
      action: "Continue watching trend signals before scaling",
      rationale: `Forecast confidence ${forecast.forecastConfidence} remains low after successful investigation`,
      taskType: null,
      connectorId: null,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      recommendationId: randomUUID(),
      priority: "LOW",
      action: "Maintain current investigation playbook",
      rationale: `No recurring patterns detected for execution ${execution.executionId}`,
      taskType: null,
      connectorId: null,
    });
  }

  return recommendations;
}

/** Converts investigation outcomes into reusable learning intelligence. */
export function scoreInvestigationLearning(
  input: InvestigationLearningAnalysisInput,
): InvestigationLearningRecordCreateInput {
  const {
    execution,
    tasks,
    results,
    opportunity,
    forecast,
    historicalRecords = [],
  } = input;

  const baseConfidence = resolveBaseConfidence(opportunity, forecast);
  const currentPatterns = buildCurrentPatterns(tasks, results);
  const { repeatedSuccesses, repeatedFailures } = aggregateHistoricalPatterns(
    historicalRecords,
    currentPatterns.successes,
    currentPatterns.failures,
  );

  const learnedPatterns = buildLearnedPatterns(
    tasks,
    results,
    execution,
    opportunity,
    forecast,
  );
  const confidenceAdjustment = computeConfidenceAdjustment(
    execution,
    baseConfidence,
    repeatedSuccesses,
    repeatedFailures,
  );
  const investigationRecommendations = generateRecommendations(
    execution,
    learnedPatterns,
    repeatedSuccesses,
    repeatedFailures,
    opportunity,
    forecast,
  );

  const signals: LearningSignal[] = [
    buildSignal(
      "execution_outcome",
      computeExecutionOutcomeScore(execution),
      `Execution ${execution.status} at ${execution.progressPercent}% progress`,
    ),
  ];

  for (const pattern of learnedPatterns.filter((entry) => entry.patternType === "TASK_SUCCESS")) {
    signals.push(
      buildSignal("task_success", pattern.confidence, pattern.description),
    );
  }
  for (const pattern of learnedPatterns.filter((entry) => entry.patternType === "TASK_FAILURE")) {
    signals.push(
      buildSignal("task_failure", pattern.confidence, pattern.description),
    );
  }
  for (const pattern of repeatedSuccesses) {
    signals.push(
      buildSignal(
        "repeated_success",
        clampScore(50 + pattern.occurrenceCount * 10),
        pattern.description,
      ),
    );
  }
  for (const pattern of repeatedFailures) {
    signals.push(
      buildSignal(
        "repeated_failure",
        clampScore(80 - pattern.occurrenceCount * 8),
        pattern.description,
      ),
    );
  }
  if (opportunity) {
    signals.push(
      buildSignal(
        "opportunity_alignment",
        opportunity.opportunityScore,
        `Opportunity tier ${opportunity.opportunityTier}`,
      ),
    );
  }
  if (forecast) {
    signals.push(
      buildSignal(
        "forecast_alignment",
        forecast.forecastConfidence,
        `Forecast direction ${forecast.forecastDirection}`,
      ),
    );
  }
  signals.push(
    buildSignal(
      "confidence_adjustment",
      confidenceAdjustment.adjustedConfidence,
      confidenceAdjustment.reason,
    ),
  );
  for (const recommendation of investigationRecommendations) {
    const priorityScore =
      recommendation.priority === "HIGH" ? 85 : recommendation.priority === "MEDIUM" ? 65 : 45;
    signals.push(
      buildSignal("recommendation", priorityScore, recommendation.action),
    );
  }

  return {
    executionId: execution.executionId,
    investigationPlanId: execution.investigationPlanId,
    targetId: execution.targetId,
    productId: execution.productId,
    executionStatus: execution.status,
    learnedPatterns,
    repeatedFailures,
    repeatedSuccesses,
    confidenceAdjustment,
    investigationRecommendations,
    signals,
  };
}

export const learningScoring = {
  scoreInvestigationLearning,
  weights: LEARNING_SIGNAL_WEIGHTS,
  repeatedPatternThreshold: REPEATED_PATTERN_THRESHOLD,
};

export type { InvestigationLearningRecordCreateInput };
