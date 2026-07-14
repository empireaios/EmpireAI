import { PRODUCTION_COMPONENT_REGISTRY, getComponentsByState } from "./component-registry.js";
import { FEATURE_FLAG_REGISTRY } from "./feature-flag-registry.js";
import type {
  ProductionModeAssessment,
  ProductionModeSnapshot,
} from "./types.js";

function buildGrandKingSummary(input: {
  enabled: string[];
  disabled: string[];
  limited: string[];
  deferred: string[];
  experimental: string[];
}): string {
  return [
    `Running: ${input.enabled.join(", ") || "none"}`,
    `Limited: ${input.limited.join(", ") || "none"}`,
    `Disabled: ${input.disabled.join(", ") || "none"}`,
    `Deferred: ${input.deferred.join(", ") || "none"}`,
    `Requires config: EMPIRE_V1_OPERATIONAL_READY, LIVE_COMMERCE_INTEGRATION_MODE, EMPIRE_ENABLE_EXTENSION_ROUTES`,
  ].join(" · ");
}

/** Execute Production Mode assessment (P5-02). */
export function executeProductionModeAssessment(input: {
  snapshot?: ProductionModeSnapshot | null;
}): ProductionModeAssessment {
  const snapshot = input.snapshot ?? null;

  const enabledModules = getComponentsByState("production_enabled").map((c) => c.name);
  const disabledModules = getComponentsByState("production_disabled").map((c) => c.name);
  const limitedModules = getComponentsByState("production_limited").map((c) => c.name);
  const deferredModules = getComponentsByState("deferred").map((c) => c.name);
  const experimentalModules = getComponentsByState("experimental").map((c) => c.name);

  let overallStatus: ProductionModeAssessment["overallStatus"] = "operational";
  if (snapshot?.extensionRoutesEnabled) {
    overallStatus = "limited";
  }
  if (!snapshot?.operationalReadyFlag && snapshot?.nodeEnv === "production") {
    overallStatus = "limited";
  }

  const grandKingSummary = buildGrandKingSummary({
    enabled: enabledModules,
    disabled: disabledModules,
    limited: limitedModules,
    deferred: deferredModules,
    experimental: experimentalModules,
  });

  return {
    pipelineVersion: "P5-02",
    assessedAt: new Date().toISOString(),
    overallStatus,
    enabledModules,
    disabledModules,
    limitedModules,
    deferredModules,
    experimentalModules,
    featureFlags: FEATURE_FLAG_REGISTRY,
    components: PRODUCTION_COMPONENT_REGISTRY,
    snapshot,
    success: PRODUCTION_COMPONENT_REGISTRY.every((c) => Boolean(c.productionState && c.reason)),
    summary: `Production Mode assessed — ${enabledModules.length} enabled · ${disabledModules.length} disabled · ${limitedModules.length} limited · ${deferredModules.length} deferred`,
    grandKingSummary,
  };
}

export function buildDefaultProductionSnapshot(): ProductionModeSnapshot {
  const env = process.env;
  return {
    capturedAt: new Date().toISOString(),
    nodeEnv: env.NODE_ENV ?? "development",
    pillowProductionMode: env.EMPIRE_V1_OPERATIONAL_READY === "true",
    extensionRoutesEnabled: env.EMPIRE_ENABLE_EXTENSION_ROUTES === "true",
    guardianEnabled: env.GUARDIAN_ENABLED !== "false",
    workersInProcess: env.NODE_ENV !== "production",
    redisOptional: env.REDIS_OPTIONAL === "true",
    liveCommerceMode: env.LIVE_COMMERCE_INTEGRATION_MODE ?? "sandbox",
    operationalReadyFlag: env.EMPIRE_V1_OPERATIONAL_READY === "true",
  };
}
