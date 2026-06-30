import { createHash, randomUUID } from "node:crypto";

import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";
import type { CreateExecutionPlanInput, ExecutionPlan } from "../models/execution-plan.js";
import type { RuntimeOperation } from "../models/execution-request.js";
import { resolveCapabilities } from "./capability-resolver-service.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";

const PLAN_STEP_TEMPLATES: Record<RuntimeOperation, Array<{ kernel: string; action: string }>> = {
  publish_product: [
    { kernel: "marketplace", action: "validate_listing_readiness" },
    { kernel: "marketplace", action: "prepare_listing_payload" },
    { kernel: "marketplace", action: "publish_listing" },
    { kernel: "analytics", action: "record_listing_event" },
  ],
  sync_inventory: [
    { kernel: "supplier", action: "fetch_supplier_inventory" },
    { kernel: "marketplace", action: "push_inventory_update" },
  ],
  submit_supplier_order: [
    { kernel: "supplier", action: "validate_supplier_mapping" },
    { kernel: "supplier", action: "submit_order" },
    { kernel: "logistics", action: "await_fulfillment_signal" },
  ],
  capture_payment: [
    { kernel: "payment", action: "create_checkout_session" },
    { kernel: "payment", action: "await_webhook_confirmation" },
  ],
  launch_campaign: [
    { kernel: "advertising", action: "validate_creative_assets" },
    { kernel: "advertising", action: "create_campaign" },
  ],
  create_shipment: [
    { kernel: "logistics", action: "select_carrier" },
    { kernel: "logistics", action: "create_shipment_label" },
  ],
  handle_customer_message: [
    { kernel: "customer_service", action: "classify_message" },
    { kernel: "customer_service", action: "route_to_agent" },
  ],
  record_analytics_event: [
    { kernel: "analytics", action: "normalize_event" },
    { kernel: "analytics", action: "persist_event" },
  ],
  dispatch_agent_task: [
    { kernel: "agent", action: "assess_authority" },
    { kernel: "agent", action: "dispatch_brain_tool" },
  ],
};

function computePlanHash(input: CreateExecutionPlanInput, steps: ExecutionPlan["steps"]): string {
  const payload = JSON.stringify({ ...input, steps });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function createExecutionPlan(input: CreateExecutionPlanInput): ExecutionPlan {
  const resolution = resolveCapabilities(input.operation);
  const template = PLAN_STEP_TEMPLATES[input.operation];
  const preferredAdapter = resolution.entries.find((e) => e.supportLevel === "blocked" || e.supportLevel === "partial");

  const steps = template.map((step, index) => ({
    stepOrder: index + 1,
    kernel: step.kernel,
    adapterId: step.kernel === preferredAdapter?.kernel ? preferredAdapter.adapterId : undefined,
    action: step.action,
    status: "BLOCKED" as const,
    detail: COMMERCE_RUNTIME_EXECUTION_BLOCKED
      ? "CRT-001 planning-only — step blocked until COS adapter certification"
      : "Step planned",
  }));

  const plan: ExecutionPlan = {
    planId: randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    businessId: input.businessId,
    productId: input.productId,
    marketplaceId: input.marketplaceId,
    supplierId: input.supplierId,
    operation: input.operation,
    status: "BLOCKED",
    executionBlocked: true,
    steps,
    deterministicHash: computePlanHash(input, steps),
    createdAt: new Date().toISOString(),
  };

  getCommerceRuntimeRepository().savePlan(plan);
  return plan;
}

export function listPendingPlans(workspaceId: string, companyId: string): ExecutionPlan[] {
  return getCommerceRuntimeRepository().listPlans(workspaceId, companyId);
}
