import { ApprovalGateEngine } from "../pillow-approval/approval-gate-engine.js";
import {
  getCanonicalApprovalGate,
  wireCanonicalPillowApprovalPipeline,
} from "../pillow-approval/canonical-pillow-approval-pipeline.js";
import type { PillowHost } from "../pillow-host/pillow-host.js";

let fallbackGate: ApprovalGateEngine | null = null;

/**
 * Resolve an ApprovalGateEngine for commerce pre-sale without requiring a chat prompt.
 * Prefers running Pillow host gate; otherwise a durable fallback wired into the canonical pipeline.
 */
export function getPresaleApprovalGate(pillowHost?: PillowHost | null): ApprovalGateEngine {
  if (pillowHost) {
    try {
      if (pillowHost.getStatus().lifecycle === "running") {
        const gate = pillowHost.getApprovalGate();
        wireCanonicalPillowApprovalPipeline(gate);
        return gate;
      }
    } catch {
      /* fall through */
    }
  }

  const canonical = getCanonicalApprovalGate();
  if (canonical) return canonical;

  if (!fallbackGate) {
    fallbackGate = new ApprovalGateEngine();
    wireCanonicalPillowApprovalPipeline(fallbackGate);
  }
  return fallbackGate;
}

/** Call after Pillow host reaches running so approvals share the production gate. */
export function syncPresaleApprovalGateWithPillowHost(pillowHost: PillowHost): void {
  try {
    if (pillowHost.getStatus().lifecycle !== "running") return;
    wireCanonicalPillowApprovalPipeline(pillowHost.getApprovalGate());
  } catch {
    /* keep fallback */
  }
}
