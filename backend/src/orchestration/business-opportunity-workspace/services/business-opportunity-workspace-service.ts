import { randomUUID } from "node:crypto";

import { getGovernanceEngine } from "../../../foundation/empire-governance/services/governance-engine.js";
import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import {
  getProductDiscoveryRepository,
  listDiscoverySessions,
} from "../../product-discovery-opportunity-engine/index.js";
import type {
  ApprovalHistoryEntry,
  BusinessOpportunityComparison,
  BusinessOpportunityListFilters,
  BusinessOpportunityRecord,
  BusinessWorkspaceDashboard,
} from "../models/business-opportunity.js";
import {
  getBusinessOpportunityRepository,
  resetBusinessOpportunityRepository,
} from "../repositories/sqlite-business-opportunity-repository.js";
import {
  buildBusinessOpportunitiesFromSession,
  buildBusinessOpportunityRecord,
} from "./business-opportunity-builder.js";

export { getBusinessOpportunityRepository, resetBusinessOpportunityRepository };

const MARKETPLACE_PRIORITY: Record<string, number> = {
  amazon: 95,
  "tiktok-shop": 88,
  shopify: 85,
  walmart: 80,
  ebay: 72,
  "google-merchant-center": 70,
  "instagram-shop": 68,
  "meta-business": 65,
};

export class BusinessOpportunityNotFoundError extends Error {
  constructor(businessOpportunityId: string) {
    super(`Business opportunity not found: ${businessOpportunityId}`);
    this.name = "BusinessOpportunityNotFoundError";
  }
}

export class BusinessOpportunityBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessOpportunityBlockedError";
  }
}

function captureWorkspaceSoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

function recordHistory(
  record: BusinessOpportunityRecord,
  action: ApprovalHistoryEntry["action"],
  actor: string,
  newStatus: BusinessOpportunityRecord["status"],
  previousStatus?: BusinessOpportunityRecord["status"],
  reason?: string,
): ApprovalHistoryEntry {
  const entry: ApprovalHistoryEntry = {
    historyId: `bwh:${randomUUID()}`,
    businessOpportunityId: record.businessOpportunityId,
    workspaceId: record.workspaceId,
    companyId: record.companyId,
    action,
    actor,
    reason,
    previousStatus,
    newStatus,
    recordedAt: new Date().toISOString(),
  };
  getBusinessOpportunityRepository().saveHistory(entry);
  return entry;
}

/** Syncs workspace cards from LIVE-005 discovery sessions — no publishing. */
export function syncWorkspaceFromDiscovery(
  workspaceId: string,
  companyId: string,
  sessionId?: string,
): BusinessOpportunityRecord[] {
  const repository = getBusinessOpportunityRepository();
  const existing = repository.listOpportunities(workspaceId, companyId);
  const existingSourceIds = new Set(existing.map((entry) => entry.sourceOpportunityId));

  const sessions = sessionId
    ? [getProductDiscoveryRepository().getSession(sessionId)].filter(Boolean)
    : listDiscoverySessions(workspaceId, companyId).filter((entry) => entry.opportunities.length > 0);

  if (sessions.length === 0) {
    return existing;
  }

  const synced: BusinessOpportunityRecord[] = [];
  for (const session of sessions) {
    if (!session) continue;
    for (const opportunity of session.opportunities) {
      if (existingSourceIds.has(opportunity.opportunityId)) {
        const prior = existing.find((entry) => entry.sourceOpportunityId === opportunity.opportunityId);
        if (prior) synced.push(prior);
        continue;
      }
      const record = buildBusinessOpportunityRecord(session, opportunity);
      const saved = repository.saveOpportunity(record);
      recordHistory(saved, "DISCOVERED", session.actor ?? "business-workspace", "DISCOVERED");
      existingSourceIds.add(opportunity.opportunityId);
      synced.push(saved);
    }
  }

  const syncedIds = new Set(synced.map((entry) => entry.businessOpportunityId));
  return [
    ...existing.filter((entry) => !syncedIds.has(entry.businessOpportunityId)),
    ...synced,
  ];
}

