/**
 * Final Executive Release Gate (Round 3).
 *
 * Round-2 preserved: validate before release; never append correction appendices;
 * never stream invalid drafts; fail-closed available.
 *
 * Round-3 adds: claim-level surgical repair, labeled inference allowed,
 * task-intent preservation, natural Grand King surface (no internal dump).
 *
 * Does not encode sealed examination Q&A.
 */

import type {
  ExecutiveTruthSnapshot,
  GroundingEnforcementResult,
} from "./executive-truth-types.js";
import {
  type EpistemicContext,
  type RetrievalAttestation,
  validateEpistemicDraft,
} from "./executive-epistemic-grounding.js";
import { validateTruthDraft } from "./executive-truth-validators.js";
import {
  assessConversationalUx,
  buildNaturalExecutiveFallback,
  detectDisclosureLevel,
  detectExecutiveTaskIntent,
  isLabeledInferenceOrHypothesis,
  renderForGrandKing,
  type DisclosureLevel,
  type ExecutiveTaskIntent,
} from "./executive-conversation-surface.js";

export type ReleaseGateTelemetry = {
  draftValidationPass: boolean;
  validationViolationCount: number;
  reconstructionAttempted: boolean;
  reconstructionSucceeded: boolean;
  failClosedUsed: boolean;
  provenanceViolationCount: number;
  temporalViolationCount: number;
  contradictionCount: number;
  authorityViolationCount: number;
  truthViolationCount: number;
  claimLevelRepairUsed: boolean;
  claimsKept: number;
  claimsDropped: number;
  finalRevalidationPass: boolean;
  supportMonotonicityPass: boolean;
  releasePath:
    | "clean"
    | "claim_repaired"
    | "natural_reconstructed"
    | "fail_closed";
  disclosureLevel: DisclosureLevel;
  taskIntent: ExecutiveTaskIntent;
  uxFailures: string[];
};

export type ExecutiveReleaseResult = {
  message: string;
  released: boolean;
  violations: string[];
  telemetry: ReleaseGateTelemetry;
};

export type ReleaseGateOptions = {
  userMessage?: string;
};

const CORRECTION_APPENDIX_LEAK =
  /\n---\n(?:Grounded corrections|Epistemic corrections)\b/i;

const PROVENANCE_VIOLATIONS = new Set([
  "UNATTESTED_RETRIEVAL_CLAIM",
  "INVENTED_SOURCE_SYSTEM",
  "CAPABILITY_REGISTRY_VIOLATION",
  "PARTIAL_CORRECTION_WITH_RESIDUAL_FABRICATION",
  "INTERNAL_CONTRADICTION",
  "UNSUPPORTED_PROVENANCE_CLAIM",
  "UNSUPPORTED_STATE_SEMANTICS",
]);

const TEMPORAL_VIOLATIONS = new Set([
  "STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM",
  "STALE_HISTORICAL_BLOCKER_AS_CURRENT",
]);

const AUTHORITY_VIOLATIONS = new Set(["FALSE_DEPLOY_AUTHORITY"]);

const TRUTH_VIOLATIONS = new Set([
  "PRODUCT_IDENTITY_MISMATCH",
  "FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM",
  "UNSUPPORTED_MARKED_EVIDENCED",
]);

/** Violations that usually require dropping the claim rather than demoting. */
const FATAL_CLAIM_VIOLATIONS = new Set([
  "UNATTESTED_RETRIEVAL_CLAIM",
  "CAPABILITY_REGISTRY_VIOLATION",
  "INTERNAL_CONTRADICTION",
  "FALSE_DEPLOY_AUTHORITY",
  "CORRECTION_APPENDIX_LEAK",
  "PARTIAL_CORRECTION_WITH_RESIDUAL_FABRICATION",
]);

function countClass(violations: string[], set: Set<string>): number {
  return violations.filter((v) => set.has(v)).length;
}

export function validateExecutiveDraft(
  draft: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
): { ok: boolean; violations: string[] } {
  const truthV = validateTruthDraft(draft, truth);
  const epiCtx: EpistemicContext = {
    truth,
    attestations,
    liveAnswerImpliesProductionOnline: true,
  };
  const epiV = validateEpistemicDraft(draft, epiCtx);
  const violations = [...new Set([...truthV, ...epiV])];
  if (CORRECTION_APPENDIX_LEAK.test(draft)) {
    violations.push("CORRECTION_APPENDIX_LEAK");
  }
  return { ok: violations.length === 0, violations };
}

