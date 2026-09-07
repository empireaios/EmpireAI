/**
 * BFF chat sanitize + valid-answer preservation.
 * Infrastructure only — does not change Pillow reasoning.
 *
 * INVARIANT: nonempty successful brain answer must never become the
 * infrastructure-budget terminal. Footers may be stripped; meaning preserved.
 */
import {
  hashText,
  newShellTraceId,
  previewText,
  recordShellDeliveryTrace,
  type DeliveryClass,
  type FailureClass,
  type ShellDeliveryTrace,
} from "./shell-delivery-observability";

/** Truthful terminal for genuine empty/timeout/upstream failure — no durable-recovery claim. */
export const DEGRADED_CHAT_MESSAGE = [
  "I accepted your request, but a completed executive answer was not produced in this response window.",
  "This is a temporary production-shell / transport limit — not a judgment on your ask.",
  "Please retry the same ask; there is no durable background recovery after this reply.",
].join(" ");

/** @deprecated alias kept for tests expecting prior export name */
export const LEGACY_INFRASTRUCTURE_BUDGET_PHRASE =
  "completed executive answer was not produced within the infrastructure budget";

export function extractPillowChatMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      result?: { message?: string };
      message?: string;
      assistantMessage?: { content?: string };
    };
    return String(
      parsed?.result?.message ??
        parsed?.message ??
        parsed?.assistantMessage?.content ??
        "",
    ).trim();
  } catch {
    return "";
  }
}

/**
 * Remove only pure protected-state footer lines / sentences.
 * Does not discard substantive lines that merely mention product focus.
 */
