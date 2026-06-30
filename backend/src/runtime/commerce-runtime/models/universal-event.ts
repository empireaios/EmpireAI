import { z } from "zod";

import { RuntimeEnvironmentSchema } from "./runtime-context.js";

export const UniversalEventTypeSchema = z.enum([
  "BusinessCreated",
  "ProductApproved",
  "ListingPublished",
  "InventoryChanged",
  "OrderPlaced",
  "PaymentSucceeded",
  "ShipmentCreated",
  "ShipmentDelivered",
  "RefundCreated",
  "CampaignStarted",
  "CampaignStopped",
  "CustomerReturned",
  "ConnectorOffline",
  "GovernanceBlocked",
  "RuntimePlanCreated",
  "RuntimeExecutionBlocked",
]);

export type UniversalEventType = z.infer<typeof UniversalEventTypeSchema>;

export const UniversalEventLifecycleSchema = z.enum([
  "RECEIVED",
  "VERIFIED",
  "PROCESSED",
  "ARCHIVED",
  "DEAD_LETTER",
]);

export type UniversalEventLifecycle = z.infer<typeof UniversalEventLifecycleSchema>;

export const UniversalEventEnvelopeSchema = z.object({
  eventId: z.string(),
  eventType: UniversalEventTypeSchema,
  workspaceId: z.string(),
  companyId: z.string(),
  source: z.object({
    adapterId: z.string(),
    providerEventId: z.string().optional(),
  }),
  entityRefs: z.array(z.object({ type: z.string(), id: z.string() })),
  payload: z.record(z.unknown()),
  occurredAt: z.string(),
  recordedAt: z.string(),
  verification: RuntimeEnvironmentSchema,
  correlationId: z.string().optional(),
  lifecycle: UniversalEventLifecycleSchema.default("RECEIVED"),
});

export type UniversalEventEnvelope = z.infer<typeof UniversalEventEnvelopeSchema>;
