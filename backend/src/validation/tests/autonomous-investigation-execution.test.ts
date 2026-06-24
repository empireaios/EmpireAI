import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInvestigationExecutionModule,
  createInMemoryExecutionRepository,
} from "../../eye/autonomous-investigation-execution/index.js";
import {
  createInvestigationPlannerModule,
  createInMemoryInvestigationRepository,
} from "../../eye/autonomous-investigation-planner/index.js";
import { createConnectorRegistryModule } from "../../eye/connector-registry/index.js";
import { createInMemoryConnectorRegistry } from "../../eye/connector-registry/index.js";
import {
  createConnectorPollingSchedulerModule,
  createInMemoryPollingSchedulerRepository,
} from "../../eye/connector-polling-scheduler/index.js";
import {
  createConnectorSignalIngestionModule,
  createInMemoryConnectorSignalIngestionRepository,
} from "../../eye/connector-signal-ingestion/index.js";
import { createGlobalProductSignalModule } from "../../eye/global-product-signals/index.js";
import { createInMemoryProductSignalRegistry } from "../../eye/global-product-signals/index.js";
import type { InvestigationPriority } from "../../eye/investigation-priority-intelligence/models/investigation-priority.js";
import type { InvestigationTarget } from "../../eye/investigation-priority-intelligence/models/investigation-target.js";

const WORKSPACE_ID = "ws-m041";

function makeTarget(productId: string, targetId = randomUUID()): InvestigationTarget {
  const now = new Date().toISOString();
  return {
    targetId,
    workspaceId: WORKSPACE_ID,
    productId,
    buyerPersonaId: null,
    label: `Investigate ${productId}`,
    primarySource: "AMAZON",
    createdAt: now,
    updatedAt: now,
  };
}

