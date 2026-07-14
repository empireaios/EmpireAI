/** T1-08 — Visual memory record metadata generation. */

import { MEMORY_RECORD_VERSION } from "./paths.js";

export function buildMemoryRecordId(sessionId: string, sequence: number): string {
  return `vmem-${sessionId}-${sequence}`;
}

export function buildStateSummary(input: {
  screenId: string | null;
  regionCount: number;
  componentCount: number;
  layoutRegionCount: number;
  interactionCount: number;
  workflowName: string | null;
  contextState: string | null;
}): string {
  const parts = [
    input.screenId ? `screen:${input.screenId}` : "screen:unknown",
    `regions:${input.regionCount}`,
    `components:${input.componentCount}`,
    `layout:${input.layoutRegionCount}`,
    `interactions:${input.interactionCount}`,
  ];
  if (input.workflowName) parts.push(`workflow:${input.workflowName}`);
  if (input.contextState) parts.push(`state:${input.contextState}`);
  return parts.join(" · ");
}

export function buildChangeSummaryText(
  changeSummary: string | null,
  uiChanged: boolean,
  layoutChanged: boolean,
): string | null {
  if (changeSummary) return changeSummary;
  if (uiChanged || layoutChanged) {
    const parts: string[] = [];
    if (uiChanged) parts.push("UI state changed");
    if (layoutChanged) parts.push("Layout changed");
    return parts.join("; ");
  }
  return null;
}

export function buildRecordMetadataVersion(): string {
  return MEMORY_RECORD_VERSION;
}
