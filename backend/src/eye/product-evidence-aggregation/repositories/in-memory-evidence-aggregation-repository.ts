import { randomUUID } from "node:crypto";

import type {
  ProductEvidenceSummary,
  ProductEvidenceSummaryCreateInput,
  ProductEvidenceSummaryUpdateInput,
} from "../models/product-evidence-summary.js";
import type {
  EvidenceAggregationListQuery,
  EvidenceAggregationRepository,
} from "./evidence-aggregation-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function productKey(workspaceId: string, productId: string): string {
  return `${workspaceId}:${productId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory EvidenceAggregationRepository for Mission 032 tests and local development. */
export class InMemoryEvidenceAggregationRepository implements EvidenceAggregationRepository {
  private readonly store = new Map<string, ProductEvidenceSummary>();
  private readonly productIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: ProductEvidenceSummaryCreateInput,
  ): Promise<ProductEvidenceSummary> {
    const existingId = this.productIndex.get(productKey(workspaceId, input.productId));
    if (existingId) {
      return this.update(workspaceId, existingId, input);
    }

    const timestamp = nowIso();
    const summary: ProductEvidenceSummary = {
      id: randomUUID(),
      workspaceId,
      productId: input.productId,
      totalSignals: input.totalSignals,
      sourceDiversity: input.sourceDiversity,
      averageStrength: input.averageStrength,
      averageConfidence: input.averageConfidence,
      strongestSource: input.strongestSource,
      weakestSource: input.weakestSource,
      evidenceScore: input.evidenceScore,
      trendDirection: input.trendDirection,
      riskFlags: [...input.riskFlags],
      sourceBreakdown: input.sourceBreakdown.map((entry) => ({ ...entry })),
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, summary.id), summary);
    this.productIndex.set(productKey(workspaceId, summary.productId), summary.id);
    return structuredClone(summary);
  }

  async getById(workspaceId: string, id: string): Promise<ProductEvidenceSummary | null> {
    const summary = this.store.get(storageKey(workspaceId, id));
    return summary ? structuredClone(summary) : null;
  }

  async getByProductId(workspaceId: string, productId: string): Promise<ProductEvidenceSummary | null> {
    const id = this.productIndex.get(productKey(workspaceId, productId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: ProductEvidenceSummaryUpdateInput,
  ): Promise<ProductEvidenceSummary> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ProductEvidenceSummary not found: ${id}`);
    }

    const updated: ProductEvidenceSummary = {
      ...existing,
      totalSignals: input.totalSignals ?? existing.totalSignals,
      sourceDiversity: input.sourceDiversity ?? existing.sourceDiversity,
      averageStrength: input.averageStrength ?? existing.averageStrength,
      averageConfidence: input.averageConfidence ?? existing.averageConfidence,
      strongestSource: input.strongestSource ?? existing.strongestSource,
      weakestSource: input.weakestSource ?? existing.weakestSource,
      evidenceScore: input.evidenceScore ?? existing.evidenceScore,
      trendDirection: input.trendDirection ?? existing.trendDirection,
      riskFlags: input.riskFlags ? [...input.riskFlags] : existing.riskFlags,
      sourceBreakdown: input.sourceBreakdown
        ? input.sourceBreakdown.map((entry) => ({ ...entry }))
        : existing.sourceBreakdown,
      signals: input.signals ? input.signals.map((signal) => ({ ...signal })) : existing.signals,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const existing = this.store.get(storageKey(workspaceId, id));
    if (!existing) return false;

    this.store.delete(storageKey(workspaceId, id));
    this.productIndex.delete(productKey(workspaceId, existing.productId));
    return true;
  }

  async list(query: EvidenceAggregationListQuery): Promise<ProductEvidenceSummary[]> {
    let results = [...this.store.values()].filter(
      (summary) => summary.workspaceId === query.workspaceId,
    );

    if (query.productId) {
      results = results.filter((summary) => summary.productId === query.productId);
    }
    if (query.minEvidenceScore !== undefined) {
      results = results.filter((summary) => summary.evidenceScore >= query.minEvidenceScore!);
    }

    results.sort((left, right) => right.evidenceScore - left.evidenceScore);
    return paginate(results.map((summary) => structuredClone(summary)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory evidence aggregation repository. */
export function createInMemoryEvidenceAggregationRepository(): InMemoryEvidenceAggregationRepository {
  return new InMemoryEvidenceAggregationRepository();
}
