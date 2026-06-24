import { logger } from "./config/logger.js";
import { createBrain } from "./brain/index.js";

async function main() {
  const brain = await createBrain({ startWorkers: true, startScheduler: true });

  logger.info("EmpireAI Brain worker process running");

  const shutdown = async () => {
    await brain.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error({ error }, "Failed to start EmpireAI Brain worker");
  process.exit(1);
});
