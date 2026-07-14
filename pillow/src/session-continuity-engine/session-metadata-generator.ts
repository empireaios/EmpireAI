/** T1-09 — Session continuity metadata generation. */

import { SESSION_CONTINUITY_VERSION } from "./paths.js";
import type { StableStateKind } from "./types.js";

export function buildSessionContinuityId(sessionId: string, sequence: number): string {
  return `scont-${sessionId}-${sequence}`;
}

export function inferStableState(contextState: string | null): StableStateKind | null {
  if (!contextState) return null;
  if (["browsing", "searching", "filtering", "navigation"].includes(contextState)) {
    return "browsing";
  }
  if (["editing", "creating", "form_completion", "submitting"].includes(contextState)) {
    return "editing";
  }
  if (["reviewing", "comparing", "approving", "rejecting"].includes(contextState)) {
    return "reviewing";
  }
  if (["configuring", "selecting"].includes(contextState)) {
    return "configuring";
  }
  if (["waiting", "loading"].includes(contextState)) {
    return "waiting";
  }
  return "browsing";
}

export function buildMetadataVersion(): string {
  return SESSION_CONTINUITY_VERSION;
}
