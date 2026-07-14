/** T5-07 — UX trend analysis from workflow and productivity intelligence. */

import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import { appendEvolutionLog } from "./cue-logging.js";
import type { RawEvolutionCandidate } from "./types.js";

export class UxTrendAnalyzer {
  analyze(input: {
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): RawEvolutionCandidate[] {
    const candidates: RawEvolutionCandidate[] = [];

    for (const wfe of input.evolutionRecords) {
      const improvements = wfe.recommendedWorkflowImprovements ?? [];
      if (!improvements.length) continue;
      candidates.push({
        evolutionCategory: "workflow_evolution",
        recommendedUxImprovements: improvements.map(
          (i) => `Evolve workflow UX: ${i}`,
        ),
        expectedUxBenefit: wfe.estimatedProductivityBenefit ?? "Improves workflow efficiency",
        evidenceReferences: [...wfe.evidenceReferences, `wfe:${wfe.workflowEvolutionId}`],
        confidenceScore: wfe.confidenceScore,
        impactScore: 0.78,
        sourceEngine: "PILLOW-WFE-001",
        sourceWorkflowEvolutionId: wfe.workflowEvolutionId,
      });
    }

    for (const pie of input.productivityRecords) {
      const patterns = pie.productivityObservations ?? [];
      if (!patterns.length && !pie.workflowPatternSummary) continue;
      candidates.push({
        evolutionCategory: "productivity_evolution",
        recommendedUxImprovements: [
          `Optimize UX for productivity pattern: ${patterns[0] ?? pie.workflowPatternSummary}`,
          "Streamline recurring task sequences in interface",
        ],
        expectedUxBenefit: pie.workflowPatternSummary || "Reduces friction in recurring workflows",
        evidenceReferences: [...pie.evidenceReferences, `pie:${pie.productivityId}`],
        confidenceScore: pie.confidenceScore,
        impactScore: 0.74,
        sourceEngine: "PILLOW-PIE-001",
        sourceProductivityIntelligenceId: pie.productivityId,
      });
    }

    appendEvolutionLog({
      event: "trend_analysis",
      level: "info",
      details: `Analyzed ${input.evolutionRecords.length} workflow + ${input.productivityRecords.length} productivity records`,
    });

    return candidates;
  }
}
