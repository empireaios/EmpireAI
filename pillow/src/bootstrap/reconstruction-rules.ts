import type { ArtifactCategory } from "./types.js";

/** Repository scan profiles — convention-based, not individual file paths. */
export interface ReconstructionScanProfile {
  id: string;
  relativeRoot: string;
  /** Match file names in this root (non-recursive unless recursive=true) */
  filePattern: RegExp;
  recursive?: boolean;
}

/**
 * Convention-based scan roots. New canonical markdown under these paths is
 * discovered automatically without Bootstrap code changes.
 */
export const RECONSTRUCTION_SCAN_PROFILES: ReconstructionScanProfile[] = [
  {
    id: "repository_root_markdown",
    relativeRoot: ".",
    filePattern: /\.(md|MD)$/,
  },
  {
    id: "governance_register_tree",
    relativeRoot: "docs/governance",
    filePattern: /\.(md|MD)$/,
    recursive: true,
  },
  {
    id: "executive_component_surface",
    relativeRoot: "frontend/src/components/system",
    filePattern: /\.(ts|tsx)$/,
  },
];

/** Minimal repository anchors — identity only, not a knowledge inventory. */
export const RECONSTRUCTION_ROOT_MARKERS = [
  "JOURNEY.md",
  "PILLOW_ARCHITECTURE_CONTRACT.md",
] as const;

/** Category completeness rules — reconstruction verifies categories, not fixed file lists. */
export interface CategoryCompletenessRule {
  category: ArtifactCategory;
  minPresent: number;
  requirement: "mandatory" | "optional";
  label: string;
  /** When true, category may be satisfied by another loaded artifact (dependency alias). */
  allowSatisfiedBy?: boolean;
}

export const RECONSTRUCTION_CATEGORY_RULES: CategoryCompletenessRule[] = [
  { category: "constitution", minPresent: 1, requirement: "mandatory", label: "Constitution" },
  {
    category: "repository_governance",
    minPresent: 3,
    requirement: "mandatory",
    label: "Repository governance doctrines",
  },
  {
    category: "backlog_release",
    minPresent: 1,
    requirement: "mandatory",
    label: "Backlog release artifacts",
  },
  { category: "journey", minPresent: 2, requirement: "mandatory", label: "Journey map + audit" },
  { category: "project_state", minPresent: 1, requirement: "mandatory", label: "Project state" },
  {
    category: "decision_register",
    minPresent: 1,
    requirement: "mandatory",
    label: "Decision register",
  },
  { category: "soul", minPresent: 1, requirement: "mandatory", label: "Empire Soul" },
  {
    category: "implementation_contract",
    minPresent: 2,
    requirement: "mandatory",
    label: "Implementation contracts",
  },
  {
    category: "component_contract",
    minPresent: 1,
    requirement: "mandatory",
    label: "Executive component contract",
    allowSatisfiedBy: true,
  },
  { category: "doctrine", minPresent: 2, requirement: "mandatory", label: "Pillow doctrines" },
  {
    category: "ux_enhancement",
    minPresent: 0,
    requirement: "optional",
    label: "Enhancement registers",
  },
  {
    category: "executive_audit",
    minPresent: 1,
    requirement: "optional",
    label: "Executive audit reports",
  },
];

export const EXECUTIVE_AUDIT_GLOB_PATTERNS = [
  "BL-A_VALIDATION_REPORT.md",
  "BL-B_VALIDATION_REPORT.md",
  "BL-A_REPOSITORY_DIFFERENCE_REPORT.md",
  "BL-B_REPOSITORY_DIFFERENCE_REPORT.md",
  "COMBINED_EXECUTIVE_AUDIT_",
] as const;

/**
 * @deprecated Static catalog replaced by repository reconstruction. Retained for
 * backward-compatible exports; count is not fixed.
 */
export const BOOTSTRAP_ARTIFACT_CATALOG: never[] = [];