function applyFilters(
  records: BusinessOpportunityRecord[],
  filters?: BusinessOpportunityListFilters,
): BusinessOpportunityRecord[] {
  let result = [...records];
  if (filters?.status) {
    result = result.filter((entry) => entry.status === filters.status);
  }
  if (filters?.category) {
    result = result.filter((entry) => entry.brand.category === filters.category);
  }
  if (filters?.favorite === true) {
    result = result.filter((entry) => entry.favorite);
  }
  if (filters?.minDominationScore !== undefined) {
    result = result.filter((entry) => entry.economics.dominationScore >= filters.minDominationScore!);
  }
  if (filters?.minExpectedRoi !== undefined) {
    result = result.filter((entry) => entry.economics.expectedRoi >= filters.minExpectedRoi!);
  }

  const sortBy = filters?.sortBy ?? "rank";
  result.sort((a, b) => {
    switch (sortBy) {
      case "dominationScore":
        return b.economics.dominationScore - a.economics.dominationScore;
      case "expectedRoi":
        return b.economics.expectedRoi - a.economics.expectedRoi;
      case "launchConfidence":
        return b.economics.launchConfidence - a.economics.launchConfidence;
      default:
        return a.rank - b.rank;
    }
  });

  return result;
}

export function listBusinessOpportunities(
  workspaceId: string,
  companyId: string,
  filters?: BusinessOpportunityListFilters,
  options?: { sync?: boolean },
): BusinessOpportunityRecord[] {
  if (options?.sync !== false) {
    syncWorkspaceFromDiscovery(workspaceId, companyId);
  }
  const records = getBusinessOpportunityRepository().listOpportunities(workspaceId, companyId);
  return applyFilters(records, filters);
}

function compareWinner(a: number, b: number): "A" | "B" | "TIE" {
  if (Math.abs(a - b) < 0.5) return "TIE";
  return a > b ? "A" : "B";
}

function marketplaceScore(marketplace: string): number {
  return MARKETPLACE_PRIORITY[marketplace] ?? 60;
}

export function compareBusinessOpportunities(
  opportunityIdA: string,
  opportunityIdB: string,
): BusinessOpportunityComparison {
  const repository = getBusinessOpportunityRepository();
  const opportunityA = repository.getOpportunity(opportunityIdA);
  const opportunityB = repository.getOpportunity(opportunityIdB);

  if (!opportunityA) throw new BusinessOpportunityNotFoundError(opportunityIdA);
  if (!opportunityB) throw new BusinessOpportunityNotFoundError(opportunityIdB);

  const highlights = {
    betterMargin: compareWinner(
      opportunityA.economics.estimatedMargin,
      opportunityB.economics.estimatedMargin,
    ),
    betterSupplier: compareWinner(
      opportunityA.economics.supplierConfidence,
      opportunityB.economics.supplierConfidence,
    ),
    betterBrand: compareWinner(
      opportunityA.brand.brandConfidence,
      opportunityB.brand.brandConfidence,
    ),
    betterMarketplace: compareWinner(
      marketplaceScore(opportunityA.economics.recommendedMarketplace),
      marketplaceScore(opportunityB.economics.recommendedMarketplace),
    ),
    betterRoi: compareWinner(opportunityA.economics.expectedRoi, opportunityB.economics.expectedRoi),
    betterConfidence: compareWinner(
      opportunityA.economics.launchConfidence,
      opportunityB.economics.launchConfidence,
    ),
  };

  const winsA = Object.values(highlights).filter((value) => value === "A").length;
  const winsB = Object.values(highlights).filter((value) => value === "B").length;
  const summary =
    winsA > winsB
      ? `${opportunityA.brand.businessName} leads ${winsA} of 6 investment dimensions.`
      : winsB > winsA
        ? `${opportunityB.brand.businessName} leads ${winsB} of 6 investment dimensions.`
        : "Both opportunities are evenly matched across investment dimensions.";

  return { opportunityA, opportunityB, highlights, summary };
}

function resolvePostApprovalStatus(record: BusinessOpportunityRecord): BusinessOpportunityRecord["status"] {
  if (
    record.economics.launchConfidence >= 65 &&
    record.economics.dominationScore >= 60
  ) {
    return "READY_FOR_BUILD";
  }
  return "APPROVED";
}

export function approveBusinessOpportunity(
  businessOpportunityId: string,
  actor?: string,
): BusinessOpportunityRecord {
  const repository = getBusinessOpportunityRepository();
  const existing = repository.getOpportunity(businessOpportunityId);
  if (!existing) throw new BusinessOpportunityNotFoundError(businessOpportunityId);

  const governance = getGovernanceEngine();
  const verdict = governance.evaluateDecision({
    workspaceId: existing.workspaceId,
    domain: "grandKings",
    module: "business-opportunity-workspace",
    action: "approve_business_opportunity",
    actor: actor ?? "founder",
    correlationId: businessOpportunityId,
    payload: { businessOpportunityId },
  });

  if (!verdict.allowed) {
    throw new BusinessOpportunityBlockedError(
      verdict.reason ?? "Governance blocked business opportunity approval",
    );
  }

  const newStatus = resolvePostApprovalStatus(existing);
  const updated = repository.saveOpportunity({
    ...existing,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });

  recordHistory(updated, "APPROVE", actor ?? "founder", newStatus, existing.status);
  if (newStatus === "READY_FOR_BUILD") {
    recordHistory(updated, "READY_FOR_BUILD", actor ?? "founder", "READY_FOR_BUILD", "APPROVED");
  }

  captureWorkspaceSoulRuntime(
    existing.workspaceId,
    "Grand King approved business opportunity",
    `${existing.brand.businessName} — ${newStatus}`,
    actor ?? "founder",
    { businessOpportunityId, status: newStatus },
  );

  return updated;
}

