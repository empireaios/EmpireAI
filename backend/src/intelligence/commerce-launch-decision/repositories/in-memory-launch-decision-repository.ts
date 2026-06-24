import { randomUUID } from "node:crypto";

import type {
  CommerceLaunchDecision,
  CommerceLaunchDecisionCreateInput,
  CommerceLaunchDecisionUpdateInput,
} from "../models/commerce-launch-decision.js";
import type { LaunchDecisionListQuery, LaunchDecisionRepository } from "./launch-decision-repository.js";

function storageKey(workspaceId: string, decisionId: string): string {
  return `${workspaceId}:${decisionId}`;
}

function contextKey(
  workspaceId: string,
  productId: string,
  supplierId: string,
  opportunityId: string,
): string {
  return `${workspaceId}:${productId}:${supplierId}:${opportunityId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory LaunchDecisionRepository for Mission 030 tests and local development. */
export class InMemoryLaunchDecisionRepository implements LaunchDecisionRepository {
  private readonly store = new Map<string, CommerceLaunchDecision>();
  private readonly contextIndex = new Map<string, string>();

  async create(
    workspaceId: string,
    input: CommerceLaunchDecisionCreateInput,
  ): Promise<CommerceLaunchDecision> {
    const timestamp = nowIso();
    const decision: CommerceLaunchDecision = {
      decisionId: randomUUID(),
      workspaceId,
      productId: input.productId,
      supplierId: input.supplierId,
      buyerPersonaId: input.buyerPersonaId,
      opportunityId: input.opportunityId,
      decision: input.decision,
      launchScore: input.launchScore,
      confidence: input.confidence,
      reasons: [...input.reasons],
      risks: [...input.risks],
      recommendedChannels: [...input.recommendedChannels],
      suggestedTestBudget: input.suggestedTestBudget,
      expectedOutcome: input.expectedOutcome,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, decision.decisionId), decision);
    this.contextIndex.set(
      contextKey(workspaceId, decision.productId, decision.supplierId, decision.opportunityId),
      decision.decisionId,
    );
    return structuredClone(decision);
  }

  async getById(workspaceId: string, decisionId: string): Promise<CommerceLaunchDecision | null> {
    const decision = this.store.get(storageKey(workspaceId, decisionId));
    return decision ? structuredClone(decision) : null;
  }

  async getByContext(
    workspaceId: string,
    productId: string,
    supplierId: string,
    opportunityId: string,
  ): Promise<CommerceLaunchDecision | null> {
    const decisionId = this.contextIndex.get(contextKey(workspaceId, productId, supplierId, opportunityId));
    if (!decisionId) return null;
    return this.getById(workspaceId, decisionId);
  }

  async update(
    workspaceId: string,
    decisionId: string,
    input: CommerceLaunchDecisionUpdateInput,
  ): Promise<CommerceLaunchDecision> {
    const key = storageKey(workspaceId, decisionId);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`CommerceLaunchDecision not found: ${decisionId}`);
    }

    const updated: CommerceLaunchDecision = {
      ...existing,
      decision: input.decision ?? existing.decision,
      launchScore: input.launchScore ?? existing.launchScore,
      confidence: input.confidence ?? existing.confidence,
      reasons: input.reasons ? [...input.reasons] : existing.reasons,
      risks: input.risks ? [...input.risks] : existing.risks,
      recommendedChannels: input.recommendedChannels
        ? [...input.recommendedChannels]
        : existing.recommendedChannels,
      suggestedTestBudget: input.suggestedTestBudget ?? existing.suggestedTestBudget,
      expectedOutcome: input.expectedOutcome ?? existing.expectedOutcome,
      signals: input.signals ? input.signals.map((signal) => ({ ...signal })) : existing.signals,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, decisionId: string): Promise<boolean> {
    const existing = this.store.get(storageKey(workspaceId, decisionId));
    if (!existing) return false;

    this.store.delete(storageKey(workspaceId, decisionId));
    this.contextIndex.delete(
      contextKey(workspaceId, existing.productId, existing.supplierId, existing.opportunityId),
    );
    return true;
  }

  async list(query: LaunchDecisionListQuery): Promise<CommerceLaunchDecision[]> {
    let results = [...this.store.values()].filter(
      (decision) => decision.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((decision) => decision.productId === query.productId);
    }
    if (query.supplierId) {
      results = results.filter((decision) => decision.supplierId === query.supplierId);
    }
    if (query.buyerPersonaId) {
      results = results.filter((decision) => decision.buyerPersonaId === query.buyerPersonaId);
    }
    if (query.opportunityId) {
      results = results.filter((decision) => decision.opportunityId === query.opportunityId);
    }
    if (query.decision) {
      results = results.filter((decision) => decision.decision === query.decision);
    }
    if (query.minLaunchScore !== undefined) {
      results = results.filter((decision) => decision.launchScore >= query.minLaunchScore!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((decision) => decision.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) => right.launchScore - left.launchScore || right.confidence - left.confidence,
    );
    return paginate(results.map((decision) => structuredClone(decision)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory launch decision repository. */
export function createInMemoryLaunchDecisionRepository(): InMemoryLaunchDecisionRepository {
  return new InMemoryLaunchDecisionRepository();
}
