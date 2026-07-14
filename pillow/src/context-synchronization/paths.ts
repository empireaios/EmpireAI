/** Canonical paths for Context Synchronization pipeline (P4-03). */

export const CONTEXT_SYNC_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md";

export const CONTEXT_SYNC_ARTIFACTS = {
  vision: "EMPIREAI_VISION.md",
  visionAccumulation: "docs/governance/EMPIREAI_VISION_ACCUMULATION.md",
  soul: "EMPIREAI_SOUL.md",
  constitution: "EMPIREAI_CONSTITUTION.md",
  ctd: "EMPIREAI_CORE_CONSTITUTION_CTD.md",
  roadmap: "EMPIREAI_ROADMAP.md",
  constitutionLock: "docs/governance/EMPIREAI_CONSTITUTION_LOCK.md",
  doctrineSystem: "docs/governance/EMPIREAI_DOCTRINE_SYSTEM.md",
  hierarchy: "docs/governance/EMPIREAI_HIERARCHY.md",
  canonicalArchitecture: "docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md",
  architectureLaw: "docs/architecture/EMPIREAI_ARCHITECTURE_LAW.md",
  documentationLaw: "docs/governance/EMPIREAI_DOCUMENTATION_LAW.md",
  repositoryStructure: "docs/governance/EMPIREAI_REPOSITORY_STRUCTURE.md",
  repositoryMasterIndex: "EMPIREAI_REPOSITORY_MASTER_INDEX.md",
  productionTruth: "docs/governance/EMPIREAI_PRODUCTION_TRUTH.md",
  journey: "JOURNEY.md",
  journeyAudit: "JOURNEY_AUDIT.md",
  status: "EMPIREAI_STATUS.md",
} as const;

export const CONTEXT_EXTENSION_STEPS: Array<{
  step: import("./types.js").ContextStepId;
  label: string;
  paths: string[];
}> = [
  {
    step: "hierarchy",
    label: "Hierarchy",
    paths: [CONTEXT_SYNC_ARTIFACTS.hierarchy],
  },
  {
    step: "canonical_architecture",
    label: "Canonical Architecture",
    paths: [CONTEXT_SYNC_ARTIFACTS.canonicalArchitecture, CONTEXT_SYNC_ARTIFACTS.architectureLaw],
  },
  {
    step: "canonical_documentation",
    label: "Canonical Documentation",
    paths: [
      CONTEXT_SYNC_ARTIFACTS.documentationLaw,
      CONTEXT_SYNC_ARTIFACTS.repositoryMasterIndex,
    ],
  },
  {
    step: "repository_structure",
    label: "Repository Structure",
    paths: [CONTEXT_SYNC_ARTIFACTS.repositoryStructure],
  },
  {
    step: "journey",
    label: "Journey",
    paths: [CONTEXT_SYNC_ARTIFACTS.journey, CONTEXT_SYNC_ARTIFACTS.journeyAudit],
  },
  {
    step: "mission_history",
    label: "Mission History",
    paths: [CONTEXT_SYNC_ARTIFACTS.status],
  },
];
