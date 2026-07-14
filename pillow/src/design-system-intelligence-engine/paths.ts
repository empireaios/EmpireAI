/** PILLOW-DSI-001 — Design System Intelligence paths and constants (T2-02). */

export const DESIGN_SYSTEM_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DESIGN_SYSTEM_INTELLIGENCE_SYSTEM.md";

export const DESIGN_SYSTEM_METADATA_VERSION = "1.0.0" as const;

export const INTELLIGENCE_STATUSES = [
  "idle",
  "analyzing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const COMPONENT_STATUSES = ["active", "deprecated", "experimental"] as const;

export const SIZE_VARIANTS = ["xs", "sm", "md", "lg", "xl"] as const;

export const VALIDATION_DECISIONS = ["pass", "fail", "partial"] as const;

export const COMPONENT_FAMILIES = [
  "interactive",
  "forms",
  "data_display",
  "containers",
  "overlays",
  "navigation",
  "feedback",
  "loading",
  "media",
  "visualization",
  "structure",
  "unknown",
] as const;

export const SUPPORTED_PATTERNS = [
  "buttons",
  "inputs",
  "forms",
  "tables",
  "cards",
  "navigation",
  "modals",
  "drawers",
  "lists",
  "menus",
  "alerts",
  "empty_states",
  "loading_states",
] as const;
