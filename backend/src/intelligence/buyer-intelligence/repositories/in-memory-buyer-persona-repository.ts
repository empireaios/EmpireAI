import { randomUUID } from "node:crypto";
import type {
  BuyerPersona,
  BuyerPersonaCreateInput,
  BuyerPersonaUpdateInput,
} from "../models/buyer-persona.js";
import { normalizeBuyerPersonaSlug } from "../models/buyer-persona.js";
import type { BuyerPersonaQuery, BuyerPersonaRepository } from "./buyer-intelligence-repository.js";

type StoredPersona = BuyerPersona;

function storageKey(workspaceId: string, id: string): string {
  return `${workspaceId}:${id}`;
}

/** In-memory BuyerPersonaRepository for Mission 023 tests and local development. */
export class InMemoryBuyerPersonaRepository implements BuyerPersonaRepository {
  private readonly store = new Map<string, StoredPersona>();

  async create(workspaceId: string, input: BuyerPersonaCreateInput): Promise<BuyerPersona> {
    const now = new Date().toISOString();
    const slug = input.slug.trim() || normalizeBuyerPersonaSlug(input.name);
    const persona: BuyerPersona = {
      id: randomUUID(),
      workspaceId,
      name: input.name,
      slug,
      description: input.description,
      demographics: { ...input.demographics },
      psychographics: {
        values: [...input.psychographics.values],
        interests: [...input.psychographics.interests],
        lifestyle: [...input.psychographics.lifestyle],
        buyingMotivations: input.psychographics.buyingMotivations
          ? [...input.psychographics.buyingMotivations]
          : undefined,
      },
      painPoints: [...input.painPoints],
      goals: [...input.goals],
      sourceObservationIds: [...input.sourceObservationIds],
      confidence: input.confidence,
      tags: [...input.tags],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(storageKey(workspaceId, persona.id), persona);
    return structuredClone(persona);
  }

  async getById(workspaceId: string, id: string): Promise<BuyerPersona | null> {
    const persona = this.store.get(storageKey(workspaceId, id));
    return persona ? structuredClone(persona) : null;
  }

  async getBySlug(workspaceId: string, slug: string): Promise<BuyerPersona | null> {
    const normalized = normalizeBuyerPersonaSlug(slug);
    for (const persona of this.store.values()) {
      if (persona.workspaceId === workspaceId && persona.slug === normalized) {
        return structuredClone(persona);
      }
    }
    return null;
  }

  async update(
    workspaceId: string,
    id: string,
    input: BuyerPersonaUpdateInput,
  ): Promise<BuyerPersona> {
    const key = storageKey(workspaceId, id);
    const existing = this.store.get(key);
    if (!existing) {
      throw new Error(`BuyerPersona not found: ${id}`);
    }

    const updated: BuyerPersona = {
      ...existing,
      name: input.name ?? existing.name,
      slug: input.slug ? normalizeBuyerPersonaSlug(input.slug) : existing.slug,
      description: input.description ?? existing.description,
      demographics: input.demographics ? { ...existing.demographics, ...input.demographics } : existing.demographics,
      psychographics: input.psychographics
        ? {
            values: input.psychographics.values ?? existing.psychographics.values,
            interests: input.psychographics.interests ?? existing.psychographics.interests,
            lifestyle: input.psychographics.lifestyle ?? existing.psychographics.lifestyle,
            buyingMotivations:
              input.psychographics.buyingMotivations ?? existing.psychographics.buyingMotivations,
          }
        : existing.psychographics,
      painPoints: input.painPoints ?? existing.painPoints,
      goals: input.goals ?? existing.goals,
      sourceObservationIds: input.sourceObservationIds ?? existing.sourceObservationIds,
      confidence: input.confidence ?? existing.confidence,
      tags: input.tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    };

    this.store.set(key, updated);
    return structuredClone(updated);
  }

  async delete(workspaceId: string, id: string): Promise<boolean> {
    return this.store.delete(storageKey(workspaceId, id));
  }

  async list(query: BuyerPersonaQuery): Promise<BuyerPersona[]> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const normalizedSlug = query.slug ? normalizeBuyerPersonaSlug(query.slug) : undefined;

    const matches = [...this.store.values()].filter((persona) => {
      if (persona.workspaceId !== query.workspaceId) return false;
      if (normalizedSlug && persona.slug !== normalizedSlug) return false;
      if (query.tag && !persona.tags.includes(query.tag)) return false;
      if (query.nameContains && !persona.name.toLowerCase().includes(query.nameContains.toLowerCase())) {
        return false;
      }
      return true;
    });

    return matches.slice(offset, offset + limit).map((persona) => structuredClone(persona));
  }

  clear(): void {
    this.store.clear();
  }
}

/** Creates a fresh in-memory buyer persona repository instance. */
export function createInMemoryBuyerPersonaRepository(): InMemoryBuyerPersonaRepository {
  return new InMemoryBuyerPersonaRepository();
}
