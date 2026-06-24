import { randomUUID } from "node:crypto";

import type {
  GlobalProductSignal,
  GlobalProductSignalCreateInput,
  GlobalProductSignalUpdateInput,
} from "../models/product-signal.js";
import { computeSignalConfidence } from "../utilities/signal-normalization.js";
import type { ProductSignalRegistry, ProductSignalRegistryQuery } from "./product-signal-registry.js";

function storageKey(workspaceId: string, signalId: string): string {
  return `${workspaceId}:${signalId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory ProductSignalRegistry for Mission 031 tests and local development. */
export class InMemoryProductSignalRegistry implements ProductSignalRegistry {
  private readonly store = new Map<string, GlobalProductSignal>();

  async register(
    workspaceId: string,
    input: GlobalProductSignalCreateInput,
  ): Promise<GlobalProductSignal> {
    const timestamp = nowIso();
    const signal: GlobalProductSignal = {
      signalId: randomUUID(),
      workspaceId,
      productId: input.productId,
      source: input.source,
      timestamp: input.timestamp ?? timestamp,
      strength: input.strength,
      confidence:
        input.confidence ??
        computeSignalConfidence(input.source, input.strength, input.evidence.length),
      evidence: input.evidence.map((item) => ({ ...item })),
      metadata: { ...(input.metadata ?? {}) },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, signal.signalId), signal);
    return structuredClone(signal);
  }

  async getById(workspaceId: string, signalId: string): Promise<GlobalProductSignal | null> {
    const signal = this.store.get(storageKey(workspaceId, signalId));
    return signal ? structuredClone(signal) : null;
  }

  async update(
    workspaceId: string,
    signalId: string,
    input: GlobalProductSignalUpdateInput,
  ): Promise<GlobalProductSignal> {
    const key = storageKey(workspaceId, signalId);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`GlobalProductSignal not found: ${signalId}`);
    }

    const strength = input.strength ?? existing.strength;
    const evidence = input.evidence ? input.evidence.map((item) => ({ ...item })) : existing.evidence;
    const source = existing.source;

    const updated: GlobalProductSignal = {
      ...existing,
      timestamp: input.timestamp ?? existing.timestamp,
      strength,
      confidence:
        input.confidence ?? computeSignalConfidence(source, strength, evidence.length),
      evidence,
      metadata: input.metadata ? { ...input.metadata } : existing.metadata,
      updatedAt: nowIso(),
    };
    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, signalId: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, signalId));
  }

  async list(query: ProductSignalRegistryQuery): Promise<GlobalProductSignal[]> {
    let results = [...this.store.values()].filter((signal) => signal.workspaceId === query.workspaceId);

    if (query.productId) {
      results = results.filter((signal) => signal.productId === query.productId);
    }
    if (query.source) {
      results = results.filter((signal) => signal.source === query.source);
    }
    if (query.minStrength !== undefined) {
      results = results.filter((signal) => signal.strength >= query.minStrength!);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((signal) => signal.confidence >= query.minConfidence!);
    }
    if (query.since) {
      results = results.filter((signal) => signal.timestamp >= query.since!);
    }

    results.sort(
      (left, right) =>
        right.timestamp.localeCompare(left.timestamp) || right.confidence - left.confidence,
    );
    return paginate(results.map((signal) => structuredClone(signal)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory product signal registry. */
export function createInMemoryProductSignalRegistry(): InMemoryProductSignalRegistry {
  return new InMemoryProductSignalRegistry();
}
