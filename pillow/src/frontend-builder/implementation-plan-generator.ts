/** T3-01 — Implementation plan generation before code changes. */

import type { ApprovedRecommendation } from "./ux-recommendation-interpreter.js";
import type { CodeGenerationScope, ImplementationPlan } from "./types.js";
import { appendBuildLog } from "./build-logging.js";

export class ImplementationPlanGenerator {
  generate(
    recommendation: ApprovedRecommendation,
    targetFiles: string[],
    scope: CodeGenerationScope,
  ): ImplementationPlan {
    appendBuildLog({
      event: "implementation_plan_generation",
      level: "info",
      details: `Plan for ${recommendation.recommendationId} · ${targetFiles.length} files`,
    });

    const steps = [
      `Review approved recommendation: ${recommendation.recommendationTitle}`,
      `Scope: ${scope.replace(/_/g, " ")}`,
      `Target files: ${targetFiles.join(", ") || "derive from architecture analyzer"}`,
      "Apply design system constraints before modifying JSX structure",
      "Apply executive preference constraints to layout and density",
      "Generate minimal, focused code changes — no unrelated rewrites",
      "Run safety checks against protected files and allowed directories",
      "Validate build output before marking record as generated",
    ];

    if (recommendation.affectedComponents.length > 0) {
      steps.splice(3, 0, `Affected components: ${recommendation.affectedComponents.join(", ")}`);
    }

    return {
      planId: `fb-plan-${Math.random().toString(36).slice(2, 10)}`,
      steps,
      estimatedFilesAffected: targetFiles.length,
      avoidsDestructiveChanges: true,
    };
  }
}
