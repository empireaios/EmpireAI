import type { IntegrityPipelineStageRecord } from "./types.js";

/** Vision validation pipeline (P6-02). */
export const INTEGRITY_PIPELINE_REGISTRY: IntegrityPipelineStageRecord[] = [
  { stage: "vision", order: 1, owner: "Pillow", description: "Constitutional Vision alignment" },
  { stage: "vision_accumulation", order: 2, owner: "Pillow", description: "Accumulated vision lessons" },
  { stage: "soul", order: 3, owner: "Pillow", description: "Empire Soul fidelity" },
  { stage: "ctd", order: 4, owner: "Pillow", description: "Core constitutional doctrine" },
  { stage: "constitution_hierarchy", order: 5, owner: "Pillow", description: "Constitution hierarchy validation" },
  { stage: "roadmap", order: 6, owner: "Pillow", description: "Roadmap alignment" },
  { stage: "architecture", order: 7, owner: "Pillow", description: "Architecture law compliance" },
  { stage: "repository", order: 8, owner: "Pillow", description: "Repository constitutional state" },
  { stage: "production_truth", order: 9, owner: "Pillow", description: "Production truth validation" },
  { stage: "mission_proposal", order: 10, owner: "Planner", description: "Mission proposal integrity check" },
  { stage: "integrity_evaluation", order: 11, owner: "VIE", description: "Full integrity evaluation" },
  { stage: "recommendation", order: 12, owner: "VIE", description: "Constitutional recommendation" },
  { stage: "ecc_decision", order: 13, owner: "ECC", description: "ECC execution approval decision" },
];
