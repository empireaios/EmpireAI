export const WORKFORCE_AGENTS = [
  { id: "agent-casey", name: "Casey", role: "Store Builder", status: "online", dispatches: 24, queue: 2 },
  { id: "agent-jordan", name: "Jordan", role: "Launch Commander", status: "online", dispatches: 18, queue: 1 },
  { id: "agent-riley", name: "Riley", role: "Copywriter", status: "online", dispatches: 31, queue: 4 },
  { id: "agent-taylor", name: "Taylor", role: "Media Buyer", status: "idle", dispatches: 12, queue: 0 },
  { id: "agent-sam", name: "Sam", role: "Intelligence", status: "online", dispatches: 9, queue: 3 },
  { id: "agent-alex", name: "Alex", role: "CEO Advisor", status: "online", dispatches: 6, queue: 1 },
];

export const WORKFORCE_MISSIONS = [
  { id: "m1", title: "Approve Nova Home launch gate", agent: "Jordan", priority: "high", status: "pending" },
  { id: "m2", title: "Generate Essentials email sequence", agent: "Riley", priority: "medium", status: "in_progress" },
  { id: "m3", title: "Scan modular storage category", agent: "Sam", priority: "medium", status: "queued" },
  { id: "m4", title: "Adjust Meta campaign budget", agent: "Taylor", priority: "low", status: "pending" },
];

export const WORKFORCE_ACTIVITY = [
  { id: "a1", time: "10:42", agent: "Casey", action: "Updated store blueprint — Nova Home 72%" },
  { id: "a2", time: "10:38", agent: "Riley", action: "Drafted hero copy for Ambient Lamp Pro" },
  { id: "a3", time: "10:31", agent: "Sam", action: "Completed discovery scan — home ambient lighting" },
];
