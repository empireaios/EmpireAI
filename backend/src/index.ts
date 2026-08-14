import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { logCaughtError } from "./config/log-caught-error.js";
import { buildApp } from "./app.js";
import {
  startTier0IsolatedPrimary,
  tier0IsolationEnabled,
} from "./runtime/tier0-isolated-primary.js";

async function main() {
  // Production: isolate Tier-0 (auth/health) from sql.js Brain worker so
  // synchronous multi-GB exports cannot lock Grand King out of login/session.
  if (tier0IsolationEnabled()) {
    try {
      await startTier0IsolatedPrimary();
      return;
    } catch (error) {
      logCaughtError(
        logger,
        error,
        "Tier-0 isolation failed to start — falling back to monolith Brain (auth may block during sql.js flush)",
      );
      // Fall through to monolith boot rather than leave Railway with no process.
    }
  }

  // Free ENOSPC headroom before sql.js can export (temps / old quarantines only).
  const { reclaimEphemeralVolumeFiles } = await import("./runtime/volume-reclaim.js");
  reclaimEphemeralVolumeFiles();

  const { enforceProductionPersistenceGate } = await import(
    "./runtime/production-persistence-gate.js"
  );
  enforceProductionPersistenceGate();

  const productionEarlyListen = env.NODE_ENV === "production";
  const { app, shutdown, finishRouteRegistration } = await buildApp({
    startWorkers: !productionEarlyListen,
    startScheduler: !productionEarlyListen,
    earlyListen: productionEarlyListen,
  });

  const handleShutdown = async () => {
    await shutdown();
    process.exit(0);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(
    {
      port: env.PORT,
      earlyListen: productionEarlyListen,
      role: process.env.EMPIRE_ROLE || "monolith",
    },
    "EmpireAI Brain API listening",
  );

  const { startEventLoopLagMonitor } = await import("./runtime/event-loop-cooperative.js");
  startEventLoopLagMonitor();

  const { startExecutiveContinuityWatchdog } = await import(
    "./runtime/executive-continuity-watchdog.js"
  );
  startExecutiveContinuityWatchdog();

  if (finishRouteRegistration && process.env.EMPIRE_ENABLE_EXTENSION_ROUTES === "true") {
    const deferMs = Number(process.env.EMPIRE_EXTENSION_ROUTE_DEFER_MS ?? 10 * 60 * 1000);
    setTimeout(() => {
      void finishRouteRegistration()
        .then(() => logger.info("Empire extension routes registered (deferred)"))
        .catch((error) =>
          logCaughtError(logger, error, "Empire extension route registration failed"),
        );
    }, deferMs);
    logger.info({ deferMs }, "Deferred REAL module HTTP route registration");
  } else if (finishRouteRegistration) {
    logger.info(
      "Skipping REAL module HTTP route registration in production (Cockpit-critical routes only)",
    );
  }
}

main().catch((error) => {
  logCaughtError(logger, error, "Failed to start EmpireAI Brain API");
  process.exit(1);
});
