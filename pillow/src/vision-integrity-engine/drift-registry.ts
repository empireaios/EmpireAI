import type { IntegrityDriftRecord } from "./types.js";

/** VIE drift detection registry (P6-02). */
export const INTEGRITY_DRIFT_REGISTRY: IntegrityDriftRecord[] = [
  { id: "VIE-DR-001", signal: "vision_drift", description: "Engineering scope diverges from EMPIREAI_VISION.md", detectionMethod: "Vision Sync pipeline step failure" },
  { id: "VIE-DR-002", signal: "mission_drift", description: "Mission scope outside current roadmap item", detectionMethod: "Planner blockedBy / readiness check" },
  { id: "VIE-DR-003", signal: "architecture_drift", description: "Changes violate canonical architecture", detectionMethod: "Architecture sync step + competing doctrines" },
  { id: "VIE-DR-004", signal: "repository_drift", description: "Repository memory unsynchronized or unhealthy", detectionMethod: "Bootstrap health + memory consistency" },
  { id: "VIE-DR-005", signal: "engineering_drift", description: "Engineering bypasses constitutional gates", detectionMethod: "Pre-mission checks failure" },
  { id: "VIE-DR-006", signal: "business_drift", description: "Business capability misaligned with objective", detectionMethod: "Objective engine alignment check" },
  { id: "VIE-DR-007", signal: "production_drift", description: "Production truth violated", detectionMethod: "Production Mode + Browser Truth probes" },
  { id: "VIE-DR-008", signal: "knowledge_drift", description: "Knowledge base stale or contradictory", detectionMethod: "Vision accumulation + lessons learned sync" },
  { id: "VIE-DR-009", signal: "documentation_drift", description: "Documentation law violations", detectionMethod: "Mandatory artifact presence check" },
];
