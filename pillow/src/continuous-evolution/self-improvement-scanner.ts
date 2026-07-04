import type { ContinuousEvolutionDeps, ImprovementBacklogItem, SelfImprovementReport } from "./types.js";

export function scanSelfImprovement(deps: ContinuousEvolutionDeps): SelfImprovementReport {
  const backlog: ImprovementBacklogItem[] = [];
  const health = deps.intelligence.health.score;
  const issues = deps.intelligence.health.issues;

  if (health < 80) {
    backlog.push({
      id: "IMP-ARCH-001",
      category: "technical_debt",
      title: "Resolve repository architecture debt",
      description: `Health score ${health}/100 — ${issues.length} tracked issues`,
      priority: 95,
      estimatedEffort: "high",
    });
  }

  backlog.push({
    id: "IMP-AUTO-001",
    category: "automation",
    title: "Wire live CJ API into Commerce Intelligence",
    description: "Replace static catalog with real-time supplier/product feed",
    priority: 85,
    estimatedEffort: "medium",
  });

  backlog.push({
    id: "IMP-AUTO-002",
    category: "automation",
    title: "Scheduled Empire Commander cross-domain scans",
    description: "Orchestrator-triggered daily executive intelligence cycles",
    priority: 80,
    estimatedEffort: "medium",
  });

  if (issues.length > 15) {
    backlog.push({
      id: "IMP-DUP-001",
      category: "duplicate_logic",
      title: "Consolidate overlapping commerce intelligence paths",
      description: "Backend PILLOW-020 and Pillow package commerce-intelligence alignment",
      priority: 75,
      estimatedEffort: "medium",
    });
  }

  backlog.push({
    id: "IMP-PERF-001",
    category: "performance",
    title: "Cache infrastructure probes between scans",
    description: "Infrastructure Commander already caches — extend to commerce analysis",
    priority: 70,
    estimatedEffort: "low",
  });

  backlog.push({
    id: "IMP-COST-001",
    category: "cost_reduction",
    title: "Optimise Railway/Vercel resource utilisation",
    description: "Review deployment topology for cost efficiency",
    priority: 65,
    estimatedEffort: "low",
  });

  backlog.push({
    id: "IMP-QUAL-001",
    category: "quality",
    title: "Expand Pillow validation test coverage for Phase 9+ modules",
    description: "Integration tests for cockpit wiring",
    priority: 60,
    estimatedEffort: "medium",
  });

  backlog.sort((a, b) => b.priority - a.priority);

  return {
    backlog,
    totalItems: backlog.length,
    topPriority: backlog[0] ?? null,
  };
}
