import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { buildApp } from "./app.js";

async function main() {
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
  logger.info({ port: env.PORT, earlyListen: productionEarlyListen }, "EmpireAI Brain API listening");

  if (env.NODE_ENV === "production") {
    const { scheduleExecutiveHomeCacheWarmup } = await import(
      "./domain/services/executive-home-loader.js"
    );
    scheduleExecutiveHomeCacheWarmup("ws_empire_1", "co-grand-king");
  }

  if (finishRouteRegistration && process.env.EMPIRE_ENABLE_EXTENSION_ROUTES === "true") {
    const deferMs = Number(process.env.EMPIRE_EXTENSION_ROUTE_DEFER_MS ?? 10 * 60 * 1000);
    setTimeout(() => {
      void finishRouteRegistration()
        .then(() => logger.info("Empire extension routes registered (deferred)"))
        .catch((error) =>
          logger.error({ error }, "Empire extension route registration failed"),
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
  logger.error({ error }, "Failed to start EmpireAI Brain API");
  process.exit(1);
});
