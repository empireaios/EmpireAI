import { randomUUID } from "node:crypto";

import type { Version2BacklogEntry } from "../models/version-2-backlog-engine.js";
import type { Version2BacklogEngine } from "../models/version-2-backlog-engine.js";

const store = new Map<string, Version2BacklogEntry[]>();

function storeKey(workspaceId: string, companyId: string): string {
  return `${workspaceId}:${companyId}`;
}

const SEED_ENTRIES: Omit<Version2BacklogEntry, "entryId" | "createdAt">[] = [
  { origin: "King discussion", reason: "Navigation clarity for global ops", businessValue: "Faster country-level decisions", architectureImpact: "Route restructure under /commerce/*", revenueImpact: "Reduced time-to-expand", uxImpact: "Country-first navigation", priority: "HIGH", status: "OPEN", relatedModules: ["global-marketplace-operations", "frontend"], trigger: "REAL-018 feedback", owner: "frontend-ux" },
  { origin: "Executive Council", reason: "Visual debate readability", businessValue: "Faster King approvals", architectureImpact: "Executive-visual-debate UI v2", revenueImpact: "Shorter approval cycle", uxImpact: "Executive debate redesign", priority: "HIGH", status: "OPEN", relatedModules: ["executive-visual-debate", "executive-council"], trigger: "EC-011", owner: "executive-intelligence" },
  { origin: "Security review", reason: "Grand King auth hardening", businessValue: "Platform trust", architectureImpact: "Separate GK session scope", revenueImpact: "Indirect — compliance", uxImpact: "Grand King authentication refinement", priority: "CRITICAL", status: "OPEN", relatedModules: ["auth", "grand-king"], trigger: "CONSTITUTION-021", owner: "foundation" },
  { origin: "Mission Home", reason: "Marketplace performance visualization", businessValue: "Spot weak marketplaces", architectureImpact: "GMO chart components", revenueImpact: "Margin recovery", uxImpact: "Marketplace visualization", priority: "MEDIUM", status: "OPEN", relatedModules: ["global-marketplace-operations"], trigger: "REAL-009", owner: "frontend-ux" },
  { origin: "GCI dashboard", reason: "Interactive global heat map", businessValue: "Expansion prioritization", architectureImpact: "GCI frontend canvas", revenueImpact: "Higher ROI expansions", uxImpact: "Global heat map", priority: "MEDIUM", status: "OPEN", relatedModules: ["global-commerce-intelligence"], trigger: "REAL-016", owner: "global-expansion" },
];

function ensureSeeded(workspaceId: string, companyId: string): Version2BacklogEntry[] {
  const key = storeKey(workspaceId, companyId);
  if (!store.has(key)) {
    store.set(
      key,
      SEED_ENTRIES.map((e) => ({
        ...e,
        entryId: randomUUID(),
        createdAt: new Date().toISOString(),
      })),
    );
  }
  return store.get(key)!;
}

/** REAL-023 — Version 2 backlog (CONSTITUTION-022: conversation → backlog). */
export function buildVersion2BacklogEngine(
  workspaceId: string,
  companyId: string,
): Version2BacklogEngine {
  const entries = ensureSeeded(workspaceId, companyId);
  return {
    moduleId: "version-2-backlog-engine",
    missionId: "REAL-023",
    workspaceId,
    companyId,
    entries: [...entries].sort((a, b) => {
      const p = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return p[a.priority] - p[b.priority];
    }),
    openCount: entries.filter((e) => e.status === "OPEN" || e.status === "IN_REVIEW").length,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}

export function addVersion2BacklogEntry(
  workspaceId: string,
  companyId: string,
  entry: Omit<Version2BacklogEntry, "entryId" | "createdAt">,
): Version2BacklogEntry {
  const list = ensureSeeded(workspaceId, companyId);
  const created: Version2BacklogEntry = {
    ...entry,
    entryId: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  list.push(created);
  store.set(storeKey(workspaceId, companyId), list);
  return created;
}

export function resetVersion2BacklogStore(): void {
  store.clear();
}
