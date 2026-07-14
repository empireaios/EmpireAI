/** T2-05 — Interaction sequence analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";

export class InteractionSequenceAnalyzer {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(events: InteractionEvent[]): WorkflowFrictionPoint[] {
    const findings: WorkflowFrictionPoint[] = [];

    const scrollEvents = events.filter((e) => e.interactionType === "scroll");
    if (scrollEvents.length >= 5) {
      const totalDelta = scrollEvents.reduce(
        (sum, e) => sum + Math.abs(e.scroll?.distance ?? 0),
        0,
      );
      findings.push({
        frictionId: this.metadata.buildFrictionId("excessive_scrolling"),
        category: "excessive_scrolling",
        description: `${scrollEvents.length} scroll events (${totalDelta}px total) during workflow`,
        severity: scrollEvents.length >= 8 ? "warning" : "info",
        affectedScreens: [
          ...new Set(scrollEvents.map((e) => e.currentScreenId).filter(Boolean)),
        ] as string[],
        affectedComponents: [],
        affectedNavigationNodes: [],
        evidenceRef: "scroll-sequence",
        confidence: 0.7,
      });
    }

    const clicks = events.filter((e) => e.interactionType === "click");
    const secondaryClicks = clicks.filter((e) => !e.sourceComponentId?.includes("primary"));
    if (secondaryClicks.length > clicks.length * 0.6 && clicks.length >= 4) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("distracting_secondary_actions"),
        category: "distracting_secondary_actions",
        description: "Majority of clicks target secondary actions rather than primary workflow path",
        severity: "info",
        affectedScreens: [
          ...new Set(secondaryClicks.map((e) => e.currentScreenId).filter(Boolean)),
        ] as string[],
        affectedComponents: secondaryClicks
          .map((e) => e.sourceComponentId)
          .filter((c): c is string => !!c),
        affectedNavigationNodes: [],
        evidenceRef: "click-sequence",
        confidence: 0.55,
      });
    }

    return findings;
  }
}
