import { IEC_METADATA_VERSION } from "./paths.js";
export class CockpitMetadataGenerator { generate() { return { metadataVersion: IEC_METADATA_VERSION, generatedAt: new Date().toISOString() }; } }
