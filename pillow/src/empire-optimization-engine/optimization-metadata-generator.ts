import { EOE_METADATA_VERSION } from "./paths.js";
export class OptimizationMetadataGenerator {
  traceId() { return `eoe-trace-${Date.now()}`; }
  get version() { return EOE_METADATA_VERSION; }
}
