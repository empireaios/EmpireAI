/** T3-01 — Structured frontend code change generation. */

import type { ApprovedRecommendation } from "./ux-recommendation-interpreter.js";
import type { CodeGenerationScope, ProposedCodeChange } from "./types.js";
import { BuildMetadataGenerator } from "./build-metadata-generator.js";
import { appendBuildLog } from "./build-logging.js";

export class CodeChangeGenerator {
  private readonly metadata = new BuildMetadataGenerator();

  generate(
    recommendation: ApprovedRecommendation,
    targetFiles: string[],
    scope: CodeGenerationScope,
    designConstraints: string[],
    executiveConstraints: string[],
  ): ProposedCodeChange[] {
    appendBuildLog({
      event: "code_generation",
      level: "info",
      details: `Generating changes for ${recommendation.recommendationId}`,
    });

    const changes: ProposedCodeChange[] = [];

    for (const targetFile of targetFiles) {
      changes.push({
        changeId: this.metadata.buildChangeId(scope),
        targetFile,
        changeType: "modify",
        scope,
        description: recommendation.recommendationDescription,
        suggestedSnippet: this.buildSnippet(
          recommendation,
          scope,
          designConstraints,
          executiveConstraints,
        ),
        preservesArchitecture: true,
      });
    }

    if (changes.length === 0) {
      changes.push({
        changeId: this.metadata.buildChangeId(scope),
        targetFile: "empireai-web/components/cockpit/development/DevelopmentPillowExperience.tsx",
        changeType: "modify",
        scope,
        description: recommendation.recommendationDescription,
        suggestedSnippet: this.buildSnippet(
          recommendation,
          scope,
          designConstraints,
          executiveConstraints,
        ),
        preservesArchitecture: true,
      });
    }

    return changes;
  }

  private buildSnippet(
    recommendation: ApprovedRecommendation,
    scope: CodeGenerationScope,
    designConstraints: string[],
    executiveConstraints: string[],
  ): string {
    const constraintNote = [
      designConstraints[0] ?? "",
      executiveConstraints[0] ?? "",
    ]
      .filter(Boolean)
      .join(" · ");

    return [
      `// T3-01 Frontend Builder — ${recommendation.recommendationTitle}`,
      `// Scope: ${scope}`,
      `// Recommendation: ${recommendation.recommendationId}`,
      `// ${constraintNote}`,
      `{/* Implement: ${recommendation.recommendationDescription.slice(0, 120)} */}`,
      `<Panel title="${recommendation.recommendationTitle.replace(/"/g, "'")}">`,
      `  <p className="text-sm text-muted-foreground">${recommendation.expectedUxBenefit.replace(/"/g, "'")}</p>`,
      `</Panel>`,
    ].join("\n");
  }
}
