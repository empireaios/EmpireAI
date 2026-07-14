import type { PhaseP5ReviewRecord } from "./types.js";

/** Phase P5 Runtime completion review (P5-06). */
export const PHASE_P5_REVIEW_REGISTRY: PhaseP5ReviewRecord[] = [
  {
    missionId: "P5-01",
    name: "Brain Runtime",
    status: "complete",
    runtimeModule: "pillow/src/brain-runtime/ · PILLOW-BR-001",
    findings: ["Runtime bottleneck registry · assessment pipeline · cockpit panel"],
    severity: "low",
  },
  {
    missionId: "P5-02",
    name: "Production Mode",
    status: "complete",
    runtimeModule: "pillow/src/production-mode/ · PILLOW-PM-001",
    findings: ["Production truth validation · mandatory Redis policy documented"],
    severity: "low",
  },
  {
    missionId: "P5-03",
    name: "Durable Sessions",
    status: "complete",
    runtimeModule: "pillow/src/durable-sessions/ · PILLOW-DS-001",
    findings: ["Session architecture documented · Redis auth · ephemeral Pillow chat gap remains"],
    severity: "medium",
  },
  {
    missionId: "P5-04",
    name: "Guardian Monitoring",
    status: "complete",
    runtimeModule: "pillow/src/guardian-monitoring/ · PILLOW-GM-001",
    findings: ["Health · performance · alert timelines · backend Guardian executor referenced"],
    severity: "low",
  },
  {
    missionId: "P5-05",
    name: "Scaling Architecture",
    status: "complete",
    runtimeModule: "pillow/src/scaling-architecture/ · PILLOW-SCL-001",
    findings: ["5-stage roadmap · PostgreSQL migration required before Stage 3"],
    severity: "medium",
  },
  {
    missionId: "P5-06",
    name: "Performance Governance",
    status: "complete",
    runtimeModule: "pillow/src/performance-governance/ · PILLOW-PG-001",
    findings: ["Baselines · metrics · regression detection · Phase P5 review complete"],
    severity: "low",
  },
];

/** Aggregate Phase P5 gaps by severity. */
export function getPhaseP5Gaps(): PhaseP5ReviewRecord[] {
  return PHASE_P5_REVIEW_REGISTRY.filter((r) => r.severity !== "low" || r.findings.some((f) => f.includes("gap") || f.includes("remains")));
}

export function isPhaseP5Complete(): boolean {
  return PHASE_P5_REVIEW_REGISTRY.every((r) => r.status === "complete");
}
