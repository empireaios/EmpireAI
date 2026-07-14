/** T1-08 — Compare current state against historical memory. */

import { appendMemoryLog } from "./memory-logging.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { MemoryComparisonResult, VisualMemoryRecord } from "./types.js";

export class MemoryComparisonEngine {
  compare(
    record: VisualMemoryRecord,
    input: {
      navigationMapping: NavigationMappingEngine;
      layoutUnderstanding: LayoutUnderstandingEngine;
      componentRecognition: ComponentRecognitionEngine;
      interactionTracking: InteractionTrackingEngine;
    },
  ): MemoryComparisonResult {
    const graph = input.navigationMapping.getLatestGraph();
    const layout = input.layoutUnderstanding.getLatestLayout();
    const recognition = input.componentRecognition.getLatestResult();
    const events = input.interactionTracking.getRecentEvents(20);

    const screenChanged =
      record.screenId !== (graph?.metadata.currentScreenId ?? layout?.metadata.screenId ?? null);
    const layoutChanged = record.sourceLayoutId !== (layout?.metadata.layoutId ?? null);
    const navigationChanged =
      record.sourceNavigationGraphId !== (graph?.metadata.graphId ?? null);
    const componentCountDelta =
      (recognition?.components.length ?? 0) - record.relatedInteractionEventIds.length;
    const interactionCountDelta = events.length - record.relatedInteractionEventIds.length;

    const hasDifferences =
      screenChanged || layoutChanged || navigationChanged || componentCountDelta !== 0;

    const summaryParts: string[] = [];
    if (screenChanged) summaryParts.push("Screen changed");
    if (layoutChanged) summaryParts.push("Layout changed");
    if (navigationChanged) summaryParts.push("Navigation changed");
    if (componentCountDelta !== 0) summaryParts.push(`Component delta: ${componentCountDelta}`);
    if (interactionCountDelta !== 0) {
      summaryParts.push(`Interaction delta: ${interactionCountDelta}`);
    }

    const result: MemoryComparisonResult = {
      memoryRecordId: record.memoryRecordId,
      comparedAt: new Date().toISOString(),
      hasDifferences,
      screenChanged,
      layoutChanged,
      navigationChanged,
      componentCountDelta,
      interactionCountDelta,
      summary: hasDifferences ? summaryParts.join("; ") : "No significant differences",
    };

    appendMemoryLog({
      event: "memory_comparison",
      level: "info",
      details: `Compared ${record.memoryRecordId}: ${result.summary}`,
    });

    return result;
  }
}
