/** B6-01D — Amazon SP-API marketplace profiles (ADR-052). Shared LWA app; per-region credentials. */

export const AMAZON_MARKETPLACE_REGISTRY_IDS = ["amazon-us", "amazon-sg"] as const;

export type AmazonMarketplaceRegistryId = (typeof AMAZON_MARKETPLACE_REGISTRY_IDS)[number];

export type AmazonSpApiRegion = "NA" | "FE";

export type AmazonMarketplaceProfile = {
  registryId: AmazonMarketplaceRegistryId;
  displayName: string;
  countryCode: string;
  spApiRegion: AmazonSpApiRegion;
  marketplaceId: string;
  productionEndpoint: string;
  sandboxEndpoint: string;
  sellerCentralAuthorizeBaseUrl: string;
  refreshTokenEnvKey: string;
  legacyRefreshTokenEnvKeys: readonly string[];
  adapterProviderId: AmazonMarketplaceRegistryId;
};

export const AMAZON_SP_API_SHARED_ENV_KEYS = {
  clientId: "AMAZON_SP_API_CLIENT_ID",
  clientSecret: "AMAZON_SP_API_CLIENT_SECRET",
} as const;

const AMAZON_US_PROFILE: AmazonMarketplaceProfile = {
  registryId: "amazon-us",
  displayName: "Amazon US",
  countryCode: "US",
  spApiRegion: "NA",
  marketplaceId: "ATVPDKIKX0DER",
  productionEndpoint: "https://sellingpartnerapi-na.amazon.com",
  sandboxEndpoint: "https://sandbox.sellingpartnerapi-na.amazon.com",
  sellerCentralAuthorizeBaseUrl: "https://sellercentral.amazon.com/apps/authorize/consent",
  refreshTokenEnvKey: "AMAZON_SP_API_REFRESH_TOKEN_NA",
  legacyRefreshTokenEnvKeys: ["AMAZON_SP_API_REFRESH_TOKEN"],
  adapterProviderId: "amazon-us",
};

const AMAZON_SG_PROFILE: AmazonMarketplaceProfile = {
  registryId: "amazon-sg",
  displayName: "Amazon Singapore",
  countryCode: "SG",
  spApiRegion: "FE",
  marketplaceId: "A19VAU5U5O7RUS",
  productionEndpoint: "https://sellingpartnerapi-fe.amazon.com",
  sandboxEndpoint: "https://sandbox.sellingpartnerapi-fe.amazon.com",
  sellerCentralAuthorizeBaseUrl: "https://sellercentral.amazon.sg/apps/authorize/consent",
  refreshTokenEnvKey: "AMAZON_SP_API_REFRESH_TOKEN_FE",
  legacyRefreshTokenEnvKeys: [],
  adapterProviderId: "amazon-sg",
};

export const AMAZON_MARKETPLACE_PROFILES: Record<
  AmazonMarketplaceRegistryId,
  AmazonMarketplaceProfile
> = {
  "amazon-us": AMAZON_US_PROFILE,
  "amazon-sg": AMAZON_SG_PROFILE,
};

/** Legacy single-adapter provider id maps to Amazon US for backward compatibility. */
export const AMAZON_LEGACY_PROVIDER_ID = "amazon-seller";

export function isAmazonMarketplaceRegistryId(
  value: string,
): value is AmazonMarketplaceRegistryId {
  return (AMAZON_MARKETPLACE_REGISTRY_IDS as readonly string[]).includes(value);
}

/** Normalize live-commerce provider id to a marketplace registry id. */
export function resolveAmazonMarketplaceRegistryId(
  providerId: string,
): AmazonMarketplaceRegistryId | null {
  if (isAmazonMarketplaceRegistryId(providerId)) {
    return providerId;
  }
  if (providerId === AMAZON_LEGACY_PROVIDER_ID) {
    return "amazon-us";
  }
  return null;
}

export function getAmazonMarketplaceProfile(
  registryId: AmazonMarketplaceRegistryId,
): AmazonMarketplaceProfile {
  return AMAZON_MARKETPLACE_PROFILES[registryId];
}

