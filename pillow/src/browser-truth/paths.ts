/** Canonical Browser Truth system document (P4-06). */

export const BROWSER_TRUTH_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BROWSER_TRUTH_SYSTEM.md";

/** Production Truth companion — not duplicated. */
export const PRODUCTION_TRUTH_COMPANION_PATH =
  "docs/governance/EMPIREAI_PRODUCTION_TRUTH.md";

export const PRODUCTION_URL =
  process.env.VERCEL_PRODUCTION_URL?.trim() ||
  process.env.EMPIRE_COCKPIT_URL?.trim() ||
  "https://empire-ai.co";

/** Browser acceptance pipeline stages (P4-06). */
export const BROWSER_ACCEPTANCE_PIPELINE = [
  "repository_acceptance",
  "automated_validation",
  "deployment",
  "production_browser_verification",
  "grand_king_browser_verification",
  "mission_complete",
] as const;

/** Browser verification dimensions — every production feature. */
export const BROWSER_VERIFICATION_DIMENSIONS = [
  "authentication",
  "navigation",
  "rendering",
  "interaction",
  "latency",
  "state_persistence",
  "session_continuity",
  "business_logic",
  "visual_accuracy",
  "error_handling",
  "recovery_behaviour",
] as const;

/** Production scenarios to verify. */
export const PRODUCTION_SCENARIOS = [
  "fresh_login",
  "returning_login",
  "session_resume",
  "logout",
  "navigation",
  "refresh",
  "browser_close",
  "browser_reopen",
  "network_delay",
  "temporary_failure",
  "recovery",
] as const;

/** Mandatory browser evidence fields at mission closeout. */
export const MANDATORY_BROWSER_EVIDENCE_FIELDS = [
  "browser_screenshots",
  "browser_recording",
  "production_url",
  "feature_tested",
  "test_results",
  "observed_behaviour",
  "known_limitations",
  "acceptance_status",
] as const;