function splitClaims(draft: string): string[] {
  return draft
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function demoteUnsupportedFact(sentence: string): string | null {
  // Strip invented-source scaffolding and false certainty markers.
  let s = sentence
    .replace(
      /\b(?:according\s+to|based\s+on(?:\s+the)?|from\s+the|evidence\s+from|confirmed\s+by)\s+[^,.]+[,.]?\s*/gi,
      "",
    )
    .replace(
      /\b(?:project\s+management\s+(?:tool|system|dashboard)|commerce\s+tracking\s+(?:system|tool|platform|service)|commercial\s+position\s+reports?|operational\s+(?:audits?|status\s+reports?)|internal\s+(?:audit\s+system|discussions?|documents?|communication(?:s|\s+system)?)|supplier\s+communications?|market\s+analysis\s+(?:reports?|tool)|meeting\s+notes(?:\s+repository)?|planning\s+documents?|team\s+communications?)\b/gi,
      "unavailable sources",
    )
    .replace(/\b(this\s+is\s+verified\s+fact|verified\s+fact|evidenced|\[know\]|know:|proven\s+fact)\b/gi, "")
    .replace(/\bunavailable sources\b/gi, "what we don't yet have")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!s || s.length < 12) return null;

  if (isLabeledInferenceOrHypothesis(s)) {
    return s;
  }

  // Demote confident unsupported commerce/performance assertions.
  if (
    /\b(last quarter|sales declined|demand is (?:proven|confirmed|strong|weak)|corridor is confirmed|customer feedback ratings?)\b/i.test(
      s,
    )
  ) {
    return "I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established.";
  }

  return null;
}

function rewriteTemporalClaim(sentence: string, truth: ExecutiveTruthSnapshot): string {
  const live = Boolean(truth.deploy.gitCommitSha) ||
    truth.deploy.serviceOnlineHint === "assume_online_if_answering";
  if (live) {
    return "EmpireAI is live and answering you in production right now — older waiting-to-go-live language is out of date.";
  }
  return sentence;
}

function rewriteAuthorityClaim(): string {
  return "I can't execute production deploys, publish, spend, or authorise Birth from this chat without Grand King authority.";
}

/**
 * Surgical claim repair: keep valid sentences; drop/demote only bad ones.
 */
export function surgicalRepairDraft(
  draft: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
): {
  message: string;
  kept: number;
  dropped: number;
  repaired: boolean;
  stillContaminated: boolean;
} {
  const claims = splitClaims(draft);
  if (claims.length === 0) {
    return { message: "", kept: 0, dropped: 0, repaired: false, stillContaminated: true };
  }

  const kept: string[] = [];
  let dropped = 0;
  let changed = false;

  for (const claim of claims) {
    // Bare certainty stubs after source stripping — drop.
    if (/^\s*(this\s+is\s+)?verified\s+fact\.?\s*$/i.test(claim) || /^\s*evidenced\.?\s*$/i.test(claim)) {
      dropped += 1;
      changed = true;
      continue;
    }

    const v = validateExecutiveDraft(claim, truth, attestations);
    if (v.ok) {
      kept.push(claim);
      continue;
    }

    const fatal = v.violations.some((x) => FATAL_CLAIM_VIOLATIONS.has(x));
    const temporal = v.violations.some((x) => TEMPORAL_VIOLATIONS.has(x));
    const authority = v.violations.includes("FALSE_DEPLOY_AUTHORITY");
    const commerce = v.violations.includes("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM");
    const productMismatch = v.violations.includes("PRODUCT_IDENTITY_MISMATCH");
    const invented =
      v.violations.includes("INVENTED_SOURCE_SYSTEM") ||
      v.violations.includes("UNSUPPORTED_PROVENANCE_CLAIM") ||
      v.violations.includes("UNSUPPORTED_STATE_SEMANTICS");

    if (authority) {
      kept.push(rewriteAuthorityClaim());
      changed = true;
      continue;
    }

    if (productMismatch && truth.product.productName && truth.product.asin) {
      kept.push(
        `Our bound product is ${truth.product.productName} (ASIN ${truth.product.asin}).`,
      );
      changed = true;
      continue;
    }

    if (temporal && !fatal) {
      kept.push(rewriteTemporalClaim(claim, truth));
      changed = true;
      continue;
    }

    if (commerce) {
      kept.push(
        "I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established.",
      );
      changed = true;
      continue;
    }

    if (
      (v.violations.includes("UNSUPPORTED_STATE_SEMANTICS") ||
        v.violations.includes("UNSUPPORTED_PROVENANCE_CLAIM")) &&
      !v.violations.includes("UNATTESTED_RETRIEVAL_CLAIM")
    ) {
      // Drop invented analysis semantics; do not rewrite into stronger claims.
      dropped += 1;
      changed = true;
      continue;
    }

    if (invented && !v.violations.includes("UNATTESTED_RETRIEVAL_CLAIM")) {
      const demoted = demoteUnsupportedFact(claim);
      if (demoted) {
        const recheck = validateExecutiveDraft(demoted, truth, attestations);
        if (recheck.ok) {
          kept.push(demoted);
          changed = true;
          continue;
        }
      }
    }

    // Labeled inference that only tripped soft provenance: try keep after stripping source nouns.
    if (isLabeledInferenceOrHypothesis(claim) && !fatal) {
      const demoted = demoteUnsupportedFact(claim);
      if (demoted) {
        const recheck = validateExecutiveDraft(demoted, truth, attestations);
        if (recheck.ok) {
          kept.push(demoted);
          changed = true;
          continue;
        }
      }
    }

    dropped += 1;
    changed = true;
  }

  const message = kept.join(" ").trim();
  const contaminationRatio = claims.length === 0 ? 1 : dropped / claims.length;
  const stillContaminated =
    message.length < 24 ||
    contaminationRatio > 0.65 ||
    (kept.length === 0);

  return {
    message,
    kept: kept.length,
    dropped,
    repaired: changed,
    stillContaminated,
  };
}

