import type { DurableSessionSnapshot } from "@empireai/pillow";

/** Collect live durable session snapshot for Pillow engine (P5-03). */
export function collectDurableSessionSnapshot(input?: {
  authStoreMode?: "redis" | "in_memory";
  authSessionCount?: number;
  pillowHostSessionCount?: number;
  pillowHostRunning?: boolean;
  redisConnected?: boolean;
  supervisorMissionCount?: number;
  journeyEventsAvailable?: boolean;
  coiRuntimeReady?: boolean;
}): DurableSessionSnapshot {
  const env = process.env;
  const redisConfigured = Boolean(env.REDIS_URL);

  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    authStoreMode:
      input?.authStoreMode ?? (redisConfigured ? "redis" : "in_memory"),
    authSessionCount: input?.authSessionCount ?? 0,
    pillowHostSessionCount: input?.pillowHostSessionCount ?? 0,
    pillowHostRunning: input?.pillowHostRunning ?? false,
    redisConnected: input?.redisConnected ?? redisConfigured,
    browserSessionPersisted: true,
    supervisorMissionCount: input?.supervisorMissionCount ?? 0,
    journeyEventsAvailable: input?.journeyEventsAvailable ?? false,
    coiRuntimeReady: input?.coiRuntimeReady ?? false,
  };
}
