/** Canonical Execution Control Center (P6-01). */
export const EXECUTION_CONTROL_CENTER_PATH =
  "docs/governance/EMPIREAI_EXECUTION_CONTROL_CENTER.md";

/** Performance Governance companion (P5-06). */
export const PERFORMANCE_GOVERNANCE_COMPANION_PATH =
  "docs/governance/EMPIREAI_PERFORMANCE_GOVERNANCE.md";

/** Journey System companion (P4-08). */
export const JOURNEY_SYSTEM_COMPANION_PATH =
  "docs/governance/EMPIREAI_JOURNEY_SYSTEM.md";

/** ECC principles (P6-01). */
export const ECC_PRINCIPLES = [
  "ECC is NOT another AI",
  "ECC is NOT another Builder",
  "ECC is the constitutional execution coordination authority",
  "Pillow governs · ECC coordinates · Builder executes · Supervisor supervises · Brain runs · Cockpit visualizes",
  "ECC coordinates without replacing ownership",
  "Single execution coordination authority — no competing orchestrators",
  "Execution improvements remain traceable",
  "Grand King observes one centralized control center",
] as const;

/** ECC responsibilities (P6-01). */
export const ECC_RESPONSIBILITIES = [
  "mission_coordination",
  "execution_coordination",
  "dependency_coordination",
  "resource_coordination",
  "priority_coordination",
  "approval_coordination",
  "execution_state_coordination",
  "recovery_coordination",
  "cross_system_coordination",
] as const;

/** Systems ECC coordinates (P6-01). */
export const ECC_COORDINATED_SYSTEMS = [
  "builder",
  "supervisor",
  "guardian",
  "brain",
  "pillow",
  "cockpit",
  "journey",
  "production",
  "runtime",
  "business_engines",
  "commerce",
  "infrastructure",
] as const;

/** Constitutional execution states (P6-01). */
export const ECC_EXECUTION_STATES = [
  "queued",
  "preparing",
  "waiting",
  "ready",
  "executing",
  "validating",
  "recovering",
  "blocked",
  "paused",
  "completed",
  "cancelled",
] as const;

/** Execution pipeline stages (P6-01). */
export const ECC_EXECUTION_PIPELINE = [
  "vision_synchronization",
  "context_synchronization",
  "mission_generation",
  "integrity_evaluation",
  "dependency_resolution",
  "execution_planning",
  "execution_coordination",
  "builder_execution",
  "supervisor_observation",
  "guardian_monitoring",
  "browser_truth",
  "grand_king_acceptance",
  "journey_completion",
] as const;

/** Dependency categories (P6-01). */
export const ECC_DEPENDENCY_CATEGORIES = [
  "mission",
  "architecture",
  "repository",
  "production",
  "infrastructure",
  "business",
] as const;

/** Resource categories (P6-01). */
export const ECC_RESOURCE_CATEGORIES = [
  "builder_capacity",
  "runtime_capacity",
  "worker_capacity",
  "queue_capacity",
  "ai_provider_capacity",
  "repository_capacity",
  "infrastructure_capacity",
] as const;
