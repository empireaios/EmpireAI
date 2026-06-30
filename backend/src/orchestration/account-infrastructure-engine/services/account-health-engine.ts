import type {
  AccountConnectionStatus,
  AccountExpiryStatus,
  AccountProviderId,
  ExternalAccount,
} from "../models/account-provider.js";
import type { AccountHealth } from "../models/account-health.js";
import type { HumanActionItem } from "../models/human-action-queue.js";

function healthLabel(score: number): string {
  if (score >= 85) return "HEALTHY";
  if (score >= 60) return "DEGRADED";
  if (score >= 30) return "UNHEALTHY";
  return "CRITICAL";
}

function deriveExpiryStatus(account: ExternalAccount): AccountExpiryStatus {
  if (account.expiryStatus === "EXPIRED" || account.connectionStatus === "PERMISSION_EXPIRED") {
    return "EXPIRED";
  }
  if (account.expiryStatus === "EXPIRING_SOON") {
    return "EXPIRING_SOON";
  }
  if (account.connectionStatus === "CONNECTED") {
    return "VALID";
  }
  return "UNKNOWN";
}

/** Computes account health from registry state — no marketplace publishing logic. */
export function computeAccountHealth(
  account: ExternalAccount,
  pendingActions: HumanActionItem[],
): AccountHealth {
  const timestamp = new Date().toISOString();
  const missingConfiguration: string[] = [];
  const blockingIssues: string[] = [];

  if (!account.credentialsRef && account.connectionStatus === "CONNECTED") {
    missingConfiguration.push("credentials_ref");
  }

  if (account.connectionStatus === "NOT_CONNECTED") {
    blockingIssues.push("Account not connected");
  }
  if (account.connectionStatus === "PENDING_SETUP") {
    blockingIssues.push("Setup in progress");
  }
  if (account.connectionStatus === "AWAITING_USER_ACTION") {
    blockingIssues.push("Human action required");
  }
  if (account.connectionStatus === "PERMISSION_EXPIRED") {
    blockingIssues.push("Permissions expired — re-authorize OAuth");
  }
  if (account.connectionStatus === "ERROR") {
    blockingIssues.push("Connection error");
  }
  if (account.connectionStatus === "DISABLED") {
    blockingIssues.push("Account disabled");
  }

  for (const action of pendingActions) {
    if (action.status === "PENDING" || action.status === "BLOCKED") {
      blockingIssues.push(action.title);
    }
  }

  let healthScore = 0;
  switch (account.connectionStatus) {
    case "CONNECTED":
      healthScore = 90;
      break;
    case "PENDING_SETUP":
      healthScore = 45;
      break;
    case "AWAITING_USER_ACTION":
      healthScore = 35;
      break;
    case "PERMISSION_EXPIRED":
      healthScore = 20;
      break;
    case "ERROR":
      healthScore = 10;
      break;
    case "DISABLED":
      healthScore = 0;
      break;
    default:
      healthScore = 15;
  }

  healthScore -= pendingActions.filter((a) => a.status === "PENDING").length * 8;
  healthScore -= blockingIssues.length * 3;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const expiry = deriveExpiryStatus(account);

  return {
    providerId: account.providerId,
    workspaceId: account.workspaceId,
    healthScore,
    lastSuccessfulValidation:
      account.connectionStatus === "CONNECTED" ? account.lastValidation : undefined,
    lastApiVerification: account.lastValidation,
    permissionExpiry:
      expiry === "EXPIRED" || expiry === "EXPIRING_SOON"
        ? account.metadata.permissionExpiry
        : undefined,
    missingConfiguration,
    blockingIssues,
    computedAt: timestamp,
  };
}

export function deriveConnectionHealth(
  status: AccountConnectionStatus,
  healthScore: number,
): string {
  if (status === "DISABLED") return "DISABLED";
  return healthLabel(healthScore);
}

export function mapMarketplaceStatusToAccountStatus(
  marketplaceStatus: string,
  hasPendingHumanActions: boolean,
): AccountConnectionStatus {
  if (hasPendingHumanActions) {
    return "AWAITING_USER_ACTION";
  }
  switch (marketplaceStatus) {
    case "CONNECTED":
      return "CONNECTED";
    case "CONNECTING":
      return "PENDING_SETUP";
    case "EXPIRED":
      return "PERMISSION_EXPIRED";
    case "ERROR":
      return "ERROR";
    default:
      return "NOT_CONNECTED";
  }
}

export function mapInfrastructureStatusToAccountStatus(
  infraStatus: string,
  hasPendingHumanActions: boolean,
): AccountConnectionStatus {
  return mapMarketplaceStatusToAccountStatus(infraStatus, hasPendingHumanActions);
}

export function providerIdsForHealthCheck(): AccountProviderId[] {
  return [
    "amazon-seller",
    "walmart-marketplace",
    "shopify",
    "tiktok-shop",
    "ebay",
    "google-merchant-center",
    "meta-business",
    "instagram-shop",
    "stripe",
    "cj-dropshipping",
  ];
}
