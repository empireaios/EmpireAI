import {
  type AmazonMarketplaceRegistryId,
  hasAmazonMarketplaceEnvCredentials,
  hasAmazonSpApiEnvCredentials,
  isAmazonMarketplaceRegistryId,
} from "../reality-integration/live-commerce/amazon-marketplace-profiles.js";

/** Version 1 production marketplaces — ADR-052 / B6-01D. */
export const V1_PRODUCTION_MARKETPLACE_IDS = ["amazon-us", "amazon-sg"] as const;

/** Publish-layer umbrella id (legacy listing packages). */
export const V1_PRODUCTION_MARKETPLACE_ID = "amazon" as const;

/** @deprecated Use V1_PRODUCTION_MARKETPLACE_IDS — B6-01D multi-region. */
export const V1_PRODUCTION_REALITY_MARKETPLACE = "amazon-seller" as const;

export const V1_PRODUCTION_REALITY_SUPPLIER = "cj-dropshipping" as const;

export type Version1ActivationAssessment = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  gates: Record<string, boolean>;
};

function hasNonEmpty(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export { hasAmazonSpApiEnvCredentials, hasAmazonMarketplaceEnvCredentials };

/** CJ Dropshipping credentials — CJ API 2.0 requires API key only (secret optional legacy). */
export function hasCjDropshippingEnvCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  const apiKey = env.CJ_DROPSHIPPING_API_KEY ?? env.CJ_API_KEY;
  return hasNonEmpty(apiKey);
}

export function hasCredentialVaultKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return hasNonEmpty(env.CREDENTIAL_VAULT_KEY);
}

function resolveLiveCommerceModeFromEnv(env: NodeJS.ProcessEnv): "disabled" | "sandbox" | "production" {
  const raw = (env.LIVE_COMMERCE_INTEGRATION_MODE ?? "sandbox").toLowerCase();
  if (raw === "disabled" || raw === "off" || raw === "false") return "disabled";
  if (raw === "production" || raw === "live") return "production";
  return "sandbox";
}

export function isLiveCommerceProductionMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return resolveLiveCommerceModeFromEnv(env) === "production";
}

/** M3 — single Amazon marketplace live path (production mode + region credentials). */
export function isAmazonMarketplaceLiveActivated(
  registryId: AmazonMarketplaceRegistryId,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isLiveCommerceProductionMode(env) && hasAmazonMarketplaceEnvCredentials(registryId, env);
}

/** M3 — all V1 Amazon marketplaces live (shared LWA app + per-region refresh tokens). */
export function isAmazonLiveCommerceActivated(env: NodeJS.ProcessEnv = process.env): boolean {
  return isLiveCommerceProductionMode(env) && hasAmazonSpApiEnvCredentials(env);
}

/** M3 — CJ live fulfilment path enabled. */
export function isCjLiveCommerceActivated(env: NodeJS.ProcessEnv = process.env): boolean {
  return isLiveCommerceProductionMode(env) && hasCjDropshippingEnvCredentials(env);
}

/** M5 — explicit flag after operational validation; never auto-enabled. */
export function isPillowProductionModeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.EMPIRE_V1_OPERATIONAL_READY === "true" && isVersion1OperationalActivationReady(env);
}

/** Grand King operational activation — credentials + production mode configured. */
export function isVersion1OperationalActivationReady(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    isLiveCommerceProductionMode(env) &&
    hasCredentialVaultKey(env) &&
    hasAmazonSpApiEnvCredentials(env) &&
    hasCjDropshippingEnvCredentials(env)
  );
}

/** OAR — platform no longer architecture-only when live-activated. */
export function isPlatformOperationallyLive(
  platformId: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (isAmazonMarketplaceRegistryId(platformId)) {
    return isAmazonMarketplaceLiveActivated(platformId, env);
  }
  if (
    platformId === V1_PRODUCTION_REALITY_MARKETPLACE ||
    platformId === V1_PRODUCTION_MARKETPLACE_ID
  ) {
    return isAmazonLiveCommerceActivated(env);
  }
  if (platformId === V1_PRODUCTION_REALITY_SUPPLIER) {
    return isCjLiveCommerceActivated(env);
  }
  return false;
}

/** M1 — scoped production readiness for Version 1 operational activation. */
export function assessVersion1OperationalActivation(
  env: NodeJS.ProcessEnv = process.env,
): Version1ActivationAssessment {
  const gates = {
    liveCommerceProductionMode: isLiveCommerceProductionMode(env),
    credentialVaultKey: hasCredentialVaultKey(env),
    amazonSpApiCredentials: hasAmazonSpApiEnvCredentials(env),
    amazonUsCredentials: hasAmazonMarketplaceEnvCredentials("amazon-us", env),
    amazonSgCredentials: hasAmazonMarketplaceEnvCredentials("amazon-sg", env),
    cjDropshippingCredentials: hasCjDropshippingEnvCredentials(env),
    amazonLiveActivated: isAmazonLiveCommerceActivated(env),
    cjLiveActivated: isCjLiveCommerceActivated(env),
    operationalReadyFlag: env.EMPIRE_V1_OPERATIONAL_READY === "true",
    pillowProductionMode: isPillowProductionModeEnabled(env),
  };

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!gates.liveCommerceProductionMode) {
    blockers.push("LIVE_COMMERCE_INTEGRATION_MODE must be production");
  }
  if (!gates.credentialVaultKey) {
    blockers.push("CREDENTIAL_VAULT_KEY required for production credential vault");
  }
  if (!gates.amazonSpApiCredentials) {
    blockers.push(
      "Amazon SP-API shared LWA credentials and per-region refresh tokens (NA + FE) not configured",
    );
  }
  if (!gates.cjDropshippingCredentials) {
    blockers.push("CJ_API_KEY (or CJ_DROPSHIPPING_API_KEY) not configured");
  }
  if (!gates.operationalReadyFlag) {
    warnings.push("EMPIRE_V1_OPERATIONAL_READY=false — Pillow remains in dry-run readiness mode");
  }
  if (isLiveCommerceProductionMode(env) && !hasCredentialVaultKey(env)) {
    blockers.push("Production live commerce with default vault key is not permitted");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    gates,
  };
}
