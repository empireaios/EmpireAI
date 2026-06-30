import type { OnboardingReadiness } from "../models/onboarding-readiness.js";
import { getRuntimePluginRegistry } from "../../plugins/index.js";
import { getProvider, getMarketplacesByCountry } from "./global-commerce-registry-service.js";
import { getGlobalCommerceIdentity } from "./global-commerce-identity-service.js";

const DIFFICULTY_BY_COUNTRY: Record<string, OnboardingReadiness["estimatedSetupDifficulty"]> = {
  SG: "MODERATE", MY: "MODERATE", ID: "HARD", TH: "MODERATE", PH: "MODERATE", VN: "HARD",
  US: "MODERATE", GB: "MODERATE", DE: "HARD", FR: "HARD", JP: "VERY_HARD", KR: "HARD",
  CN: "VERY_HARD", IN: "HARD", AU: "MODERATE", BR: "HARD", MX: "MODERATE", ZA: "MODERATE", NG: "HARD",
};

/** B-008 — Marketplace onboarding readiness per country/provider. */
export function computeOnboardingReadiness(
  workspaceId: string,
  companyId: string,
  countryCode: string,
  providerId: string,
): OnboardingReadiness {
  const provider = getProvider(providerId);
  const identity = getGlobalCommerceIdentity(workspaceId, companyId);
  const registry = getRuntimePluginRegistry();

  if (!provider || provider.countryCode !== countryCode) {
    return buildReadiness(countryCode, providerId, provider?.displayName ?? providerId, "BLOCKED", 0, ["Provider not found for country"], [], [], "HIGH", "VERY_HARD");
  }

  const account = identity?.marketplaceAccounts.find((a) => a.providerId === providerId || a.providerId === provider.realityProviderId);
  const plugin = provider.runtimePluginId ? registry.getPlugin(provider.runtimePluginId) : null;
  const pluginCertified = plugin?.manifest.certificationState === "CERTIFIED";

  let status: OnboardingReadiness["status"] = "NOT_STARTED";
  let score = 10;
  const missing: string[] = [];
  const human: string[] = [];
  const auto: string[] = [];

  if (!identity?.termsAccepted) {
    status = "TERMS_REQUIRED";
    missing.push("Accept EmpireAI commerce terms");
    human.push("Review and accept commerce operating terms");
    score = 5;
  }

  if (identity?.kycStatus === "NOT_STARTED" || identity?.kycStatus === "INFO_REQUIRED") {
    status = "KYC_REQUIRED";
    missing.push("Complete KYC verification");
    human.push("Submit business verification documents");
    score = Math.min(score, 15);
  }

  if (!account || account.connectionStatus === "NOT_CONNECTED") {
    status = "ACCOUNT_REQUIRED";
    missing.push("Create marketplace seller account");
    human.push(`Register ${provider.displayName} seller account`);
    human.push("Complete OAuth via account infrastructure (no password storage)");
    score = Math.min(score, 25);
  } else if (account.connectionStatus === "PENDING") {
    status = "PENDING_REVIEW";
    score = 45;
    human.push("Await marketplace account approval");
  } else if (account.connectionStatus === "CONNECTED") {
    if (!account.credentialsRef) {
      status = "CREDENTIALS_REQUIRED";
      missing.push("Vault credential reference");
      auto.push("Connect via reality-integration vault");
      score = 60;
    } else if (plugin && !pluginCertified) {
      status = "CONNECTED";
      missing.push("Runtime plugin certification");
      auto.push("Complete COS plugin certification");
      score = 70;
    } else {
      status = pluginCertified ? "READY" : "CONNECTED";
      score = pluginCertified ? 95 : 75;
      auto.push("Plugin capability validation");
    }
  }

  if (provider.runtimePluginId && !plugin) {
    status = "BLOCKED";
    missing.push(`Runtime plugin ${provider.runtimePluginId} not registered`);
    score = 0;
  }

  const risk: OnboardingReadiness["risk"] = score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

  return buildReadiness(
    countryCode,
    providerId,
    provider.displayName,
    status,
    score,
    missing,
    human,
    auto,
    risk,
    DIFFICULTY_BY_COUNTRY[countryCode] ?? "MODERATE",
    provider.runtimePluginId,
    pluginCertified,
  );
}

function buildReadiness(
  countryCode: string,
  providerId: string,
  displayName: string,
  status: OnboardingReadiness["status"],
  readinessScore: number,
  missingActions: string[],
  humanActions: string[],
  automatableActions: string[],
  risk: OnboardingReadiness["risk"],
  estimatedSetupDifficulty: OnboardingReadiness["estimatedSetupDifficulty"],
  runtimePluginId?: string,
  pluginCertified = false,
): OnboardingReadiness {
  return {
    countryCode,
    providerId,
    displayName,
    domain: "marketplace",
    status,
    readinessScore,
    missingActions,
    humanActions,
    automatableActions,
    risk,
    estimatedSetupDifficulty,
    runtimePluginId,
    pluginCertified,
  };
}

export function computeCountryOnboardingBatch(
  workspaceId: string,
  companyId: string,
  countryCode: string,
): OnboardingReadiness[] {
  return getMarketplacesByCountry(countryCode).map((p) =>
    computeOnboardingReadiness(workspaceId, companyId, countryCode, p.providerId),
  );
}
