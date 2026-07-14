/** T2-04 — Evaluation metadata generation. */

import { EVALUATION_METADATA_VERSION } from "./paths.js";
import type { LayoutEvaluationModel } from "./types.js";

export class EvaluationMetadataGenerator {
  buildEvaluationId(): string {
    return `lev-eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildFindingId(category: string): string {
    return `finding-${category}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildDeviationId(): string {
    return `lev-dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  enrichModel(model: LayoutEvaluationModel): LayoutEvaluationModel {
    return { ...model, metadataVersion: EVALUATION_METADATA_VERSION };
  }

  validateModel(model: LayoutEvaluationModel): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!model.evaluationId) errors.push("Missing evaluationId");
    if (!model.metadataVersion) errors.push("Missing metadataVersion");
    return { valid: errors.length === 0, errors };
  }
}
