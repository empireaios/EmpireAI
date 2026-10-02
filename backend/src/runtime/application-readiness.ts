import type { FastifyInstance } from "fastify";

export type RedisPingClient = {
  ping: () => Promise<unknown>;
};

export type WorkerApplicationReadinessInput = {
  authReady: boolean;
  redisReady: boolean;
  pillowEnabled: boolean;
  pillowLifecycle: string;
  pillowRequired?: boolean;
};

export type Tier0ApplicationReadinessInput = {
  workerReady: boolean;
  primarySessionStoreReady: boolean;
};

export type WorkerAuthReadinessReport = {
  ready: boolean;
  status: "ready" | "not_ready";
  checks: Array<{ key: string; ok: boolean; detail: string }>;
  blockers: string[];
  [key: string]: unknown;
};

export type PillowLifecycleSnapshot = {
  lifecycle: string;
  health: unknown;
  lastError: unknown;
};

export type WorkerReadinessRouteDependencies = {
  assessAuthReadiness: () => WorkerAuthReadinessReport | Promise<WorkerAuthReadinessReport>;
  probeRedisConnectivity: (timeoutMs?: number) => Promise<boolean>;
  redisMode: "connected" | "degraded";
  redisRequired: boolean;
  pillowEnabled: boolean;
  pillowRequired: boolean;
  getPillowStatus: () => PillowLifecycleSnapshot;
};

/**
 * Probe the Redis connection that actually backs the current process' session
 * store. A fresh URL probe is not sufficient: if this client is absent, the
 * process is still using its private in-memory store and cannot share sessions.
 */
export async function probeRedisSessionStore(
  client: RedisPingClient | null,
  timeoutMs = 1_500,
): Promise<boolean> {
  if (!client) return false;

  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const response = await Promise.race([
      client.ping(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("redis_readiness_timeout")), timeoutMs);
      }),
    ]);
    return response === "PONG";
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function buildWorkerApplicationReadiness(input: WorkerApplicationReadinessInput) {
  const pillowRequired = input.pillowRequired ?? true;
  const pillowReady =
    !pillowRequired || (input.pillowEnabled && input.pillowLifecycle === "running");
  const ready = input.authReady && input.redisReady && pillowReady;
  return {
    statusCode: ready ? 200 : 503,
    ready,
    pillowReady,
  } as const;
}

/**
 * Register the Brain/Pillow readiness endpoint behind injectable live probes.
 * Keeping the probes inside the request handler prevents a successful startup
 * snapshot from masking a later Redis or Pillow failure.
 */
export function registerWorkerApplicationReadinessRoute(
  app: FastifyInstance,
  dependencies: WorkerReadinessRouteDependencies,
): void {
  app.get("/health/ready", async (_request, reply) => {
    const [report, redisReachable] = await Promise.all([
      dependencies.assessAuthReadiness(),
      dependencies.probeRedisConnectivity(1_500),
    ]);
    const pillowStatus = dependencies.getPillowStatus();
    const redisReady =
      !dependencies.redisRequired ||
      (dependencies.redisMode === "connected" && redisReachable);
    const readiness = buildWorkerApplicationReadiness({
      authReady: report.ready,
      redisReady,
      pillowEnabled: dependencies.pillowEnabled,
      pillowLifecycle: pillowStatus.lifecycle,
      pillowRequired: dependencies.pillowRequired,
    });
    const checks = [
      ...report.checks,
      {
        key: "redis_connectivity",
        ok: !dependencies.redisRequired || redisReachable,
        detail: redisReachable
          ? "PING_OK"
          : dependencies.redisRequired
            ? "Redis-backed shared session store unavailable"
            : "OPTIONAL_UNAVAILABLE",
      },
      {
        key: "shared_session_store",
        ok: redisReady,
        detail: redisReady
          ? dependencies.redisRequired
            ? "REDIS_READY"
            : "OPTIONAL"
          : "Redis-backed shared session store unavailable",
      },
      {
        key: "pillow_lifecycle",
        ok: readiness.pillowReady,
        detail: dependencies.pillowEnabled ? pillowStatus.lifecycle : "disabled",
      },
    ];
    const blockers = [...report.blockers];
    if (!redisReady) blockers.push("Redis-backed shared session store unavailable");
    if (!readiness.pillowReady) {
      blockers.push(
        dependencies.pillowEnabled
          ? `Pillow lifecycle is ${pillowStatus.lifecycle} (expected running)`
          : "Pillow runtime is disabled",
      );
    }
    const payload = {
      ...report,
      ready: readiness.ready,
      status: readiness.ready ? ("ready" as const) : ("not_ready" as const),
      checks,
      blockers,
      brain: "online" as const,
      process: "running" as const,
      redis: {
        ready: redisReady,
        reachable: redisReachable,
        mode: dependencies.redisMode,
        required: dependencies.redisRequired,
      },
      pillow: {
        enabled: dependencies.pillowEnabled,
        required: dependencies.pillowRequired,
        ready: readiness.pillowReady,
        lifecycle: pillowStatus.lifecycle,
        health: pillowStatus.health,
        lastError: pillowStatus.lastError,
      },
    };
    return reply.code(readiness.statusCode).send(payload);
  });
}

export function buildTier0ApplicationReadiness(input: Tier0ApplicationReadinessInput) {
  const ready = input.workerReady && input.primarySessionStoreReady;
  return {
    statusCode: ready ? 200 : 503,
    ready,
  } as const;
}
