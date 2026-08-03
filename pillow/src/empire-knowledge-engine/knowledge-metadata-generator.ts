import { EKE_METADATA_VERSION } from "./paths.js";
export class KnowledgeMetadataGenerator {
  create(traceId: string) { return { metadataVersion: EKE_METADATA_VERSION, knowledgeTraceId: traceId, structuralSignalOnly: true as const, preserveAuditability: true as const }; }
}
