import { randomUUID } from "node:crypto";

import { resolveAmazonMarketplaceRegistryId } from "../amazon-marketplace-profiles.js";
import {
  amazonOAuthAuthorizeUrl,
  amazonOAuthExchangeCode,
  amazonOAuthRefreshToken,
} from "../adapters/amazon-sp-api-adapter.js";
import { authenticateSupplier } from "../adapters/supplier-cj-adapter.js";
import { getLiveCommerceRepository } from "../repositories/sqlite-live-commerce-repository.js";
import type { LiveCommerceOAuthState } from "../models.js";

export function startMarketplaceOAuth(input: {
  workspaceId: string;
  providerId: string;
  redirectUri: string;
  scopes?: string[];
}): { stateId: string; authorizationUrl: string; state: LiveCommerceOAuthState } {
  const stateId = randomUUID();
  const state: LiveCommerceOAuthState = {
    stateId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    redirectUri: input.redirectUri,
    scopes: input.scopes ?? ["sellingpartnerapi::notifications"],
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  const registryId = resolveAmazonMarketplaceRegistryId(input.providerId);
  if (!registryId) {
    throw new Error(`Unsupported Amazon marketplace provider: ${input.providerId}`);
  }

  const authorizationUrl = amazonOAuthAuthorizeUrl({
    registryId,
    redirectUri: input.redirectUri,
    state: stateId,
    scopes: state.scopes,
  });

  getLiveCommerceRepository().saveOAuthState(state);
  return { stateId, authorizationUrl, state };
}

export async function completeMarketplaceOAuth(input: {
  workspaceId: string;
  stateId: string;
  code: string;
}): Promise<{ state: LiveCommerceOAuthState; tokens: Record<string, unknown> }> {
  const repo = getLiveCommerceRepository();
  const existing = repo.getOAuthState(input.stateId);
  if (!existing || existing.workspaceId !== input.workspaceId) throw new Error("OAuth state not found");
  if (existing.status !== "pending") throw new Error("OAuth state is not pending");
  const ageMs = Date.now() - Date.parse(existing.createdAt);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 5 * 60_000) {
    repo.saveOAuthState({ ...existing, status: "expired", completedAt: new Date().toISOString() });
    throw new Error("OAuth state expired; begin a new authorization");
  }

  const registryId = resolveAmazonMarketplaceRegistryId(existing.providerId);
  if (!registryId) {
    throw new Error(`Unsupported Amazon marketplace provider: ${existing.providerId}`);
  }

  // Claim before the network call so a duplicate request cannot redeem or
  // expose the same code twice in this single-writer runtime.
  repo.saveOAuthState({ ...existing, status: "exchanging" });
  let tokens: Record<string, unknown>;
  try {
    tokens = await amazonOAuthExchangeCode({
      registryId,
      code: input.code,
      redirectUri: existing.redirectUri,
    });
  } catch (error) {
    if (repo.getOAuthState(input.stateId)?.status === "exchanging") {
      repo.saveOAuthState({ ...existing, status: "failed", completedAt: new Date().toISOString() });
    }
    throw error;
  }
  if (repo.getOAuthState(input.stateId)?.status !== "exchanging") {
    throw new Error("OAuth state changed during token exchange");
  }

  const completed: LiveCommerceOAuthState = {
    ...existing,
    status: "completed",
    completedAt: new Date().toISOString(),
  };
  repo.saveOAuthState(completed);
  return { state: completed, tokens };
}

export async function refreshMarketplaceOAuthTokens(input: {
  providerId: string;
  refreshToken: string;
}): Promise<Record<string, unknown>> {
  const registryId = resolveAmazonMarketplaceRegistryId(input.providerId);
  if (!registryId) {
    throw new Error(`Unsupported Amazon marketplace provider: ${input.providerId}`);
  }
  return amazonOAuthRefreshToken(registryId, input.refreshToken);
}

export function authenticateSupplierProvider(input: {
  providerId: string;
  apiKey: string;
}): Record<string, unknown> {
  return authenticateSupplier(input);
}

export function revokeOAuthState(stateId: string): LiveCommerceOAuthState | null {
  const repo = getLiveCommerceRepository();
  const existing = repo.getOAuthState(stateId);
  if (!existing) return null;
  const revoked: LiveCommerceOAuthState = { ...existing, status: "failed", completedAt: new Date().toISOString() };
  repo.saveOAuthState(revoked);
  return revoked;
}
