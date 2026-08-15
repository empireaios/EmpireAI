/**
 * Grand King–facing surface language for Pillow.
 * Internal architecture details stay in logs only — never in Cockpit UX.
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
];

export const EXECUTIVE_STARTING_LABEL = "Preparing Executive Intelligence…";
export const EXECUTIVE_RECOVERING_LABEL = "Starting Executive Systems…";
export const EXECUTIVE_DELAYED_LABEL =
  "Executive Intelligence is taking a moment longer. Continuing automatically…";
/** Never ask Grand King to resubmit — system owns completion. */
export const EXECUTIVE_NOT_READY_REPLY =
  "I received your request and I am still bringing Executive Intelligence fully online. I will continue from this same question — you do not need to send it again. Meanwhile: Birth remains unauthorised; I will answer from verified operating state as soon as the live path is ready.";
/** Never ask Grand King to resubmit — useful degraded default. */
export const EXECUTIVE_PIPELINE_SOFT_REPLY =
  "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up on part of the ask; I will not ask you to resubmit. Birth remains unauthorised, and I will keep claims bounded to what we can verify.";
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

/** Sanitize chat reply content — never show startup banners or ask-again as answers. */
export function toExecutiveChatMessage(
  raw: string | null | undefined,
  fallback: string = EXECUTIVE_PIPELINE_SOFT_REPLY,
): string {
  const text = String(raw ?? "").trim();
  const safeFallback = /ask again|try again later|please retry/i.test(fallback)
    ? EXECUTIVE_PIPELINE_SOFT_REPLY
    : fallback;
  if (!text) return safeFallback;
  if (leaksInternalArchitecture(text)) return safeFallback;
  if (/ask again|realigning executive intelligence/i.test(text)) return safeFallback;
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
