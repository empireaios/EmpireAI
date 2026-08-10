/**
 * Cost Guard — owner-configurable economic circuit breaker.
 * Does NOT invent Grand King limits. Unconfigured limits surface for configuration.
 * HARD STOP blocks covered paid autonomous activity.
 */

import { getDatabase } from "../../brain/database.js";
import { recordFlightEvent } from "./flight-recorder.js";

export type CostGuardLevel = "OK" | "WARNING" | "CRITICAL" | "HARD_STOP";

export type CostGuardLimits = {
  workspaceId: string;
  monthlyOperatingBudgetUsd: number | null;
  dailyAiBudgetUsd: number | null;
  providerModelBudgetUsd: number | null;
  missionCampaignBudgetUsd: number | null;
  autonomousPaidActionLimitUsd: number | null;
  commerceOperationalBudgetUsd: number | null;
  customerOrderFulfilmentBudgetUsd: number | null;
  warningPct: number;
  criticalPct: number;
  configuredAt: string | null;
  configuredBy: string | null;
  updatedAt: string;
};

export type CostSpendBucket = {
  actualUsd: number;
  committedUsd: number;
  forecastUsd: number;
};

export type CostGuardStatus = {
  computedAt: string;
  level: CostGuardLevel;
  limits: CostGuardLimits;
  spend: {
    dailyAi: CostSpendBucket;
    monthlyOperating: CostSpendBucket;
    autonomousPaid: CostSpendBucket;
    commerceOperational: CostSpendBucket;
  };
  unconfiguredLimitKeys: string[];
  hardStopActive: boolean;
  hardStopReasons: string[];
  notes: string[];
};

const DEFAULT_WARNING = 70;
const DEFAULT_CRITICAL = 90;

