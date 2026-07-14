/** PILLOW-CUX-001 — Executive Cockpit UX Architecture types (P7-02). */

import type {
  COCKPIT_CENTRES,
  COCKPIT_UX_PRINCIPLES,
  EXECUTIVE_HOME_FIELDS,
  COCKPIT_WIDGETS,
  REALTIME_DOMAINS,
  PILLOW_PUBLICATIONS,
  SUPERVISOR_PUBLICATIONS,
  GUARDIAN_PUBLICATIONS,
} from "./paths.js";

export type CockpitUxArchitectureVersion = "P7-02";

export type CockpitCentre = (typeof COCKPIT_CENTRES)[number];
export type CockpitUxPrinciple = (typeof COCKPIT_UX_PRINCIPLES)[number];
export type ExecutiveHomeField = (typeof EXECUTIVE_HOME_FIELDS)[number];
export type CockpitWidget = (typeof COCKPIT_WIDGETS)[number];
export type RealtimeDomain = (typeof REALTIME_DOMAINS)[number];
export type PillowPublication = (typeof PILLOW_PUBLICATIONS)[number];
export type SupervisorPublication = (typeof SUPERVISOR_PUBLICATIONS)[number];
export type GuardianPublication = (typeof GUARDIAN_PUBLICATIONS)[number];

export type CockpitCentreRecord = {
  id: CockpitCentre;
  label: string;
  route: string;
  description: string;
  status: string;
};

export type ExecutiveHomeMetric = {
  field: ExecutiveHomeField;
  label: string;
  value: string;
  status: string;
};

export type CockpitWidgetRecord = {
  widget: CockpitWidget;
  label: string;
  status: string;
  summary: string;
  refreshMs: number;
};

export type RealtimeDomainRecord = {
  domain: RealtimeDomain;
  label: string;
  mode: "sse" | "poll" | "hybrid";
  intervalMs: number;
  status: string;
};

export type PublicationFeed = {
  source: string;
  category: string;
  items: string[];
};

export type CockpitUxArchitecture = {
  architectureVersion: CockpitUxArchitectureVersion;
  computedAt: string;
  cockpitSummary: string;
  empireHealth: string;
  executiveAwarenessScore: number;
  navigationStatus: string;
  realtimeStatus: string;
  executiveHome: ExecutiveHomeMetric[];
  centres: CockpitCentreRecord[];
  widgets: CockpitWidgetRecord[];
  realtimeDomains: RealtimeDomainRecord[];
  pillowPublications: PublicationFeed[];
  supervisorPublications: PublicationFeed[];
  guardianPublications: PublicationFeed[];
  uxPrinciples: CockpitUxPrinciple[];
  pillowAdvisory: string[];
  integrations: {
    founderShell: string;
    executiveHome: string;
    brainSse: string;
    pillowCentre: string;
    builderConsole: string;
    supervisorCentre: string;
    guardianCentre: string;
    journeyCentre: string;
    commerceCentre: string;
  };
  readyForP703: boolean;
};
