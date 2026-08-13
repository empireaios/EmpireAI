/**
 * Final Executive Release Gate.
 *
 * Invalid drafts must NEVER reach Grand King with an appended correction.
 * Flow: validate → (optional reconstruct) → revalidate → release | fail-closed.
 *
 * Preserves Round-1 capability registry + attestation + detectors.
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
  releasePath: "clean" | "reconstructed" | "fail_closed";
};

export type ExecutiveReleaseResult = {
  message: string;
  released: boolean;
  violations: string[];
  telemetry: ReleaseGateTelemetry;
};

const CORRECTION_APPENDIX_LEAK =
  /\n---\n(?:Grounded corrections|Epistemic corrections)\b/i;

const PROVENANCE_VIOLATIONS = new Set([
  "UNATTESTED_RETRIEVAL_CLAIM",
  "INVENTED_SOURCE_SYSTEM",
  "CAPABILITY_REGISTRY_VIOLATION",
  "PARTIAL_CORRECTION_WITH_RESIDUAL_FABRICATION",
  "INTERNAL_CONTRADICTION",
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

/**
 * Deterministic reconstruction from CURRENT VERIFIED snapshot only.
 * No additional LLM call. Entity-agnostic.
 */
export function reconstructExecutiveAnswer(
  truth: ExecutiveTruthSnapshot,
  violations: readonly string[],
): string {
  const p = truth.product;
  const f = truth.financial;
  const sha = truth.deploy.gitCommitSha;
  const lines: string[] = [];

  lines.push(
    "I can only release claims that survive CURRENT VERIFIED runtime evidence and request-scoped attestation.",
  );

  if (sha || truth.deploy.serviceOnlineHint === "assume_online_if_answering") {
    lines.push(
      `This Brain process is answering live in production${sha ? ` (deployGitCommitSha=${sha})` : ""}.`,
    );
  }

  if (p.asin || p.productName) {
    lines.push(
      `Product identity (CURRENT_VERIFIED): ${p.productName ?? "UNKNOWN"} / ASIN ${p.asin ?? "UNKNOWN"} (commissioningId=${p.commissioningId ?? "UNKNOWN"}; selectionAuthority=${p.selectionAuthority ?? "UNKNOWN"}; cursorSelected=${p.cursorSelected ?? "UNKNOWN"}).`,
    );
  } else {
    lines.push("Product identity: UNKNOWN — no active commissioning product in runtime state.");
  }

  lines.push(
    `Realised commerce (CURRENT_VERIFIED): orders=${f.orders}; realisedRevenueUsd=${f.realisedRevenueUsd}.`,
  );
  if (f.orders === 0 && f.realisedRevenueUsd === 0) {
    lines.push(
      "I have no verified sales history, ratings series, or competitor-analysis evidence beyond that zero realised state. Those claims are UNKNOWN.",
    );
  }

  lines.push(
    `Birth (CURRENT_VERIFIED): status=${truth.birth.status}; birthTimestamp=${truth.birth.birthTimestamp ?? "NULL"}; technicallyReady=${truth.birth.technicallyReady}.`,
  );

  lines.push(
    "I did not retrieve external unattested systems or documents this turn. Claims requiring those sources remain UNKNOWN.",
  );

  if (violations.some((v) => TEMPORAL_VIOLATIONS.has(v))) {
    lines.push(
      "Historical offline-or-pending-deploy language is superseded by current runtime observation.",
    );
  }

  if (violations.some((v) => PROVENANCE_VIOLATIONS.has(v))) {
    lines.push(
      "I cannot currently verify provenance for unattested source systems. UNKNOWN is the correct executive state for those claims.",
    );
  }

  lines.push(
    "Authority boundary (CURRENT_VERIFIED): I cannot autonomously publish, spend, authorise Birth, or execute production deploys from this chat.",
  );

  return lines.join(" ");
}

export function failClosedExecutiveAnswer(truth: ExecutiveTruthSnapshot): string {
  const sha = truth.deploy.gitCommitSha;
  return [
    "I cannot currently verify the broader operating narrative from the evidence available to me in this turn.",
    sha
      ? `What is verified: this Brain process is answering live (deployGitCommitSha=${sha}).`
      : "What is verified: I am answering through the active Brain process.",
    `Realised orders=${truth.financial.orders}; realisedRevenueUsd=${truth.financial.realisedRevenueUsd}.`,
    truth.product.asin
      ? `Bound product ASIN=${truth.product.asin}${truth.product.productName ? ` (${truth.product.productName})` : ""}.`
      : "No bound commissioning product identity is available.",
    "Birth timestamp remains NULL unless Grand King authorises Birth.",
    "Unattested external systems, reports, and communications remain UNKNOWN.",
  ].join(" ");
}

/**
 * Pre-release gate. Never returns invalid draft + correction appendix.
 */
export function releaseExecutiveAnswer(
  draft: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
): ExecutiveReleaseResult {
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
    releasePath: "fail_closed",
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
    telemetry.releasePath = "clean";
    return {
      message: draft.trim(),
      released: true,
      violations: [],
      telemetry,
    };
  }

  // Attempt 1: deterministic reconstruction from runtime_verified state.
  telemetry.reconstructionAttempted = true;
  const reconstructed = reconstructExecutiveAnswer(truth, first.violations);
  const second = validateExecutiveDraft(reconstructed, truth, attestations);
  if (second.ok) {
    telemetry.reconstructionSucceeded = true;
    telemetry.releasePath = "reconstructed";
    return {
      message: reconstructed,
      released: true,
      violations: first.violations,
      telemetry,
    };
  }

  // Attempt 2: fail-closed deterministic UNKNOWN response.
  const closed = failClosedExecutiveAnswer(truth);
  const third = validateExecutiveDraft(closed, truth, attestations);
  telemetry.failClosedUsed = true;
  telemetry.releasePath = "fail_closed";
  // Fail-closed path is designed to be clean; if somehow not, strip to minimal.
  const message = third.ok
    ? closed
    : "I cannot currently verify that from the evidence available to me.";

  return {
    message,
    released: true,
    violations: first.violations,
    telemetry,
  };
}

/**
 * Compatibility entry used by pillow-host and unit tests.
 * Never appends Grounded/Epistemic correction sections to the released message.
 */
export function enforceExecutiveTruthGrounding(
  answer: string,
  truth: ExecutiveTruthSnapshot,
  attestations: readonly RetrievalAttestation[] = [],
): GroundingEnforcementResult & { telemetry: ReleaseGateTelemetry } {
  const released = releaseExecutiveAnswer(answer, truth, attestations);
  return {
    message: released.message,
    adjusted: released.telemetry.releasePath !== "clean",
    violations: released.violations,
    telemetry: released.telemetry,
  };
}
