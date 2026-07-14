/** T2-01 — Component rule evaluator. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { UxRule } from "./types.js";

export type ComponentEvaluationOutcome = {
  passed: boolean;
  description: string;
  evidence: Record<string, unknown>;
  sourceUiStateId: string | null;
  sourceComponentId: string | null;
  affectedScreenId: string | null;
};

export class ComponentRuleEvaluator {
  evaluate(
    rule: UxRule,
    recognition: ComponentRecognitionResult | null,
  ): ComponentEvaluationOutcome {
    if (!recognition) {
      return {
        passed: false,
        description: "No component recognition data available for evaluation",
        evidence: { reason: "missing_component_data" },
        sourceUiStateId: null,
        sourceComponentId: null,
        affectedScreenId: null,
      };
    }

    const evaluator = rule.evaluationLogic.evaluator;
    const params = rule.evaluationLogic.parameters;
    const stateId = recognition.metadata.sourceStateId;
    const components = recognition.components;

    switch (evaluator) {
      case "component_min_count": {
        const minCount = Number(params.minCount ?? 1);
        return {
          passed: components.length >= minCount,
          description:
            components.length >= minCount
              ? `${components.length} components detected`
              : `Only ${components.length} components (minimum ${minCount})`,
          evidence: { componentCount: components.length, minCount },
          sourceUiStateId: stateId,
          sourceComponentId: components[0]?.componentId ?? null,
          affectedScreenId: null,
        };
      }

      case "component_has_labels": {
        const requiredTypes = (params.requiredTypes as string[]) ?? ["button", "link"];
        const targets = components.filter((c) =>
          requiredTypes.includes(c.componentType),
        );
        const unlabeled = targets.filter((c) => !c.label || c.label.trim() === "");
        return {
          passed: unlabeled.length === 0,
          description:
            unlabeled.length === 0
              ? `All ${targets.length} interactive components have labels`
              : `${unlabeled.length} interactive components missing labels`,
          evidence: {
            requiredTypes,
            unlabeledIds: unlabeled.map((c) => c.componentId),
          },
          sourceUiStateId: stateId,
          sourceComponentId: unlabeled[0]?.componentId ?? targets[0]?.componentId ?? null,
          affectedScreenId: null,
        };
      }

      case "component_min_confidence": {
        const minConfidence = Number(params.minConfidence ?? 0.3);
        const lowConfidence = components.filter(
          (c) => c.detectionConfidence < minConfidence,
        );
        return {
          passed: lowConfidence.length === 0,
          description:
            lowConfidence.length === 0
              ? `All components meet confidence threshold ${minConfidence}`
              : `${lowConfidence.length} components below confidence ${minConfidence}`,
          evidence: {
            minConfidence,
            lowConfidenceIds: lowConfidence.map((c) => c.componentId),
          },
          sourceUiStateId: stateId,
          sourceComponentId: lowConfidence[0]?.componentId ?? components[0]?.componentId ?? null,
          affectedScreenId: null,
        };
      }

      default:
        return {
          passed: true,
          description: `Unknown component evaluator '${evaluator}' — skipped`,
          evidence: { evaluator, skipped: true },
          sourceUiStateId: stateId,
          sourceComponentId: components[0]?.componentId ?? null,
          affectedScreenId: null,
        };
    }
  }
}
