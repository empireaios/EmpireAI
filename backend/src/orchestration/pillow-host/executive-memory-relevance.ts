/**
 * Memory relevance contract — retrieved lessons inform reasoning;
 * they must not autonomously append lesson prose to visible answers.
 *
 * Distinctions (not equivalent):
 * LESSON_RETRIEVED | LESSON_RELEVANT_TO_CURRENT_TASK |
 * LESSON_APPLIED_TO_REASONING | LESSON_VISIBLE_TEXT_REQUIRED
 *
 * Default: LESSON_VISIBLE_TEXT_REQUIRED=NO.
 */

import {
  packEstablishesOccurrenceThenLaterReversal,
  packSuppliesOccurrenceInvalidation,
  answerErasesHistoricalOccurrence,
  isSourceDomainLanguageLeak,
  userAsksOccurrenceVsEconomic,
} from "./executive-event-state.js";

export { userAsksOccurrenceVsEconomic } from "./executive-event-state.js";

export type MemoryRelevanceAssessment = {
  LESSON_RETRIEVED: boolean;
  LESSON_RELEVANT_TO_CURRENT_TASK: boolean;
  LESSON_APPLIED_TO_REASONING: boolean;
  LESSON_VISIBLE_TEXT_REQUIRED: boolean;
  ECONOMIC_REVERSAL_IN_PACK: boolean;
  OCCURRENCE_ERASURE_IN_ANSWER: boolean;
  USER_ASKS_OCCURRENCE_VS_ECONOMIC: boolean;
};

/** Generalized economic-occurrence doctrine prose (memory template, not domain-native). */
const UNMAPPED_ECONOMIC_DOCTRINE: RegExp[] = [
  /\n*A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred\.?/gi,
  /\n*A later refund after a service breach changes economic treatment; it does not by itself erase that the completed stays historically occurred\.?/gi,
  /\n*A later delivery credit or refund changes settlement; it does not by itself erase that the shipment was historically completed\.?/gi,
  /\n*A later credit or cancellation after activation changes billing treatment; it does not by itself erase that the activation historically occurred\.?/gi,
  /\n*Later compensation or reversal changes financial treatment; it does not by itself erase that the care episode historically occurred\.?/gi,
  /\n*A later return or credit changes economic treatment; it does not by itself erase that the completed units historically occurred\.?/gi,
  /\n*A later refund, return, chargeback, compensation, or SLA failure does not by itself prove an earlier verified event never occurred\.?/gi,
  /\n*Only evidence that invalidates the historical record \(fraud, void, never executed, erroneous duplicate\) may erase historical occurrence\.?/gi,
  /\n*Keep EVENT_OCCURRED distinct from ECONOMIC_OUTCOME\.[^\n]*/gi,
  /\n*Earlier analysis established historical occurrence; a later (?:refund|economic outcome) alone does not erase that occurrence\.?/gi,
  /\n*A later economic reversal changes settlement treatment; it does not by itself erase that the earlier verified event historically occurred\.?/gi,
  /\n*Recommendation:\s*Do not select on price alone: require a clear refund\/returns policy[^\n]*/gi,
  /\n*Net-after-refund conclusions need explicit gross, refund, and unit definitions from the pack\.[^\n]*/gi,
  /\n*\*\*Verdict:\*\*\s*Arithmetic requires stated operands[^\n]*/gi,
  /\n*\*\*Event-state reading:\*\*[^\n]*(?:\n(?!\n)[^\n]*)*/gi,
  /\n*Event-state reading:[^\n]*/gi,
];

export function assessOccurrenceLessonRelevance(
  userMessage: string,
  answer: string,
  lessonRetrieved = false,
): MemoryRelevanceAssessment {
  const economic = packEstablishesOccurrenceThenLaterReversal(userMessage);
  const erasure = answerErasesHistoricalOccurrence(answer);
  const asks = userAsksOccurrenceVsEconomic(userMessage);
  const relevant = economic && (erasure || asks || packSuppliesOccurrenceInvalidation(userMessage));
  const visibleRequired = relevant && (erasure || asks);
  return {
    LESSON_RETRIEVED: lessonRetrieved || economic,
    LESSON_RELEVANT_TO_CURRENT_TASK: relevant,
    LESSON_APPLIED_TO_REASONING: relevant,
    LESSON_VISIBLE_TEXT_REQUIRED: visibleRequired,
    ECONOMIC_REVERSAL_IN_PACK: economic,
    OCCURRENCE_ERASURE_IN_ANSWER: erasure,
    USER_ASKS_OCCURRENCE_VS_ECONOMIC: asks,
  };
}

