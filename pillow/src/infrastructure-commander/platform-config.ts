/** Canonical EmpireAI production infrastructure endpoints. */
export const INFRASTRUCTURE_ENDPOINTS = {
  railway: {
    baseUrl:
      process.env.RAILWAY_HEALTH_URL?.trim() ||
      process.env.BRAIN_API_URL?.trim() ||
      "https://empireai-production.up.railway.app",
    healthPath: "/health",
    pillowPath: "/api/pillow/health",
  },
  vercel: {
    productionUrl:
      process.env.VERCEL_PRODUCTION_URL?.trim() ||
      process.env.EMPIREAI_FRONTEND_URL?.trim() ||
      "https://empire-ai.co",
    pillowBffPath: "/api/pillow/health",
    homePath: "/",
  },
  github: {
    defaultRemote: "origin",
    defaultBranch: "main",
  },
} as const;

export const RESTART_STRATEGY =
  "Railway restartPolicyType=ON_FAILURE (max 10 retries) per railway.toml";

export const ROLLBACK_PLAN =
  "Revert commit on main → push → Railway/Vercel auto-redeploy → verify /health and /api/pillow/health";
