import { randomUUID } from "node:crypto";

import type { AutomationPlan, AutomationPlanInput, AutomationPlanStep } from "../models/automation-plan.js";
import { buildHumanActionQueue } from "./human-action-queue-service.js";
import { buildFounderJourney } from "./founder-journey-service.js";
import { computeInfrastructureReadiness, buildExpansionDependencyGraph } from "../../global-commerce-infrastructure/index.js";
import { rankGlobalOpportunities } from "../../global-commerce-intelligence/index.js";
import { getCountry } from "../../global-commerce/index.js";
import { getFounderAutomationRepository } from "../repositories/sqlite-founder-automation-repository.js";

const EMPIRE_AI_ACTIONS = [
  "Evaluate country infrastructure layers",
  "Score marketplace onboarding readiness",
  "Generate expansion intelligence report",
  "Build dependency graph for target marketplace",
  "Queue automatable onboarding steps",
  "Update global commerce identity readiness",
  "Record learning from infrastructure review",
  "Prepare launch readiness summary",
];

/** E-015 — Automation Planner. */
export function createAutomationPlan(
  workspaceId: string,
  companyId: string,
  input: AutomationPlanInput,
): AutomationPlan {
  const countryCode = input.targetCountryCode ?? (input.goal === "launch_globally" ? "SG" : "DE");
  const country = getCountry(countryCode);
  const queue = buildHumanActionQueue(workspaceId, companyId);
  const journey = buildFounderJourney(workspaceId, companyId);
  const readiness = computeInfrastructureReadiness(workspaceId, companyId, countryCode);
  const graph = buildExpansionDependencyGraph(workspaceId, companyId, countryCode);

  const humanActionsOnly: AutomationPlanStep[] = [];
  const empireAiActions: AutomationPlanStep[] = [];
  let stepOrder = 1;

  const relevantHuman = input.goal === "launch_globally"
    ? queue.tasks.filter((t) => t.priority === "CRITICAL" || t.priority === "HIGH").slice(0, 8)
    : queue.tasks.filter((t) => !t.countryCode || t.countryCode === countryCode).slice(0, 6);

  for (const task of relevantHuman) {
    humanActionsOnly.push({
      stepOrder: stepOrder++,
      stepType: "human_action",
      title: task.title,
      description: task.reason,
      estimatedMinutes: task.estimatedCompletionMinutes,
      countryCode: task.countryCode,
      providerId: task.providerId,
      automatable: false,
    });
  }

  const aiSteps = input.goal === "launch_globally" ? EMPIRE_AI_ACTIONS : EMPIRE_AI_ACTIONS.slice(0, 5);
  for (const action of aiSteps) {
    empireAiActions.push({
      stepOrder: stepOrder++,
      stepType: "empire_ai_action",
      title: action,
      description: `EmpireAI executes: ${action}`,
      estimatedMinutes: 5,
      countryCode,
      automatable: true,
    });
  }

  if (graph) {
    for (const node of graph.nodes.filter((n) => n.nodeType !== "ready")) {
      empireAiActions.push({
        stepOrder: stepOrder++,
        stepType: "dependency",
        title: `Resolve ${node.displayName}`,
        description: `Dependency graph node: ${node.status ?? "pending"}`,
        estimatedMinutes: node.nodeType === "marketplace" ? 15 : 10,
        countryCode,
        providerId: node.providerId,
        automatable: node.status === "COMPLETE",
      });
    }
  }

  if (input.goal === "launch_globally" && input.productCategory) {
    const ranking = rankGlobalOpportunities(workspaceId, companyId, {
      productCategory: input.productCategory,
      supplierAvailable: true,
      maxCountries: 5,
    });
    for (const c of ranking.rankedCountries.slice(0, 3)) {
      empireAiActions.push({
        stepOrder: stepOrder++,
        stepType: "milestone",
        title: `Plan launch sequence: ${c.displayName}`,
        description: c.why,
        estimatedMinutes: 10,
        countryCode: c.countryCode,
        automatable: true,
      });
    }
  }

  const dependencies = graph?.edges.map((e) => ({
    from: e.fromNodeId,
    to: e.toNodeId,
    reason: e.requirement ?? e.relationship,
  })) ?? [];

  const totalMinutes =
    humanActionsOnly.reduce((s, st) => s + st.estimatedMinutes, 0) +
    empireAiActions.reduce((s, st) => s + st.estimatedMinutes, 0);

  const goalLabel = input.goal === "launch_globally"
    ? "global launch"
    : input.goal === "expand_country"
      ? `expansion to ${country?.displayName ?? countryCode}`
      : `launch in ${country?.displayName ?? countryCode}`;

  const plan: AutomationPlan = {
    planId: randomUUID(),
    workspaceId,
    companyId,
    goal: input.goal,
    targetCountryCode: countryCode,
    productCategory: input.productCategory,
    humanActionsOnly,
    empireAiActions,
    dependencies,
    estimatedCompletionHours: Math.round((totalMinutes / 60) * 10) / 10,
    estimatedCompletionDays: Math.max(1, Math.ceil(totalMinutes / (60 * 4))),
    summary: `Automation plan for ${goalLabel}: ${humanActionsOnly.length} founder actions, ${empireAiActions.length} EmpireAI actions. Journey at ${journey.overallProgressPercent}%. Infrastructure ${readiness?.infrastructureScore ?? 0}%.`,
    computedAt: new Date().toISOString(),
  };

  getFounderAutomationRepository().savePlan(plan);
  return plan;
}

export function getLatestAutomationPlan(workspaceId: string, companyId: string): AutomationPlan | null {
  return getFounderAutomationRepository().getLatestPlan(workspaceId, companyId);
}
