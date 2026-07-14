import type { JourneyDefinition, MandatoryJourneyId } from "./types.js";

/** Canonical registry — every mandatory Grand King workflow mapped to a runner. */
export const JOURNEY_REGISTRY: JourneyDefinition[] = [
  { id: "login", label: "Login", critical: true, layer: "api_tests", testType: "end_to_end", runner: "backend/scripts/production-journey-verify.mjs · auth-verification.test.ts", browserTruthFinal: true },
  { id: "logout", label: "Logout", critical: false, layer: "api_tests", testType: "end_to_end", runner: "auth-verification.test.ts", browserTruthFinal: true },
  { id: "session_resume", label: "Session Resume", critical: false, layer: "integration_tests", testType: "integration", runner: "pillow-host.test.ts · production-journey-verify.mjs", browserTruthFinal: true },
  { id: "executive_home", label: "Executive Home", critical: true, layer: "api_tests", testType: "end_to_end", runner: "production-journey-verify.mjs · auth-verification.test.ts", browserTruthFinal: true },
  { id: "pillow_chat", label: "Pillow Chat", critical: true, layer: "integration_tests", testType: "end_to_end", runner: "production-journey-verify.mjs · pillow-host.test.ts", browserTruthFinal: true },
  { id: "builder", label: "Builder", critical: true, layer: "integration_tests", testType: "integration", runner: "cursor-bridge.test.ts · cursor-protocol.test.ts", browserTruthFinal: true },
  { id: "supervisor", label: "Supervisor", critical: true, layer: "runtime_tests", testType: "integration", runner: "supervisor.test.ts · recovery-doctrine.test.ts", browserTruthFinal: true },
  { id: "mission_generation", label: "Mission Generation", critical: false, layer: "integration_tests", testType: "integration", runner: "planner.test.ts · cursor-protocol.test.ts", browserTruthFinal: false },
  { id: "journey", label: "Journey", critical: true, layer: "constitution_tests", testType: "end_to_end", runner: "bootstrap.test.ts · JOURNEY.md validation", browserTruthFinal: true },
  { id: "repository", label: "Repository", critical: false, layer: "architecture_tests", testType: "integration", runner: "pillow validate suite · backend validate:full", browserTruthFinal: false },
  { id: "production_health", label: "Production Health", critical: false, layer: "production_validation", testType: "production_smoke", runner: "production-journey-verify.mjs · verify-production-deploy.mjs", browserTruthFinal: true },
  { id: "recovery", label: "Recovery", critical: false, layer: "runtime_tests", testType: "recovery", runner: "recovery.test.ts · recovery-doctrine.test.ts", browserTruthFinal: false },
  { id: "business_dashboard", label: "Business Dashboard", critical: true, layer: "integration_tests", testType: "end_to_end", runner: "commerce-intelligence.test.ts · empire-commander.test.ts", browserTruthFinal: true },
  { id: "grand_king_workflow", label: "Grand King Workflow", critical: true, layer: "grand_king_acceptance", testType: "end_to_end", runner: "production-journey-verify.mjs (full path)", browserTruthFinal: true },
];

export function getJourney(id: MandatoryJourneyId): JourneyDefinition {
  const j = JOURNEY_REGISTRY.find((x) => x.id === id);
  if (!j) throw new Error(`Unknown journey: ${id}`);
  return j;
}

export function getCriticalJourneys(): JourneyDefinition[] {
  return JOURNEY_REGISTRY.filter((j) => j.critical);
}