/** @deprecated Round-2 dump — kept only for internal/audit tests; not GK-facing. */
export function reconstructExecutiveAnswer(
  truth: ExecutiveTruthSnapshot,
  violations: readonly string[],
): string {
  return buildNaturalExecutiveFallback({
    productName: truth.product.productName,
    asin: truth.product.asin,
    orders: truth.financial.orders,
    realisedRevenueUsd: truth.financial.realisedRevenueUsd,
    birthTimestamp: truth.birth.birthTimestamp,
    live:
      Boolean(truth.deploy.gitCommitSha) ||
      truth.deploy.serviceOnlineHint === "assume_online_if_answering",
    intent: "general",
    level: "normal",
    hadProvenanceViolation: violations.some((v) => PROVENANCE_VIOLATIONS.has(v)),
    hadTemporalViolation: violations.some((v) => TEMPORAL_VIOLATIONS.has(v)),
  });
}

export function failClosedExecutiveAnswer(
  truth: ExecutiveTruthSnapshot,
  level: DisclosureLevel = "normal",
): string {
  const raw = [
    "I don't have enough solid evidence to give you a fuller operating narrative from this turn alone.",
    "What I can say: I'm answering live,",
    truth.product.productName
      ? `we're focused on ${truth.product.productName},`
      : "product identity is still thin,",
    `and realised orders are ${truth.financial.orders}.`,
    "Anything beyond that I'd treat as open until we verify it.",
  ].join(" ");
  return renderForGrandKing(raw, level);
}

function finalizeVisible(
  message: string,
  level: DisclosureLevel,
  userMessage?: string,
): { message: string; uxFailures: string[] } {
  const allowAuthority = /\b(deploy|publish|spend|birth|authoris|approv)/i.test(
    userMessage ?? "",
  );
  const rendered = renderForGrandKing(message, level, {
    allowAuthorityNotice: allowAuthority,
  });
  const ux =
    level === "normal"
      ? assessConversationalUx(rendered)
      : { ok: true, failures: [] as string[] };
  return { message: rendered, uxFailures: ux.failures };
}

/**
 * Pre-release gate. Never returns invalid draft + correction appendix.
 * Prefers claim-level repair; natural reconstruct only when needed.
 * FINAL natural text is always revalidated before release.
 */
