/**
 * Final visible executive release — single authority for Grand-King-visible text.
 *
 * Invariants applied to the ACTUAL final message:
 * - multi-obligation requests never collapse to a global UNKNOWN stub
 * - material obligations terminate as answered / partial / unavailable-with-reason
 * - silentlyDroppedMaterialTasks must be 0 on release
 *
 * Does not encode sealed examination content.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";
import {
  appendMissingTaskCoverage,
  assessTaskCoverage,
  buildContractAwareReconstruct,
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
  type ExecutiveTaskContract,
  type TaskCoverageReport,
} from "./executive-task-contract.js";

/** Exact production collapse class observed after Wave-1 retest. */
export const GLOBAL_EVIDENCE_COLLAPSE_REPLY =
  "I don't have enough evidence to answer that confidently yet.";

const GLOBAL_COLLAPSE_PATTERN =
  /^\s*i don't have enough evidence to answer that confidently yet\.?\s*$/i;

/** Soft fail-closed whole-answer collapse (same class family as GLOBAL_EVIDENCE_COLLAPSE_REPLY). */
const GENERIC_FAIL_CLOSED_COLLAPSE =
  /\bi don't have enough (?:solid )?evidence to (?:answer that confidently|give you a fuller operating narrative)\b/i;

export function isGlobalEvidenceCollapseReply(text: string | null | undefined): boolean {
  const t = String(text || "").trim();
  return GLOBAL_COLLAPSE_PATTERN.test(t) || GENERIC_FAIL_CLOSED_COLLAPSE.test(t);
}

/**
 * Certification oracle: a final-visible reply must not be a global collapse
 * when the request carried multiple material obligations.
 */
export function finalVisibleSemanticsFail(
  userMessage: string,
  finalVisibleText: string,
): { fail: boolean; reason: string | null; contract: ExecutiveTaskContract; coverage: TaskCoverageReport } {
  const contract = parseExecutiveTaskContract(userMessage);
  const coverage = assessTaskCoverage(finalVisibleText, contract);
  const multi =
    contract.tasks.length >= 2 ||
    contract.multipart ||
    contract.requiresPremiseAudit ||
    contract.requiresTemporalReconciliation ||
    contract.requiresRecommendation ||
    contract.requiresEvidenceExplanation ||
    contract.requiresConditionalReasoning ||
    contract.requiresAuthorityAnalysis;

  if (multi && isGlobalEvidenceCollapseReply(finalVisibleText)) {
    return {
      fail: true,
      reason: "GLOBAL_UNKNOWN_COLLAPSE_ON_MULTI_OBLIGATION",
      contract,
      coverage,
    };
  }
  if (
    multi &&
    contract.requiresTemporalReconciliation &&
    !/\b(histor|current|future|supersed|reconcil)\b/i.test(finalVisibleText)
  ) {
    return {
      fail: true,
      reason: "TEMPORAL_OBLIGATION_NOT_ADDRESSED",
      contract,
      coverage,
    };
  }
  if (multi && coverage.silentlyDroppedTasks > 0) {
    return {
      fail: true,
      reason: "SILENTLY_DROPPED_MATERIAL_TASKS",
      contract,
      coverage,
    };
  }
  if (
    /i cannot complete that part from verified evidence this turn/i.test(finalVisibleText) &&
    String(finalVisibleText || "").trim().length >= 200
  ) {
    return {
      fail: true,
      reason: "CONTRADICTORY_COVERAGE_APPENDIX",
      contract,
      coverage,
    };
  }
  if (multi && contract.requiresConditionalReasoning && !/\b(under (?:the )?assumption|if (?:that|this)|scenario|would|conditional)\b/i.test(finalVisibleText)) {
    return {
      fail: true,
      reason: "HYPOTHETICAL_NOT_REASONED",
      contract,
      coverage,
    };
  }
  if (multi && contract.requiresRecommendation && !/\b(recommend|should|I would|decision|choose|prefer|better supported)\b/i.test(finalVisibleText)) {
    return {
      fail: true,
      reason: "RECOMMENDATION_OMITTED",
      contract,
      coverage,
    };
  }
  if (multi && String(finalVisibleText || "").trim().length < 40) {
    return {
      fail: true,
      reason: "MULTI_OBLIGATION_REPLY_TOO_THIN",
      contract,
      coverage,
    };
  }
  return { fail: false, reason: null, contract, coverage };
}

/**
 * Minimal safe multi-obligation reply using only verified-state synthesizers.
 * Used when richer reconstruct fails revalidation — still not a global stub.
 */
export function buildForcedObligationCompletion(
  truth: ExecutiveTruthSnapshot,
  contract: ExecutiveTaskContract,
): string {
  const base = buildContractAwareReconstruct(truth, contract);
  const filled = appendMissingTaskCoverage(base, contract, truth);
  if (!isGlobalEvidenceCollapseReply(filled.message) && filled.message.trim().length >= 40) {
    return filled.message;
  }
  const scoped =
    contract.scopeType === "SYNTHETIC_ANALYSIS" ||
    contract.scopeType === "HYPOTHETICAL" ||
    contract.scopeType === "COMPARATIVE_SCENARIO" ||
    contract.scopeType === "HISTORICAL_ANALYSIS";
  const product =
    truth.product.productName ??
    (truth.product.asin ? `bound product (${truth.product.asin})` : "our bound product");
  const lines = scoped
    ? ["Synthetic / scenario analysis — live EmpireAI product and commerce state are out of scope for this reply."]
    : [
        `EmpireAI is answering live. Focus remains ${product}. Realised orders are ${truth.financial.orders}.`,
        truth.birth.birthTimestamp == null ? "Birth has not been authorised." : "",
      ].filter(Boolean);
  for (const task of contract.tasks.slice(0, 20)) {
    lines.push(
      synthesizeTaskUnitAnswer(task, truth, {
        birthRelevant: contract.birthRelevant && !scoped,
        hypotheticalPremises: contract.hypotheticalPremises,
        scopeType: contract.scopeType,
        materialConstraints: contract.materialConstraints,
      }),
    );
  }
  return lines.join("\n\n");
}
