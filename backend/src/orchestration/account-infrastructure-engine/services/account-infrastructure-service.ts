import {
  getInfrastructureConnectionStatus,
  getMarketplaceConnection,
  listMarketplaceConnections,
} from "../../marketplace-infrastructure-engine/index.js";
import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type {
  AccountConnectionStatus,
  AccountProviderId,
  ExternalAccount,
} from "../models/account-provider.js";
import { ACCOUNT_PROVIDER_IDS } from "../models/account-provider.js";
import {
  getAccountInfrastructureRepository,
  resetAccountInfrastructureRepository,
} from "../repositories/sqlite-account-infrastructure-repository.js";
import {
  computeAccountHealth,
  deriveConnectionHealth,
  mapInfrastructureStatusToAccountStatus,
  mapMarketplaceStatusToAccountStatus,
} from "./account-health-engine.js";
import {
  ACCOUNT_PROVIDER_DEFINITIONS,
  getAccountProviderDefinition,
} from "./account-provider-definitions.js";
import { buildAccountReadinessSummary } from "./account-readiness-service.js";
import { listHumanActionQueue, syncHumanActionQueue } from "./human-action-queue-service.js";

export { resetAccountInfrastructureRepository };

const PROVIDER_MARKETPLACE_MAP: Partial<Record<AccountProviderId, MarketplaceId>> = {
  "amazon-seller": "amazon",
  "walmart-marketplace": "walmart",
  shopify: "shopify",
  "tiktok-shop": "tiktok-shop",
  ebay: "ebay",
  "google-merchant-center": "google-merchant",
  "meta-business": "facebook-shop",
  "instagram-shop": "instagram-shop",
};

