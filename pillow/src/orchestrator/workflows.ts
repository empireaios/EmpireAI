import type { WorkflowDefinition, WorkflowId } from "./types.js";

export const WORKFLOW_CATALOG: WorkflowDefinition[] = [
  {
    id: "engineering",
    label: "Engineering Pipeline",
    steps: [
      { order: 1, label: "Mission Planner", subsystemId: "mission_planner" },
      { order: 2, label: "Cursor Supervisor", subsystemId: "cursor_supervisor" },
      { order: 3, label: "Engineering Worker", subsystemId: "cursor_supervisor" },
      {
        order: 4,
        label: "Recovery Manager",
        subsystemId: "recovery_manager",
        optional: true,
      },
      {
        order: 5,
        label: "Executive Audit Reviewer",
        subsystemId: "executive_audit_reviewer",
      },
      {
        order: 6,
        label: "Repository Synchronizer",
        subsystemId: "repository_synchronizer",
      },
      { order: 7, label: "Repository Memory Refresh", subsystemId: "memory" },
      {
        order: 8,
        label: "Continuous Due Diligence",
        subsystemId: "due_diligence",
      },
      { order: 9, label: "Mission Planner", subsystemId: "mission_planner" },
    ],
  },
  {
    id: "repository_synchronization",
    label: "Repository Synchronization",
    steps: [
      { order: 1, label: "Repository Synchronizer Preview", subsystemId: "repository_synchronizer" },
      { order: 2, label: "Grand King Approval", subsystemId: "grand_king_command_interface" },
      { order: 3, label: "Repository Synchronizer Execute", subsystemId: "repository_synchronizer" },
      { order: 4, label: "Repository Memory Refresh", subsystemId: "memory" },
    ],
  },
  {
    id: "executive_review",
    label: "Executive Review",
    steps: [
      { order: 1, label: "Executive Audit Reviewer", subsystemId: "executive_audit_reviewer" },
      { order: 2, label: "Mission Planner", subsystemId: "mission_planner" },
    ],
  },
  {
    id: "mission_planning",
    label: "Mission Planning",
    steps: [
      { order: 1, label: "Repository Memory", subsystemId: "memory" },
      { order: 2, label: "Mission Planner", subsystemId: "mission_planner" },
    ],
  },
  {
    id: "recovery",
    label: "Recovery",
    steps: [
      { order: 1, label: "Cursor Supervisor Stall Detection", subsystemId: "cursor_supervisor" },
      { order: 2, label: "Recovery Manager", subsystemId: "recovery_manager" },
      { order: 3, label: "Cursor Supervisor Resume", subsystemId: "cursor_supervisor" },
    ],
  },
  {
    id: "architecture_improvement",
    label: "Architecture Improvement",
    steps: [
      { order: 1, label: "Continuous Due Diligence", subsystemId: "due_diligence" },
      { order: 2, label: "Autonomous Improvement Engine", subsystemId: "autonomous_improvement" },
      { order: 3, label: "Grand King Approval", subsystemId: "grand_king_command_interface" },
      { order: 4, label: "Mission Planner", subsystemId: "mission_planner" },
    ],
  },
  {
    id: "commercial_improvement",
    label: "Commercial Improvement",
    steps: [
      { order: 1, label: "Continuous Due Diligence", subsystemId: "due_diligence" },
      { order: 2, label: "Autonomous Improvement Engine", subsystemId: "autonomous_improvement" },
      { order: 3, label: "Grand King Approval", subsystemId: "grand_king_command_interface" },
    ],
  },
  {
    id: "continuous_due_diligence",
    label: "Continuous Due Diligence",
    steps: [
      { order: 1, label: "Repository Memory", subsystemId: "memory" },
      { order: 2, label: "Continuous Due Diligence", subsystemId: "due_diligence" },
      { order: 3, label: "Autonomous Improvement Engine", subsystemId: "autonomous_improvement" },
    ],
  },
];

export function getWorkflow(id: WorkflowId): WorkflowDefinition {
  const wf = WORKFLOW_CATALOG.find((w) => w.id === id);
  if (!wf) {
    throw new Error(`Unknown workflow: ${id}`);
  }
  return wf;
}

export function listWorkflows(): WorkflowDefinition[] {
  return [...WORKFLOW_CATALOG];
}
