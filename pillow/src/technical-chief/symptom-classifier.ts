import type { FailureCategory, RiskLevel } from "./types.js";

const CATEGORY_PATTERNS: Array<{ category: FailureCategory; patterns: RegExp[] }> = [
  {
    category: "frontend",
    patterns: [/failed to fetch/i, /browser/i, /cockpit/i, /vercel.*frontend/i, /next\.js/i, /ui/i],
  },
  {
    category: "deployment",
    patterns: [/deploy/i, /railway/i, /vercel/i, /build fail/i, /nixpacks/i, /cold start/i],
  },
  {
    category: "authentication",
    patterns: [/401/i, /403/i, /auth/i, /session/i, /cookie/i, /login/i, /unauthorized/i],
  },
  {
    category: "api",
    patterns: [/502/i, /503/i, /504/i, /timeout/i, /proxy/i, /bff/i, /api\//i, /endpoint/i],
  },
  {
    category: "backend",
    patterns: [/brain/i, /fastify/i, /pillow-host/i, /orchestration/i, /backend/i],
  },
  {
    category: "redis",
    patterns: [/redis/i, /bullmq/i, /queue/i, /upstash/i],
  },
  {
    category: "worker",
    patterns: [/worker/i, /background job/i, /job fail/i],
  },
  {
    category: "database",
    patterns: [/sqlite/i, /database/i, /migration/i, /sql/i],
  },
  {
    category: "performance",
    patterns: [/slow/i, /latency/i, /bottleneck/i, /hang/i],
  },
  {
    category: "memory",
    patterns: [/memory leak/i, /heap/i, /oom/i, /out of memory/i],
  },
  {
    category: "architecture_drift",
    patterns: [/drift/i, /missing module/i, /ts2307/i, /not committed/i, /governance bundle/i],
  },
  {
    category: "runtime",
    patterns: [/crash/i, /exception/i, /error/i, /lifecycle/i, /bootstrap fail/i],
  },
];

export function classifySymptoms(text: string): {
  categories: FailureCategory[];
  symptoms: string[];
  severity: RiskLevel;
} {
  const normalized = text.trim();
  const categories = new Set<FailureCategory>();
  const symptoms: string[] = [];

  if (/failed to fetch/i.test(normalized)) {
    categories.add("frontend");
    categories.add("api");
  }

  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) {
      categories.add(category);
    }
  }

  if (categories.size === 0) categories.add("unknown");

  if (/503|crash|bootstrap fail|data loss/i.test(normalized)) symptoms.push("Service unavailable or bootstrap failure");
  if (/failed to fetch/i.test(normalized)) symptoms.push("Browser network fetch failure");
  if (/timeout|504/i.test(normalized)) symptoms.push("Request timeout");
  if (/401|403|auth/i.test(normalized)) symptoms.push("Authentication or authorization failure");
  if (/502|proxy/i.test(normalized)) symptoms.push("BFF proxy or upstream gateway failure");
  if (/deploy/i.test(normalized)) symptoms.push("Deployment pipeline issue");
  if (symptoms.length === 0) symptoms.push("Unclassified engineering symptom — requires Technical Chief analysis");

  let severity: RiskLevel = "medium";
  if (/503|crash|data loss|production down/i.test(normalized)) severity = "critical";
  else if (/502|504|failed to fetch|auth fail/i.test(normalized)) severity = "high";
  else if (/warning|slow|drift/i.test(normalized)) severity = "low";

  return { categories: [...categories], symptoms, severity };
}
