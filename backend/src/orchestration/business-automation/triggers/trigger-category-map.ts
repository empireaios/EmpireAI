/**
 * G5-02 — Category to registry triggerType mapping.
 */

import type { AutomationTriggerType } from "../../../registry/types/automation-registry-types.js";
import type { TriggerCategory } from "../contracts/trigger-types.js";

export const CATEGORY_TO_REGISTRY_TRIGGER_TYPES: Record<
  TriggerCategory,
  readonly AutomationTriggerType[]
> = {
  executive_decision: ["decision"],
  brain_dispatch: ["event"],
  pillow_approval: ["event"],
  scheduler: ["schedule"],
  registry_event: ["registry"],
  business_event: ["event"],
  mission_event: ["event"],
  cockpit_action: ["manual"],
  manual_executive: ["manual"],
  future_plugin: ["decision", "schedule", "event", "manual", "registry"],
};

export function registryTypesForCategory(category: TriggerCategory): readonly AutomationTriggerType[] {
  return CATEGORY_TO_REGISTRY_TRIGGER_TYPES[category];
}
