import type { CjConfig } from "./cj-config.js";
import { hasCjCredentials } from "./cj-config.js";
import { CjApiError } from "./cj-error.js";
import type { CjAccessTokenResponse } from "./cj-types.js";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: TokenCache | null = null;

function isTokenValid(cache: TokenCache | null): cache is TokenCache {
  if (!cache) {
    return false;
  }
  return Date.now() < cache.expiresAt - 60_000;
}

/** Clears cached CJ access tokens (for tests). */
export function clearCjAuthCache(): void {
  cachedToken = null;
}

/** Obtains a CJ access token using API key credentials. */
export async function getCjAccessToken(
  config: CjConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (!hasCjCredentials(config)) {
    throw new CjApiError("AUTH_MISSING", "CJ API credentials are not configured", {
      retryable: false,
    });
  }

  if (isTokenValid(cachedToken)) {
    return cachedToken.accessToken;
  }

  const response = await fetchImpl(`${config.apiBaseUrl}/authentication/getAccessToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    }),
  });

  const payload = (await response.json()) as CjAccessTokenResponse;

  if (!response.ok || payload.result === false || !payload.data?.accessToken) {
    throw new CjApiError(
      "AUTH_FAILED",
      payload.message || "Failed to obtain CJ access token",
      {
        statusCode: response.status,
        retryable: false,
        details: payload,
      },
    );
  }

  const expiresAt = payload.data.accessTokenExpiryDate
    ? payload.data.accessTokenExpiryDate
    : Date.now() + 55 * 60_000;

  cachedToken = {
    accessToken: payload.data.accessToken,
    expiresAt,
  };

  return cachedToken.accessToken;
}

/** Builds authenticated headers for CJ API requests. */
export async function buildCjAuthHeaders(
  config: CjConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, string>> {
  const accessToken = await getCjAccessToken(config, fetchImpl);
  return {
    "Content-Type": "application/json",
    "CJ-Access-Token": accessToken,
  };
}
