/** T2-06 — Accessibility finding record generation. */

import { ACCESSIBILITY_METADATA_VERSION } from "./paths.js";
import { AccessibilityMetadataGenerator } from "./accessibility-metadata-generator.js";
import type {
  AccessibilityFinding,
  AccessibilityReviewRecord,
  AccessibilityStrength,
  FindingSeverity,
} from "./types.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";

export class AccessibilityFindingGenerator {
  private readonly metadata = new AccessibilityMetadataGenerator();

  build(input: {
    uiState: UiStateModel | null;
    recognition: ComponentRecognitionResult | null;
    layout: LayoutModel | null;
    navigation: NavigationGraph | null;
    context: WorkflowContextModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    findings: AccessibilityFinding[];
    strengths: AccessibilityStrength[];
  }): AccessibilityReviewRecord {
    const affectedComponents = [
      ...new Set([
        ...input.findings.map((f) => f.affectedComponentId).filter((c): c is string => !!c),
        ...input.strengths.flatMap((s) => s.affectedComponentIds),
      ]),
    ];

    const affectedLayoutRegions = [
      ...new Set(
        input.findings.map((f) => f.affectedLayoutRegionId).filter((r): r is string => !!r),
      ),
    ];

    const affectedNavigationNodes = [
      ...new Set(
        input.findings.map((f) => f.affectedNavigationNodeId).filter((n): n is string => !!n),
      ),
    ];

    const severity = this.computeSeverity(input.findings);
    const confidenceValues = [
      ...input.findings.map((f) => f.detectionConfidence),
      ...input.strengths.map((s) => s.confidence),
    ].filter((c) => c > 0);

    const confidenceScore =
      confidenceValues.length > 0
        ? Math.round(
            (confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length) * 100,
          )
        : 0;

    const evidenceReferences = [
      input.uiState?.metadata.stateId,
      input.recognition?.metadata.recognitionId,
      input.layout?.metadata.layoutId,
      input.navigation?.metadata.graphId,
      input.context?.contextId,
      input.workflowOptimization?.optimizationRecordId,
      ...input.findings.map((f) => f.findingId),
    ].filter((ref): ref is string => !!ref);

    return this.metadata.enrichRecord({
      accessibilityReviewId: this.metadata.buildReviewId(),
      timestamp: new Date().toISOString(),
      screenId:
        input.uiState?.screen.screenId ??
        input.layout?.metadata.screenId ??
        input.navigation?.metadata.currentScreenId ??
        null,
      routeOrViewId:
        input.navigation?.metadata.currentRouteId ??
        input.navigation?.metadata.currentViewId ??
        input.context?.currentRouteId ??
        null,
      sourceUiStateId: input.uiState?.metadata.stateId ?? null,
      sourceComponentSetId: input.recognition?.metadata.recognitionId ?? null,
      sourceLayoutId: input.layout?.metadata.layoutId ?? null,
      sourceNavigationGraphId: input.navigation?.metadata.graphId ?? null,
      sourceWorkflowContextId: input.context?.contextId ?? null,
      sourceWorkflowOptimizationId: input.workflowOptimization?.optimizationRecordId ?? null,
      accessibilityFindings: input.findings,
      accessibilityStrengths: input.strengths,
      affectedComponents,
      affectedLayoutRegions,
      affectedNavigationNodes,
      evidenceReferences: [...new Set(evidenceReferences)],
      severity,
      confidenceScore,
      metadataVersion: ACCESSIBILITY_METADATA_VERSION,
    });
  }

  private computeSeverity(findings: AccessibilityFinding[]): FindingSeverity {
    if (findings.some((f) => f.severity === "error")) return "error";
    if (findings.some((f) => f.severity === "warning")) return "warning";
    return "info";
  }
}
