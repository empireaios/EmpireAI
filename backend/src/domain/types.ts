export type CompanyStatus = "live" | "building" | "paused";
export type BuildStageStatus = "complete" | "in_progress" | "pending";

export type CompanyRecord = {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  status: CompanyStatus;
  revenueCents: number;
  marginPct: number | null;
  agentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BuildStageRecord = {
  id: string;
  companyId: string;
  stage: string;
  progress: number;
  status: BuildStageStatus;
  sortOrder: number;
};

export type ActivityRecord = {
  id: string;
  workspaceId: string;
  agentName: string;
  action: string;
  module: string;
  outcome: string | null;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  workspaceId: string;
  companyId: string;
  companyName: string;
  productName: string;
  totalCents: number;
  profitCents: number;
  status: string;
  createdAt: string;
};

export type SupplierRecord = {
  id: string;
  workspaceId: string;
  name: string;
  region: string;
  productCount: number;
  reliability: number;
  avgShipDays: number;
  status: "healthy" | "degraded";
};

export type ProductRecord = {
  id: string;
  workspaceId: string;
  name: string;
  score: number;
  demand: string;
  marginCents: number;
  trend: string;
};

export type CampaignRecord = {
  id: string;
  workspaceId: string;
  companyId: string | null;
  name: string;
  channel: string;
  status: string;
  reach: string;
  conversion: string;
};

export type AdChannelRecord = {
  id: string;
  workspaceId: string;
  channel: string;
  spendCents: number;
  roas: number;
  status: string;
};

export type TicketRecord = {
  id: string;
  workspaceId: string;
  subject: string;
  customerName: string;
  status: string;
  agentName: string;
  resolutionSeconds: number | null;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
};

export type IntegrationRecord = {
  id: string;
  workspaceId: string;
  name: string;
  status: string;
};
