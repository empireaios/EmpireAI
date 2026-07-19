/** R3-16 — Dashboard snapshot registry. */

import type { DashboardSnapshot } from "./types.js";

export class DashboardRegistry {
  private readonly snapshots = new Map<string, DashboardSnapshot>();
  private lastRefreshKey: string | null = null;

  store(snapshot: DashboardSnapshot, dedupeKey?: string): void {
    this.snapshots.set(snapshot.dashboardId, snapshot);
    if (dedupeKey) this.lastRefreshKey = dedupeKey;
  }

  get(dashboardId: string): DashboardSnapshot | null {
    return this.snapshots.get(dashboardId) ?? null;
  }

  hasRefreshKey(key: string): boolean {
    return this.lastRefreshKey === key;
  }

  list(): DashboardSnapshot[] {
    return [...this.snapshots.values()];
  }

  latest(): DashboardSnapshot | null {
    const list = this.list();
    return list[list.length - 1] ?? null;
  }

  resetForTesting(): void {
    this.snapshots.clear();
    this.lastRefreshKey = null;
  }
}
