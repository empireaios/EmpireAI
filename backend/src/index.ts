import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { buildApp } from "./app.js";

async function main() {
  const { app, shutdown } = await buildApp({
    startWorkers: true,
    startScheduler: true,
  });

  const handleShutdown = async () => {
    await shutdown();
    process.exit(0);
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info({ port: env.PORT }, "EmpireAI Brain API listening");
}

main().catch((error) => {
  logger.error({ error }, "Failed to start EmpireAI Brain API");
  process.exit(1);
});
