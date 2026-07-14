/** T2-06 — Modal and dialog accessibility evaluation. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding, AccessibilityStrength } from "./types.js";

export class ModalAccessibilityEvaluator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  evaluate(
    components: UiComponent[],
    layout: LayoutModel | null,
  ): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    const findings: AccessibilityFinding[] = [];
    const strengths: AccessibilityStrength[] = [];
    const now = new Date().toISOString();

    const modals = components.filter(
      (c) => c.componentType === "modal" || c.componentType === "dialog",
    );
    const modalRegions = layout?.regions.filter(
      (r) => r.regionType === "modal" || r.regionType === "dialog",
    ) ?? [];

    if (modals.length === 0 && modalRegions.length === 0) {
      return { findings, strengths };
    }

    for (const modal of modals) {
      if (!modal.label?.trim()) {
        findings.push(
          this.metadata.enrichFinding({
            findingId: this.metadata.buildFindingId("modals_and_dialogs"),
            findingCategory: "modals_and_dialogs",
            findingDescription: `${modal.componentType} missing accessible title or label`,
            severity: "warning",
            affectedComponentId: modal.componentId,
            affectedLayoutRegionId: modal.sourceRegionId,
            affectedNavigationNodeId: null,
            evidenceMetadata: { componentType: modal.componentType },
            detectionConfidence: 0.75,
            timestamp: now,
            metadataVersion: "1.0.0",
          }),
        );
      } else {
        strengths.push({
          strengthId: this.metadata.buildStrengthId(),
          category: "modals_and_dialogs",
          description: `${modal.componentType} has accessible label`,
          affectedComponentIds: [modal.componentId],
          evidenceRef: modal.componentId,
          confidence: 0.7,
        });
      }
    }

    const overlays = layout?.stackingOrder.filter(
      (s) => s.layer === "modal" || s.layer === "overlay",
    ) ?? [];
    if (overlays.length > 0 && modals.length === 0) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("modals_and_dialogs"),
          findingCategory: "modals_and_dialogs",
          findingDescription: "Overlay layer detected without identified modal component",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: modalRegions[0]?.regionId ?? null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { overlayCount: overlays.length },
          detectionConfidence: 0.55,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    return { findings, strengths };
  }
}
