import { validateExecutiveDraft } from './executive-release-gate.js';
import type { ExecutiveTruthSnapshot } from './executive-truth-types.js';
import type { RetrievalAttestation } from './executive-epistemic-grounding.js';

/** A validator may reject an answer; heuristic prose parsers may not author a replacement. */
export function preserveValidatedReasoningAnswer(answer: string, truth: ExecutiveTruthSnapshot, attestations: readonly RetrievalAttestation[] = []): string {
  const validation = validateExecutiveDraft(answer, truth, attestations);
  if (!answer.trim() || !validation.ok) {
    throw new Error(`ANSWER_INTEGRITY_REJECTED:${validation.violations.join(',') || 'EMPTY_ANSWER'}`);
  }
  return answer;
}

export const READ_ONLY_TASK_DISCIPLINE = 'Answer the actual owner question and each requested part. Free-text parsing is not an authoritative calculator or source. Use permitted read-only calculation/retrieval tools for checkable evidence. If an operand or source is missing, identify it without inventing it. Supplied scenarios are conditional premises, not live EmpireAI state or permission. A generated answer is never retrieved evidence. Explain conclusions, formulas and source limitations; do not expose private reasoning.';

