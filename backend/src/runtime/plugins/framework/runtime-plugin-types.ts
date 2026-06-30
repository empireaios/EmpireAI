import { z } from "zod";

/** B-001 — Plugin category aligned with CRT kernels and COS blueprint. */
export const RuntimePluginCategorySchema = z.enum([
  "marketplace",
  "supplier",
  "payment",
  "advertising",
  "logistics",
  "customer_service",
  "analytics",
  "agent",
]);

export type RuntimePluginCategory = z.infer<typeof RuntimePluginCategorySchema>;

export const RuntimePluginLifecycleSchema = z.enum([
  "REGISTERED",
  "ENABLED",
  "DISABLED",
  "DEGRADED",
  "UNREGISTERED",
]);

export type RuntimePluginLifecycle = z.infer<typeof RuntimePluginLifecycleSchema>;

export const RuntimePluginExecutionModeSchema = z.enum([
  "ARCHITECTURE_ONLY",
  "SIMULATED",
  "READY",
  "LIVE",
]);

export type RuntimePluginExecutionMode = z.infer<typeof RuntimePluginExecutionModeSchema>;

export const RuntimePluginCertificationStateSchema = z.enum([
  "UNCERTIFIED",
  "PENDING",
  "CERTIFIED",
  "REVOKED",
]);

export type RuntimePluginCertificationState = z.infer<typeof RuntimePluginCertificationStateSchema>;

export const RuntimePluginCapabilitySupportSchema = z.enum([
  "DECLARED",
  "PARTIAL",
  "UNSUPPORTED",
]);

export type RuntimePluginCapabilitySupport = z.infer<typeof RuntimePluginCapabilitySupportSchema>;

export const RuntimePluginCapabilitySchema = z.object({
  capabilityId: z.string(),
  displayName: z.string(),
  support: RuntimePluginCapabilitySupportSchema,
  executionMode: RuntimePluginExecutionModeSchema,
});

export type RuntimePluginCapability = z.infer<typeof RuntimePluginCapabilitySchema>;

export const RuntimePluginHealthSchema = z.object({
  state: z.enum(["HEALTHY", "WARNING", "DEGRADED", "BLOCKED", "UNKNOWN"]),
  executionBlocked: z.boolean(),
  certificationState: RuntimePluginCertificationStateSchema,
  executionState: RuntimePluginExecutionModeSchema,
  summary: z.string(),
  checkedAt: z.string(),
});

export type RuntimePluginHealth = z.infer<typeof RuntimePluginHealthSchema>;

export const RuntimePluginManifestSchema = z.object({
  pluginId: z.string(),
  displayName: z.string(),
  category: RuntimePluginCategorySchema,
  version: z.string(),
  missionId: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()),
  certificationState: RuntimePluginCertificationStateSchema,
  executionState: RuntimePluginExecutionModeSchema,
  lifecycle: RuntimePluginLifecycleSchema,
  capabilities: z.array(RuntimePluginCapabilitySchema),
  sourceModule: z.string(),
});

export type RuntimePluginManifest = z.infer<typeof RuntimePluginManifestSchema>;

export type PluginDispatchOutcome = "BLOCKED" | "NOT_IMPLEMENTED" | "READY";

export type PluginDispatchResult = {
  dispatchId: string;
  pluginId: string;
  capabilityId: string;
  outcome: PluginDispatchOutcome;
  executionBlocked: boolean;
  planId?: string;
  message: string;
  dispatchedAt: string;
};
