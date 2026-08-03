import { EIN_METADATA_VERSION } from "./paths.js";
export class InnovationMetadataGenerator { get version() { return EIN_METADATA_VERSION; } traceId() { return `ein-trace-${Date.now()}`; } }
