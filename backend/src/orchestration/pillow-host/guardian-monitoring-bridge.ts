import { getRecentEventLoopLagMs } from "../../runtime/event-loop-cooperative.js";
import type { GuardianMonitoringSnapshot } from "@empireai/pillow";

/** Collect live Guardian monitoring snapshot (P5-04). */
export function collectGuardianMonitoringSnapshot(input?: {
  redisConnected?: boolean;
  redisMode?: "connected" | "degraded" | "unknown";
  queueDepth?: number;
  workersActive?: boolean;
  sqliteHealthy?: boolean;
  pillowHostRunning?: boolean;
  pillowHostSessions?: number;
  authStoreMode?: "redis" | "in_memory";
  guardianBackendOverall?: string;
  openGuardianRisks?: number;
}): GuardianMonitoringSnapshot {
  const mem = process.memoryUsage();
  const lag = getRecentEventLoopLagMs();
  const env = process.env;
  const redisConfigured = Boolean(env.REDIS_URL);

  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    eventLoopLagMs: lag,
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb: Math.round(mem.rss / 1024 / 1024),
    redisConnected: input?.redisConnected ?? redisConfigured,
    redisMode: input?.redisMode ?? (redisConfigured ? "connected" : "degraded"),
    queueDepth: input?.queueDepth ?? 0,
    workersActive: input?.workersActive ?? env.NODE_ENV !== "production",
    sqliteHealthy: input?.sqliteHealthy ?? true,
    apiHealthy: lag < 500,
    pillowHostRunning: input?.pillowHostRunning ?? false,
    pillowHostSessions: input?.pillowHostSessions ?? 0,
    authStoreMode: input?.authStoreMode ?? (redisConfigured ? "redis" : "in_memory"),
    guardianBackendOverall: input?.guardianBackendOverall,
    openGuardianRisks: input?.openGuardianRisks,
  };
}
