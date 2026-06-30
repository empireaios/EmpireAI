import { RECONSTRUCTION_SCAN_PROFILES } from "../bootstrap/reconstruction-rules.js";

/** Canonical observation scope — follows reconstruction scan profiles + known trees. */
export const OBSERVATION_PATHS: string[] = [
  "PILLOW_ARCHITECTURE_CONTRACT.md",
  "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md",
  "UX_IMPLEMENTATION_CONTRACT.md",
  "docs/governance/UX_ENHANCEMENT_REGISTER.md",
  "docs/governance/PILLOW_ENHANCEMENT_REGISTER.md",
  "EMPIREAI_DECISIONS.md",
  "EMPIREAI_ROADMAP.md",
  "EMPIREAI_SOUL.md",
];

export const OBSERVATION_DIRECTORIES: string[] = [
  ...RECONSTRUCTION_SCAN_PROFILES.filter((profile) => profile.recursive).map(
    (profile) => profile.relativeRoot,
  ),
  "pillow/src",
  "docs/executive-audits",
];

export const JOURNEY_PATHS = new Set(["JOURNEY.md", "JOURNEY_AUDIT.md"]);

export const BL_PATHS = new Set([
  "BL-A_VALIDATION_REPORT.md",
  "BL-B.md",
  "BL-C.md",
  "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md",
]);

export const DOCTRINE_PATH_PATTERN =
  /DOCTRINE|CONSTITUTION|ARCHITECTURE_CONTRACT|_CONTRACT\.md$/i;

export const EXECUTIVE_AUDIT_DIR = "docs/executive-audits";
