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
export const EXECUTIVE_NOT_READY_REPLY =
  "I am finishing startup of Executive Intelligence. Please wait a moment, then ask again — I will be ready shortly.";
export const EXECUTIVE_PIPELINE_SOFT_REPLY =
  "I am realigning Executive Intelligence to answer properly. Please ask again in a moment.";
export const EXECUTIVE_READY_LABEL = "Ready";

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

/** Sanitize chat reply content — never show startup banners as answers. */
export function toExecutiveChatMessage(
  raw: string | null | undefined,
  fallback: string = EXECUTIVE_PIPELINE_SOFT_REPLY,
): string {
  const text = String(raw ?? "").trim();
  if (!text) return fallback;
  if (leaksInternalArchitecture(text)) return fallback;
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
