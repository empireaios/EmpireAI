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

/** Hostname from REDIS_URL with credentials stripped (safe for logs). */
export function maskRedisUrlHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    const withoutScheme = url.replace(/^[a-z+]+:\/\//i, "");
    const hostPart = withoutScheme.includes("@")
      ? withoutScheme.slice(withoutScheme.lastIndexOf("@") + 1)
      : withoutScheme;
    return hostPart.split(/[/:]/)[0] || "[invalid-redis-url]";
  }
}

/**
 * Return REDIS_URL with password masked; protocol, username, host, and port unchanged.
 * Example: rediss://default:SECRET@host:6379 → rediss://default:***@host:6379
 */
export function maskRedisUrlPassword(url: string): string {
  if (!url.includes("@")) {
    return url;
  }

  return url.replace(
    /^((?:rediss?:)?\/\/[^:@/]*:)([^@/]+)(@)/i,
    "$1***$3",
  );
}

function logRedisUrlBeforeClientCreation(
  url: string,
  clientKind: "probe" | "persistent" | "bullmq",
): void {
  const redisUrl = maskRedisUrlPassword(url);

  logger.info({ redisUrl, clientKind }, "Creating ioredis client");

  if (url.startsWith("//") && !/^rediss?:\/\//i.test(url)) {
    logger.warn(
      { redisUrl },
      "REDIS_URL is protocol-relative (starts with //) — ioredis defaults to non-TLS redis://, not rediss://",
    );
  }
}

function normalizeRedisError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/** Log full Redis connection failure details before entering degraded mode. */
export function logRedisConnectionFailure(url: string, error: unknown): void {
  const host = maskRedisUrlHost(url);
  const err = normalizeRedisError(error);

  logger.error(
    {
      host,
      errorMessage: err.message,
      errorName: err.name,
      errorStack: err.stack,
      err,
    },
    "Redis connection failed",
  );
}

function attachProbeErrorCapture(
  client: Redis,
  onError: (error: Error) => void,
): void {
  let captured = false;
  client.on("error", (error) => {
    if (captured) return;
    captured = true;
    onError(error);
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
  logRedisUrlBeforeClientCreation(url, "probe");

  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });

  let probeError: Error | undefined;
  attachProbeErrorCapture(client, (error) => {
    probeError = error;
  });

  try {
    await Promise.race([
      client.connect().then(() => client.ping()),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Redis probe timeout")), timeoutMs);
      }),
    ]);
    await client.quit();
    return true;
  } catch (error) {
    const failure = probeError ?? error;
    logRedisConnectionFailure(url, failure);
    client.disconnect();
    return false;
  }
}

export function createRedisClient(
  url: string,
  options?: RedisOptions,
): RedisClient {
  logRedisUrlBeforeClientCreation(url, "persistent");

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
  logRedisUrlBeforeClientCreation(url, "bullmq");

  return {
    url,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > REDIS_MAX_RETRIES) return null;
      return Math.min(times * 200, 2_000);
    },
  };
}
