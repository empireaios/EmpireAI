import type { AutomationClassification, AutomationOpportunity, AutomationOpportunitySummary } from "../models/automation-opportunity.js";
import type { HumanActionTask } from "../models/human-action-queue.js";
import { buildHumanActionQueue } from "./human-action-queue-service.js";

function classifyTask(task: HumanActionTask): { classification: AutomationClassification; autoPct: number; saved: number; remaining: number; rationale: string } {
  switch (task.automationStatus) {
    case "FULLY_AUTOMATABLE":
      return { classification: "FULLY_AUTOMATABLE", autoPct: 95, saved: Math.round(task.estimatedCompletionMinutes * 0.95), remaining: Math.round(task.estimatedCompletionMinutes * 0.05), rationale: "EmpireAI can execute without founder input" };
    case "SEMI_AUTOMATABLE":
      return { classification: "SEMI_AUTOMATABLE", autoPct: 60, saved: Math.round(task.estimatedCompletionMinutes * 0.6), remaining: Math.round(task.estimatedCompletionMinutes * 0.4), rationale: "EmpireAI prepares; founder confirms" };
    case "BLOCKED":
      return { classification: "BLOCKED", autoPct: 0, saved: 0, remaining: task.estimatedCompletionMinutes, rationale: "Blocked pending prerequisite or certification" };
    case "COMPLETED":
      return { classification: "FULLY_AUTOMATABLE", autoPct: 100, saved: task.estimatedCompletionMinutes, remaining: 0, rationale: "Already completed" };
    default:
      return { classification: "HUMAN_REQUIRED", autoPct: 10, saved: Math.round(task.estimatedCompletionMinutes * 0.1), remaining: Math.round(task.estimatedCompletionMinutes * 0.9), rationale: "Requires founder decision or physical action" };
  }
}

/** E-013 — Automation Opportunity Engine. */
export function analyzeAutomationOpportunities(workspaceId: string, companyId: string): AutomationOpportunitySummary {
  const queue = buildHumanActionQueue(workspaceId, companyId);

  const opportunities: AutomationOpportunity[] = queue.tasks.map((task) => {
    const c = classifyTask(task);
    return {
      taskId: task.taskId,
      title: task.title,
      classification: c.classification,
      estimatedTimeSavedMinutes: c.saved,
      manualEffortRemainingMinutes: c.remaining,
      automationPercentage: c.autoPct,
      rationale: c.rationale,
    };
  });

  const fullyAutomatable = opportunities.filter((o) => o.classification === "FULLY_AUTOMATABLE").length;
  const semiAutomatable = opportunities.filter((o) => o.classification === "SEMI_AUTOMATABLE").length;
  const humanRequired = opportunities.filter((o) => o.classification === "HUMAN_REQUIRED").length;
  const blocked = opportunities.filter((o) => o.classification === "BLOCKED").length;

  const totalSaved = opportunities.reduce((s, o) => s + o.estimatedTimeSavedMinutes, 0);
  const totalRemaining = opportunities.reduce((s, o) => s + o.manualEffortRemainingMinutes, 0);
  const overallAutomationPercentage = opportunities.length
    ? Math.round(opportunities.reduce((s, o) => s + o.automationPercentage, 0) / opportunities.length)
    : 0;

  return {
    workspaceId,
    companyId,
    opportunities,
    totalTasks: opportunities.length,
    fullyAutomatable,
    semiAutomatable,
    humanRequired,
    blocked,
    overallAutomationPercentage,
    estimatedHoursSaved: Math.round((totalSaved / 60) * 10) / 10,
    manualHoursRemaining: Math.round((totalRemaining / 60) * 10) / 10,
    computedAt: new Date().toISOString(),
  };
}
