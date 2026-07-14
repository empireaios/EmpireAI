/** PILLOW-CRE-001 — Component Recognition Engine paths (T1-03). */

export const COMPONENT_RECOGNITION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPONENT_RECOGNITION_SYSTEM.md";

export const COMPONENT_MODEL_VERSION = "1.0.0" as const;

export const RECOGNITION_STATUSES = [
  "idle",
  "recognizing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const COMPONENT_TYPES = [
  "button",
  "link",
  "input",
  "text_field",
  "text_area",
  "dropdown",
  "checkbox",
  "radio_button",
  "toggle",
  "tab",
  "menu",
  "navigation_item",
  "card",
  "modal",
  "dialog",
  "table",
  "list",
  "form",
  "icon",
  "image",
  "chart",
  "panel",
  "sidebar",
  "header",
  "footer",
  "alert",
  "toast",
  "tooltip",
  "loading_indicator",
  "unknown",
] as const;
