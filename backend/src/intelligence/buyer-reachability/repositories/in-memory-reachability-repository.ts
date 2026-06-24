import { randomUUID } from "node:crypto";

import type {
  ReachabilityProfile,
  ReachabilityProfileCreateInput,
  ReachabilityProfileUpdateInput,
} from "../models/reachability-profile.js";
import type { ReachabilityListQuery, ReachabilityRepository } from "./reachability-repository.js";

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

function personaKey(workspaceId: string, buyerPersonaId: string): string {
  return `${workspaceId}:${buyerPersonaId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory ReachabilityRepository for Mission 026 tests and local development. */
export class InMemoryReachabilityRepository implements ReachabilityRepository {
  private readonly store = new Map<string, ReachabilityProfile>();
  private readonly personaIndex = new Map<string, string>();

  async create(
    workspaceId: string,
    input: ReachabilityProfileCreateInput,
  ): Promise<ReachabilityProfile> {
    const timestamp = nowIso();
    const profile: ReachabilityProfile = {
      id: randomUUID(),
      workspaceId,
      buyerPersonaId: input.buyerPersonaId,
      dimensions: { ...input.dimensions },
      channels: input.channels.map((channel) => ({ ...channel })),
      topChannels: [...input.topChannels],
      confidence: input.confidence,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(storageKey(workspaceId, profile.id), profile);
    this.personaIndex.set(personaKey(workspaceId, profile.buyerPersonaId), profile.id);
    return structuredClone(profile);
  }

  async getById(workspaceId: string, id: string): Promise<ReachabilityProfile | null> {
    const profile = this.store.get(storageKey(workspaceId, id));
    return profile ? structuredClone(profile) : null;
  }

  async getByPersonaId(
    workspaceId: string,
    buyerPersonaId: string,
  ): Promise<ReachabilityProfile | null> {
    const id = this.personaIndex.get(personaKey(workspaceId, buyerPersonaId));
    if (!id) return null;
    return this.getById(workspaceId, id);
  }

  async update(
    workspaceId: string,
    id: string,
    input: ReachabilityProfileUpdateInput,
  ): Promise<ReachabilityProfile> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`ReachabilityProfile not found: ${id}`);
    }

    const updated: ReachabilityProfile = {
      ...existing,
      dimensions: input.dimensions ? { ...input.dimensions } : existing.dimensions,
      channels: input.channels ? input.channels.map((channel) => ({ ...channel })) : existing.channels,
      topChannels: input.topChannels ? [...input.topChannels] : existing.topChannels,
      confidence: input.confidence ?? existing.confidence,
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
    this.personaIndex.delete(personaKey(workspaceId, existing.buyerPersonaId));
    return true;
  }

  async list(query: ReachabilityListQuery): Promise<ReachabilityProfile[]> {
    let results = [...this.store.values()].filter(
      (profile) => profile.workspaceId === query.workspaceId,
    );

    if (query.buyerPersonaId) {
      results = results.filter((profile) => profile.buyerPersonaId === query.buyerPersonaId);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((profile) => profile.confidence >= query.minConfidence!);
    }

    results.sort((left, right) => right.confidence - left.confidence);
    return paginate(results.map((profile) => structuredClone(profile)), query.limit, query.offset);
  }
}

/** Factory for a fresh in-memory reachability repository. */
export function createInMemoryReachabilityRepository(): InMemoryReachabilityRepository {
  return new InMemoryReachabilityRepository();
}
