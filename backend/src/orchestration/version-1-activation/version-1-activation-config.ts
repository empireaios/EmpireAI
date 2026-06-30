/** Version 1 production marketplace — Amazon only (M3 scope). */
export const V1_PRODUCTION_MARKETPLACE_ID = "amazon" as const;
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

/** Amazon SP-API env credentials present (M2). */
export function hasAmazonSpApiEnvCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  const cfg = {
    clientId: env.AMAZON_SP_API_CLIENT_ID,
    clientSecret: env.AMAZON_SP_API_CLIENT_SECRET,
    refreshToken: env.AMAZON_SP_API_REFRESH_TOKEN,
  };
  return (
    hasNonEmpty(cfg.clientId) &&
    hasNonEmpty(cfg.clientSecret) &&
    hasNonEmpty(cfg.refreshToken)
  );
}

/** CJ Dropshipping credentials — supports both env naming conventions. */
export function hasCjDropshippingEnvCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  const apiKey = env.CJ_DROPSHIPPING_API_KEY ?? env.CJ_API_KEY;
  const apiSecret = env.CJ_DROPSHIPPING_API_SECRET ?? env.CJ_API_SECRET;
  return hasNonEmpty(apiKey) && hasNonEmpty(apiSecret);
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

/** M3 — Amazon live publish/order path enabled (production mode + credentials). */
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
  if (platformId === V1_PRODUCTION_REALITY_MARKETPLACE) {
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
    blockers.push("AMAZON_SP_API_CLIENT_ID/SECRET/REFRESH_TOKEN not configured");
  }
  if (!gates.cjDropshippingCredentials) {
    blockers.push("CJ_DROPSHIPPING_API_KEY/SECRET (or CJ_API_KEY/SECRET) not configured");
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
