import type { ContinuousEvolutionDeps, DueDiligenceCoverage, DueDiligenceFinding } from "./types.js";

const ALL_DOMAINS: DueDiligenceCoverage["domainsInspected"] = [
  "architecture",
  "engineering",
  "commerce",
  "infrastructure",
  "security",
  "operations",
  "governance",
  "documentation",
];

export function inspectDueDiligence(deps: ContinuousEvolutionDeps): DueDiligenceCoverage {
  const findings: DueDiligenceFinding[] = [];
  const health = deps.intelligence.health.score;
  const issueCount = deps.intelligence.health.issues.length;

  if (health < 75) {
    findings.push({
      domain: "architecture",
      severity: health < 50 ? "critical" : "high",
      weakness: `Repository health ${health}/100 with ${issueCount} issues`,
      preventiveAction: "Run Technical Chief certification and resolve architecture debt",
    });
  }

  if (issueCount > 10) {
    findings.push({
      domain: "engineering",
      severity: "high",
      weakness: `${issueCount} tracked engineering issues`,
      preventiveAction: "Prioritise engineering missions via Cursor Bridge",
    });
  }

  const commerce = deps.commerceIntelligence.analyzeCommerce();
  if (commerce.recommendedProducts.length === 0) {
    findings.push({
      domain: "commerce",
      severity: "medium",
      weakness: "No products above quality threshold",
      preventiveAction: "Expand Commerce Intelligence catalog or lower threshold temporarily",
    });
  }

  const infra = deps.infrastructureCommander.getLastSnapshot();
  if (!infra || infra.overallHealth !== "healthy") {
    findings.push({
      domain: "infrastructure",
      severity: infra?.overallHealth === "critical" ? "critical" : "medium",
      weakness: infra ? `Infrastructure ${infra.overallHealth}` : "No recent infrastructure scan",
      preventiveAction: "Run Infrastructure Commander scan and recovery if needed",
    });
  }

  findings.push({
    domain: "security",
    severity: "medium",
    weakness: "Credential vault and auth require periodic verification",
    preventiveAction: "Schedule G8 identity authorization health check",
  });

  const subs = deps.orchestrator?.getSubsystems() ?? [];
  const degraded = subs.filter((s) => s.health === "degraded" || s.health === "unavailable");
  if (degraded.length > 0) {
    findings.push({
      domain: "operations",
      severity: "high",
      weakness: `${degraded.length} subsystem(s) degraded or unavailable`,
      preventiveAction: "Refresh subsystem discovery and resolve blockers",
    });
  }

  if (health < 60) {
    findings.push({
      domain: "governance",
      severity: "high",
      weakness: "Governance integrity tied to repository health",
      preventiveAction: "Executive audit review before major changes",
    });
  }

  if (issueCount > 5) {
    findings.push({
      domain: "documentation",
      severity: "low",
      weakness: "Documentation may lag behind rapid engineering changes",
      preventiveAction: "Sync governance artifacts via Repository Synchronizer",
    });
  }

  const severityWeight: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const weaknessScore = findings.length > 0
    ? Math.min(100, findings.reduce((s, f) => s + severityWeight[f.severity]! * 8, 0))
    : 10;

  return {
    domainsInspected: ALL_DOMAINS,
    findings,
    overallWeaknessScore: weaknessScore,
  };
}
