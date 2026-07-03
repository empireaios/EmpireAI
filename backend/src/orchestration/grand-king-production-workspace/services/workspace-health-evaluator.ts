/**
 * G7-01 — Workspace health evaluator.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { GrandKingProductionWorkspace, WorkspaceHealthSummary } from "../contracts/production-workspace-types.js";
import { evaluateWorkspaceReadiness } from "./workspace-readiness-integration.js";

export function evaluateWorkspaceHealth(
  workspace: GrandKingProductionWorkspace,
  context: RegistryLoaderContext = {},
): WorkspaceHealthSummary {
  const readiness = evaluateWorkspaceReadiness(context);
  const signals: string[] = [`workspace-status:${workspace.status}`];

  if (process.env.WORKSPACE_HEALTH_DEGRADED === "true") {
    return {
      score: 40,
      status: "degraded",
      healthy: false,
      signals: [...signals, "signal:degraded"],
      blockers: [{
        blockerId: "health-degraded",
        severity: "high",
        message: "Workspace health degraded by governance signal",
        recommendation: "Resolve WORKSPACE_HEALTH_DEGRADED signal",
      }],
    };
  }

  let score = 100;
  if (!readiness.ready) score -= 30;
  if (!readiness.productionEligible) score -= 20;
  if (workspace.status === "blocked") score = 0;
  if (workspace.status === "degraded") score = Math.min(score, 50);
  if (workspace.status === "paused" || workspace.status === "maintenance") score = Math.min(score, 70);

  const healthy = score >= 70 && workspace.status !== "blocked" && workspace.status !== "degraded";

  return {
    score,
    status: healthy ? workspace.status : workspace.status === "active" ? "degraded" : workspace.status,
    healthy,
    signals,
    blockers: readiness.conditions.map((condition, index) => ({
      blockerId: `readiness-${index}`,
      severity: "medium" as const,
      message: condition,
    })),
  };
}
