export type CommerceWorkspaceCompany = {
  id: string;
  name: string;
  niche: string;
  status: string;
  revenue: string;
  buildProgress: number;
  agent: string;
};

export const COMMERCE_WORKSPACE_COMPANIES: CommerceWorkspaceCompany[] = [
  {
    id: "nova-home",
    name: "Nova Home",
    niche: "Home & lifestyle",
    status: "building",
    revenue: "$12.4k",
    buildProgress: 72,
    agent: "Casey · Store Builder",
  },
  {
    id: "vertex-saas",
    name: "Vertex SaaS",
    niche: "B2B software",
    status: "live",
    revenue: "$84.2k",
    buildProgress: 100,
    agent: "Alex · Launch Commander",
  },
  {
    id: "meridian-beauty",
    name: "Meridian Beauty",
    niche: "DTC cosmetics",
    status: "launch_ready",
    revenue: "$0",
    buildProgress: 94,
    agent: "Jordan · Launch Commander",
  },
  {
    id: "atlas-fintech",
    name: "Atlas Fintech",
    niche: "Financial tools",
    status: "discovery",
    revenue: "—",
    buildProgress: 28,
    agent: "Sam · Intelligence",
  },
];

export function getCommerceWorkspaceCompany(id: string) {
  return COMMERCE_WORKSPACE_COMPANIES.find((c) => c.id === id);
}

export const COMMERCE_WORKSPACE_DETAIL_MILESTONES = [
  { label: "Brand manufactured", status: "complete", progress: 100 },
  { label: "Store blueprint", status: "in_progress", progress: 72 },
  { label: "Launch readiness", status: "in_progress", progress: 68 },
  { label: "Marketing package", status: "pending", progress: 35 },
  { label: "Live deploy", status: "pending", progress: 0 },
];
