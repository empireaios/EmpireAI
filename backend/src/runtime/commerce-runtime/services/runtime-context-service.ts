import { createHash, randomUUID } from "node:crypto";

import type { CreateRuntimeContextInput, RuntimeContext } from "../models/runtime-context.js";

export function createRuntimeContext(input: CreateRuntimeContextInput): RuntimeContext {
  const now = new Date().toISOString();
  return {
    contextId: randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    businessId: input.businessId,
    brandId: input.brandId,
    marketplaceId: input.marketplaceId,
    environment: input.environment ?? "SIMULATED",
    correlationId: input.correlationId ?? randomUUID(),
    executionTrace: [],
    soulTrace: [],
    createdAt: now,
  };
}

export function appendExecutionTrace(
  context: RuntimeContext,
  step: { kernel: string; action: string; status: "PLANNED" | "BLOCKED" | "SKIPPED"; detail?: string },
): RuntimeContext {
  return {
    ...context,
    executionTrace: [
      ...context.executionTrace,
      {
        stepId: randomUUID(),
        kernel: step.kernel,
        action: step.action,
        status: step.status,
        detail: step.detail,
        recordedAt: new Date().toISOString(),
      },
    ],
  };
}

export function appendSoulTrace(
  context: RuntimeContext,
  entry: { memoryKey: string; captured: boolean; detail?: string },
): RuntimeContext {
  return {
    ...context,
    soulTrace: [...context.soulTrace, entry],
  };
}

export function hashRuntimeContext(context: RuntimeContext): string {
  return createHash("sha256").update(JSON.stringify(context)).digest("hex").slice(0, 16);
}
