import { createHash } from "node:crypto";
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

// Bind each access/refresh token to the exact account, secret and endpoint that
// minted it. Concurrent workspaces must never borrow another CJ account token.
const tokenCache = new Map<string, TokenCache>();
const tokenFlights = new Map<string, Promise<string>>();
let lastBinding: string | null = null;
function binding(config: CjConfig): string {
  return createHash("sha256").update(JSON.stringify([
    config.apiBaseUrl, config.apiKey, config.apiSecret,
  ])).digest("hex");
}
function cacheFor(key: string): TokenCache | null { return tokenCache.get(key) ?? null; }
function putCache(key: string, value: TokenCache): void {
  if (!tokenCache.has(key) && tokenCache.size >= 16) {
    const evict = [...tokenCache.keys()].find(candidate => !tokenFlights.has(candidate));
    if (evict) tokenCache.delete(evict);
  }
  tokenCache.set(key, value);
}

function parseExpiry(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  throw new CjApiError("AUTH_FAILED", "CJ token expiry missing or invalid", { retryable: false });
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

function storeTokenFromResponse(key: string, data: NonNullable<CjAccessTokenResponse["data"]>): void {
  const previous = cacheFor(key);
  const accessExpiresAt = parseExpiry(data.accessTokenExpiryDate);
  putCache(key, {
    accessToken: data.accessToken!,
    refreshToken: data.refreshToken ?? previous?.refreshToken ?? null,
    accessExpiresAt,
    refreshExpiresAt: data.refreshTokenExpiryDate
      ? parseExpiry(data.refreshTokenExpiryDate)
      : null,
  });
}

/** Clears cached CJ access tokens (for tests). */
export function clearCjAuthCache(): void {
  tokenCache.clear();
  tokenFlights.clear();
  lastBinding = null;
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
  const cachedToken = lastBinding ? cacheFor(lastBinding) : null;
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
  key: string,
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

  storeTokenFromResponse(key, payload.data);
  return cacheFor(key)!.accessToken;
}

async function refreshAccessToken(
  config: CjConfig,
  fetchImpl: typeof fetch,
  key: string,
): Promise<string> {
  const cachedToken = cacheFor(key);
  if (!cachedToken?.refreshToken) {
    return requestAccessToken(config, fetchImpl, key);
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
    return requestAccessToken(config, fetchImpl, key);
  }

  storeTokenFromResponse(key, payload.data);
  return cacheFor(key)!.accessToken;
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
  const key = binding(config);
  lastBinding = key;
  const cachedToken = cacheFor(key);
  if (isAccessTokenValid(cachedToken)) {
    return cachedToken.accessToken;
  }
  const inFlight = tokenFlights.get(key);
  if (inFlight) {
    const token = await inFlight;
    if (!isAccessTokenValid(cacheFor(key))) {
      throw new CjApiError("AUTH_FAILED", "CJ access token expired", { retryable: false });
    }
    return token;
  }
  const flight = (async () => {
    if (isRefreshTokenValid(cacheFor(key))) return refreshAccessToken(config, fetchImpl, key);
    await requestAccessToken(config, fetchImpl, key);
    if (!isAccessTokenValid(cacheFor(key)) && isRefreshTokenValid(cacheFor(key))) {
      return refreshAccessToken(config, fetchImpl, key);
    }
    return cacheFor(key)!.accessToken;
  })();
  tokenFlights.set(key, flight);
  try {
    const token = await flight;
    if (!isAccessTokenValid(cacheFor(key))) {
      throw new CjApiError("AUTH_FAILED", "CJ access token expired", { retryable: false });
    }
    return token;
  }
  finally { if (tokenFlights.get(key) === flight) tokenFlights.delete(key); }
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
