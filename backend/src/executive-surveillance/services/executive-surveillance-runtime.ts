import { initializeWatcherRegistry, getActiveWatchers } from "./watcher-registry-service.js";
import { listActiveSignals, runExecutiveSurveillance } from "./signal-engine-service.js";
import { listSurveillanceMissions } from "./mission-generator-service.js";
import type { ExecutiveSurveillanceRuntime } from "../models/surveillance-core.js";

/** ESS-001 — Executive Surveillance Runtime. */
export function getExecutiveSurveillanceRuntime(workspaceId: string, companyId: string): ExecutiveSurveillanceRuntime {
  initializeWatcherRegistry(workspaceId, companyId);
  const watchers = getActiveWatchers(workspaceId, companyId);
  let signals = listActiveSignals(workspaceId, companyId);
  if (signals.length === 0) {
    const run = runExecutiveSurveillance(workspaceId, companyId);
    signals = run.signals;
  }
  const missions = listSurveillanceMissions(workspaceId, companyId);

  return {
    moduleId: "executive-surveillance",
    missionId: "ESS-001-ESS-010",
    activeWatchers: watchers.length,
    signalsToday: signals.length,
    missionsQueued: missions.length,
    lastObservationAt: signals[0]?.emittedAt ?? null,
  };
}
