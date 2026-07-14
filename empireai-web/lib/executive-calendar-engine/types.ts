/** E1-08 — Executive Calendar Engine frontend types (mirrors Pillow PILLOW-ECE-001). */

export type ExecutiveCalendarEvent = {
  eventId: string;
  title: string;
  purpose: string;
  category: string;
  priority: number;
  owner: string;
  participants: string[];
  dependencies: string[];
  relatedObjectives: string[];
  relatedRoadmap: string;
  relatedProgrammes: string[];
  scheduledDate: string;
  expectedDuration: string;
  status: string;
  evidence: string[];
  segment: string;
  whyItMatters: string;
};

export type CadenceEntry = {
  cadence: string;
  label: string;
  frequency: string;
  nextOccurrence: string;
  status: string;
  owner: string;
};

export type CalendarHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type CalendarLifecycleStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CalendarSegmentSummary = {
  segment: string;
  label: string;
  count: number;
  summary: string;
};

export type CalendarRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCalendarEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveCalendarEngine = {
  architectureVersion: "E1-08";
  computedAt: string;
  calendarSummary: string;
  calendarHealth: string;
  scheduleHealth: string;
  visionAlignment: string;
  planningCadence: string;
  healthScore: number;
  upcomingEventCount: number;
  criticalEventCount: number;
  todaysAgenda: ExecutiveCalendarEvent[];
  upcomingReviews: ExecutiveCalendarEvent[];
  programmeMilestones: ExecutiveCalendarEvent[];
  criticalEvents: ExecutiveCalendarEvent[];
  executiveCadence: CadenceEntry[];
  calendarHierarchy: CalendarHierarchyStep[];
  calendarLifecycle: CalendarLifecycleStep[];
  calendarSegments: CalendarSegmentSummary[];
  recommendedActions: CalendarRecommendation[];
  pillowEvaluations: PillowCalendarEvaluationMetric[];
  calendarPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE109: boolean;
};
