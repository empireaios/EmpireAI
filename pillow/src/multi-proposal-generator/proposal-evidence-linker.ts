/** T4-04 — Links proposals to T2 UX intelligence findings. */

import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import { appendProposalLog } from "./proposal-logging.js";

export class ProposalEvidenceLinker {
  link(input: {
    config: MultiProposalGeneratorConfiguration;
    recommendationEngine: RecommendationEngine | null;
    componentIds: string[];
    layoutRegionIds: string[];
  }): { linkedUxFindingIds: string[]; confidence: number } {
    appendProposalLog({
      event: "ux_finding_linkage",
      level: "info",
      details: "Linking proposals to UX findings",
    });

    const linked: string[] = [];
    if (!input.config.uxFindingLinkageRulesEnabled || !input.recommendationEngine) {
      return { linkedUxFindingIds: linked, confidence: 0.3 };
    }

    try {
      const report = input.recommendationEngine.getLatestReport?.() ?? null;
      const proposals = report?.record?.proposals ?? [];
      for (const p of proposals.slice(0, 8)) {
        if (p.recommendationId) linked.push(p.recommendationId);
        for (const id of p.sourceFindingIds ?? []) {
          if (id) linked.push(id);
        }
      }
      appendProposalLog({
        event: "ux_finding_linkage",
        level: "info",
        details: `Linked ${linked.length} UX finding(s)`,
      });
    } catch {
      appendProposalLog({
        event: "ux_finding_linkage",
        level: "warn",
        details: "UX intelligence data unavailable",
      });
    }

    return {
      linkedUxFindingIds: [...new Set(linked)],
      confidence: linked.length > 0 ? 0.75 : 0.4,
    };
  }
}
