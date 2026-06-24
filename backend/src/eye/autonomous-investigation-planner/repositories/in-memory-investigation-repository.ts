import { randomUUID } from "node:crypto";

import type { InvestigationPlan, InvestigationPlanCreateInput } from "../models/investigation-plan.js";
import type {
  InvestigationPlanRepositoryQuery,
  InvestigationRepository,
} from "./investigation-repository.js";

function planKey(workspaceId: string, planId: string): string {
  return `${workspaceId}:plan:${planId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory InvestigationRepository for Mission 040 tests and local development. */
export class InMemoryInvestigationRepository implements InvestigationRepository {
  private readonly store = new Map<string, InvestigationPlan>();
  private readonly targetIndex = new Map<string, string>();

  async savePlan(
    workspaceId: string,
    input: InvestigationPlanCreateInput,
  ): Promise<InvestigationPlan> {
    const targetKey = `${workspaceId}:${input.targetId}`;
    const existingId = this.targetIndex.get(targetKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = planKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: InvestigationPlan = {
          ...existing,
          productId: input.productId,
          priority: input.priority,
          tasks: input.tasks.map((task) => ({
            ...task,
            steps: task.steps.map((step) => ({ ...step })),
          })),
          estimatedValue: input.estimatedValue,
          estimatedEffort: input.estimatedEffort,
          recommendedOrder: [...input.recommendedOrder],
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const plan: InvestigationPlan = {
      investigationPlanId: randomUUID(),
      workspaceId,
      targetId: input.targetId,
      productId: input.productId,
      priority: input.priority,
      tasks: input.tasks.map((task) => ({
        ...task,
        steps: task.steps.map((step) => ({ ...step })),
      })),
      estimatedValue: input.estimatedValue,
      estimatedEffort: input.estimatedEffort,
      recommendedOrder: [...input.recommendedOrder],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(planKey(workspaceId, plan.investigationPlanId), plan);
    this.targetIndex.set(targetKey, plan.investigationPlanId);
    return structuredClone(plan);
  }

  async getPlanById(
    workspaceId: string,
    investigationPlanId: string,
  ): Promise<InvestigationPlan | null> {
    const plan = this.store.get(planKey(workspaceId, investigationPlanId));
    return plan ? structuredClone(plan) : null;
  }

  async getPlanByTarget(workspaceId: string, targetId: string): Promise<InvestigationPlan | null> {
    const planId = this.targetIndex.get(`${workspaceId}:${targetId}`);
    if (!planId) {
      return null;
    }
    return this.getPlanById(workspaceId, planId);
  }

  async listPlans(query: InvestigationPlanRepositoryQuery): Promise<InvestigationPlan[]> {
    let results = [...this.store.values()].filter((plan) => plan.workspaceId === query.workspaceId);

    if (query.targetId) {
      results = results.filter((plan) => plan.targetId === query.targetId);
    }
    if (query.productId) {
      results = results.filter((plan) => plan.productId === query.productId);
    }

    results.sort(
      (left, right) =>
        right.estimatedValue - left.estimatedValue ||
        left.productId.localeCompare(right.productId),
    );

    return paginate(results.map((plan) => structuredClone(plan)), query.limit, query.offset);
  }

  async deletePlan(workspaceId: string, investigationPlanId: string): Promise<boolean> {
    const key = planKey(workspaceId, investigationPlanId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.targetIndex.delete(`${workspaceId}:${existing.targetId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory investigation plan repository. */
export function createInMemoryInvestigationRepository(): InMemoryInvestigationRepository {
  return new InMemoryInvestigationRepository();
}
