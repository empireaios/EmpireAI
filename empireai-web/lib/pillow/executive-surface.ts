/**
 * Grand King–facing surface language for Pillow.
 * Internal architecture details stay in logs only — never in Cockpit UX.
 *
 * Repair 2 invariant: a lifecycle / recovery mechanism is never a completed
 * executive answer. Soft "verified operating state / catching up" copy must
 * not appear as normal success content.
 */

export type ExecutiveReadinessPhase = "starting" | "recovering" | "ready" | "delayed";

const INFRA_LEAK_PATTERNS: RegExp[] = [
  /brain assistant fallback/i,
  /fallback is disabled/i,
  /digital soul unavailable/i,
  /restore (the )?pillow host/i,
  /constitutional gate/i,
  /executive pipeline unavailable/i,
  /executive routing/i,
  /pillow host offline/i,
  /pillow host session unavailable/i,
  /pillow host is (starting|not running)/i,
  /pillow host connection failed/i,
  /pillow request failed/i,
  /check network and try again/i,
  /brain may still be processing/i,
  /using brain assistant/i,
  /digital soul (gate|participation)/i,
  /ungated/i,
  /brain_fallback/i,
  /openaiintegrationlayer/i,
  /gateexecutiveconversation/i,
  /worker proxy timed out/i,
];

/** Forbidden on normal successfully accepted reasoning answers. */
const FORBIDDEN_LIFECYCLE_RESIDUE: RegExp[] = [
  /deliberation may still be catching up/i,
  /full deliberation may still/i,
  /do not need to resubmit/i,
  /i will not ask you to resubmit/i,
  /you do not need to send it again/i,
  /verified operating state now/i,
  /can answer from verified operating state/i,
  /continuing from this (?:same )?request/i,
  /no need to resend/i,
  /bringing Executive Intelligence fully online/i,
  /realigning executive intelligence/i,
];

export const EXECUTIVE_STARTING_LABEL = "Preparing Executive Intelligence…";
export const EXECUTIVE_RECOVERING_LABEL = "Starting Executive Systems…";
export const EXECUTIVE_DELAYED_LABEL =
  "Executive Intelligence is taking a moment longer. Continuing automatically…";

/**
 * Honest terminal when the accepted request did not produce a completed
 * executive answer. Certification must treat this as semantic failure.
 */
export const EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY =
  "I accepted your request, but a completed executive answer was not produced within the infrastructure budget. This is a temporary system limit — not a judgment on your ask. The system retains ownership of this accepted request for internal recovery.";

/**
 * @deprecated Repair 2: never use soft success fallback. Alias kept so call sites
 * that still pass the old symbol receive the terminal (certification-failing) surface.
 */
export const EXECUTIVE_PIPELINE_SOFT_REPLY = EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY;

/** Startup / not-ready — also not a completed executive answer. */
export const EXECUTIVE_NOT_READY_REPLY = EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY;

export const EXECUTIVE_READY_LABEL = "Ready";
export const EXECUTIVE_WIDGET_LOADING = "Loading…";
export const EXECUTIVE_WIDGET_EMPTY = "Nothing to report right now.";
export const EXECUTIVE_WIDGET_ERROR =
  "This view is temporarily unavailable. Continuing with the rest of Executive Home.";
export const EXECUTIVE_SYNC_READY = "READY";
export const EXECUTIVE_SYNC_CONNECTING = "Connecting…";
export const EXECUTIVE_SYNC_REFRESHING = "Refreshing…";

export function leaksInternalArchitecture(text: string | null | undefined): boolean {
  if (!text) return false;
  return INFRA_LEAK_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasForbiddenLifecycleResidue(text: string | null | undefined): boolean {
  if (!text) return false;
  return FORBIDDEN_LIFECYCLE_RESIDUE.some((pattern) => pattern.test(text));
}

export function isTerminalInfrastructureSurface(text: string | null | undefined): boolean {
  const t = String(text ?? "");
  if (!t.trim()) return true;
  if (/completed executive answer was not produced/i.test(t)) return true;
  if (/deep reasoning path could not finish after bounded recovery/i.test(t)) return true;
  if (/temporary (?:system|infrastructure) limit/i.test(t) && /not (?:a judgment|a question about your task)/i.test(t)) {
    return true;
  }
  return false;
}

function stripInfraLeakSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !leaksInternalArchitecture(s))
    .join("\n")
    .trim();
}

/** Map any infra/developer string to executive-grade Grand King language. */
export function toExecutiveSurfaceMessage(
  raw: string | null | undefined,
  fallback: string = EXECUTIVE_STARTING_LABEL,
): string {
  const text = String(raw ?? "").trim();
  if (!text) return fallback;
  if (leaksInternalArchitecture(text)) {
    if (/unavailable|offline|not running|failed|restore/i.test(text)) {
      return EXECUTIVE_RECOVERING_LABEL;
    }
    if (/timed out|taking longer|automatically/i.test(text)) {
      return EXECUTIVE_DELAYED_LABEL;
    }
    return EXECUTIVE_STARTING_LABEL;
  }
  return text;
}

/**
 * Sanitize chat reply content for Grand King visibility.
 * Never invent a soft "I can answer now / catching up" success answer.
 * Empty, leak-only, or ask-again bodies become honest terminal infrastructure.
 */
export function toExecutiveChatMessage(
  raw: string | null | undefined,
  fallback: string = EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
): string {
  const text = String(raw ?? "").trim();
  const safeFallback = hasForbiddenLifecycleResidue(fallback)
    ? EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY
    : /ask again|try again later|please retry|please send the same ask/i.test(fallback)
      ? EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY
      : fallback;

  if (!text) return safeFallback;
  if (hasForbiddenLifecycleResidue(text)) return EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY;
  if (/ask again|please send the same ask|try again later|resubmit|re-?send the (?:same )?ask/i.test(text)) {
    return EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY;
  }
  if (isTerminalInfrastructureSurface(text)) {
    return EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY;
  }

  if (leaksInternalArchitecture(text)) {
    const stripped = stripInfraLeakSentences(text);
    if (stripped.length >= 80 && !leaksInternalArchitecture(stripped)) {
      return stripped;
    }
    return safeFallback;
  }

  return text;
}

export function readinessLabel(phase: ExecutiveReadinessPhase): string {
  switch (phase) {
    case "ready":
      return EXECUTIVE_READY_LABEL;
    case "recovering":
      return EXECUTIVE_RECOVERING_LABEL;
    case "delayed":
      return EXECUTIVE_DELAYED_LABEL;
    case "starting":
    default:
      return EXECUTIVE_STARTING_LABEL;
  }
}
