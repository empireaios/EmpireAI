export const INFRASTRUCTURE_SERVICES = [
  { id: "svc-brain", name: "Brain API", status: "degraded", uptime: "99.2%", region: "us-east" },
  { id: "svc-web", name: "EmpireAI Web", status: "online", uptime: "99.9%", region: "global" },
  { id: "svc-db", name: "Brain Database", status: "online", uptime: "99.8%", region: "us-east" },
];

export const INFRASTRUCTURE_INTEGRATIONS = [
  { id: "int-stripe", name: "Stripe", type: "Payments", status: "disconnected", lastSync: "—" },
  { id: "int-meta", name: "Meta Ads", type: "Marketing", status: "demo", lastSync: "Demo mode" },
  { id: "int-cj", name: "CJ Dropshipping", type: "Fulfillment", status: "disconnected", lastSync: "—" },
  { id: "int-vercel", name: "Vercel", type: "Deploy", status: "connected", lastSync: "2h ago" },
];

export const INFRASTRUCTURE_DEPLOYMENTS = [
  { id: "dep1", project: "empireai-web", environment: "production", status: "live", version: "124ac21" },
  { id: "dep2", project: "nova-home-preview", environment: "preview", status: "building", version: "demo" },
];

export const INFRASTRUCTURE_ALERTS = [
  { id: "al1", severity: "warning", message: "BRAIN_API_URL not configured in production", service: "Brain API" },
  { id: "al2", severity: "info", message: "Middleware deprecation notice — migrate to proxy", service: "EmpireAI Web" },
];