/**
 * Strip unmapped economic-occurrence doctrine blocks when the current task
 * does not obligate that explanation.
 */
export function stripUnmappedVisibleDoctrine(
  answer: string,
  userMessage: string,
): { message: string; stripped: boolean; blocksRemoved: number } {
  const assessment = assessOccurrenceLessonRelevance(userMessage, answer);
  let out = String(answer || "");
  let blocksRemoved = 0;

  // Always strip Event-state / sales-history doctrine dumps.
  if (isSourceDomainLanguageLeak(out) || /\*\*Event-state reading:\*\*/i.test(out)) {
    for (const re of UNMAPPED_ECONOMIC_DOCTRINE) {
      const before = out;
      out = out.replace(re, "");
      if (out !== before) blocksRemoved += 1;
    }
  }

  // When the pack/task does not require visible occurrence↔economic doctrine, strip it.
  if (!assessment.LESSON_VISIBLE_TEXT_REQUIRED) {
    for (const re of UNMAPPED_ECONOMIC_DOCTRINE) {
      const before = out;
      out = out.replace(re, "");
      if (out !== before) blocksRemoved += 1;
    }
    // Broader catch for near-paraphrases of the Apex generic sentence when irrelevant.
    out = out.replace(
      /\n*[^\n]*later refund[^\n]*does not by itself erase[^\n]*historically occurred\.?/gi,
      "",
    );
    out = out.replace(
      /\n*[^\n]*refund, return, chargeback, compensation[^\n]*never occurred\.?/gi,
      "",
    );
    // Supplier refund-policy deliberation lead-in is latent unless supplier/price selection is asked.
    if (!/\b(?:supplier|cheapest|unit price|refund\s+policy|returns?\s+policy)\b/i.test(userMessage)) {
      out = out.replace(
        /\n*Recommendation:\s*Do not select on price alone:[^\n]*(?:\n(?!\n)[^\n]*)*/gi,
        "",
      );
      out = out.replace(
        /\n*\*\*Verdict:\*\*\s*Arithmetic requires stated operands[\s\S]*?(?=(?:\n#{1,3}\s)|\n\n|$)/gi,
        "\n",
      );
      out = out.replace(
        /\n*Net-after-refund conclusions need explicit gross[\s\S]*?(?=(?:\n#{1,3}\s)|\n\n|$)/gi,
        "\n",
      );
      out = out.replace(
        /\n*What can be concluded: perform only the arithmetic the pack supports[^\n]*/gi,
        "",
      );
      out = out.replace(
        /\n*\*\*Need:\*\*\s*the stated gross\/realised figure, refund quantity or amount[^\n]*/gi,
        "",
      );
      out = out.replace(
        /\n*the stated gross\/realised figure, refund quantity or amount[^\n]*/gi,
        "",
      );
    }
  }

  out = out.replace(/\n{3,}/g, "\n\n").trim();
  return { message: out, stripped: blocksRemoved > 0 || out !== String(answer || "").trim(), blocksRemoved };
}

/**
 * Final visible-block relevance gate.
 * Unmapped economic doctrine with no mapped obligation must not surface.
 */
export function validateVisibleBlockRelevance(
  answer: string,
  userMessage: string,
): { message: string; UNMAPPED_VISIBLE_DOCTRINE: number; POST_COMPLETION_UNREQUESTED_SEMANTIC_APPEND: number } {
  const before = String(answer || "");
  const { message, blocksRemoved } = stripUnmappedVisibleDoctrine(before, userMessage);
  const still =
    (!packEstablishesOccurrenceThenLaterReversal(userMessage) &&
      /later refund[^\n]{0,80}does not by itself erase/i.test(message)) ||
    /\*\*Event-state reading:\*\*/i.test(message)
      ? 1
      : 0;
  return {
    message,
    UNMAPPED_VISIBLE_DOCTRINE: still,
    POST_COMPLETION_UNREQUESTED_SEMANTIC_APPEND: blocksRemoved > 0 ? blocksRemoved : 0,
  };
}
