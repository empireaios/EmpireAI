import type { ObjectiveAlignmentStatus, ProposedAction } from "./types.js";
import { DEFAULT_SUCCESS_CRITERIA } from "./criteria.js";

/** Version 1 objective markers — work must relate to finishing EmpireAI V1. */
const V1_ALIGNMENT_MARKERS = [
  "pillow-017",
  "pillow-018",
  "pillow-019",
  "gc-03",
  "gc-05",
  "real-002b",
  "proof-001",
  "gk-golive",
  "golive",
  "version 1",
  "v1",
  "ux contract closure",
  "finish empireai",
  "empireai version 1",
  "validation",
  "typecheck",
  "approval gate",
  "cursor bridge",
  "objective engine",
  "builder mode",
  "blocker",
  "journey sync",
  "repository sync",
  "repository synchronization",
  "synchronize journey",
];

const V1_MISSION_IDS = new Set([
  "REPOSITORY-SYNC",
  ...DEFAULT_SUCCESS_CRITERIA.map((criterion) => criterion.journeyMarker.toUpperCase()),
  ...DEFAULT_SUCCESS_CRITERIA.map((criterion) => criterion.id.toUpperCase()),
]);

/** Patterns that indicate non-V1 scope — routed to Improvement Vault in Builder Mode. */
const NON_V1_PATTERNS = [
  "ux redesign",
  "aesthetic",
  "doctrine improvement",
  "architecture expansion",
  "commercial launch",
  "commercial expansion",
  "version 2",
  "post-v1",
  "marketplace expansion",
  "new doctrine",
  "endless",
  "brainstorm",
];

export function buildActionHaystack(action: ProposedAction): string {
  return [
    action.title,
    action.summary,
    action.missionId ?? "",
    ...(action.tags ?? []),
    JSON.stringify(action.metadata ?? {}),
  ]
    .join(" ")
    .toLowerCase();
}

export function supportsActiveObjective(
  action: ProposedAction,
  builderMode: boolean,
): { supports: boolean; reason: string } {
  if (action.grandKingOverride) {
    return {
      supports: true,
      reason: "Grand King override explicitly requested",
    };
  }

  const haystack = buildActionHaystack(action);

  if (action.missionId) {
    const missionId = action.missionId.toUpperCase();
    if (V1_MISSION_IDS.has(missionId) || missionId.startsWith("PILLOW-01")) {
      return {
        supports: true,
        reason: "Mission ID is registered Version 1 objective work",
      };
    }
  }

  for (const pattern of NON_V1_PATTERNS) {
    if (haystack.includes(pattern)) {
      return {
        supports: false,
        reason: `Non-V1 scope detected (${pattern}) — deferred in Builder Mode`,
      };
    }
  }

  if (builderMode) {
    const aligned = V1_ALIGNMENT_MARKERS.some((marker) => haystack.includes(marker));
    if (!aligned) {
      return {
        supports: false,
        reason: "Builder Mode allows only Version 1 blocker work",
      };
    }
  }

  const hasV1Marker = V1_ALIGNMENT_MARKERS.some((marker) => haystack.includes(marker));
  if (hasV1Marker) {
    return {
      supports: true,
      reason: "Action directly supports Finish EmpireAI Version 1",
    };
  }

  if (action.missionId?.toUpperCase().startsWith("PILLOW-01")) {
    return {
      supports: true,
      reason: "Pillow runtime mission supports Version 1 completion",
    };
  }

  return {
    supports: false,
    reason: "Action does not directly support the active objective",
  };
}

export function resolveAlignmentStatus(
  action: ProposedAction,
  supports: boolean,
): ObjectiveAlignmentStatus {
  if (action.grandKingOverride) {
    return supports
      ? "objective_aligned"
      : "requires_grand_king_override";
  }
  if (supports) return "objective_aligned";
  return "deferred_not_aligned";
}
