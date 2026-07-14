/** Canonical Journey System document (P4-08). */

export const JOURNEY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_JOURNEY_SYSTEM.md";

/** Journey First Doctrine companion. */
export const JOURNEY_FIRST_DOCTRINE_PATH =
  "EMPIREAI_JOURNEY_FIRST_DOCTRINE.md";

/** Operational journey index (read-only truth). */
export const JOURNEY_INDEX_PATH = "JOURNEY.md";

/** Structural change audit log. */
export const JOURNEY_AUDIT_PATH = "JOURNEY_AUDIT.md";

/** Permanent journey execution model (P4-08). */
export const JOURNEY_MODEL = [
  "vision",
  "vision_synchronization",
  "context_synchronization",
  "roadmap_item",
  "builder_mission",
  "architecture_review",
  "repository_changes",
  "implementation",
  "testing",
  "production_validation",
  "grand_king_acceptance",
  "lessons_learned",
  "vision_accumulation",
  "journey_archived",
] as const;

/** Mission traceability fields — every Builder mission shall record these. */
export const MISSION_TRACEABILITY_FIELDS = [
  "journeyId",
  "missionId",
  "roadmapItem",
  "phase",
  "purpose",
  "why",
  "what",
  "how",
  "proof",
  "missionState",
  "owner",
  "startTime",
  "finishTime",
  "elapsedTime",
  "eta",
  "dependencies",
  "repositoryChanges",
  "architectureChanges",
  "productionChanges",
  "evidence",
  "lessonsLearned",
  "recoveryEvents",
] as const;

/** Journey relationship chain. */
export const JOURNEY_RELATIONSHIP_CHAIN = [
  "vision",
  "soul",
  "ctd",
  "constitution_hierarchy",
  "roadmap_item",
  "architecture",
  "builder_mission",
  "real_mission",
  "repository_commit",
  "production_deployment",
  "evidence",
] as const;

/** Builder event types published to permanent Journey. */
export const JOURNEY_EVENT_TYPES = [
  "journey_started",
  "mission_started",
  "mission_state_changed",
  "repository_event",
  "validation_event",
  "deployment_event",
  "recovery_event",
  "completion_event",
  "grand_king_decision",
  "pillow_decision",
  "supervisor_event",
  "milestone",
  "lessons_learned",
  "journey_archived",
] as const;
