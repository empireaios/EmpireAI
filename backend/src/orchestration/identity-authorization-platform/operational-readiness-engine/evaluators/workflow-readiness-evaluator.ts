/**
 * G8-06 — Workflow and automation readiness evaluators.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { ReadinessLevel } from "../contracts/readiness-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import { REG_AUTOMATION_WORKFLOW } from "../../../../registry/types/registry-ids.js";
import type { AutomationWorkflowRow } from "../../../../registry/types/automation-registry-types.js";
import { resolveRequiredProvidersForContext } from "../registry/readiness-policy-resolver.js";
import { evaluateAllProviderReadiness } from "./provider-readiness-evaluator.js";

function evaluateExecutionReadiness(input: {
  workspaceId: string;
  executionId: string;
  readinessContext: "workflow" | "automation";
  context?: RegistryLoaderContext;
}) {
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const loader = getRegistryLoader();
  const workflows = loader.resolve(ctx, REG_AUTOMATION_WORKFLOW).rows as AutomationWorkflowRow[];
  const workflow = workflows.find((w) => w.id === input.executionId);
  const required = resolveRequiredProvidersForContext(input.readinessContext, ctx);
  const states = evaluateAllProviderReadiness(input.workspaceId, required, ctx);
  const blockers = states.filter((s) => !s.connected || s.expired || s.missingCredential);

  let level: ReadinessLevel = "unknown";
  if (!workflow && input.executionId !== "unknown") level = "not_ready";
  else if (blockers.length === 0 && states.some((s) => s.connected)) level = "ready";
  else if (blockers.some((b) => b.expired)) level = "blocked";
  else if (blockers.length > 0) level = "not_ready";
  else level = "partially_ready";

  const canExecute = level === "ready" || level === "partially_ready";
  const missingConnection = blockers[0]?.providerId ?? null;

  return {
    executionId: input.executionId,
    workflowFound: Boolean(workflow),
    canExecute,
    missingConnection,
    blockingAuthorization: blockers.find((b) => b.missingCredential || b.missingPermissions)?.providerId ?? null,
    nextAction: blockers[0]?.missingCredential
      ? "submit_credentials"
      : blockers[0]?.missingPermissions
        ? "grant_permissions"
        : blockers[0]?.expired
          ? "reconnect"
          : canExecute
            ? "none"
            : "start_authorization",
    states,
    required,
    level,
    score: required.length === 0 ? 0 : Math.round(((required.length - blockers.length) / required.length) * 100),
  };
}

export function evaluateWorkflowReadiness(input: {
  workspaceId: string;
  workflowId: string;
  context?: RegistryLoaderContext;
}) {
  return evaluateExecutionReadiness({
    workspaceId: input.workspaceId,
    executionId: input.workflowId,
    readinessContext: "workflow",
    context: input.context,
  });
}

export function evaluateAutomationReadiness(input: {
  workspaceId: string;
  automationId: string;
  context?: RegistryLoaderContext;
}) {
  return evaluateExecutionReadiness({
    workspaceId: input.workspaceId,
    executionId: input.automationId,
    readinessContext: "automation",
    context: input.context,
  });
}
