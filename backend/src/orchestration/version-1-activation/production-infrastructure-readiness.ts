import {
  hasAmazonSpApiEnvCredentials,
  hasCjDropshippingEnvCredentials,
  isLiveCommerceProductionMode,
} from "./version-1-activation-config.js";

const DEV_SESSION_SECRET = "empireai-dev-session-secret-change-in-production";

export type ProductionInfrastructureAssessment = {
  /** B5 — hosting/env configuration complete (excludes B6 credentials). */
  hostingConfigured: boolean;
  /** Runtime smoke test passed against public URL (set via env or probe). */
  runtimeVerified: boolean;
  /** B5 closed — hosting configured + runtime verified. */
  b5Closed: boolean;
  blockers: string[];
  warnings: string[];
  gates: Record<string, boolean>;
  secretsChecklist: Array<{
    key: string;
    present: boolean;
    requiredForHosting: boolean;
    category: "core" | "redis" | "security" | "llm" | "commerce" | "verification";
    note: string;
  }>;
  domainReadiness: {
    corsOrigin: string | null;
    httpsFrontend: boolean;
    backendPublicUrl: string | null;
    frontendPublicUrl: string | null;
  };
  /** Live commerce correctly blocked until B6 credentials injected. */
  liveCommerceSafelyBlocked: boolean;
  liveCommerceMode: string;
  credentialReadinessForB6: {
    amazon: boolean;
    cj: boolean;
    vault: boolean;
  };
  deploymentTargets: {
    backend: "railway";
    frontend: "vercel-empireai-web";
    redis: "upstash-or-managed";
  };
  computedAt: string;
};

