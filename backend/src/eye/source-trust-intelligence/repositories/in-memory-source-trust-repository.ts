import { randomUUID } from "node:crypto";

import type { SignalSource } from "../../global-product-signals/models/signal-source.js";
import type {
  SourceTrustProfile,
  SourceTrustProfileCreateInput,
} from "../models/source-trust-profile.js";
import type {
  SourceTrustRepository,
  SourceTrustRepositoryQuery,
} from "./source-trust-repository.js";

function profileKey(workspaceId: string, profileId: string): string {
  return `${workspaceId}:profile:${profileId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory SourceTrustRepository for Mission 038 tests and local development. */
export class InMemorySourceTrustRepository implements SourceTrustRepository {
  private readonly store = new Map<string, SourceTrustProfile>();
  private readonly sourceIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: SourceTrustProfileCreateInput,
  ): Promise<SourceTrustProfile> {
    const sourceKey = `${workspaceId}:${input.source}`;
    const existingId = this.sourceIndex.get(sourceKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = profileKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: SourceTrustProfile = {
          ...existing,
          connectorId: input.connectorId,
          historicalAccuracy: input.historicalAccuracy,
          signalConsistency: input.signalConsistency,
          noiseLevel: input.noiseLevel,
          manipulationRisk: input.manipulationRisk,
          reliabilityScore: input.reliabilityScore,
          trustScore: input.trustScore,
          trustTier: input.trustTier,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const profile: SourceTrustProfile = {
      id: randomUUID(),
      workspaceId,
      source: input.source,
      connectorId: input.connectorId,
      historicalAccuracy: input.historicalAccuracy,
      signalConsistency: input.signalConsistency,
      noiseLevel: input.noiseLevel,
      manipulationRisk: input.manipulationRisk,
      reliabilityScore: input.reliabilityScore,
      trustScore: input.trustScore,
      trustTier: input.trustTier,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(profileKey(workspaceId, profile.id), profile);
    this.sourceIndex.set(sourceKey, profile.id);
    return structuredClone(profile);
  }

  async getBySource(workspaceId: string, source: SignalSource): Promise<SourceTrustProfile | null> {
    const profileId = this.sourceIndex.get(`${workspaceId}:${source}`);
    if (!profileId) {
      return null;
    }
    return this.getById(workspaceId, profileId);
  }

  async getById(workspaceId: string, profileId: string): Promise<SourceTrustProfile | null> {
    const profile = this.store.get(profileKey(workspaceId, profileId));
    return profile ? structuredClone(profile) : null;
  }

  async list(query: SourceTrustRepositoryQuery): Promise<SourceTrustProfile[]> {
    let results = [...this.store.values()].filter(
      (profile) => profile.workspaceId === query.workspaceId,
    );

    if (query.source) {
      results = results.filter((profile) => profile.source === query.source);
    }
    if (query.trustTier) {
      results = results.filter((profile) => profile.trustTier === query.trustTier);
    }
    if (query.minTrustScore !== undefined) {
      results = results.filter((profile) => profile.trustScore >= query.minTrustScore!);
    }

    results.sort(
      (left, right) =>
        right.trustScore - left.trustScore || left.source.localeCompare(right.source),
    );

    return paginate(results.map((profile) => structuredClone(profile)), query.limit, query.offset);
  }

  async delete(workspaceId: string, profileId: string): Promise<boolean> {
    const key = profileKey(workspaceId, profileId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.sourceIndex.delete(`${workspaceId}:${existing.source}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory source trust repository. */
export function createInMemorySourceTrustRepository(): InMemorySourceTrustRepository {
  return new InMemorySourceTrustRepository();
}
