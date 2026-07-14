/** T3-09 — UX rationale generation. */

import type { CollectedChangeSources } from "./change-source-collector.js";
import type { ChangeDocumentationConfiguration } from "./configuration.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";

export class UxRationaleGenerator {
  generate(sources: CollectedChangeSources, config: ChangeDocumentationConfiguration): string {
    if (!config.uxRationaleRulesEnabled) {
      return "UX rationale generation disabled";
    }

    appendChangeDocumentationLog({
      event: "ux_rationale_generation",
      level: "info",
      details: "Generating UX rationale",
    });

    const reasons: string[] = [];
    const frontend = sources.frontendBuild?.records[0];
    if (frontend?.sourceRecommendationId) {
      reasons.push(`Addresses recommendation ${frontend.sourceRecommendationId}`);
    }
    if (frontend?.sourceUxScoreId) {
      reasons.push(`Informed by UX score ${frontend.sourceUxScoreId}`);
    }
    const component = sources.componentGeneration?.records[0];
    if (component) {
      reasons.push(`Component ${component.componentName} generated for ${component.componentCategory}`);
    }
    const layout = sources.layoutRefactoring?.records[0];
    if (layout) {
      reasons.push(`Layout refactored for screen ${layout.targetScreenId}`);
    }
    const theme = sources.themeGeneration?.records[0];
    if (theme) {
      reasons.push(`Theme ${theme.themeName} applied for ${theme.themeScope} scope`);
    }

    return reasons.length > 0
      ? reasons.join("; ")
      : "Change driven by upstream UX intelligence pipeline";
  }
}
