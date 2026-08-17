/**
 * Single ownership for final-visible polish after release candidates are chosen.
 * Prevents coverage/protected-state layers from contradicting or spamming a completed answer.
 * Preserves Markdown paragraph structure for Grand King readability.
 * Does not encode sealed examination content.
 */

import {
  assessTaskCoverage,
  parseExecutiveTaskContract,
  type ExecutiveTaskContract,
} from "./executive-task-contract.js";
import {
  detectReasoningScope,
  isComplexWallOfText,
  stripIrrelevantLiveGrounding,
} from "./executive-scoped-reasoning.js";

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
  if (
    contract.requiresRiskRanking &&
    /\b(most dangerous|what matters most|highest risk)\b/i.test(t)
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
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Collapse duplicate protected commerce/status sentences — preserve paragraphs.
 */
export function dedupeProtectedStateBlocks(message: string): string {
  const paras = String(message || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const globalSeen = new Set<string>();
  const outParas: string[] = [];

  for (const para of paras) {
    const sentences = para
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const kept: string[] = [];
    for (const s of sentences) {
      const isProtected =
        /\b(realised orders|realised revenue|product focus|material unknowns|birth has)\b/i.test(s);
      if (isProtected) {
        const norm = s.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ");
        if (globalSeen.has(norm)) continue;
        globalSeen.add(norm);
      }
      kept.push(s);
    }
    if (kept.length > 0) outParas.push(kept.join(" "));
  }

  return outParas.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * If a complex multipart answer is one wall of text, insert light section breaks
 * before numbered/lettered markers without inventing content.
 */
export function ensureScannableMultipartStructure(
  message: string,
  contract: ExecutiveTaskContract,
): string {
  let out = String(message || "").trim();
  if (!contract.multipart && contract.tasks.length < 3) return out;
  if (!isComplexWallOfText(out, contract.multipart || contract.tasks.length >= 3)) {
    return out;
  }
  // Insert breaks before A)/1)/Claim markers when flattened.
  out = out
    .replace(/\s+([A-E][).]\s+)/g, "\n\n$1")
    .replace(/\s+(\d+[).]\s+)/g, "\n\n$1")
    .replace(/\s+(#{1,3}\s+)/g, "\n\n$1")
    .replace(/\s+(\*\*(?:Verdict|Decision|Need|My recommendation|What matters most):?\*\*)/gi, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
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
  const scope = c.scopeType ?? detectReasoningScope(userMessage);
  let out = String(message || "").trim();
  out = stripContradictoryCoverageAppendix(out, c);
  out = stripIrrelevantBirthState(out, userMessage);
  out = stripIrrelevantLiveGrounding(out, userMessage, scope);
  out = dedupeProtectedStateBlocks(out);
  out = ensureScannableMultipartStructure(out, c);
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
