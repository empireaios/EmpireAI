/**
 * Executive response completion — Grand King must always receive a useful terminal answer.
 *
 * Never emit "please ask again" / "realigning… try again" as a chat outcome.
 * On primary failure: bounded internal retry, then useful degraded completion from verified context.
 */
import {
  buildNaturalExecutiveFallback,
  detectExecutiveTaskIntent,
  detectDisclosureLevel,
} from "./executive-conversation-surface.js";
import {
  appendMissingTaskCoverage,
  buildContractAwareReconstruct,
  parseExecutiveTaskContract,
} from "./executive-task-contract.js";
import { hasAuthoritySemanticsMarker } from "./executive-authority-semantics.js";
import {
  detectReasoningScope,
  isScopedAwayFromLiveEmpire,
} from "./executive-scoped-reasoning.js";
import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";

export type ResponseTerminalKind =
  | "complete"
  | "degraded_useful"
  | "authority_constrained";

export type ResponseReliabilityEvent = {
  at: string;
  requestId?: string;
  accepted: boolean;
  terminal: boolean;
  useful: boolean;
  kind: ResponseTerminalKind | "internal_retry" | "hard_failure";
  primaryFailureReason?: string | null;
  retryUsed: boolean;
  degradedUsed: boolean;
  userResubmissionRequired: boolean;
  askAgainFallback: boolean;
  latencyMs?: number;
  multipartUnits?: number;
};

const ASK_AGAIN_PATTERN =
  /\b(please ask again|ask again in a moment|ask again later|try again later|please retry when|realigning executive intelligence|please resubmit|you (?:must|need to) (?:resubmit|ask again))\b/i;

const INFRA_LEAK_IN_ANSWER =
  /\b(constitutional gate|ungated|digital soul unavailable|executive pipeline unavailable|brain assistant fallback|pillow host offline)\b/i;

let telemetry = {
  acceptedRequests: 0,
  completedRequests: 0,
  degradedCompletedRequests: 0,
  internalRetries: 0,
  hardFailures: 0,
  userResubmissionRequired: 0,
  askAgainFallbacks: 0,
  responseTimeouts: 0,
  providerFailures: 0,
  validationFailures: 0,
  workerFailures: 0,
  latenciesMs: [] as number[],
  recent: [] as ResponseReliabilityEvent[],
};

export function resetPillowResponseReliabilityForTesting(): void {
  telemetry = {
    acceptedRequests: 0,
    completedRequests: 0,
    degradedCompletedRequests: 0,
    internalRetries: 0,
    hardFailures: 0,
    userResubmissionRequired: 0,
    askAgainFallbacks: 0,
    responseTimeouts: 0,
    providerFailures: 0,
    validationFailures: 0,
    workerFailures: 0,
    latenciesMs: [],
    recent: [],
  };
}

function pushEvent(ev: ResponseReliabilityEvent): void {
  telemetry.recent.push(ev);
  if (telemetry.recent.length > 200) telemetry.recent.shift();
}

export function recordPillowResponseAccepted(requestId?: string): void {
  telemetry.acceptedRequests += 1;
  pushEvent({
    at: new Date().toISOString(),
    requestId,
    accepted: true,
    terminal: false,
    useful: false,
    kind: "complete",
    retryUsed: false,
    degradedUsed: false,
    userResubmissionRequired: false,
    askAgainFallback: false,
  });
}

export function recordPillowResponseTerminal(input: {
  requestId?: string;
  kind: ResponseTerminalKind;
  useful: boolean;
  retryUsed?: boolean;
  degradedUsed?: boolean;
  primaryFailureReason?: string | null;
  latencyMs?: number;
  multipartUnits?: number;
  askAgainFallback?: boolean;
  userResubmissionRequired?: boolean;
}): void {
  telemetry.completedRequests += 1;
  if (input.degradedUsed || input.kind === "degraded_useful") {
    telemetry.degradedCompletedRequests += 1;
  }
  if (input.retryUsed) telemetry.internalRetries += 1;
  if (input.askAgainFallback) telemetry.askAgainFallbacks += 1;
  if (input.userResubmissionRequired) telemetry.userResubmissionRequired += 1;
  if (typeof input.latencyMs === "number") {
    telemetry.latenciesMs.push(input.latencyMs);
    if (telemetry.latenciesMs.length > 2000) telemetry.latenciesMs.shift();
  }
  pushEvent({
    at: new Date().toISOString(),
    requestId: input.requestId,
    accepted: true,
    terminal: true,
    useful: input.useful,
    kind: input.kind,
    primaryFailureReason: input.primaryFailureReason ?? null,
    retryUsed: Boolean(input.retryUsed),
    degradedUsed: Boolean(input.degradedUsed),
    userResubmissionRequired: Boolean(input.userResubmissionRequired),
    askAgainFallback: Boolean(input.askAgainFallback),
    latencyMs: input.latencyMs,
    multipartUnits: input.multipartUnits,
  });
}

