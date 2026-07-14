import { buildLayoutRefactoringConfiguration } from "@empireai/pillow";
import type {
  LayoutRefactoringState,
  LayoutRefactoringReport,
} from "@empireai/pillow";

function buildOfflineRefactoringState(): LayoutRefactoringState {
  const configuration = buildLayoutRefactoringConfiguration();
  return {
    engineVersion: "PILLOW-LR-001",
    missionId: "T3-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      refactoringEnabled: configuration.enabled,
      refactoringsCompleted: 0,
      lastRefactoringAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalRefactorings: 0,
      successfulRefactorings: 0,
      failedRefactorings: 0,
      totalLayoutsRefactored: 0,
      averageLayoutsPerRefactoring: 0,
      averageRefactoringDurationMs: 0,
      peakRefactoringDurationMs: 0,
    },
  };
}

/** Fallback Layout Refactoring snapshot when Pillow session is unavailable. */
export function collectLayoutRefactoringSnapshot() {
  const engine = buildOfflineRefactoringState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      layoutsCount: 0,
      validatedCount: 0,
      blockedCount: 0,
      confidenceScore: 0,
      totalRefactorings: 0,
      recentLogs: [],
    },
    latestReport: null as LayoutRefactoringReport | null,
  };
}
