/** P7-02 — Cockpit UX Architecture frontend types (mirrors Pillow PILLOW-CUX-001). */

export type ExecutiveHomeMetric = {
  field: string;
  label: string;
  value: string;
  status: string;
};

export type CockpitCentreRecord = {
  id: string;
  label: string;
  route: string;
  description: string;
  status: string;
};

export type CockpitWidgetRecord = {
  widget: string;
  label: string;
  status: string;
  summary: string;
  refreshMs: number;
};

export type RealtimeDomainRecord = {
  domain: string;
  label: string;
  mode: string;
  intervalMs: number;
  status: string;
};

export type PublicationFeed = {
  source: string;
  category: string;
  items: string[];
};

export type CockpitUxArchitecture = {
  architectureVersion: "P7-02";
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
  uxPrinciples: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForP703: boolean;
};
