import { getRecentEventLoopLagMs } from "../../runtime/event-loop-cooperative.js";
import type { ExecutionControlSnapshot } from "@empireai/pillow";

/** Collect live ECC snapshot (P6-01). */
export function collectExecutionControlSnapshot(input?: {
  activeMissionId?: string | null;
  activeMissionTitle?: string | null;
  executionState?: ExecutionControlSnapshot["executionState"];
  queueDepth?: number;
  queuedMissions?: number;
  overallProgressPercent?: number;
  openRisks?: number;
  openBottlenecks?: number;
  pillowHostSessions?: number;
}): ExecutionControlSnapshot {
  const lag = getRecentEventLoopLagMs();
  const env = process.env;
  const redisConfigured = Boolean(env.REDIS_URL);

  let score = 75;
  if (lag < 200) score += 10;
  if (redisConfigured) score += 5;
  if ((input?.openRisks ?? 0) > 3) score -= 10;
  score = Math.max(0, Math.min(100, score));

  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    activeMissionId: input?.activeMissionId ?? null,
    activeMissionTitle: input?.activeMissionTitle ?? null,
    executionState: input?.executionState ?? "ready",
    currentPipelineStage: "execution_coordination",
    queueDepth: input?.queueDepth ?? 0,
    overallProgressPercent: input?.overallProgressPercent ?? 0,
    queuedMissions: input?.queuedMissions ?? 0,
    activeDependencies: 5,
    criticalPathLength: 5,
    builderCapacity: "available",
    runtimeCapacity: lag >= 500 ? "critical" : lag >= 200 ? "degraded" : "healthy",
    openRisks: input?.openRisks ?? 0,
    openBottlenecks: input?.openBottlenecks ?? 0,
    coordinationScore: score,
  };
}
