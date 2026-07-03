import {
  hasAmazonMarketplaceEnvCredentials,
  hasAmazonSpApiEnvCredentials,
  hasCredentialVaultKey,
  hasCjDropshippingEnvCredentials,
  isAmazonMarketplaceLiveActivated,
  isCjLiveCommerceActivated,
  isLiveCommerceProductionMode,
  V1_PRODUCTION_MARKETPLACE_IDS,
  V1_PRODUCTION_REALITY_SUPPLIER,
} from "./version-1-activation-config.js";
import { assessProductionInfrastructureReadiness } from "./production-infrastructure-readiness.js";

export type B6ImplementationItemStatus = "PENDING" | "CONFIGURED" | "VERIFIED";

export type B6ImplementationItem = {
  id: string;
  order: number;
  label: string;
  status: B6ImplementationItemStatus;
  configured: boolean;
  verified: boolean;
  envKeys: string[];
  detail: string;
};

export type B6ImplementationTracking = {
  blockerId: "B6";
  mission: "REAL-002B";
  /** B5 certification is frozen — no further B5 scope. */
  b5Frozen: boolean;
  b5Closed: boolean;
  b6Closed: boolean;
  liveCommerceMode: string;
  progressPercent: number;
  completedCount: number;
  totalObjectives: number;
  currentObjectiveId: string;
  firstRequiredIntegration: string;
  nextHighestImpactAction: string;
  items: B6ImplementationItem[];
  computedAt: string;
};

function hasNonEmpty(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

/** Stripe live payment path — secret + webhook for checkout verification. */
export function hasStripeProductionCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  const secret = env.STRIPE_SECRET_KEY ?? "";
  const webhook = env.STRIPE_WEBHOOK_SECRET ?? "";
  return hasNonEmpty(secret) && hasNonEmpty(webhook);
}

/** Vault key meets production minimum (32+ chars). */
export function isCredentialVaultVerified(env: NodeJS.ProcessEnv = process.env): boolean {
  const key = env.CREDENTIAL_VAULT_KEY ?? "";
  return hasNonEmpty(key) && key.length >= 32;
}

/** Adapter readiness — env credentials present for V1 marketplace + supplier. */
export function isCommerceAdapterConnectivityReady(env: NodeJS.ProcessEnv = process.env): boolean {
  return hasAmazonSpApiEnvCredentials(env) && hasCjDropshippingEnvCredentials(env);
}

/** B5 closed and frozen — no further hosting/deploy missions. */
export function isB5CertificationFrozen(env: NodeJS.ProcessEnv = process.env): boolean {
  return assessProductionInfrastructureReadiness(env).b5Closed;
}

function itemStatus(configured: boolean, verified: boolean): B6ImplementationItemStatus {
  if (verified) return "VERIFIED";
  if (configured) return "CONFIGURED";
  return "PENDING";
}

const AMAZON_SHARED_ENV_KEYS = [
  "AMAZON_SP_API_CLIENT_ID",
  "AMAZON_SP_API_CLIENT_SECRET",
] as const;

