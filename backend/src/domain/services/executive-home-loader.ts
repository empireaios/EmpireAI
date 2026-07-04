/**
 * Non-blocking Executive Home loader for production Brain dispatch.
 * Yields the event loop between aggregation stages so /health/live stays responsive.
 */
import { logger } from "../../config/logger.js";
import type { ExecutiveHomeView } from "./cockpit-panel-views.js";
import {
  assembleExecutiveHomeViewAsync,
  buildMinimalExecutiveHomeFallbackAsync,
} from "./executive-home-sync.js";

const DEFAULT_COMPANY = "co-grand-king";
const CACHE_TTL_MS = 60_000;
const DISPATCH_TIMEOUT_MS = Number(process.env.EXECUTIVE_HOME_DISPATCH_TIMEOUT_MS ?? 90_000);

type CacheEntry = { expires: number; view: ExecutiveHomeView };

const viewCache = new Map<string, CacheEntry>();
const inFlightLoads = new Map<string, Promise<{ view: ExecutiveHomeView; trace: Record<string, number> }>>();

export type ExecutiveHomeDispatchPayload = ExecutiveHomeView & {
  _trace?: Record<string, number>;
  _cached?: boolean;
  _fallback?: boolean;
};

function cacheKey(workspaceId: string, companyId?: string): string {
  return `${workspaceId}:${companyId ?? DEFAULT_COMPANY}`;
}

function getCachedView(key: string): ExecutiveHomeView | null {
  const entry = viewCache.get(key);
  if (!entry || entry.expires <= Date.now()) {
    return null;
  }
  return entry.view;
}

function setCachedView(key: string, view: ExecutiveHomeView): void {
  viewCache.set(key, { expires: Date.now() + CACHE_TTL_MS, view });
}

async function assembleExecutiveHomeView(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
): Promise<{ view: ExecutiveHomeView; trace: Record<string, number> }> {
  const trace: Record<string, number> = {};
  const view = await assembleExecutiveHomeViewAsync(workspaceId, companyId, env, trace);
  return { view, trace };
}

async function buildMinimalFallbackView(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
): Promise<ExecutiveHomeView> {
  return buildMinimalExecutiveHomeFallbackAsync(workspaceId, companyId, env);
}

async function loadFreshExecutiveHomeView(
  workspaceId: string,
  companyId: string | undefined,
  env: NodeJS.ProcessEnv,
): Promise<{ view: ExecutiveHomeView; trace: Record<string, number> }> {
  const key = cacheKey(workspaceId, companyId);
  const existing = inFlightLoads.get(key);
  if (existing) {
    return existing;
  }

  const loadPromise = assembleExecutiveHomeView(workspaceId, companyId, env)
    .then((result) => {
      setCachedView(key, result.view);
      return result;
    })
    .finally(() => {
      inFlightLoads.delete(key);
    });

  inFlightLoads.set(key, loadPromise);
  return loadPromise;
}

export async function loadExecutiveHomeForDispatch(
  workspaceId: string,
  companyId?: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ExecutiveHomeDispatchPayload> {
  const key = cacheKey(workspaceId, companyId);
  const cached = getCachedView(key);
  if (cached) {
    return {
      ...cached,
      _cached: true,
      _trace: { cacheHitMs: 0, totalMs: 0 },
      _fallback: false,
    };
  }

  const started = performance.now();
  const trace: Record<string, number> = {};

  try {
    const { view, trace: assemblyTrace } = await Promise.race([
      loadFreshExecutiveHomeView(workspaceId, companyId, env),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("EXECUTIVE_HOME_TIMEOUT")), DISPATCH_TIMEOUT_MS);
      }),
    ]);

    Object.assign(trace, assemblyTrace);
    trace.totalMs = Math.round(performance.now() - started);
    logger.info({ workspaceId, trace }, "Executive home dispatch completed");

    return { ...view, _trace: trace, _cached: false, _fallback: false };
  } catch (error) {
    trace.totalMs = Math.round(performance.now() - started);
    const stale = getCachedView(key);

    if (stale) {
      logger.warn(
        { workspaceId, trace, error: error instanceof Error ? error.message : String(error) },
        "Executive home dispatch failed — serving stale cache",
      );
      return { ...stale, _trace: trace, _cached: true, _fallback: true };
    }

    const fallback = await buildMinimalFallbackView(workspaceId, companyId, env);
    logger.warn(
      { workspaceId, trace, error: error instanceof Error ? error.message : String(error) },
      "Executive home dispatch failed — serving minimal fallback",
    );
    return { ...fallback, _trace: trace, _cached: false, _fallback: true };
  }
}

/** @deprecated Production warmup removed — it blocked auth/login after deploy. */
export function scheduleExecutiveHomeCacheWarmup(
  workspaceId: string,
  companyId?: string,
  delayMs = Number(process.env.EXECUTIVE_HOME_WARMUP_DELAY_MS ?? 3_000),
): void {
  setTimeout(() => {
    void loadFreshExecutiveHomeView(workspaceId, companyId, process.env)
      .then(({ trace }) =>
        logger.info({ workspaceId, companyId, trace }, "Executive home cache warmed"),
      )
      .catch((error) =>
        logger.warn(
          {
            workspaceId,
            error: error instanceof Error ? error.message : String(error),
          },
          "Executive home cache warmup failed",
        ),
      );
  }, delayMs);
}

/** Test-only */
export function clearExecutiveHomeViewCache(): void {
  viewCache.clear();
  inFlightLoads.clear();
}
