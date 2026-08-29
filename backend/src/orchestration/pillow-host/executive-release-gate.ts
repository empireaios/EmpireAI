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
import {
  assessDecisionQuality,
  repairDecisionQualityAnswer,
} from "./executive-decision-quality.js";
import {
  appendMissingTaskCoverage,
  assessTaskCoverage,
  buildContractAwareReconstruct,
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
  type ExecutiveTaskContract,
  type TaskCoverageReport,
} from "./executive-task-contract.js";
import {
  buildForcedObligationCompletion,
  GLOBAL_EVIDENCE_COLLAPSE_REPLY,
  isGlobalEvidenceCollapseReply,
} from "./executive-final-release.js";
import { hasAuthoritySemanticsMarker } from "./executive-authority-semantics.js";
import { polishFinalVisibleAnswer } from "./executive-response-polish.js";
import { countLeftoverSupportedOverrides } from "./executive-final-verdict.js";
import {
  assessClaimCompletenessGate,
  detectMaterialInternalContradictions,
  enforceClaimEnumeration,
  parseClaimObligationsFromContractTasks,
  parseClaimObligationsFromAnswer,
  stripCompetingVerdictSurfaces,
} from "./executive-conclusion-ledger.js";
import {
  extractRequestedSectionTitles,
  enforceExactSectionContract,
} from "./executive-section-contract.js";
import {
  preservePopulationScopeQualifiers,
  repairEvidenceStrengthRanking,
} from "./executive-evidence-ranking.js";
import {
  assessFinalVisibleContract,
  authorizeTransportRelease,
  hasHardFinalVisibleFailure,
  resolveTransportClaimObligations,
  stripInternalValidatorDiagnostics,
} from "./executive-final-visible-contract.js";
import {
  detectReasoningScope,
  isScopedAwayFromLiveEmpire,
  type ReasoningScopeType,
} from "./executive-scoped-reasoning.js";
import {
  ensureRecommendationConstraintConsistency,
  extractMaterialConstraints,
} from "./executive-decision-constraints.js";
import { ensureCausalClaimConsistency } from "./executive-causal-state.js";
import { buildCanonicalCaseState } from "./executive-canonical-state.js";
import { detectScenarioDomain } from "./executive-memory-realization.js";

/** True when a scoped synthetic answer illegally injects live EmpireAI briefing residue. */
export function isLiveEmpireContaminationInScopedAnswer(
  text: string,
  truth: ExecutiveTruthSnapshot,
  userMessage?: string,
): boolean {
  const scope = detectReasoningScope(userMessage ?? "");
  if (!isScopedAwayFromLiveEmpire(scope, userMessage)) return false;
  const t = String(text || "");
  if (
    /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i.test(t) ||
    /EmpireAI is live and answering you in production/i.test(t) ||
    /We haven't made our first sale yet/i.test(t)
  ) {
    return true;
  }
  const pn = String(truth.product.productName || "").trim();
  if (pn.length >= 16 && t.includes(pn)) return true;
  // Birth status dump on asks that never mention Birth.
  if (
    /Birth has(?:n't| not) been authorised/i.test(t) &&
    !/\bbirth\b/i.test(userMessage ?? "")
  ) {
    return true;
  }
  return false;
}

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
    | "fail_closed"
    | "contract_coverage_filled";
  disclosureLevel: DisclosureLevel;
  taskIntent: ExecutiveTaskIntent;
  uxFailures: string[];
  taskContractTaskCount: number;
  silentlyDroppedMaterialTasks: number;
  coverageAppendedUnits: number;
  taskCoverage: TaskCoverageReport | null;
};

export type ExecutiveReleaseResult = {
  message: string;
  released: boolean;
  violations: string[];
  telemetry: ReleaseGateTelemetry;
};

