import type { GrandKingLiveOperationsMode, OperationsMode } from "../models/grand-king-live-operations-mode.js";
import { OPERATIONS_MODES } from "../models/grand-king-live-operations-mode.js";

const modeStore = new Map<string, OperationsMode>();
const historyStore = new Map<string, GrandKingLiveOperationsMode["transitionHistory"]>();

function storeKey(workspaceId: string, companyId: string): string {
  return `${workspaceId}:${companyId}`;
}

export function getOperationsMode(workspaceId: string, companyId: string): OperationsMode {
  return modeStore.get(storeKey(workspaceId, companyId)) ?? "DEVELOPMENT";
}

export function resetOperationsModeStore(): void {
  modeStore.clear();
  historyStore.clear();
}

/** REAL-036 — Grand King live operations mode (every transition requires Grand King approval). */
export function buildGrandKingLiveOperationsMode(
  workspaceId: string,
  companyId: string,
): GrandKingLiveOperationsMode {
  const key = storeKey(workspaceId, companyId);
  const currentMode = modeStore.get(key) ?? "DEVELOPMENT";
  const transitionHistory = historyStore.get(key) ?? [];

  return {
    moduleId: "grand-king-live-operations-mode",
    missionId: "REAL-036",
    workspaceId,
    companyId,
    currentMode,
    availableModes: [...OPERATIONS_MODES],
    transitionRequires: {
      executiveReview: true,
      soulRecommendation: true,
      grandKingApproval: true,
    },
    pendingTransition: null,
    transitionHistory,
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}

export function requestOperationsModeTransition(
  workspaceId: string,
  companyId: string,
  targetMode: OperationsMode,
  evidence: string,
): GrandKingLiveOperationsMode {
  return {
    ...buildGrandKingLiveOperationsMode(workspaceId, companyId),
    pendingTransition: {
      targetMode,
      requestedAt: new Date().toISOString(),
      evidence,
    },
  };
}

export function approveOperationsModeTransition(
  workspaceId: string,
  companyId: string,
  targetMode: OperationsMode,
  evidence: string,
): GrandKingLiveOperationsMode {
  const key = storeKey(workspaceId, companyId);
  const from = modeStore.get(key) ?? "DEVELOPMENT";
  modeStore.set(key, targetMode);
  const history = historyStore.get(key) ?? [];
  history.push({ from, to: targetMode, approvedAt: new Date().toISOString(), evidence });
  historyStore.set(key, history.slice(-20));
  return buildGrandKingLiveOperationsMode(workspaceId, companyId);
}
