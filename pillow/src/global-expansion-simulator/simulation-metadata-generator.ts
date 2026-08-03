import { GES_METADATA_VERSION } from "./paths.js";
export class SimulationMetadataGenerator { generate() { return { metadataVersion: GES_METADATA_VERSION, generatedAt: new Date().toISOString(), structuralSignalOnly: true as const }; } }
