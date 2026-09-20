import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { logCaughtError } from "./config/log-caught-error.js";
import {
  startTier0IsolatedPrimary,
  tier0IsolationEnabled,
} from "./runtime/tier0-isolated-primary.js";

async function main() {
  // Production: isolate Tier-0 (auth/health) from sql.js Brain worker so
  // synchronous multi-GB exports cannot lock Grand King out of login/session.
  if (tier0IsolationEnabled()) {
    process.env.EMPIRE_BOOT_MODE = "tier0-primary";
    try {
      await startTier0IsolatedPrimary();
      return;
    } catch (error) {
      process.env.EMPIRE_BOOT_MODE = "tier0-start-failed";
      logCaughtError(
        logger,
        error,
        "Tier-0 isolation failed to start — refusing unsafe monolith fallback",
      );
      throw error;
    }
  } else {
    process.env.EMPIRE_BOOT_MODE = process.env.EMPIRE_ROLE === "brain-worker" ? "brain-worker" : "monolith";
  }

  // Install before importing/bootstrapping the large Brain graph. A termination
  // during startup must await the database-owning app before flushing it.
  let finishStartup!: () => void;
  const startupFinished = new Promise<void>((resolve) => { finishStartup = resolve; });
  let shutdownAction: (() => Promise<void>) | null = null;
  let shuttingDown = false;
  const handleShutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await startupFinished;
      await shutdownAction?.();
      process.exit(0);
    } catch (error) {
      logCaughtError(logger, error, "Brain shutdown failed — persistence not confirmed");
      process.exit(1);
    }
  };
  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  // Free ENOSPC headroom before sql.js can export (temps / old quarantines only).
  const { reclaimEphemeralVolumeFiles } = await import("./runtime/volume-reclaim.js");
  reclaimEphemeralVolumeFiles();

  const { enforceProductionPersistenceGate } = await import(
    "./runtime/production-persistence-gate.js"
  );
  enforceProductionPersistenceGate();

  const productionEarlyListen = env.NODE_ENV === "production";
  // Only the Brain worker/monolith loads the full application graph. The
  // isolated primary must keep authentication independent of that graph.
  const { buildApp } = await import("./app.js");
  const { app, shutdown, finishRouteRegistration } = await buildApp({
    startWorkers: !productionEarlyListen,
    startScheduler: !productionEarlyListen,
    earlyListen: productionEarlyListen,
  });

  shutdownAction = shutdown;
  finishStartup();
  if (shuttingDown) return;

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
