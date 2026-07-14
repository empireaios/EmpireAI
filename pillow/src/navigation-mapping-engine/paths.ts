/** PILLOW-NME-001 — Navigation Mapping Engine paths (T1-05). */

export const NAVIGATION_MAPPING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_NAVIGATION_MAPPING_SYSTEM.md";

export const NAVIGATION_GRAPH_VERSION = "1.0.0" as const;

export const MAPPING_STATUSES = [
  "idle",
  "mapping",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const NODE_KINDS = [
  "screen",
  "page",
  "route",
  "view",
  "modal",
  "drawer",
  "tab",
  "step",
  "nav_item",
  "breadcrumb",
] as const;

export const TRANSITION_TYPES = [
  "navigation",
  "route_change",
  "view_change",
  "modal_open",
  "modal_close",
  "drawer_open",
  "drawer_close",
  "tab_switch",
  "breadcrumb",
  "wizard_step",
  "reload",
  "unknown",
] as const;

export const NAVIGATION_REGION_TYPES = [
  "header",
  "top_navigation",
  "sidebar",
  "modal",
  "dialog",
  "drawer",
  "toolbar",
] as const;
