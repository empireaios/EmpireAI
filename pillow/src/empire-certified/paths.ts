/** PILLOW-EC-001 — Empire Certified paths (X5-20). */
export const EMPIRE_CERTIFIED_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMPIRE_CERTIFIED_SYSTEM.md";
export const EC_METADATA_VERSION = "EC-001-v1" as const;
export const EMPIRE_CERTIFIED_ID = "empire-certified" as const;

/** X5 Empire Intelligence modules certified by X5-20. */
export const CERTIFIED_MODULE_IDS = [
  "empire-intelligence-framework",
  "empire-knowledge-engine",
  "empire-memory-engine",
  "empire-optimization-engine",
  "empire-capital-allocation",
  "empire-opportunity-engine",
  "empire-innovation-engine",
  "empire-resilience-engine",
  "empire-self-improvement-engine",
  "executive-empire-dashboard",
  "cross-empire-governance-engine",
  "autonomous-investment-engine",
  "enterprise-succession-engine",
  "empire-legacy-engine",
  "grand-king-advisory-engine",
  "civilization-knowledge-engine",
  "autonomous-empire-evolution",
  "empire-performance-guardian",
  "infinite-growth-engine",
] as const;

export const MODULE_MISSIONS: Record<(typeof CERTIFIED_MODULE_IDS)[number], string> = {
  "empire-intelligence-framework": "X5-01",
  "empire-knowledge-engine": "X5-02",
  "empire-memory-engine": "X5-03",
  "empire-optimization-engine": "X5-04",
  "empire-capital-allocation": "X5-05",
  "empire-opportunity-engine": "X5-06",
  "empire-innovation-engine": "X5-07",
  "empire-resilience-engine": "X5-08",
  "empire-self-improvement-engine": "X5-09",
  "executive-empire-dashboard": "X5-10",
  "cross-empire-governance-engine": "X5-11",
  "autonomous-investment-engine": "X5-12",
  "enterprise-succession-engine": "X5-13",
  "empire-legacy-engine": "X5-14",
  "grand-king-advisory-engine": "X5-15",
  "civilization-knowledge-engine": "X5-16",
  "autonomous-empire-evolution": "X5-17",
  "empire-performance-guardian": "X5-18",
  "infinite-growth-engine": "X5-19",
};

/** Programme-level anchors for X1–X4 structural certification. */
export const CERTIFIED_PROGRAMME_IDS = ["X1", "X2", "X3", "X4", "X5"] as const;

export const PROGRAMME_ANCHOR_IDS = [
  "company-factory-certified",
  "portfolio-intelligence-certified",
  "autonomous-scaling-framework",
  "global-operations-certified",
] as const;

export const PROGRAMME_ANCHORS: Record<"X1" | "X2" | "X3" | "X4", (typeof PROGRAMME_ANCHOR_IDS)[number]> = {
  X1: "company-factory-certified",
  X2: "portfolio-intelligence-certified",
  X3: "autonomous-scaling-framework",
  X4: "global-operations-certified",
};

export const PROGRAMME_LABELS: Record<(typeof CERTIFIED_PROGRAMME_IDS)[number], string> = {
  X1: "Company Factory",
  X2: "Portfolio Intelligence",
  X3: "Autonomous Scaling",
  X4: "Global Expansion",
  X5: "Empire Intelligence",
};

export const ENGINE_STATUSES = ["idle", "active", "connecting", "connected", "certifying", "degraded", "failed"] as const;
export const MODULE_PASS_STATUSES = ["pass", "fail", "skip", "unavailable"] as const;
