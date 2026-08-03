import { EED_METADATA_VERSION } from "./paths.js";
export class DashboardMetadataGenerator { generate() { return { metadataVersion: EED_METADATA_VERSION, structuralSignalOnly: true as const }; } }
