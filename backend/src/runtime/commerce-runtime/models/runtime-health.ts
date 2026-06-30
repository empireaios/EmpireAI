import { z } from "zod";

export const HealthStateSchema = z.enum(["HEALTHY", "WARNING", "DEGRADED", "BLOCKED", "UNKNOWN"]);

export type HealthState = z.infer<typeof HealthStateSchema>;

export const RuntimeHealthReportSchema = z.object({
  runtime: z.object({
    state: HealthStateSchema,
    executionBlocked: z.literal(true),
    summary: z.string(),
  }),
  adapters: z.object({
    state: HealthStateSchema,
    registered: z.number(),
    blocked: z.number(),
  }),
  kernels: z.array(
    z.object({
      kernel: z.string(),
      state: HealthStateSchema,
      adapterCount: z.number(),
    }),
  ),
  execution: z.object({
    state: HealthStateSchema,
    pendingPlans: z.number(),
    queuedRequests: z.number(),
    blockedDispatches: z.number(),
  }),
  events: z.object({
    state: HealthStateSchema,
    received: z.number(),
    processed: z.number(),
    deadLetter: z.number(),
  }),
});

export type RuntimeHealthReport = z.infer<typeof RuntimeHealthReportSchema>;

export const CommerceRuntimeDashboardSchema = z.object({
  moduleId: z.literal("commerce-runtime"),
  missionId: z.literal("CRT-001"),
  runtimeHealth: RuntimeHealthReportSchema,
  registeredAdapters: z.array(
    z.object({
      adapterId: z.string(),
      displayName: z.string(),
      kind: z.string(),
      lifecycle: z.string(),
    }),
  ),
  executionQueue: z.array(
    z.object({
      requestId: z.string(),
      operation: z.string(),
      kernel: z.string(),
      status: z.string(),
      requestedAt: z.string(),
    }),
  ),
  pendingPlans: z.array(
    z.object({
      planId: z.string(),
      operation: z.string(),
      status: z.string(),
      stepCount: z.number(),
      createdAt: z.string(),
    }),
  ),
  capabilityCoverage: z.array(
    z.object({
      operation: z.string(),
      supported: z.number(),
      partial: z.number(),
      blocked: z.number(),
    }),
  ),
  unsupportedRequests: z.array(
    z.object({
      operation: z.string(),
      adapterId: z.string(),
      reason: z.string(),
    }),
  ),
  runtimePlugins: z.array(
    z.object({
      pluginId: z.string(),
      displayName: z.string(),
      category: z.string(),
      version: z.string(),
      lifecycle: z.string(),
      certificationState: z.string(),
      executionState: z.string(),
      enabled: z.boolean(),
    }),
  ),
  pluginCapabilityCoverage: z.array(
    z.object({
      capabilityId: z.string(),
      displayName: z.string(),
      pluginCount: z.number(),
    }),
  ),
  pluginExecutionStatus: z.object({
    blocked: z.number(),
    notImplemented: z.number(),
    ready: z.number(),
  }),
  computedAt: z.string(),
});

export type CommerceRuntimeDashboard = z.infer<typeof CommerceRuntimeDashboardSchema>;
