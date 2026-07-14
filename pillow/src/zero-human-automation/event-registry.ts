/** Zero-Human Automation event registry (P6-07). */
export const AUTOMATION_EVENT_REGISTRY = [
  { kind: "automation_started", description: "Automated workflow initiated" },
  { kind: "automation_queued", description: "Work queued for automated execution" },
  { kind: "automation_progress", description: "Automation pipeline stage advanced" },
  { kind: "automation_completed", description: "Automated workflow completed successfully" },
  { kind: "automation_failed", description: "Automation failure detected" },
  { kind: "automation_stopped", description: "Automation stopped by safety gate" },
  { kind: "automation_escalated", description: "Escalated to Grand King for approval" },
  { kind: "automation_recovered", description: "Automation recovered via Recovery Engine" },
  { kind: "automation_recommended", description: "Pillow recommended automation improvement" },
  { kind: "level_upgraded", description: "Subsystem automation level upgraded" },
] as const;
