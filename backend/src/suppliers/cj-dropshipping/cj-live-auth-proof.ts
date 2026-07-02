import {
  clearCjAuthCache,
  getCjAccessToken,
  getCjAuthCacheStatus,
} from "./cj-auth.js";
import { createCjApiClient } from "./cj-api-client.js";
import { loadCjConfig, resolveCjApiKeyFromEnv } from "./cj-config.js";
import { CjApiError } from "./cj-error.js";
import type { CjAccessTokenResponse } from "./cj-types.js";

export type CjLiveAuthProofResult = {
  mission: "B6-02B";
  success: boolean;
  verifiedAt: string;
  credentialSource: "CJ_API_KEY" | "CJ_DROPSHIPPING_API_KEY" | "missing";
  auth: {
    endpoint: string;
    method: "POST";
    payloadShape: { apiKey: true; apiSecret?: boolean };
    httpStatus: number | null;
    accessTokenReceived: boolean;
    refreshTokenReceived: boolean;
    accessTokenExpiryParsed: boolean;
    refreshTokenExpiryParsed: boolean;
    apiResult: boolean | null;
    apiMessage: string | null;
  };
  tokenCache: ReturnType<typeof getCjAuthCacheStatus> & {
    reuseVerified: boolean;
  };
  authenticatedCall: {
    endpoint: string;
    method: "GET";
    httpStatus: number | null;
    apiResult: boolean | null;
    productCount: number | null;
    message: string | null;
  };
  blockers: string[];
  errorCode: string | null;
  errorMessage: string | null;
};

function resolveCredentialSource(env: NodeJS.ProcessEnv): CjLiveAuthProofResult["credentialSource"] {
  if (env.CJ_API_KEY?.trim()) {
    return "CJ_API_KEY";
  }
  if (env.CJ_DROPSHIPPING_API_KEY?.trim()) {
    return "CJ_DROPSHIPPING_API_KEY";
  }
  return "missing";
}

function redactToken(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function parseExpiryValid(value: string | number | undefined): boolean {
  if (typeof value === "number" && Number.isFinite(value)) {
    return true;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return !Number.isNaN(Date.parse(value));
  }
  return false;
}

/** Runs live CJ API 2.0 authentication proof (redacted — no secrets returned). */
export async function runCjLiveAuthProof(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<CjLiveAuthProofResult> {
  clearCjAuthCache();

  const config = loadCjConfig(env);
  const credentialSource = resolveCredentialSource(env);
  const authEndpoint = `${config.apiBaseUrl}/authentication/getAccessToken`;
  const productEndpoint = `${config.apiBaseUrl}/product/list?pageNum=1&pageSize=1`;

  const blockers: string[] = [];
  if (credentialSource === "missing") {
    blockers.push("CJ_API_KEY (or CJ_DROPSHIPPING_API_KEY) not configured");
  }

  const payloadShape: CjLiveAuthProofResult["auth"]["payloadShape"] = { apiKey: true };
  if (config.apiSecret) {
    payloadShape.apiSecret = true;
  }

  let authHttpStatus: number | null = null;
  let accessTokenReceived = false;
  let refreshTokenReceived = false;
  let accessTokenExpiryParsed = false;
  let refreshTokenExpiryParsed = false;
  let authApiResult: boolean | null = null;
  let authApiMessage: string | null = null;
  let authNetworkCalls = 0;

  const instrumentedFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/authentication/getAccessToken")) {
      authNetworkCalls += 1;
      const response = await fetchImpl(input, init);
      authHttpStatus = response.status;
      const payload = (await response.clone().json()) as CjAccessTokenResponse;
      authApiResult = payload.result ?? null;
      authApiMessage = payload.message ?? null;
      accessTokenReceived = redactToken(payload.data?.accessToken);
      refreshTokenReceived = redactToken(payload.data?.refreshToken);
      accessTokenExpiryParsed = parseExpiryValid(payload.data?.accessTokenExpiryDate);
      refreshTokenExpiryParsed = parseExpiryValid(payload.data?.refreshTokenExpiryDate);
      return response;
    }
    return fetchImpl(input, init);
  };

  let cacheAfterAuth = getCjAuthCacheStatus();
  let reuseVerified = false;

  if (blockers.length === 0) {
    try {
      await getCjAccessToken(config, instrumentedFetch);
      cacheAfterAuth = getCjAuthCacheStatus();

      if (!accessTokenReceived) {
        blockers.push(authApiMessage || "CJ getAccessToken did not return accessToken");
      }
      if (!refreshTokenReceived) {
        blockers.push("CJ getAccessToken did not return refreshToken");
      }
      if (!accessTokenExpiryParsed) {
        blockers.push("accessTokenExpiryDate not parsed");
      }
      if (!cacheAfterAuth.populated) {
        blockers.push("Token cache not populated after getCjAccessToken");
      }

      if (blockers.length === 0) {
        await getCjAccessToken(config, instrumentedFetch);
        reuseVerified = authNetworkCalls === 1 && cacheAfterAuth.accessValid;
        if (!reuseVerified) {
          blockers.push("Token cache reuse not verified");
        }
      }
    } catch (error) {
      const message = error instanceof CjApiError ? error.message : "CJ authentication failed";
      blockers.push(message);
    }
  }

  let productHttpStatus: number | null = null;
  let productApiResult: boolean | null = null;
  let productCount: number | null = null;
  let productMessage: string | null = null;

  if (blockers.length === 0) {
    try {
      const client = createCjApiClient(config, fetchImpl);
      const products = await client.listProducts({ pageNum: 1, pageSize: 1 });
      productApiResult = products.result ?? null;
      productMessage = products.message ?? null;
      productCount = Array.isArray(products.data?.list) ? products.data!.list!.length : null;
      productHttpStatus = 200;
      if (products.result === false) {
        blockers.push(products.message || "Authenticated product list failed");
      }
    } catch (error) {
      if (error instanceof CjApiError) {
        productHttpStatus = error.statusCode ?? null;
        productMessage = error.message;
        blockers.push(error.message);
      } else {
        productMessage = error instanceof Error ? error.message : "Product list request failed";
        blockers.push(productMessage);
      }
    }
  }

  const success = blockers.length === 0;

  return {
    mission: "B6-02B",
    success,
    verifiedAt: new Date().toISOString(),
    credentialSource,
    auth: {
      endpoint: authEndpoint,
      method: "POST",
      payloadShape,
      httpStatus: authHttpStatus,
      accessTokenReceived,
      refreshTokenReceived,
      accessTokenExpiryParsed,
      refreshTokenExpiryParsed,
      apiResult: authApiResult,
      apiMessage: authApiMessage,
    },
    tokenCache: {
      ...cacheAfterAuth,
      reuseVerified,
    },
    authenticatedCall: {
      endpoint: productEndpoint,
      method: "GET",
      httpStatus: productHttpStatus,
      apiResult: productApiResult,
      productCount,
      message: productMessage,
    },
    blockers,
    errorCode: success ? null : "CJ_LIVE_AUTH_PROOF_FAILED",
    errorMessage: success ? null : blockers.join("; "),
  };
}

/** Returns whether a CJ API key is configured (no value exposed). */
export function hasCjLiveAuthProofCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(resolveCjApiKeyFromEnv(env));
}
