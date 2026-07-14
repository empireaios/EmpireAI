/** Canonical artifact paths for Vision Synchronization pipeline (P4-02). */

export const VISION_SYNC_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md";

export const VISION_SYNC_POLICY_PATH =
  "docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md";

export const VISION_SYNC_ARTIFACTS = {
  vision: "EMPIREAI_VISION.md",
  visionAccumulation: "docs/governance/EMPIREAI_VISION_ACCUMULATION.md",
  soul: "EMPIREAI_SOUL.md",
  ctd: "EMPIREAI_CORE_CONSTITUTION_CTD.md",
  constitutionHierarchy: "docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md",
  constitutionalFramework: "docs/governance/EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md",
  engineeringConstitution: "EMPIREAI_CONSTITUTION.md",
  architectureLaw: "docs/architecture/EMPIREAI_ARCHITECTURE_LAW.md",
  canonicalArchitecture: "docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md",
  roadmap: "EMPIREAI_ROADMAP.md",
  constitutionLock: "docs/governance/EMPIREAI_CONSTITUTION_LOCK.md",
  productionTruth: "docs/governance/EMPIREAI_PRODUCTION_TRUTH.md",
  engineeringStandards: "docs/governance/EMPIREAI_ENGINEERING_STANDARDS.md",
  doctrineSystem: "docs/governance/EMPIREAI_DOCTRINE_SYSTEM.md",
  documentationLaw: "docs/governance/EMPIREAI_DOCUMENTATION_LAW.md",
  builderArchitecture: "docs/architecture/EMPIREAI_BUILDER_ARCHITECTURE.md",
  pillowArchitecture: "docs/architecture/EMPIREAI_PILLOW_ARCHITECTURE.md",
} as const;

export const PIPELINE_STEP_ORDER: Array<{
  step: import("./types.js").SyncStepId;
  label: string;
  paths: string[];
}> = [
  { step: "vision", label: "Vision", paths: [VISION_SYNC_ARTIFACTS.vision] },
  {
    step: "vision_accumulation",
    label: "Vision Accumulation",
    paths: [VISION_SYNC_ARTIFACTS.visionAccumulation],
  },
  { step: "soul", label: "Soul", paths: [VISION_SYNC_ARTIFACTS.soul] },
  { step: "ctd", label: "CTD", paths: [VISION_SYNC_ARTIFACTS.ctd] },
  {
    step: "constitution_hierarchy",
    label: "Constitution Hierarchy",
    paths: [
      VISION_SYNC_ARTIFACTS.constitutionHierarchy,
      VISION_SYNC_ARTIFACTS.constitutionalFramework,
      VISION_SYNC_ARTIFACTS.engineeringConstitution,
    ],
  },
  { step: "roadmap", label: "Roadmap", paths: [VISION_SYNC_ARTIFACTS.roadmap] },
  {
    step: "current_roadmap_item",
    label: "Current Roadmap Item",
    paths: [VISION_SYNC_ARTIFACTS.doctrineSystem, VISION_SYNC_ARTIFACTS.constitutionLock],
  },
  {
    step: "architecture",
    label: "Architecture",
    paths: [
      VISION_SYNC_ARTIFACTS.architectureLaw,
      VISION_SYNC_ARTIFACTS.canonicalArchitecture,
      VISION_SYNC_ARTIFACTS.builderArchitecture,
    ],
  },
  {
    step: "repository",
    label: "Repository",
    paths: [VISION_SYNC_ARTIFACTS.engineeringStandards],
  },
  {
    step: "production_truth",
    label: "Production Truth",
    paths: [VISION_SYNC_ARTIFACTS.productionTruth],
  },
  {
    step: "current_production_state",
    label: "Current Production State",
    paths: [VISION_SYNC_ARTIFACTS.productionTruth],
  },
  {
    step: "previous_lessons_learned",
    label: "Previous Lessons Learned",
    paths: [VISION_SYNC_ARTIFACTS.visionAccumulation],
  },
  {
    step: "mission_context",
    label: "Mission Context",
    paths: [VISION_SYNC_POLICY_PATH, VISION_SYNC_SYSTEM_PATH],
  },
  {
    step: "mission_generation",
    label: "Mission Generation",
    paths: ["docs/governance/EMPIREAI_MISSION_GENERATION_POLICY.md"],
  },
];
