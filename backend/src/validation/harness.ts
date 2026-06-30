import { threadId } from "node:worker_threads";
import fs from "node:fs";
import path from "node:path";
import { coreTools } from "../agents/tools/core-tools.js";
import { aiCeoTools } from "../agents/tools/ai-ceo-tools.js";
import { moduleLoadTools } from "../agents/tools/module-load-tools.js";
import { domainTools } from "../agents/tools/domain-tools.js";
import { productScoutTools } from "../agents/tools/product-scout-tools.js";
import { supplierIntelligenceTools } from "../agents/tools/supplier-intelligence-tools.js";
import { storeExecutionTools } from "../agents/store-execution-bridge/index.js";
import { orderExecutionTools } from "../agents/order-execution-bridge/index.js";
import { resetDatabaseInstance } from "../brain/database.js";
import { createBrain, type EmpireBrain } from "../brain/index.js";
import type { ToolRegistry } from "../brain/tools/tool-registry.js";
import { seedDomainData } from "../domain/seed.js";
import type { RedisClient } from "../config/redis-client.js";

/** Isolated validation DB per test worker — avoids parallel test file collisions on disk. */
export function resolveValidationDatabasePath(): string {
  // Node's test runner executes each test file in a separate worker thread (shared process.pid).
  const isolateKey = `${process.pid}-${threadId}`;
  return `:memory:validation-${isolateKey}`;
}

/** Mirrors the tool bundle registered in createBrain() before agent setup. */
export function registerStandardBrainTools(toolRegistry: ToolRegistry): void {
  const brainTools = [
    ...coreTools,
    ...moduleLoadTools,
    ...aiCeoTools,
    ...domainTools,
    ...productScoutTools,
    ...supplierIntelligenceTools,
    ...storeExecutionTools,
    ...orderExecutionTools,
  ];
  const uniqueTools = [
    ...new Map(brainTools.map((tool) => [tool.name, tool])).values(),
  ];
  toolRegistry.registerMany(uniqueTools);
}

export function configureValidationEnvironment(): void {
  const validationDb = resolveValidationDatabasePath();
  process.env.DATABASE_PATH = validationDb;
  process.env.GUARDIAN_ENABLED = "true";
  if (!validationDb.startsWith(":memory:")) {
    fs.mkdirSync(path.dirname(path.resolve(validationDb)), { recursive: true });
  }
  resetDatabaseInstance();
}

export async function createValidationBrain(options?: {
  startWorkers?: boolean;
  startScheduler?: boolean;
}): Promise<EmpireBrain> {
  configureValidationEnvironment();
  resetDatabaseInstance();
  seedDomainData("ws_validation");
  return createBrain({
    startWorkers: options?.startWorkers ?? false,
    startScheduler: options?.startScheduler ?? false,
  });
}

export async function isRedisAvailable(redis: RedisClient | null): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export async function teardownBrain(brain: EmpireBrain): Promise<void> {
  await brain.shutdown();
  resetDatabaseInstance();
}
