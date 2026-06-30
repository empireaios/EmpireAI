import { z } from "zod";

/** SUP-014 — Fulfillment handoff preparation (no live execution without credentials). */
export const FULFILLMENT_HANDOFF_STAGES = [
  "CUSTOMER_ORDER_RECEIVED",
  "SUPPLIER_ORDER_PREPARED",
  "FOUNDER_APPROVAL_REQUIRED",
  "SUPPLIER_ORDER_SUBMITTED",
  "TRACKING_SYNCED",
  "OFD_MILESTONE_COMPLETE",
] as const;

export const fulfillmentHandoffSchema = z.object({
  handoffId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  customerOrderId: z.string().optional(),
  pipelineId: z.string().optional(),
  providerId: z.string(),
  supplierProductId: z.string(),
  stage: z.enum(FULFILLMENT_HANDOFF_STAGES),
  liveExecutionAllowed: z.boolean(),
  blockers: z.array(z.string()),
  ofdMilestone: z.string().optional(),
  preparedAt: z.string().datetime({ offset: true }),
});

export type FulfillmentHandoff = z.infer<typeof fulfillmentHandoffSchema>;