export function releaseExecutiveAnswer(
  draft: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
  options: ReleaseGateOptions = {},
): ExecutiveReleaseResult {
  const level = detectDisclosureLevel(options.userMessage);
  const intent = detectExecutiveTaskIntent(options.userMessage);

  const telemetry: ReleaseGateTelemetry = {
    draftValidationPass: false,
    validationViolationCount: 0,
    reconstructionAttempted: false,
    reconstructionSucceeded: false,
    failClosedUsed: false,
    provenanceViolationCount: 0,
    temporalViolationCount: 0,
    contradictionCount: 0,
    authorityViolationCount: 0,
    truthViolationCount: 0,
    claimLevelRepairUsed: false,
    claimsKept: 0,
    claimsDropped: 0,
    finalRevalidationPass: false,
    supportMonotonicityPass: true,
    releasePath: "fail_closed",
    disclosureLevel: level,
    taskIntent: intent,
    uxFailures: [],
  };

  const tryRelease = (
    candidate: string,
    path: ReleaseGateTelemetry["releasePath"],
    priorViolations: string[],
  ): ExecutiveReleaseResult | null => {
    const fin = finalizeVisible(candidate, level, options.userMessage);
    const final = validateExecutiveDraft(fin.message, truth, attestations);
    if (!final.ok) {
      telemetry.finalRevalidationPass = false;
      telemetry.supportMonotonicityPass = false;
      return null;
    }
    telemetry.finalRevalidationPass = true;
    telemetry.supportMonotonicityPass = true;
    telemetry.releasePath = path;
    telemetry.uxFailures = fin.uxFailures;
    if (path !== "clean") {
      telemetry.reconstructionSucceeded = true;
    }
    return {
      message: fin.message,
      released: true,
      violations: priorViolations,
      telemetry,
    };
  };

  const first = validateExecutiveDraft(draft, truth, attestations);
  telemetry.validationViolationCount = first.violations.length;
  telemetry.provenanceViolationCount = countClass(first.violations, PROVENANCE_VIOLATIONS);
  telemetry.temporalViolationCount = countClass(first.violations, TEMPORAL_VIOLATIONS);
  telemetry.contradictionCount = first.violations.filter((v) => v === "INTERNAL_CONTRADICTION").length;
  telemetry.authorityViolationCount = countClass(first.violations, AUTHORITY_VIOLATIONS);
  telemetry.truthViolationCount = countClass(first.violations, TRUTH_VIOLATIONS);

  if (first.ok) {
    telemetry.draftValidationPass = true;
    const clean = tryRelease(draft.trim(), "clean", []);
    if (clean) return clean;
  }

  // Attempt 1: claim-level surgical repair (preserve task-specific reasoning).
  telemetry.reconstructionAttempted = true;
  telemetry.claimLevelRepairUsed = true;
  const surgical = surgicalRepairDraft(draft, truth, attestations);
  telemetry.claimsKept = surgical.kept;
  telemetry.claimsDropped = surgical.dropped;

  if (!surgical.stillContaminated && surgical.message) {
    const repaired = tryRelease(surgical.message, "claim_repaired", first.violations);
    if (repaired) return repaired;
  }

  // Attempt 2: natural task-sensitive reconstruct (NOT Round-2 audit dump).
  const natural = buildNaturalExecutiveFallback({
    productName: truth.product.productName,
    asin: truth.product.asin,
    orders: truth.financial.orders,
    realisedRevenueUsd: truth.financial.realisedRevenueUsd,
    birthTimestamp: truth.birth.birthTimestamp,
    live:
      Boolean(truth.deploy.gitCommitSha) ||
      truth.deploy.serviceOnlineHint === "assume_online_if_answering",
    intent,
    level,
    hadProvenanceViolation: telemetry.provenanceViolationCount > 0,
    hadTemporalViolation: telemetry.temporalViolationCount > 0,
  });
  const naturalRelease = tryRelease(natural, "natural_reconstructed", first.violations);
  if (naturalRelease) return naturalRelease;

  // Attempt 3: fail-closed natural UNKNOWN — still revalidated.
  const closed = failClosedExecutiveAnswer(truth, level);
  const closedFinal = validateExecutiveDraft(closed, truth, attestations);
  telemetry.failClosedUsed = true;
  telemetry.releasePath = "fail_closed";
  telemetry.finalRevalidationPass = closedFinal.ok;
  telemetry.uxFailures = assessConversationalUx(closed).failures;
  return {
    message: closedFinal.ok
      ? closed
      : "I don't have enough evidence to answer that confidently yet.",
    released: true,
    violations: first.violations,
    telemetry,
  };
}

/**
 * Compatibility entry used by pillow-host and unit tests.
 */
export function enforceExecutiveTruthGrounding(
  answer: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
  options: ReleaseGateOptions = {},
): GroundingEnforcementResult & { telemetry: ReleaseGateTelemetry } {
  const released = releaseExecutiveAnswer(answer, truth, attestations, options);
  return {
    message: released.message,
    adjusted: released.telemetry.releasePath !== "clean",
    violations: released.violations,
    telemetry: released.telemetry,
  };
}
