import { randomUUID } from "node:crypto";

import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { AiSelfImprovementEngine } from "../models/ai-self-improvement-engine.js";

/** REAL-022 — AI self-improvement recommendations only (never self-modify). */
export function buildAiSelfImprovementEngine(
  workspaceId: string,
  companyId: string,
): AiSelfImprovementEngine {
  const suggestions: AiSelfImprovementEngine["suggestions"] = [];

  for (const program of PROGRAM_CATALOG.filter((p) => p.baseCompletionPercent < 50)) {
    suggestions.push({
      suggestionId: randomUUID(),
      category: "WEAK_MODULE",
      title: `Program ${program.name} below 50%`,
      evidence: program.realWorldDependencies.join("; ") || "Low base completion",
      recommendation: `Prioritize ${program.nextCursorMission}`,
      priority: program.blocksUsd100k ? "CRITICAL" : "HIGH",
      selfModifyBlocked: true,
    });
  }

  suggestions.push(
    {
      suggestionId: randomUUID(),
      category: "MISSING_INTELLIGENCE",
      title: "Live P&L feed not attached",
      evidence: "Empire economics uses estimated costs until Stripe + supplier COGS live",
      recommendation: "Complete ECON-001 before scaling ad spend",
      priority: "CRITICAL",
      selfModifyBlocked: true,
    },
    {
      suggestionId: randomUUID(),
      category: "INCOMPLETE_INTEGRATION",
      title: "Operational access credentials pending",
      evidence: "OAR architecture 100% — live connections at 0",
      recommendation: "REAL-002B Amazon SP-API + CJ production keys",
      priority: "CRITICAL",
      selfModifyBlocked: true,
    },
    {
      suggestionId: randomUUID(),
      category: "REVENUE_BOTTLENECK",
      title: "No verified net profit toward SUCCESS-001",
      evidence: "USD 0 / 100,000 target",
      recommendation: "PROOF-001 first live sale with net profit tracking",
      priority: "CRITICAL",
      selfModifyBlocked: true,
    },
    {
      suggestionId: randomUUID(),
      category: "UX_WEAKNESS",
      title: "King approval workflow UI incomplete",
      evidence: "EC-011 in executive-intelligence remaining packages",
      recommendation: "Add approval UI for improvement + opportunity queues",
      priority: "HIGH",
      selfModifyBlocked: true,
    },
    {
      suggestionId: randomUUID(),
      category: "PERFORMANCE_BOTTLENECK",
      title: "Dashboard aggregation depth",
      evidence: "Multiple runtime modules compose on Mission Home fetch",
      recommendation: "Consider consolidated /version-1/summary endpoint for production",
      priority: "MEDIUM",
      selfModifyBlocked: true,
    },
  );

  const architectureSuggestions = [
    "Wire live Stripe webhooks into REAL-019 empire-economics",
    "Add Redis-backed cache for global-command-center snapshot",
    "Separate Founder routes under /founder/* per REAL-021",
  ];

  const catalogBlockers = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k).map(
    (p) => `${p.name}: ${p.nextCursorMission}`,
  );

  const executiveReviewItems = [
    ...catalogBlockers.slice(0, 3).map((b) => `Review blocker: ${b}`),
    "Approve Version 1 lockdown baseline before Version 2 work",
    "Confirm Grand King remains platform owner — not Founder role",
  ];

  return {
    moduleId: "ai-self-improvement-engine",
    missionId: "REAL-022",
    workspaceId,
    companyId,
    suggestions: suggestions.slice(0, 12),
    architectureSuggestions,
    executiveReviewItems,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
