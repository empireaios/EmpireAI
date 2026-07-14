import { randomUUID } from "node:crypto";

import {
  isCanvaLiveConfigured,
  loadCanvaEnv,
  parseCanvaScopes,
} from "../config/canva-env.js";
import type { CanvaExportFormat } from "../models/canva-records.js";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "./pkce.js";

export class CanvaConnectApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly canvaError?: unknown,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "CanvaConnectApiError";
  }
}

export type CanvaTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number | null;
  scopes: string[];
};

export type CanvaDesignSummary = {
  designId: string;
  title: string;
  thumbnailUrl: string | null;
  createdAt: string;
};

export type CanvaAssetSummary = {
  assetId: string;
  name: string;
  mimeType: string;
  url: string | null;
};

export type CanvaExportJob = {
  exportId: string;
  designId: string;
  format: CanvaExportFormat;
  status: "in_progress" | "success" | "failed";
  downloadUrl: string | null;
};

const MAX_RETRIES = 3;

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function canvaFetch<T>(
  path: string,
  options: {
    method?: string;
    accessToken?: string;
    body?: URLSearchParams | Record<string, unknown>;
    contentType?: "json" | "form";
    retryAttempt?: number;
  },
): Promise<T> {
  const env = loadCanvaEnv();
  const url = `${env.CANVA_API_BASE_URL}${path}`;
  const headers: Record<string, string> = {};
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  let body: string | undefined;
  if (options.body instanceof URLSearchParams) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = options.body.toString();
  } else if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  if (response.status === 429) {
    const attempt = options.retryAttempt ?? 0;
    if (attempt < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return canvaFetch(path, { ...options, retryAttempt: attempt + 1 });
    }
    throw new CanvaConnectApiError("Canva rate limit exceeded", 429, undefined, true);
  }

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new CanvaConnectApiError(
      payload.error_description ?? payload.error ?? `Canva API request failed (${response.status})`,
      response.status,
      payload,
      response.status >= 500,
    );
  }

  return payload;
}

