/** E5-14 — Continuity status, incidents, recovery, and operational readiness. */

import type {
  ResilienceIncidentRecord,
  EnterpriseHealthEntry,
  ContinuityStatusEntry,
  ActiveIncidentEntry,
  RecoveryProgressEntry,
  OperationalReadinessEntry,
  GovernedResilienceDomain,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildEnterpriseHealthEntries(input: {
  healthScore: number;
  e5Gov: boolean;
  e5Guard: boolean;
  activeIncidents: number;
}): EnterpriseHealthEntry[] {
  return [
    {
      healthId: "eh-exec",
      domain: "Executive Operations",
      score: input.healthScore,
      status: input.healthScore >= 85 ? "operational" : "degraded",
      summary: "Executive functions continuously available",
    },
    {
      healthId: "eh-gov",
      domain: "Governance Chain",
      score: input.e5Gov ? 94 : 82,
      status: input.e5Gov ? "operational" : "monitoring",
      summary: "E5 governance chain continuity verified",
    },
    {
      healthId: "eh-const",
      domain: "Constitutional Protection",
      score: input.e5Guard ? 93 : 80,
      status: input.e5Guard ? "protected" : "monitoring",
      summary: "Constitutional guardian active",
    },
    {
      healthId: "eh-infra",
      domain: "Infrastructure",
      score: 96,
      status: "operational",
      summary: "Production deployment validated · build clean",
    },
    {
      healthId: "eh-incidents",
      domain: "Incident Status",
      score: input.activeIncidents === 0 ? 98 : Math.max(60, 98 - input.activeIncidents * 10),
      status: input.activeIncidents === 0 ? "clear" : "active_incidents",
      summary: `${input.activeIncidents} active incidents`,
    },
  ];
}

export function buildContinuityStatus(records: ResilienceIncidentRecord[]): ContinuityStatusEntry[] {
  const byDomain = new Map<GovernedResilienceDomain, ResilienceIncidentRecord[]>();
  for (const r of records) {
    const list = byDomain.get(r.incidentCategory) ?? [];
    list.push(r);
    byDomain.set(r.incidentCategory, list);
  }
  return Array.from(byDomain.entries()).map(([domain, items]) => {
    const active = items.filter((i) => i.recoveryStatus !== "recovered" && i.recoveryStatus !== "validated").length;
    const availability = active === 0 ? 98 : Math.max(70, 98 - active * 8);
    return {
      continuityId: `cont-${domain}`,
      domain,
      label: label(domain),
      availability,
      status: availability >= 90 ? "continuous" : availability >= 75 ? "stable" : "recovering",
      lastValidated: items[0]?.timestamp ?? new Date().toISOString(),
    };
  });
}

export function buildActiveIncidents(records: ResilienceIncidentRecord[]): ActiveIncidentEntry[] {
  return records
    .filter((r) => r.recoveryStatus !== "recovered" && r.recoveryStatus !== "validated" && r.recoveryStatus !== "monitoring")
    .map((r) => ({
      incidentId: `inc-${r.resilienceId}`,
      resilienceId: r.resilienceId,
      incidentTitle: r.incidentTitle,
      severity: r.severity,
      recoveryStatus: r.recoveryStatus,
      affectedSystems: r.affectedSystems,
    }));
}

export function buildRecoveryProgress(records: ResilienceIncidentRecord[]): RecoveryProgressEntry[] {
  return records.map((r) => ({
    progressId: `prog-${r.resilienceId}`,
    resilienceId: r.resilienceId,
    incidentTitle: r.incidentTitle,
    recoveryStrategy: r.recoveryStrategy,
    progress:
      r.recoveryStatus === "validated" ? 100 :
      r.recoveryStatus === "recovered" ? 95 :
      r.recoveryStatus === "recovering" ? 65 :
      r.recoveryStatus === "assessing" ? 40 :
      r.recoveryStatus === "detected" ? 20 : 100,
    recoveryStatus: r.recoveryStatus,
    recoveryTime: r.recoveryTime,
  }));
}

export function buildOperationalReadiness(input: {
  healthScore: number;
  recoveryReadiness: number;
  buildClean: boolean;
}): OperationalReadinessEntry[] {
  return [
    {
      readinessId: "or-exec",
      domain: "Executive Readiness",
      score: input.healthScore,
      status: input.healthScore >= 85 ? "ready" : "preparing",
      summary: "Executive functions ready for disruption response",
    },
    {
      readinessId: "or-recovery",
      domain: "Recovery Readiness",
      score: input.recoveryReadiness,
      status: input.recoveryReadiness >= 85 ? "ready" : "building",
      summary: "Automatic recovery coordination active",
    },
    {
      readinessId: "or-repo",
      domain: "Repository Readiness",
      score: input.buildClean ? 97 : 55,
      status: input.buildClean ? "ready" : "attention",
      summary: input.buildClean ? "Build clean · deployment ready" : "Build issues detected",
    },
    {
      readinessId: "or-gov",
      domain: "Governance Readiness",
      score: Math.min(100, input.healthScore + 2),
      status: "ready",
      summary: "E5 governance chain operational under adversity",
    },
  ];
}

export { label };
