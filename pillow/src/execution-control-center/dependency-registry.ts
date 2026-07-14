import type { ExecutionDependencyRecord } from "./types.js";

/** ECC dependency registry (P6-01). */
export const EXECUTION_DEPENDENCY_REGISTRY: ExecutionDependencyRecord[] = [
  { id: "ECC-DP-001", category: "mission", name: "Phase P5 Complete", description: "P5-01 through P5-06 runtime foundation", criticalPath: true },
  { id: "ECC-DP-002", category: "mission", name: "Vision Synchronization", description: "P4-02 vision sync gate passed", criticalPath: true },
  { id: "ECC-DP-003", category: "mission", name: "Context Synchronization", description: "P4-03 context sync gate passed", criticalPath: true },
  { id: "ECC-DP-004", category: "architecture", name: "Cursor Protocol", description: "P4-04 constitutional execution format", criticalPath: true },
  { id: "ECC-DP-005", category: "repository", name: "Repository Health", description: "Bootstrap and memory healthy", criticalPath: true },
  { id: "ECC-DP-006", category: "production", name: "Production Mode", description: "P5-02 production truth validated", criticalPath: false },
  { id: "ECC-DP-007", category: "infrastructure", name: "Redis Availability", description: "Queue and session infrastructure", criticalPath: false },
  { id: "ECC-DP-008", category: "business", name: "Objective Alignment", description: "Mission aligned with Empire objective", criticalPath: false },
  { id: "ECC-DP-009", category: "architecture", name: "Scaling Readiness", description: "P5-05 scaling architecture documented", criticalPath: false },
  { id: "ECC-DP-010", category: "architecture", name: "Performance Governance", description: "P5-06 performance baselines active", criticalPath: false },
];

export function getCriticalPath(): ExecutionDependencyRecord[] {
  return EXECUTION_DEPENDENCY_REGISTRY.filter((d) => d.criticalPath);
}
