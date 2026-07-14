import { loadCanvaEnv } from "../config/canva-env.js";
import type { CanvaHealthStatus, CanvaOAuthConnection } from "../models/canva-records.js";
import {
  createCanvaOAuthConnection,
  createCanvaOAuthPending,
  getCanvaRepository,
} from "../repositories/sqlite-canva-repository.js";
import { connectorConnect, connectorDisconnect } from "../../../orchestration/reality-integration/services/connector-runtime.js";
import { getCredentialVaultRepository } from "../../../orchestration/reality-integration/repositories/sqlite-credential-vault-repository.js";
import {
  CanvaConnectApiError,
  getCanvaConnectApiClient,
} from "./canva-connect-api-client.js";
import { decryptCanvaSecret, encryptCanvaSecret } from "./canva-crypto.js";
import { generateCodeVerifier } from "./pkce.js";

export class CanvaOAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | "missing_env"
      | "invalid_state"
      | "expired_state"
      | "revoked"
      | "exchange_failed" = "exchange_failed",
  ) {
    super(message);
    this.name = "CanvaOAuthError";
  }
}

export function assertCanvaEnvConfigured(): void {
  const env = loadCanvaEnv();
  if (!env.CANVA_MOCK && (!env.CANVA_CLIENT_ID || !env.CANVA_CLIENT_SECRET)) {
    throw new CanvaOAuthError(
      "CANVA_CLIENT_ID and CANVA_CLIENT_SECRET are required for live Canva OAuth",
      "missing_env",
    );
  }
}

export function getCanvaOAuthUrl(input: {
  workspaceId: string;
  companyId: string;
}): { url: string; state: string } {
  assertCanvaEnvConfigured();
  const client = getCanvaConnectApiClient();
  const codeVerifier = generateCodeVerifier();
  const { url, state } = client.buildAuthorizationUrl({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    codeVerifier,
  });

  const pending = createCanvaOAuthPending({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    state,
    codeVerifierEncrypted: encryptCanvaSecret(codeVerifier),
  });
  getCanvaRepository().purgeExpiredPending();
  getCanvaRepository().savePending(pending);

  return { url, state };
}

export async function exchangeCanvaOAuthCode(input: {
  workspaceId: string;
  companyId: string;
  code: string;
  state: string;
}): Promise<CanvaOAuthConnection> {
  assertCanvaEnvConfigured();
  const repository = getCanvaRepository();
  const pending = repository.getPendingByState(input.state);

  if (!pending) {
    throw new CanvaOAuthError("Invalid or expired OAuth state", "invalid_state");
  }
  if (pending.workspaceId !== input.workspaceId || pending.companyId !== input.companyId) {
    throw new CanvaOAuthError("OAuth state workspace mismatch", "invalid_state");
  }
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    repository.deletePending(pending.pendingId);
    throw new CanvaOAuthError("OAuth state expired — restart authorization", "expired_state");
  }

  const codeVerifier = decryptCanvaSecret(pending.codeVerifierEncrypted);
  const client = getCanvaConnectApiClient();
  const env = loadCanvaEnv();

  let tokens;
  try {
    tokens = await client.exchangeCodeForTokens(input.code, codeVerifier);
  } catch (error) {
    if (error instanceof CanvaConnectApiError) {
      throw new CanvaOAuthError(error.message, "exchange_failed");
    }
    throw error;
  } finally {
    repository.deletePending(pending.pendingId);
  }

  const expiresAt = tokens.expiresIn
    ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
    : null;

  const runtime = await connectorConnect({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    providerId: "canva",
    credentialType: "oauth",
    secretPayload: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt,
    },
    scopes: tokens.scopes,
    actor: "canva-oauth",
  });

  const connection = createCanvaOAuthConnection({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    credentialsRef: runtime.credentialsRef!,
    scopes: tokens.scopes,
    mock: env.CANVA_MOCK,
  });

  return repository.saveConnection(connection);
}

export async function disconnectCanvaAccount(input: {
  workspaceId: string;
  companyId: string;
}): Promise<void> {
  const repository = getCanvaRepository();
  const connection = repository.getConnection(input.workspaceId, input.companyId);
  if (!connection) return;

  const vault = getCredentialVaultRepository();
  const secret = vault.resolveSecret(connection.credentialsRef);
  const accessToken = secret?.accessToken;
  if (typeof accessToken === "string") {
    try {
      await getCanvaConnectApiClient().revokeToken(accessToken);
    } catch {
      // Safe disconnect — local revocation still proceeds
    }
  }

  vault.revokeCredential(connection.credentialsRef);
  repository.revokeConnection(input.workspaceId, input.companyId);
  connectorDisconnect(input.workspaceId, "canva");
}

export function getCanvaOAuthStatus(
  workspaceId: string,
  companyId: string,
): CanvaOAuthConnection | null {
  return getCanvaRepository().getConnection(workspaceId, companyId);
}

export async function getCanvaHealthStatus(
  workspaceId: string,
  companyId: string,
): Promise<CanvaHealthStatus> {
  const env = loadCanvaEnv();
  const connection = getCanvaRepository().getConnection(workspaceId, companyId);
  let tokenValid = false;
  let lastError: string | null = null;

  if (connection) {
    try {
      const { accessToken } = await resolveCanvaAccessToken(workspaceId, companyId);
      tokenValid = Boolean(accessToken);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Token resolution failed";
    }
  }

  return {
    providerId: "canva",
    connected: Boolean(connection),
    mock: connection?.mock ?? env.CANVA_MOCK,
    liveConfigured: getCanvaConnectApiClient().isLiveConfigured(),
    tokenValid,
    lastError,
    checkedAt: new Date().toISOString(),
  };
}

export async function resolveCanvaAccessToken(
  workspaceId: string,
  companyId: string,
): Promise<{ accessToken: string; mock: boolean; credentialsRef: string }> {
  const connection = getCanvaRepository().getConnection(workspaceId, companyId);
  if (!connection) {
    throw new CanvaOAuthError("Canva account not connected — authorization required", "revoked");
  }

  const vault = getCredentialVaultRepository();
  const secret = vault.resolveSecret(connection.credentialsRef);
  if (!secret?.accessToken || typeof secret.accessToken !== "string") {
    throw new CanvaOAuthError("Canva credentials invalid or revoked", "revoked");
  }

  const expiresAt = secret.expiresAt ? String(secret.expiresAt) : null;
  const refreshToken = secret.refreshToken ? String(secret.refreshToken) : null;

  if (expiresAt && new Date(expiresAt).getTime() < Date.now() + 60_000) {
    if (!refreshToken) {
      throw new CanvaOAuthError("Canva access token expired and no refresh token available", "revoked");
    }
    const refreshed = await getCanvaConnectApiClient().refreshAccessToken(refreshToken);
    const newExpiresAt = refreshed.expiresIn
      ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
      : null;
    const rotated = vault.rotateCredential(connection.credentialsRef, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      tokenType: refreshed.tokenType,
      expiresAt: newExpiresAt,
    });
    getCanvaRepository().saveConnection({
      ...connection,
      credentialsRef: rotated.credentialsRef,
      updatedAt: new Date().toISOString(),
    });
    return {
      accessToken: refreshed.accessToken,
      mock: connection.mock,
      credentialsRef: rotated.credentialsRef,
    };
  }

  return {
    accessToken: secret.accessToken,
    mock: connection.mock,
    credentialsRef: connection.credentialsRef,
  };
}