/** B6 — live commerce credential implementation tracker (PROOF-001 path). */
export function assessB6CredentialImplementation(
  env: NodeJS.ProcessEnv = process.env,
): B6ImplementationTracking {
  const infrastructure = assessProductionInfrastructureReadiness(env);
  const b5Closed = infrastructure.b5Closed;
  const b5Frozen = b5Closed;

  const amazonUsConfigured = hasAmazonMarketplaceEnvCredentials("amazon-us", env);
  const amazonUsVerified = isAmazonMarketplaceLiveActivated("amazon-us", env);

  const amazonSgConfigured = hasAmazonMarketplaceEnvCredentials("amazon-sg", env);
  const amazonSgVerified = isAmazonMarketplaceLiveActivated("amazon-sg", env);

  const cjConfigured = hasCjDropshippingEnvCredentials(env);
  const cjVerified = isCjLiveCommerceActivated(env);

  const stripeConfigured = hasStripeProductionCredentials(env);
  const stripeVerified =
    stripeConfigured &&
    (env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live");

  const vaultConfigured = hasCredentialVaultKey(env);
  const vaultVerified = isCredentialVaultVerified(env);

  const adapterConfigured = isCommerceAdapterConnectivityReady(env);
  const adapterVerified =
    adapterConfigured &&
    isLiveCommerceProductionMode(env) &&
    amazonUsVerified &&
    amazonSgVerified &&
    cjVerified;

  const items: B6ImplementationItem[] = [
    {
      id: "B6-01a",
      order: 1,
      label: "Amazon US SP-API production credentials",
      status: itemStatus(amazonUsConfigured, amazonUsVerified),
      configured: amazonUsConfigured,
      verified: amazonUsVerified,
      envKeys: [
        ...AMAZON_SHARED_ENV_KEYS,
        "AMAZON_SP_API_REFRESH_TOKEN_NA",
        "AMAZON_SP_API_REFRESH_TOKEN",
      ],
      detail: amazonUsVerified
        ? `${V1_PRODUCTION_MARKETPLACE_IDS[0]} live commerce activated (NA endpoint)`
        : amazonUsConfigured
          ? "US credentials present — set LIVE_COMMERCE_INTEGRATION_MODE=production after King approval"
          : "Inject shared LWA app + AMAZON_SP_API_REFRESH_TOKEN_NA on Railway",
    },
    {
      id: "B6-01b",
      order: 2,
      label: "Amazon SG SP-API production credentials",
      status: itemStatus(amazonSgConfigured, amazonSgVerified),
      configured: amazonSgConfigured,
      verified: amazonSgVerified,
      envKeys: [...AMAZON_SHARED_ENV_KEYS, "AMAZON_SP_API_REFRESH_TOKEN_FE"],
      detail: amazonSgVerified
        ? `${V1_PRODUCTION_MARKETPLACE_IDS[1]} live commerce activated (FE endpoint)`
        : amazonSgConfigured
          ? "SG credentials present — set LIVE_COMMERCE_INTEGRATION_MODE=production after King approval"
          : "Inject shared LWA app + AMAZON_SP_API_REFRESH_TOKEN_FE on Railway",
    },
    {
      id: "B6-02",
      order: 3,
      label: "CJ Dropshipping production credentials",
      status: itemStatus(cjConfigured, cjVerified),
      configured: cjConfigured,
      verified: cjVerified,
      envKeys: ["CJ_API_KEY", "CJ_DROPSHIPPING_API_KEY"],
      detail: cjVerified
        ? `${V1_PRODUCTION_REALITY_SUPPLIER} live fulfilment activated (CJ API 2.0)`
        : cjConfigured
          ? "API key present — set CJ_INTEGRATION_MODE=LIVE and LIVE_COMMERCE_INTEGRATION_MODE=production after approval"
          : "Inject CJ_API_KEY on Railway (CJ API 2.0 — key only)",
    },
    {
      id: "B6-03",
      order: 4,
      label: "Stripe production API integration",
      status: itemStatus(stripeConfigured, stripeVerified),
      configured: stripeConfigured,
      verified: stripeVerified,
      envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      detail: stripeVerified
        ? "Stripe live keys configured"
        : stripeConfigured
          ? "Stripe keys present — confirm sk_live for production"
          : "Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET",
    },
    {
      id: "B6-04",
      order: 5,
      label: "Credential Vault verification",
      status: itemStatus(vaultConfigured, vaultVerified),
      configured: vaultConfigured,
      verified: vaultVerified,
      envKeys: ["CREDENTIAL_VAULT_KEY"],
      detail: vaultVerified
        ? "Vault encryption key verified (32+ chars)"
        : vaultConfigured
          ? "CREDENTIAL_VAULT_KEY too short — use 32+ random characters"
          : "Set CREDENTIAL_VAULT_KEY on Railway",
    },
    {
      id: "B6-05",
      order: 6,
      label: "Commerce adapter connectivity test",
      status: itemStatus(adapterConfigured, adapterVerified),
      configured: adapterConfigured,
      verified: adapterVerified,
      envKeys: [],
      detail: adapterVerified
        ? "Amazon US + Amazon SG + CJ adapters verified in production mode"
        : adapterConfigured
          ? "Run validateLiveMarketplaceConnection after production mode enabled"
          : "Complete B6-01a, B6-01b, and B6-02 first",
    },
  ];

  const verifiedCount = items.filter((i) => i.verified).length;
  const progressPercent = Math.round((verifiedCount / items.length) * 100);

  const firstPending = items.find((i) => !i.verified) ?? null;
  const currentObjectiveId = firstPending?.id ?? "B6-COMPLETE";
  const firstRequiredIntegration = firstPending?.label ?? "All B6 objectives complete";

  let nextHighestImpactAction =
    "B6-01a — Inject Amazon US SP-API production credentials on Railway";
  if (firstPending) {
    nextHighestImpactAction = `${firstPending.id} — ${firstPending.detail}`;
  } else {
    nextHighestImpactAction = "B6 complete — proceed to B7 GK-GOLIVE-APPROVAL";
  }

  const b6Closed =
    amazonUsVerified &&
    amazonSgVerified &&
    cjVerified &&
    stripeVerified &&
    vaultVerified &&
    adapterVerified;

  return {
    blockerId: "B6",
    mission: "REAL-002B",
    b5Frozen,
    b5Closed,
    b6Closed,
    liveCommerceMode: infrastructure.liveCommerceMode,
    progressPercent,
    completedCount: verifiedCount,
    totalObjectives: items.length,
    currentObjectiveId,
    firstRequiredIntegration,
    nextHighestImpactAction,
    items,
    computedAt: new Date().toISOString(),
  };
}
