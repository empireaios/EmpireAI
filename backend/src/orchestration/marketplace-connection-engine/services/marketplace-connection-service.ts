import {
  completeAccountConnection,
  getAccountHealthSnapshot,
  getAccountProviderDefinition,
  getExternalAccount,
  listHumanActionQueue,
  markHumanActionComplete,
  startAccountSetup,
} from "../../account-infrastructure-engine/index.js";
import {
  completeMarketplaceConnection,
  getMarketplaceConnection,
  getMarketplaceDefinition,
  listMarketplaceConnections,
  markMarketplaceConnectionError,
  startMarketplaceConnection,
} from "../../marketplace-infrastructure-engine/index.js";
import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type {
  CompleteConnectionInput,
  ConnectionBlueprintCapabilities,
  MarketplaceConnectionBlueprint,
  RefreshConnectionInput,
  RevokeConnectionInput,
  StartConnectionInput,
  VerifyConnectionInput,
} from "../models/connection-blueprint-contract.js";
import type {
  ApiStatus,
  MarketplaceAccountType,
  MarketplaceConnectionRecord,
  MarketplaceConnectionRecordStatus,
  OAuthStatus,
  PermissionStatus,
} from "../models/marketplace-connection-record.js";
import type { MarketplacePublishingReadiness } from "../models/marketplace-publishing-readiness.js";
import {
  getMarketplaceConnectionEngineRepository,
  resetMarketplaceConnectionEngineRepository,
} from "../repositories/sqlite-marketplace-connection-repository.js";
import {
  marketplaceToProviderId,
  toInternalAccountType,
} from "./marketplace-account-map.js";

export { resetMarketplaceConnectionEngineRepository };

const PUBLISHING_AUTOMATION = ["product_publish", "listing_update", "inventory_sync", "order_fulfillment"];

function deriveCapabilities(marketplaceId: MarketplaceId): ConnectionBlueprintCapabilities {
  const providerId = marketplaceToProviderId(marketplaceId);
  const accountDef = getAccountProviderDefinition(providerId);
  const marketplaceDef = getMarketplaceDefinition(marketplaceId);
  const automatedApis = new Set(marketplaceDef.availableApis);
  const unsupportedAutomationAreas = PUBLISHING_AUTOMATION.filter((area) => {
    if (area === "product_publish" || area === "listing_update") {
      return !automatedApis.has("catalog_sync");
    }
    if (area === "order_fulfillment") {
      return !automatedApis.has("order_fulfillment");
    }
    return true;
  });

  return {
    oauthSupported: accountDef.oauthSupported,
    apiKeySupported: accountDef.apiSupported && !accountDef.oauthSupported,
    manualSetupRequired: accountDef.requiredHumanSteps.length > 0,
    unsupportedAutomationAreas: [
      ...unsupportedAutomationAreas,
      "live_publishing",
      "product_creation",
      "ad_launch",
      "unauthorized_marketplace_automation",
    ],
  };
}

function mapAccountStatusToConnectionStatus(
  accountStatus: string,
): MarketplaceConnectionRecordStatus {
  switch (accountStatus) {
    case "CONNECTED":
      return "CONNECTED";
    case "PENDING_SETUP":
      return "CONNECTING";
    case "AWAITING_USER_ACTION":
      return "AWAITING_USER_ACTION";
    case "PERMISSION_EXPIRED":
      return "EXPIRED";
    case "ERROR":
      return "ERROR";
    case "DISABLED":
      return "DISABLED";
    default:
      return "NOT_CONNECTED";
  }
}

function deriveOAuthStatus(
  accountStatus: string,
  oauthSupported: boolean,
  credentialsRef?: string,
): OAuthStatus {
  if (!oauthSupported) return "NOT_STARTED";
  if (accountStatus === "PERMISSION_EXPIRED") return "EXPIRED";
  if (accountStatus === "DISABLED" && credentialsRef) return "REVOKED";
  if (accountStatus === "CONNECTED" && credentialsRef) return "AUTHORIZED";
  if (accountStatus === "PENDING_SETUP" || accountStatus === "AWAITING_USER_ACTION") return "PENDING";
  return "NOT_STARTED";
}

