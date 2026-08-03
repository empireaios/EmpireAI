import { ECA_METADATA_VERSION } from "./paths.js";
export class CapitalMetadataGenerator {
  traceId() { return `eca-trace-${Date.now()}`; }
  get version() { return ECA_METADATA_VERSION; }
}
