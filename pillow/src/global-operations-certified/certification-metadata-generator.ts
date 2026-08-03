import { GOC_METADATA_VERSION } from "./paths.js";
export class CertificationMetadataGenerator {
  metadata() { return { metadataVersion: GOC_METADATA_VERSION, generatedAt: new Date().toISOString() }; }
}
