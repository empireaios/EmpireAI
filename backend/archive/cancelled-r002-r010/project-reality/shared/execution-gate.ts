/** Project Reality — all live adapters remain architecture-only until activation unlocks. */
export const PROJECT_REALITY_EXECUTION_BLOCKED = true as const;

export class ProjectRealityExecutionBlockedError extends Error {
  constructor(moduleId: string, action: string) {
    super(`${moduleId}: execution blocked — ${action} is architecture-only (Project Reality R002–R010)`);
    this.name = "ProjectRealityExecutionBlockedError";
  }
}

export function assertArchitectureOnly(moduleId: string, action: string): void {
  if (PROJECT_REALITY_EXECUTION_BLOCKED) {
    throw new ProjectRealityExecutionBlockedError(moduleId, action);
  }
}
