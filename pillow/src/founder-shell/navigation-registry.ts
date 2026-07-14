import type { FounderNavigationItem } from "./types.js";

/** Canonical founder navigation — maps to Cockpit routes (P7-01 · P7-02). */
export const FOUNDER_NAVIGATION_REGISTRY: readonly FounderNavigationItem[] = [
  {
    id: "executive_home",
    label: "Executive Home",
    workspaceId: "executive_home",
    cockpitRoute: "/cockpit",
    description: "Executive summary — empire health, mission, builder, alerts, Pillow",
  },
  {
    id: "mission_centre",
    label: "Mission Centre",
    workspaceId: "mission_centre",
    cockpitRoute: "/cockpit/missions",
    description: "Active missions · progress · ETA · queue",
  },
  {
    id: "pillow",
    label: "Pillow Centre",
    workspaceId: "pillow_workspace",
    cockpitRoute: "/cockpit/development/pillow",
    description: "Primary executive advisor — Pillow conversation and intelligence",
  },
  {
    id: "builder",
    label: "Builder Console",
    workspaceId: "builder_workspace",
    cockpitRoute: "/cockpit/founder/builder",
    description: "Builder mission progress, ETA, repository activity, recovery",
  },
  {
    id: "supervisor",
    label: "Supervisor Centre",
    workspaceId: "supervisor_workspace",
    cockpitRoute: "/cockpit/founder/supervisor",
    description: "Current mission · progress · step · ETA · recovery",
  },
  {
    id: "journey",
    label: "Journey Centre",
    workspaceId: "journey_workspace",
    cockpitRoute: "/cockpit/founder/journey",
    description: "Empire journey position, roadmap, mission history",
  },
  {
    id: "production",
    label: "Production Centre",
    workspaceId: "production_workspace",
    cockpitRoute: "/cockpit/founder/production",
    description: "Production truth, deployment status, browser verification",
  },
  {
    id: "guardian",
    label: "Guardian Centre",
    workspaceId: "guardian_workspace",
    cockpitRoute: "/cockpit/founder/guardian",
    description: "Runtime health · infrastructure · performance · alerts",
  },
  {
    id: "businesses",
    label: "Business Centre",
    workspaceId: "business_workspace",
    cockpitRoute: "/cockpit/commerce/workspace",
    description: "Business portfolio workspace",
  },
  {
    id: "commerce",
    label: "Commerce Centre",
    workspaceId: "commerce_workspace",
    cockpitRoute: "/cockpit/commerce/store",
    description: "Commerce operations — store, launch, marketing, ads",
  },
  {
    id: "knowledge",
    label: "Knowledge Centre",
    workspaceId: "knowledge",
    cockpitRoute: "/cockpit/founder/architecture",
    description: "Repository architecture intelligence and executive knowledge",
  },
  {
    id: "settings",
    label: "Settings",
    workspaceId: "settings",
    cockpitRoute: "/cockpit/governance/settings",
    description: "Governance settings and founder preferences",
  },
] as const;

export function getFounderNavById(id: string): FounderNavigationItem | undefined {
  return FOUNDER_NAVIGATION_REGISTRY.find((item) => item.id === id);
}
