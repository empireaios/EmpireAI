export {
  AutonomousUxAuditEngine,
  createAutonomousUxAuditEngine,
  resetAutonomousUxAuditForTesting,
} from "./engine.js";
export type { AutonomousUxAuditOptions } from "./engine.js";

export {
  buildAutonomousUxAuditConfiguration,
  DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION,
} from "./configuration.js";
export type { AutonomousUxAuditConfiguration } from "./configuration.js";

export {
  AUTONOMOUS_UX_AUDIT_SYSTEM_PATH,
  AUDIT_METADATA_VERSION,
  UX_ISSUE_CATEGORIES,
} from "./paths.js";

export type {
  AutonomousUxAuditState,
  AutonomousUxAuditCockpitSnapshot,
  AutonomousUxAuditRunReport,
  UxAuditRecord,
  DetectedUxIssue,
  AuditSessionRecord,
  AutonomousUxAuditInput,
  AuditHealthReport,
  AuditPerformanceStats,
  AutonomousUxAuditPerformanceStats,
  UxIssueCategory,
  IssueSeverity,
} from "./types.js";
