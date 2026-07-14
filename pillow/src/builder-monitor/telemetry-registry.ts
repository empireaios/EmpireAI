import { BUILDER_TELEMETRY_FIELDS } from "./paths.js";

/** Registry of Builder telemetry fields (P6-04). */
export const BUILDER_TELEMETRY_REGISTRY = BUILDER_TELEMETRY_FIELDS.map((field, index) => ({
  field,
  order: index + 1,
  required: [
    "current_mission",
    "current_step",
    "current_activity",
    "mission_state",
    "overall_progress",
    "heartbeat",
  ].includes(field),
}));
