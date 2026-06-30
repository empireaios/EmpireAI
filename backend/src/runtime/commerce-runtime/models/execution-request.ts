import { z } from "zod";

export const RuntimeKernelSchema = z.enum([
  "marketplace",
  "supplier",
  "payment",
  "advertising",
  "logistics",
  "customer_service",
  "analytics",
  "agent",
]);

export type RuntimeKernel = z.infer<typeof RuntimeKernelSchema>;

export const RuntimeOperationSchema = z.enum([
  "publish_product",
  "sync_inventory",
  "submit_supplier_order",
  "capture_payment",
  "launch_campaign",
  "create_shipment",
  "handle_customer_message",
  "record_analytics_event",
  "dispatch_agent_task",
]);

export type RuntimeOperation = z.infer<typeof RuntimeOperationSchema>;

export const RuntimeExecutionRequestSchema = z.object({
  requestId: z.string(),
  operation: RuntimeOperationSchema,
  kernel: RuntimeKernelSchema,
  workspaceId: z.string(),
  companyId: z.string(),
  businessId: z.string().optional(),
  productId: z.string().optional(),
  marketplaceId: z.string().optional(),
  supplierId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  correlationId: z.string(),
  requestedAt: z.string(),
});

export type RuntimeExecutionRequest = z.infer<typeof RuntimeExecutionRequestSchema>;

/** Maps operations to primary kernel for pipeline routing. */
export const OPERATION_KERNEL_MAP: Record<RuntimeOperation, RuntimeKernel> = {
  publish_product: "marketplace",
  sync_inventory: "supplier",
  submit_supplier_order: "supplier",
  capture_payment: "payment",
  launch_campaign: "advertising",
  create_shipment: "logistics",
  handle_customer_message: "customer_service",
  record_analytics_event: "analytics",
  dispatch_agent_task: "agent",
};
