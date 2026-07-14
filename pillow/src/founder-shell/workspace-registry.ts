import type { FounderWorkspaceRecord } from "./types.js";
import { FOUNDER_NAVIGATION_REGISTRY } from "./navigation-registry.js";

/** All founder workspaces including auxiliary surfaces (P7-01). */
export const FOUNDER_WORKSPACE_REGISTRY: readonly FounderWorkspaceRecord[] = [
  ...FOUNDER_NAVIGATION_REGISTRY.map((nav) => ({
    id: nav.workspaceId,
    label: nav.label,
    cockpitRoute: nav.cockpitRoute,
    status: "ready" as const,
    integrated: true,
  })),
  {
    id: "notifications",
    label: "Notifications",
    cockpitRoute: "/cockpit",
    status: "ready",
    integrated: true,
  },
];

export function getFounderWorkspaceById(id: string): FounderWorkspaceRecord | undefined {
  return FOUNDER_WORKSPACE_REGISTRY.find((w) => w.id === id);
}
