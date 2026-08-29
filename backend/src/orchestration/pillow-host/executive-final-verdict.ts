/**
 * Authoritative final-verdict object for explicit claim obligations.
 * RESOLVED → CANONICAL owns FINAL_VISIBLE_VERDICT.
 * UNRESOLVED → LLM retains judgment authority.
 * Does not encode sealed examination content.
 */

import {
  assessClaimAgainstCanonical,
  type CompoundClaimAssessment,
} from "./executive-claim-proposition.js";
import type { CanonicalCaseState } from "./executive-canonical-state.js";

export type VisibleVerdictLabel =
  | "Supported"
  | "Contradicted"
  | "Unproven / not established"
  | "Unknown";

export type FinalVerdictObject = {
  claimId: string;
  claimText: string;
  propositionIds: string[];
  resolutionStatus: "RESOLVED" | "UNRESOLVED";
  canonicalVerdict: CompoundClaimAssessment["overall"];
  verdictOwner: "CANONICAL" | "LLM";
  explanationInput: string;
  finalVisibleVerdict: VisibleVerdictLabel;
  truePremiseFalseConclusion: boolean;
};

export function mapOverallToVisibleLabel(
  overall: CompoundClaimAssessment["overall"],
): VisibleVerdictLabel {
  if (overall === "supported") return "Supported";
  if (overall === "contradicted") return "Contradicted";
  if (overall === "unknown") return "Unknown";
  return "Unproven / not established";
}

export function classifyResolutionStatus(
  assessment: CompoundClaimAssessment,
): "RESOLVED" | "UNRESOLVED" {
  const material = assessment.components.filter((c) => c.proposition.kind !== "generic");
  if (material.length < 1) return "UNRESOLVED";
  // Material propositions mapped to canonical state → resolved ownership
  // (Supported / Contradicted / Not established).
  return "RESOLVED";
}

export function buildFinalVerdictObject(
  claimId: string,
  claimText: string,
  canonical: CanonicalCaseState | null | undefined,
): FinalVerdictObject {
  const text = String(claimText || "").trim();
  const empty: FinalVerdictObject = {
    claimId,
    claimText: text,
    propositionIds: [],
    resolutionStatus: "UNRESOLVED",
    canonicalVerdict: "unproven",
    verdictOwner: "LLM",
    explanationInput: "Canonical state does not fully determine this proposition.",
    finalVisibleVerdict: "Unproven / not established",
    truePremiseFalseConclusion: false,
  };
  if (!canonical || text.length < 8) return empty;

  const assessment = assessClaimAgainstCanonical(text, canonical);
  const resolutionStatus = classifyResolutionStatus(assessment);
  const verdictOwner = resolutionStatus === "RESOLVED" ? "CANONICAL" : "LLM";
  const finalVisibleVerdict =
    resolutionStatus === "RESOLVED"
      ? mapOverallToVisibleLabel(assessment.overall)
      : mapOverallToVisibleLabel(assessment.overall);

  return {
    claimId,
    claimText: text,
    propositionIds: assessment.components.map((c) => c.proposition.id),
    resolutionStatus,
    canonicalVerdict: assessment.overall,
    verdictOwner,
    explanationInput: assessment.justification,
    finalVisibleVerdict,
    truePremiseFalseConclusion: assessment.truePremiseFalseConclusion,
  };
}

/**
 * Explanation must not assert the opposite of a locked canonical verdict.
 * Returns null when consistent; otherwise a replacement explanation.
 */
export function reconcileExplanationWithLockedVerdict(
  explanation: string,
  locked: FinalVerdictObject,
): { ok: boolean; explanation: string; reason?: string } {
  if (locked.verdictOwner !== "CANONICAL" || locked.resolutionStatus !== "RESOLVED") {
    return { ok: true, explanation };
  }
  const e = String(explanation || "");
  const v = locked.canonicalVerdict;

  const saysSupported =
    /\b(?:is\s+supported|verdict\s*(?:is|:)\s*supported|claim\s+is\s+supported|therefore\s+supported)\b/i.test(
      e,
    ) || /\bunrelated\b[^.!?\n]{0,40}\b(?:true|correct|holds)\b/i.test(e);
  const saysContradicted =
    /\b(?:is\s+contradicted|verdict\s*(?:is|:)\s*contradicted|claim\s+is\s+false|does\s+not\s+hold)\b/i.test(
      e,
    );
  const saysUnrelatedOk =
    /\b(?:nothing\s+to\s+do\s+with|unrelated|no\s+causal)\b[^.!?\n]{0,60}\b(?:because|since|as)\b/i.test(
      e,
    ) &&
    /\b(?:never\s+(?:lost|had)|different\s+(?:mechanism|cause)|itself\s+never)\b/i.test(e) &&
    !/\b(?:indirect|transfer|reassign|committed|resulted\s+from)\b/i.test(e);

  if (v === "contradicted" && (saysSupported || saysUnrelatedOk)) {
    return {
      ok: false,
      explanation: locked.explanationInput,
      reason: "VERDICT_EXPLANATION_CONTRADICTION",
    };
  }
  if (v === "supported" && saysContradicted) {
    return {
      ok: false,
      explanation: locked.explanationInput,
      reason: "VERDICT_EXPLANATION_CONTRADICTION",
    };
  }
  return { ok: true, explanation: e || locked.explanationInput };
}

/** Count leftover Supported surfaces outside Claim blocks when a claim is locked Contradicted. */
export function countLeftoverSupportedOverrides(finalVisible: string): number {
  const body = String(finalVisible || "").replace(
    /(?:^|\n)(?:#{1,3}\s*)?Claim\s*\d+\b[\s\S]*?(?=(?:\n(?:#{1,3}\s*)?Claim\s*\d+\b)|$)/gi,
    "\n",
  );
  const hasLockedContradicted =
    /Claim\s*\d+\b[\s\S]{0,240}\*\*Verdict:\*\*\s*(?:\*\*)?Contradicted/i.test(
      finalVisible,
    );
  if (!hasLockedContradicted) return 0;
  return (
    (body.match(/\*\*Verdict:\*\*\s*(?:\*\*)?Supported\b/gi) || []).length +
    (body.match(/\bis\s+\*\*Supported\*\*/gi) || []).length +
    (body.match(/\*\*Supported\*\*(?=\s*[.!]|\s*$)/gi) || []).length
  );
}
