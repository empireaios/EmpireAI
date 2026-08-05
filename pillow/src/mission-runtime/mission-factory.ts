import { MSR_METADATA_VERSION } from "./paths.js";
import { nextMsrId } from "./mission-store.js";
import type { MissionInstance, MsrInput } from "./types.js";

export class MissionFactory {
  create(input: MsrInput): MissionInstance {
    const now = new Date().toISOString();
    return {
      missionId: nextMsrId("msr-mission"),
      missionType: input.missionType ?? "enterprise",
      missionName: input.missionName ?? "Unnamed Mission",
      parentMissionId: input.parentMissionId ?? null,
      dependencyMissionIds: [...(input.dependencyMissionIds ?? [])],
      mode: input.mode ?? "standalone",
      currentStatus: "Created",
      createdAt: now,
      updatedAt: now,
      workers: [...(input.workers ?? [])],
      highRisk: input.highRisk === true,
      pillowConfirmed: input.pillowConfirmed === true,
      grandKingApproved: input.grandKingApproved === true,
      retryCount: 0,
      progress: 0,
      traceabilityRefs: ["q10-03", "mission-runtime"],
      metadataVersion: MSR_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
  }
}