function mockDesignId(): string {
  return `DAF${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function mockAssetId(): string {
  return `AAF${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

/** Canva Connect API client with mock fallback for development and tests. */
export class CanvaConnectApiClient {
  buildAuthorizationUrl(input: {
    workspaceId: string;
    companyId: string;
    codeVerifier: string;
  }): { url: string; state: string } {
    const env = loadCanvaEnv();
    const state = generateOAuthState(input.workspaceId, input.companyId);
    const codeChallenge = generateCodeChallenge(input.codeVerifier);
    const scopes = parseCanvaScopes(env).join(" ");

    if (env.CANVA_MOCK || !env.CANVA_CLIENT_ID) {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: "mock-canva-client",
        redirect_uri: env.CANVA_REDIRECT_URI,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        scope: scopes,
      });
      return {
        url: `${env.CANVA_AUTH_BASE_URL}/authorize?${params.toString()}`,
        state,
      };
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.CANVA_CLIENT_ID,
      redirect_uri: env.CANVA_REDIRECT_URI,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      scope: scopes,
    });

    return {
      url: `${env.CANVA_AUTH_BASE_URL}/authorize?${params.toString()}`,
      state,
    };
  }

  createPkcePair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = generateCodeVerifier();
    return { codeVerifier, codeChallenge: generateCodeChallenge(codeVerifier) };
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<CanvaTokenResponse> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return {
        accessToken: `mock_canva_access_${randomUUID()}`,
        refreshToken: `mock_canva_refresh_${randomUUID()}`,
        tokenType: "Bearer",
        expiresIn: 3600,
        scopes: parseCanvaScopes(env),
      };
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: env.CANVA_REDIRECT_URI,
    });

    const response = await fetch(`${env.CANVA_API_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(env.CANVA_CLIENT_ID!, env.CANVA_CLIENT_SECRET!),
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new CanvaConnectApiError(
        (errorPayload as { error_description?: string }).error_description ??
          `Canva token exchange failed (${response.status})`,
        response.status,
        errorPayload,
      );
    }

    const tokenPayload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    };

    return {
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? null,
      tokenType: tokenPayload.token_type,
      expiresIn: tokenPayload.expires_in ?? null,
      scopes: tokenPayload.scope?.split(" ") ?? parseCanvaScopes(env),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<CanvaTokenResponse> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return {
        accessToken: `mock_canva_access_${randomUUID()}`,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 3600,
        scopes: parseCanvaScopes(env),
      };
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(`${env.CANVA_API_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(env.CANVA_CLIENT_ID!, env.CANVA_CLIENT_SECRET!),
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new CanvaConnectApiError(
        (errorPayload as { error_description?: string }).error_description ??
          `Canva token refresh failed (${response.status})`,
        response.status,
        errorPayload,
      );
    }

    const tokenPayload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    };

    return {
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token ?? refreshToken,
      tokenType: tokenPayload.token_type,
      expiresIn: tokenPayload.expires_in ?? null,
      scopes: tokenPayload.scope?.split(" ") ?? parseCanvaScopes(env),
    };
  }

  async revokeToken(token: string): Promise<void> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) return;

    const body = new URLSearchParams({ token });
    await fetch(`${env.CANVA_API_BASE_URL}/oauth/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(env.CANVA_CLIENT_ID!, env.CANVA_CLIENT_SECRET!),
      },
      body: body.toString(),
    });
  }

  async createDesign(accessToken: string, title: string): Promise<CanvaDesignSummary> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return {
        designId: mockDesignId(),
        title,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
      };
    }

    const payload = await canvaFetch<{ design: { id: string; title?: string; thumbnail?: { url?: string }; created_at?: string } }>(
      "/designs",
      {
        method: "POST",
        accessToken,
        body: { design_type: { type: "preset", name: "presentation" }, title },
      },
    );

    return {
      designId: payload.design.id,
      title: payload.design.title ?? title,
      thumbnailUrl: payload.design.thumbnail?.url ?? null,
      createdAt: payload.design.created_at ?? new Date().toISOString(),
    };
  }

  async searchDesigns(accessToken: string, query: string): Promise<CanvaDesignSummary[]> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return [
        {
          designId: mockDesignId(),
          title: `Mock design for ${query}`,
          thumbnailUrl: null,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const payload = await canvaFetch<{ items: Array<{ id: string; title?: string; thumbnail?: { url?: string }; created_at?: string }> }>(
      `/designs?query=${encodeURIComponent(query)}`,
      { accessToken },
    );

    return (payload.items ?? []).map((item) => ({
      designId: item.id,
      title: item.title ?? "Untitled",
      thumbnailUrl: item.thumbnail?.url ?? null,
      createdAt: item.created_at ?? new Date().toISOString(),
    }));
  }

  async duplicateDesign(accessToken: string, designId: string): Promise<CanvaDesignSummary> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return {
        designId: mockDesignId(),
        title: `Copy of ${designId}`,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
      };
    }

    const payload = await canvaFetch<{ design: { id: string; title?: string; thumbnail?: { url?: string }; created_at?: string } }>(
      `/designs/${designId}/copy`,
      { method: "POST", accessToken, body: {} },
    );

    return {
      designId: payload.design.id,
      title: payload.design.title ?? `Copy of ${designId}`,
      thumbnailUrl: payload.design.thumbnail?.url ?? null,
      createdAt: payload.design.created_at ?? new Date().toISOString(),
    };
  }

  async uploadAsset(
    accessToken: string,
    input: { name: string; mimeType: string; base64Data: string },
  ): Promise<CanvaAssetSummary> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return {
        assetId: mockAssetId(),
        name: input.name,
        mimeType: input.mimeType,
        url: `mock://canva/assets/${mockAssetId()}`,
      };
    }

    const payload = await canvaFetch<{ asset: { id: string; name?: string; type?: string; url?: string } }>(
      "/assets/upload",
      {
        method: "POST",
        accessToken,
        body: {
          name: input.name,
          asset: { type: input.mimeType.startsWith("video") ? "video" : "image", data: input.base64Data },
        },
      },
    );

    return {
      assetId: payload.asset.id,
      name: payload.asset.name ?? input.name,
      mimeType: input.mimeType,
      url: payload.asset.url ?? null,
    };
  }

  async exportDesign(
    accessToken: string,
    designId: string,
    format: CanvaExportFormat,
  ): Promise<CanvaExportJob> {
    const env = loadCanvaEnv();
    if (env.CANVA_MOCK) {
      return {
        exportId: `EXP${randomUUID().slice(0, 10)}`,
        designId,
        format,
        status: "success",
        downloadUrl: `mock://canva/exports/${designId}.${format}`,
      };
    }

    const payload = await canvaFetch<{ job: { id: string; status: string; urls?: string[] } }>(
      `/exports`,
      {
        method: "POST",
        accessToken,
        body: { design_id: designId, format: { type: format } },
      },
    );

    return {
      exportId: payload.job.id,
      designId,
      format,
      status: payload.job.status === "success" ? "success" : "in_progress",
      downloadUrl: payload.job.urls?.[0] ?? null,
    };
  }

  isLiveConfigured(): boolean {
    return isCanvaLiveConfigured(loadCanvaEnv());
  }
}

let clientInstance: CanvaConnectApiClient | null = null;

export function getCanvaConnectApiClient(): CanvaConnectApiClient {
  if (!clientInstance) clientInstance = new CanvaConnectApiClient();
  return clientInstance;
}

export function resetCanvaConnectApiClient(): void {
  clientInstance = null;
}
