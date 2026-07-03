import type {
  ExecutiveInfrastructureReport,
  InfrastructureMonitorSnapshot,
  RecoveryCoordinationPlan,
} from "./types.js";

export function buildExecutiveInfrastructureReport(
  snapshot: InfrastructureMonitorSnapshot,
  recovery?: RecoveryCoordinationPlan | null,
): ExecutiveInfrastructureReport {
  const githubSummary = [
    `Repo: ${snapshot.github.repository ?? "unknown"} @ ${snapshot.github.branch ?? "?"}`,
    `Sync: ${snapshot.github.syncStatus}`,
    `Release readiness: ${snapshot.github.releaseReadiness}`,
  ].join(" · ");

  const railwaySummary = [
    `Brain: ${snapshot.railway.brainOnline ? "online" : "offline"}`,
    `Health: ${snapshot.railway.healthEndpoint}`,
    `Pillow: ${snapshot.railway.pillowHealth}`,
    snapshot.railway.responseMs ? `${snapshot.railway.responseMs}ms` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const vercelSummary = [
    `Frontend: ${snapshot.vercel.frontendReachable ? "up" : "down"}`,
    `BFF: ${snapshot.vercel.bffHealth}`,
    `Pillow proxy: ${snapshot.vercel.pillowProxyOk ? "ok" : "fail"}`,
  ].join(" · ");

  const applicationSummary = [
    `Availability: ${snapshot.application.serviceAvailability}`,
    `TLS: ${snapshot.application.certificateOk ? "ok" : "check"}`,
    `${snapshot.application.endpoints.filter((e) => e.ok).length}/${snapshot.application.endpoints.length} endpoints ok`,
  ].join(" · ");

  const activeDeployments = [
    `Railway: ${snapshot.railway.serviceUrl}`,
    `Vercel: ${snapshot.vercel.productionUrl}`,
  ];

  const recommendedActions: string[] = [];
  if (snapshot.github.uncommittedChanges > 0) {
    recommendedActions.push("Commit or stash local changes before production deploy");
  }
  if (snapshot.railway.health !== "healthy") {
    recommendedActions.push("Investigate Railway Brain health — check deploy logs");
  }
  if (snapshot.vercel.health !== "healthy") {
    recommendedActions.push("Verify Vercel BFF proxy and BRAIN_API_URL");
  }
  if (snapshot.productionReadiness !== "healthy") {
    recommendedActions.push("Hold production releases until all platforms green");
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("No action required — infrastructure operational");
  }

  const recoveryStatus = recovery
    ? `Recovery coordinated (${recovery.category}): ${recovery.automatedSteps.length} automated step(s)`
    : snapshot.executiveAttentionRequired
      ? "Recovery plan available on request"
      : "No active recovery";

  const summary = [
    `Overall: ${snapshot.overallHealth}`,
    `Production readiness: ${snapshot.productionReadiness}`,
    `Alert: ${snapshot.alertLevel}`,
  ].join(" · ");

  const executiveBrief = formatExecutiveBrief(
    snapshot,
    summary,
    githubSummary,
    railwaySummary,
    vercelSummary,
    applicationSummary,
    recommendedActions,
    recoveryStatus,
    recovery,
  );

  return {
    version: "PILLOW-IC-001",
    generatedAt: new Date().toISOString(),
    overallHealth: snapshot.overallHealth,
    productionReadiness: snapshot.productionReadiness,
    alertLevel: snapshot.alertLevel,
    summary,
    githubSummary,
    railwaySummary,
    vercelSummary,
    applicationSummary,
    activeDeployments,
    currentRisks: snapshot.activeRisks.slice(0, 8),
    recommendedActions,
    recoveryStatus,
    executiveBrief,
  };
}

function formatExecutiveBrief(
  snapshot: InfrastructureMonitorSnapshot,
  summary: string,
  github: string,
  railway: string,
  vercel: string,
  application: string,
  actions: string[],
  recoveryStatus: string,
  recovery: RecoveryCoordinationPlan | null | undefined,
): string {
  const lines = [
    "--- Infrastructure Commander (PILLOW-IC-001) ---",
    summary,
    "",
    "### GitHub",
    github,
    snapshot.github.recentCommits[0] ? `Latest: ${snapshot.github.recentCommits[0]}` : null,
    "",
    "### Railway",
    railway,
    "",
    "### Vercel",
    vercel,
    "",
    "### Application",
    application,
    "",
    "### Recommended Actions",
    ...actions.map((a) => `- ${a}`),
    "",
    "### Recovery",
    recoveryStatus,
  ].filter(Boolean) as string[];

  if (recovery) {
    lines.push("", "### Recovery Steps (automated)", ...recovery.automatedSteps.map((s) => `- ${s}`));
  }

  if (snapshot.activeRisks.length > 0) {
    lines.push("", "### Active Risks", ...snapshot.activeRisks.slice(0, 5).map((r) => `- ${r}`));
  }

  return lines.join("\n");
}

export function formatExecutiveInfrastructureReport(report: ExecutiveInfrastructureReport): string {
  return report.executiveBrief;
}
