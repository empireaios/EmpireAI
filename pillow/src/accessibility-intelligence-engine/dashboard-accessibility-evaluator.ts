/** T2-06 — Dashboard accessibility evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";

export class DashboardAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(
    layout: LayoutModel | null,
    components: UiComponent[],
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    const hasDashboard =
      layout?.regions.some(
        (r) =>
          r.regionType === "chart_area" ||
          r.regionType === "table_area" ||
          r.regionType === "card_group",
      ) ?? false;
    const charts = components.filter((c) => c.componentType === "chart");
    const cards = components.filter((c) => c.componentType === "card" || c.componentType === "panel");

    if (!hasDashboard && charts.length === 0 && cards.length < 2) {
      return { findings, strengths };
    }

    const unlabeledCharts = charts.filter((c) => !c.label?.trim());
    if (unlabeledCharts.length > 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("dashboards"),
          findingCategory: "dashboards",
          findingDescription: `${unlabeledCharts.length} chart(s) missing accessible descriptions`,
          severity: "warning",
          affectedComponentId: unlabeledCharts[0]!.componentId,
          affectedLayoutRegionId: unlabeledCharts[0]!.sourceRegionId,
          affectedNavigationNodeId: null,
          evidenceMetadata: { chartCount: unlabeledCharts.length },
          detectionConfidence: 0.65,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (cards.length >= 2) {
      const unlabeledCards = cards.filter((c) => !c.label?.trim());
      if (unlabeledCards.length > cards.length / 2) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("readability"),
            findingCategory: "readability",
            findingDescription: "Dashboard cards lack headings for screen reader navigation",
            severity: "info",
            affectedComponentId: unlabeledCards[0]?.componentId ?? null,
            affectedLayoutRegionId: unlabeledCards[0]?.sourceRegionId ?? null,
            affectedNavigationNodeId: null,
            evidenceMetadata: { unlabeledCardCount: unlabeledCards.length },
            detectionConfidence: 0.6,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      } else {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "dashboards",
          description: "Dashboard cards include accessible headings",
          affectedComponentIds: cards.filter((c) => c.label?.trim()).map((c) => c.componentId),
          evidenceRef: layout?.metadata.layoutId ?? "dashboard",
          confidence: 0.65,
        });
      }
    }

    return { findings, strengths };
  }
}