function buildDefaultAccount(
  workspaceId: string,
  providerId: AccountProviderId,
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount {
  const definition = getAccountProviderDefinition(providerId);
  const timestamp = new Date().toISOString();
  return {
    providerId,
    workspaceId,
    accountType,
    displayName: definition.displayName,
    category: definition.category,
    connectionStatus: "NOT_CONNECTED",
    connectionHealth: "CRITICAL",
    healthScore: 0,
    requiredPermissions: definition.requiredPermissions,
    oauthSupported: definition.oauthSupported,
    apiSupported: definition.apiSupported,
    requiredHumanSteps: definition.requiredHumanSteps,
    expiryStatus: "UNKNOWN",
    notes: definition.philosophy,
    connectorId: definition.connectorId,
    oauthUrl: definition.oauthSupported
      ? `/account-infrastructure/${providerId}/oauth/start?workspace=${workspaceId}`
      : undefined,
    metadata: { philosophy: definition.philosophy, neverStoresPasswords: "true" },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function syncFromMarketplace(
  workspaceId: string,
  account: ExternalAccount,
): ExternalAccount {
  const marketplaceId = PROVIDER_MARKETPLACE_MAP[account.providerId];
  if (!marketplaceId) {
    return account;
  }

  const connection = getMarketplaceConnection(workspaceId, marketplaceId);
  const connectionStatus = mapMarketplaceStatusToAccountStatus(connection.status, false);

  const synced: ExternalAccount = {
    ...account,
    connectionStatus,
    credentialsRef: connection.credentialsRef,
    lastValidation: connection.lastCheckedAt,
    expiryStatus: connection.status === "EXPIRED" ? "EXPIRED" : account.expiryStatus,
    metadata: {
      ...account.metadata,
      marketplaceId,
      marketplaceStatus: connection.status,
      permissionStatus: connection.permissionStatus,
    },
  };

  const pendingActions = syncHumanActionQueue(synced);
  if (pendingActions.length > 0 && synced.connectionStatus !== "CONNECTED" && synced.connectionStatus !== "DISABLED") {
    synced.connectionStatus = "AWAITING_USER_ACTION";
  }

  const health = computeAccountHealth(synced, pendingActions);
  return {
    ...synced,
    healthScore: health.healthScore,
    connectionHealth: deriveConnectionHealth(synced.connectionStatus, health.healthScore),
    lastValidation: health.lastApiVerification ?? synced.lastValidation,
  };
}

function syncFromInfrastructureConnector(
  workspaceId: string,
  account: ExternalAccount,
): ExternalAccount {
  const connectorId = getAccountProviderDefinition(account.providerId).connectorId;
  if (!connectorId) {
    return account;
  }

  const infraStatus = getInfrastructureConnectionStatus(workspaceId, connectorId);
  const connectionStatus = mapInfrastructureStatusToAccountStatus(infraStatus, false);

  const synced: ExternalAccount = {
    ...account,
    connectionStatus,
    connectorId,
    metadata: {
      ...account.metadata,
      infrastructureStatus: infraStatus,
    },
  };

  const pendingActions = syncHumanActionQueue(synced);
  if (pendingActions.length > 0 && synced.connectionStatus !== "CONNECTED" && synced.connectionStatus !== "DISABLED") {
    synced.connectionStatus = "AWAITING_USER_ACTION";
  }

  const health = computeAccountHealth(synced, pendingActions);
  return {
    ...synced,
    healthScore: health.healthScore,
    connectionHealth: deriveConnectionHealth(synced.connectionStatus, health.healthScore),
    lastValidation: health.lastApiVerification ?? synced.lastValidation,
  };
}

function finalizeAccount(account: ExternalAccount): ExternalAccount {
  const repository = getAccountInfrastructureRepository();
  const pendingActions = syncHumanActionQueue(account);
  const health = computeAccountHealth(account, pendingActions);
  repository.saveHealth(health);

  const finalized: ExternalAccount = {
    ...account,
    healthScore: health.healthScore,
    connectionHealth: deriveConnectionHealth(account.connectionStatus, health.healthScore),
    lastValidation: health.lastApiVerification ?? account.lastValidation,
  };
  return repository.saveAccount(finalized);
}

/** Account Infrastructure Engine — unified registry for all external accounts. */
export function listExternalAccounts(
  workspaceId: string,
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount[] {
  void listMarketplaceConnections(workspaceId);
  const repository = getAccountInfrastructureRepository();
  const existing = repository.listAccounts(workspaceId, accountType);
  const byId = new Map(existing.map((entry) => [entry.providerId, entry]));

  return ACCOUNT_PROVIDER_IDS.map((providerId) => {
    const base = byId.get(providerId) ?? buildDefaultAccount(workspaceId, providerId, accountType);
    let synced = PROVIDER_MARKETPLACE_MAP[providerId]
      ? syncFromMarketplace(workspaceId, base)
      : syncFromInfrastructureConnector(workspaceId, base);
    synced = finalizeAccount(synced);
    return synced;
  });
}

export function getExternalAccount(
  workspaceId: string,
  providerId: AccountProviderId,
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount {
  return listExternalAccounts(workspaceId, accountType).find((entry) => entry.providerId === providerId)!;
}

export function getAccountProviderRegistry() {
  return ACCOUNT_PROVIDER_DEFINITIONS;
}

export function startAccountSetup(
  workspaceId: string,
  providerId: AccountProviderId,
  actor: string,
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount {
  const definition = getAccountProviderDefinition(providerId);
  const account: ExternalAccount = {
    ...buildDefaultAccount(workspaceId, providerId, accountType),
    connectionStatus: "PENDING_SETUP",
    connectionHealth: "UNKNOWN",
    oauthUrl: definition.oauthSupported
      ? `/account-infrastructure/${providerId}/oauth/start?workspace=${workspaceId}`
      : undefined,
    metadata: {
      philosophy: definition.philosophy,
      actor,
      startedAt: new Date().toISOString(),
      neverStoresPasswords: "true",
    },
  };
  return finalizeAccount(account);
}

export function completeAccountConnection(
  workspaceId: string,
  providerId: AccountProviderId,
  input: { credentialsRef: string; actor?: string },
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount {
  const account: ExternalAccount = {
    ...getExternalAccount(workspaceId, providerId, accountType),
    connectionStatus: "CONNECTED",
    credentialsRef: input.credentialsRef,
    expiryStatus: "VALID",
    metadata: {
      ...getExternalAccount(workspaceId, providerId, accountType).metadata,
      connectedAt: new Date().toISOString(),
      connectedBy: input.actor ?? "system",
      oauth: "true",
    },
  };
  return finalizeAccount(account);
}

export function markAccountError(
  workspaceId: string,
  providerId: AccountProviderId,
  reason: string,
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount {
  const account: ExternalAccount = {
    ...getExternalAccount(workspaceId, providerId, accountType),
    connectionStatus: "ERROR",
    connectionHealth: "CRITICAL",
    metadata: {
      ...getExternalAccount(workspaceId, providerId, accountType).metadata,
      error: reason,
      errorAt: new Date().toISOString(),
    },
  };
  return finalizeAccount(account);
}

export function disableAccount(
  workspaceId: string,
  providerId: AccountProviderId,
  reason: string,
  accountType: ExternalAccount["accountType"] = "grand_king",
): ExternalAccount {
  const account: ExternalAccount = {
    ...getExternalAccount(workspaceId, providerId, accountType),
    connectionStatus: "DISABLED",
    connectionHealth: "DISABLED",
    healthScore: 0,
    metadata: {
      ...getExternalAccount(workspaceId, providerId, accountType).metadata,
      disabledReason: reason,
      disabledAt: new Date().toISOString(),
    },
  };
  return finalizeAccount(account);
}

export function getAccountReadiness(
  workspaceId: string,
  accountType: ExternalAccount["accountType"] = "grand_king",
) {
  const accounts = listExternalAccounts(workspaceId, accountType);
  const humanActions = listHumanActionQueue(workspaceId);
  return buildAccountReadinessSummary(workspaceId, accounts, humanActions, accountType);
}

export function getAccountHealthSnapshot(
  workspaceId: string,
  providerId: AccountProviderId,
) {
  const repository = getAccountInfrastructureRepository();
  const account = getExternalAccount(workspaceId, providerId);
  const pendingActions = listHumanActionQueue(workspaceId, { providerId });
  const health = repository.getHealth(workspaceId, providerId) ?? computeAccountHealth(account, pendingActions);
  return { account, health, pendingHumanActions: pendingActions };
}

export function mapAccountStatusForIntegrations(
  status: AccountConnectionStatus,
): "ready" | "action_required" | "not_connected" | "error" | "disabled" {
  switch (status) {
    case "CONNECTED":
      return "ready";
    case "AWAITING_USER_ACTION":
    case "PENDING_SETUP":
      return "action_required";
    case "PERMISSION_EXPIRED":
    case "ERROR":
      return "error";
    case "DISABLED":
      return "disabled";
    default:
      return "not_connected";
  }
}
