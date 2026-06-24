import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInvestigationPlannerModule,
  createInMemoryInvestigationRepository,
  investigationPlanning,
} from "../../eye/autonomous-investigation-planner/index.js";
import { createConnectorRegistryModule } from "../../eye/connector-registry/index.js";
import { createInMemoryConnectorRegistry } from "../../eye/connector-registry/index.js";
import type { InvestigationPriority } from "../../eye/investigation-priority-intelligence/models/investigation-priority.js";
import type { InvestigationTarget } from "../../eye/investigation-priority-intelligence/models/investigation-target.js";
import type { SourceTrustProfile } from "../../eye/source-trust-intelligence/models/source-trust-profile.js";

const WORKSPACE_ID = "ws-m040";

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

function makeTrustProfile(
  source: SourceTrustProfile["source"],
  overrides: Partial<SourceTrustProfile> = {},
): SourceTrustProfile {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    workspaceId: WORKSPACE_ID,
    source,
    connectorId: overrides.connectorId ?? "amazon",
    historicalAccuracy: 70,
    signalConsistency: 70,
    noiseLevel: 25,
    manipulationRisk: 20,
    reliabilityScore: 72,
    trustScore: 72,
    trustTier: "MEDIUM_TRUST",
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

function createPlannerStack() {
  const connectorRegistry = createInMemoryConnectorRegistry();
  const connectorModule = createConnectorRegistryModule(connectorRegistry);
  const repository = createInMemoryInvestigationRepository();
  const plannerModule = createInvestigationPlannerModule(repository, connectorModule);
  return { connectorModule, repository, plannerModule };
}

function expectedTaskOrder(taskIds: string[], tasks: { taskId: string; valueScore: number; effortScore: number }[]) {
  const ranked = investigationPlanning.rankTasks(
    tasks.map((task) => ({
      taskId: task.taskId,
      taskType: "CHECK_DEMAND",
      title: task.taskId,
      description: task.taskId,
      connectorId: null,
      effortScore: task.effortScore,
      valueScore: task.valueScore,
      steps: [
        {
          stepId: randomUUID(),
          order: 1,
          title: "step",
          description: "step",
          connectorId: null,
          expectedOutcome: "ok",
        },
      ],
    })),
  );
  return ranked.every((taskId, index) => taskIds[index] === taskId);
}

describe("Mission 040 Autonomous Investigation Planner", () => {
  it("creates a deep investigation plan for a critical target", async () => {
    const { connectorModule, plannerModule } = createPlannerStack();
    await seedConnectors(connectorModule);

    const target = makeTarget("prod-m040-critical");
    const priority = makePriority(target, {
      priorityLevel: "CRITICAL",
      investigationPriorityScore: 89,
      urgencyScore: 84,
      uncertaintyScore: 62,
      opportunityScore: 92,
      trendForecastScore: 87,
      trustScore: 45,
    });

    const plan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, {
      target,
      priority,
      trustProfiles: [
        makeTrustProfile("TIKTOK", {
          connectorId: "tiktok",
          trustScore: 42,
          trustTier: "LOW_TRUST",
        }),
        makeTrustProfile("REDDIT", {
          connectorId: "reddit",
          trustScore: 48,
          trustTier: "MEDIUM_TRUST",
        }),
      ],
    });

    assert.equal(plan.priority, "CRITICAL");
    assert.equal(plan.tasks.length, 8);
    assert.ok(plan.estimatedValue >= 60);
    assert.ok(plan.estimatedEffort >= 50);
    assert.ok(plan.tasks.every((task) => task.steps.length >= 2));
    assert.ok(plan.tasks.some((task) => task.steps.some((step) => step.title.includes("trust"))));
  });

  it("creates a minimal investigation plan for a low priority target", async () => {
    const { connectorModule, plannerModule } = createPlannerStack();
    await seedConnectors(connectorModule);

    const target = makeTarget("prod-m040-low");
    const priority = makePriority(target, {
      priorityLevel: "LOW",
      investigationPriorityScore: 30,
      urgencyScore: 25,
      uncertaintyScore: 20,
      opportunityScore: 28,
      trendForecastScore: 32,
      trustScore: 82,
    });

    const plan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, {
      target,
      priority,
      trustProfiles: [
        makeTrustProfile("GOOGLE_TRENDS", {
          connectorId: "google-trends",
          trustScore: 84,
          trustTier: "HIGH_TRUST",
        }),
      ],
    });

    assert.equal(plan.priority, "LOW");
    assert.equal(plan.tasks.length, 1);
    assert.equal(plan.tasks[0]!.taskType, "CHECK_DEMAND");
    assert.equal(plan.tasks[0]!.steps.length, 1);
    assert.ok(plan.estimatedEffort < 40);
    assert.ok(plan.estimatedValue < 55);
  });

  it("orders tasks by value-to-effort ratio in recommendedOrder", async () => {
    const { connectorModule, plannerModule } = createPlannerStack();
    await seedConnectors(connectorModule);

    const target = makeTarget("prod-m040-order");
    const priority = makePriority(target, {
      priorityLevel: "HIGH",
      investigationPriorityScore: 72,
      urgencyScore: 70,
      uncertaintyScore: 35,
    });

    const plan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, { target, priority });

    assert.equal(plan.recommendedOrder.length, plan.tasks.length);
    assert.ok(
      expectedTaskOrder(
        plan.recommendedOrder,
        plan.tasks.map((task) => ({
          taskId: task.taskId,
          valueScore: task.valueScore,
          effortScore: task.effortScore,
        })),
      ),
    );
  });

  it("estimates plan effort from task depth and uncertainty", async () => {
    const { connectorModule, plannerModule } = createPlannerStack();
    await seedConnectors(connectorModule);

    const lowTarget = makeTarget("prod-m040-effort-low");
    const highTarget = makeTarget("prod-m040-effort-high");

    const lowPlan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, {
      target: lowTarget,
      priority: makePriority(lowTarget, {
        priorityLevel: "MEDIUM",
        investigationPriorityScore: 50,
        uncertaintyScore: 25,
      }),
    });
    const highPlan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, {
      target: highTarget,
      priority: makePriority(highTarget, {
        priorityLevel: "MEDIUM",
        investigationPriorityScore: 50,
        uncertaintyScore: 70,
      }),
    });

    assert.ok(highPlan.estimatedEffort >= lowPlan.estimatedEffort);
    assert.ok(highPlan.tasks.length === lowPlan.tasks.length);
  });

  it("estimates plan value from task value and priority score", async () => {
    const { connectorModule, plannerModule } = createPlannerStack();
    await seedConnectors(connectorModule);

    const lowTarget = makeTarget("prod-m040-value-low");
    const highTarget = makeTarget("prod-m040-value-high");

    const lowPlan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, {
      target: lowTarget,
      priority: makePriority(lowTarget, {
        priorityLevel: "LOW",
        investigationPriorityScore: 30,
        urgencyScore: 20,
      }),
    });

    const highPlan = await plannerModule.createInvestigationPlan(WORKSPACE_ID, {
      target: highTarget,
      priority: makePriority(highTarget, {
        priorityLevel: "CRITICAL",
        investigationPriorityScore: 88,
        urgencyScore: 82,
      }),
    });

    assert.ok(highPlan.estimatedValue > lowPlan.estimatedValue);
  });

  it("persists investigation plans in the repository", async () => {
    const { connectorModule, repository, plannerModule } = createPlannerStack();
    await seedConnectors(connectorModule);

    const target = makeTarget("prod-m040-persist");
    const priority = makePriority(target, {
      priorityLevel: "HIGH",
      investigationPriorityScore: 68,
    });

    const saved = await plannerModule.createInvestigationPlan(WORKSPACE_ID, { target, priority });
    const loaded = await plannerModule.getInvestigationPlan(WORKSPACE_ID, target.targetId);

    assert.ok(loaded);
    assert.equal(loaded!.investigationPlanId, saved.investigationPlanId);
    assert.equal(loaded!.tasks.length, saved.tasks.length);
    assert.deepEqual(loaded!.recommendedOrder, saved.recommendedOrder);

    const listed = await repository.listPlans({ workspaceId: WORKSPACE_ID, productId: target.productId });
    assert.equal(listed.length, 1);
  });
});
