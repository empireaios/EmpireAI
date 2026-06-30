import type {
  FollowUpMission,
  LaunchStatusEntry,
  PerformanceSnapshot,
  ProductCandidate,
  ProductLaunchMission,
  QueueEntry,
} from "../models/commerce-intelligence-core.js";

type WorkspaceStore = {
  candidates: Map<string, ProductCandidate>;
  queue: Map<string, QueueEntry>;
  missions: Map<string, ProductLaunchMission>;
  launchStatus: Map<string, LaunchStatusEntry>;
  performanceSnapshots: Map<string, PerformanceSnapshot[]>;
  followUpMissions: Map<string, FollowUpMission[]>;
  lastPullAt: string | null;
};

const stores = new Map<string, WorkspaceStore>();

function getStore(workspaceId: string): WorkspaceStore {
  let store = stores.get(workspaceId);
  if (!store) {
    store = {
      candidates: new Map(),
      queue: new Map(),
      missions: new Map(),
      launchStatus: new Map(),
      performanceSnapshots: new Map(),
      followUpMissions: new Map(),
      lastPullAt: null,
    };
    stores.set(workspaceId, store);
  }
  return store;
}

/** Resets in-memory store (for tests). */
export function resetCommerceIntelligenceStore(workspaceId?: string): void {
  if (workspaceId) {
    stores.delete(workspaceId);
    return;
  }
  stores.clear();
}

export function saveCandidate(workspaceId: string, candidate: ProductCandidate): void {
  getStore(workspaceId).candidates.set(candidate.candidateId, candidate);
}

export function getCandidate(workspaceId: string, candidateId: string): ProductCandidate | undefined {
  return getStore(workspaceId).candidates.get(candidateId);
}

export function listCandidates(workspaceId: string): ProductCandidate[] {
  return [...getStore(workspaceId).candidates.values()];
}

export function saveQueueEntry(workspaceId: string, entry: QueueEntry): void {
  getStore(workspaceId).queue.set(entry.candidateId, entry);
}

export function listQueueEntries(workspaceId: string): QueueEntry[] {
  return [...getStore(workspaceId).queue.values()].sort(
    (a, b) => b.commercialScore - a.commercialScore,
  );
}

export function saveMission(workspaceId: string, mission: ProductLaunchMission): void {
  getStore(workspaceId).missions.set(mission.missionId, mission);
}

export function getMission(workspaceId: string, missionId: string): ProductLaunchMission | undefined {
  return getStore(workspaceId).missions.get(missionId);
}

export function listMissions(workspaceId: string): ProductLaunchMission[] {
  return [...getStore(workspaceId).missions.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function saveLaunchStatus(workspaceId: string, entry: LaunchStatusEntry): void {
  getStore(workspaceId).launchStatus.set(entry.missionId, entry);
}

export function listLaunchStatus(workspaceId: string): LaunchStatusEntry[] {
  return [...getStore(workspaceId).launchStatus.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function savePerformanceSnapshot(workspaceId: string, snapshot: PerformanceSnapshot): void {
  const store = getStore(workspaceId);
  const list = store.performanceSnapshots.get(snapshot.missionId) ?? [];
  list.push(snapshot);
  store.performanceSnapshots.set(snapshot.missionId, list);
}

export function listPerformanceSnapshots(workspaceId: string, missionId: string): PerformanceSnapshot[] {
  return getStore(workspaceId).performanceSnapshots.get(missionId) ?? [];
}

export function saveFollowUpMission(workspaceId: string, followUp: FollowUpMission): void {
  const store = getStore(workspaceId);
  const list = store.followUpMissions.get(followUp.missionId) ?? [];
  list.push(followUp);
  store.followUpMissions.set(followUp.missionId, list);
}

export function listFollowUpMissions(workspaceId: string, missionId?: string): FollowUpMission[] {
  const store = getStore(workspaceId);
  if (missionId) return store.followUpMissions.get(missionId) ?? [];
  return [...store.followUpMissions.values()].flat();
}

export function setLastPullAt(workspaceId: string, iso: string): void {
  getStore(workspaceId).lastPullAt = iso;
}

export function getLastPullAt(workspaceId: string): string | null {
  return getStore(workspaceId).lastPullAt;
}
