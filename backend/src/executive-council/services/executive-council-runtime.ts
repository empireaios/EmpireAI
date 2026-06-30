import type { ExecutiveCouncilRuntime } from "../models/executive-core.js";
import { initializeExecutiveRegistry } from "./executive-registry-service.js";
import { listDebateSessions } from "./executive-debate-engine.js";

/** EC-001 — Executive Council Runtime status. */
export function getExecutiveCouncilRuntime(workspaceId: string, companyId: string): ExecutiveCouncilRuntime {
  const executives = initializeExecutiveRegistry(workspaceId, companyId);
  const sessions = listDebateSessions(workspaceId, companyId);
  const awaitingSoulApproval = sessions.filter(
    (s) => s.decision?.awaitingSoulApproval && !s.decision.soulApproved,
  ).length;

  return {
    moduleId: "executive-council",
    missionId: "EC-001-EC-010",
    activeSessions: sessions.length,
    registeredExecutives: executives.length,
    awaitingSoulApproval,
    lastDebateAt: sessions[0]?.completedAt ?? sessions[0]?.startedAt ?? null,
  };
}
