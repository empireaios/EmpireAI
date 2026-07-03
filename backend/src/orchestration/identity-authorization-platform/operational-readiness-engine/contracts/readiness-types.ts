/**
 * G8-06 — Operational Readiness Engine types.
 */

import { z } from "zod";

export const OPERATIONAL_READINESS_ENGINE_VERSION = "g8-06-v1" as const;

export const READINESS_LEVELS = [
  "ready",
  "partially_ready",
  "not_ready",
  "blocked",
  "requires_review",
  "unknown",
] as const;

export type ReadinessLevel = (typeof READINESS_LEVELS)[number];

export const READINESS_CONTEXTS = [
  "empire_platform",
  "workspace",
  "company",
  "brand",
  "account_holder",
  "business_model",
  "workflow",
  "automation",
  "marketplace_operation",
  "storefront_operation",
  "advertising_operation",
  "payment_operation",
  "supplier_operation",
  "logistics_operation",
  "analytics_operation",
  "future_operation_type",
] as const;

export type ReadinessContext = (typeof READINESS_CONTEXTS)[number];

export const READINESS_EKLS_KINDS = [
  "readiness_evaluated",
  "readiness_blocked",
  "readiness_recovered",
  "readiness_degraded",
  "readiness_requirement_missing",
  "readiness_recommendation_generated",
] as const;

export type ReadinessEklsKind = (typeof READINESS_EKLS_KINDS)[number];

export type ReadinessBlocker = {
  blockerId: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  providerId?: string;
  evidence: string[];
};

export type ReadinessRecommendation = {
  recommendationId: string;
  priority: "high" | "medium" | "low";
  action: string;
  message: string;
  providerId?: string;
};

export type ReadinessResult = {
  readinessScore: number;
  readinessLevel: ReadinessLevel;
  context: ReadinessContext;
  workspaceId: string;
  accountHolderId?: string;
  providerId?: string;
  workflowId?: string;
  automationId?: string;
  brandId?: string;
  companyId?: string;
  requiredProviders: string[];
  connectedProviders: string[];
  missingProviders: string[];
  expiredProviders: string[];
  degradedProviders: string[];
  missingCredentials: string[];
  missingPermissions: string[];
  missingScopes: string[];
  blockingIssues: ReadinessBlocker[];
  warnings: string[];
  recommendedActions: ReadinessRecommendation[];
  evidence: string[];
  lastEvaluatedAt: string;
  correlationId: string;
  governanceState: string;
};

export const readinessPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "readiness_rule",
    "provider_readiness_evaluator",
    "workflow_readiness_evaluator",
    "recommendation_generator",
    "blocker_detector",
  ]),
  pillowGovernance: z.literal(true),
});

export type ReadinessPluginManifest = z.infer<typeof readinessPluginManifestSchema>;

const SECRET_PATTERNS = ["sk_live", "sk_test", "api_key", "secret", "token", "password", "client_secret", "private_key"];

export function redactReadinessSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (SECRET_PATTERNS.some((p) => lower.includes(p))) return "[REDACTED]";
    return value;
  }
  if (Array.isArray(value)) return value.map(redactReadinessSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_PATTERNS.some((p) => k.toLowerCase().includes(p)) ? "[REDACTED]" : redactReadinessSecrets(v),
      ]),
    );
  }
  return value;
}

export function assertNoSecretsInReadinessPayload(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !SECRET_PATTERNS.some((p) => serialized.toLowerCase().includes(p) && !serialized.includes("[REDACTED]"));
}
