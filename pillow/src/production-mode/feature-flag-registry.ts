import type { FeatureFlagRecord } from "./types.js";

/** Canonical feature flag registry — every production flag documented (P5-02). */
export const FEATURE_FLAG_REGISTRY: FeatureFlagRecord[] = [
  {
    id: "FF-V1-READY",
    envVar: "EMPIRE_V1_OPERATIONAL_READY",
    purpose: "Enable Pillow full production mode after operational validation",
    defaultValue: "false",
    productionDefault: "false (manual enable)",
    dependencies: ["LIVE_COMMERCE_INTEGRATION_MODE=production", "Credential vault", "SP-API", "CJ API"],
    operationalImpact: "Pillow switches from dry-run readiness to production mode",
    documented: true,
  },
  {
    id: "FF-EXT-ROUTES",
    envVar: "EMPIRE_ENABLE_EXTENSION_ROUTES",
    purpose: "Register ~150 REAL extension HTTP routes after boot defer",
    defaultValue: "false",
    productionDefault: "false",
    dependencies: ["Brain API boot complete"],
    operationalImpact: "Enables deferred business engine HTTP surfaces",
    documented: true,
  },
  {
    id: "FF-EXT-DEFER",
    envVar: "EMPIRE_EXTENSION_ROUTE_DEFER_MS",
    purpose: "Delay before extension route registration",
    defaultValue: "600000",
    productionDefault: "600000 (10 min)",
    dependencies: ["EMPIRE_ENABLE_EXTENSION_ROUTES=true"],
    operationalImpact: "Controls when extension routes mount",
    documented: true,
  },
  {
    id: "FF-GUARDIAN",
    envVar: "GUARDIAN_ENABLED",
    purpose: "Enable Guardian pre-dispatch governance",
    defaultValue: "true",
    productionDefault: "true",
    dependencies: [],
    operationalImpact: "Guardian assesses dispatch requests",
    documented: true,
  },
  {
    id: "FF-REDIS-OPT",
    envVar: "REDIS_OPTIONAL",
    purpose: "Allow Brain to start without Redis (degraded mode)",
    defaultValue: "false",
    productionDefault: "false",
    dependencies: ["REDIS_URL"],
    operationalImpact: "DegradedTaskQueue no-op when Redis unavailable",
    documented: true,
  },
  {
    id: "FF-LIVE-COMMERCE",
    envVar: "LIVE_COMMERCE_INTEGRATION_MODE",
    purpose: "Commerce integration mode: disabled | sandbox | production",
    defaultValue: "sandbox",
    productionDefault: "sandbox (until credentials configured)",
    dependencies: ["CREDENTIAL_VAULT_KEY", "Marketplace tokens"],
    operationalImpact: "Controls live Amazon/CJ order paths",
    documented: true,
  },
  {
    id: "FF-LEGACY-GA",
    envVar: "EMPIRE_LEGACY_GC05_GLOBAL_ASSISTANT",
    purpose: "Enable legacy global assistant routes",
    defaultValue: "false",
    productionDefault: "false",
    dependencies: [],
    operationalImpact: "Legacy assistant HTTP surface",
    documented: true,
  },
  {
    id: "FF-NODE-ENV",
    envVar: "NODE_ENV",
    purpose: "Runtime environment — controls worker boot and Pillow lazy start",
    defaultValue: "development",
    productionDefault: "production",
    dependencies: [],
    operationalImpact: "Production: earlyListen, no in-process workers, lazy Pillow",
    documented: true,
  },
];

export function getUndocumentedFlags(): FeatureFlagRecord[] {
  return FEATURE_FLAG_REGISTRY.filter((f) => !f.documented);
}
