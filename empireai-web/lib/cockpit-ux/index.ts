export {
  COCKPIT_UX_MISSION,
  COCKPIT_UX_PRINCIPLES,
  type CockpitCentreId,
  type CockpitCentreNavItem,
  type CockpitUxPrinciple,
  type CockpitWidget,
  type ExecutiveHomeField,
} from "./types";

export {
  COCKPIT_UX_NAVIGATION,
  COCKPIT_UX_MOBILE_PRIMARY,
  getCockpitCentreById,
  resolveCockpitCentreId,
} from "./navigation";

export { COCKPIT_WIDGET_REGISTRY, getCockpitWidgetById } from "./widgets";
export { useCockpitRealtime } from "./useCockpitRealtime";
export { useCockpitUx } from "./useCockpitUx";
export type { CockpitUxArchitecture } from "./cockpitUxTypes";
