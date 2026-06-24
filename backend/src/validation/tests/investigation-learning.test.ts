import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import type { ExecutionResult } from "../../eye/autonomous-investigation-execution/models/execution-result.js";
import type { InvestigationExecution } from "../../eye/autonomous-investigation-execution/models/investigation-execution.js";
import type { InvestigationExecutionTask } from "../../eye/autonomous-investigation-execution/models/investigation-execution-task.js";
import {
  createInMemoryLearningRepository,
  createInvestigationLearningModule,
  scoreInvestigationLearning,
} from "../../eye/investigation-learning/index.js";
import type {
  InvestigationLearningForecastInput,
  InvestigationLearningOpportunityInput,
} from "../../eye/investigation-learning/index.js";

const WORKSPACE_ID = "ws-m042";

function nowIso(): string {
  return new Date().toISOString();
}

function makeOpportunity(
  productId: string,
  overrides: Partial<InvestigationLearningOpportunityInput> = {},
): InvestigationLearningOpportunityInput {
  return {
    productId,
    opportunityScore: 72,
    opportunityTier: "high",
    confidence: 68,
    strengths: ["strong demand"],
    weaknesses: ["limited proof"],
    ...overrides,
  };
}

function makeForecast(
  productId: string,
  overrides: Partial<InvestigationLearningForecastInput> = {},
): InvestigationLearningForecastInput {
  return {
    productId,
    forecastDirection: "RISING",
    forecastConfidence: 70,
    momentumProjection: 74,
    riskProjection: 35,
    opportunityProjection: 76,
    recommendedAction: "ACCUMULATE",
    ...overrides,
  };
}

