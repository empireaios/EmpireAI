import { EME_METADATA_VERSION } from "./paths.js";
export class MemoryMetadataGenerator {
  generate() { return { metadataVersion: EME_METADATA_VERSION, structuralSignalOnly: true as const, generatedAt: new Date().toISOString() }; }
}
