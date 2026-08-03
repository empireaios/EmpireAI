import { Q6_MISSION_CATALOG } from "./paths.js";
export const PLATFORM_MISSIONS = Q6_MISSION_CATALOG.map(([missionId, missionName, implementationLocation, dependencyKey]) => ({
  missionId, missionName, implementationLocation, dependencyKey,
  expectedDeliverable: `${missionName} implementation, registration, prior certification, and reachable runtime capability`,
  auditPath: `docs/audits/pillow/${missionId.toLowerCase()}-${missionName}/`,
  subsystemId: missionName,
}));
