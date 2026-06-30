import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { WorkerEntry } from "./types.js";

const FUTURE_WORKERS: WorkerEntry[] = [
  {
    id: "testing_agent",
    label: "Testing Agent",
    kind: "testing",
    availability: "deferred",
    replaceable: true,
    description: "Future automated test execution worker",
  },
  {
    id: "documentation_agent",
    label: "Documentation Agent",
    kind: "documentation",
    availability: "deferred",
    replaceable: true,
    description: "Future documentation generation worker",
  },
  {
    id: "review_agent",
    label: "Review Agent",
    kind: "review",
    availability: "deferred",
    replaceable: true,
    description: "Future code review worker",
  },
  {
    id: "commercial_agent",
    label: "Commercial Agent",
    kind: "commercial",
    availability: "deferred",
    replaceable: true,
    description: "Future commercial operations worker",
  },
  {
    id: "research_agent",
    label: "Research Agent",
    kind: "research",
    availability: "deferred",
    replaceable: true,
    description: "Future research and analysis worker",
  },
];

export function buildWorkerRegistry(
  supervisor: CursorSupervisorEngine,
): WorkerEntry[] {
  let cursorAvailability: WorkerEntry["availability"] = "available";
  try {
    const state = supervisor.getState();
    const active = state.registry.activeMission;
    cursorAvailability = active ? "busy" : "available";
  } catch {
    cursorAvailability = "offline";
  }

  return [
    {
      id: "cursor",
      label: "Cursor",
      kind: "engineering",
      availability: cursorAvailability,
      replaceable: true,
      description: "Primary engineering worker — supervised by Cursor Supervisor",
    },
    ...FUTURE_WORKERS,
  ];
}

export function getAvailableWorkers(workers: WorkerEntry[]): WorkerEntry[] {
  return workers.filter((w) => w.availability === "available");
}
