import { Redis, type RedisOptions } from "ioredis";
import type { ConnectionOptions } from "bullmq";
import { env } from "./env.js";
import { logger } from "./logger.js";

/** Shared Redis client for EmpireAI pub/sub and direct Redis operations. */
export type RedisClient = Redis;

export { Redis as IORedis };

export const REDIS_START_HINT =
  "redis-server, Upstash REDIS_URL, or npm run dev:redis (optional Docker)";

const REDIS_PROBE_TIMEOUT_MS = 2_000;
const REDIS_MAX_RETRIES = 3;

export function shouldAllowRedisDegradedMode(): boolean {
  if (env.REDIS_OPTIONAL) return true;
  if (env.NODE_ENV === "development") return true;
  if (process.env.VERCEL) return true;
  return false;
}

function attachQuietErrorHandler(client: Redis): void {
  let logged = false;
  client.on("error", (error) => {
    if (logged) return;
    logged = true;
    void error;
  });
}

export function attachRedisErrorHandlerOnce(client: Redis): void {
  let logged = false;
  client.on("error", (error) => {
    if (logged) return;
    logged = true;
    logger.warn({ err: error.message }, "Redis connection error");
  });
}

export async function probeRedisAvailable(
  url: string,
  timeoutMs = REDIS_PROBE_TIMEOUT_MS,
): Promise<boolean> {
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });

  attachQuietErrorHandler(client);

  try {
    await Promise.race([
      client.connect().then(() => client.ping()),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Redis probe timeout")), timeoutMs);
      }),
    ]);
    await client.quit();
    return true;
  } catch {
    client.disconnect();
    return false;
  }
}

export function createRedisClient(
  url: string,
  options?: RedisOptions,
): RedisClient {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > REDIS_MAX_RETRIES) return null;
      return Math.min(times * 200, 2_000);
    },
    ...options,
  });

  attachRedisErrorHandlerOnce(client);

  return client;
}

/**
 * BullMQ resolves ConnectionOptions against its bundled ioredis typings.
 * Pass plain connection options (not a root ioredis instance) to avoid duplicate-package type conflicts.
 */
export function createBullMQConnection(url: string): ConnectionOptions {
  return {
    url,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > REDIS_MAX_RETRIES) return null;
      return Math.min(times * 200, 2_000);
    },
  };
}
