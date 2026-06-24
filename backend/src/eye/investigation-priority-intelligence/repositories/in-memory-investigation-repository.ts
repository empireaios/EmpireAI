import { randomUUID } from "node:crypto";

import type {
  InvestigationPriority,
} from "../models/investigation-priority.js";
import type { InvestigationPriorityScoreBreakdown } from "../scoring/priority-scoring.js";
import type { InvestigationTarget, InvestigationTargetInput } from "../models/investigation-target.js";
import type {
  InvestigationRepository,
  InvestigationRepositoryQuery,
} from "./investigation-repository.js";

function targetKey(workspaceId: string, targetId: string): string {
  return `${workspaceId}:target:${targetId}`;
}

function priorityKey(workspaceId: string, priorityId: string): string {
  return `${workspaceId}:priority:${priorityId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory InvestigationRepository for Mission 039 tests and local development. */
export class InMemoryInvestigationRepository implements InvestigationRepository {
  private readonly targets = new Map<string, InvestigationTarget>();
  private readonly priorities = new Map<string, InvestigationPriority>();
  private readonly productTargetIndex = new Map<string, string>();
  private readonly productPriorityIndex = new Map<string, string>();

  async upsertTarget(
    workspaceId: string,
    input: InvestigationTargetInput,
  ): Promise<InvestigationTarget> {
    const productKey = `${workspaceId}:${input.productId}`;
    const existingId = this.productTargetIndex.get(productKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = targetKey(workspaceId, existingId);
      const existing = this.targets.get(key);
      if (existing) {
        const updated: InvestigationTarget = {
          ...existing,
          buyerPersonaId: input.buyerPersonaId ?? existing.buyerPersonaId,
          label: input.label ?? existing.label,
          primarySource: input.primarySource ?? existing.primarySource,
          updatedAt: timestamp,
        };
        this.targets.set(key, updated);
        return structuredClone(updated);
      }
    }

    const target: InvestigationTarget = {
      targetId: randomUUID(),
      workspaceId,
      productId: input.productId,
      buyerPersonaId: input.buyerPersonaId ?? null,
      label: input.label ?? `Investigate ${input.productId}`,
      primarySource: input.primarySource ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.targets.set(targetKey(workspaceId, target.targetId), target);
    this.productTargetIndex.set(productKey, target.targetId);
    return structuredClone(target);
  }

  async getTargetByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<InvestigationTarget | null> {
    const targetId = this.productTargetIndex.get(`${workspaceId}:${productId}`);
    if (!targetId) {
      return null;
    }
    return this.getTargetById(workspaceId, targetId);
  }

  async getTargetById(workspaceId: string, targetId: string): Promise<InvestigationTarget | null> {
    const target = this.targets.get(targetKey(workspaceId, targetId));
    return target ? structuredClone(target) : null;
  }

  async savePriority(
    workspaceId: string,
    targetId: string,
    input: InvestigationPriorityScoreBreakdown,
  ): Promise<InvestigationPriority> {
    const productKey = `${workspaceId}:${input.productId}`;
    const existingId = this.productPriorityIndex.get(productKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = priorityKey(workspaceId, existingId);
      const existing = this.priorities.get(key);
      if (existing) {
        const updated: InvestigationPriority = {
          ...existing,
          targetId,
          opportunityScore: input.opportunityScore,
          trendForecastScore: input.trendForecastScore,
          trustScore: input.trustScore,
          urgencyScore: input.urgencyScore,
          uncertaintyScore: input.uncertaintyScore,
          investigationPriorityScore: input.investigationPriorityScore,
          priorityLevel: input.priorityLevel,
          rationale: input.rationale,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.priorities.set(key, updated);
        return structuredClone(updated);
      }
    }

    const priority: InvestigationPriority = {
      id: randomUUID(),
      workspaceId,
      targetId,
      productId: input.productId,
      opportunityScore: input.opportunityScore,
      trendForecastScore: input.trendForecastScore,
      trustScore: input.trustScore,
      urgencyScore: input.urgencyScore,
      uncertaintyScore: input.uncertaintyScore,
      investigationPriorityScore: input.investigationPriorityScore,
      priorityLevel: input.priorityLevel,
      rationale: input.rationale,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.priorities.set(priorityKey(workspaceId, priority.id), priority);
    this.productPriorityIndex.set(productKey, priority.id);
    return structuredClone(priority);
  }

  async getPriorityByProduct(
    workspaceId: string,
    productId: string,
  ): Promise<InvestigationPriority | null> {
    const priorityId = this.productPriorityIndex.get(`${workspaceId}:${productId}`);
    if (!priorityId) {
      return null;
    }
    return this.getPriorityById(workspaceId, priorityId);
  }

  async getPriorityById(
    workspaceId: string,
    priorityId: string,
  ): Promise<InvestigationPriority | null> {
    const priority = this.priorities.get(priorityKey(workspaceId, priorityId));
    return priority ? structuredClone(priority) : null;
  }

  async listPriorities(query: InvestigationRepositoryQuery): Promise<InvestigationPriority[]> {
    let results = [...this.priorities.values()].filter(
      (priority) => priority.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((priority) => priority.productId === query.productId);
    }
    if (query.priorityLevel) {
      results = results.filter((priority) => priority.priorityLevel === query.priorityLevel);
    }
    if (query.minPriorityScore !== undefined) {
      results = results.filter(
        (priority) => priority.investigationPriorityScore >= query.minPriorityScore!,
      );
    }

    results.sort(
      (left, right) =>
        right.investigationPriorityScore - left.investigationPriorityScore ||
        left.productId.localeCompare(right.productId),
    );

    return paginate(results.map((priority) => structuredClone(priority)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory investigation repository. */
export function createInMemoryInvestigationRepository(): InMemoryInvestigationRepository {
  return new InMemoryInvestigationRepository();
}