function deriveApiStatus(accountStatus: string, apiSupported: boolean, credentialsRef?: string): ApiStatus {
  if (!apiSupported) return "NOT_CONFIGURED";
  if (accountStatus === "ERROR") return "ERROR";
  if (accountStatus === "CONNECTED" && credentialsRef) return "VERIFIED";
  if (credentialsRef) return "CONFIGURED";
  return "NOT_CONFIGURED";
}

function derivePermissionStatus(
  requiredScopes: string[],
  grantedScopes: string[],
  accountStatus: string,
): PermissionStatus {
  if (accountStatus === "PERMISSION_EXPIRED") return "EXPIRED";
  if (grantedScopes.length === 0) return "NOT_GRANTED";
  if (grantedScopes.length >= requiredScopes.length) return "GRANTED";
  return "PARTIAL";
}

function computeMissingScopes(requiredScopes: string[], grantedScopes: string[]): string[] {
  const granted = new Set(grantedScopes);
  return requiredScopes.filter((scope) => !granted.has(scope));
}

function buildMarketplaceConnectionRecord(
  workspaceId: string,
  marketplaceId: MarketplaceId,
  accountType: MarketplaceAccountType = "GRAND_KING",
): MarketplaceConnectionRecord {
  const internalAccountType = toInternalAccountType(accountType);
  const providerId = marketplaceToProviderId(marketplaceId);
  const accountDef = getAccountProviderDefinition(providerId);
  const marketplaceDef = getMarketplaceDefinition(marketplaceId);
  const capabilities = deriveCapabilities(marketplaceId);

  void listMarketplaceConnections(workspaceId);
  const account = getExternalAccount(workspaceId, providerId, internalAccountType);
  const healthSnapshot = getAccountHealthSnapshot(workspaceId, providerId);
  const pendingActions = listHumanActionQueue(workspaceId, { providerId }).filter(
    (action) => action.status === "PENDING" || action.status === "IN_PROGRESS" || action.status === "BLOCKED",
  );

  const saved = getMarketplaceConnectionEngineRepository().getRecord(workspaceId, marketplaceId, accountType);
  const infra = getMarketplaceConnection(workspaceId, marketplaceId);

  const requiredScopes = accountDef.requiredPermissions;
  const grantedScopes = saved?.grantedScopes ?? (account.credentialsRef ? requiredScopes : []);
  const missingScopes = computeMissingScopes(requiredScopes, grantedScopes);
  const connectionStatus = mapAccountStatusToConnectionStatus(account.connectionStatus);

  const record: MarketplaceConnectionRecord = {
    marketplaceId,
    workspaceId,
    accountType,
    displayName: marketplaceDef.displayName,
    connectionStatus,
    connectionHealth: account.connectionHealth,
    oauthStatus: deriveOAuthStatus(account.connectionStatus, accountDef.oauthSupported, account.credentialsRef),
    apiStatus: deriveApiStatus(account.connectionStatus, accountDef.apiSupported, account.credentialsRef),
    permissionStatus: derivePermissionStatus(requiredScopes, grantedScopes, account.connectionStatus),
    requiredScopes,
    grantedScopes,
    missingScopes,
    setupSteps: accountDef.setupSteps,
    requiredHumanSteps: accountDef.requiredHumanSteps,
    lastVerifiedAt: saved?.lastVerifiedAt ?? healthSnapshot.health.lastApiVerification ?? infra.lastCheckedAt,
    expiresAt: saved?.expiresAt,
    notes: accountDef.philosophy,
    credentialsRef: account.credentialsRef,
    providerId,
    oauthSupported: capabilities.oauthSupported,
    apiKeySupported: capabilities.apiKeySupported,
    manualSetupRequired: capabilities.manualSetupRequired,
    unsupportedAutomationAreas: capabilities.unsupportedAutomationAreas,
    pendingHumanActions: pendingActions.length,
    metadata: {
      neverStoresPasswords: "true",
      infrastructureStatus: infra.status,
      accountStatus: account.connectionStatus,
      healthScore: String(account.healthScore),
    },
    updatedAt: new Date().toISOString(),
  };

  return getMarketplaceConnectionEngineRepository().saveRecord(record);
}