export type ReleaseGateOptions = {
  userMessage?: string;
  taskContract?: ExecutiveTaskContract;
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
  const decisionV = assessDecisionQuality(draft, truth).violations;
  const violations = [...new Set([...truthV, ...epiV, ...decisionV])];
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

/** Reassemble claim sentences without flattening Markdown section structure. */
function joinClaimsPreservingStructure(claims: readonly string[]): string {
  if (claims.length === 0) return "";
  let out = claims[0]!;
  for (let i = 1; i < claims.length; i++) {
    const next = claims[i]!;
    const sectionStart =
      /^(#{1,3}\s|[A-E][).]\s|\d+[).]\s|[-*•]\s|\*\*(?:Verdict|Decision|Need|Recommendation|What matters most))/i.test(
        next,
      );
    out += sectionStart ? `\n\n${next}` : ` ${next}`;
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

const LIVE_COMMERCE_DEMOTE =
  "I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established.";
const SCOPED_COMMERCE_DEMOTE =
  "That performance claim is not established from the supplied scenario evidence — treat it as unproven.";

function demoteUnsupportedFact(sentence: string, scopedAway = false): string | null {
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
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();

  if (!s || s.length < 12) return null;

  if (isLabeledInferenceOrHypothesis(s)) {
    return s;
  }

  // Demote confident unsupported commerce/performance assertions.
  // Synthetic / scoped scenarios must never receive live sales-history surface language.
  if (
    /\b(last quarter|sales declined|demand is (?:proven|confirmed|strong|weak)|corridor is confirmed|customer feedback ratings?)\b/i.test(
      s,
    )
  ) {
    return scopedAway ? SCOPED_COMMERCE_DEMOTE : LIVE_COMMERCE_DEMOTE;
  }

  // If a live sales-history demote somehow entered a scoped draft, rewrite in place.
  if (scopedAway && /\bverified sales-history evidence beyond realised orders\b/i.test(s)) {
    return SCOPED_COMMERCE_DEMOTE;
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
  options: { userMessage?: string; scopeType?: string } = {},
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

  const scope =
    options.scopeType ||
    (options.userMessage ? detectReasoningScope(options.userMessage) : "CURRENT_REALITY");
  const scopedAway = isScopedAwayFromLiveEmpire(scope as ReasoningScopeType, options.userMessage);

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

    // Synthetic/scenario analysis must not be rewritten into live EmpireAI product identity.
    if (productMismatch && truth.product.productName && truth.product.asin) {
      if (scopedAway) {
        kept.push(
          "The scenario entity mapping is unproven from co-occurrence or naming alone — verify against an authoritative product-code mapping before treating identity as settled.",
        );
      } else {
        kept.push(
          `Our bound product is ${truth.product.productName} (ASIN ${truth.product.asin}).`,
        );
      }
      changed = true;
      continue;
    }

    if (temporal && !fatal) {
      if (scopedAway) {
        kept.push(
          "A historical scenario note does not prove current state — verify whether that status still holds before treating it as present fact.",
        );
      } else {
        kept.push(rewriteTemporalClaim(claim, truth));
      }
      changed = true;
      continue;
    }

    if (commerce) {
      kept.push(scopedAway ? SCOPED_COMMERCE_DEMOTE : LIVE_COMMERCE_DEMOTE);
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
      const demoted = demoteUnsupportedFact(claim, scopedAway);
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
      const demoted = demoteUnsupportedFact(claim, scopedAway);
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

  const message = joinClaimsPreservingStructure(kept);
  const contaminationRatio = claims.length === 0 ? 1 : dropped / claims.length;
  // Prefer preserving remaining safe claims over whole-answer reconstruct.
  // Only force reconstruct when almost nothing usable survives.
  const stillContaminated =
    message.length < 24 ||
    contaminationRatio > 0.85 ||
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

/**
 * Strip governance/recovery residue that must not appear on pure evidence audits.
 */
export function stripIrrelevantLifecycleContamination(
  message: string,
  userMessage: string | undefined,
  contract?: ExecutiveTaskContract,
): string {
  let out = String(message || "");
  const authorityAsk =
    hasAuthoritySemanticsMarker(userMessage ?? "") ||
    Boolean(contract?.requiresAuthorityAnalysis) ||
    Boolean(contract?.tasks.some((t) => /authority|delegation|capability|execution|governance|approval/i.test(t.kind)));

  if (!authorityAsk) {
    out = out.replace(
      /\s*One or more requested actions sit behind Grand King approval or constitutional limits[^.]*\.\s*(?:I still complete the operational parts above\.)?/gi,
      " ",
    );
  }
  out = out.replace(
    /\s*I am continuing from this same request context[^.]*\./gi,
    " ",
  );
  out = out.replace(
    /\s*you do not need to resubmit the question[^.]*\./gi,
    " ",
  );
  out = out.replace(
    /\s*Full model deliberation was temporarily unavailable on this turn[^.]*\./gi,
    " ",
  );
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function finalizeVisible(
  message: string,
  level: DisclosureLevel,
  userMessage?: string,
  contract?: ReturnType<typeof parseExecutiveTaskContract>,
): { message: string; uxFailures: string[] } {
  const cleaned = stripIrrelevantLifecycleContamination(message, userMessage, contract);
  const allowAuthority =
    hasAuthoritySemanticsMarker(userMessage ?? "") ||
    /\b(deploy|publish|spend|birth|authoris|approv)/i.test(userMessage ?? "");
  let rendered = renderForGrandKing(cleaned, level, {
    allowAuthorityNotice: allowAuthority,
  });
  // Merge ask + draft constraints so LLM-discovered economics bind the final recommendation.
  const seeded = contract?.materialConstraints ?? [];
  const mergedConstraints = extractMaterialConstraints(userMessage ?? "", rendered);
  for (const c of seeded) {
    if (!mergedConstraints.some((m) => m.class === c.class)) mergedConstraints.push(c);
  }
  const consistency = ensureRecommendationConstraintConsistency(
    rendered,
    mergedConstraints,
    userMessage ?? "",
  );
  rendered = consistency.message;
  const causalFix = ensureCausalClaimConsistency(rendered, userMessage ?? "");
  rendered = causalFix.message;

  // Hard canonical consistency: claim verdicts must consume established propositions.
  // Regenerate mismatched claim slices from canonical state — do not append a correction.
  const canonical = buildCanonicalCaseState(userMessage ?? "");
  const claimObsRaw = parseClaimObligationsFromContractTasks(contract?.tasks ?? []);
  const claimObs = resolveTransportClaimObligations({
    userMessage: userMessage ?? "",
    answer: rendered,
    contractClaims:
      claimObsRaw.length >= 1
        ? claimObsRaw
        : canonical.claims.length >= 1
          ? canonical.claims.map((cl) => ({
              id: `claim_${cl.index}`,
              index: cl.index,
              sourceText: cl.text,
              subject: cl.text.slice(0, 120),
            }))
          : [],
  });
  if (claimObs.length >= 1) {
    rendered = enforceClaimEnumeration(rendered, claimObs, {
      domainHint: detectScenarioDomain(userMessage ?? ""),
      userMessage: userMessage ?? "",
      canonical,
    }).message;
  }
  const consistencyIssues = detectMaterialInternalContradictions(rendered, {
    userMessage: userMessage ?? "",
    canonical,
  });
  if (consistencyIssues.length > 0 && claimObs.length >= 1) {
    rendered = enforceClaimEnumeration(rendered, claimObs, {
      domainHint: detectScenarioDomain(userMessage ?? ""),
      userMessage: userMessage ?? "",
      canonical,
    }).message;
  }

  rendered = repairEvidenceStrengthRanking(rendered, userMessage ?? "").message;
  rendered = preservePopulationScopeQualifiers(rendered, userMessage ?? "").message;
  if (contract?.expectedTopLevelSections != null) {
    rendered = enforceExactSectionContract(
      rendered,
      contract.expectedTopLevelSections,
      extractRequestedSectionTitles(userMessage ?? ""),
    ).message;
  }
  if (claimObs.length >= 1) {
    const completeness = assessClaimCompletenessGate(rendered, claimObs);
    if (!completeness.ok) {
      rendered = enforceClaimEnumeration(rendered, claimObs, {
        domainHint: detectScenarioDomain(userMessage ?? ""),
        userMessage: userMessage ?? "",
        canonical,
      }).message;
    }
  }

  rendered = polishFinalVisibleAnswer(rendered, userMessage ?? "", contract);
  if (countLeftoverSupportedOverrides(rendered) > 0) {
    rendered = stripCompetingVerdictSurfaces(
      rendered.replace(
        /(?:^|\n)(?!#{1,3}\s*Claim\s*\d)([\s\S]*?)(?=(?:\n#{1,3}\s*Claim\s*\d)|$)/gi,
        (chunk) => stripCompetingVerdictSurfaces(chunk),
      ),
    );
    // Re-enforce claim blocks after leftover Supported purge.
    if (claimObs.length >= 1) {
      rendered = enforceClaimEnumeration(rendered, claimObs, {
        domainHint: detectScenarioDomain(userMessage ?? ""),
        userMessage: userMessage ?? "",
        canonical,
      }).message;
    }
  }

  // Final boundary: strip machinery diagnostics, then objectively grade THIS string.
  rendered = stripInternalValidatorDiagnostics(rendered);
  const titles = extractRequestedSectionTitles(userMessage ?? "");
  const finalContract = assessFinalVisibleContract({
    answer: rendered,
    userMessage: userMessage ?? "",
    expectedTopLevelSections: contract?.expectedTopLevelSections ?? null,
    sectionTitles: titles,
    claims: claimObs,
  });

  const ux =
    level === "normal"
      ? assessConversationalUx(rendered)
      : { ok: true, failures: [] as string[] };
  return {
    message: rendered,
    uxFailures: [
      ...ux.failures,
      ...(detectMaterialInternalContradictions(rendered, {
        userMessage: userMessage ?? "",
        canonical: buildCanonicalCaseState(userMessage ?? ""),
      }).length > 0
        ? ["CONSISTENCY_FAILURE"]
        : []),
      ...(countLeftoverSupportedOverrides(rendered) > 0
        ? ["RESOLVED_VERDICT_OVERRIDE_LEFTOVER_SUPPORTED"]
        : []),
      ...finalContract.failures,
    ],
  };
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
  const contract =
    options.taskContract ?? parseExecutiveTaskContract(options.userMessage);
  const multiObligation =
    contract.tasks.length >= 2 ||
    contract.multipart ||
    contract.requiresPremiseAudit ||
    contract.requiresTemporalReconciliation ||
    contract.requiresRecommendation ||
    contract.requiresConditionalReasoning ||
    contract.requiresAuthorityAnalysis;
  const scopedAway = isScopedAwayFromLiveEmpire(contract.scopeType, options.userMessage);

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
    taskContractTaskCount: contract.tasks.length,
    silentlyDroppedMaterialTasks: 0,
    coverageAppendedUnits: 0,
    taskCoverage: null,
  };

  const sealWithCoverage = (
    candidate: string,
    path: ReleaseGateTelemetry["releasePath"],
    priorViolations: string[],
  ): ExecutiveReleaseResult | null => {
    const filled = appendMissingTaskCoverage(candidate, contract, truth);
    const reconstruct =
      multiObligation || scopedAway
        ? buildContractAwareReconstruct(truth, contract)
        : null;

    const queue: Array<{
      text: string;
      path: ReleaseGateTelemetry["releasePath"];
      appended: number;
    }> = [];
    // Clean validated drafts: fill missing parts without discarding the original answer.
    // Prefer coverage fill over full reconstruct — reduce competing semantic inventors.
    queue.push({
      text: filled.message,
      path: filled.appended > 0 && path === "clean" ? "contract_coverage_filled" : path,
      appended: filled.appended,
    });
    const candidateContaminated = isLiveEmpireContaminationInScopedAnswer(
      filled.message,
      truth,
      options.userMessage,
    );
    // Reconstruct only when fill still drops material tasks or contamination — not as a default second author.
    if (
      reconstruct &&
      (candidateContaminated ||
        (filled.coverage.silentlyDroppedTasks > 0 && filled.appended === 0) ||
        path === "fail_closed")
    ) {
      queue.push({
        text: reconstruct,
        path: path === "clean" ? "contract_coverage_filled" : "natural_reconstructed",
        appended: Math.max(1, contract.tasks.length),
      });
    }
    queue.push({ text: candidate, path, appended: 0 });

    const liveTruth =
      Boolean(truth.deploy.gitCommitSha) ||
      truth.deploy.serviceOnlineHint === "assume_online_if_answering";
    const staleOffline = (text: string) =>
      liveTruth &&
      /\b(?:EmpireAI is offline|we(?:'re| are) offline|service is offline|not yet live|pending deployment)\b/i.test(
        text,
      );

    for (const item of queue) {
      if (staleOffline(item.text)) continue;
      const fin = finalizeVisible(item.text, level, options.userMessage, contract);
      if (staleOffline(fin.message)) continue;
      // Hard final-visible contract: section/claim/diagnostic/evidence — fail candidate, never leak diagnostics.
      if (hasHardFinalVisibleFailure(fin.uxFailures)) continue;
      const final = validateExecutiveDraft(fin.message, truth, attestations);
      if (!final.ok) continue;
      const coverage = assessTaskCoverage(fin.message, contract);
      if (
        multiObligation &&
        coverage.silentlyDroppedTasks > 0 &&
        item.appended === 0 &&
        queue.some((q) => q.appended > 0)
      ) {
        continue;
      }
      if (isGlobalEvidenceCollapseReply(fin.message) && multiObligation) {
        continue;
      }
      const clone = detectSiblingTemplateCloning(fin.message, contract);
      if (clone.cloned) {
        continue;
      }
      if (
        isLiveEmpireContaminationInScopedAnswer(
          fin.message,
          truth,
          options.userMessage,
        )
      ) {
        continue;
      }
      telemetry.finalRevalidationPass = true;
      telemetry.supportMonotonicityPass = true;
      telemetry.releasePath = item.path;
      telemetry.uxFailures = fin.uxFailures;
      telemetry.coverageAppendedUnits = item.appended;
      telemetry.taskCoverage = coverage;
      telemetry.silentlyDroppedMaterialTasks = coverage.silentlyDroppedTasks;
      if (item.path !== "clean") telemetry.reconstructionSucceeded = true;
      return {
        message: fin.message,
        released: true,
        violations: priorViolations,
        telemetry,
      };
    }

    telemetry.finalRevalidationPass = false;
    telemetry.supportMonotonicityPass = false;
    return null;
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
    const clean = sealWithCoverage(draft.trim(), "clean", []);
    if (clean) return clean;
  }

  // Attempt 0.5: decision-quality repair (goal≠solution / material-assumption leaps).
  // When multi-obligation, prefer surgical+coverage over whole DQ rewrite.
  const decisionCodes = new Set([
    "GOAL_SOLUTION_CAUSAL_LEAP",
    "MATERIAL_ASSUMPTION_TREATED_AS_ESTABLISHED",
    "UNVERIFIED_SOLUTION_FROM_VERIFIED_GOAL",
  ]);
  if (first.violations.some((v) => decisionCodes.has(v)) && !multiObligation) {
    telemetry.reconstructionAttempted = true;
    telemetry.claimLevelRepairUsed = true;
    const dq = assessDecisionQuality(draft, truth);
    const decisionRepaired = repairDecisionQualityAnswer(draft, truth, dq);
    const releasedDq = sealWithCoverage(decisionRepaired, "claim_repaired", first.violations);
    if (releasedDq) return releasedDq;
  }

  // Attempt 1: claim-level surgical repair (preserve task-specific reasoning).
  telemetry.reconstructionAttempted = true;
  telemetry.claimLevelRepairUsed = true;
  const surgical = surgicalRepairDraft(draft, truth, attestations, {
    userMessage: options.userMessage,
    scopeType: contract.scopeType,
  });
  telemetry.claimsKept = surgical.kept;
  telemetry.claimsDropped = surgical.dropped;

  if (surgical.message && (!surgical.stillContaminated || multiObligation)) {
    const repaired = sealWithCoverage(surgical.message, "claim_repaired", first.violations);
    if (repaired) return repaired;
  }

  // Attempt 2: contract-aware reconstruct (preserves requested parts — not one safe summary).
  // Synthetic / scenario scope must never fall through to live EmpireAI product briefing.
  const natural =
    multiObligation || scopedAway
      ? buildContractAwareReconstruct(truth, contract)
      : buildNaturalExecutiveFallback({
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
  const naturalRelease = sealWithCoverage(natural, "natural_reconstructed", first.violations);
  if (naturalRelease) return naturalRelease;

  // Attempt 3: fail-closed. Multi-obligation never uses the generic whole-answer stub —
  // forced per-obligation completion is the fail-closed surface.
  const closed =
    multiObligation || scopedAway
      ? buildForcedObligationCompletion(truth, contract)
      : failClosedExecutiveAnswer(truth, level);
  const closedFilled = sealWithCoverage(closed, "fail_closed", first.violations);
  if (closedFilled) {
    telemetry.failClosedUsed = true;
    return closedFilled;
  }

  // Ultimate authority: multi-obligation must never collapse to a global UNKNOWN stub.
  // Forced per-obligation completion from verified state is the last safe release —
  // but still must not ship sibling template clones or governance/recovery residue.
  telemetry.failClosedUsed = true;
  if (multiObligation) {
    let forcedRaw = buildForcedObligationCompletion(truth, contract);
    let forcedClone = detectSiblingTemplateCloning(forcedRaw, contract);
    if (forcedClone.cloned) {
      // Rebuild once from contract synthesizers (operation-differentiated) as last resort.
      forcedRaw = buildContractAwareReconstruct(truth, contract);
      forcedClone = detectSiblingTemplateCloning(forcedRaw, contract);
    }
    const forcedFin = finalizeVisible(forcedRaw, level, options.userMessage, contract);
    let stripped = stripIrrelevantLifecycleContamination(
      forcedFin.message,
      options.userMessage,
      contract,
    );
    stripped = stripInternalValidatorDiagnostics(stripped);
    // Ultimate fail-closed: every candidate must pass transport authorize — no bypass.
    const titles = extractRequestedSectionTitles(options.userMessage ?? "");
    const claimObsUltimate = resolveTransportClaimObligations({
      userMessage: options.userMessage ?? "",
      answer: stripped,
      contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
    });
    let auth = authorizeTransportRelease({
      answer: stripped,
      userMessage: options.userMessage ?? "",
      expectedTopLevelSections: contract.expectedTopLevelSections,
      sectionTitles: titles,
      claims: claimObsUltimate,
    });
    if (!auth.authorized) {
      // One more finalize pass then re-authorize.
      stripped = finalizeVisible(stripped, level, options.userMessage, contract).message;
      stripped = stripInternalValidatorDiagnostics(stripped);
      auth = authorizeTransportRelease({
        answer: stripped,
        userMessage: options.userMessage ?? "",
        expectedTopLevelSections: contract.expectedTopLevelSections,
        sectionTitles: titles,
        claims: resolveTransportClaimObligations({
          userMessage: options.userMessage ?? "",
          answer: stripped,
          contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
        }),
      });
    }
    if (!auth.authorized) {
      telemetry.releasePath = "fail_closed";
      telemetry.finalRevalidationPass = false;
      return {
        message: auth.message,
        released: true,
        violations: [...first.violations, "TRANSPORT_CONTRACT_FAIL"],
        telemetry,
      };
    }
    stripped = auth.message;
    const stillCloned = detectSiblingTemplateCloning(stripped, contract);
    if (stillCloned.cloned) {
      // Prefer an explicit local-unknown framing over cloned generic verdicts.
      const lines = contract.tasks.slice(0, 20).map((t, i) => {
        const body = synthesizeTaskUnitAnswer(t, truth, {
          birthRelevant: contract.birthRelevant,
          hypotheticalPremises: contract.hypotheticalPremises,
          scopeType: contract.scopeType,
          materialConstraints: contract.materialConstraints,
          siblingSubjects: contract.tasks.map((x) => x.subject),
        });
        return `### ${i + 1}) ${(t.subject || t.sourceSpan).slice(0, 100)}\n\n${body}`;
      });
      let rebuilt = stripIrrelevantLifecycleContamination(
        lines.join("\n\n"),
        options.userMessage,
        contract,
      );
      rebuilt = finalizeVisible(rebuilt, level, options.userMessage, contract).message;
      rebuilt = stripInternalValidatorDiagnostics(rebuilt);
      const rebuiltAuth = authorizeTransportRelease({
        answer: rebuilt,
        userMessage: options.userMessage ?? "",
        expectedTopLevelSections: contract.expectedTopLevelSections,
        sectionTitles: titles,
        claims: resolveTransportClaimObligations({
          userMessage: options.userMessage ?? "",
          answer: rebuilt,
          contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
        }),
      });
      const rebuiltCoverage = assessTaskCoverage(rebuiltAuth.message, contract);
      telemetry.releasePath = "fail_closed";
      telemetry.finalRevalidationPass = rebuiltAuth.authorized;
      telemetry.reconstructionSucceeded = true;
      telemetry.coverageAppendedUnits = contract.tasks.length;
      telemetry.taskCoverage = rebuiltCoverage;
      telemetry.silentlyDroppedMaterialTasks = rebuiltCoverage.silentlyDroppedTasks;
      return {
        message: rebuiltAuth.message,
        released: true,
        violations: first.violations,
        telemetry,
      };
    }
    const forcedCoverage = assessTaskCoverage(stripped, contract);
    telemetry.releasePath = "fail_closed";
    telemetry.finalRevalidationPass = true;
    telemetry.reconstructionSucceeded = true;
    telemetry.coverageAppendedUnits = contract.tasks.length;
    telemetry.taskCoverage = forcedCoverage;
    telemetry.silentlyDroppedMaterialTasks = forcedCoverage.silentlyDroppedTasks;
    return {
      message: stripped,
      released: true,
      violations: first.violations,
      telemetry,
    };
  }

  // Ultimate authority for single-obligation synthetic: still no live briefing dump.
  if (scopedAway) {
    const forcedRaw = buildForcedObligationCompletion(truth, contract);
    const forcedFin = finalizeVisible(forcedRaw, level, options.userMessage, contract);
    const stripped = stripIrrelevantLifecycleContamination(
      forcedFin.message,
      options.userMessage,
      contract,
    );
    telemetry.releasePath = "fail_closed";
    telemetry.finalRevalidationPass = true;
    telemetry.reconstructionSucceeded = true;
    return {
      message: stripped,
      released: true,
      violations: first.violations,
      telemetry,
    };
  }

  // Single-obligation exceptional global UNKNOWN only when every richer path failed.
  telemetry.releasePath = "fail_closed";
  telemetry.finalRevalidationPass = false;
  telemetry.silentlyDroppedMaterialTasks = 0;
  return {
    message: GLOBAL_EVIDENCE_COLLAPSE_REPLY,
    released: true,
    violations: first.violations,
    telemetry,
  };
}

/**
 * Compatibility entry used by pillow-host and unit tests.
 * LAST_SEMANTIC_WRITER → authorizeTransportRelease → TRANSPORT.
 */
export function enforceExecutiveTruthGrounding(
  answer: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
  options: ReleaseGateOptions = {},
): GroundingEnforcementResult & { telemetry: ReleaseGateTelemetry } {
  const released = releaseExecutiveAnswer(answer, truth, attestations, options);
  const contract =
    options.taskContract ?? parseExecutiveTaskContract(options.userMessage ?? "");
  const claims = resolveTransportClaimObligations({
    userMessage: options.userMessage ?? "",
    answer: released.message,
    contractClaims: parseClaimObligationsFromContractTasks(contract.tasks),
  });
  const auth = authorizeTransportRelease({
    answer: released.message,
    userMessage: options.userMessage ?? "",
    expectedTopLevelSections: contract.expectedTopLevelSections,
    sectionTitles: extractRequestedSectionTitles(options.userMessage ?? ""),
    claims,
  });
  const telemetry = {
    ...released.telemetry,
    uxFailures: auth.authorized
      ? released.telemetry.uxFailures
      : [...released.telemetry.uxFailures, ...auth.assessment.failures],
  };
  return {
    message: auth.message,
    adjusted: released.telemetry.releasePath !== "clean" || !auth.authorized,
    violations: auth.authorized
      ? released.violations
      : [...released.violations, "TRANSPORT_CONTRACT_FAIL"],
    telemetry,
  };
}
