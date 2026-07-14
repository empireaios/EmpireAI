import { configureValidationEnvironment } from "../validation/harness.js";
import { seedDomainData } from "../domain/seed.js";
import { bootstrapFoundation } from "../foundation/index.js";
import { seedGrandKingAccount } from "../grand-king/index.js";
import { getGrandKingAutomationServer } from "../grand-king/automation/grand-king-automation-server.js";
import { logger } from "../config/logger.js";

async function main() {
  configureValidationEnvironment();
  seedDomainData();
  bootstrapFoundation("ws_empire_1");
  seedGrandKingAccount();

  const server = getGrandKingAutomationServer();
  server.start();

  logger.info("Grand King automation server running (Grand King account only)");

  const shutdown = () => {
    server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error({ error }, "Grand King automation server failed");
  process.exit(1);
});
