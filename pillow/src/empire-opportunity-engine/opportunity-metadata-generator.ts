import { EOP_METADATA_VERSION } from "./paths.js";
export class OpportunityMetadataGenerator { get version() { return EOP_METADATA_VERSION; } traceId() { return `eop-trace-${Date.now()}`; } }
