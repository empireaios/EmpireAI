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

  if (finishRouteRegistration) {
    // REAL module HTTP routes are not required for Cockpit auth, dispatch, or Pillow chat.
    // Register them after a delay so production stays responsive for the Grand King journey.
    const deferMs = 10 * 60 * 1000;
    setTimeout(() => {
      void finishRouteRegistration()
        .then(() => logger.info("Empire extension routes registered (deferred)"))
        .catch((error) =>
          logger.error({ error }, "Empire extension route registration failed"),
        );
    }, deferMs);
    logger.info({ deferMs }, "Deferred REAL module HTTP route registration");
  }
}

main().catch((error) => {
  logger.error({ error }, "Failed to start EmpireAI Brain API");
  process.exit(1);
});