function hasNonEmpty(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function resolveLiveCommerceMode(env: NodeJS.ProcessEnv): string {
  return (env.LIVE_COMMERCE_INTEGRATION_MODE ?? "sandbox").toLowerCase();
}

/** P0-1 / B5 — production hosting readiness (Railway + Vercel + Redis), not B6 credentials. */
export function assessProductionInfrastructureReadiness(
  env: NodeJS.ProcessEnv = process.env,
): ProductionInfrastructureAssessment {
  const nodeProduction = env.NODE_ENV === "production";
  const onRailway = Boolean(env.RAILWAY_ENVIRONMENT || env.RAILWAY_SERVICE_NAME);
  const databasePath = env.DATABASE_PATH ?? "";
  const persistentDatabase =
    databasePath.startsWith("/data/") || databasePath.includes("empireai-brain.db");
  const redisUrl = env.REDIS_URL ?? "";
  const redisConfigured =
    hasNonEmpty(redisUrl) &&
    !redisUrl.includes("127.0.0.1") &&
    !redisUrl.includes("localhost");
  const redisOptional = env.REDIS_OPTIONAL === "true";
  const sessionSecret = env.SESSION_SECRET ?? "";
  const sessionSecretProduction =
    hasNonEmpty(sessionSecret) &&
    sessionSecret.length >= 32 &&
    sessionSecret !== DEV_SESSION_SECRET;
  const corsOrigin = env.CORS_ORIGIN ?? "";
  const corsHttps = corsOrigin.startsWith("https://");
  const repoRoot = env.EMPIREAI_REPO_ROOT ?? "";
  const repoRootSet = hasNonEmpty(repoRoot);
  const llmPresent = Boolean(
    env.OPENAI_API_KEY?.trim() ||
      env.ANTHROPIC_API_KEY?.trim() ||
      env.GOOGLE_AI_API_KEY?.trim() ||
      env.GEMINI_API_KEY?.trim(),
  );
  const backendPublicUrl =
    env.PRODUCTION_BACKEND_URL ??
    (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : null);
  const frontendPublicUrl = env.PRODUCTION_FRONTEND_URL ?? null;
  const runtimeVerified =
    env.PRODUCTION_DEPLOY_VERIFIED === "true" ||
    env.PRODUCTION_HOSTING_VERIFIED === "true";
  const liveCommerceMode = resolveLiveCommerceMode(env);
  const liveCommerceProduction = isLiveCommerceProductionMode(env);
  const amazonCreds = hasAmazonSpApiEnvCredentials(env);
  const cjCreds = hasCjDropshippingEnvCredentials(env);
  const vaultKey = hasNonEmpty(env.CREDENTIAL_VAULT_KEY);
  const liveCommerceSafelyBlocked =
    !liveCommerceProduction || (amazonCreds && cjCreds && vaultKey);

  const gates = {
    nodeProduction,
    persistentDatabase,
    redisConfigured,
    redisNotOptional: !redisOptional,
    sessionSecretProduction,
    corsOriginSet: hasNonEmpty(corsOrigin),
    corsHttps,
    repoRootSet: repoRootSet || onRailway,
    llmPresent,
    liveCommerceSafelyBlocked,
    notVercelBrainHost: env.VERCEL !== "1",
  };

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!nodeProduction) blockers.push("NODE_ENV must be production");
  if (!persistentDatabase && nodeProduction) {
    blockers.push("DATABASE_PATH must point to persistent volume (e.g. /data/empireai-brain.db)");
  }
  if (!redisConfigured && nodeProduction) {
    blockers.push("REDIS_URL must be set to production Redis (Upstash rediss://)");
  }
  if (redisOptional && nodeProduction) {
    blockers.push("REDIS_OPTIONAL must not be true in production");
  }
  if (!sessionSecretProduction) {
    blockers.push("SESSION_SECRET must be set to a non-default 32+ character production secret");
  }
  if (!hasNonEmpty(corsOrigin)) {
    blockers.push("CORS_ORIGIN must match deployed Vercel frontend URL");
  } else if (!corsHttps && nodeProduction) {
    warnings.push("CORS_ORIGIN should use https:// in production");
  }
  if (!repoRootSet && !onRailway) {
    warnings.push("EMPIREAI_REPO_ROOT not set — Pillow host may fail outside Railway");
  }
  if (!llmPresent) {
    warnings.push("No LLM API key configured — Brain agents will fail");
  }
  if (env.VERCEL === "1") {
    blockers.push("VERCEL=1 must not be set on Railway Brain service");
  }
  if (!liveCommerceSafelyBlocked) {
    blockers.push(
      "LIVE_COMMERCE_INTEGRATION_MODE=production requires B6 credentials — keep sandbox until REAL-002B approved",
    );
  }
  if (!runtimeVerified) {
    blockers.push(
      "Production runtime not verified — run verify-production-deploy against public /health and set PRODUCTION_DEPLOY_VERIFIED=true",
    );
  }

  const secretsChecklist = [
    {
      key: "SESSION_SECRET",
      present: sessionSecretProduction,
      requiredForHosting: true,
      category: "security" as const,
      note: "Rotate from dev default",
    },
    {
      key: "REDIS_URL",
      present: redisConfigured,
      requiredForHosting: true,
      category: "redis" as const,
      note: "Upstash rediss:// TLS URL",
    },
    {
      key: "DATABASE_PATH",
      present: persistentDatabase,
      requiredForHosting: true,
      category: "core" as const,
      note: "Railway volume /data/empireai-brain.db",
    },
    {
      key: "CORS_ORIGIN",
      present: hasNonEmpty(corsOrigin),
      requiredForHosting: true,
      category: "core" as const,
      note: "Vercel empireai-web production URL",
    },
    {
      key: "OPENAI_API_KEY|ANTHROPIC|GEMINI",
      present: llmPresent,
      requiredForHosting: false,
      category: "llm" as const,
      note: "At least one provider for agents",
    },
    {
      key: "AMAZON_SP_API_*",
      present: amazonCreds,
      requiredForHosting: false,
      category: "commerce" as const,
      note: "B6 — not required to close B5",
    },
    {
      key: "CJ_DROPSHIPPING_*",
      present: cjCreds,
      requiredForHosting: false,
      category: "commerce" as const,
      note: "B6 — not required to close B5",
    },
    {
      key: "CREDENTIAL_VAULT_KEY",
      present: vaultKey,
      requiredForHosting: false,
      category: "commerce" as const,
      note: "B6 — required before live commerce production mode",
    },
    {
      key: "PRODUCTION_DEPLOY_VERIFIED",
      present: runtimeVerified,
      requiredForHosting: true,
      category: "verification" as const,
      note: "Set after verify-production-deploy smoke pass",
    },
  ];

  const hostingConfigured = blockers.filter(
    (b) => !b.includes("runtime not verified") && !b.includes("PRODUCTION_DEPLOY_VERIFIED"),
  ).length === 0;

  return {
    hostingConfigured,
    runtimeVerified,
    b5Closed: hostingConfigured && runtimeVerified,
    blockers,
    warnings,
    gates,
    secretsChecklist,
    domainReadiness: {
      corsOrigin: corsOrigin || null,
      httpsFrontend: corsHttps,
      backendPublicUrl,
      frontendPublicUrl,
    },
    liveCommerceSafelyBlocked,
    liveCommerceMode,
    credentialReadinessForB6: {
      amazon: amazonCreds,
      cj: cjCreds,
      vault: vaultKey,
    },
    deploymentTargets: {
      backend: "railway",
      frontend: "vercel-empireai-web",
      redis: "upstash-or-managed",
    },
    computedAt: new Date().toISOString(),
  };
}

