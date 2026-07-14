/** Canonical Cursor Protocol system document (P4-04). */

export const CURSOR_PROTOCOL_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CURSOR_PROTOCOL.md";

/** Mandatory section markers — every Builder mission must contain these. */
export const MANDATORY_PROTOCOL_SECTIONS = [
  "CURSOR PROTOCOL",
  "Pre-Mission Checks",
  "Mission Purpose",
  "## WHY",
  "## WHAT",
  "## HOW",
  "## PROOF",
  "Roadmap Item",
  "Dependencies",
  "Context Synchronization",
  "Architecture Review",
  "Repository Review",
  "Risk Review",
  "Estimated Completion Time",
  "King Action Required",
  "## Implementation",
  "## Validation",
  "Repository Acceptance",
  "Production Acceptance",
  "Grand King Acceptance",
  "Lessons Learned",
  "Next Roadmap Item",
] as const;

export const CURSOR_PROTOCOL_MISSION_STATES: import("./types.js").CursorProtocolMissionState[] =
  [
    "queued",
    "preparing",
    "synchronizing",
    "reviewing",
    "planning",
    "implementing",
    "testing",
    "validating",
    "production_verification",
    "awaiting_grand_king",
    "completed",
    "blocked",
    "recovering",
    "cancelled",
  ];
