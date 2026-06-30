import { randomUUID } from "node:crypto";

import {
  computePortfolioStats,
  type OpportunityPortfolio,
  type PortfolioState,
} from "../models/opportunity-portfolio.js";
import type { PortfolioEntry, PortfolioEntryCreateInput } from "../models/portfolio-entry.js";
import type {
  PortfolioRepository,
  PortfolioRepositoryQuery,
} from "./portfolio-repository.js";

function portfolioKey(workspaceId: string): string {
  return `${workspaceId}:portfolio`;
}

function entryKey(workspaceId: string, entryId: string): string {
  return `${workspaceId}:entry:${entryId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(items: T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  const end = limit === undefined ? undefined : start + limit;
  return items.slice(start, end);
}

/** In-memory PortfolioRepository for Mission 044 tests and local development. */
export class InMemoryPortfolioRepository implements PortfolioRepository {
  private readonly portfolios = new Map<string, OpportunityPortfolio>();
  private readonly entries = new Map<string, PortfolioEntry>();
  private readonly revenueOpportunityIndex = new Map<string, string>();

  private listEntriesForWorkspace(workspaceId: string): PortfolioEntry[] {
    return [...this.entries.values()].filter((entry) => entry.workspaceId === workspaceId);
  }

  private refreshPortfolio(workspaceId: string): OpportunityPortfolio {
    const entries = this.listEntriesForWorkspace(workspaceId);
    const stats = computePortfolioStats(entries);
    const timestamp = nowIso();
    const existing = this.portfolios.get(portfolioKey(workspaceId));

    const portfolio: OpportunityPortfolio = {
      portfolioId: existing?.portfolioId ?? randomUUID(),
      workspaceId,
      ...stats,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    this.portfolios.set(portfolioKey(workspaceId), portfolio);
    return structuredClone(portfolio);
  }

  async ensurePortfolio(workspaceId: string): Promise<OpportunityPortfolio> {
    const existing = this.portfolios.get(portfolioKey(workspaceId));
    if (existing) {
      return this.refreshPortfolio(workspaceId);
    }
    return this.refreshPortfolio(workspaceId);
  }

  async getPortfolio(workspaceId: string): Promise<OpportunityPortfolio | null> {
    const portfolio = this.portfolios.get(portfolioKey(workspaceId));
    if (!portfolio && this.listEntriesForWorkspace(workspaceId).length === 0) {
      return null;
    }
    return this.refreshPortfolio(workspaceId);
  }

  async saveEntry(
    workspaceId: string,
    input: PortfolioEntryCreateInput,
  ): Promise<PortfolioEntry> {
    const revenueKey = `${workspaceId}:${input.revenueOpportunityId}`;
    const existingId = this.revenueOpportunityIndex.get(revenueKey);
    const timestamp = nowIso();
    const portfolio = await this.ensurePortfolio(workspaceId);

    if (existingId) {
      const key = entryKey(workspaceId, existingId);
      const existing = this.entries.get(key);
      if (existing) {
        const updated: PortfolioEntry = {
          ...existing,
          state: input.state,
          portfolioScore: input.portfolioScore,
          capitalPriority: input.capitalPriority,
          attentionPriority: input.attentionPriority,
          riskLevel: input.riskLevel,
          recommendedState: input.recommendedState,
          signals: input.signals.map((signal) => ({ ...signal })),
          updatedAt: timestamp,
        };
        this.entries.set(key, updated);
        this.refreshPortfolio(workspaceId);
        return structuredClone(updated);
      }
    }

    const entry: PortfolioEntry = {
      entryId: randomUUID(),
      portfolioId: portfolio.portfolioId,
      workspaceId,
      revenueOpportunityId: input.revenueOpportunityId,
      productId: input.productId,
      opportunityType: input.opportunityType,
      state: input.state,
      portfolioScore: input.portfolioScore,
      capitalPriority: input.capitalPriority,
      attentionPriority: input.attentionPriority,
      riskLevel: input.riskLevel,
      recommendedState: input.recommendedState,
      signals: input.signals.map((signal) => ({ ...signal })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.entries.set(entryKey(workspaceId, entry.entryId), entry);
    this.revenueOpportunityIndex.set(revenueKey, entry.entryId);
    this.refreshPortfolio(workspaceId);
    return structuredClone(entry);
  }

  async getEntry(workspaceId: string, entryId: string): Promise<PortfolioEntry | null> {
    const entry = this.entries.get(entryKey(workspaceId, entryId));
    return entry ? structuredClone(entry) : null;
  }

  async getEntryByRevenueOpportunity(
    workspaceId: string,
    revenueOpportunityId: string,
  ): Promise<PortfolioEntry | null> {
    const entryId = this.revenueOpportunityIndex.get(`${workspaceId}:${revenueOpportunityId}`);
    if (!entryId) {
      return null;
    }
    return this.getEntry(workspaceId, entryId);
  }

  async listEntries(query: PortfolioRepositoryQuery): Promise<PortfolioEntry[]> {
    let results = this.listEntriesForWorkspace(query.workspaceId);

    if (query.state) {
      results = results.filter((entry) => entry.state === query.state);
    }
    if (query.productId) {
      results = results.filter((entry) => entry.productId === query.productId);
    }
    if (query.revenueOpportunityId) {
      results = results.filter(
        (entry) => entry.revenueOpportunityId === query.revenueOpportunityId,
      );
    }
    if (query.minPortfolioScore !== undefined) {
      results = results.filter((entry) => entry.portfolioScore >= query.minPortfolioScore!);
    }

    results.sort(
      (left, right) =>
        right.portfolioScore - left.portfolioScore ||
        left.productId.localeCompare(right.productId),
    );

    return paginate(results.map((entry) => structuredClone(entry)), query.limit, query.offset);
  }

  async deleteEntry(workspaceId: string, entryId: string): Promise<boolean> {
    const key = entryKey(workspaceId, entryId);
    const existing = this.entries.get(key);
    if (!existing) {
      return false;
    }
    this.revenueOpportunityIndex.delete(`${workspaceId}:${existing.revenueOpportunityId}`);
    const deleted = this.entries.delete(key);
    this.refreshPortfolio(workspaceId);
    return deleted;
  }
}

/** Factory for a fresh in-memory portfolio repository. */
export function createInMemoryPortfolioRepository(): InMemoryPortfolioRepository {
  return new InMemoryPortfolioRepository();
}

export type { PortfolioState };
