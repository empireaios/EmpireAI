export type CjIntegrationMode = "SANDBOX" | "LIVE";

export type CjConfig = {
  apiBaseUrl: string;
  apiKey: string | null;
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

function hasCredentials(apiKey: string | null, apiSecret: string | null): boolean {
  return Boolean(apiKey && apiSecret);
}

/** Loads CJ Dropshipping configuration from environment variables. */
export function loadCjConfig(
  env: NodeJS.ProcessEnv = process.env,
): CjConfig {
  const apiKey = env.CJ_API_KEY?.trim() || null;
  const apiSecret = env.CJ_API_SECRET?.trim() || null;
  const requestedMode = readIntegrationMode();

  return {
    apiBaseUrl:
      env.CJ_API_BASE_URL?.trim() || "https://developers.cjdropshipping.com/api2.0/v1",
    apiKey,
    apiSecret,
    integrationMode: hasCredentials(apiKey, apiSecret) ? requestedMode : "SANDBOX",
    requestTimeoutMs: Number(env.CJ_REQUEST_TIMEOUT_MS ?? 15_000),
    maxRetries: Number(env.CJ_MAX_RETRIES ?? 3),
    rateLimitPerMinute: Number(env.CJ_RATE_LIMIT_PER_MINUTE ?? 60),
  };
}

/** Returns true when live CJ API calls are permitted. */
export function isCjLiveApiEnabled(config: CjConfig): boolean {
  return Boolean(config.apiKey && config.apiSecret && config.integrationMode === "LIVE");
}

/** Returns true when CJ credentials are present in configuration. */
export function hasCjCredentials(config: CjConfig): boolean {
  return Boolean(config.apiKey && config.apiSecret);
}
