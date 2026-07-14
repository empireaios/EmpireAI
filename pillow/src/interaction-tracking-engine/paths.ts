/** PILLOW-ITE-001 — Interaction Tracking Engine paths (T1-06). */

export const INTERACTION_TRACKING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_INTERACTION_TRACKING_SYSTEM.md";

export const INTERACTION_EVENT_VERSION = "1.0.0" as const;

export const TRACKING_STATUSES = [
  "idle",
  "tracking",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;

export const INTERACTION_TYPES = [
  "click",
  "double_click",
  "right_click",
  "hover",
  "focus",
  "blur",
  "text_input",
  "form_change",
  "selection_change",
  "dropdown_open",
  "dropdown_select",
  "checkbox_change",
  "radio_change",
  "toggle_change",
  "tab_switch",
  "modal_open",
  "modal_close",
  "drawer_open",
  "drawer_close",
  "scroll",
  "keyboard_input",
  "keyboard_shortcut",
  "route_change_trigger",
  "navigation_trigger",
] as const;

export const SENSITIVE_FIELD_PATTERNS = [
  "password",
  "passwd",
  "secret",
  "token",
  "api_key",
  "apikey",
  "credit_card",
  "card_number",
  "cvv",
  "ssn",
  "auth",
  "otp",
  "pin",
] as const;
