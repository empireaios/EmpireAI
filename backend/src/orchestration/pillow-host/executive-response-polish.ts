/**
 * Single ownership for final-visible polish after release candidates are chosen.
 * Prevents coverage/protected-state layers from contradicting or spamming a completed answer.
 * Does not encode sealed examination content.
 */

import {
  assessTaskCoverage,
  parseExecutiveTaskContract,
  type ExecutiveTaskContract,
} from "./executive-task-contract.js";

const CANNOT_COMPLETE_APPENDIX =
  /(?:\n\n)?For\s+[“"][^”"]{0,120}[”"]:\s*I cannot complete that part from verified evidence this turn[^.]*\./gi;

const BIRTH_SENTENCE =
  /(?:^|\s)[^.?\n]*\bBirth\b[^.?\n]*(?:authoris|unauthorized|unauthorised|timestamp|Grand King)[^.?\n]*\./gi;

function materiallySatisfied(text: string, contract: ExecutiveTaskContract): boolean {
  const t = text.trim();
  if (!t) return false;
  const coverage = assessTaskCoverage(t, contract);
  if (coverage.silentlyDroppedTasks === 0) return true;
  if (t.length < 120) return false;
  if (coverage.completedTasks + coverage.partialTasks >= Math.ceil(contract.tasks.length / 2)) {
    return true;
  }
  if (
    t.length >= 160 &&
    coverage.completedTasks + coverage.partialTasks >= 1 &&
    (!contract.requiresRecommendation ||
      /\b(recommend|should|I would|decision|choose|prefer|better supported)\b/i.test(t))
  ) {
    return true;
  }
  if (
    contract.requiresConditionalReasoning &&
    t.length >= 120 &&
    /\b(under (?:the )?assumption|if (?:that|this)|scenario|would change|conditional)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Remove contradictory "cannot complete" appendices when the body already answered.
 */
export function stripContradictoryCoverageAppendix(
  message: string,
  contract: ExecutiveTaskContract,
): string {
  let text = String(message || "");
  if (!/i cannot complete that part from verified evidence this turn/i.test(text)) {
    return text.trim();
  }
  const without = text.replace(CANNOT_COMPLETE_APPENDIX, "").trim();
  if (without.length >= 120 && materiallySatisfied(without, contract)) {
    return without.replace(/\n{3,}/g, "\n\n").trim();
  }
  // Keep at most one cannot-complete line.
  const matches = [...text.matchAll(CANNOT_COMPLETE_APPENDIX)];
  if (matches.length <= 1) return text.trim();
  return without.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Surface Birth only when asked / authority-relevant.
 */
export function stripIrrelevantBirthState(message: string, userMessage: string): string {
  const birthRelevant = /\b(birth|authoris(?:e|ation)|gates?\s+pass)\b/i.test(userMessage);
  if (birthRelevant) return String(message || "").trim();
  return String(message || "")
    .replace(BIRTH_SENTENCE, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Collapse duplicate protected commerce/status sentences.
 */
export function dedupeProtectedStateBlocks(message: string): string {
  const sentences = String(message || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sentences) {
    const isProtected =
      /\b(realised orders|realised revenue|product focus|material unknowns|birth has)\b/i.test(s);
    if (isProtected) {
      const norm = s.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ");
      if (seen.has(norm)) continue;
      seen.add(norm);
    }
    out.push(s);
  }
  return out.join(" ").replace(/\s{2,}/g, " ").trim();
}

/**
 * Final visible polish — single place that may trim append spam / irrelevant protected state.
 * Does not invent new executive content.
 */
export function polishFinalVisibleAnswer(
  message: string,
  userMessage: string,
  contract?: ExecutiveTaskContract,
): string {
  const c = contract ?? parseExecutiveTaskContract(userMessage);
  let out = String(message || "").trim();
  out = stripContradictoryCoverageAppendix(out, c);
  out = stripIrrelevantBirthState(out, userMessage);
  out = dedupeProtectedStateBlocks(out);
  return out;
}

export function countCannotCompleteAppendices(message: string): number {
  const m = String(message || "").match(
    /i cannot complete that part from verified evidence this turn/gi,
  );
  return m ? m.length : 0;
}

export function countBirthMentions(message: string): number {
  const m = String(message || "").match(/\bbirth\b/gi);
  return m ? m.length : 0;
}
