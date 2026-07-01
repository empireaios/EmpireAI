export type MissionSeverity = "critical" | "high" | "medium" | "low";

export type MissionQueueItem = {
  id: string;
  type: string;
  title: string;
  age: string;
  severity: MissionSeverity;
  actions: string[];
  queue: "urgent" | "pending" | "completed";
};

export const PLACEHOLDER_MISSION_QUEUE: MissionQueueItem[] = [
  {
    id: "urg-1",
    type: "Fulfillment",
    title: "Approve CJ — Order #1842",
    age: "12m",
    severity: "critical",
    actions: ["Review", "✓"],
    queue: "urgent",
  },
  {
    id: "urg-2",
    type: "Pillow",
    title: "Cursor: REAL-087 Mission Centre",
    age: "45m",
    severity: "critical",
    actions: ["Review", "✓", "✗"],
    queue: "urgent",
  },
  {
    id: "urg-3",
    type: "AI CEO",
    title: "Scale Meta budget +$500/day",
    age: "2h",
    severity: "high",
    actions: ["Deny", "✓"],
    queue: "urgent",
  },
  {
    id: "pen-1",
    type: "V1 Blocker",
    title: "CJ credentials not configured",
    age: "1d",
    severity: "medium",
    actions: ["Integrations"],
    queue: "pending",
  },
  {
    id: "pen-2",
    type: "Assistant",
    title: "Generate commerce audit",
    age: "3h",
    severity: "low",
    actions: ["Open"],
    queue: "pending",
  },
  {
    id: "done-1",
    type: "Manufacture",
    title: "Approved manufacture — Nova Home",
    age: "09:14",
    severity: "low",
    actions: [],
    queue: "completed",
  },
];

export type MissionPreviewItem = {
  id: string;
  label: string;
  severity: MissionSeverity;
  action: string;
};

/** Top missions for Executive Home preview (subset of full queue). */
export const PLACEHOLDER_MISSION_PREVIEWS: MissionPreviewItem[] = [
  { id: "m1", label: "CJ fulfill #1842", severity: "critical", action: "Review" },
  { id: "m2", label: "Cursor REAL-087", severity: "critical", action: "Review" },
  { id: "m3", label: "Meta budget +$500", severity: "high", action: "Review" },
  { id: "m4", label: "CJ creds missing", severity: "medium", action: "Fix" },
];

export const PLACEHOLDER_MISSION_BLOCKERS = [
  {
    id: "blk-1",
    label: "CJ credentials not configured",
    hint: "Blocks live fulfillment on Operations",
    action: "Open Integrations",
  },
  {
    id: "blk-2",
    label: "V1 certification — 1 open blocker",
    hint: "Review governance checklist before go-live",
    action: "View V1",
  },
];

export function countMissionsByQueue(queue: MissionQueueItem["queue"]) {
  return PLACEHOLDER_MISSION_QUEUE.filter((item) => item.queue === queue).length;
}
