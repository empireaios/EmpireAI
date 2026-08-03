import type { FastifyReply } from "fastify";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { LLMRouter } from "../../brain/llm/llm-router.js";
import { logger } from "../../config/logger.js";
import { initializePillowHost, type PillowHost } from "./pillow-host.js";

let pillowBootPromise: Promise<void> | null = null;
// Align with HA boot grace (Pillow cold-start with expansion modules can exceed 2 minutes).
const PILLOW_BOOT_STUCK_MS = Number(process.env.PILLOW_BOOT_STUCK_MS ?? 250_000);
const PILLOW_BOOT_WAIT_MS = Number(
  process.env.PILLOW_BOOT_WAIT_MS ?? process.env.PILLOW_BOOT_TIMEOUT_MS ?? 240_000,
);
let pillowBootStartedAt: number | null = null;

export function schedulePillowHostBoot(
  pillowHost: PillowHost,
  llmRouter: LLMRouter,
  auditLogger: AuditLogger,
): Promise<void> | null {
  const lifecycle = pillowHost.getStatus().lifecycle;

  if (lifecycle === "running") {
    return pillowBootPromise;
  }

  if (lifecycle === "starting") {
    if (
      pillowBootStartedAt &&
      Date.now() - pillowBootStartedAt > PILLOW_BOOT_STUCK_MS
    ) {
      logger.warn("Pillow boot appears stuck — forcing recovery");
      pillowHost.forceBootFailure("Pillow boot stuck — forced recovery");
      pillowBootPromise = null;
      pillowBootStartedAt = null;
    } else if (pillowBootPromise) {
      return pillowBootPromise;
    } else {
      return waitForPillowHostRunning(pillowHost);
    }
  }

  if (!pillowBootPromise) {
    pillowHost.configure({ llmRouter, auditLogger });
    pillowBootStartedAt = Date.now();
    pillowBootPromise = initializePillowHost({ llmRouter, auditLogger })
      .then(() => undefined)
      .catch((error) => {
        logger.error(
          { error: error instanceof Error ? error.message : String(error) },
          "Pillow host boot failed",
        );
        pillowBootPromise = null;
        pillowBootStartedAt = null;
        throw error;
      });
  }

  return pillowBootPromise;
}

function waitForPillowHostRunning(pillowHost: PillowHost): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      const lifecycle = pillowHost.getStatus().lifecycle;
      if (lifecycle === "running") {
        resolve();
        return;
      }
      if (lifecycle === "error" || lifecycle === "stopped") {
        reject(new Error(pillowHost.getStatus().lastError ?? "Pillow host boot failed"));
        return;
      }
      if (Date.now() - started > PILLOW_BOOT_WAIT_MS) {
        reject(new Error(`Pillow boot wait timed out after ${PILLOW_BOOT_WAIT_MS}ms`));
        return;
      }
      setTimeout(poll, 250);
    };
    poll();
  });
}

export type PillowReadiness =
  | { ready: true }
  | {
      ready: false;
      error: string;
      lifecycle: string;
      lastError: string | null;
      retryAfterSec?: number;
    };

export async function ensurePillowHostReady(
  pillowHost: PillowHost,
  llmRouter: LLMRouter,
  auditLogger: AuditLogger,
): Promise<PillowReadiness> {
  if (pillowHost.getStatus().lifecycle === "running") {
    return { ready: true };
  }

  const bootPromise = schedulePillowHostBoot(pillowHost, llmRouter, auditLogger);
  if (bootPromise) {
    try {
      await Promise.race([
        bootPromise,
        new Promise<void>((_, reject) => {
          setTimeout(
            () => reject(new Error(`Pillow boot wait timed out after ${PILLOW_BOOT_WAIT_MS}ms`)),
            PILLOW_BOOT_WAIT_MS,
          );
        }),
      ]);
    } catch {
      // Fall through to lifecycle check so callers receive the host's lastError.
    }
  }

  if (pillowHost.getStatus().lifecycle === "running") {
    return { ready: true };
  }

  const status = pillowHost.getStatus();
  return {
    ready: false,
    error:
      status.lastError ??
      (status.lifecycle === "starting"
        ? "Pillow host is starting — retry in a moment."
        : "Pillow host is not running"),
    lifecycle: status.lifecycle,
    lastError: status.lastError,
    retryAfterSec: status.lifecycle === "starting" ? 30 : undefined,
  };
}

export async function ensurePillowHostReadyOrReply(
  pillowHost: PillowHost,
  llmRouter: LLMRouter,
  auditLogger: AuditLogger,
  reply: FastifyReply,
): Promise<boolean> {
  const readiness = await ensurePillowHostReady(pillowHost, llmRouter, auditLogger);
  if (readiness.ready) {
    return true;
  }

  // Grand King–facing error only — internal lifecycle/lastError stay in logs.
  const surfaceError =
    readiness.lifecycle === "starting"
      ? "Starting Executive Systems…"
      : "Preparing Executive Intelligence…";
  logger.warn(
    {
      lifecycle: readiness.lifecycle,
      lastError: readiness.lastError,
      internalError: readiness.error,
    },
    "Pillow host not ready for request",
  );
  void reply.code(503).send({
    error: surfaceError,
    retryAfterSec: readiness.retryAfterSec,
  });
  return false;
}

/** Fast 503 for snapshot routes that should not block on full Pillow boot. */
export function pillowStartingResponse(reply: FastifyReply) {
  return reply.code(503).send({
    error: "Starting Executive Systems…",
    retryAfterSec: 30,
  });
}

/** Test-only reset of module-level boot coordination state. */
export function resetPillowBootState(): void {
  pillowBootPromise = null;
  pillowBootStartedAt = null;
}