function makeExecution(
  productId: string,
  status: InvestigationExecution["status"],
  overrides: Partial<InvestigationExecution> = {},
): InvestigationExecution {
  const timestamp = nowIso();
  return {
    executionId: randomUUID(),
    workspaceId: WORKSPACE_ID,
    investigationPlanId: randomUUID(),
    targetId: randomUUID(),
    productId,
    status,
    progressPercent: status === "COMPLETED" ? 100 : status === "FAILED" ? 0 : 50,
    completedTaskCount: status === "COMPLETED" ? 1 : 0,
    totalTaskCount: 1,
    retryCount: 0,
    maxRetries: 2,
    startedAt: timestamp,
    completedAt: status === "COMPLETED" || status === "FAILED" ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function makeTask(
  execution: InvestigationExecution,
  taskType: InvestigationExecutionTask["taskType"],
  status: InvestigationExecutionTask["status"],
  connectorId = "amazon",
): InvestigationExecutionTask {
  const timestamp = nowIso();
  return {
    executionTaskId: randomUUID(),
    executionId: execution.executionId,
    taskId: randomUUID(),
    taskType,
    title: `${taskType} check`,
    status,
    assignedConnectorId: connectorId,
    stepsCompleted: status === "COMPLETED" ? 2 : 0,
    stepsTotal: 2,
    progressPercent: status === "COMPLETED" ? 100 : 0,
    pollingJobId: null,
    lastResultId: null,
    errorMessage: status === "FAILED" ? "Task failed" : null,
    startedAt: timestamp,
    completedAt: status === "COMPLETED" || status === "FAILED" ? timestamp : null,
  };
}

function makeResult(
  execution: InvestigationExecution,
  task: InvestigationExecutionTask,
  status: ExecutionResult["status"],
): ExecutionResult {
  return {
    resultId: randomUUID(),
    executionId: execution.executionId,
    executionTaskId: task.executionTaskId,
    taskId: task.taskId,
    status,
    reason: status === "SUCCESS" ? "Task completed" : "Task failed",
    signalId: status === "SUCCESS" ? randomUUID() : null,
    pollingResultId: status === "SUCCESS" ? randomUUID() : null,
    stepsCompleted: status === "SUCCESS" ? task.stepsTotal : 0,
    durationMs: 120,
    executedAt: nowIso(),
  };
}

describe("Mission 042 Investigation Learning Engine", () => {
  it("detects success patterns from completed investigations", async () => {
    const module = createInvestigationLearningModule();
    const productId = "prod-m042-success";
    const execution = makeExecution(productId, "COMPLETED");
    const task = makeTask(execution, "CHECK_DEMAND", "COMPLETED", "amazon");
    const result = makeResult(execution, task, "SUCCESS");

    const record = await module.recordInvestigationOutcome(WORKSPACE_ID, {
      execution,
      tasks: [task],
      results: [result],
      opportunity: makeOpportunity(productId),
      forecast: makeForecast(productId),
    });

    assert.ok(record.learnedPatterns.some((pattern) => pattern.patternType === "TASK_SUCCESS"));
    assert.ok(record.learnedPatterns.some((pattern) => pattern.patternType === "OPPORTUNITY_VALIDATION"));
    assert.equal(record.repeatedSuccesses.length, 0);
    assert.equal(record.executionStatus, "COMPLETED");
  });

  it("detects failure patterns from failed investigations", async () => {
    const module = createInvestigationLearningModule();
    const productId = "prod-m042-failure";
    const execution = makeExecution(productId, "FAILED");
    const task = makeTask(execution, "CHECK_TREND", "FAILED", "google-trends");
    const result = makeResult(execution, task, "FAILED");

    const record = await module.recordInvestigationOutcome(WORKSPACE_ID, {
      execution,
      tasks: [task],
      results: [result],
      opportunity: makeOpportunity(productId, { opportunityScore: 82 }),
      forecast: makeForecast(productId),
    });

    assert.ok(record.learnedPatterns.some((pattern) => pattern.patternType === "TASK_FAILURE"));
    assert.ok(record.investigationRecommendations.some((rec) => rec.priority === "HIGH"));
    assert.equal(record.repeatedFailures.length, 0);
  });

  it("adjusts confidence based on investigation history", async () => {
    const repository = createInMemoryLearningRepository();
    const module = createInvestigationLearningModule(repository);
    const productId = "prod-m042-confidence";

    const failedExecution = makeExecution(productId, "FAILED");
    const failedTask = makeTask(failedExecution, "CHECK_DEMAND", "FAILED", "amazon");
    const failedResult = makeResult(failedExecution, failedTask, "FAILED");

    const failedRecord = await module.recordInvestigationOutcome(WORKSPACE_ID, {
      execution: failedExecution,
      tasks: [failedTask],
      results: [failedResult],
      opportunity: makeOpportunity(productId, { confidence: 70 }),
      forecast: makeForecast(productId, { forecastConfidence: 70 }),
    });

    assert.ok(failedRecord.confidenceAdjustment.adjustedConfidence < failedRecord.confidenceAdjustment.baseConfidence);

    const successExecution = makeExecution(productId, "COMPLETED");
    const successTask = makeTask(successExecution, "CHECK_DEMAND", "COMPLETED", "amazon");
    const successResult = makeResult(successExecution, successTask, "SUCCESS");

    const successRecord = await module.recordInvestigationOutcome(WORKSPACE_ID, {
      execution: successExecution,
      tasks: [successTask],
      results: [successResult],
      opportunity: makeOpportunity(productId, { confidence: 70 }),
      forecast: makeForecast(productId, { forecastConfidence: 70 }),
    });

    assert.ok(successRecord.confidenceAdjustment.adjustedConfidence > successRecord.confidenceAdjustment.baseConfidence);
    assert.notEqual(
      failedRecord.confidenceAdjustment.adjustedConfidence,
      successRecord.confidenceAdjustment.adjustedConfidence,
    );
  });

  it("generates future investigation recommendations", async () => {
    const module = createInvestigationLearningModule();
    const productId = "prod-m042-recommend";
    const execution = makeExecution(productId, "FAILED");
    const task = makeTask(execution, "CHECK_SUPPLIER", "FAILED", "cj-dropshipping");
    const result = makeResult(execution, task, "FAILED");

    const record = await module.recordInvestigationOutcome(WORKSPACE_ID, {
      execution,
      tasks: [task],
      results: [result],
      opportunity: makeOpportunity(productId, { opportunityScore: 88 }),
    });

    assert.ok(record.investigationRecommendations.length >= 2);
    assert.ok(
      record.investigationRecommendations.some((rec) =>
        rec.action.includes("Deepen investigation despite execution failure"),
      ),
    );
    assert.ok(record.signals.some((signal) => signal.signalType === "recommendation"));
  });

  it("persists investigation learning records in the repository", async () => {
    const repository = createInMemoryLearningRepository();
    const module = createInvestigationLearningModule(repository);
    const productId = "prod-m042-persist";
    const execution = makeExecution(productId, "COMPLETED");
    const task = makeTask(execution, "CHECK_DEMAND", "COMPLETED");
    const result = makeResult(execution, task, "SUCCESS");

    const record = await module.recordInvestigationOutcome(WORKSPACE_ID, {
      execution,
      tasks: [task],
      results: [result],
    });

    const loaded = await module.getLearningByExecution(WORKSPACE_ID, execution.executionId);
    assert.ok(loaded);
    assert.equal(loaded!.id, record.id);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      productId,
      executionStatus: "COMPLETED",
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.executionId, execution.executionId);
  });

  it("detects repeated patterns across multiple investigations", async () => {
    const repository = createInMemoryLearningRepository();
    const module = createInvestigationLearningModule(repository);
    const productId = "prod-m042-repeated";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const execution = makeExecution(productId, "FAILED");
      const task = makeTask(execution, "CHECK_TREND", "FAILED", "google-trends");
      const result = makeResult(execution, task, "FAILED");

      await module.recordInvestigationOutcome(WORKSPACE_ID, {
        execution,
        tasks: [task],
        results: [result],
        forecast: makeForecast(productId),
      });
    }

    const records = await module.listLearningRecords(WORKSPACE_ID, { productId });
    assert.equal(records.length, 2);

    const latest = records[0]!;
    assert.ok(latest.repeatedFailures.length >= 1);
    assert.equal(latest.repeatedFailures[0]!.taskType, "CHECK_TREND");
    assert.ok(latest.repeatedFailures[0]!.occurrenceCount >= 2);
    assert.ok(
      latest.investigationRecommendations.some((rec) =>
        rec.action.includes("Avoid relying on google-trends for CHECK_TREND"),
      ),
    );

    const analysis = scoreInvestigationLearning({
      execution: makeExecution(productId, "FAILED"),
      tasks: [makeTask(makeExecution(productId, "FAILED"), "CHECK_TREND", "FAILED", "google-trends")],
      results: [],
      historicalRecords: records,
    });
    assert.ok(analysis.repeatedFailures.length >= 1);
  });
});
