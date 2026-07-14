/** T2-02 — Maps component types to design system families. */

import type { ComponentType } from "../component-recognition-engine/types.js";
import type { ComponentFamily } from "./types.js";

const FAMILY_MAP: Record<string, ComponentFamily> = {
  button: "interactive",
  link: "interactive",
  input: "forms",
  text_field: "forms",
  text_area: "forms",
  dropdown: "forms",
  checkbox: "forms",
  radio_button: "forms",
  toggle: "forms",
  form: "forms",
  table: "data_display",
  list: "data_display",
  card: "containers",
  panel: "containers",
  modal: "overlays",
  dialog: "overlays",
  navigation_item: "navigation",
  menu: "navigation",
  tab: "navigation",
  sidebar: "navigation",
  header: "structure",
  footer: "structure",
  alert: "feedback",
  toast: "feedback",
  loading_indicator: "loading",
  icon: "media",
  image: "media",
  chart: "visualization",
  tooltip: "feedback",
  unknown: "unknown",
};

export function resolveComponentFamily(componentType: ComponentType | string): ComponentFamily {
  return FAMILY_MAP[componentType] ?? "unknown";
}

export function resolveComponentCategory(componentType: ComponentType | string): string {
  const family = resolveComponentFamily(componentType);
  return `${family}/${componentType}`;
}