function createBlueprint(): MarketplaceConnectionBlueprint {
  return {
    marketplaceId: "amazon" as MarketplaceId,
    capabilities: deriveCapabilities("amazon"),
    startConnection(input: StartConnectionInput) {
      const accountType = input.accountType ?? "GRAND_KING";
      const internalType = toInternalAccountType(accountType);
      const providerId = marketplaceToProviderId(input.marketplaceId);

      startMarketplaceConnection(input.workspaceId, input.marketplaceId, input.actor);
      startAccountSetup(input.workspaceId, providerId, input.actor, internalType);

      return buildMarketplaceConnectionRecord(input.workspaceId, input.marketplaceId, accountType);
    },
    completeConnection(input: CompleteConnectionInput) {
      const accountType = input.accountType ?? "GRAND_KING";
      const internalType = toInternalAccountType(accountType);
      const providerId = marketplaceToProviderId(input.marketplaceId);
      const requiredScopes = getAccountProviderDefinition(providerId).requiredPermissions;
      const grantedScopes = input.grantedScopes ?? requiredScopes;

      completeMarketplaceConnection(input.workspaceId, input.marketplaceId, {
        credentialsRef: input.credentialsRef,
        actor: input.actor,
      });
      completeAccountConnection(input.workspaceId, providerId, {
        credentialsRef: input.credentialsRef,
        actor: input.actor,
      }, internalType);

      const pending = listHumanActionQueue(input.workspaceId, { providerId });
      for (const action of pending) {
        markHumanActionComplete(input.workspaceId, action.actionId, input.actor ?? "system");
      }

      const record = buildMarketplaceConnectionRecord(input.workspaceId, input.marketplaceId, accountType);
      return getMarketplaceConnectionEngineRepository().saveRecord({
        ...record,
        grantedScopes,
        missingScopes: computeMissingScopes(requiredScopes, grantedScopes),
        permissionStatus: derivePermissionStatus(requiredScopes, grantedScopes, "CONNECTED"),
        expiresAt: input.expiresAt,
        connectionStatus: "CONNECTED",
        oauthStatus: record.oauthSupported ? "AUTHORIZED" : "NOT_STARTED",
        apiStatus: "VERIFIED",
      });
    },
    refreshConnection(input: RefreshConnectionInput) {
      const accountType = input.accountType ?? "GRAND_KING";
      const record = buildMarketplaceConnectionRecord(input.workspaceId, input.marketplaceId, accountType);
      return getMarketplaceConnectionEngineRepository().saveRecord({
        ...record,
        lastVerifiedAt: new Date().toISOString(),
        metadata: {
          ...record.metadata,
          refreshedBy: input.actor ?? "system",
          refreshedAt: new Date().toISOString(),
        },
      });
    },
    revokeConnection(input: RevokeConnectionInput) {
      const accountType = input.accountType ?? "GRAND_KING";
      markMarketplaceConnectionError(
        input.workspaceId,
        input.marketplaceId,
        input.reason ?? "Connection revoked",
      );

      const record = buildMarketplaceConnectionRecord(input.workspaceId, input.marketplaceId, accountType);
      return getMarketplaceConnectionEngineRepository().saveRecord({
        ...record,
        connectionStatus: "NOT_CONNECTED",
        oauthStatus: record.oauthSupported ? "REVOKED" : "NOT_STARTED",
        apiStatus: "NOT_CONFIGURED",
        permissionStatus: "NOT_GRANTED",
        grantedScopes: [],
        missingScopes: record.requiredScopes,
        credentialsRef: undefined,
        metadata: {
          ...record.metadata,
          revokedBy: input.actor ?? "system",
          revokedAt: new Date().toISOString(),
          revokeReason: input.reason ?? "Connection revoked",
        },
      });
    },
    verifyConnection(input: VerifyConnectionInput) {
      const accountType = input.accountType ?? "GRAND_KING";
      const record = buildMarketplaceConnectionRecord(input.workspaceId, input.marketplaceId, accountType);
      const verifiedAt = new Date().toISOString();
      const verified =
        record.connectionStatus === "CONNECTED" &&
        record.missingScopes.length === 0 &&
        record.pendingHumanActions === 0;

      return getMarketplaceConnectionEngineRepository().saveRecord({
        ...record,
        lastVerifiedAt: verifiedAt,
        apiStatus: verified ? "VERIFIED" : record.apiStatus,
        metadata: {
          ...record.metadata,
          lastVerificationResult: verified ? "passed" : "failed",
          verifiedAt,
        },
      });
    },
    listConnectedMarketplaces(workspaceId: string, accountType: MarketplaceAccountType = "GRAND_KING") {
      return listMarketplaceConnectionRecords(workspaceId, accountType).filter(
        (entry) => entry.connectionStatus === "CONNECTED",
      );
    },
  };
}