export type ProductionDeployProbeResult = {
  url: string;
  ok: boolean;
  status: number | null;
  brainOnline: boolean;
  redisMode: string | null;
  guardianOverall: string | null;
  version1ActivationStatus: string | null;
  productionDeployHostingConfigured: boolean | null;
  error: string | null;
  probedAt: string;
};

/** Probe public production endpoints for B5 runtime verification. */
export async function probeProductionDeployHealth(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ProductionDeployProbeResult> {
  const normalized = baseUrl.replace(/\/$/, "");
  const result: ProductionDeployProbeResult = {
    url: normalized,
    ok: false,
    status: null,
    brainOnline: false,
    redisMode: null,
    guardianOverall: null,
    version1ActivationStatus: null,
    productionDeployHostingConfigured: null,
    error: null,
    probedAt: new Date().toISOString(),
  };

  try {
    const healthRes = await fetchImpl(`${normalized}/health`, {
      signal: AbortSignal.timeout(15_000),
    });
    result.status = healthRes.status;
    if (!healthRes.ok) {
      result.error = `GET /health returned ${healthRes.status}`;
      return result;
    }
    const health = (await healthRes.json()) as Record<string, unknown>;
    result.brainOnline = health.brain === "online";
    result.redisMode = typeof health.redisMode === "string" ? health.redisMode : null;
    const guardian = health.guardian as Record<string, unknown> | undefined;
    result.guardianOverall =
      typeof guardian?.overall === "string" ? guardian.overall : null;

    const deployRes = await fetchImpl(`${normalized}/health/production-deploy`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (deployRes.ok) {
      const deploy = (await deployRes.json()) as Record<string, unknown>;
      result.productionDeployHostingConfigured =
        deploy.hostingConfigured === true;
      result.version1ActivationStatus =
        typeof deploy.b5Status === "string" ? deploy.b5Status : null;
    }

    const v1Res = await fetchImpl(`${normalized}/health/version-1-activation`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (v1Res.ok) {
      const v1 = (await v1Res.json()) as Record<string, unknown>;
      result.version1ActivationStatus =
        typeof v1.status === "string" ? v1.status : result.version1ActivationStatus;
    }

    result.ok =
      result.brainOnline === true &&
      result.redisMode !== "degraded" &&
      result.status === 200;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Probe failed";
  }

  return result;
}
