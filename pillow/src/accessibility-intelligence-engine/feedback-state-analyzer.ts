/** T2-06 — Feedback state analysis. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type { AccessibilityFinding } from "./types.js";

export class FeedbackStateAnalyzer {
  private readonly metadata = new AccessibilityMetadataGenerator();

  analyze(
    events: InteractionEvent[],
    context: WorkflowContextModel | null,
    workflowOptimization: WorkflowOptimizationRecord | null,
  ): AccessibilityFinding[] {
    const findings: AccessibilityFinding[] = [];
    const now = new Date().toISOString();

    if (context?.waitingOrLoading) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("loading_states"),
          findingCategory: "loading_states",
          findingDescription: "Workflow in waiting/loading state — verify accessible progress indication",
          severity: "warning",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: context.activeNavigationNodeId,
          evidenceMetadata: { waitingOrLoading: true },
          detectionConfidence: context.confidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const alerts = events.filter(
      (e) =>
        e.sourceComponentId?.includes("alert") ||
        e.sourceComponentId?.includes("toast"),
    );
    if (alerts.length === 0 && context?.contextState === "submitting") {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("feedback_states"),
          findingCategory: "feedback_states",
          findingDescription: "Submit action without detected feedback confirmation",
          severity: "info",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { contextState: "submitting" },
          detectionConfidence: 0.55,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    const missingFeedback = workflowOptimization?.detectedFrictionPoints.find(
      (f) => f.category === "missing_feedback",
    );
    if (missingFeedback) {
      findings.push(
        this.metadata.enrichFinding({
          findingId: this.metadata.buildFindingId("feedback_states"),
          findingCategory: "feedback_states",
          findingDescription: "Workflow optimization detected missing user feedback",
          severity: "warning",
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          affectedNavigationNodeId: null,
          evidenceMetadata: { workflowFriction: missingFeedback.frictionId },
          detectionConfidence: missingFeedback.confidence,
          timestamp: now,
          metadataVersion: "1.0.0",
        }),
      );
    }

    return findings;
  }
}
