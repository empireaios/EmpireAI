import { z } from "zod";

export const RegisteredAdapterKindSchema = z.enum([
  "marketplace",
  "supplier",
  "payment",
  "advertising",
  "logistics",
  "customer_service",
  "analytics",
  "agent",
]);

export type RegisteredAdapterKind = z.infer<typeof RegisteredAdapterKindSchema>;

export const RegisteredAdapterSchema = z.object({
  adapterId: z.string(),
  displayName: z.string(),
  kind: RegisteredAdapterKindSchema,
  sourceModule: z.string(),
  capabilities: z.array(z.string()),
  lifecycle: z.enum(["REGISTERED", "CONNECTED", "DEGRADED", "OFFLINE"]),
  executionBlocked: z.literal(true),
});

export type RegisteredAdapter = z.infer<typeof RegisteredAdapterSchema>;

export const RuntimeRegistrySnapshotSchema = z.object({
  totalAdapters: z.number(),
  byKind: z.record(z.number()),
  adapters: z.array(RegisteredAdapterSchema),
  agents: z.array(
    z.object({
      agentId: z.string(),
      module: z.string(),
      authorityLevel: z.string(),
    }),
  ),
});

export type RuntimeRegistrySnapshot = z.infer<typeof RuntimeRegistrySnapshotSchema>;
