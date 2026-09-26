import { probeRedisAvailable } from "../config/redis-client.js";
import { createTier0RedisClient, waitForRuntimeRedisReady } from "./tier0-redis.js";

export class WorkerSharedRedisUnavailableError extends Error {
  constructor() { super("Worker shared Redis unavailable; production memory fallback is forbidden"); }
}

/** Worker boot must either have shared durability or fail for the supervisor to retry. */
export async function createWorkerRedisBinding(options: {
  url: string;
  production: boolean;
  allowDegraded: boolean;
}) {
  if (!(await probeRedisAvailable(options.url))) {
    if (options.production || !options.allowDegraded) throw new WorkerSharedRedisUnavailableError();
    return { redis: null, redisMode: "degraded" as const };
  }
  const redis = createTier0RedisClient(options.url);
  try {
    await waitForRuntimeRedisReady(redis);
    return { redis, redisMode: "connected" as const };
  } catch {
    redis.disconnect();
    throw new WorkerSharedRedisUnavailableError();
  }
}
