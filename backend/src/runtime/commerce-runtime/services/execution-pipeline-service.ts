import { randomUUID } from "node:crypto";

import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";
import {
  OPERATION_KERNEL_MAP,
  type RuntimeExecutionRequest,
  RuntimeExecutionRequestSchema,
  type RuntimeKernel,
  type RuntimeOperation,
} from "../models/execution-request.js";
import { appendExecutionTrace, createRuntimeContext } from "./runtime-context-service.js";

export type PipelineResult = {
  request: RuntimeExecutionRequest;
  contextId: string;
  routedKernel: RuntimeKernel;
  normalized: true;
  executionBlocked: typeof COMMERCE_RUNTIME_EXECUTION_BLOCKED;
  message: string;
};

export function normalizeExecutionRequest(input: {
  workspaceId: string;
  companyId: string;
  operation: RuntimeOperation;
  businessId?: string;
  productId?: string;
  marketplaceId?: string;
  supplierId?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
}): PipelineResult {
  const kernel = OPERATION_KERNEL_MAP[input.operation];
  const request = RuntimeExecutionRequestSchema.parse({
    requestId: randomUUID(),
    operation: input.operation,
    kernel,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    businessId: input.businessId,
    productId: input.productId,
    marketplaceId: input.marketplaceId,
    supplierId: input.supplierId,
    payload: input.payload ?? {},
    correlationId: input.correlationId ?? randomUUID(),
    requestedAt: new Date().toISOString(),
  });

  let context = createRuntimeContext({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    businessId: input.businessId,
    marketplaceId: input.marketplaceId,
    correlationId: request.correlationId,
    environment: "SIMULATED",
  });

  context = appendExecutionTrace(context, {
    kernel,
    action: input.operation,
    status: "BLOCKED",
    detail: "CRT-001 planning-only — execution blocked",
  });

  return {
    request,
    contextId: context.contextId,
    routedKernel: kernel,
    normalized: true,
    executionBlocked: COMMERCE_RUNTIME_EXECUTION_BLOCKED,
    message: `Request normalized and routed to ${kernel} kernel — execution blocked (CRT-001)`,
  };
}

export function listSupportedKernels(): RuntimeKernel[] {
  return [
    "marketplace",
    "supplier",
    "payment",
    "advertising",
    "logistics",
    "customer_service",
    "analytics",
    "agent",
  ];
}
