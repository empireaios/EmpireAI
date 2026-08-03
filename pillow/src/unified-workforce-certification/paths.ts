/** PILLOW-UWC-001 — Unified Workforce Certification (Q0-30). */
export const UNIFIED_WORKFORCE_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_UNIFIED_WORKFORCE_CERTIFICATION_SYSTEM.md" as const;
export const UNIFIED_WORKFORCE_CERTIFICATION_ID = "unified-workforce-certification" as const;
export const UWC_METADATA_VERSION = "UWC-001-v1" as const;
export const EXECUTIVE_FACTORY_VERSION = "Q0-EIF-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "certifying",
  "assessing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Final certification levels (Q0-30).
 * Architecture allows additional levels via configuration without redesign.
 */
export const CERTIFICATION_LEVELS = [
  "certified",
  "certified_with_warnings",
  "provisionally_certified",
  "failed_certification",
] as const;

/**
 * Mandatory Executive Intelligence Factory components (Q0-01 … Q0-29).
 */
export const EXECUTIVE_COMPONENTS = [
  { id: "executive-planner", label: "Executive Planner", missionId: "Q0-01" },
  { id: "opportunity-scanner", label: "Opportunity Scanner", missionId: "Q0-02" },
  { id: "business-state-manager", label: "Business State Manager", missionId: "Q0-03" },
  { id: "execution-memory", label: "Execution Memory", missionId: "Q0-04" },
  { id: "decision-engine", label: "Decision Engine", missionId: "Q0-05" },
  { id: "approval-router", label: "Approval Router", missionId: "Q0-06" },
  { id: "strategic-recommendation-engine", label: "Strategic Recommendation Engine", missionId: "Q0-07" },
  { id: "executive-audit-engine", label: "Executive Audit Engine", missionId: "Q0-08" },
  { id: "workforce-orchestrator", label: "Workforce Orchestrator", missionId: "Q0-09" },
  { id: "workforce-capability-registry", label: "Workforce Capability Registry", missionId: "Q0-10" },
  { id: "workforce-access-manager", label: "Workforce Access Manager", missionId: "Q0-11" },
  { id: "skill-tool-router", label: "Skill & Tool Router", missionId: "Q0-12" },
  { id: "collective-reasoning-engine", label: "Collective Reasoning Engine", missionId: "Q0-13" },
  { id: "experience-replay-engine", label: "Experience Replay Engine", missionId: "Q0-14" },
  { id: "operational-playbook-engine", label: "Operational Playbook Engine", missionId: "Q0-15" },
  { id: "decision-memory", label: "Decision Memory", missionId: "Q0-16" },
  { id: "adaptive-workforce-optimizer", label: "Adaptive Workforce Optimizer", missionId: "Q0-17" },
  { id: "executive-command-center", label: "Pillow Executive Command Center", missionId: "Q0-18" },
  { id: "workforce-operating-system", label: "Workforce Operating System", missionId: "Q0-19" },
  { id: "task-negotiation-protocol", label: "Task Negotiation Protocol", missionId: "Q0-20" },
  { id: "peer-review-runtime", label: "Peer Review Runtime", missionId: "Q0-21" },
  { id: "escalation-framework", label: "Escalation Framework", missionId: "Q0-22" },
  { id: "knowledge-sharing-bus", label: "Knowledge Sharing Bus", missionId: "Q0-23" },
  { id: "inter-worker-messaging", label: "Inter-Worker Messaging", missionId: "Q0-24" },
  { id: "mission-coordination-engine", label: "Mission Coordination Engine", missionId: "Q0-25" },
  { id: "executive-reporting-runtime", label: "Executive Reporting Runtime", missionId: "Q0-26" },
  { id: "worker-quality-standard", label: "Worker Quality Standard", missionId: "Q0-27" },
  { id: "worker-self-critique-protocol", label: "Worker Self-Critique Protocol", missionId: "Q0-28" },
  { id: "workforce-certification-monitor", label: "Workforce Certification Monitor", missionId: "Q0-29" },
] as const;

/**
 * Final acceptance integration domains (Q0-30).
 */
export const INTEGRATION_DOMAINS = [
  "executive_communication",
  "executive_memory",
  "executive_routing",
  "executive_reporting",
  "executive_governance",
  "executive_orchestration",
  "executive_reasoning",
  "executive_quality_controls",
  "executive_certification",
] as const;

export const COMPONENT_PROBE_RESULTS = ["pass", "warning", "fail"] as const;

export const UWC_CAPABILITIES = [
  "verify_executive_planner",
  "verify_opportunity_scanner",
  "verify_business_state_manager",
  "verify_execution_memory",
  "verify_decision_engine",
  "verify_approval_router",
  "verify_strategic_recommendation_engine",
  "verify_executive_audit_engine",
  "verify_workforce_orchestrator",
  "verify_workforce_capability_registry",
  "verify_workforce_access_manager",
  "verify_skill_tool_router",
  "verify_collective_reasoning_engine",
  "verify_experience_replay_engine",
  "verify_operational_playbook_engine",
  "verify_decision_memory",
  "verify_adaptive_workforce_optimizer",
  "verify_executive_command_center",
  "verify_workforce_operating_system",
  "verify_task_negotiation_protocol",
  "verify_peer_review_runtime",
  "verify_escalation_framework",
  "verify_knowledge_sharing_bus",
  "verify_inter_worker_messaging",
  "verify_mission_coordination_engine",
  "verify_executive_reporting_runtime",
  "verify_worker_quality_standard",
  "verify_worker_self_critique_protocol",
  "verify_workforce_certification_monitor",
  "verify_complete_executive_intelligence_integration",
  "produce_unified_certification_report",
  "assess_executive_readiness",
  "determine_q0_production_readiness",
  "extensible_certification_levels",
  "extensible_integration_domains",
  "preserve_auditability",
  "preserve_traceability",
  "unified_workforce_certification_validation",
  "health_monitoring",
  "recovery_management",
] as const;
