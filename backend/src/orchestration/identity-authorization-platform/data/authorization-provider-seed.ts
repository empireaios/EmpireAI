/**
 * G8-00 — Authorization provider seed (REG-AUTHORIZATION-PROVIDER).
 */

import {
  FOUNDATION_PROVIDER_IDS,
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type FoundationProviderId,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";

const PROVIDER_KINDS: Record<FoundationProviderId, string> = {
  amazon: "marketplace",
  stripe: "payment",
  meta: "oauth",
  google: "oauth",
  shopify: "storefront",
  tiktok: "analytics",
  openai: "ai",
  anthropic: "ai",
  github: "developer",
  vercel: "infrastructure",
  cloudflare: "infrastructure",
  cjdropshipping: "supplier",
};

const PROVIDER_DISPLAY_NAMES: Record<FoundationProviderId, string> = {
  amazon: "Amazon",
  stripe: "Stripe",
  meta: "Meta",
  google: "Google",
  shopify: "Shopify",
  tiktok: "TikTok",
  openai: "OpenAI",
  anthropic: "Anthropic",
  github: "GitHub",
  vercel: "Vercel",
  cloudflare: "Cloudflare",
  cjdropshipping: "CJdropshipping",
};

function authorizationRow(providerId: FoundationProviderId): IdentityAuthorizationRegistryRowBase {
  const name = PROVIDER_DISPLAY_NAMES[providerId];
  return {
    id: `authorization-provider-${providerId}`,
    name: `${name} authorization provider`,
    description: `Registry-driven authorization reference for ${name} — configurable foundation entry`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-IDENTITY-PROVIDER"],
    capabilities: ["authorize"],
    configuration: {
      authorizationProvider: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        providerId,
        providerName: name,
        providerKind: PROVIDER_KINDS[providerId],
        configurable: true,
        oauthCapable: ["meta", "google", "github", "shopify", "stripe"].includes(providerId),
        credentialCapable: ["openai", "anthropic", "vercel", "cloudflare", "amazon"].includes(providerId),
        authorizationScopes: [`scope:${providerId}:operate`],
        registryRef: `REG-AUTHORIZATION-PROVIDER:${providerId}`,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Foundation only — OAuth deferred to G8-01+" },
  };
}

export const AUTHORIZATION_PROVIDER_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] =
  FOUNDATION_PROVIDER_IDS.map(authorizationRow);
