/** T2-06 — Accessibility Intelligence manager. */

import { appendAccessibilityLog } from "./accessibility-intelligence-logging.js";
import { AccessibilityReviewEngine } from "./accessibility-review-engine.js";
import { AccessibilityFindingGenerator } from "./accessibility-finding-generator.js";
import { AccessibilityValidator } from "./accessibility-validator.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";
import type { AccessibilityReviewRecord, AccessibilityReviewReport } from "./types.js";
import { ACCESSIBILITY_METADATA_VERSION } from "./paths.js";

export class AccessibilityIntelligenceManager {
  private readonly reviewEngine = new AccessibilityReviewEngine();
  private readonly findingGenerator = new AccessibilityFindingGenerator();
  private readonly validator = new AccessibilityValidator();
  private latestRecord: AccessibilityReviewRecord | null = null;

  runReview(input: {
    config: AccessibilityIntelligenceConfiguration;
    uiState: UiStateModel | null;
    recognition: ComponentRecognitionResult | null;
    layout: LayoutModel | null;
    navigation: NavigationGraph | null;
    events: InteractionEvent[];
    context: WorkflowContextModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
  }): AccessibilityReviewReport {
    const started = Date.now();

    appendAccessibilityLog({
      event: "accessibility_review_start",
      level: "info",
      details: "Starting accessibility review",
    });

    const components = input.recognition?.components ?? [];
    const { findings, strengths } = this.reviewEngine.review({
      uiState: input.uiState,
      components,
      layout: input.layout,
      navigation: input.navigation,
      events: input.events,
      context: input.context,
      workflowOptimization: input.workflowOptimization,
      config: input.config,
    });

    for (const finding of findings) {
      appendAccessibilityLog({
        event: "accessibility_finding",
        level: finding.severity === "error" ? "error" : "warn",
        details: `${finding.findingCategory}: ${finding.findingDescription}`,
      });
    }

    const record = this.findingGenerator.build({
      uiState: input.uiState,
      recognition: input.recognition,
      layout: input.layout,
      navigation: input.navigation,
      context: input.context,
      workflowOptimization: input.workflowOptimization,
      findings,
      strengths,
    });

    const validation = this.validator.validate(record, input.config.validationRulesEnabled);
    this.latestRecord = record;

    const report: AccessibilityReviewReport = {
      reviewReportId: `aii-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reviewTimestamp: new Date().toISOString(),
      record,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ACCESSIBILITY_METADATA_VERSION,
    };

    appendAccessibilityLog({
      event: "accessibility_review_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Review ${validation.decision.toUpperCase()} · ${findings.length} findings · ${strengths.length} strengths · ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestRecord(): AccessibilityReviewRecord | null {
    return this.latestRecord;
  }

  reset(): void {
    this.latestRecord = null;
  }
}
