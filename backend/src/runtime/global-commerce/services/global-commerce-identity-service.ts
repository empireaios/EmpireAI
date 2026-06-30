import { randomUUID } from "node:crypto";

import { getAccountReadiness } from "../../../orchestration/account-infrastructure-engine/services/account-infrastructure-service.js";
import { listMarketplaceConnections } from "../../../orchestration/marketplace-infrastructure-engine/services/marketplace-infrastructure-service.js";
import type { GlobalCommerceIdentity } from "../models/global-identity.js";
import {
  getMarketplacesByCountry,
  getProvidersByCountry,
} from "./global-commerce-registry-service.js";
import { getGlobalCommerceRepository } from "../repositories/sqlite-global-commerce-repository.js";

export type BuildIdentityInput = {
  workspaceId: string;
  companyId: string;
  accountType?: "grand_king" | "founder";
  founderDisplayName?: string;
  businessId?: string;
  brandId?: string;
  brandName?: string;
};

/** B-007 — Global Commerce Identity (no plaintext credentials). */
export function buildOrLoadGlobalCommerceIdentity(input: BuildIdentityInput): GlobalCommerceIdentity {
  const existing = getGlobalCommerceRepository().getIdentity(input.workspaceId, input.companyId);
  if (existing) return existing;

  const accountType = input.accountType ?? "grand_king";
  const accountReadiness = getAccountReadiness(input.workspaceId, accountType);
  const marketplaceConnections = listMarketplaceConnections(input.workspaceId);

  const marketplaceAccounts = marketplaceConnections.map((conn) => ({
    providerId: conn.marketplaceId,
    countryCode: inferCountryFromMarketplace(conn.marketplaceId),
    connectionStatus: mapConnectionStatus(conn.status),
    credentialsRef: conn.credentialsRef,
    accountHealth: conn.health,
    humanActionsRequired: conn.status === "NOT_CONNECTED" ? [...conn.requiredHumanSteps] : [],
  }));

  const identity: GlobalCommerceIdentity = {
    identityId: randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    accountType,
    founderIdentity: { displayName: input.founderDisplayName ?? "Grand King" },
    businessIdentity: {
      businessId: input.businessId,
      countryCode: undefined,
    },
    brandIdentity: {
      brandId: input.brandId,
      brandName: input.brandName,
    },
    countryReadiness: GLOBAL_COUNTRY_CODES.map((code) => ({
      countryCode: code,
      readinessScore: computeCountryReadinessScore(code, marketplaceAccounts),
      status: computeCountryReadinessScore(code, marketplaceAccounts) >= 50 ? "PARTIAL" : "NOT_STARTED",
    })),
    marketplaceAccounts,
    paymentAccounts: [
      {
        providerId: "stripe",
        countryCode: "GLOBAL",
        connectionStatus: accountReadiness.overallReadinessPercent > 0 ? "PENDING" : "NOT_CONNECTED",
        credentialsRef: undefined,
      },
    ],
    supplierAccounts: [
      {
        providerId: "cj-dropshipping",
        connectionStatus: accountReadiness.overallReadinessPercent > 0 ? "PENDING" : "NOT_CONNECTED",
        credentialsRef: undefined,
      },
    ],
    logisticsAccounts: [],
    advertisingAccounts: [],
    kycStatus: "NOT_STARTED",
    termsAccepted: false,
    documentsRequired: ["Business registration (per country)", "Tax identification"],
    humanActionsRequired: accountReadiness.pendingHumanActions > 0
      ? [`${accountReadiness.pendingHumanActions} account setup actions pending`]
      : [],
    updatedAt: new Date().toISOString(),
  };

  getGlobalCommerceRepository().saveIdentity(identity);
  return identity;
}

const GLOBAL_COUNTRY_CODES = [
  "SG", "MY", "ID", "TH", "PH", "VN", "US", "GB", "DE", "FR", "JP", "KR", "CN", "IN", "AU", "BR", "MX", "ZA", "NG",
];

function inferCountryFromMarketplace(marketplaceId: string): string {
  if (marketplaceId.includes("shopify")) return "US";
  if (marketplaceId.includes("amazon")) return "US";
  return "GLOBAL";
}

function mapConnectionStatus(status: string): GlobalCommerceIdentity["marketplaceAccounts"][number]["connectionStatus"] {
  if (status === "CONNECTED") return "CONNECTED";
  if (status === "CONNECTING") return "PENDING";
  if (status === "ERROR") return "ERROR";
  if (status === "EXPIRED") return "EXPIRED";
  return "NOT_CONNECTED";
}

function computeCountryReadinessScore(
  countryCode: string,
  accounts: GlobalCommerceIdentity["marketplaceAccounts"],
): number {
  const marketplaces = getMarketplacesByCountry(countryCode);
  if (marketplaces.length === 0) return 0;
  const connected = accounts.filter(
    (a) => a.countryCode === countryCode && a.connectionStatus === "CONNECTED",
  ).length;
  return Math.min(100, Math.round((connected / marketplaces.length) * 100));
}

export function getGlobalCommerceIdentity(workspaceId: string, companyId: string): GlobalCommerceIdentity | null {
  return getGlobalCommerceRepository().getIdentity(workspaceId, companyId);
}

export function summarizeIdentityFootprint(identity: GlobalCommerceIdentity) {
  const ready = identity.countryReadiness.filter((c) => c.readinessScore >= 70);
  const blocked = identity.countryReadiness.filter((c) => c.readinessScore === 0);
  const connected = identity.marketplaceAccounts.filter((a) => a.connectionStatus === "CONNECTED");
  const pending = identity.marketplaceAccounts.filter((a) => a.connectionStatus === "PENDING" || a.connectionStatus === "NOT_CONNECTED");
  return { readyCountries: ready.length, blockedCountries: blocked.length, connectedMarketplaces: connected.length, pendingMarketplaces: pending.length };
}