let blueprintInstance: MarketplaceConnectionBlueprint | null = null;

export function getMarketplaceConnectionBlueprint(): MarketplaceConnectionBlueprint {
  if (!blueprintInstance) {
    blueprintInstance = createBlueprint();
  }
  return blueprintInstance;
}

export function listMarketplaceConnectionRecords(
  workspaceId: string,
  accountType: MarketplaceAccountType = "GRAND_KING",
): MarketplaceConnectionRecord[] {
  return MARKETPLACE_IDS.map((marketplaceId) =>
    buildMarketplaceConnectionRecord(workspaceId, marketplaceId, accountType),
  );
}

export function getMarketplaceConnectionRecord(
  workspaceId: string,
  marketplaceId: MarketplaceId,
  accountType: MarketplaceAccountType = "GRAND_KING",
): MarketplaceConnectionRecord {
  return buildMarketplaceConnectionRecord(workspaceId, marketplaceId, accountType);
}

export function startMarketplaceConnectionFlow(input: StartConnectionInput): MarketplaceConnectionRecord {
  return getMarketplaceConnectionBlueprint().startConnection(input);
}

export function completeMarketplaceConnectionFlow(input: CompleteConnectionInput): MarketplaceConnectionRecord {
  return getMarketplaceConnectionBlueprint().completeConnection(input);
}

export function refreshMarketplaceConnectionFlow(input: RefreshConnectionInput): MarketplaceConnectionRecord {
  return getMarketplaceConnectionBlueprint().refreshConnection(input);
}

export function revokeMarketplaceConnectionFlow(input: RevokeConnectionInput): MarketplaceConnectionRecord {
  return getMarketplaceConnectionBlueprint().revokeConnection(input);
}

export function verifyMarketplaceConnectionFlow(input: VerifyConnectionInput): MarketplaceConnectionRecord {
  return getMarketplaceConnectionBlueprint().verifyConnection(input);
}

export function listConnectedMarketplaces(
  workspaceId: string,
  accountType: MarketplaceAccountType = "GRAND_KING",
): MarketplaceConnectionRecord[] {
  return getMarketplaceConnectionBlueprint().listConnectedMarketplaces(workspaceId, accountType);
}

/** Answers: "Which marketplaces are ready for product publishing?" */
export function getMarketplacePublishingReadiness(
  workspaceId: string,
  accountType: MarketplaceAccountType = "GRAND_KING",
): MarketplacePublishingReadiness {
  const records = listMarketplaceConnectionRecords(workspaceId, accountType);
  const readyMarketplaces: MarketplaceId[] = [];
  const blockedMarketplaces: MarketplacePublishingReadiness["blockedMarketplaces"] = [];
  const actionRequiredMarketplaces: MarketplacePublishingReadiness["actionRequiredMarketplaces"] = [];

  for (const record of records) {
    const publishingReady =
      record.connectionStatus === "CONNECTED" &&
      record.missingScopes.length === 0 &&
      record.pendingHumanActions === 0 &&
      record.apiStatus === "VERIFIED";

    if (publishingReady) {
      readyMarketplaces.push(record.marketplaceId);
      continue;
    }

    if (record.connectionStatus === "ERROR" || record.connectionStatus === "DISABLED" || record.connectionStatus === "EXPIRED") {
      blockedMarketplaces.push({
        marketplaceId: record.marketplaceId,
        displayName: record.displayName,
        reason: record.connectionStatus === "EXPIRED" ? "Permissions expired" : `Status: ${record.connectionStatus}`,
      });
      continue;
    }

    actionRequiredMarketplaces.push({
      marketplaceId: record.marketplaceId,
      displayName: record.displayName,
      pendingHumanActions: record.pendingHumanActions,
      missingScopes: record.missingScopes,
    });
  }

  const overallMarketplaceReadiness =
    records.length === 0 ? 0 : Math.round((readyMarketplaces.length / records.length) * 100);

  return {
    workspaceId,
    accountType,
    readyMarketplaces,
    blockedMarketplaces,
    actionRequiredMarketplaces,
    overallMarketplaceReadiness,
    computedAt: new Date().toISOString(),
  };
}

export function getMarketplaceConnectionCapabilities(marketplaceId: MarketplaceId): ConnectionBlueprintCapabilities {
  return deriveCapabilities(marketplaceId);
}
