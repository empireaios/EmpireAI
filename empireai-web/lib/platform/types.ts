export type ModuleId =
  | "dashboard"
  | "ai-ceo"
  | "intelligence"
  | "suppliers"
  | "store"
  | "marketing"
  | "ads"
  | "finance"
  | "orders"
  | "support"
  | "settings"
  | "admin"
  | "integrations"
  | "cockpit-command"
  | "launch"
  | "executive-home"
  | "cockpit-missions"
  | "cockpit-automation"
  | "cockpit-authorization-centre"
  | "cockpit-audit"
  | "cockpit-pillow"
  | "cockpit-engine"
  | "cockpit-intelligence"
  | "product-intelligence-engine"
  | "market-intelligence-engine"
  | "supplier-intelligence-engine"
  | "financial-intelligence-engine"
  | "quantitative-intelligence-engine"
  | "advertising-intelligence-engine"
  | "customer-intelligence-engine"
  | "risk-intelligence-engine"
  | "decision-intelligence-engine"
  | "executive-intelligence-orchestrator"
  | "cockpit-interaction"
  | "executive-relationship-graph"
  | "cockpit-global-assistant";

export type PlatformModule = {
  id: ModuleId;
  label: string;
  shortLabel?: string;
  href: string;
  description: string;
  category: "command" | "manufacturing" | "operations" | "system";
};

export type MetricTrend = "up" | "down" | "neutral";

export type Metric = {
  label: string;
  value: string;
  change?: string;
  trend?: MetricTrend;
};

export type AgentStatus = "active" | "working" | "idle" | "alert";

export type Agent = {
  id: string;
  name: string;
  role: string;
  module: ModuleId;
  status: AgentStatus;
  lastAction: string;
  tasksToday: number;
};

export type Company = {
  id: string;
  name: string;
  category: string;
  status: "live" | "building" | "paused";
  revenue: string;
  margin: string;
  agents: number;
};

export type ActivityItem = {
  id: string;
  agent: string;
  action: string;
  module: ModuleId;
  timestamp: string;
  outcome?: string;
};

import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
};
