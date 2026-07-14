/** Canonical End-to-End Testing Architecture document (P4-07). */

export const E2E_TESTING_SYSTEM_PATH =
  "docs/governance/EMPIREAI_E2E_TESTING_SYSTEM.md";

/** Browser Truth companion — final acceptance authority (P4-06). */
export const BROWSER_TRUTH_COMPANION_PATH =
  "docs/governance/EMPIREAI_BROWSER_TRUTH_SYSTEM.md";

/** Testing pyramid layers (P4-07). */
export const TESTING_PYRAMID = [
  "constitution_tests",
  "architecture_tests",
  "integration_tests",
  "api_tests",
  "runtime_tests",
  "browser_tests",
  "production_validation",
  "grand_king_acceptance",
] as const;

/** Test types supported by the architecture. */
export const TEST_TYPES = [
  "unit",
  "integration",
  "contract",
  "api",
  "database",
  "queue",
  "worker",
  "security",
  "performance",
  "regression",
  "recovery",
  "browser",
  "end_to_end",
  "production_smoke",
] as const;

/** Test execution pipeline on every deployment. */
export const DEPLOYMENT_TEST_PIPELINE = [
  "critical_tests",
  "integration_tests",
  "browser_tests",
  "production_smoke_tests",
  "acceptance_summary",
] as const;

/** Mandatory E2E journeys — Grand King critical workflows. */
export const MANDATORY_E2E_JOURNEYS = [
  "login",
  "logout",
  "session_resume",
  "executive_home",
  "pillow_chat",
  "builder",
  "supervisor",
  "mission_generation",
  "journey",
  "repository",
  "production_health",
  "recovery",
  "business_dashboard",
  "grand_king_workflow",
] as const;

/** Critical journeys that block production acceptance when failed. */
export const CRITICAL_JOURNEY_IDS = [
  "login",
  "executive_home",
  "pillow_chat",
  "builder",
  "supervisor",
  "journey",
  "business_dashboard",
  "grand_king_workflow",
] as const;

/** Companion script paths (repository root relative). */
export const COMPANION_SCRIPTS = {
  productionJourney: "backend/scripts/production-journey-verify.mjs",
  verifyDeploy: "backend/scripts/verify-production-deploy.mjs",
  pillowTests: "pillow/package.json",
  backendTests: "backend/package.json",
} as const;
