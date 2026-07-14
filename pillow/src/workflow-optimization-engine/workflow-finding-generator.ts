/** T2-05 — Workflow finding record generation. */

import { WORKFLOW_METADATA_VERSION } from "./paths.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type {
  FrictionSeverity,
  WorkflowFrictionPoint,
  WorkflowOptimizationRecord,
  WorkflowStrength,
} from "./types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";

export class WorkflowFindingGenerator {
  private readonly metadata = new WorkflowMetadataGenerator();

  build(input: {
    context: WorkflowContextModel | null;
    events: InteractionEvent[];
    navigation: NavigationGraph | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    friction: WorkflowFrictionPoint[];
    strengths: WorkflowStrength[];
  }): WorkflowOptimizationRecord {
    const affectedScreens = [
      ...new Set([
        ...input.friction.flatMap((f) => f.affectedScreens),
        ...input.strengths.flatMap((s) => s.affectedScreens),
        input.context?.currentScreenId,
        input.layoutEvaluation?.screenId,
      ].filter((s): s is string => !!s)),
    ];

    const affectedComponents = [
      ...new Set([
        ...input.friction.flatMap((f) => f.affectedComponents),
        ...(input.context?.activeComponentIds ?? []),
      ]),
    ];

    const affectedNavigationNodes = [
      ...new Set([
        ...input.friction.flatMap((f) => f.affectedNavigationNodes),
        input.context?.activeNavigationNodeId,
        input.navigation?.metadata.graphId,
      ].filter((n): n is string => !!n)),
    ];

    const severity = this.computeSeverity(input.friction);
    const confidenceValues = [
      ...input.friction.map((f) => f.confidence),
      ...input.strengths.map((s) => s.confidence),
      input.context?.confidence ?? 0,
    ].filter((c) => c > 0);

    const confidenceScore =
      confidenceValues.length > 0
        ? Math.round(
            (confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length) * 100,
          )
        : 0;

    const evidenceReferences = [
      input.context?.contextId,
      input.navigation?.metadata.graphId,
      input.layoutEvaluation?.evaluationId,
      ...input.events.map((e) => e.eventId).slice(0, 10),
      ...input.friction.map((f) => f.evidenceRef),
      ...input.strengths.map((s) => s.evidenceRef),
    ].filter((ref): ref is string => !!ref);

    return this.metadata.enrichRecord({
      optimizationRecordId: this.metadata.buildOptimizationRecordId(),
      timestamp: new Date().toISOString(),
      workflowId: input.context?.currentWorkflowName
        ? `workflow-${input.context.currentWorkflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
        : null,
      currentWorkflowName: input.context?.currentWorkflowName ?? null,
      currentWorkflowStage: input.context?.currentWorkflowStage ?? null,
      sourceWorkflowContextId: input.context?.contextId ?? null,
      sourceInteractionEventIds: input.events.map((e) => e.eventId),
      sourceNavigationGraphId: input.navigation?.metadata.graphId ?? null,
      sourceLayoutEvaluationId: input.layoutEvaluation?.evaluationId ?? null,
      detectedFrictionPoints: input.friction,
      detectedWorkflowStrengths: input.strengths,
      affectedScreens,
      affectedComponents,
      affectedNavigationNodes,
      evidenceReferences: [...new Set(evidenceReferences)],
      severity,
      confidenceScore,
      metadataVersion: WORKFLOW_METADATA_VERSION,
    });
  }

  private computeSeverity(friction: WorkflowFrictionPoint[]): FrictionSeverity {
    if (friction.some((f) => f.severity === "error")) return "error";
    if (friction.some((f) => f.severity === "warning")) return "warning";
    return "info";
  }
}
