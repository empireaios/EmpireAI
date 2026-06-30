import type { FounderWorkloadDashboard } from "../models/founder-dashboard.js";
import { buildFounderJourney } from "./founder-journey-service.js";
import { buildHumanActionQueue } from "./human-action-queue-service.js";
import { analyzeAutomationOpportunities } from "./automation-opportunity-service.js";
import { computeInfrastructureReadiness } from "../../global-commerce-infrastructure/index.js";

/** E-014 — Founder Workload Dashboard. */
export function buildFounderWorkloadDashboard(workspaceId: string, companyId: string): FounderWorkloadDashboard {
  const journey = buildFounderJourney(workspaceId, companyId);
  const queue = buildHumanActionQueue(workspaceId, companyId);
  const automation = analyzeAutomationOpportunities(workspaceId, companyId);
  const sgReadiness = computeInfrastructureReadiness(workspaceId, companyId, "SG");

  const todaysTasks = queue.tasks.slice(0, 6).map((t) => ({
    taskId: t.taskId,
    title: t.title,
    priority: t.priority,
    blockingImpact: t.blockingImpact,
  }));

  const criticalTasks = queue.tasks
    .filter((t) => t.priority === "CRITICAL" || t.blockingImpact === "LAUNCH_BLOCKING")
    .slice(0, 5)
    .map((t) => ({ taskId: t.taskId, title: t.title, reason: t.reason }));

  const waitingForFounder = queue.tasks.filter(
    (t) => t.automationStatus === "HUMAN_REQUIRED" || t.automationStatus === "SEMI_AUTOMATABLE",
  ).length;

  const waitingForEmpireAI = queue.tasks.filter(
    (t) => t.automationStatus === "FULLY_AUTOMATABLE",
  ).length + journey.stages.reduce((s, st) => s + st.automatableActionsCount, 0);

  const launchPercent = Math.round(
    (journey.stages.find((s) => s.stageId === "launch_approval")?.progressPercent ?? 0) * 0.4 +
    (journey.stages.find((s) => s.stageId === "marketplace_readiness")?.progressPercent ?? 0) * 0.35 +
    (sgReadiness?.infrastructureScore ?? 0) * 0.25,
  );

  const currentStage = journey.stages.find((s) => s.stageId === journey.currentStageId);

  return {
    moduleId: "founder-automation",
    missionId: "E-011-E-015",
    todaysTasks,
    criticalTasks,
    waitingForFounder,
    waitingForEmpireAI,
    automationPercent: automation.overallAutomationPercentage,
    estimatedHoursSaved: automation.estimatedHoursSaved,
    launchReadiness: {
      percent: launchPercent,
      phase: sgReadiness?.readinessPhase ?? "IN_PROGRESS",
      blockers: sgReadiness?.criticalBlockers.length ?? 0,
    },
    currentJourneyStage: currentStage?.displayName ?? journey.currentStageId,
    journeyProgressPercent: journey.overallProgressPercent,
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisFounderAutomationPayload(workspaceId: string, companyId: string) {
  const dash = buildFounderWorkloadDashboard(workspaceId, companyId);
  return {
    module: "founder-automation",
    automationPercent: dash.automationPercent,
    waitingForFounder: dash.waitingForFounder,
    criticalTasks: dash.criticalTasks.length,
  };
}
