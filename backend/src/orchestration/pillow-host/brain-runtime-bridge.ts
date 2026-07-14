import { getRecentEventLoopLagMs } from "../../runtime/event-loop-cooperative.js";
import type { BrainRuntimeSnapshot } from "@empireai/pillow";

/** Collect live Brain runtime snapshot for Pillow engine (P5-01). */
export function collectBrainRuntimeSnapshot(input?: {
  redisMode?: "connected" | "degraded" | "unknown";
  queueDepth?: number;
  workersActive?: boolean;
  sqliteHealthy?: boolean;
  pillowRunning?: boolean;
}): BrainRuntimeSnapshot {
  const mem = process.memoryUsage();
  const lag = getRecentEventLoopLagMs();

  const responsive = lag < 200;

  return {
    capturedAt: new Date().toISOString(),
    eventLoopLagMs: lag,
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb: Math.round(mem.rss / 1024 / 1024),
    redisMode: input?.redisMode ?? "unknown",
    queueDepth: input?.queueDepth ?? 0,
    workersActive: input?.workersActive ?? false,
    sqliteHealthy: input?.sqliteHealthy ?? true,
    apiHealthy: responsive,
    pillowResponsive: input?.pillowRunning !== false && responsive,
    loginResponsive: responsive,
    executiveHomeResponsive: responsive,
    brainResponsive: responsive,
  };
}