export function stripForbiddenInfraDecoration(message: string, userAsk: string): string {
  const ask = String(userAsk || "");
  const synthetic =
    /\b(?:synthetic(?:canary)?|scenario\s+only|do\s+not\s+mention\s+(?:empireai|birth))\b/i.test(
      ask,
    );
  const stripProtectedFooters = synthetic || !/\bbirth\b/i.test(ask);

  const isPureFooterLine = (line: string): boolean => {
    if (/\btell me which (?:theme|part) to deepen\b/i.test(line)) return true;
    if (/\bworker proxy timed out\b/i.test(line)) return true;
    if (!stripProtectedFooters) return false;
    // Whole-line footer patterns (optional leading bullets/emphasis).
    if (
      /^(?:[-*•]\s*)?(?:\*\*)?(?:current\s+)?product focus\b/i.test(line) ||
      /^(?:[-*•]\s*)?(?:\*\*)?we have (?:no |some )?realised commerce\b/i.test(line) ||
      /^(?:[-*•]\s*)?(?:\*\*)?birth remains unauthoris/i.test(line) ||
      /^(?:[-*•]\s*)?(?:\*\*)?commissioning state\b/i.test(line)
    ) {
      return true;
    }
    // Short trailer sentences that are only commissioning boilerplate.
    if (
      line.length < 160 &&
      /^(?:[-*•]\s*)?(?:current product focus is|realised commerce|birth remains)/i.test(line) &&
      !/\b(?:select|recommend|contribution|eligible|gate|supplier|margin)\b/i.test(line)
    ) {
      return true;
    }
    return false;
  };

  const lines = String(message || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const kept = lines.filter((line) => !isPureFooterLine(line));
  let out = kept.join("\n").trim();

  // Sentence-level cleanup inside kept paragraphs (do not wipe the paragraph).
  if (stripProtectedFooters && out) {
    out = out
      .replace(
        /(?:^|[.!?]\s+)(?:Current product focus is[^.!?\n]*[.!?]?)/gi,
        (m) => (m.startsWith(".") || m.startsWith("!") || m.startsWith("?") ? m[0]! : ""),
      )
      .replace(
        /(?:^|[.!?]\s+)(?:We have (?:no |some )?realised commerce[^.!?\n]*[.!?]?)/gi,
        (m) => (m.startsWith(".") || m.startsWith("!") || m.startsWith("?") ? m[0]! : ""),
      )
      .replace(
        /(?:^|[.!?]\s+)(?:Birth remains unauthoris[^.!?\n]*[.!?]?)/gi,
        (m) => (m.startsWith(".") || m.startsWith("!") || m.startsWith("?") ? m[0]! : ""),
      )
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  return out;
}

export function isTransportFailureMessage(message: string): boolean {
  return /\bworker proxy timed out\b/i.test(message);
}

export type BffChatDegradeDecision =
  | {
      degrade: true;
      reason: "upstream_non_2xx" | "transport_failure_message" | "brain_empty";
      failureClass: FailureClass;
      brainExtracted: string;
      deliveredMessage: string;
      stripped: boolean;
      deliveryClass: DeliveryClass;
      brainToUserEquivalent: boolean;
    }
  | {
      degrade: false;
      reason: null;
      failureClass: "NONE";
      brainExtracted: string;
      message: string;
      stripped: boolean;
      deliveryClass: DeliveryClass;
      brainToUserEquivalent: boolean;
      /**
       * When strip emptied mixed content incorrectly in older logic, we preserve
       * the original nonempty brain body rather than emit a terminal.
       */
      preservedOriginalBecauseStripEmpty: boolean;
    };

/**
 * Decide BFF surface with hard invariant:
 * SUCCESS + nonempty brain → DEGRADED_TERMINAL_ALLOWED=NO.
 */
export function decideBffChatSurface(input: {
  upstreamOk: boolean;
  rawBody: string;
  userAsk: string;
}): BffChatDegradeDecision {
  const extracted = extractPillowChatMessage(input.rawBody);
  const stripped = stripForbiddenInfraDecoration(extracted, input.userAsk);

  if (!input.upstreamOk) {
    // Prefer forwarding nonempty brain body even on odd status if present.
    if (extracted.length > 0) {
      const message = stripped.length > 0 ? stripped : extracted;
      return {
        degrade: false,
        reason: null,
        failureClass: "NONE",
        brainExtracted: extracted,
        message,
        stripped: message !== extracted,
        deliveryClass:
          message === extracted ? "BRAIN_ANSWER_UNCHANGED" : "ALLOWED_FORMAT_TRANSFORM",
        brainToUserEquivalent: true,
        preservedOriginalBecauseStripEmpty: stripped.length === 0,
      };
    }
    return {
      degrade: true,
      reason: "upstream_non_2xx",
      failureClass: "TRANSPORT_ERROR",
      brainExtracted: extracted,
      deliveredMessage: DEGRADED_CHAT_MESSAGE,
      stripped: false,
      deliveryClass: "DEGRADED_TERMINAL",
      brainToUserEquivalent: false,
    };
  }

  if (isTransportFailureMessage(extracted) && extracted.length < 120) {
    return {
      degrade: true,
      reason: "transport_failure_message",
      failureClass: "TRANSPORT_ERROR",
      brainExtracted: extracted,
      deliveredMessage: DEGRADED_CHAT_MESSAGE,
      stripped: false,
      deliveryClass: "DEGRADED_TERMINAL",
      brainToUserEquivalent: false,
    };
  }

  // INVARIANT: nonempty brain success never becomes degraded terminal.
  if (extracted.length > 0) {
    if (stripped.length > 0) {
      return {
        degrade: false,
        reason: null,
        failureClass: "NONE",
        brainExtracted: extracted,
        message: stripped,
        stripped: stripped !== extracted,
        deliveryClass:
          stripped === extracted ? "BRAIN_ANSWER_UNCHANGED" : "ALLOWED_FORMAT_TRANSFORM",
        brainToUserEquivalent: true,
        preservedOriginalBecauseStripEmpty: false,
      };
    }
    // Strip removed everything — deliver original nonempty brain answer.
    return {
      degrade: false,
      reason: null,
      failureClass: "NONE",
      brainExtracted: extracted,
      message: extracted,
      stripped: false,
      deliveryClass: "BRAIN_ANSWER_UNCHANGED",
      brainToUserEquivalent: true,
      preservedOriginalBecauseStripEmpty: true,
    };
  }

  return {
    degrade: true,
    reason: "brain_empty",
    failureClass: "BRAIN_EMPTY",
    brainExtracted: extracted,
    deliveredMessage: DEGRADED_CHAT_MESSAGE,
    stripped: false,
    deliveryClass: "DEGRADED_TERMINAL",
    brainToUserEquivalent: false,
  };
}

export function buildShellTraceFromDecision(input: {
  decision: BffChatDegradeDecision;
  upstreamStatus: number;
  httpStatus: number;
  sessionId?: string | null;
  requestId?: string | null;
  component?: string;
}): ShellDeliveryTrace {
  const d = input.decision;
  const delivered = d.degrade ? d.deliveredMessage : d.message;
  const brainHash = hashText(d.brainExtracted);
  const shellHash = hashText(delivered);
  const materialChange = brainHash !== shellHash;
  const trace: ShellDeliveryTrace = {
    traceId: newShellTraceId(),
    requestId: input.requestId ?? null,
    sessionId: input.sessionId ?? null,
    ts: new Date().toISOString(),
    brainCompletionState:
      d.brainExtracted.length > 0 ? "SUCCESS" : input.upstreamStatus >= 500 ? "ERROR" : "EMPTY",
    brainOutputValidNonempty: d.brainExtracted.length > 0,
    brainOutputLength: d.brainExtracted.length,
    brainOutputHash: brainHash,
    brainOutputPreview: previewText(d.brainExtracted),
    shellComponent: input.component ?? "bff.decideBffChatSurface",
    transformReason: d.degrade
      ? d.reason
      : d.stripped
        ? "footer_strip"
        : "preservedOriginalBecauseStripEmpty" in d && d.preservedOriginalBecauseStripEmpty
          ? "preserve_nonempty_brain_after_empty_strip"
          : null,
    materialChange,
    shellOutputHash: shellHash,
    shellOutputLength: delivered.length,
    deliveryClass: d.deliveryClass,
    failureClass: d.failureClass,
    brainToUserEquivalent: d.brainToUserEquivalent,
    degradeReason: d.degrade ? d.reason : null,
    httpStatus: input.httpStatus,
    upstreamStatus: input.upstreamStatus,
  };
  recordShellDeliveryTrace(trace);
  return trace;
}
