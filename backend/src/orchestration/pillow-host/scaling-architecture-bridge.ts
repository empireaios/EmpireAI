import { getRecentEventLoopLagMs } from "../../runtime/event-loop-cooperative.js";
import type { ScalingArchitectureSnapshot } from "@empireai/pillow";

/** Collect live scaling snapshot for Pillow engine (P5-05). */
export function collectScalingArchitectureSnapshot(input?: {
  redisConnected?: boolean;
  workersActive?: boolean;
  queueDepth?: number;
  pillowHostSessions?: number;
  scalingReadinessScore?: number;
}): ScalingArchitectureSnapshot {
  const mem = process.memoryUsage();
  const lag = getRecentEventLoopLagMs();
  const env = process.env;
  const redisConnected = input?.redisConnected ?? Boolean(env.REDIS_URL);

  let readinessScore = input?.scalingReadinessScore ?? 60;
  if (redisConnected) readinessScore += 15;
  if (lag < 200) readinessScore += 10;
  if (input?.workersActive) readinessScore += 5;

  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    currentStage: redisConnected && input?.workersActive
      ? "stage_2_production_hardening"
      : "stage_1_single_instance",
    redisConnected,
    workersActive: input?.workersActive ?? env.NODE_ENV !== "production",
    sqliteOnly: true,
    singleInstance: true,
    eventLoopLagMs: lag,
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    queueDepth: input?.queueDepth ?? 0,
    pillowHostSessions: input?.pillowHostSessions ?? 0,
    scalingReadinessScore: Math.min(100, readinessScore),
  };
}
