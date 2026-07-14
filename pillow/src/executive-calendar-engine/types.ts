/** PILLOW-ECE-001 — Executive Calendar Engine types (E1-08). */

import type {
  CALENDAR_HIERARCHY,
  CALENDAR_LIFECYCLE,
  CALENDAR_PRINCIPLES,
  GOVERNED_CALENDAR_DOMAINS,
  EXECUTIVE_CADENCE,
  CALENDAR_SEGMENTS,
  PILLOW_CALENDAR_EVALUATIONS,
} from "./paths.js";

export type ExecutiveCalendarEngineVersion = "E1-08";

export type CalendarHierarchyLayer = (typeof CALENDAR_HIERARCHY)[number];
export type CalendarLifecyclePhase = (typeof CALENDAR_LIFECYCLE)[number];
export type CalendarPrinciple = (typeof CALENDAR_PRINCIPLES)[number];
export type GovernedCalendarDomain = (typeof GOVERNED_CALENDAR_DOMAINS)[number];
export type ExecutiveCadenceType = (typeof EXECUTIVE_CADENCE)[number];
export type CalendarSegment = (typeof CALENDAR_SEGMENTS)[number];
export type PillowCalendarEvaluation = (typeof PILLOW_CALENDAR_EVALUATIONS)[number];

export type CalendarHierarchyStep = {
  layer: CalendarHierarchyLayer;
  label: string;
  order: number;
  summary: string;
};

export type CalendarLifecycleStep = {
  phase: CalendarLifecyclePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveCalendarEvent = {
  eventId: string;
  title: string;
  purpose: string;
  category: GovernedCalendarDomain;
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
  segment: CalendarSegment;
  whyItMatters: string;
};

export type CadenceEntry = {
  cadence: ExecutiveCadenceType;
  label: string;
  frequency: string;
  nextOccurrence: string;
  status: string;
  owner: string;
};

export type CalendarSegmentSummary = {
  segment: CalendarSegment;
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
  domain: PillowCalendarEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveCalendarEngine = {
  architectureVersion: ExecutiveCalendarEngineVersion;
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
  calendarPrinciples: CalendarPrinciple[];
  governedDomains: GovernedCalendarDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    initiativePortfolioEngine: string;
    departmentPlanningEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE109: boolean;
};
