import type { AutonomousOptimisationReport, ContinuousEvolutionDeps, OptimisationPlan } from "./types.js";

export function planAutonomousOptimisation(deps: ContinuousEvolutionDeps): AutonomousOptimisationReport {
  const plans: OptimisationPlan[] = [];
  const health = deps.intelligence.health.score;
  const infra = deps.infrastructureCommander.getLastSnapshot();

  plans.push({
    domain: "engineering",
    action: health >= 75
      ? "Dispatch approved Cursor Bridge missions for improvement backlog items"
      : "Prepare Technical Chief diagnosis mission for Grand King approval",
    autonomous: false,
    requiresApproval: true,
    expectedBenefit: "Reduce architecture debt and improve maintainability",
  });

  plans.push({
    domain: "infrastructure",
    action: infra
      ? "Use cached infrastructure scan results in executive reports"
      : "Schedule Infrastructure Commander scan (read-only, autonomous)",
    autonomous: !infra,
    requiresApproval: false,
    expectedBenefit: "Prevent probe storms while maintaining platform visibility",
  });

  plans.push({
    domain: "commerce",
    action: "Re-run Commerce Intelligence analysis with latest catalog scores",
    autonomous: true,
    requiresApproval: false,
    expectedBenefit: "Keep winning product rankings current",
  });

  plans.push({
    domain: "operations",
    action: "Refresh orchestrator subsystem discovery on each evolution cycle",
    autonomous: true,
    requiresApproval: false,
    expectedBenefit: "Accurate runtime awareness for scheduling decisions",
  });

  if (deps.orchestrator) {
    deps.orchestrator.getRuntimeAwareness();
  }

  return {
    plans,
    autonomousCount: plans.filter((p) => p.autonomous).length,
    approvalRequiredCount: plans.filter((p) => p.requiresApproval).length,
  };
}
