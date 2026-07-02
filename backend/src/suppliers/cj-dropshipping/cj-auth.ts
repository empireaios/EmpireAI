import type { CjConfig } from "./cj-config.js";
import { hasCjCredentials } from "./cj-config.js";
import { CjApiError } from "./cj-error.js";
import type { CjAccessTokenResponse } from "./cj-types.js";

type TokenCache = {
  accessToken: string;
  refreshToken: string | null;
  accessExpiresAt: number;
  refreshExpiresAt: number | null;
};

let cachedToken: TokenCache | null = null;

function parseExpiry(value: string | number | undefined, fallbackMs: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now() + fallbackMs;
}

function isAccessTokenValid(cache: TokenCache | null): cache is TokenCache {
  if (!cache) {
    return false;
  }
  return Date.now() < cache.accessExpiresAt - 60_000;
}

function isRefreshTokenValid(cache: TokenCache | null): boolean {
  if (!cache?.refreshToken) {
    return false;
  }
  if (cache.refreshExpiresAt === null) {
    return true;
  }
  return Date.now() < cache.refreshExpiresAt - 60_000;
}

function storeTokenFromResponse(data: NonNullable<CjAccessTokenResponse["data"]>): void {
  cachedToken = {
    accessToken: data.accessToken!,
    refreshToken: data.refreshToken ?? cachedToken?.refreshToken ?? null,
    accessExpiresAt: parseExpiry(data.accessTokenExpiryDate, 15 * 24 * 60 * 60_000),
    refreshExpiresAt: data.refreshTokenExpiryDate
      ? parseExpiry(data.refreshTokenExpiryDate, 180 * 24 * 60 * 60_000)
      : null,
  };
}

/** Clears cached CJ access tokens (for tests). */
export function clearCjAuthCache(): void {
  cachedToken = null;
}

/** Redacted in-process token cache snapshot (proof / diagnostics — no secrets). */
export function getCjAuthCacheStatus(): {
  populated: boolean;
  accessExpiresAt: string | null;
  refreshTokenPresent: boolean;
  refreshExpiresAt: string | null;
  accessValid: boolean;
  refreshValid: boolean;
} {
  if (!cachedToken) {
    return {
      populated: false,
      accessExpiresAt: null,
      refreshTokenPresent: false,
      refreshExpiresAt: null,
      accessValid: false,
      refreshValid: false,
    };
  }

  return {
    populated: true,
    accessExpiresAt: new Date(cachedToken.accessExpiresAt).toISOString(),
    refreshTokenPresent: Boolean(cachedToken.refreshToken),
    refreshExpiresAt:
      cachedToken.refreshExpiresAt === null
        ? null
        : new Date(cachedToken.refreshExpiresAt).toISOString(),
    accessValid: isAccessTokenValid(cachedToken),
    refreshValid: isRefreshTokenValid(cachedToken),
  };
}

function buildGetAccessTokenBody(config: CjConfig): Record<string, string> {
  const body: Record<string, string> = {
    apiKey: config.apiKey!,
  };
  if (config.apiSecret) {
    body.apiSecret = config.apiSecret;
  }
  return body;
}

async function requestAccessToken(
  config: CjConfig,
  fetchImpl: typeof fetch,
): Promise<string> {
  const response = await fetchImpl(`${config.apiBaseUrl}/authentication/getAccessToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGetAccessTokenBody(config)),
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

  storeTokenFromResponse(payload.data);
  return cachedToken!.accessToken;
}

async function refreshAccessToken(
  config: CjConfig,
  fetchImpl: typeof fetch,
): Promise<string> {
  if (!cachedToken?.refreshToken) {
    return requestAccessToken(config, fetchImpl);
  }

  const response = await fetchImpl(`${config.apiBaseUrl}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: cachedToken.refreshToken,
    }),
  });

  const payload = (await response.json()) as CjAccessTokenResponse;

  if (!response.ok || payload.result === false || !payload.data?.accessToken) {
    cachedToken = {
      ...cachedToken,
      accessToken: cachedToken.accessToken,
    };
    return requestAccessToken(config, fetchImpl);
  }

  storeTokenFromResponse(payload.data);
  return cachedToken!.accessToken;
}

/** Obtains a CJ access token using CJ API 2.0 (apiKey; optional legacy apiSecret). */
export async function getCjAccessToken(
  config: CjConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (!hasCjCredentials(config)) {
    throw new CjApiError("AUTH_MISSING", "CJ API key is not configured", {
      retryable: false,
    });
  }

  if (isAccessTokenValid(cachedToken)) {
    return cachedToken.accessToken;
  }

  if (isRefreshTokenValid(cachedToken)) {
    return refreshAccessToken(config, fetchImpl);
  }

  await requestAccessToken(config, fetchImpl);
  if (!isAccessTokenValid(cachedToken) && isRefreshTokenValid(cachedToken)) {
    return refreshAccessToken(config, fetchImpl);
  }

  return cachedToken!.accessToken;
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
