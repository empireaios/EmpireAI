export type CjIntegrationMode = "SANDBOX" | "LIVE";

export type CjConfig = {
  apiBaseUrl: string;
  apiKey: string | null;
  /** Legacy optional secret — CJ API 2.0 uses apiKey only; retained for backward compatibility. */
  apiSecret: string | null;
  integrationMode: CjIntegrationMode;
  requestTimeoutMs: number;
  maxRetries: number;
  rateLimitPerMinute: number;
};

function readIntegrationMode(): CjIntegrationMode {
  const raw = process.env.CJ_INTEGRATION_MODE?.trim().toUpperCase();
  if (raw === "LIVE") {
    return "LIVE";
  }
  return "SANDBOX";
}

/** Resolves CJ API key from env (API 2.0 — key only). */
export function resolveCjApiKeyFromEnv(env: NodeJS.ProcessEnv = process.env): string | null {
  const apiKey = env.CJ_API_KEY?.trim() || env.CJ_DROPSHIPPING_API_KEY?.trim() || null;
  return apiKey || null;
}

/** Resolves legacy optional CJ API secret from env. */
export function resolveCjApiSecretFromEnv(env: NodeJS.ProcessEnv = process.env): string | null {
  const apiSecret =
    env.CJ_API_SECRET?.trim() || env.CJ_DROPSHIPPING_API_SECRET?.trim() || null;
  return apiSecret || null;
}

/** Loads CJ Dropshipping configuration from environment variables. */
export function loadCjConfig(
  env: NodeJS.ProcessEnv = process.env,
): CjConfig {
  const apiKey = resolveCjApiKeyFromEnv(env);
  const apiSecret = resolveCjApiSecretFromEnv(env);
  const requestedMode = readIntegrationMode();

  return {
    apiBaseUrl:
      env.CJ_API_BASE_URL?.trim() ||
      env.CJ_DROPSHIPPING_API_BASE?.trim() ||
      "https://developers.cjdropshipping.com/api2.0/v1",
    apiKey,
    apiSecret,
    integrationMode: apiKey ? requestedMode : "SANDBOX",
    requestTimeoutMs: Number(env.CJ_REQUEST_TIMEOUT_MS ?? 15_000),
    maxRetries: Number(env.CJ_MAX_RETRIES ?? 3),
    rateLimitPerMinute: Number(env.CJ_RATE_LIMIT_PER_MINUTE ?? 60),
  };
}

/** Returns true when live CJ API calls are permitted. */
export function isCjLiveApiEnabled(config: CjConfig): boolean {
  return Boolean(config.apiKey && config.integrationMode === "LIVE");
}

/** Returns true when CJ API key is present (CJ API 2.0 — secret not required). */
export function hasCjCredentials(config: CjConfig): boolean {
  return Boolean(config.apiKey);
}