export function getAmazonMarketplaceProfileByProviderId(
  providerId: string,
): AmazonMarketplaceProfile | null {
  const registryId = resolveAmazonMarketplaceRegistryId(providerId);
  return registryId ? getAmazonMarketplaceProfile(registryId) : null;
}

export function listAmazonMarketplaceProfiles(): AmazonMarketplaceProfile[] {
  return AMAZON_MARKETPLACE_REGISTRY_IDS.map((id) => getAmazonMarketplaceProfile(id));
}

function hasNonEmpty(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export type AmazonSpApiSharedCredentials = {
  clientId: string;
  clientSecret: string;
};

export function getAmazonSpApiSharedCredentials(
  env: NodeJS.ProcessEnv = process.env,
): AmazonSpApiSharedCredentials {
  return {
    clientId: env[AMAZON_SP_API_SHARED_ENV_KEYS.clientId] ?? "",
    clientSecret: env[AMAZON_SP_API_SHARED_ENV_KEYS.clientSecret] ?? "",
  };
}

export function hasAmazonSpApiSharedCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  const shared = getAmazonSpApiSharedCredentials(env);
  return hasNonEmpty(shared.clientId) && hasNonEmpty(shared.clientSecret);
}

export function resolveAmazonMarketplaceRefreshToken(
  profile: AmazonMarketplaceProfile,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const primary = env[profile.refreshTokenEnvKey];
  if (hasNonEmpty(primary)) {
    return primary!.trim();
  }
  for (const legacyKey of profile.legacyRefreshTokenEnvKeys) {
    const legacy = env[legacyKey];
    if (hasNonEmpty(legacy)) {
      return legacy!.trim();
    }
  }
  return "";
}

export type AmazonMarketplaceCredentialProfile = {
  registryId: AmazonMarketplaceRegistryId;
  shared: AmazonSpApiSharedCredentials;
  refreshToken: string;
  marketplaceId: string;
  spApiRegion: AmazonSpApiRegion;
  productionEndpoint: string;
  sandboxEndpoint: string;
  sellerCentralAuthorizeBaseUrl: string;
  configured: boolean;
};

export function getAmazonMarketplaceCredentialProfile(
  registryId: AmazonMarketplaceRegistryId,
  env: NodeJS.ProcessEnv = process.env,
): AmazonMarketplaceCredentialProfile {
  const profile = getAmazonMarketplaceProfile(registryId);
  const shared = getAmazonSpApiSharedCredentials(env);
  const refreshToken = resolveAmazonMarketplaceRefreshToken(profile, env);
  return {
    registryId,
    shared,
    refreshToken,
    marketplaceId: profile.marketplaceId,
    spApiRegion: profile.spApiRegion,
    productionEndpoint: profile.productionEndpoint,
    sandboxEndpoint: profile.sandboxEndpoint,
    sellerCentralAuthorizeBaseUrl: profile.sellerCentralAuthorizeBaseUrl,
    configured:
      hasNonEmpty(shared.clientId) &&
      hasNonEmpty(shared.clientSecret) &&
      hasNonEmpty(refreshToken),
  };
}

export function hasAmazonMarketplaceEnvCredentials(
  registryId: AmazonMarketplaceRegistryId,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getAmazonMarketplaceCredentialProfile(registryId, env).configured;
}

/** Shared LWA app + refresh token present for every V1 Amazon marketplace. */
export function hasAmazonSpApiEnvCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!hasAmazonSpApiSharedCredentials(env)) {
    return false;
  }
  return AMAZON_MARKETPLACE_REGISTRY_IDS.every((id) =>
    hasAmazonMarketplaceEnvCredentials(id, env),
  );
}

export function resolveAmazonSpApiEndpoint(
  profile: AmazonMarketplaceProfile,
  mode: "sandbox" | "production",
): string {
  return mode === "production" ? profile.productionEndpoint : profile.sandboxEndpoint;
}
