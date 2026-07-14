import { isPillowProductionModeEnabled } from "../version-1-activation/version-1-activation-config.js";
import type { ProductionModeSnapshot } from "@empireai/pillow";

/** Collect live production mode snapshot for Pillow engine (P5-02). */
export function collectProductionModeSnapshot(
  env: NodeJS.ProcessEnv = process.env,
): ProductionModeSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    pillowProductionMode: isPillowProductionModeEnabled(env),
    extensionRoutesEnabled: env.EMPIRE_ENABLE_EXTENSION_ROUTES === "true",
    guardianEnabled: env.GUARDIAN_ENABLED !== "false",
    workersInProcess: env.NODE_ENV !== "production",
    redisOptional: env.REDIS_OPTIONAL === "true",
    liveCommerceMode: env.LIVE_COMMERCE_INTEGRATION_MODE ?? "sandbox",
    operationalReadyFlag: env.EMPIRE_V1_OPERATIONAL_READY === "true",
  };
}
