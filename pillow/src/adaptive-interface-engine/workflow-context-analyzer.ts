/** T5-06 — Workflow context analysis from T5-05 evolution and T5-04 productivity. */

import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { DetectedContext } from "./context-detection-engine.js";
import type { RawAdaptationCandidate } from "./types.js";
import { appendAdaptiveLog } from "./adaptive-logging.js";

export class WorkflowContextAnalyzer {
  analyze(input: {
    context: DetectedContext;
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): RawAdaptationCandidate[] {
    const candidates: RawAdaptationCandidate[] = [];

    for (const evo of input.evolutionRecords) {
      if (
        evo.evolutionCategory === "workflow_simplification" ||
        evo.evolutionCategory === "task_reduction"
      ) {
        candidates.push({
          adaptationCategory: "adaptive_workflow_presentation",
          currentWorkflowContext: input.context.workflowContext,
          recommendedInterfaceAdaptations: [
            "Present simplified workflow steps for current context",
            "Collapse non-essential panels during active workflow",
          ],
          recommendedNavigationAdaptations: [
            "Highlight next workflow step in navigation",
          ],
          recommendedWorkspaceAdaptations: [
            "Organize workspace around current workflow stage",
          ],
          expectedProductivityBenefit: evo.estimatedProductivityBenefit,
          evidenceReferences: [...evo.evidenceReferences, `evolution:${evo.workflowEvolutionId}`],
          confidenceScore: evo.confidenceScore,
          impactScore: 0.78,
          sourceEngine: "PILLOW-WFE-001",
          sourceWorkflowEvolutionId: evo.workflowEvolutionId,
        });
      }
    }

    for (const prod of input.productivityRecords) {
      if (prod.productivityObservations.includes("workflow_pattern")) {
        candidates.push({
          adaptationCategory: "adaptive_operational_context",
          currentWorkflowContext: input.context.workflowContext,
          recommendedInterfaceAdaptations: [
            `Adapt interface to ${prod.workflowPatternSummary.slice(0, 60)}`,
          ],
          recommendedNavigationAdaptations: [
            "Align navigation with detected workflow pattern",
          ],
          recommendedWorkspaceAdaptations: [
            "Mirror workspace layout to recurring workflow pattern",
          ],
          expectedProductivityBenefit: "Improves context alignment and reduces re-orientation",
          evidenceReferences: [...prod.evidenceReferences, `productivity:${prod.productivityId}`],
          confidenceScore: prod.confidenceScore,
          impactScore: 0.72,
          sourceEngine: "PILLOW-PIE-001",
          sourceProductivityIntelligenceId: prod.productivityId,
        });
      }
    }

    if (input.context.operationalContext.includes("loading")) {
      candidates.push({
        adaptationCategory: "adaptive_productivity_optimization",
        currentWorkflowContext: input.context.workflowContext,
        recommendedInterfaceAdaptations: [
          "Show progress indicators during loading states",
          "Defer non-critical UI updates until loading completes",
        ],
        recommendedNavigationAdaptations: [],
        recommendedWorkspaceAdaptations: [
          "Preserve workspace state during loading transitions",
        ],
        expectedProductivityBenefit: "Maintains productivity during waiting periods",
        evidenceReferences: input.context.evidenceReferences,
        confidenceScore: input.context.confidenceScore,
        impactScore: 0.65,
        sourceEngine: "PILLOW-AIE-001",
      });
    }

    appendAdaptiveLog({
      event: "workflow_analysis",
      level: "info",
      details: `Analyzed ${candidates.length} workflow-context adaptations`,
    });

    return candidates;
  }
}