function makePriority(
  target: InvestigationTarget,
  overrides: Partial<InvestigationPriority>,
): InvestigationPriority {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    workspaceId: WORKSPACE_ID,
    targetId: target.targetId,
    productId: target.productId,
    opportunityScore: 60,
    trendForecastScore: 60,
    trustScore: 65,
    urgencyScore: 55,
    uncertaintyScore: 40,
    investigationPriorityScore: 58,
    priorityLevel: "MEDIUM",
    rationale: "Baseline investigation priority",
    signals: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function seedConnectors(connectorModule: ReturnType<typeof createConnectorRegistryModule>) {
  for (const connectorId of [
    "amazon",
    "google-trends",
    "tiktok",
    "pinterest",
    "reddit",
    "cj-dropshipping",
    "shopify",
    "youtube",
  ]) {
    await connectorModule.registerKnownConnector(WORKSPACE_ID, connectorId);
    await connectorModule.updateConnectorStatus(WORKSPACE_ID, connectorId, "ACTIVE");
    await connectorModule.updateConnectorHealth(WORKSPACE_ID, connectorId, {
      healthState: "HEALTHY",
      message: "Healthy",
      consecutiveFailures: 0,
    });
  }
}

function createExecutionStack() {
  const connectorRegistry = createInMemoryConnectorRegistry();
  const connectorModule = createConnectorRegistryModule(connectorRegistry);
  const ingestionRepository = createInMemoryConnectorSignalIngestionRepository();
  const productSignalRegistry = createInMemoryProductSignalRegistry();
  const ingestionModule = createConnectorSignalIngestionModule(
    ingestionRepository,
    connectorModule,
    createGlobalProductSignalModule(productSignalRegistry),
  );
  const pollingRepository = createInMemoryPollingSchedulerRepository();
  const pollingScheduler = createConnectorPollingSchedulerModule(
    pollingRepository,
    connectorModule,
    ingestionModule,
  );
  const executionRepository = createInMemoryExecutionRepository();
  const plannerRepository = createInMemoryInvestigationRepository();
  const plannerModule = createInvestigationPlannerModule(plannerRepository, connectorModule);
  const executionModule = createInvestigationExecutionModule(
    executionRepository,
    connectorModule,
    pollingScheduler,
  );

  return {
    connectorModule,
    plannerModule,
    executionModule,
    executionRepository,
  };
}

async function createLowPriorityPlan(
  plannerModule: ReturnType<typeof createInvestigationPlannerModule>,
) {
  const target = makeTarget("prod-m041-exec");
  const priority = makePriority(target, {
    priorityLevel: "LOW",
    investigationPriorityScore: 30,
    urgencyScore: 22,
    uncertaintyScore: 18,
    opportunityScore: 26,
  });

  return plannerModule.createInvestigationPlan(WORKSPACE_ID, {
    target,
    priority,
  });
}

describe("Mission 041 Autonomous Investigation Execution Engine", () => {
  it("executes an investigation plan successfully", async () => {
    const { connectorModule, plannerModule, executionModule } = createExecutionStack();
    await seedConnectors(connectorModule);

    const plan = await createLowPriorityPlan(plannerModule);
    const execution = await executionModule.startInvestigationExecution(WORKSPACE_ID, plan);

    assert.equal(execution.status, "COMPLETED");
    assert.equal(execution.completedTaskCount, plan.tasks.length);
    assert.equal(execution.progressPercent, 100);
    assert.ok(execution.startedAt);
    assert.ok(execution.completedAt);

    const tasks = await executionModule.listExecutionTasks(execution.executionId);
    assert.equal(tasks.length, plan.tasks.length);
    assert.ok(tasks.every((task) => task.status === "COMPLETED"));
    assert.ok(tasks.every((task) => task.progressPercent === 100));

    const results = await executionModule.listExecutionResults(execution.executionId);
    assert.equal(results.length, plan.tasks.length);
    assert.ok(results.every((result) => result.status === "SUCCESS"));
  });

  it("records failed execution when a task fails", async () => {
    const { connectorModule, plannerModule, executionModule } = createExecutionStack();
    await seedConnectors(connectorModule);

    const plan = await createLowPriorityPlan(plannerModule);
    const failingTaskId = plan.recommendedOrder[0]!;

    const execution = await executionModule.startInvestigationExecution(WORKSPACE_ID, plan, {
      failTaskIds: new Set([failingTaskId]),
    });

    assert.equal(execution.status, "FAILED");
    assert.equal(execution.completedTaskCount, 0);
    assert.ok(execution.progressPercent < 100);

    const failedTask = await executionModule.listExecutionTasks(execution.executionId);
    assert.equal(failedTask[0]!.status, "FAILED");
    assert.match(failedTask[0]!.errorMessage ?? "", /Forced investigation task failure/);

    const results = await executionModule.listExecutionResults(execution.executionId);
    assert.equal(results.length, 1);
    assert.equal(results[0]!.status, "FAILED");
  });

  it("supports retry flow after a failed execution", async () => {
    const { connectorModule, plannerModule, executionModule } = createExecutionStack();
    await seedConnectors(connectorModule);

    const plan = await createLowPriorityPlan(plannerModule);
    const failingTaskId = plan.recommendedOrder[0]!;

    const failedExecution = await executionModule.startInvestigationExecution(WORKSPACE_ID, plan, {
      failTaskIds: new Set([failingTaskId]),
    });
    assert.equal(failedExecution.status, "FAILED");

    const retried = await executionModule.retryInvestigationExecution(
      WORKSPACE_ID,
      plan,
      failedExecution.executionId,
    );

    assert.equal(retried.status, "COMPLETED");
    assert.equal(retried.retryCount, 1);
    assert.equal(retried.completedTaskCount, plan.tasks.length);
    assert.equal(retried.progressPercent, 100);
  });

  it("tracks execution progress across tasks", async () => {
    const { connectorModule, plannerModule, executionModule } = createExecutionStack();
    await seedConnectors(connectorModule);

    const target = makeTarget("prod-m041-progress");
    const priority = makePriority(target, {
      priorityLevel: "MEDIUM",
      investigationPriorityScore: 52,
    });
    const plan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, { target, priority });

    const execution = await executionModule.startInvestigationExecution(WORKSPACE_ID, plan);
    const tasks = await executionModule.listExecutionTasks(execution.executionId);

    assert.equal(execution.totalTaskCount, plan.tasks.length);
    assert.equal(execution.completedTaskCount, plan.tasks.length);
    assert.ok(tasks.every((task) => task.stepsCompleted === task.stepsTotal));
    assert.ok(tasks.every((task) => task.assignedConnectorId !== null || task.status === "COMPLETED"));
  });

  it("tracks completion state on execution and tasks", async () => {
    const { connectorModule, plannerModule, executionModule } = createExecutionStack();
    await seedConnectors(connectorModule);

    const plan = await createLowPriorityPlan(plannerModule);
    const execution = await executionModule.startInvestigationExecution(WORKSPACE_ID, plan);
    const tasks = await executionModule.listExecutionTasks(execution.executionId);

    assert.equal(execution.status, "COMPLETED");
    assert.ok(execution.completedAt);
    assert.ok(tasks.every((task) => task.completedAt));
    assert.ok(tasks.every((task) => task.startedAt));
  });

  it("persists investigation executions in the repository", async () => {
    const { connectorModule, plannerModule, executionModule, executionRepository } =
      createExecutionStack();
    await seedConnectors(connectorModule);

    const plan = await createLowPriorityPlan(plannerModule);
    const execution = await executionModule.startInvestigationExecution(WORKSPACE_ID, plan);

    const loaded = await executionModule.getExecutionByPlan(
      WORKSPACE_ID,
      plan.investigationPlanId,
    );
    assert.ok(loaded);
    assert.equal(loaded!.executionId, execution.executionId);
    assert.equal(loaded!.status, "COMPLETED");

    const listed = await executionRepository.listExecutions({
      workspaceId: WORKSPACE_ID,
      status: "COMPLETED",
    });
    assert.equal(listed.length, 1);

    const results = await executionRepository.listResults(execution.executionId);
    assert.equal(results.length, plan.tasks.length);
  });
});
