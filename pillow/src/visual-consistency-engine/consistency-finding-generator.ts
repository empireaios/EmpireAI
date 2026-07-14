/** T2-07 — Consistency finding record generation. */

import { CONSISTENCY_METADATA_VERSION } from "./paths.js";
import { ConsistencyMetadataGenerator } from "./consistency-metadata-generator.js";
import type {
  ConsistencyFinding,
  ConsistencyReviewRecord,
  ConsistencyStrength,
  FindingSeverity,
} from "./types.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";

export class ConsistencyFindingGenerator {
  private readonly metadata = new ConsistencyMetadataGenerator();

  build(input: {
    uiState: UiStateModel | null;
    recognition: ComponentRecognitionResult | null;
    layout: LayoutModel | null;
    navigation: NavigationGraph | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    accessibilityReview: AccessibilityReviewRecord | null;
    findings: ConsistencyFinding[];
    strengths: ConsistencyStrength[];
  }): ConsistencyReviewRecord {
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
      input.designSystem?.designSystemId,
      input.executiveStyle?.executiveStyleId,
      input.layoutEvaluation?.evaluationId,
      input.accessibilityReview?.accessibilityReviewId,
      ...input.findings.map((f) => f.findingId),
    ].filter((ref): ref is string => !!ref);

    return this.metadata.enrichRecord({
      consistencyReviewId: this.metadata.buildReviewId(),
      timestamp: new Date().toISOString(),
      screenId:
        input.uiState?.screen.screenId ??
        input.layout?.metadata.screenId ??
        input.navigation?.metadata.currentScreenId ??
        null,
      routeOrViewId:
        input.navigation?.metadata.currentRouteId ??
        input.navigation?.metadata.currentViewId ??
        null,
      sourceUiStateId: input.uiState?.metadata.stateId ?? null,
      sourceComponentSetId: input.recognition?.metadata.recognitionId ?? null,
      sourceLayoutId: input.layout?.metadata.layoutId ?? null,
      sourceNavigationGraphId: input.navigation?.metadata.graphId ?? null,
      sourceDesignSystemId: input.designSystem?.designSystemId ?? null,
      sourceExecutiveStyleId: input.executiveStyle?.executiveStyleId ?? null,
      sourceLayoutEvaluationId: input.layoutEvaluation?.evaluationId ?? null,
      sourceAccessibilityReviewId: input.accessibilityReview?.accessibilityReviewId ?? null,
      consistencyFindings: input.findings,
      consistencyStrengths: input.strengths,
      affectedComponents,
      affectedLayoutRegions,
      affectedNavigationNodes,
      evidenceReferences: [...new Set(evidenceReferences)],
      severity,
      confidenceScore,
      metadataVersion: CONSISTENCY_METADATA_VERSION,
    });
  }

  private computeSeverity(findings: ConsistencyFinding[]): FindingSeverity {
    if (findings.some((f) => f.severity === "error")) return "error";
    if (findings.some((f) => f.severity === "warning")) return "warning";
    return "info";
  }
}
