import type { ArtifactDescriptor } from "./types.js";

export {
  RECONSTRUCTION_SCAN_PROFILES,
  RECONSTRUCTION_ROOT_MARKERS,
  RECONSTRUCTION_CATEGORY_RULES,
  EXECUTIVE_AUDIT_GLOB_PATTERNS,
  BOOTSTRAP_ARTIFACT_CATALOG,
} from "./reconstruction-rules.js";
export type {
  ReconstructionScanProfile,
  CategoryCompletenessRule,
} from "./reconstruction-rules.js";

/** @deprecated Use RECONSTRUCTION_SCAN_PROFILES — doctrine discovery is convention-based. */
export const DOCTRINE_GLOB_PREFIXES = ["EMPIREAI_"] as const;

/** Build a dynamic descriptor list from reconstructed artifacts (read-only introspection). */
export function artifactsToCatalog(artifacts: Array<{ descriptor: ArtifactDescriptor }>): ArtifactDescriptor[] {
  return artifacts.map((artifact) => artifact.descriptor);
}
