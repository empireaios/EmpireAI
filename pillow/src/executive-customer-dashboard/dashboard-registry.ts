/** R4-18 — Dashboard registry. */

import type { CustomerDashboardSnapshot } from "./types.js";

export class DashboardRegistry {
  private readonly snapshots = new Map<string, CustomerDashboardSnapshot>();
  private readonly refreshKeys = new Set<string>();
  private latestId: string | null = null;

  store(snapshot: CustomerDashboardSnapshot, refreshKey?: string): void {
    this.snapshots.set(snapshot.dashboardId, snapshot);
    this.latestId = snapshot.dashboardId;
    if (refreshKey) this.refreshKeys.add(refreshKey);
  }

  hasRefreshKey(key: string): boolean {
    return this.refreshKeys.has(key);
  }

  get(id: string): CustomerDashboardSnapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  latest(): CustomerDashboardSnapshot | null {
    return this.latestId ? (this.snapshots.get(this.latestId) ?? null) : null;
  }

  list(): CustomerDashboardSnapshot[] {
    return [...this.snapshots.values()];
  }

  resetForTesting(): void {
    this.snapshots.clear();
    this.refreshKeys.clear();
    this.latestId = null;
  }
}
