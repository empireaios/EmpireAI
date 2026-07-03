/**
 * G7-07 — Cockpit autonomous operations backend contracts.
 */

import type {
  AutonomousHealthSummary,
  AutonomousHistoryEntry,
  AutonomousOperation,
  AutonomousOperationsOverview,
  AutonomousQueueEntry,
  AutonomousRecommendation,
} from "./autonomous-operations-types.js";

export const COCKPIT_AUTONOMOUS_OPERATIONS_VIEW_ID = "cockpit-grand-king-autonomous-operations" as const;

export type CockpitAutonomousOperationsView = {
  viewId: typeof COCKPIT_AUTONOMOUS_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "autonomous";
  autonomousOperations: AutonomousOperationsOverview;
  autonomousQueue: { count: number; queue: AutonomousQueueEntry[] };
  autonomousHealth: AutonomousHealthSummary;
  autonomousRecommendations: { count: number; recommendations: AutonomousRecommendation[] };
  autonomousHistory: AutonomousHistoryEntry[];
  executiveSummary: string;
  recentOperations: Array<
    Pick<AutonomousOperation, "autonomousOperationId" | "operationType" | "executionStatus" | "autonomyLevel">
  >;
  discoverySource: "grand-king-autonomous-operations:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitAutonomousOperationsView(input: {
  overview: AutonomousOperationsOverview;
  queue: AutonomousQueueEntry[];
  health: AutonomousHealthSummary;
  recommendations: AutonomousRecommendation[];
  history: AutonomousHistoryEntry[];
  operations: AutonomousOperation[];
  executiveSummary: string;
}): CockpitAutonomousOperationsView {
  return {
    viewId: COCKPIT_AUTONOMOUS_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "autonomous",
    autonomousOperations: input.overview,
    autonomousQueue: { count: input.queue.length, queue: input.queue },
    autonomousHealth: input.health,
    autonomousRecommendations: { count: input.recommendations.length, recommendations: input.recommendations },
    autonomousHistory: input.history,
    executiveSummary: input.executiveSummary,
    recentOperations: input.operations.slice(0, 10).map((op) => ({
      autonomousOperationId: op.autonomousOperationId,
      operationType: op.operationType,
      executionStatus: op.executionStatus,
      autonomyLevel: op.autonomyLevel,
    })),
    discoverySource: "grand-king-autonomous-operations:cockpit",
    designLanguage: "g4-cockpit",
  };
}