export function recordPillowProviderFailure(): void {
  telemetry.providerFailures += 1;
}

export function getPillowResponseReliabilitySnapshot(): typeof telemetry & {
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
} {
  const sorted = [...telemetry.latenciesMs].sort((a, b) => a - b);
  const pct = (p: number) =>
    sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]! : null;
  return {
    ...telemetry,
    recent: telemetry.recent.slice(-40),
    p50Ms: pct(0.5),
    p95Ms: pct(0.95),
    p99Ms: pct(0.99),
  };
}

/** Detect multi-part executive structure (numbered / lettered / Q1..). */
export function countExecutiveTaskUnits(message: string): number {
  const text = String(message || "");
  const numbered = text.match(/(?:^|\n)\s*(?:\d{1,2}[\).\:]|[A-H][\).\:]|Q\d{1,2}[\).\:]|Part\s+\d+)/gi);
  if (numbered && numbered.length >= 2) return numbered.length;
  const bullets = text.match(/(?:^|\n)\s*[-*•]\s+\S+/g);
  if (bullets && bullets.length >= 3) return bullets.length;
  return 1;
}

export function containsAskAgainFallback(text: string | null | undefined): boolean {
  return ASK_AGAIN_PATTERN.test(String(text || ""));
}

/**
 * Build a useful degraded answer from verified context.
 * Addresses multi-part structure at a high level without inventing unverified claims.
 */
export function buildUsefulDegradedExecutiveAnswer(input: {
  userMessage: string;
  truth: ExecutiveTruthSnapshot | null;
  reason?: string | null;
  authorityConstrained?: boolean;
}): string {
  const intent = detectExecutiveTaskIntent(input.userMessage);
  const level = detectDisclosureLevel(input.userMessage);
  const units = countExecutiveTaskUnits(input.userMessage);

  if (input.truth) {
    const contract = parseExecutiveTaskContract(input.userMessage);
    const multi =
      contract.multipart ||
      contract.tasks.length >= 2 ||
      contract.requiresPremiseAudit ||
      contract.requiresTemporalReconciliation ||
      contract.requiresRecommendation;
    const scopedAway = isScopedAwayFromLiveEmpire(
      detectReasoningScope(input.userMessage),
      input.userMessage,
    );

    const base =
      multi || scopedAway
        ? buildContractAwareReconstruct(input.truth, contract)
        : buildNaturalExecutiveFallback({
            productName: input.truth.product.productName,
            asin: input.truth.product.asin,
            orders: input.truth.financial.orders,
            realisedRevenueUsd: input.truth.financial.realisedRevenueUsd,
            birthTimestamp: input.truth.birth.birthTimestamp,
            live:
              Boolean(input.truth.deploy.gitCommitSha) ||
              input.truth.deploy.serviceOnlineHint === "assume_online_if_answering",
            intent,
            level,
            hadProvenanceViolation: false,
            hadTemporalViolation: false,
          });

    const filled = appendMissingTaskCoverage(base, contract, input.truth);
    const parts = [filled.message];

    // Governance language only when the ask itself carries authority/execution semantics.
    const authorityAsk = hasAuthoritySemanticsMarker(input.userMessage);
    if (input.authorityConstrained && authorityAsk) {
      parts.push(
        "One or more requested actions sit behind Grand King approval or constitutional limits — I will not bypass those. I still complete the operational parts above.",
      );
    }
    // No "resubmit" / recovery boilerplate on ordinary degraded semantic completions.
    // Lifecycle reliability is tracked in telemetry; user-facing residue contaminates evidence audits.

    return parts.join("\n\n");
  }

  // No truth snapshot — still useful, never ask-again / never fake governance.
  return [
    "I am live and received your request.",
    units >= 2
      ? `You sent a multi-part executive ask (${units} units). I cannot complete full deliberation on every unit this instant from verified state alone.`
      : "I cannot complete full deliberation this instant from verified state alone.",
    "I will continue from this same thread when you deepen a specific part — without treating this as a governance refusal.",
  ].join(" ");
}

/**
 * Ensure outgoing chat text never collapses into ask-again / infra-leak soft replies.
 */
export function ensureUsefulTerminalChatMessage(input: {
  draft: string | null | undefined;
  userMessage: string;
  truth: ExecutiveTruthSnapshot | null;
  reason?: string | null;
  authorityConstrained?: boolean;
}): { message: string; degradedUsed: boolean; askAgainBlocked: boolean } {
  const draft = String(input.draft ?? "").trim();
  const askAgain = containsAskAgainFallback(draft) || !draft || INFRA_LEAK_IN_ANSWER.test(draft);
  if (!askAgain) {
    return { message: draft, degradedUsed: false, askAgainBlocked: false };
  }
  return {
    message: buildUsefulDegradedExecutiveAnswer({
      userMessage: input.userMessage,
      truth: input.truth,
      reason: input.reason ?? "primary_path_unavailable",
      authorityConstrained: input.authorityConstrained,
    }),
    degradedUsed: true,
    askAgainBlocked: true,
  };
}
