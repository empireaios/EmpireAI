import { validateExecutiveDraft } from './executive-release-gate.js';
import type { ExecutiveTruthSnapshot } from './executive-truth-types.js';
import type { RetrievalAttestation } from './executive-epistemic-grounding.js';

/** Prose has no execution or evidential authority. Heuristic findings qualify
 * the provider's text; they must not replace its commercial conclusion. */
export function preserveValidatedReasoningAnswer(answer: string, truth: ExecutiveTruthSnapshot, attestations: readonly RetrievalAttestation[] = []): string {
  if (!answer.trim()) throw new Error('ANSWER_INTEGRITY_REJECTED:EMPTY_ANSWER');
  const validation = validateExecutiveDraft(answer, truth, attestations);
  if (validation.ok) return answer;
  // This is a deterministic, separately attributed qualification, not invented
  // model reasoning or a claim that heuristic matches establish falsity.
  const receiptNames = [...new Set(attestations.map(a => a.capabilityId))];
  return '[Server provenance qualification: the following provider text is preserved verbatim as reasoning, not certified evidence or an execution receipt. Automated prose checks flagged possible unsupported claims (' + validation.violations.join(', ') + '). Only these retrievals are attested for this turn: ' + (receiptNames.join(', ') || 'none') + '. Current recorded state: Birth ' + truth.birth.status + '; realised orders ' + truth.financial.orders + '; realised revenue USD ' + truth.financial.realisedRevenueUsd + '. No external execution, authority change or Assurance override was performed. Statements in the provider text cannot supersede those records.]\n\n' + answer;
}

export const READ_ONLY_TASK_DISCIPLINE = 'Answer the actual owner question and each requested part. Free-text parsing is not an authoritative calculator or source. Use permitted read-only calculation/retrieval tools for checkable evidence. If an operand or source is missing, identify it without inventing it. Supplied scenarios are conditional premises, not live EmpireAI state or permission. A generated answer is never retrieved evidence. Explain conclusions, formulas and source limitations; do not expose private reasoning.';

