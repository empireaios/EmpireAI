import { randomUUID } from "node:crypto";

import type {
  LandingPageBlueprint,
  LandingPageBlueprintCreateInput,
} from "../models/landing-page-blueprint.js";
import type {
  BlueprintRepository,
  BlueprintRepositoryQuery,
} from "./blueprint-repository.js";
import type { LandingPageSection } from "../models/landing-page-section.js";

function recordKey(workspaceId: string, pageId: string): string {
  return `${workspaceId}:blueprint:${pageId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

function cloneSection(section: LandingPageSection): LandingPageSection {
  return {
    ...section,
    bullets: [...section.bullets],
  };
}

/** In-memory BlueprintRepository for Mission 049 tests and local development. */
export class InMemoryBlueprintRepository implements BlueprintRepository {
  private readonly store = new Map<string, LandingPageBlueprint>();
  private readonly offerIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: LandingPageBlueprintCreateInput,
  ): Promise<LandingPageBlueprint> {
    const offerKey = `${workspaceId}:${input.offerId}`;
    const existingId = this.offerIndex.get(offerKey);
    const timestamp = nowIso();

    const sections = {
      heroSection: cloneSection(input.heroSection),
      problemSection: cloneSection(input.problemSection),
      solutionSection: cloneSection(input.solutionSection),
      benefitsSection: cloneSection(input.benefitsSection),
      offerSection: cloneSection(input.offerSection),
      socialProofSection: cloneSection(input.socialProofSection),
      faqSection: cloneSection(input.faqSection),
      ctaSection: cloneSection(input.ctaSection),
    };

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: LandingPageBlueprint = {
          ...existing,
          pageTitle: input.pageTitle,
          ...sections,
          confidence: input.confidence,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: LandingPageBlueprint = {
      pageId: randomUUID(),
      workspaceId,
      offerId: input.offerId,
      brandId: input.brandId,
      productId: input.productId,
      pageTitle: input.pageTitle,
      ...sections,
      confidence: input.confidence,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.pageId), record);
    this.offerIndex.set(offerKey, record.pageId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, pageId: string): Promise<LandingPageBlueprint | null> {
    const record = this.store.get(recordKey(workspaceId, pageId));
    return record ? structuredClone(record) : null;
  }

  async getByOffer(
    workspaceId: string,
    offerId: string,
  ): Promise<LandingPageBlueprint | null> {
    const pageId = this.offerIndex.get(`${workspaceId}:${offerId}`);
    if (!pageId) {
      return null;
    }
    return this.getById(workspaceId, pageId);
  }

  async list(query: BlueprintRepositoryQuery): Promise<LandingPageBlueprint[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.offerId) {
      results = results.filter((record) => record.offerId === query.offerId);
    }
    if (query.brandId) {
      results = results.filter((record) => record.brandId === query.brandId);
    }
    if (query.productId) {
      results = results.filter((record) => record.productId === query.productId);
    }
    if (query.minConfidence !== undefined) {
      results = results.filter((record) => record.confidence >= query.minConfidence!);
    }

    results.sort(
      (left, right) =>
        right.confidence - left.confidence || left.pageTitle.localeCompare(right.pageTitle),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, pageId: string): Promise<boolean> {
    const key = recordKey(workspaceId, pageId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.offerIndex.delete(`${workspaceId}:${existing.offerId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory blueprint repository. */
export function createInMemoryBlueprintRepository(): InMemoryBlueprintRepository {
  return new InMemoryBlueprintRepository();
}
