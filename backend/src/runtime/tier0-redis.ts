import { createRedisClient } from "../config/redis-client.js";

/** Tier-0 always retains its shared store binding through outages. No memory fallback. */
export function createTier0RedisClient(url: string) {
  return createRedisClient(url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 1_500,
    // Network recovery continues for the process lifetime; HTTP commands fail
    // quickly while disconnected rather than waiting behind buffered commands.
    retryStrategy: (attempt) => Math.min(10_000, Math.max(500, attempt * 500)),
  });
}

/** A command is never buffered while disconnected; callers can await readiness explicitly. */
export async function waitForRuntimeRedisReady(client: ReturnType<typeof createTier0RedisClient>, timeoutMs = 2_000): Promise<void> {
  if (client.status === "ready") return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); client.off("ready", onReady); client.off("end", onEnd); };
    const onReady = () => { cleanup(); resolve(); };
    const onEnd = () => { cleanup(); reject(new Error("shared_redis_unavailable")); };
    const timer = setTimeout(onEnd, timeoutMs);
    client.once("ready", onReady);
    client.once("end", onEnd);
    if (client.status === "ready") onReady();
    else if (client.status === "end") onEnd();
  });
}