export function rejectBusinessOpportunity(
  businessOpportunityId: string,
  actor?: string,
  reason?: string,
): BusinessOpportunityRecord {
  const repository = getBusinessOpportunityRepository();
  const existing = repository.getOpportunity(businessOpportunityId);
  if (!existing) throw new BusinessOpportunityNotFoundError(businessOpportunityId);

  const updated = repository.saveOpportunity({
    ...existing,
    status: "REJECTED",
    updatedAt: new Date().toISOString(),
  });

  recordHistory(updated, "REJECT", actor ?? "founder", "REJECTED", existing.status, reason);

  captureWorkspaceSoulRuntime(
    existing.workspaceId,
    "Grand King rejected business opportunity",
    `${existing.brand.businessName} rejected`,
    actor ?? "founder",
    { businessOpportunityId, reason },
  );

  return updated;
}

export function saveBusinessOpportunityForLater(
  businessOpportunityId: string,
  actor?: string,
  notes?: string,
): BusinessOpportunityRecord {
  const repository = getBusinessOpportunityRepository();
  const existing = repository.getOpportunity(businessOpportunityId);
  if (!existing) throw new BusinessOpportunityNotFoundError(businessOpportunityId);

  const updated = repository.saveOpportunity({
    ...existing,
    status: "UNDER_REVIEW",
    favorite: true,
    notes: notes ?? existing.notes,
    updatedAt: new Date().toISOString(),
  });

  recordHistory(updated, "SAVE_FOR_LATER", actor ?? "founder", "UNDER_REVIEW", existing.status);

  return updated;
}

export function getApprovalHistory(
  workspaceId: string,
  companyId?: string,
  businessOpportunityId?: string,
): ApprovalHistoryEntry[] {
  return getBusinessOpportunityRepository().listHistory(workspaceId, companyId, businessOpportunityId);
}

export function buildBusinessWorkspaceDashboard(
  workspaceId: string,
  companyId: string,
): BusinessWorkspaceDashboard {
  const opportunities = listBusinessOpportunities(workspaceId, companyId);
  const topOpportunities = opportunities
    .filter((entry) => entry.status !== "REJECTED")
    .slice(0, 5);

  const approved = opportunities.filter(
    (entry) => entry.status === "APPROVED" || entry.status === "READY_FOR_BUILD",
  );
  const latestApprovedBusiness = approved.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];

  const active = opportunities.filter((entry) => entry.status !== "REJECTED");
  const highestDominationScore = active.reduce(
    (max, entry) => Math.max(max, entry.economics.dominationScore),
    0,
  );
  const highestExpectedRoi = active.reduce(
    (max, entry) => Math.max(max, entry.economics.expectedRoi),
    0,
  );

  const underReview = opportunities.filter((entry) => entry.status === "UNDER_REVIEW").length;

  const candidates = active.filter(
    (entry) => entry.status === "DISCOVERED" || entry.status === "UNDER_REVIEW",
  );
  const recommended = candidates.sort((a, b) => {
    const scoreA =
      a.economics.dominationScore * 0.4 +
      a.economics.expectedRoi * 0.3 +
      a.economics.launchConfidence * 0.3;
    const scoreB =
      b.economics.dominationScore * 0.4 +
      b.economics.expectedRoi * 0.3 +
      b.economics.launchConfidence * 0.3;
    return scoreB - scoreA;
  })[0];

  let recommendedNextBusiness = "Run product discovery to populate business opportunities.";
  if (recommended) {
    recommendedNextBusiness = `Review ${recommended.brand.businessName} — domination ${recommended.economics.dominationScore}/100, ROI ${recommended.economics.expectedRoi}/100.`;
  } else if (latestApprovedBusiness) {
    recommendedNextBusiness = `Latest approved: ${latestApprovedBusiness.brand.businessName} — proceed when ready.`;
  }

  return {
    topOpportunities,
    latestApprovedBusiness,
    businessesUnderReview: underReview,
    highestDominationScore,
    highestExpectedRoi,
    recommendedNextBusiness,
    computedAt: new Date().toISOString(),
  };
}

export { buildBusinessOpportunitiesFromSession };
