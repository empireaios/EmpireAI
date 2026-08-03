import { EC_METADATA_VERSION, EMPIRE_CERTIFIED_ID } from "./paths.js";

export class CertificationMetadataGenerator {
  generate(timestamp = new Date().toISOString()) {
    return {
      engineId: EMPIRE_CERTIFIED_ID,
      engineVersion: "PILLOW-EC-001" as const,
      metadataVersion: EC_METADATA_VERSION,
      timestamp,
      missionId: "X5-20" as const,
    };
  }
}
