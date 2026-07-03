/**
 * G6-03 — Deployment signal resolver (registry-driven readiness signals — no secret exposure).
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import { REG_DEPLOYMENT_PROFILE } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";

export type DeploymentSignalResult = {
  signalRef: string;
  satisfied: boolean;
  summary: string;
};

const REPO_ROOT = join(process.cwd(), "..");

const SIGNAL_RESOLVERS: Record<
  string,
  (context: RegistryLoaderContext) => DeploymentSignalResult
> = {
  "signal:backend-package": () => ({
    signalRef: "signal:backend-package",
    satisfied: existsSync(join(REPO_ROOT, "backend", "package.json")),
    summary: "Backend package manifest present",
  }),
  "signal:frontend-package": () => ({
    signalRef: "signal:frontend-package",
    satisfied: existsSync(join(REPO_ROOT, "frontend", "package.json")),
    summary: "Frontend package manifest present",
  }),
  "signal:database-configured": () => ({
    signalRef: "signal:database-configured",
    satisfied: Boolean(process.env.DATABASE_PATH?.trim() || process.env.DATABASE_URL?.trim()),
    summary: "Database configuration signal present (value redacted)",
  }),
  "signal:guardian-enabled": () => ({
    signalRef: "signal:guardian-enabled",
    satisfied: process.env.GUARDIAN_ENABLED === "true",
    summary: "Guardian enabled signal configured",
  }),
  "signal:queue-configured": () => ({
    signalRef: "signal:queue-configured",
    satisfied: Boolean(process.env.REDIS_URL?.trim() || process.env.QUEUE_ENABLED === "true"),
    summary: "Queue configuration signal present (value redacted)",
  }),
  "signal:cache-configured": () => ({
    signalRef: "signal:cache-configured",
    satisfied: Boolean(process.env.REDIS_URL?.trim() || process.env.CACHE_ENABLED === "true"),
    summary: "Cache configuration signal present (value redacted)",
  }),
  "signal:storage-configured": () => ({
    signalRef: "signal:storage-configured",
    satisfied: Boolean(process.env.STORAGE_PROVIDER?.trim() || process.env.S3_BUCKET?.trim()),
    summary: "Storage configuration signal present (value redacted)",
  }),
  "signal:secrets-vault-configured": () => ({
    signalRef: "signal:secrets-vault-configured",
    satisfied: Boolean(process.env.SECRETS_VAULT?.trim() || process.env.VAULT_ENABLED === "true"),
    summary: "Secrets vault signal present (value redacted)",
  }),
  "signal:logging-enabled": () => ({
    signalRef: "signal:logging-enabled",
    satisfied: process.env.LOGGING_DISABLED !== "true",
    summary: "Logging enabled by default",
  }),
  "signal:monitoring-enabled": () => ({
    signalRef: "signal:monitoring-enabled",
    satisfied: process.env.MONITORING_DISABLED !== "true",
    summary: "Monitoring enabled by default",
  }),
  "signal:backup-policy": () => ({
    signalRef: "signal:backup-policy",
    satisfied: process.env.BACKUP_DISABLED !== "true",
    summary: "Backup policy enabled by default",
  }),
  "signal:ssl-configured": () => ({
    signalRef: "signal:ssl-configured",
    satisfied: process.env.SSL_DISABLED !== "true",
    summary: "SSL readiness signal enabled by default",
  }),
  "signal:dns-configured": () => ({
    signalRef: "signal:dns-configured",
    satisfied: Boolean(process.env.DNS_DOMAIN?.trim() || process.env.SSL_DISABLED !== "true"),
    summary: "DNS configuration signal present (value redacted)",
  }),
  "signal:email-configured": () => ({
    signalRef: "signal:email-configured",
    satisfied: Boolean(process.env.EMAIL_PROVIDER?.trim() || process.env.SMTP_HOST?.trim()),
    summary: "Email configuration signal present (value redacted)",
  }),
  "signal:worker-configured": () => ({
    signalRef: "signal:worker-configured",
    satisfied: existsSync(join(process.cwd(), "src", "worker.ts")),
    summary: "Worker entrypoint present",
  }),
  "signal:scheduler-configured": () => ({
    signalRef: "signal:scheduler-configured",
    satisfied: existsSync(join(process.cwd(), "src", "worker.ts")),
    summary: "Scheduler/worker infrastructure present",
  }),
  "signal:deployment-profile": (context) => {
    try {
      const result = getRegistryLoader().resolve(context, REG_DEPLOYMENT_PROFILE);
      return {
        signalRef: "signal:deployment-profile",
        satisfied: result.meta.wired && result.rows.length > 0,
        summary: "Deployment profile registry wired",
      };
    } catch {
      return {
        signalRef: "signal:deployment-profile",
        satisfied: false,
        summary: "Deployment profile registry not resolved",
      };
    }
  },
  "signal:registry-wired": (context) => {
    try {
      const result = getRegistryLoader().resolve(context, "REG-DOCTRINE" as Parameters<
        ReturnType<typeof getRegistryLoader>["resolve"]
      >[1]);
      return {
        signalRef: "signal:registry-wired",
        satisfied: result.meta.wired,
        summary: "Registry catalog wired",
      };
    } catch {
      return {
        signalRef: "signal:registry-wired",
        satisfied: false,
        summary: "Registry catalog not wired",
      };
    }
  },
};

export function resolveDeploymentSignal(
  signalRef: string,
  context: RegistryLoaderContext = {},
): DeploymentSignalResult {
  const resolver = SIGNAL_RESOLVERS[signalRef];
  if (!resolver) {
    return {
      signalRef,
      satisfied: false,
      summary: `Unknown deployment signal: ${signalRef}`,
    };
  }
  return resolver(context);
}

export function resolveDeploymentSignals(
  signalRefs: string[],
  context: RegistryLoaderContext = {},
): DeploymentSignalResult[] {
  return signalRefs.map((signalRef) => resolveDeploymentSignal(signalRef, context));
}

export function listDeploymentSignalRefs(): string[] {
  return Object.keys(SIGNAL_RESOLVERS);
}
