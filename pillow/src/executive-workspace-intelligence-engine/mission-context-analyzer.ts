/** T5-08 — Mission context analysis from workflow and productivity intelligence. */

import { appendWorkspaceLog } from "./ewi-logging.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { ExecutiveContext, RawWorkspaceCandidate } from "./types.js";

export class MissionContextAnalyzer {
  analyze(input: {
    context: ExecutiveContext;
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): RawWorkspaceCandidate[] {
    const candidates: RawWorkspaceCandidate[] = [];

    for (const wfe of input.evolutionRecords) {
      candidates.push({
        workspaceCategory: "mission_dashboard",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Mission command panel with workflow evolution summary",
          "Priority workflow improvements panel",
        ],
        recommendedWorkspaceConfiguration: [
          "Pin mission-critical workflow panels to primary workspace",
        ],
        recommendedWidgets: [
          "Workflow evolution status widget",
          "Mission priority tracker",
        ],
        recommendedShortcuts: [
          "Quick access to active mission workflow",
        ],
        expectedProductivityBenefit:
          wfe.estimatedProductivityBenefit ?? "Accelerates mission workflow execution",
        evidenceReferences: [...wfe.evidenceReferences, `wfe:${wfe.workflowEvolutionId}`],
        confidenceScore: wfe.confidenceScore,
        impactScore: 0.8,
        sourceEngine: "PILLOW-WFE-001",
        sourceWorkflowEvolutionId: wfe.workflowEvolutionId,
      });
    }

    for (const pie of input.productivityRecords) {
      candidates.push({
        workspaceCategory: "productivity_dashboard",
        activeMissionContext: input.context.activeMissionContext,
        executivePriorities: input.context.executivePriorities,
        recommendedDashboardLayout: [
          "Productivity intelligence summary panel",
          "Recurring pattern optimization panel",
        ],
        recommendedWorkspaceConfiguration: [
          "Organize workspace around detected productivity patterns",
        ],
        recommendedWidgets: [
          "Productivity pattern widget",
          "Task sequence optimizer",
        ],
        recommendedShortcuts: [
          "Jump to high-frequency workflow sequence",
        ],
        expectedProductivityBenefit:
          pie.workflowPatternSummary || "Reduces executive workflow friction",
        evidenceReferences: [...pie.evidenceReferences, `pie:${pie.productivityId}`],
        confidenceScore: pie.confidenceScore,
        impactScore: 0.76,
        sourceEngine: "PILLOW-PIE-001",
        sourceProductivityIntelligenceId: pie.productivityId,
      });
    }

    appendWorkspaceLog({
      event: "mission_analysis",
      level: "info",
      details: `Analyzed ${input.evolutionRecords.length} workflow + ${input.productivityRecords.length} productivity records`,
    });

    return candidates;
  }
}