export function ensureCostGuardTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_cost_guard_limits (
      workspace_id TEXT PRIMARY KEY,
      record_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pillow_cost_spend_events (
      spend_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      amount_usd REAL NOT NULL,
      provider TEXT,
      attribution_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pillow_cost_spend_ws
      ON pillow_cost_spend_events(workspace_id, recorded_at DESC);
  `);
}

function emptyLimits(workspaceId: string): CostGuardLimits {
  const now = new Date().toISOString();
  return {
    workspaceId,
    monthlyOperatingBudgetUsd: null,
    dailyAiBudgetUsd: null,
    providerModelBudgetUsd: null,
    missionCampaignBudgetUsd: null,
    autonomousPaidActionLimitUsd: null,
    commerceOperationalBudgetUsd: null,
    customerOrderFulfilmentBudgetUsd: null,
    warningPct: DEFAULT_WARNING,
    criticalPct: DEFAULT_CRITICAL,
    configuredAt: null,
    configuredBy: null,
    updatedAt: now,
  };
}

export function getCostGuardLimits(workspaceId: string): CostGuardLimits {
  ensureCostGuardTables();
  const db = getDatabase();
  const row = db
    .prepare(`SELECT record_json FROM pillow_cost_guard_limits WHERE workspace_id = @workspaceId`)
    .get({ workspaceId }) as { record_json: string } | undefined;
  return row ? (JSON.parse(row.record_json) as CostGuardLimits) : emptyLimits(workspaceId);
}

export function setCostGuardLimits(
  workspaceId: string,
  patch: Partial<CostGuardLimits>,
  actor: string,
): CostGuardLimits {
  ensureCostGuardTables();
  const current = getCostGuardLimits(workspaceId);
  const next: CostGuardLimits = {
    ...current,
    ...patch,
    workspaceId,
    configuredAt: current.configuredAt ?? new Date().toISOString(),
    configuredBy: actor,
    updatedAt: new Date().toISOString(),
  };
  const db = getDatabase();
  db.prepare(
    `INSERT INTO pillow_cost_guard_limits (workspace_id, record_json, updated_at)
     VALUES (@workspaceId, @json, @updatedAt)
     ON CONFLICT(workspace_id) DO UPDATE SET
       record_json = excluded.record_json,
       updated_at = excluded.updated_at`,
  ).run({
    workspaceId,
    json: JSON.stringify(next),
    updatedAt: next.updatedAt,
  });
  recordFlightEvent({
    workspaceId,
    eventType: "COST_GUARD",
    businessArea: "cost",
    subsystem: "cost-guard",
    objective: "Update owner-configurable Cost Guard limits",
    decision: "LIMITS_UPDATED",
    authority: "grand_king",
    result: `Limits updated by ${actor}`,
    evidenceConsidered: Object.keys(patch),
  });
  return next;
}

export function recordCostSpend(input: {
  workspaceId: string;
  kind: "ai" | "operating" | "autonomous_paid" | "commerce_operational" | "fulfilment";
  amountUsd: number;
  provider?: string;
  attribution?: Record<string, string>;
  committed?: boolean;
}): void {
  ensureCostGuardTables();
  const db = getDatabase();
  const spendId = `spend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(
    `INSERT INTO pillow_cost_spend_events
      (spend_id, workspace_id, recorded_at, kind, amount_usd, provider, attribution_json)
     VALUES (@spendId, @workspaceId, @recordedAt, @kind, @amountUsd, @provider, @attribution)`,
  ).run({
    spendId,
    workspaceId: input.workspaceId,
    recordedAt: new Date().toISOString(),
    kind: input.committed ? `${input.kind}:committed` : input.kind,
    amountUsd: input.amountUsd,
    provider: input.provider ?? null,
    attribution: JSON.stringify(input.attribution ?? {}),
  });
}

function sumSpend(
  workspaceId: string,
  kindPrefix: string,
  sinceIso: string,
): CostSpendBucket {
  ensureCostGuardTables();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT kind, amount_usd FROM pillow_cost_spend_events
       WHERE workspace_id = @workspaceId AND recorded_at >= @since AND kind LIKE @kind`,
    )
    .all({ workspaceId, since: sinceIso, kind: `${kindPrefix}%` }) as Array<{
    kind: string;
    amount_usd: number;
  }>;
  let actualUsd = 0;
  let committedUsd = 0;
  for (const row of rows) {
    if (row.kind.includes(":committed")) committedUsd += Number(row.amount_usd) || 0;
    else actualUsd += Number(row.amount_usd) || 0;
  }
  return {
    actualUsd,
    committedUsd,
    forecastUsd: actualUsd + committedUsd,
  };
}

function levelFor(used: number, limit: number | null, warningPct: number, criticalPct: number): CostGuardLevel {
  if (limit == null || limit <= 0) return "OK";
  const pct = (used / limit) * 100;
  if (pct >= 100) return "HARD_STOP";
  if (pct >= criticalPct) return "CRITICAL";
  if (pct >= warningPct) return "WARNING";
  return "OK";
}

export function buildCostGuardStatus(workspaceId: string): CostGuardStatus {
  const limits = getCostGuardLimits(workspaceId);
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const dailyAi = sumSpend(workspaceId, "ai", dayStart);
  const monthlyOperating = sumSpend(workspaceId, "operating", monthStart);
  const autonomousPaid = sumSpend(workspaceId, "autonomous_paid", monthStart);
  const commerceOperational = sumSpend(workspaceId, "commerce_operational", monthStart);

  const unconfiguredLimitKeys: string[] = [];
  const limitMap: Array<[keyof CostGuardLimits, string]> = [
    ["monthlyOperatingBudgetUsd", "monthlyOperatingBudgetUsd"],
    ["dailyAiBudgetUsd", "dailyAiBudgetUsd"],
    ["providerModelBudgetUsd", "providerModelBudgetUsd"],
    ["missionCampaignBudgetUsd", "missionCampaignBudgetUsd"],
    ["autonomousPaidActionLimitUsd", "autonomousPaidActionLimitUsd"],
    ["commerceOperationalBudgetUsd", "commerceOperationalBudgetUsd"],
    ["customerOrderFulfilmentBudgetUsd", "customerOrderFulfilmentBudgetUsd"],
  ];
  for (const [key, label] of limitMap) {
    if (limits[key] == null) unconfiguredLimitKeys.push(label);
  }

  const levels = [
    levelFor(
      dailyAi.actualUsd + dailyAi.committedUsd,
      limits.dailyAiBudgetUsd,
      limits.warningPct,
      limits.criticalPct,
    ),
    levelFor(
      monthlyOperating.actualUsd + monthlyOperating.committedUsd,
      limits.monthlyOperatingBudgetUsd,
      limits.warningPct,
      limits.criticalPct,
    ),
    levelFor(
      autonomousPaid.actualUsd + autonomousPaid.committedUsd,
      limits.autonomousPaidActionLimitUsd,
      limits.warningPct,
      limits.criticalPct,
    ),
    levelFor(
      commerceOperational.actualUsd + commerceOperational.committedUsd,
      limits.commerceOperationalBudgetUsd,
      limits.warningPct,
      limits.criticalPct,
    ),
  ];
  const rank = { OK: 0, WARNING: 1, CRITICAL: 2, HARD_STOP: 3 } as const;
  let level: CostGuardLevel = "OK";
  for (const l of levels) {
    if (rank[l] > rank[level]) level = l;
  }

  const hardStopReasons: string[] = [];
  if (
    limits.dailyAiBudgetUsd != null &&
    dailyAi.actualUsd + dailyAi.committedUsd >= limits.dailyAiBudgetUsd
  ) {
    hardStopReasons.push("Daily AI budget exhausted");
  }
  if (
    limits.autonomousPaidActionLimitUsd != null &&
    autonomousPaid.actualUsd + autonomousPaid.committedUsd >= limits.autonomousPaidActionLimitUsd
  ) {
    hardStopReasons.push("Autonomous paid-action limit exhausted");
  }
  if (
    limits.monthlyOperatingBudgetUsd != null &&
    monthlyOperating.actualUsd + monthlyOperating.committedUsd >= limits.monthlyOperatingBudgetUsd
  ) {
    hardStopReasons.push("Monthly operating budget exhausted");
  }

  const hardStopActive = level === "HARD_STOP" || hardStopReasons.length > 0;
  if (hardStopActive && level !== "HARD_STOP") level = "HARD_STOP";

  return {
    computedAt: now.toISOString(),
    level,
    limits,
    spend: { dailyAi, monthlyOperating, autonomousPaid, commerceOperational },
    unconfiguredLimitKeys,
    hardStopActive,
    hardStopReasons,
    notes: [
      "ACTUAL / COMMITTED / FORECAST are never merged in reporting.",
      "Unconfigured limits remain UNKNOWN until Grand King sets them — Pillow cannot invent limits.",
      "HARD STOP blocks covered paid autonomous activity; Grand King alone can raise protected limits.",
    ],
  };
}

/** Returns null when allowed; reason string when blocked. */
export function assertPaidAutonomousAllowed(
  workspaceId: string,
  estimatedCostUsd: number,
): { allowed: true } | { allowed: false; reason: string; status: CostGuardStatus } {
  const status = buildCostGuardStatus(workspaceId);
  if (status.hardStopActive) {
    return {
      allowed: false,
      reason: status.hardStopReasons.join("; ") || "Cost Guard HARD STOP active",
      status,
    };
  }
  const dailyLimit = status.limits.dailyAiBudgetUsd;
  if (dailyLimit != null) {
    const projected = status.spend.dailyAi.actualUsd + status.spend.dailyAi.committedUsd + estimatedCostUsd;
    if (projected > dailyLimit) {
      return {
        allowed: false,
        reason: `Projected daily AI spend $${projected.toFixed(4)} exceeds limit $${dailyLimit}`,
        status,
      };
    }
  }
  const autoLimit = status.limits.autonomousPaidActionLimitUsd;
  if (autoLimit != null) {
    const projected =
      status.spend.autonomousPaid.actualUsd +
      status.spend.autonomousPaid.committedUsd +
      estimatedCostUsd;
    if (projected > autoLimit) {
      return {
        allowed: false,
        reason: `Projected autonomous paid spend $${projected.toFixed(4)} exceeds limit $${autoLimit}`,
        status,
      };
    }
  }
  return { allowed: true };
}

/**
 * Safe hard-stop proof: temporarily apply a tiny autonomous limit, verify block,
 * then restore prior limits. Does not cause uncontrolled spend.
 */
export function runSafeHardStopProof(workspaceId: string, actor: string): {
  ok: boolean;
  detail: string;
  blockedReason: string | null;
} {
  const prior = getCostGuardLimits(workspaceId);
  try {
    setCostGuardLimits(
      workspaceId,
      {
        autonomousPaidActionLimitUsd: 0.0001,
        dailyAiBudgetUsd: prior.dailyAiBudgetUsd ?? 0.0001,
      },
      actor,
    );
    // Simulate prior spend that exhausts the tiny limit
    recordCostSpend({
      workspaceId,
      kind: "autonomous_paid",
      amountUsd: 0.01,
      provider: "hard-stop-proof",
      attribution: { proof: "safe-hard-stop" },
    });
    const check = assertPaidAutonomousAllowed(workspaceId, 0.01);
    const blocked = !check.allowed;
    recordFlightEvent({
      workspaceId,
      eventType: "COST_GUARD",
      businessArea: "cost",
      subsystem: "cost-guard",
      objective: "Safe hard-stop proof",
      decision: blocked ? "HARD_STOP_VERIFIED" : "HARD_STOP_FAILED",
      authority: "system",
      result: blocked
        ? `Blocked as expected: ${"reason" in check ? check.reason : ""}`
        : "Hard-stop did not block — failure",
      verification: blocked ? "PASS" : "FAIL",
      evidenceConsidered: ["safe-hard-stop-proof"],
    });
    return {
      ok: blocked,
      detail: blocked
        ? "HARD STOP safely blocked further paid autonomous activity under temporary micro-limit"
        : "HARD STOP proof failed — paid activity was not blocked",
      blockedReason: check.allowed ? null : check.reason,
    };
  } finally {
    // Restore prior limits (remove proof spend effect on limits config)
    setCostGuardLimits(workspaceId, prior, actor);
  }
}
