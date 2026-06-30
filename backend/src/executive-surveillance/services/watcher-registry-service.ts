import { seedDefaultWatchers } from "../data/default-watchers.js";
import type { ExecutiveWatcher } from "../models/surveillance-core.js";
import { getExecutiveSurveillanceRepository } from "../repositories/sqlite-ess-repository.js";

/** ESS-002 — Permanent watcher registry. */
export function initializeWatcherRegistry(workspaceId: string, companyId: string): ExecutiveWatcher[] {
  const repo = getExecutiveSurveillanceRepository();
  const seeded = seedDefaultWatchers(new Date().toISOString());
  repo.ensureWatchers(workspaceId, companyId, seeded);
  return repo.listWatchers(workspaceId, companyId);
}

export function listRegisteredWatchers(workspaceId: string, companyId: string): ExecutiveWatcher[] {
  const repo = getExecutiveSurveillanceRepository();
  const existing = repo.listWatchers(workspaceId, companyId);
  if (existing.length === 0) return initializeWatcherRegistry(workspaceId, companyId);
  return existing;
}

export function registerWatcher(
  workspaceId: string,
  companyId: string,
  input: { watcherId: string; title: string; domain: string; watchedModules: string[] },
): ExecutiveWatcher {
  const watcher: ExecutiveWatcher = {
    ...input,
    active: true,
    registeredAt: new Date().toISOString(),
  };
  getExecutiveSurveillanceRepository().saveWatcher(workspaceId, companyId, watcher);
  return watcher;
}

export function getActiveWatchers(workspaceId: string, companyId: string): ExecutiveWatcher[] {
  return listRegisteredWatchers(workspaceId, companyId).filter((w) => w.active);
}
