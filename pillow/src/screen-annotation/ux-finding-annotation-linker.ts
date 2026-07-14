/** T4-03 — Links annotations to T2 UX intelligence findings. */

import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { ScreenAnnotationConfiguration } from "./configuration.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export class UxFindingAnnotationLinker {
  link(input: {
    componentIds: string[];
    layoutRegionIds: string[];
    config: ScreenAnnotationConfiguration;
    recommendationEngine: RecommendationEngine | null;
  }): { linkedUxFindingIds: string[]; confidence: number } {
    appendAnnotationLog({
      event: "ux_finding_linkage",
      level: "info",
      details: "Linking annotation to UX findings",
    });

    const linked: string[] = [];
    let confidence = 0.35;

    if (!input.config.uxFindingLinkageRulesEnabled || !input.recommendationEngine) {
      return { linkedUxFindingIds: linked, confidence };
    }

    try {
      const report = input.recommendationEngine.getLatestReport?.() ?? null;
      const proposals =
        (report as { record?: { proposals?: Array<{ recommendationId?: string; targetComponentIds?: string[]; targetRegionIds?: string[] }> } })
          ?.record?.proposals ?? [];

      for (const proposal of proposals.slice(0, 10)) {
        if (!proposal.recommendationId) continue;
        const componentMatch = (proposal.targetComponentIds ?? []).some((id) =>
          input.componentIds.includes(id),
        );
        const regionMatch = (proposal.targetRegionIds ?? []).some((id) =>
          input.layoutRegionIds.includes(id),
        );
        if (componentMatch || regionMatch || linked.length < 3) {
          linked.push(proposal.recommendationId);
        }
      }

      if (linked.length > 0) confidence = 0.75;
      appendAnnotationLog({
        event: "ux_finding_linkage",
        level: "info",
        details: `Linked ${linked.length} UX finding(s)`,
      });
    } catch {
      appendAnnotationLog({
        event: "ux_finding_linkage",
        level: "warn",
        details: "UX intelligence data unavailable",
      });
    }

    return { linkedUxFindingIds: [...new Set(linked)], confidence };
  }
}
