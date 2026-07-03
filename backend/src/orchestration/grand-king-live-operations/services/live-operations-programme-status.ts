/**
 * G7 — Live operations programme status helpers.
 */

import type { createGrandKingLiveOperationsModuleContract } from "../contract/live-operations-module.js";

export const LIVE_OPERATIONS_ESTABLISHED_STATUSES = [
  "live-operations-framework-established",
  "live-operations-version-1-certified",
] as const;

export function isLiveOperationsProgrammeEstablished(
  liveOps: ReturnType<typeof createGrandKingLiveOperationsModuleContract>,
): boolean {
  return (LIVE_OPERATIONS_ESTABLISHED_STATUSES as readonly string[]).includes(liveOps.programmeStatus);
}
