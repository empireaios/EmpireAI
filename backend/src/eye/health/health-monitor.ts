import type { EyeProviderId, EyeHealthState } from "../types.js";

export type HealthRecord = {
  providerId: EyeProviderId;
  workspaceId: string;
  healthState: EyeHealthState;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  consecutiveFailures: number;
  lastCheckedAt: string | null;
  latencyMs: number | null;
};

export type HealthMonitorOptions = {
  /** Consecutive failures before marking degraded. */
  degradedThreshold?: number;
  /** Consecutive failures before marking unhealthy. */
  unhealthyThreshold?: number;
};

const DEFAULT_DEGRADED = 2;
const DEFAULT_UNHEALTHY = 3;

/** Tracks connector health states per workspace + provider. */
export class HealthMonitor {
  private readonly records = new Map<string, HealthRecord>();
  private readonly degradedThreshold: number;
  private readonly unhealthyThreshold: number;

  constructor(options?: HealthMonitorOptions) {
    this.degradedThreshold = options?.degradedThreshold ?? DEFAULT_DEGRADED;
    this.unhealthyThreshold = options?.unhealthyThreshold ?? DEFAULT_UNHEALTHY;
  }

  private key(workspaceId: string, providerId: EyeProviderId): string {
    return `${workspaceId}:${providerId}`;
  }

  recordSuccess(
    workspaceId: string,
    providerId: EyeProviderId,
    latencyMs?: number,
  ): HealthRecord {
    const now = new Date().toISOString();
    const record: HealthRecord = {
      providerId,
      workspaceId,
      healthState: "healthy",
      lastSuccessAt: now,
      lastFailureAt: null,
      lastFailureMessage: null,
      consecutiveFailures: 0,
      lastCheckedAt: now,
      latencyMs: latencyMs ?? null,
    };
    this.records.set(this.key(workspaceId, providerId), record);
    return record;
  }

  recordFailure(
    workspaceId: string,
    providerId: EyeProviderId,
    message: string,
  ): HealthRecord {
    const existing = this.get(workspaceId, providerId);
    const consecutiveFailures = (existing?.consecutiveFailures ?? 0) + 1;
    const now = new Date().toISOString();

    let healthState: EyeHealthState = "healthy";
    if (consecutiveFailures >= this.unhealthyThreshold) {
      healthState = "unhealthy";
    } else if (consecutiveFailures >= this.degradedThreshold) {
      healthState = "degraded";
    } else if (consecutiveFailures > 0) {
      healthState = "degraded";
    }

    const record: HealthRecord = {
      providerId,
      workspaceId,
      healthState,
      lastSuccessAt: existing?.lastSuccessAt ?? null,
      lastFailureAt: now,
      lastFailureMessage: message,
      consecutiveFailures,
      lastCheckedAt: now,
      latencyMs: existing?.latencyMs ?? null,
    };
    this.records.set(this.key(workspaceId, providerId), record);
    return record;
  }

  get(workspaceId: string, providerId: EyeProviderId): HealthRecord | undefined {
    return this.records.get(this.key(workspaceId, providerId));
  }

  getHealthState(workspaceId: string, providerId: EyeProviderId): EyeHealthState {
    return this.get(workspaceId, providerId)?.healthState ?? "unknown";
  }

  listByWorkspace(workspaceId: string): HealthRecord[] {
    return [...this.records.values()].filter((r) => r.workspaceId === workspaceId);
  }

  reset(workspaceId: string, providerId: EyeProviderId): void {
    this.records.delete(this.key(workspaceId, providerId));
  }

  clear(): void {
    this.records.clear();
  }
}
