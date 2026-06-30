import { randomUUID } from "node:crypto";

import type {
  LandingPageContent,
  LandingPageContentCreateInput,
} from "../models/landing-page-content.js";
import type {
  ContentRepository,
  ContentRepositoryQuery,
} from "./content-repository.js";

function recordKey(workspaceId: string, contentId: string): string {
  return `${workspaceId}:content:${contentId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory ContentRepository for Mission 050 tests and local development. */
export class InMemoryContentRepository implements ContentRepository {
  private readonly store = new Map<string, LandingPageContent>();
  private readonly pageIndex = new Map<string, string>();

  async save(
    workspaceId: string,
    input: LandingPageContentCreateInput,
  ): Promise<LandingPageContent> {
    const pageKey = `${workspaceId}:${input.pageId}`;
    const existingId = this.pageIndex.get(pageKey);
    const timestamp = nowIso();

    if (existingId) {
      const key = recordKey(workspaceId, existingId);
      const existing = this.store.get(key);
      if (existing) {
        const updated: LandingPageContent = {
          ...existing,
          heroCopy: input.heroCopy,
          problemCopy: input.problemCopy,
          solutionCopy: input.solutionCopy,
          benefitsCopy: input.benefitsCopy,
          offerCopy: input.offerCopy,
          socialProofCopy: input.socialProofCopy,
          faqCopy: input.faqCopy,
          ctaCopy: input.ctaCopy,
          confidence: input.confidence,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.store.set(key, updated);
        return structuredClone(updated);
      }
    }

    const record: LandingPageContent = {
      contentId: randomUUID(),
      workspaceId,
      pageId: input.pageId,
      offerId: input.offerId,
      brandId: input.brandId,
      productId: input.productId,
      heroCopy: input.heroCopy,
      problemCopy: input.problemCopy,
      solutionCopy: input.solutionCopy,
      benefitsCopy: input.benefitsCopy,
      offerCopy: input.offerCopy,
      socialProofCopy: input.socialProofCopy,
      faqCopy: input.faqCopy,
      ctaCopy: input.ctaCopy,
      confidence: input.confidence,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.store.set(recordKey(workspaceId, record.contentId), record);
    this.pageIndex.set(pageKey, record.contentId);
    return structuredClone(record);
  }

  async getById(workspaceId: string, contentId: string): Promise<LandingPageContent | null> {
    const record = this.store.get(recordKey(workspaceId, contentId));
    return record ? structuredClone(record) : null;
  }

  async getByPage(workspaceId: string, pageId: string): Promise<LandingPageContent | null> {
    const contentId = this.pageIndex.get(`${workspaceId}:${pageId}`);
    if (!contentId) {
      return null;
    }
    return this.getById(workspaceId, contentId);
  }

  async list(query: ContentRepositoryQuery): Promise<LandingPageContent[]> {
    let results = [...this.store.values()].filter(
      (record) => record.workspaceId === query.workspaceId,
    );

    if (query.pageId) {
      results = results.filter((record) => record.pageId === query.pageId);
    }
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
        right.confidence - left.confidence || left.pageId.localeCompare(right.pageId),
    );

    return paginate(results.map((record) => structuredClone(record)), query.limit, query.offset);
  }

  async delete(workspaceId: string, contentId: string): Promise<boolean> {
    const key = recordKey(workspaceId, contentId);
    const existing = this.store.get(key);
    if (!existing) {
      return false;
    }
    this.pageIndex.delete(`${workspaceId}:${existing.pageId}`);
    return this.store.delete(key);
  }
}

/** Factory for a fresh in-memory content repository. */
export function createInMemoryContentRepository(): InMemoryContentRepository {
  return new InMemoryContentRepository();
}
