/**
 * Honest Pillow operating state — never generic LIVE when unknown.
 */

import { getPillowCommercePresaleRepository } from "../pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { buildCostGuardStatus } from "./cost-guard.js";
import { getLatestFlightEvent, listFlightEvents } from "./flight-recorder.js";
import { getBirthRecord } from "./birth.js";

export type PillowOperatingStateCode =
  | "WORKING"
  | "WAITING_FOR_GRAND_KING"
  | "IDLE_NO_QUALIFYING_WORK"
  | "DEGRADED_EXTERNAL_SERVICE_LIMIT"
  | "PAUSED_GOVERNANCE"
  | "COST_GUARD_ACTIVE"
  | "ERROR_RECOVERING"
  | "COMMISSIONING"
  | "BIRTH_AWAITING_GRAND_KING"
  | "UNKNOWN";

export type PillowOperatingState = {
  computedAt: string;
  state: PillowOperatingStateCode;
  humanLabel: string;
  currentFocus: string;
  lastHeartbeatAt: string | null;
  lastOperatingCycleAt: string | null;
  nextScheduledCycleAt: string | null;
  needsGrandKing: boolean;
  needsGrandKingReason: string | null;
  costGuardLevel: string;
  birthStatus: string;
  evidence: string[];
};

export function buildPillowOperatingState(workspaceId: string): PillowOperatingState {
  const now = new Date().toISOString();
  const cost = buildCostGuardStatus(workspaceId);
  const birth = getBirthRecord(workspaceId);
  const repo = getPillowCommercePresaleRepository();
  const pending = repo.getPendingApprovalOpportunity(workspaceId);
  const latestCycle = repo.getLatestCycle(workspaceId);
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const latestFlight = getLatestFlightEvent(workspaceId);
  const recent = listFlightEvents(workspaceId, { limit: 5 });

  const lastHeartbeatAt = latestFlight?.recordedAt ?? latestCycle?.completedAt ?? null;
  const lastOperatingCycleAt = latestCycle?.completedAt ?? null;

  // Presale automation: every 4 hours from last cycle when known
  let nextScheduledCycleAt: string | null = null;
  if (lastOperatingCycleAt) {
    const next = new Date(lastOperatingCycleAt);
    next.setUTCHours(next.getUTCHours() + 4);
    nextScheduledCycleAt = next.toISOString();
  }

  let state: PillowOperatingStateCode = "UNKNOWN";
  let humanLabel = "Operating state not yet determined";
  let currentFocus = "Establishing operating truth";
  let needsGrandKing = false;
  let needsGrandKingReason: string | null = null;
  const evidence: string[] = [];

  if (cost.hardStopActive) {
    state = "COST_GUARD_ACTIVE";
    humanLabel = "Cost Guard HARD STOP — paid autonomous activity paused";
    currentFocus = "Awaiting Grand King limit adjustment or cost review";
    needsGrandKing = true;
    needsGrandKingReason = cost.hardStopReasons.join("; ") || "Cost Guard hard stop";
    evidence.push("cost-guard:hard-stop");
  } else if (birth.status === "TECHNICALLY_READY_AWAITING_GRAND_KING") {
    state = "BIRTH_AWAITING_GRAND_KING";
    humanLabel = "Pillow birth technically ready — awaiting Grand King authorisation";
    currentFocus = "Commissioning complete; birth timestamp not created until authorised";
    needsGrandKing = true;
    needsGrandKingReason = "Birth authorisation required";
    evidence.push("birth:awaiting");
  } else if (pending) {
    state = "WAITING_FOR_GRAND_KING";
    humanLabel = "Waiting for Grand King decision on commerce opportunity";
    currentFocus = `Review: ${pending.recommendation.productName}`;
    needsGrandKing = true;
    needsGrandKingReason = "Commerce opportunity approval required before publish/spend";
    evidence.push(`opportunity:${pending.opportunityId}`);
  } else if (recent.some((e) => e.eventType === "FAIL" || e.eventType === "RECOVER")) {
    const failing = recent.find((e) => e.eventType === "FAIL" || e.eventType === "RECOVER");
    state = "ERROR_RECOVERING";
    humanLabel = "Recovering from a recent operational failure";
    currentFocus = failing?.actionFailed ?? failing?.result ?? "Recovery in progress";
    evidence.push(failing?.eventId ?? "recover");
  } else if (latestCycle?.outcome === "BLOCKED_INTEGRATION") {
    state = "DEGRADED_EXTERNAL_SERVICE_LIMIT";
    humanLabel = "Degraded — external integration limit or credential blocker";
    currentFocus = latestCycle.blockers[0] ?? "External service blocked cycle";
    evidence.push(`cycle:${latestCycle.cycleId}`);
  } else if (latestCycle && Date.now() - Date.parse(latestCycle.completedAt) < 15 * 60_000) {
    state = "WORKING";
    humanLabel = "Working — recent commerce discovery/evaluation cycle";
    currentFocus = `SMART viable progress ${kpi.smartViable}/1000`;
    evidence.push(`cycle:${latestCycle.cycleId}`);
  } else if (kpi.smartViable === 0 && (kpi.candidatesEvaluated ?? 0) === 0) {
    state = "IDLE_NO_QUALIFYING_WORK";
    humanLabel = "Idle — no qualifying commerce work recorded yet";
    currentFocus = "Awaiting next autonomous discovery cycle";
  } else {
    state = "WORKING";
    humanLabel = "Operating — autonomous progression toward 1,000 SMART viable listings";
    currentFocus = `Distance to 1,000: ${kpi.distanceToTarget}; next cycle scheduled`;
    evidence.push(`smartViable:${kpi.smartViable}`);
  }

  if (birth.status === "COMMISSIONING" && state !== "COST_GUARD_ACTIVE") {
    if (
      state === "WORKING" ||
      state === "IDLE_NO_QUALIFYING_WORK" ||
      humanLabel === "Operating state not yet determined"
    ) {
      state = "COMMISSIONING";
      humanLabel = "Commissioning — birth gates still being proven";
    }
  }

  return {
    computedAt: now,
    state,
    humanLabel,
    currentFocus,
    lastHeartbeatAt,
    lastOperatingCycleAt,
    nextScheduledCycleAt,
    needsGrandKing,
    needsGrandKingReason,
    costGuardLevel: cost.level,
    birthStatus: birth.status,
    evidence,
  };
}
