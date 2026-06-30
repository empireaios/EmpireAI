import type { ContextSourceDescriptor, ContextTask } from "./types.js";

/** Canonical context sources — extensible catalog (PILLOW-004). */
export const CONTEXT_SOURCE_CATALOG: ContextSourceDescriptor[] = [
  { id: "journey", path: "JOURNEY.md", description: "Living operational map", maxBytes: 12_000 },
  { id: "journey_audit", path: "JOURNEY_AUDIT.md", description: "Journey change log", maxBytes: 8_000 },
  { id: "status", path: "EMPIREAI_STATUS.md", description: "Project state", maxBytes: 6_000 },
  { id: "decisions", path: "EMPIREAI_DECISIONS.md", description: "ADR register", maxBytes: 8_000 },
  { id: "soul", path: "EMPIREAI_SOUL.md", description: "Empire identity", maxBytes: 4_000 },
  { id: "ux_contract", path: "UX_IMPLEMENTATION_CONTRACT.md", description: "UX authority", maxBytes: 10_000 },
  { id: "pillow_contract", path: "PILLOW_ARCHITECTURE_CONTRACT.md", description: "Pillow authority", maxBytes: 8_000 },
  { id: "executive_audit_standard", path: "EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md", description: "Audit standard", maxBytes: 4_000 },
  { id: "bl_b", path: "BL-B.md", description: "Closed backlog release B", maxBytes: 4_000 },
  { id: "bl_c", path: "BL-C.md", description: "Active backlog release C", maxBytes: 4_000 },
  { id: "bl_c_constitution", path: "EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md", description: "BL-C doctrine", maxBytes: 6_000 },
  { id: "ux_enhancement_register", path: "docs/governance/UX_ENHANCEMENT_REGISTER.md", description: "UX enhancements", maxBytes: 6_000 },
  { id: "pillow_enhancement_register", path: "docs/governance/PILLOW_ENHANCEMENT_REGISTER.md", description: "Pillow enhancements", maxBytes: 6_000 },
  { id: "empire_recovery", path: "EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md", description: "Recovery doctrine", maxBytes: 4_000 },
  { id: "constitution", path: "EMPIREAI_CONSTITUTION.md", description: "Permanent law", maxBytes: 4_000 },
];

/** Task → minimum context source IDs (precision over volume). */
export const TASK_SOURCE_MAP: Record<ContextTask, string[]> = {
  general: [],
  continue_ux: [
    "journey",
    "ux_contract",
    "ux_enhancement_register",
    "decisions",
    "bl_c",
    "status",
  ],
  generate_cursor_mission: [
    "journey",
    "status",
    "pillow_contract",
    "ux_contract",
    "pillow_enhancement_register",
    "decisions",
    "bl_c",
  ],
  review_executive_audit: [
    "executive_audit_standard",
    "journey",
    "journey_audit",
    "ux_contract",
    "pillow_contract",
  ],
  empire_progress: [
    "journey",
    "journey_audit",
    "status",
    "soul",
    "decisions",
  ],
  journey_question: ["journey", "journey_audit", "status"],
  architecture: ["journey", "soul", "decisions", "pillow_contract", "constitution"],
  recovery: ["empire_recovery", "journey", "status", "journey_audit"],
};

export function getSourceById(id: string): ContextSourceDescriptor | undefined {
  return CONTEXT_SOURCE_CATALOG.find((s) => s.id === id);
}

export function sourcesForTask(task: ContextTask): ContextSourceDescriptor[] {
  const ids = TASK_SOURCE_MAP[task];
  const seen = new Set<string>();
  const result: ContextSourceDescriptor[] = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    const source = getSourceById(id);
    if (source) {
      seen.add(id);
      result.push(source);
    }
  }

  return result;
}
